import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  ToolDefinition,
  ToolContext,
  ToolCallLog,
  SkillDefinition,
  SkillRunResult,
  CreateToolDto,
  UpdateToolDto,
  CreateSkillDto,
  UpdateSkillDto,
  RunSkillDto,
} from './skill.types';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

const MAX_LOOP_ITERATIONS = 10;

/**
 * SkillRunnerService — Two-layer agent architecture
 *
 * TOOLS:  CRUD + execution of individual tool functions
 * SKILLS: CRUD + agentic loop execution (AI + tools in a loop)
 */
@Injectable()
export class SkillRunnerService implements OnModuleInit {
  private readonly logger = new Logger(SkillRunnerService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  // ── Seed default tool + skill on first run ────────────────────────

  async onModuleInit() {
    try {
      const data = await this.db.read();
      const hasTools = (data.agentTools || []).length > 0;
      const hasSkills = (data.agentSkills || []).length > 0;

      if (!hasTools) {
        this.logger.log('Seeding default tool: brave-search');
        await this.createTool({
          name: 'brave-search',
          description: 'Search the web using the Brave Search API. Returns titles, URLs, and descriptions.',
          parameters: [
            { name: 'query', type: 'string', description: 'The search query', required: true },
            { name: 'count', type: 'number', description: 'Number of results (default 5)', required: false },
          ],
          code: `const key = ctx.getCredential('brave');
if (!key) throw new Error('Brave API key not configured. Add it in Settings → API Keys.');

ctx.log('Searching Brave for: ' + params.query);

const count = params.count || 5;
const resp = await ctx.fetch(
  'https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(params.query) + '&count=' + count,
  {
    headers: {
      'X-Subscription-Token': key,
      'Accept': 'application/json'
    }
  }
);

if (resp.status !== 200) {
  throw new Error('Brave API error: HTTP ' + resp.status);
}

const results = (resp.body.web?.results || []).map(r => ({
  title: r.title,
  url: r.url,
  description: r.description
}));

ctx.log('Found ' + results.length + ' results');
return results;`,
        });
      }

      if (!hasSkills) {
        this.logger.log('Seeding default skill: web-research');
        await this.createSkill({
          name: 'web-research',
          description: 'Research a topic by searching the web from multiple angles and write a comprehensive article',
          prompt: `You are a thorough web research agent. Given a topic, you search the web from multiple angles and write a comprehensive article.

## Your Process
1. **Initial Search**: Search for the main topic to get a broad overview
2. **Deep Dives**: Search for 2-3 specific subtopics or angles you discover
3. **Synthesis**: Combine all findings into a well-structured article

## Output Format
Write a 500-1000 word article with:
- A clear, engaging title
- An introduction paragraph
- 3-5 sections with subheadings
- Key facts and findings from your research
- Source URLs cited inline
- A brief conclusion

## Rules
- Make at least 3 different searches before writing
- Use specific, targeted search queries (not just the raw topic)
- Always cite sources with their URLs
- Be factual, balanced, and informative
- If results are thin on a subtopic, acknowledge the limitation
- Focus on the most recent and relevant information`,
          tools: ['brave-search'],
          inputs: [
            { name: 'topic', type: 'string', description: 'The topic to research', required: true },
          ],
          credentials: ['brave'],
          tags: ['research'],
        });
      }
    } catch (err) {
      this.logger.warn('Failed to seed defaults: ' + err);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  TOOL CRUD
  // ══════════════════════════════════════════════════════════════════

  async listTools(): Promise<ToolDefinition[]> {
    const data = await this.db.read();
    return data.agentTools || [];
  }

  async getTool(id: string): Promise<ToolDefinition | null> {
    const tools = await this.listTools();
    return tools.find(t => t.id === id) || null;
  }

  async getToolByName(name: string): Promise<ToolDefinition | null> {
    const tools = await this.listTools();
    return tools.find(t => t.name === name) || null;
  }

  async createTool(dto: CreateToolDto): Promise<ToolDefinition> {
    const data = await this.db.read();
    if (!data.agentTools) data.agentTools = [];

    const tool: ToolDefinition = {
      id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: dto.name,
      description: dto.description,
      parameters: dto.parameters || [],
      code: dto.code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.agentTools.push(tool);
    await this.db.write(data);
    return tool;
  }

  async updateTool(id: string, dto: UpdateToolDto): Promise<ToolDefinition | null> {
    const data = await this.db.read();
    if (!data.agentTools) return null;

    const idx = data.agentTools.findIndex((t: ToolDefinition) => t.id === id);
    if (idx === -1) return null;

    Object.assign(data.agentTools[idx], dto, { updatedAt: new Date().toISOString() });
    await this.db.write(data);
    return data.agentTools[idx];
  }

  async deleteTool(id: string): Promise<boolean> {
    const data = await this.db.read();
    if (!data.agentTools) return false;

    const before = data.agentTools.length;
    data.agentTools = data.agentTools.filter((t: ToolDefinition) => t.id !== id);
    if (data.agentTools.length === before) return false;

    await this.db.write(data);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════
  //  SKILL CRUD
  // ══════════════════════════════════════════════════════════════════

  async listSkills(): Promise<SkillDefinition[]> {
    const data = await this.db.read();
    return data.agentSkills || [];
  }

  async getSkill(id: string): Promise<SkillDefinition | null> {
    const skills = await this.listSkills();
    return skills.find(s => s.id === id) || null;
  }

  async createSkill(dto: CreateSkillDto): Promise<SkillDefinition> {
    const data = await this.db.read();
    if (!data.agentSkills) data.agentSkills = [];

    const skill: SkillDefinition = {
      id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: dto.name,
      description: dto.description,
      prompt: dto.prompt,
      tools: dto.tools || [],
      inputs: dto.inputs || [],
      credentials: dto.credentials || [],
      enabled: true,
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.agentSkills.push(skill);
    await this.db.write(data);
    return skill;
  }

  async updateSkill(id: string, dto: UpdateSkillDto): Promise<SkillDefinition | null> {
    const data = await this.db.read();
    if (!data.agentSkills) return null;

    const idx = data.agentSkills.findIndex((s: SkillDefinition) => s.id === id);
    if (idx === -1) return null;

    Object.assign(data.agentSkills[idx], dto, { updatedAt: new Date().toISOString() });
    await this.db.write(data);
    return data.agentSkills[idx];
  }

  async deleteSkill(id: string): Promise<boolean> {
    const data = await this.db.read();
    if (!data.agentSkills) return false;

    const before = data.agentSkills.length;
    data.agentSkills = data.agentSkills.filter((s: SkillDefinition) => s.id !== id);
    if (data.agentSkills.length === before) return false;

    await this.db.write(data);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════
  //  AGENTIC LOOP — The core execution engine
  // ══════════════════════════════════════════════════════════════════

  async run(skillId: string, dto: RunSkillDto): Promise<SkillRunResult> {
    const skill = await this.getSkill(skillId);
    if (!skill) return this.errorResult(skillId, 'Skill not found');

    const logs: string[] = [];
    const toolCallLogs: ToolCallLog[] = [];
    const startedAt = new Date().toISOString();
    const t0 = Date.now();

    const log = (msg: string) => {
      const ts = new Date().toISOString().substr(11, 12);
      logs.push(`[${ts}] ${msg}`);
      this.logger.log(msg);
    };

    try {
      // 1. Load the tools this skill uses
      const allTools = await this.listTools();
      const skillTools = allTools.filter(t => skill.tools.includes(t.name));

      if (skill.tools.length > 0 && skillTools.length === 0) {
        log(`⚠ Skill declares tools [${skill.tools.join(', ')}] but none were found`);
      }

      log(`▶ Starting skill: ${skill.name}`);
      log(`  Tools: [${skillTools.map(t => t.name).join(', ') || 'none'}]`);
      log(`  Inputs: ${JSON.stringify(dto.inputs || {})}`);

      // 2. Build the system prompt — inject skill markdown + user inputs
      const inputValues = dto.inputs || {};
      const inputSummary = Object.entries(inputValues)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n');

      const userInputDescription = skill.inputs
        .map(i => `- ${i.name} (${i.type}): ${i.description}`)
        .join('\n');

      const systemPrompt = `${skill.prompt}

---
INPUTS PROVIDED BY THE USER:
${inputSummary || '(none)'}

${userInputDescription ? `INPUT DEFINITIONS:\n${userInputDescription}` : ''}`;

      // 3. Build OpenAI-format tool definitions
      const openAITools = skillTools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object' as const,
            properties: Object.fromEntries(
              t.parameters.map(p => [p.name, { type: p.type, description: p.description }]),
            ),
            required: t.parameters.filter(p => p.required).map(p => p.name),
          },
        },
      }));

      // 4. Initial messages
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: inputSummary
            ? `Please execute this task with the following inputs:\n${inputSummary}`
            : 'Please execute this task.',
        },
      ];

      // 5. Agentic loop
      let iteration = 0;
      while (iteration < MAX_LOOP_ITERATIONS) {
        iteration++;
        log(`\n🔄 Loop iteration ${iteration}/${MAX_LOOP_ITERATIONS}`);

        const choice = await this.callAIWithTools(messages, openAITools, log);

        // Check if the AI wants to call tools
        const toolCalls = choice.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          // Add the assistant message (with tool_calls) to conversation
          messages.push(choice.message);

          // Execute each tool call
          for (const tc of toolCalls) {
            const toolName = tc.function.name;
            let toolInput: any;
            try {
              toolInput = JSON.parse(tc.function.arguments);
            } catch {
              toolInput = tc.function.arguments;
            }

            log(`🔧 AI called: ${toolName}(${JSON.stringify(toolInput)})`);

            const toolT0 = Date.now();
            let toolOutput: any;
            try {
              toolOutput = await this.executeTool(toolName, toolInput, logs);
              log(`✅ ${toolName} returned (${Date.now() - toolT0}ms)`);
            } catch (err: any) {
              toolOutput = { error: err.message };
              log(`❌ ${toolName} failed: ${err.message}`);
            }

            toolCallLogs.push({
              toolName,
              input: toolInput,
              output: toolOutput,
              duration: Date.now() - toolT0,
            });

            // Add tool result to conversation
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput),
            });
          }
        } else {
          // No tool calls — AI is done, return the final answer
          const finalText = choice.message?.content || '';
          log(`\n✅ AI finished after ${iteration} iteration(s)`);
          log(`📝 Output length: ${finalText.length} chars`);

          const result: SkillRunResult = {
            id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            skillId,
            status: 'success',
            output: finalText,
            logs,
            toolCalls: toolCallLogs,
            duration: Date.now() - t0,
            startedAt,
          };

          await this.saveRun(result);
          return result;
        }
      }

      // Max iterations reached
      log(`⚠ Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
      const lastMsg = messages[messages.length - 1];
      const partialOutput = typeof lastMsg?.content === 'string' ? lastMsg.content : '';

      const result: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'success',
        output: partialOutput || 'Max tool-call iterations reached. The AI may not have finished.',
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
      };

      await this.saveRun(result);
      return result;
    } catch (err: any) {
      log(`❌ Error: ${err.message}`);

      const result: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'error',
        output: '',
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
        error: err.message || String(err),
      };

      await this.saveRun(result);
      return result;
    }
  }

  // ── Follow-up: chain a new instruction using previous output ─────

  async followUp(body: {
    previousOutput: string;
    message: string;
    previousSkillId?: string;
  }): Promise<SkillRunResult> {
    const logs: string[] = [];
    const toolCallLogs: ToolCallLog[] = [];
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const skillId = body.previousSkillId || 'follow-up';

    const log = (msg: string) => {
      const ts = new Date().toISOString().substr(11, 12);
      logs.push(`[${ts}] ${msg}`);
      this.logger.log(msg);
    };

    try {
      // Load ALL tools — follow-ups can use any tool
      const allTools = await this.listTools();
      log(`▶ Follow-up request with ${allTools.length} tools available`);
      log(`  Message: ${body.message}`);

      const openAITools = allTools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object' as const,
            properties: Object.fromEntries(
              t.parameters.map(p => [p.name, { type: p.type, description: p.description }]),
            ),
            required: t.parameters.filter(p => p.required).map(p => p.name),
          },
        },
      }));

      const systemPrompt = `You are a helpful assistant that can use tools to process content.
You have been given the output from a previous skill run. The user wants you to do something with it.

Available tools: ${allTools.map(t => `${t.name} — ${t.description}`).join('\n')}

IMPORTANT:
- Use the provided tools to fulfil the user's request
- The previous output is provided below for context
- Be concise and direct in your final response
- If the user asks to save as PDF, use the generate-pdf tool with the previous output as content
- If the user asks for an image, use the generate-image tool
- If the user asks to research further, use brave-search and/or apify-scraper`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `PREVIOUS OUTPUT:\n---\n${body.previousOutput.slice(0, 12000)}\n---\n\nUSER REQUEST: ${body.message}`,
        },
      ];

      // Agentic loop (same as run())
      let iteration = 0;
      while (iteration < MAX_LOOP_ITERATIONS) {
        iteration++;
        log(`\n🔄 Follow-up loop iteration ${iteration}/${MAX_LOOP_ITERATIONS}`);

        const choice = await this.callAIWithTools(messages, openAITools, log);
        const toolCalls = choice.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          messages.push(choice.message);

          for (const tc of toolCalls) {
            const toolName = tc.function.name;
            let toolInput: any;
            try {
              toolInput = JSON.parse(tc.function.arguments);
            } catch {
              toolInput = tc.function.arguments;
            }

            log(`🔧 AI called: ${toolName}(${JSON.stringify(toolInput).slice(0, 200)})`);

            const toolT0 = Date.now();
            let toolOutput: any;
            try {
              toolOutput = await this.executeTool(toolName, toolInput, logs);
              log(`✅ ${toolName} returned (${Date.now() - toolT0}ms)`);
            } catch (err: any) {
              toolOutput = { error: err.message };
              log(`❌ ${toolName} failed: ${err.message}`);
            }

            toolCallLogs.push({
              toolName,
              input: toolInput,
              output: toolOutput,
              duration: Date.now() - toolT0,
            });

            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput),
            });
          }
        } else {
          const finalText = choice.message?.content || '';
          log(`\n✅ Follow-up finished after ${iteration} iteration(s)`);

          const result: SkillRunResult = {
            id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            skillId,
            status: 'success',
            output: finalText,
            logs,
            toolCalls: toolCallLogs,
            duration: Date.now() - t0,
            startedAt,
          };

          await this.saveRun(result);
          return result;
        }
      }

      // Max iterations
      const result: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'success',
        output: 'Max iterations reached during follow-up.',
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
      };
      await this.saveRun(result);
      return result;
    } catch (err: any) {
      log(`❌ Follow-up error: ${err.message}`);
      const result: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'error',
        output: '',
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
        error: err.message,
      };
      await this.saveRun(result);
      return result;
    }
  }

  // ── Execute a single tool by name ─────────────────────────────────

  private async executeTool(
    toolName: string,
    params: any,
    logs: string[],
  ): Promise<any> {
    const tool = await this.getToolByName(toolName);
    if (!tool) throw new Error(`Tool "${toolName}" not found`);

    const ctx: ToolContext = this.buildToolContext(logs);

    // Execute the tool code in a sandbox
    const wrappedCode = `
      return (async function __tool__(params, ctx) {
        ${tool.code}
      })(params, ctx);
    `;

    const fn = new Function('params', 'ctx', wrappedCode);
    return await fn(params, ctx);
  }

  // ── Build context for tool execution ──────────────────────────────

  private buildToolContext(logs: string[]): ToolContext {
    return {
      getCredential: (name) => {
        try {
          const data = this.db.readSync();
          const apiKeys = data.apiKeys || [];
          const keyEntry = apiKeys.find((k: any) => k.name === name);
          if (!keyEntry) return null;
          return this.crypto.decrypt(keyEntry.value);
        } catch {
          return null;
        }
      },

      fetch: async (url, opts) => {
        try {
          const resp = await axios({
            url,
            method: (opts?.method as any) || 'GET',
            headers: opts?.headers as any,
            data: opts?.body,
            timeout: 30000,
            validateStatus: () => true,
          });
          return {
            status: resp.status,
            body: resp.data,
            headers: resp.headers as any,
          };
        } catch (err: any) {
          throw new Error(`Fetch failed: ${err.message}`);
        }
      },

      log: (message) => {
        const ts = new Date().toISOString().substr(11, 12);
        logs.push(`[${ts}] 🔧 ${message}`);
      },

      savePdf: async (content: string, title?: string, filename?: string): Promise<string> => {
        try {
          const pdfDir = path.join(__dirname, '..', '..', 'public', 'skill-pdfs');
          if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

          const safeName = filename || `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.pdf`;
          const filePath = path.join(pdfDir, safeName);

          return new Promise<string>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Title
            if (title) {
              doc.fontSize(22).font('Helvetica-Bold').text(title, { align: 'center' });
              doc.moveDown(0.5);
              doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#667eea').lineWidth(2).stroke();
              doc.moveDown(1);
            }

            // Parse and render markdown lines
            const lines = content.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();

              // Skip empty lines — just add spacing
              if (!trimmed) {
                doc.moveDown(0.4);
                continue;
              }

              // Headers
              if (trimmed.startsWith('#### ')) {
                doc.moveDown(0.3);
                doc.fontSize(12).font('Helvetica-Bold').text(trimmed.replace(/^####\s*/, ''));
                doc.moveDown(0.2);
              } else if (trimmed.startsWith('### ')) {
                doc.moveDown(0.4);
                doc.fontSize(13).font('Helvetica-Bold').text(trimmed.replace(/^###\s*/, ''));
                doc.moveDown(0.2);
              } else if (trimmed.startsWith('## ')) {
                doc.moveDown(0.6);
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#667eea').text(trimmed.replace(/^##\s*/, ''));
                doc.fillColor('#000000');
                doc.moveDown(0.3);
              } else if (trimmed.startsWith('# ')) {
                doc.moveDown(0.6);
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e').text(trimmed.replace(/^#\s*/, ''));
                doc.fillColor('#000000');
                doc.moveDown(0.3);
              }
              // Horizontal rule
              else if (/^[-*_]{3,}$/.test(trimmed)) {
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
                doc.moveDown(0.5);
              }
              // Bullet points
              else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const text = trimmed.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
                doc.fontSize(10).font('Helvetica').text('  \u2022  ' + text, { indent: 10 });
                doc.moveDown(0.15);
              }
              // Numbered lists
              else if (/^\d+\.\s/.test(trimmed)) {
                const text = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
                doc.fontSize(10).font('Helvetica').text('  ' + text, { indent: 10 });
                doc.moveDown(0.15);
              }
              // Blockquotes
              else if (trimmed.startsWith('> ')) {
                const text = trimmed.replace(/^>\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
                doc.fontSize(10).font('Helvetica-Oblique').fillColor('#555555').text(text, { indent: 20 });
                doc.fillColor('#000000');
                doc.moveDown(0.2);
              }
              // Table rows (basic — render as formatted text)
              else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (/^[|\s:-]+$/.test(trimmed)) continue; // skip separator rows
                const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*(.*?)\*\*/g, '$1'));
                doc.fontSize(9).font('Helvetica').text(cells.join('  |  '), { indent: 5 });
                doc.moveDown(0.1);
              }
              // Regular paragraph
              else {
                const text = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
                doc.fontSize(10).font('Helvetica').text(text, { align: 'left', lineGap: 2 });
                doc.moveDown(0.2);
              }

              // Auto page break check
              if (doc.y > 750) {
                doc.addPage();
              }
            }

            // Footer with generation date
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
              doc.switchToPage(i);
              doc.fontSize(8).font('Helvetica').fillColor('#999999')
                .text(`Generated ${new Date().toLocaleDateString()} | Page ${i + 1} of ${pageCount}`, 50, 780, { align: 'center' });
            }
            doc.fillColor('#000000');

            doc.end();
            stream.on('finish', () => resolve(`/skill-pdfs/${safeName}`));
            stream.on('error', reject);
          });
        } catch (err: any) {
          throw new Error(`Failed to generate PDF: ${err.message}`);
        }
      },

      saveImage: async (remoteUrl: string, filename?: string): Promise<string> => {
        try {
          const imgDir = path.join(__dirname, '..', '..', 'public', 'skill-images');
          if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

          const ext = '.png';
          const name = filename || `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
          const filePath = path.join(imgDir, name);

          const resp = await axios.get(remoteUrl, { responseType: 'arraybuffer', timeout: 60000 });
          fs.writeFileSync(filePath, Buffer.from(resp.data));

          // Return the URL accessible via the static file server
          return `/skill-images/${name}`;
        } catch (err: any) {
          throw new Error(`Failed to save image: ${err.message}`);
        }
      },
    };
  }

  // ── AI call with tool support (OpenAI function calling format) ────

  private async callAIWithTools(
    messages: any[],
    tools: any[],
    log: (msg: string) => void,
  ): Promise<any> {
    const model = 'gpt-4o-mini';
    const openRouterKey = this.getKey('openrouter');
    const openAIKey = this.getKey('openai');

    const body: any = {
      model,
      messages,
      max_tokens: 4000,
      temperature: 0.7,
    };

    if (tools.length > 0) {
      body.tools = tools;
    }

    log(`  Calling AI (${model}) with ${tools.length} tools available...`);

    if (openRouterKey) {
      try {
        const resp = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          body,
          {
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 120000,
          },
        );
        return resp.data.choices?.[0] || {};
      } catch (err: any) {
        log(`  ⚠ OpenRouter failed: ${err.message}, trying OpenAI...`);
      }
    }

    if (openAIKey) {
      body.model = model.includes('/') ? 'gpt-4o-mini' : model;
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        body,
        {
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );
      return resp.data.choices?.[0] || {};
    }

    throw new Error('No AI API key configured. Add an OpenRouter or OpenAI key in Settings.');
  }

  // ══════════════════════════════════════════════════════════════════
  //  RUN HISTORY
  // ══════════════════════════════════════════════════════════════════

  async getRunHistory(skillId?: string, limit = 50): Promise<SkillRunResult[]> {
    const data = await this.db.read();
    let runs: SkillRunResult[] = data.skillRuns || [];
    if (skillId) runs = runs.filter(r => r.skillId === skillId);
    return runs.slice(-limit);
  }

  // ══════════════════════════════════════════════════════════════════
  //  BUILDER CHAT (AI assistant to help create skills + tools)
  // ══════════════════════════════════════════════════════════════════

  async builderChat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ reply: string; skill?: any; tool?: any }> {
    let storedKeys: string[] = [];
    try {
      const data = this.db.readSync();
      storedKeys = (data.apiKeys || []).map((k: any) => k.name);
    } catch {}

    const existingTools = await this.listTools();
    const toolList = existingTools.map(t => `- ${t.name}: ${t.description}`).join('\n') || '(none yet)';

    const systemPrompt = `You are the Skill Builder — an AI that helps users create Skills and Tools for an agentic system.

ARCHITECTURE:
- A TOOL is executable JavaScript code that does ONE specific thing (e.g., search the web, send an email)
- A SKILL is a system prompt (markdown) that tells an AI how to think + which tools it can use
- When a skill runs, the AI reads the prompt, calls tools as needed in a loop, then returns a final answer

EXISTING TOOLS:
${toolList}

STORED API KEYS: [${storedKeys.join(', ') || 'none'}]

YOUR WORKFLOW:
1. Ask 1-2 SHORT questions to understand what the user wants
2. Then generate BOTH the skill AND any new tools needed
3. Maximum 2 rounds of questions before you MUST produce code
4. If the user's request can use an existing tool, don't create a duplicate
5. NEVER give a summary without code. ALWAYS include the JSON blocks.

WHEN GENERATING, include these JSON blocks at the END of your message:

For each NEW TOOL needed (skip if using only existing tools):
\`\`\`tool-json
{
  "name": "tool-name-kebab-case",
  "description": "What this tool does (shown to AI to help it decide when to use it)",
  "parameters": [{"name": "query", "type": "string", "description": "The search query", "required": true}],
  "code": "the JS function body\\nreceives (params, ctx)\\nctx.getCredential('key')\\nconst resp = await ctx.fetch(url);\\nreturn result;"
}
\`\`\`

For the SKILL:
\`\`\`skill-json
{
  "name": "skill-name-kebab-case",
  "description": "One line description",
  "prompt": "The full markdown system prompt.\\n\\nTells the AI what to do step by step.\\nMultiple lines are fine using \\\\n.",
  "tools": ["tool-name"],
  "inputs": [{"name": "topic", "type": "string", "description": "The topic to research", "required": true}],
  "credentials": ["brave"]
}
\`\`\`

TOOL CODE RULES:
- Code is the BODY of: async function(params, ctx) { ... }
- params contains the tool's input parameters
- ctx.getCredential('name') — get stored API key
- ctx.fetch(url, opts) — HTTP request, returns { status, body, headers }
- ctx.log(msg) — log output visible to user
- Return a useful value (object, array, string)
- Keep tools focused — one tool, one job
- NEVER hardcode API keys — always use ctx.getCredential()
- Handle errors with try/catch and useful error messages

SKILL PROMPT RULES:
- Write as markdown — clear, structured instructions
- Tell the AI exactly how to think and what steps to take
- Specify the output format you want
- Include rules and constraints
- The prompt should guide an AI to use the available tools effectively`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const model = 'gpt-4o-mini';
    const openRouterKey = this.getKey('openrouter');
    const openAIKey = this.getKey('openai');
    let reply = '';

    if (openRouterKey) {
      try {
        const resp = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          { model, messages: apiMessages, max_tokens: 4000, temperature: 0.7 },
          { headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' }, timeout: 90000 },
        );
        reply = resp.data.choices?.[0]?.message?.content || '';
      } catch (err: any) {
        this.logger.warn(`Builder OpenRouter failed: ${err.message}`);
      }
    }

    if (!reply && openAIKey) {
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: 'gpt-4o-mini', messages: apiMessages, max_tokens: 4000, temperature: 0.7 },
        { headers: { Authorization: `Bearer ${openAIKey}`, 'Content-Type': 'application/json' }, timeout: 90000 },
      );
      reply = resp.data.choices?.[0]?.message?.content || '';
    }

    if (!reply) throw new Error('No AI API key configured. Add an OpenRouter or OpenAI key in Settings.');

    // Parse tool-json and skill-json blocks from the response
    const toolMatch = reply.match(/```tool-json\s*([\s\S]*?)```/);
    const skillMatch = reply.match(/```skill-json\s*([\s\S]*?)```/);

    let tool: any = undefined;
    let skill: any = undefined;

    if (toolMatch) {
      try { tool = JSON.parse(toolMatch[1].trim()); } catch {
        this.logger.warn('Failed to parse tool-json from builder response');
      }
    }
    if (skillMatch) {
      try { skill = JSON.parse(skillMatch[1].trim()); } catch {
        this.logger.warn('Failed to parse skill-json from builder response');
      }
    }

    return { reply, skill, tool };
  }

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  private getKey(provider: string): string | null {
    try {
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name === provider);
      if (!keyEntry) return null;
      return this.crypto.decrypt(keyEntry.value);
    } catch {
      return null;
    }
  }

  private async saveRun(result: SkillRunResult): Promise<void> {
    try {
      const data = await this.db.read();
      if (!data.skillRuns) data.skillRuns = [];
      data.skillRuns.push(result);
      if (data.skillRuns.length > 200) {
        data.skillRuns = data.skillRuns.slice(-200);
      }
      await this.db.write(data);
    } catch (err) {
      this.logger.error('Failed to save skill run', err);
    }
  }

  private errorResult(skillId: string, message: string): SkillRunResult {
    return {
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      skillId,
      status: 'error',
      output: '',
      logs: [],
      toolCalls: [],
      duration: 0,
      startedAt: new Date().toISOString(),
      error: message,
    };
  }
}
