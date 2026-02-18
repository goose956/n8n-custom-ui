import { Logger } from '@nestjs/common';
import { GeneratedFile } from './programmer-agent.service';

/**
 * Interface for AI + codebase operations that the retry engine needs.
 * The main service implements this so we don't have circular deps.
 */
export interface RetryEngineContext {
  callAI(modelId: string, systemPrompt: string, userPrompt: string, history?: { role: string; content: string }[]): Promise<{ content: string; tokensUsed: number }>;
  readFileFromDisk(filePath: string): string | null;
  searchCodebase(query: string, options?: { includePattern?: string; isRegex?: boolean; maxResults?: number }): { matches: { file: string; line: number; text: string }[]; totalMatches: number };
  cleanCodeResponse(content: string): string;
  parseFiles(content: string): GeneratedFile[];
  toPascalCase(str: string): string;
  getDesignSystemContext(): string;
}

/**
 * Diagnostic retry system — escalating problem-solving loop.
 * Extracted from ProgrammerAgentService for maintainability.
 *
 * Three strategies, tried in order:
 *  1. Retry with full error context + original file content
 *  2. Diagnose root cause via AI, search codebase for patterns, then fix
 *  3. Decompose into smaller sub-steps and execute each independently
 */
export class RetryEngine {
  private readonly logger = new Logger('RetryEngine');

  constructor(private readonly ctx: RetryEngineContext) {}

