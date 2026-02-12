import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  agent: 'orchestrator' | 'sub-agent';
  status: 'pending' | 'running' | 'complete' | 'failed';
  model?: string;
}

interface GenerateRequest {
  prompt: string;
  targetType?: 'page' | 'component' | 'feature' | 'full-stack';
  appId?: number;
  orchestratorModel?: string;
  subAgentModel?: string;
  conversationHistory?: { role: string; content: string }[];
}

export interface GenerateResponse {
  success: boolean;
  plan: PlanStep[];
  files: GeneratedFile[];
  summary: string;
  tokensUsed: { orchestrator: number; subAgent: number; total: number };
  modelsUsed: { orchestrator: string; subAgent: string };
  error?: string;
}

interface RefineRequest {
  instruction: string;
  files: GeneratedFile[];
  fileIndex: number;
  model?: string;
}

interface SubTaskRequest {
  task: 'types' | 'styles' | 'utils' | 'docs' | 'review' | 'test';
  context: string;
  model?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'openrouter';
  tier: 'orchestrator' | 'sub-agent' | 'both';
  costPer1kTokens: number;
}

// ─── Model registry ────────────────────────────────────────────────────────────

const MODELS: ModelConfig[] = [
  // Orchestrator-tier (expensive, high quality)
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', tier: 'orchestrator', costPer1kTokens: 0.075 },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', tier: 'both', costPer1kTokens: 0.015 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'both', costPer1kTokens: 0.01 },
  // Sub-agent tier (cheap, fast)
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', tier: 'sub-agent', costPer1kTokens: 0.00125 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'sub-agent', costPer1kTokens: 0.00075 },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'both', costPer1kTokens: 0.015 },
];