  /**
   * Orchestrates up to 3 retry strategies when a step fails.
   */
  async diagnosticRetry(
    step: any,
    originalError: string,
    modelId: string,
    existingFiles: GeneratedFile[],
    generatedFiles: GeneratedFile[],
    modifiedFiles: GeneratedFile[],
    webContext: string,
    fileContext: string,
    sendEvent: (event: string, data: any) => void,
    appContext: string,
  ): Promise<{ success: boolean; files: GeneratedFile[]; detail: string; tokensUsed: number }> {
    const failureLog: string[] = [];
    let totalTokens = 0;
    const maxStrategies = 3;

    for (let strategy = 1; strategy <= maxStrategies; strategy++) {
      const strategyLabel = strategy === 1 ? 'contextual retry' : strategy === 2 ? 'diagnostic analysis' : 'decompose & conquer';
      sendEvent('progress', { message: `🔄 Strategy ${strategy}/${maxStrategies}: ${strategyLabel} for "${step.title}"...` });

      try {
        if (strategy === 1) {
          const result = await this.retryWithFullContext(step, originalError, modelId, existingFiles, webContext, fileContext, appContext);
          totalTokens += result.tokensUsed;
          if (result.success) {
            return { success: true, files: result.files, detail: `Succeeded on contextual retry (strategy 1)`, tokensUsed: totalTokens };
          }
          failureLog.push(`Strategy 1 (contextual retry): ${result.error}`);
        } else if (strategy === 2) {
          const result = await this.diagnoseAndFix(step, originalError, failureLog, modelId, existingFiles, generatedFiles, webContext, appContext, sendEvent);
          totalTokens += result.tokensUsed;
          if (result.success) {
            return { success: true, files: result.files, detail: `Succeeded via diagnostic analysis (strategy 2)`, tokensUsed: totalTokens };
          }
          failureLog.push(`Strategy 2 (diagnostic): ${result.error}`);
        } else if (strategy === 3) {
          const result = await this.decomposeAndExecute(step, originalError, failureLog, modelId, existingFiles, generatedFiles, modifiedFiles, webContext, fileContext, appContext, sendEvent);
          totalTokens += result.tokensUsed;
          if (result.success) {
            return { success: true, files: result.files, detail: `Succeeded by decomposing into sub-steps (strategy 3)`, tokensUsed: totalTokens };
          }
          failureLog.push(`Strategy 3 (decompose): ${result.error}`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        failureLog.push(`Strategy ${strategy} threw: ${errMsg}`);
        this.logger.warn(`Retry strategy ${strategy} threw: ${errMsg}`);
      }
    }

    return {
      success: false,
      files: [],
      detail: `All ${maxStrategies} retry strategies failed:\n${failureLog.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}`,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Strategy 1: Retry with full error context, original file content, and clear instructions.
   */
  private async retryWithFullContext(
    step: any,
    originalError: string,
    modelId: string,
    existingFiles: GeneratedFile[],
    webContext: string,
    fileContext: string,
    appContext: string,
  ): Promise<{ success: boolean; files: GeneratedFile[]; error: string; tokensUsed: number }> {
    let targetFileContent = '';
    const targetPath = step.targetFile || step.newFilePath;
    if (targetPath) {
      const existing = existingFiles.find(f => f.path === targetPath);
      if (existing) {
        targetFileContent = existing.content.slice(0, 8000);
      } else {
        const diskContent = this.ctx.readFileFromDisk(targetPath);
        if (diskContent) targetFileContent = diskContent.slice(0, 8000);
      }
    }

    const retryPrompt = `You are an expert coder retrying a failed operation. The PREVIOUS attempt FAILED.

## What failed:
- Step: "${step.title}"
- Task: ${step.detail}
- Error: ${originalError}

## Root cause analysis:
Analyze the error message above carefully. Common issues:
- Wrong import paths (use relative paths, check existing file structure)
- Missing type definitions (check what types already exist)
- Incorrect API patterns (use the API config object, not string URLs)
- File not found (verify path, check directory listing)
- Syntax errors in generated code

${targetFileContent ? `## Current file content (${targetPath}):\n\`\`\`typescript\n${targetFileContent}\n\`\`\`\n` : ''}
${webContext ? `## Web context:\n${webContext}\n` : ''}
${fileContext ? `## Project context:\n${fileContext.slice(0, 4000)}\n` : ''}

## Instructions:
1. Analyze WHY the previous attempt failed
2. Fix the root cause
3. Generate the COMPLETE corrected code
4. Do NOT repeat the same mistake

Return ONLY the complete code. No explanation, no markdown fences.`;

    const result = await this.ctx.callAI(modelId, `Expert debugger fixing a failed step. ${this.ctx.getDesignSystemContext()}. ${appContext}`, retryPrompt);
    const tokensUsed = result.tokensUsed || 0;
    const clean = this.ctx.cleanCodeResponse(result.content);

    if (clean.length > 50) {
      const files = this.ctx.parseFiles(result.content);
      if (files.length > 0) {
        return { success: true, files, error: '', tokensUsed };
      }
      return {
        success: true,
        files: [{
          path: targetPath || `frontend/src/components/${this.ctx.toPascalCase(step.title)}.tsx`,
          content: clean,
          language: 'typescript',
          description: `Retry fix: ${step.detail}`,
        }],
        error: '',
        tokensUsed,
      };
    }
    return { success: false, files: [], error: 'AI returned insufficient content on retry', tokensUsed };
  }

  /**
   * Strategy 2: Diagnose root cause, search codebase for related patterns, then fix.
   */
  private async diagnoseAndFix(
    step: any,
    originalError: string,
    previousFailures: string[],
    modelId: string,
    existingFiles: GeneratedFile[],
    generatedFiles: GeneratedFile[],
    webContext: string,
    appContext: string,
    sendEvent: (event: string, data: any) => void,
  ): Promise<{ success: boolean; files: GeneratedFile[]; error: string; tokensUsed: number }> {
    let tokensUsed = 0;

    // Step A: Ask AI to diagnose root cause and suggest searches
    const diagPrompt = `A coding step failed. Analyze the error and tell me exactly what information I need to search for in the codebase to fix it.

## Failed step: "${step.title}"
## Task: ${step.detail}
## Error: ${originalError}
## Previous retry failures:
${previousFailures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Return a JSON object:
{
  "rootCause": "One sentence explaining the root cause",
  "searchQueries": ["query1", "query2", "query3"],
  "filesToRead": ["path/to/relevant/file1", "path/to/relevant/file2"],
  "fixApproach": "Description of how to fix it once we have the needed context"
}

Return ONLY the JSON. No markdown fences.`;

    const diagResult = await this.ctx.callAI(modelId, 'Expert debugger analyzing a failure. Return only JSON.', diagPrompt);
    tokensUsed += diagResult.tokensUsed || 0;

    let diagnosis: any;
    try {
      const jsonMatch = diagResult.content.match(/\{[\s\S]*\}/);
      diagnosis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      diagnosis = null;
    }

    if (!diagnosis) {
      return { success: false, files: [], error: 'Could not parse diagnostic analysis', tokensUsed };
    }

    sendEvent('progress', { message: `🔍 Root cause: ${diagnosis.rootCause}` });

    // Step B: Search codebase for the suggested queries
    let diagnosticContext = '';

    if (diagnosis.searchQueries && Array.isArray(diagnosis.searchQueries)) {
      for (const query of diagnosis.searchQueries.slice(0, 3)) {
        try {
          const searchResult = this.ctx.searchCodebase(query, { maxResults: 10 });
          if (searchResult.matches.length > 0) {
            const formatted = searchResult.matches.slice(0, 8).map(r => `${r.file}:${r.line}: ${r.text}`).join('\n');
            diagnosticContext += `\nSearch "${query}":\n${formatted}\n`;
          }
        } catch {
          this.logger.debug(`Search failed for query: ${query}`);
        }
      }
    }

    // Step C: Read the suggested files
    if (diagnosis.filesToRead && Array.isArray(diagnosis.filesToRead)) {
      for (const filePath of diagnosis.filesToRead.slice(0, 4)) {
        if (!existingFiles.find(f => f.path === filePath)) {
          const content = this.ctx.readFileFromDisk(filePath);
          if (content) {
            diagnosticContext += `\nFile ${filePath}:\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\`\n`;
            existingFiles.push({ path: filePath, content, language: 'typescript', description: `Read for diagnostic` });
          }
        } else {
          const existing = existingFiles.find(f => f.path === filePath);
          if (existing) {
            diagnosticContext += `\nFile ${filePath}:\n\`\`\`\n${existing.content.slice(0, 4000)}\n\`\`\`\n`;
          }
        }
      }
    }

    // Step D: Fix with full diagnostic context
    sendEvent('progress', { message: `🔧 Applying fix based on diagnostic analysis...` });

    const fixPrompt = `You are fixing a failed coding step. You now have full diagnostic context.

## Failed step: "${step.title}"
## Task: ${step.detail}
## Error: ${originalError}
## Root cause: ${diagnosis.rootCause}
## Fix approach: ${diagnosis.fixApproach}

## Diagnostic context from codebase:
${diagnosticContext || '(no additional context found)'}

## Already-generated files in this session:
${generatedFiles.map(f => `- ${f.path}`).join('\n') || '(none)'}

${webContext ? `## Web context:\n${webContext}\n` : ''}

## Instructions:
- Use the diagnostic context to write CORRECT code that matches existing patterns
- Import types/functions from the EXACT paths shown in the search results
- Match the coding style of existing files
- Generate COMPLETE file(s) -- no stubs, no placeholders

Return the complete corrected code. No explanation.`;

    const fixResult = await this.ctx.callAI(modelId, `Expert coder with diagnostic context. ${this.ctx.getDesignSystemContext()}. ${appContext}`, fixPrompt);
    tokensUsed += fixResult.tokensUsed || 0;
    const clean = this.ctx.cleanCodeResponse(fixResult.content);

    if (clean.length > 50) {
      const files = this.ctx.parseFiles(fixResult.content);
      if (files.length > 0) {
        return { success: true, files, error: '', tokensUsed };
      }
      const targetPath = step.targetFile || step.newFilePath;
      return {
        success: true,
        files: [{
          path: targetPath || `frontend/src/components/${this.ctx.toPascalCase(step.title)}.tsx`,
          content: clean,
          language: 'typescript',
          description: `Diagnostic fix: ${step.detail}`,
        }],
        error: '',
        tokensUsed,
      };
    }
    return { success: false, files: [], error: `Diagnostic fix produced insufficient output. Root cause: ${diagnosis.rootCause}`, tokensUsed };
  }

  /**
   * Strategy 3: Break a failed step into smaller sub-steps and execute each independently.
   */
  private async decomposeAndExecute(
    step: any,
    originalError: string,
    previousFailures: string[],
    modelId: string,
    existingFiles: GeneratedFile[],
    generatedFiles: GeneratedFile[],
    modifiedFiles: GeneratedFile[],
    webContext: string,
    fileContext: string,
    appContext: string,
    sendEvent: (event: string, data: any) => void,
  ): Promise<{ success: boolean; files: GeneratedFile[]; error: string; tokensUsed: number }> {
    let tokensUsed = 0;

    const decomposePrompt = `A coding step failed multiple times. Break it into smaller, independent sub-tasks that are each simple enough to succeed.

## Failed step: "${step.title}"
## Task: ${step.detail}
## Original error: ${originalError}
## What already failed:
${previousFailures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Break this into 2-4 smaller sub-tasks. Each sub-task should:
- Be independently executable
- Produce one complete file
- Be simple enough that it's unlikely to fail
- Together they accomplish the original task

Return a JSON array:
[
  {
    "title": "Sub-task title",
    "detail": "Detailed description of what to generate",
    "filePath": "path/to/output/file",
    "dependencies": "What this sub-task needs from other sub-tasks (if any)"
  }
]

Return ONLY the JSON array. No markdown fences.`;

    const decomposeResult = await this.ctx.callAI(modelId, 'Expert task decomposer. Break complex tasks into simple sub-tasks. Return only JSON.', decomposePrompt);
    tokensUsed += decomposeResult.tokensUsed || 0;

    let subTasks: any[] | null;
    try {
      const jsonMatch = decomposeResult.content.match(/\[[\s\S]*\]/);
      subTasks = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      subTasks = null;
    }

    if (!subTasks || !Array.isArray(subTasks) || subTasks.length === 0) {
      return { success: false, files: [], error: 'Could not decompose step into sub-tasks', tokensUsed };
    }

    sendEvent('progress', { message: `📦 Decomposed into ${subTasks.length} sub-tasks...` });

    const allFiles: GeneratedFile[] = [];
    const subTaskResults: string[] = [];

    for (let i = 0; i < subTasks.length; i++) {
      const sub = subTasks[i];
      sendEvent('progress', { message: `  📝 Sub-task ${i + 1}/${subTasks.length}: ${sub.title}...` });

      const priorSubFiles = allFiles.map(f => `## ${f.path}:\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``).join('\n');

      const subPrompt = `Generate code for this specific sub-task. This is part of a larger task that was decomposed for reliability.

## Sub-task: ${sub.title}
## Detail: ${sub.detail}
## Output file: ${sub.filePath}
${sub.dependencies ? `## Dependencies: ${sub.dependencies}` : ''}

${priorSubFiles ? `## Previously generated files (for imports/types):\n${priorSubFiles}\n` : ''}
${fileContext ? `## Project context:\n${fileContext.slice(0, 3000)}\n` : ''}
${webContext ? `## Web context:\n${webContext}\n` : ''}

Generate the COMPLETE file content. Match existing project patterns. No placeholders, no stubs.
Return ONLY the code. No explanation, no markdown fences.`;

      try {
        const subResult = await this.ctx.callAI(modelId, `Expert coder executing a focused sub-task. ${this.ctx.getDesignSystemContext()}. ${appContext}`, subPrompt);
        tokensUsed += subResult.tokensUsed || 0;
        const clean = this.ctx.cleanCodeResponse(subResult.content);

        if (clean.length > 50) {
          const files = this.ctx.parseFiles(subResult.content);
          if (files.length > 0) {
            allFiles.push(...files);
          } else {
            allFiles.push({
              path: sub.filePath || `frontend/src/components/${this.ctx.toPascalCase(sub.title)}.tsx`,
              content: clean,
              language: 'typescript',
              description: `Sub-task: ${sub.title}`,
            });
          }
          subTaskResults.push(`Sub-task ${i + 1} "${sub.title}": succeeded`);
        } else {
          subTaskResults.push(`Sub-task ${i + 1} "${sub.title}": produced insufficient output`);
        }
      } catch (err) {
        subTaskResults.push(`Sub-task ${i + 1} "${sub.title}": threw ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (allFiles.length > 0) {
      return { success: true, files: allFiles, error: '', tokensUsed };
    }

    return {
      success: false,
      files: [],
      error: `Decomposition produced no files: ${subTaskResults.join('; ')}`,
      tokensUsed,
    };
  }

  /**
   * Re-plan remaining steps after failures. Called when 2+ steps have failed.
   */
  async rePlanRemainingSteps(
    failedSteps: { title: string; error: string }[],
    completedSteps: { title: string; detail: string }[],
    remainingSteps: any[],
    originalMessage: string,
    modelId: string,
    existingFiles: GeneratedFile[],
    generatedFiles: GeneratedFile[],
    appContext: string,
  ): Promise<{ success: boolean; revisedSteps: any[]; tokensUsed: number }> {
    const rePlanPrompt = `You are revising an execution plan because multiple steps have failed. Analyze what went wrong and create a BETTER plan for the remaining work.

## Original request: ${originalMessage}

## What succeeded:
${completedSteps.map((s, i) => `${i + 1}. ✅ ${s.title}: ${s.detail}`).join('\n') || '(nothing yet)'}

## What failed:
${failedSteps.map((s, i) => `${i + 1}. ❌ ${s.title}: ${s.error}`).join('\n')}

## What was planned but not yet attempted:
${remainingSteps.map((s: any, i: number) => `${i + 1}. ${s.title}: ${s.detail}`).join('\n') || '(nothing)'}

## Files already generated:
${generatedFiles.map(f => `- ${f.path}`).join('\n') || '(none)'}

## Existing project files:
${existingFiles.map(f => f.path).join(', ')}

## Instructions:
- Learn from the failures -- don't repeat the same approaches
- Keep what worked, fix or replace what failed
- Add search_codebase steps before modify_file steps to prevent hallucinating file contents
- Simplify complex steps into smaller ones
- Consider alternative approaches

Return a JSON array of revised steps (same format as the original plan steps). Include steps to fix/replace the failed ones AND any remaining steps.
Return ONLY the JSON array. No markdown fences.`;

    const result = await this.ctx.callAI(modelId, 'Expert planner revising failed execution plan. Return only JSON.', rePlanPrompt);
    const tokensUsed = result.tokensUsed || 0;

    try {
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      const revisedSteps = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (revisedSteps && Array.isArray(revisedSteps) && revisedSteps.length > 0) {
        const startId = (completedSteps.length + failedSteps.length + 1);
        revisedSteps.forEach((s: any, i: number) => { s.id = startId + i; });
        return { success: true, revisedSteps, tokensUsed };
      }
    } catch {
      this.logger.warn('Failed to parse re-plan JSON response');
    }

    return { success: false, revisedSteps: [], tokensUsed };
  }
}