const DEFAULT_ORCHESTRATOR = 'claude-sonnet-4-20250514';
const DEFAULT_SUB_AGENT = 'claude-3-haiku-20240307';

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgrammerAgentService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  // ─── API key helper ────────────────────────────────────────────────────────

  private getApiKey(provider: string): string | null {
    try {
      if (!this.db.exists()) return null;
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find(
        (k: any) => k.name.toLowerCase() === provider.toLowerCase(),
      );
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch {
      return null;
    }
  }

  private getModelConfig(modelId: string): ModelConfig | undefined {
    return MODELS.find((m) => m.id === modelId);
  }

  // ─── AI call routing ──────────────────────────────────────────────────────

  private async callAI(
    modelId: string,
    systemPrompt: string,
    userPrompt: string,
    history: { role: string; content: string }[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    const model = this.getModelConfig(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    if (model.provider === 'anthropic') {
      return this.callAnthropic(modelId, systemPrompt, userPrompt, history);
    } else if (model.provider === 'openai') {
      return this.callOpenAI(modelId, systemPrompt, userPrompt, history);
    }

    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  private async callAnthropic(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    history: { role: string; content: string }[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = this.getApiKey('anthropic');
    if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings → API Keys.');

    const messages = [
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userPrompt },
    ];

    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      },
    );

    const content = res.data.content?.[0]?.text || '';
    const tokensUsed = (res.data.usage?.input_tokens || 0) + (res.data.usage?.output_tokens || 0);
    return { content, tokensUsed };
  }

  private async callOpenAI(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    history: { role: string; content: string }[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = this.getApiKey('openai');
    if (!apiKey) throw new Error('OpenAI API key not configured. Add it in Settings → API Keys.');

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userPrompt },
    ];

    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages, max_tokens: 8192 },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      },
    );

    const content = res.data.choices?.[0]?.message?.content || '';
    const tokensUsed = res.data.usage?.total_tokens || 0;
    return { content, tokensUsed };
  }

  // ─── Design system context ────────────────────────────────────────────────

  private getDesignSystemContext(): string {
    return `
DESIGN SYSTEM RULES (must follow exactly):
- Framework: React 18 with TypeScript
- UI Library: Material-UI 5 (@mui/material)
- Import pattern: import { Box, Typography, ... } from '@mui/material';
- Import icons: import { IconName } from '@mui/icons-material';
- Colors: primary=#667eea, secondary=#764ba2, dark=#1a1a2e, bg=#fafbfc
- Gradients: background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
- Font: Inter (via theme)
- Border radius: 2-3 for small, 12-16 for cards (theme default is 12)
- Shadows: boxShadow: 'none' with border: '1px solid rgba(0,0,0,0.06)' for cards
- Use sx prop for all styling, never CSS files
- Export components as named exports: export function ComponentName()
- Use functional components with hooks
- State: useState, useEffect, useCallback, useMemo
- API calls: use fetch() with the pattern: const res = await fetch(url); const data = await res.json();
- API base: import { API } from '../config/api'; (already configured)
- Snackbar pattern for notifications
- Dialog pattern for modals
- Always include proper TypeScript types/interfaces
- Responsive: use MUI's Grid or Box with display: 'grid' / 'flex'
`.trim();
  }

  private getAppContext(appId?: number): string {
    if (!appId) return '';
    try {
      const data = this.db.readSync();
      const app = (data.apps || []).find((a: any) => a.id === appId);
      if (!app) return '';

      // Gather existing pages for this app so the AI can match their style
      const appPages = (data.pages || []).filter((p: any) => p.app_id === appId);
      const pagesSummary = appPages.map((p: any) => {
        const css = p.custom_css ? `\n    Custom CSS: ${p.custom_css.slice(0, 300)}` : '';
        const colors = this.extractColorsFromContent(p.content_json);
        const colorInfo = colors.length > 0 ? `\n    Colors used: ${colors.join(', ')}` : '';
        return `  - ${p.title} (${p.page_type})${colorInfo}${css}`;
      }).join('\n');

      // Look for app-level settings (branding, theme)
      const appSettings = (data.settings || []).filter((s: any) => s.app_id === appId);
      const brandSettings = appSettings.map((s: any) => `  - ${s.key}: ${JSON.stringify(s.value).slice(0, 200)}`).join('\n');

      const primaryColor = app.primary_color || '#667eea';

      return `
APP CONTEXT — You MUST match this app's existing visual style:
- App name: ${app.name}
- App slug: ${app.slug}
- Primary color: ${primaryColor}
- Description: ${app.description || 'No description'}

COLOR SCHEME (override default design system colors with these):
- Primary: ${primaryColor}
- Use this primary color for buttons, links, accents, gradients, and highlights
- Derive hover/active states by darkening the primary color by 10-15%
- Keep dark nav (#1a1a2e) and light bg (#fafbfc) unchanged
- Gradient: use "linear-gradient(135deg, ${primaryColor} 0%, ${this.deriveSecondary(primaryColor)} 100%)"

${appPages.length > 0 ? `EXISTING PAGES (match their style conventions):\n${pagesSummary}` : 'No existing pages yet — establish the visual style using the primary color above.'}
${brandSettings ? `\nAPP SETTINGS:\n${brandSettings}` : ''}

STYLE CONSISTENCY RULES:
- Typography, spacing, border-radius, and card patterns must match existing pages
- Use the app's primary color instead of the default #667eea everywhere
- If existing pages use specific icon styles, section layouts, or component patterns, reuse them
- The new page should look like it belongs in the same app as the existing pages
`;
    } catch {
      return '';
    }
  }

  /** Extract hex colors from content_json recursively */
  private extractColorsFromContent(obj: any, found: Set<string> = new Set()): string[] {
    if (!obj || typeof obj !== 'object') return [];
    const hexPattern = /#[0-9a-fA-F]{6}/g;
    const json = JSON.stringify(obj);
    const matches = json.match(hexPattern);
    if (matches) matches.forEach(c => found.add(c.toLowerCase()));
    return Array.from(found).slice(0, 12); // cap at 12 unique colors
  }

  /** Derive a complementary secondary color from a primary hex */
  private deriveSecondary(hex: string): string {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      // Shift hue by ~40 degrees and adjust saturation
      const nr = Math.min(255, Math.max(0, Math.round(r * 0.7 + b * 0.3)));
      const ng = Math.min(255, Math.max(0, Math.round(g * 0.6)));
      const nb = Math.min(255, Math.max(0, Math.round(b * 0.8 + r * 0.2)));
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    } catch {
      return '#764ba2';
    }
  }

  // ─── Main generate flow ───────────────────────────────────────────────────

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const orchestratorModel = request.orchestratorModel || DEFAULT_ORCHESTRATOR;
    const subAgentModel = request.subAgentModel || DEFAULT_SUB_AGENT;

    let totalOrchestratorTokens = 0;
    let totalSubAgentTokens = 0;

    try {
      // Step 1: Orchestrator creates the architecture plan
      const planPrompt = this.buildPlanPrompt(request);
      const planResult = await this.callAI(
        orchestratorModel,
        this.getArchitectSystemPrompt(),
        planPrompt,
        request.conversationHistory || [],
      );
      totalOrchestratorTokens += planResult.tokensUsed;

      const plan = this.parsePlan(planResult.content);

      // Step 2: Identify sub-tasks that can go to the cheaper model
      const subTasks = plan.filter((s) => s.agent === 'sub-agent');
      const orchestratorTasks = plan.filter((s) => s.agent === 'orchestrator');

      // Step 3: Run sub-agent tasks (types, styles, simple utilities)
      const subResults: Map<number, string> = new Map();
      for (const task of subTasks) {
        try {
          task.status = 'running';
          const result = await this.callAI(
            subAgentModel,
            this.getSubAgentSystemPrompt(task.title),
            `${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}\n\nOriginal request: ${request.prompt}\n\nYour specific task: ${task.description}\n\nGenerate ONLY the code. No explanations, no markdown fences. Just the raw code.`,
          );
          subResults.set(task.id, result.content);
          totalSubAgentTokens += result.tokensUsed;
          task.status = 'complete';
        } catch (err) {
          task.status = 'failed';
        }
      }

      // Step 4: Orchestrator generates the main code, incorporating sub-agent outputs
      const subContext = Array.from(subResults.entries())
        .map(([id, content]) => {
          const task = plan.find((s) => s.id === id);
          return `--- Sub-agent output for "${task?.title}" ---\n${content}\n--- End ---`;
        })
        .join('\n\n');

      const mainPrompt = this.buildMainCodePrompt(request, subContext);
      const mainResult = await this.callAI(
        orchestratorModel,
        this.getCodeGenSystemPrompt(),
        mainPrompt,
        request.conversationHistory || [],
      );
      totalOrchestratorTokens += mainResult.tokensUsed;

      // Step 5: Parse files from the response
      const files = this.parseFiles(mainResult.content);

      // Mark orchestrator tasks as complete
      orchestratorTasks.forEach((t) => (t.status = 'complete'));

      // Step 6: Record stats
      this.recordUsage(orchestratorModel, subAgentModel, totalOrchestratorTokens, totalSubAgentTokens);

      return {
        success: true,
        plan,
        files,
        summary: this.extractSummary(mainResult.content),
        tokensUsed: {
          orchestrator: totalOrchestratorTokens,
          subAgent: totalSubAgentTokens,
          total: totalOrchestratorTokens + totalSubAgentTokens,
        },
        modelsUsed: { orchestrator: orchestratorModel, subAgent: subAgentModel },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        plan: [],
        files: [],
        summary: '',
        tokensUsed: {
          orchestrator: totalOrchestratorTokens,
          subAgent: totalSubAgentTokens,
          total: totalOrchestratorTokens + totalSubAgentTokens,
        },
        modelsUsed: { orchestrator: orchestratorModel, subAgent: subAgentModel },
        error: message,
      };
    }
  }

  // ─── Refine a single file ────────────────────────────────────────────────

  async refineFile(request: RefineRequest): Promise<{ success: boolean; file: GeneratedFile | null; tokensUsed: number; error?: string }> {
    const model = request.model || DEFAULT_ORCHESTRATOR;
    try {
      const targetFile = request.files[request.fileIndex];
      if (!targetFile) {
        return { success: false, file: null, tokensUsed: 0, error: 'File index out of range' };
      }

      const allFilesContext = request.files
        .map((f, i) => `--- ${f.path} ${i === request.fileIndex ? '(TARGET FILE — modify this one)' : ''} ---\n${f.content}\n--- End ---`)
        .join('\n\n');

      const prompt = `Here are the current generated files:\n\n${allFilesContext}\n\nInstruction for the TARGET file (${targetFile.path}):\n${request.instruction}\n\nReturn ONLY the complete updated file content. No markdown fences, no explanation. Just the raw code.`;

      const result = await this.callAI(
        model,
        `You are an expert React/TypeScript developer. You are modifying an existing file based on instructions. ${this.getDesignSystemContext()}\n\nReturn ONLY the complete updated file content.`,
        prompt,
      );

      const updatedContent = result.content
        .replace(/^```(?:tsx?|typescript|javascript)?\n?/m, '')
        .replace(/\n?```$/m, '')
        .trim();

      return {
        success: true,
        file: {
          ...targetFile,
          content: updatedContent,
        },
        tokensUsed: result.tokensUsed,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, file: null, tokensUsed: 0, error: message };
    }
  }

  // ─── Sub-task (cheap model) ──────────────────────────────────────────────

  async runSubTask(request: SubTaskRequest): Promise<{ success: boolean; result: string; tokensUsed: number; error?: string }> {
    const model = request.model || DEFAULT_SUB_AGENT;
    const prompts: Record<string, { system: string; user: string }> = {
      types: {
        system: 'You are a TypeScript type generation expert. Generate clean, well-documented TypeScript interfaces and types. Return only the code.',
        user: `Generate TypeScript types/interfaces for:\n${request.context}`,
      },
      styles: {
        system: `You are a Material-UI styling expert. Generate sx prop objects and MUI theme customizations. ${this.getDesignSystemContext()}\nReturn only the code.`,
        user: `Generate MUI styles for:\n${request.context}`,
      },
      utils: {
        system: 'You are a utility function expert. Generate clean, well-typed TypeScript utility functions. Return only the code.',
        user: `Generate utility functions for:\n${request.context}`,
      },
      docs: {
        system: 'You are a documentation expert. Generate clear JSDoc comments and README content.',
        user: `Generate documentation for:\n${request.context}`,
      },
      review: {
        system: 'You are a senior code reviewer. Find bugs, security issues, performance problems, and suggest improvements. Be specific and constructive.',
        user: `Review this code and provide actionable feedback:\n${request.context}`,
      },
      test: {
        system: 'You are a testing expert. Generate unit tests using Jest and React Testing Library. Return only the test code.',
        user: `Generate tests for:\n${request.context}`,
      },
    };

    const taskPrompt = prompts[request.task];
    if (!taskPrompt) {
      return { success: false, result: '', tokensUsed: 0, error: `Unknown task type: ${request.task}` };
    }

    try {
      const aiResult = await this.callAI(model, taskPrompt.system, taskPrompt.user);
      return { success: true, result: aiResult.content, tokensUsed: aiResult.tokensUsed };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, result: '', tokensUsed: 0, error: message };
    }
  }

  // ─── Save files to disk ──────────────────────────────────────────────────

  async saveFiles(files: { path: string; content: string }[]): Promise<{ success: boolean; saved: string[]; errors: string[] }> {
    const saved: string[] = [];
    const errors: string[] = [];
    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    for (const file of files) {
      try {
        // Sanitize path — must stay within project
        const filePath = path.resolve(projectRoot, file.path);
        if (!filePath.startsWith(projectRoot)) {
          errors.push(`${file.path}: path escapes project root`);
          continue;
        }

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, file.content, 'utf-8');
        saved.push(file.path);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${file.path}: ${message}`);
      }
    }

    return { success: errors.length === 0, saved, errors };
  }

  // ─── Models & Stats ──────────────────────────────────────────────────────

  getAvailableModels() {
    // Check which API keys are configured
    const hasAnthropic = !!this.getApiKey('anthropic');
    const hasOpenAI = !!this.getApiKey('openai');

    const available = MODELS.filter((m) => {
      if (m.provider === 'anthropic') return hasAnthropic;
      if (m.provider === 'openai') return hasOpenAI;
      return false;
    });

    return {
      success: true,
      models: available,
      configured: { anthropic: hasAnthropic, openai: hasOpenAI },
      defaults: { orchestrator: DEFAULT_ORCHESTRATOR, subAgent: DEFAULT_SUB_AGENT },
    };
  }

  getStats() {
    try {
      const data = this.db.readSync();
      const stats = data.programmerAgentStats || { sessions: 0, totalTokens: 0, orchestratorTokens: 0, subAgentTokens: 0, filesGenerated: 0, history: [] };
      return { success: true, data: stats };
    } catch {
      return { success: true, data: { sessions: 0, totalTokens: 0, orchestratorTokens: 0, subAgentTokens: 0, filesGenerated: 0, history: [] } };
    }
  }

  private recordUsage(orchestratorModel: string, subAgentModel: string, orchestratorTokens: number, subAgentTokens: number) {
    try {
      const data = this.db.readSync();
      if (!data.programmerAgentStats) {
        data.programmerAgentStats = { sessions: 0, totalTokens: 0, orchestratorTokens: 0, subAgentTokens: 0, filesGenerated: 0, history: [] };
      }
      const stats = data.programmerAgentStats;
      stats.sessions += 1;
      stats.totalTokens += orchestratorTokens + subAgentTokens;
      stats.orchestratorTokens += orchestratorTokens;
      stats.subAgentTokens += subAgentTokens;
      stats.history.push({
        date: new Date().toISOString(),
        orchestratorModel,
        subAgentModel,
        orchestratorTokens,
        subAgentTokens,
      });
      // Keep last 100 history entries
      if (stats.history.length > 100) stats.history = stats.history.slice(-100);
      this.db.writeSync(data);
    } catch { /* non-critical */ }
  }

  // ─── Prompt builders ────────────────────────────────────────────────────

  private getArchitectSystemPrompt(): string {
    return `You are a senior software architect. Your job is to analyze a feature request and create a structured implementation plan.

You output a JSON array of steps. Each step has:
- id: sequential number
- title: short name for the step
- description: what needs to be done
- agent: "orchestrator" for complex code generation (React pages, state logic, API integration), or "sub-agent" for simple tasks (types, constants, simple styles, utility helpers)

RULES:
- Delegate to sub-agent: TypeScript interfaces/types, simple utility functions, constant files, style objects
- Keep on orchestrator: Full React components, complex logic, API integration, state management
- Typically 2-5 steps. Don't over-decompose.
- Output ONLY the JSON array. No explanation. No markdown fences.

Example output:
[{"id":1,"title":"TypeScript types","description":"Create interfaces for Dashboard data, ChartConfig, FilterState","agent":"sub-agent"},{"id":2,"title":"Main component","description":"Create DashboardPage with chart grid, filters, real-time data fetching","agent":"orchestrator"}]`;
  }

  private getSubAgentSystemPrompt(taskTitle: string): string {
    return `You are a fast, efficient code generator handling the "${taskTitle}" sub-task. Generate clean, well-typed TypeScript code. Return ONLY the code, no explanations, no markdown fences.`;
  }

  private getCodeGenSystemPrompt(): string {
    return `You are an expert React/TypeScript developer generating production-quality code for a SaaS management platform.

${this.getDesignSystemContext()}

OUTPUT FORMAT:
Return files in this exact format:

===FILE: relative/path/to/file.tsx===
(file content here)
===END_FILE===

===FILE: relative/path/to/another.ts===
(file content here)
===END_FILE===

After all files, add a brief summary line starting with "SUMMARY:" explaining what was built.

RULES:
- Generate complete, runnable files — no placeholders, no "// TODO", no "..."
- All imports must be correct (MUI, React, config/api)
- Use the existing API config: import { API } from '../config/api';
- Follow the design system exactly
- Include proper error handling, loading states, and empty states
- Add TypeScript types for all data structures
- Use functional components with hooks`;
  }

  private buildPlanPrompt(request: GenerateRequest): string {
    const targetInfo = request.targetType ? `Target type: ${request.targetType}` : '';
    const appContext = this.getAppContext(request.appId);
    return `Create an implementation plan for:\n\n${request.prompt}\n\n${targetInfo}\n${appContext}\n\nOutput ONLY the JSON array of steps.`;
  }

  private buildMainCodePrompt(request: GenerateRequest, subAgentOutputs: string): string {
    const appContext = this.getAppContext(request.appId);
    const subSection = subAgentOutputs
      ? `\n\nSub-agent generated code (incorporate or reference as needed):\n${subAgentOutputs}`
      : '';

    return `Generate the code for:\n\n${request.prompt}\n\n${appContext}${subSection}\n\nGenerate all necessary files using the ===FILE: path=== / ===END_FILE=== format. End with a SUMMARY: line.`;
  }

  // ─── Response parsers ────────────────────────────────────────────────────

  private parsePlan(content: string): PlanStep[] {
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((step: any) => ({
          id: step.id || 0,
          title: step.title || 'Untitled',
          description: step.description || '',
          agent: step.agent === 'sub-agent' ? 'sub-agent' : 'orchestrator',
          status: 'pending' as const,
        }));
      }
    } catch { /* fall through */ }

    // Fallback: single orchestrator step
    return [
      {
        id: 1,
        title: 'Generate code',
        description: 'Generate all code in a single pass',
        agent: 'orchestrator',
        status: 'pending',
      },
    ];
  }

  private parseFiles(content: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const filePattern = /===FILE:\s*(.+?)===\n([\s\S]*?)===END_FILE===/g;
    let match: RegExpExecArray | null;

    while ((match = filePattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      const ext = path.extname(filePath).slice(1);

      const langMap: Record<string, string> = {
        tsx: 'typescript',
        ts: 'typescript',
        jsx: 'javascript',
        js: 'javascript',
        css: 'css',
        json: 'json',
        md: 'markdown',
        sql: 'sql',
      };

      files.push({
        path: filePath,
        content: fileContent,
        language: langMap[ext] || ext,
        description: `Generated file: ${filePath}`,
      });
    }

    // If no files were found but there's code, wrap it as a single file
    if (files.length === 0 && content.trim().length > 0) {
      const cleanContent = content
        .replace(/^```(?:tsx?|typescript|javascript)?\n?/m, '')
        .replace(/\n?```$/m, '')
        .replace(/^SUMMARY:.*$/m, '')
        .trim();

      if (cleanContent) {
        files.push({
          path: 'frontend/src/components/GeneratedPage.tsx',
          content: cleanContent,
          language: 'typescript',
          description: 'Generated component',
        });
      }
    }

    return files;
  }

  private extractSummary(content: string): string {
    const summaryMatch = content.match(/SUMMARY:\s*(.+)/);
    return summaryMatch?.[1]?.trim() || 'Code generated successfully.';
  }
}
