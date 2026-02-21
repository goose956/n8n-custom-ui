import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  ToolDefinition,
  ToolParam,
  ToolContext,
  ToolCallLog,
  SkillDefinition,
  SkillRunResult,
  CreateToolDto,
  UpdateToolDto,
  CreateSkillDto,
  UpdateSkillDto,
  RunSkillDto,
  ProgressCallback,
  SkillProgressEvent,
} from './skill.types';
import { generateText, tool as defineTool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { ArtifactRegistry } from './artifact-registry';
import { PromptBuilderService } from './prompt-builder.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import * as archiver from 'archiver';

const MAX_STEPS = 10;
const MAX_STEPS_CHAT = 18;  // Chat needs more steps for multi-capability pipelines
const MAX_CALLS_PER_TOOL: Record<string, number> = {
  'generate-image': 2,
  'generate-pdf': 1,
  'generate-excel': 1,
  'generate-qr': 2,
  'generate-qrcode': 3,
  'generate-html-page': 1,
  'generate-html': 1,
  'generate-csv': 2,
  'generate-json': 2,
  'generate-vcard': 2,
  'send-email': 2,
  'create-zip': 1,
  'text-to-speech': 2,
  'brave-search': 4,
  'apify-scraper': 3,
};
const DEFAULT_MAX_CALLS_PER_TOOL = 5;

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
    private readonly promptBuilder: PromptBuilderService,
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
const url = 'https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(params.query) + '&count=' + count;
const headers = { 'X-Subscription-Token': key, 'Accept': 'application/json' };

let resp;
const maxRetries = 3;
for (let attempt = 0; attempt < maxRetries; attempt++) {
  resp = await ctx.fetch(url, { headers });
  if (resp.status === 429) {
    const delay = Math.pow(2, attempt) * 2000;
    ctx.log('Rate limited (429), waiting ' + (delay / 1000) + 's before retry ' + (attempt + 1) + '/' + maxRetries + '...');
    await new Promise(r => setTimeout(r, delay));
    continue;
  }
  break;
}

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
      category: dto.category || 'other',
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
  // ══════════════════════════════════════════════════════════════════
  //  EXECUTION ENGINE — Vercel AI SDK + ArtifactRegistry
  // ══════════════════════════════════════════════════════════════════

  /**
   * Build a Zod schema from dynamic tool parameters.
   * Bridges our DB-stored parameter definitions to the AI SDK's typed tool system.
   */
  private buildZodSchema(params: ToolParam[]): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const p of params) {
      let t: z.ZodTypeAny;
      switch (p.type) {
        case 'number':  t = z.number();  break;
        case 'boolean': t = z.boolean(); break;
        case 'array':   t = z.array(z.any()); break;
        case 'object':  t = z.record(z.string(), z.any()); break;
        default:        t = z.string();  break;
      }
      if (p.description) t = t.describe(p.description);
      shape[p.name] = p.required ? t : t.optional();
    }
    return z.object(shape);
  }

  /**
   * Build AI SDK tool definitions from our database tools.
   * Each tool wraps executeTool() and auto-registers artifacts.
   */
  private buildSDKTools(
    toolDefs: ToolDefinition[],
    registry: ArtifactRegistry,
    toolCallLogs: ToolCallLog[],
    toolCallCounts: Record<string, number>,
    logs: string[],
    log: (msg: string) => void,
    emit: (event: Omit<SkillProgressEvent, 'elapsed'>) => void,
    phaseLabel: string,
  ): Record<string, any> {
    const tools: Record<string, any> = {};

    for (const t of toolDefs) {
      tools[t.name] = defineTool({
        description: t.description,
        inputSchema: this.buildZodSchema(t.parameters),
        execute: async (params: any) => {
          // Per-tool cap check
          const count = toolCallCounts[t.name] || 0;
          const max = MAX_CALLS_PER_TOOL[t.name] ?? DEFAULT_MAX_CALLS_PER_TOOL;
          if (count >= max) {
            log(`⛔ [${phaseLabel}] ${t.name} cap reached (${max})`);
            emit({ type: 'tool-done', message: `${t.name} skipped — limit reached (${max})`, phase: phaseLabel, tool: t.name });
            return { error: `Maximum ${max} calls to ${t.name} reached. Proceed without it.` };
          }

          log(`🔧 [${phaseLabel}] ${t.name}(${JSON.stringify(params).slice(0, 300)})`);
          emit({ type: 'tool-start', message: `Calling ${t.name}...`, phase: phaseLabel, tool: t.name });

          const toolT0 = Date.now();
          let output: any;
          try {
            output = await this.executeTool(t.name, params, logs);
            log(`✅ [${phaseLabel}] ${t.name} done (${Date.now() - toolT0}ms)`);
            emit({ type: 'tool-done', message: `${t.name} done (${Date.now() - toolT0}ms)`, phase: phaseLabel, tool: t.name });
          } catch (err: any) {
            output = { error: err.message };
            log(`❌ [${phaseLabel}] ${t.name} failed: ${err.message}`);
            emit({ type: 'tool-done', message: `${t.name} failed: ${err.message}`, phase: phaseLabel, tool: t.name });
          }

          toolCallCounts[t.name] = count + 1;
          toolCallLogs.push({ toolName: t.name, input: params, output, duration: Date.now() - toolT0 });

          // Artifact registry: automatically track any files produced
          registry.registerToolOutput(t.name, output);

          return output;
        },
      });
    }

    return tools;
  }

  /**
   * Get the AI provider (OpenRouter preferred, OpenAI fallback).
   */
  private getAIProvider() {
    const openRouterKey = this.getKey('openrouter');
    const openAIKey = this.getKey('openai');

    if (openRouterKey) {
      return createOpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
    if (openAIKey) {
      return createOpenAI({ apiKey: openAIKey });
    }
    throw new Error('No AI API key configured. Add an OpenRouter or OpenAI key in Settings.');
  }

  async run(skillId: string, dto: RunSkillDto, onProgress?: ProgressCallback): Promise<SkillRunResult> {
    const skill = await this.getSkill(skillId);
    if (!skill) return this.errorResult(skillId, 'Skill not found');

    const logs: string[] = [];
    const toolCallLogs: ToolCallLog[] = [];
    const toolCallCounts: Record<string, number> = {};
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const registry = new ArtifactRegistry();

    const emit = (event: Omit<SkillProgressEvent, 'elapsed'>) => {
      if (onProgress) onProgress({ ...event, elapsed: Date.now() - t0 });
    };

    const log = (msg: string) => {
      const ts = new Date().toISOString().substr(11, 12);
      logs.push(`[${ts}] ${msg}`);
      this.logger.log(msg);
    };

    try {
      // 1. Load tools + AI provider
      const allTools = await this.listTools();
      const provider = this.getAIProvider();
      const inputValues = dto.inputs || {};
      const instructions = dto.instructions?.trim() || '';

      log(`▶ Starting skill: ${skill.name}`);
      log(`  Inputs: ${JSON.stringify(inputValues)}`);

      // ── build_prompt_for_task (the Python outline) ──────────────
      // ONE call: plan → assemble prompt → collect tools
      emit({ type: 'info', message: `Planning capabilities for: ${skill.name}` });
      const { systemPrompt, tools: filteredTools, capabilities } =
        await this.promptBuilder.buildPromptForTask(
          `Skill: ${skill.name} — ${skill.description}`,
          allTools,
          skill,
          inputValues,
          instructions,
        );

      log(`🧠 Planner selected: [${capabilities.join(', ')}]`);
      log(`  Tools: [${filteredTools.map(t => t.name).join(', ') || 'none'}]`);
      emit({ type: 'step', message: `Capabilities: ${capabilities.length ? capabilities.join(' → ') : 'general assistant'}` });

      // Build user message
      const inputSummary = Object.entries(inputValues)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n');

      const userMessage = instructions
        ? `${instructions}${inputSummary ? '\n\nInputs provided:\n' + inputSummary : ''}`
        : inputSummary
          ? `Please execute this task with the following inputs:\n${inputSummary}`
          : 'Please execute this task.';

      emit({ type: 'info', message: `Starting skill: ${skill.name}` });

      // Build SDK tool wrappers
      const sdkTools = this.buildSDKTools(
        filteredTools, registry, toolCallLogs, toolCallCounts, logs, log, emit, 'Main',
      );

      // ── ONE generateText() call with ALL tools and ONE prompt ──
      let result: any;
      try {
        result = await generateText({
          model: provider('gpt-4o-mini'),
          tools: sdkTools,
          stopWhen: stepCountIs(MAX_STEPS),
          system: systemPrompt,
          messages: [{ role: 'user' as const, content: userMessage }],
          maxRetries: 3,
          onStepFinish: (event: any) => {
            const { text, toolCalls } = event;
            if (toolCalls && toolCalls.length > 0) {
              emit({ type: 'step', message: `Tools: ${toolCalls.map((tc: any) => tc.toolName).join(', ')}`, phase: 'Main' });
            } else if (text) {
              emit({ type: 'step', message: `Composing (${text.length} chars)...`, phase: 'Main' });
            }
          },
        } as any);
      } catch (err: any) {
        // Fallback: if OpenRouter failed and we have both keys, try OpenAI
        const openRouterKey = this.getKey('openrouter');
        const openAIKey = this.getKey('openai');
        if (openRouterKey && openAIKey) {
          log(`⚠ Primary provider failed: ${err.message}, trying fallback...`);
          const fallback = createOpenAI({ apiKey: openAIKey });
          result = await generateText({
            model: fallback('gpt-4o-mini'),
            tools: sdkTools,
            stopWhen: stepCountIs(MAX_STEPS),
            system: systemPrompt,
            messages: [{ role: 'user' as const, content: userMessage }],
            maxRetries: 3,
          } as any);
        } else {
          throw err;
        }
      }

      // Extract content from result
      const allStepTexts = (result.steps || [])
        .map((s: any) => s.text?.trim())
        .filter(Boolean);

      let contentOutput: string;
      if (result.text && result.text.length > 100) {
        contentOutput = result.text;
      } else if (allStepTexts.length > 0) {
        contentOutput = allStepTexts.join('\n\n');
      } else {
        contentOutput = '';
        log(`⚠ Model produced no text output after ${(result.steps || []).length} steps`);
      }

      // Deterministic output assembly via ArtifactRegistry
      const output = registry.assembleOutput(contentOutput);

      log(`📝 Final: ${output.length} chars (${registry.count} artifacts)`);
      emit({ type: 'done', message: `Complete — ${output.length} chars, ${toolCallLogs.length} tool calls` });

      const runResult: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'success',
        output,
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
      };
      await this.saveRun(runResult);
      return runResult;
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
    const toolCallCounts: Record<string, number> = {};
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const skillId = body.previousSkillId || 'follow-up';
    const registry = new ArtifactRegistry();

    const log = (msg: string) => {
      const ts = new Date().toISOString().substr(11, 12);
      logs.push(`[${ts}] ${msg}`);
      this.logger.log(msg);
    };

    const noopEmit = (_event: Omit<SkillProgressEvent, 'elapsed'>) => {};

    try {
      const allTools = await this.listTools();
      const provider = this.getAIProvider();
      log(`▶ Follow-up request with ${allTools.length} tools available`);
      log(`  Message: ${body.message}`);

      const sdkTools = this.buildSDKTools(
        allTools, registry, toolCallLogs, toolCallCounts, logs, log, noopEmit, 'Follow-up',
      );

      const systemPrompt = `You are a helpful assistant that can use tools to process content.
You have been given the output from a previous skill run. The user wants you to do something with it.

IMPORTANT:
- Use the provided tools to fulfil the user's request
- If the user asks you to export/save content, pass the FULL content to the appropriate tool
- Your final answer must include the full content plus any download links`;

      const followUpResult = await generateText({
        model: provider('gpt-4o-mini'),
        tools: sdkTools,
        stopWhen: stepCountIs(MAX_STEPS),
        system: systemPrompt,
        messages: [{
          role: 'user' as const,
          content: `PREVIOUS OUTPUT:\n---\n${body.previousOutput.slice(0, 12000)}\n---\n\nUSER REQUEST: ${body.message}`,
        }],
        maxRetries: 3,
      } as any);

      const output = registry.assembleOutput(followUpResult.text);
      log(`✅ Follow-up finished — ${output.length} chars`);

      const result: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId,
        status: 'success',
        output,
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

  // ── Chat: freeform input → planner determines capabilities ───────

  async runChat(
    message: string,
    onProgress?: ProgressCallback,
  ): Promise<SkillRunResult> {
    const logs: string[] = [];
    const toolCallLogs: ToolCallLog[] = [];
    const toolCallCounts: Record<string, number> = {};
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const registry = new ArtifactRegistry();

    const emit = (event: Omit<SkillProgressEvent, 'elapsed'>) => {
      if (onProgress) onProgress({ ...event, elapsed: Date.now() - t0 });
    };

    const log = (msg: string) => {
      const ts = new Date().toISOString().substr(11, 12);
      logs.push(`[${ts}] ${msg}`);
      this.logger.log(msg);
    };

    try {
      const allTools = await this.listTools();
      const provider = this.getAIProvider();

      log(`▶ Chat request: "${message.slice(0, 200)}"`);
      emit({ type: 'info', message: 'Analysing your request...' });

      // ── build_prompt_for_task (the Python outline) ──────────────
      // ONE call: plan → assemble prompt → collect tools
      const { systemPrompt, tools: filteredTools, capabilities } =
        await this.promptBuilder.buildPromptForTask(message, allTools);

      log(`🧠 Planner selected: [${capabilities.join(', ')}]`);
      log(`  Tools: [${filteredTools.map(t => t.name).join(', ') || 'none'}]`);
      emit({ type: 'step', message: `Plan: ${capabilities.length ? capabilities.join(' → ') : 'general assistant'}` });
      emit({ type: 'info', message: capabilities.length ? `Running: ${capabilities.join(' → ')}` : 'Working...' });

      // Build SDK tool wrappers
      const sdkTools = this.buildSDKTools(
        filteredTools, registry, toolCallLogs, toolCallCounts, logs, log, emit, 'Main',
      );

      // ── ONE generateText() call with ALL tools and ONE prompt ──
      let result: any;
      try {
        result = await generateText({
          model: provider('gpt-4o-mini'),
          tools: sdkTools,
          stopWhen: stepCountIs(MAX_STEPS_CHAT),
          system: systemPrompt,
          messages: [{ role: 'user' as const, content: message }],
          maxRetries: 3,
          onStepFinish: (event: any) => {
            const { text, toolCalls } = event;
            if (toolCalls?.length > 0) {
              emit({ type: 'step', message: `Tools: ${toolCalls.map((tc: any) => tc.toolName).join(', ')}`, phase: 'Main' });
            } else if (text) {
              emit({ type: 'step', message: `Composing (${text.length} chars)...`, phase: 'Main' });
            }
          },
        } as any);
      } catch (err: any) {
        // Fallback: if OpenRouter failed and we have both keys, try OpenAI
        const openRouterKey = this.getKey('openrouter');
        const openAIKey = this.getKey('openai');
        if (openRouterKey && openAIKey) {
          log(`⚠ Fallback to OpenAI: ${err.message}`);
          const fallback = createOpenAI({ apiKey: openAIKey });
          result = await generateText({
            model: fallback('gpt-4o-mini'),
            tools: sdkTools,
            stopWhen: stepCountIs(MAX_STEPS_CHAT),
            system: systemPrompt,
            messages: [{ role: 'user' as const, content: message }],
            maxRetries: 3,
          } as any);
        } else {
          throw err;
        }
      }

      // Extract content from result
      const allStepTexts = (result.steps || [])
        .map((s: any) => s.text?.trim())
        .filter(Boolean);

      let contentOutput: string;
      if (result.text && result.text.length > 100) {
        contentOutput = result.text;
      } else if (allStepTexts.length > 0) {
        contentOutput = allStepTexts.join('\n\n');
      } else {
        contentOutput = '';
        log(`⚠ Model produced no text output after ${(result.steps || []).length} steps`);
      }

      const output = registry.assembleOutput(contentOutput);
      log(`📝 Final: ${output.length} chars (${registry.count} artifacts)`);
      emit({ type: 'done', message: `Complete — ${output.length} chars, ${toolCallLogs.length} tool calls` });

      const runResult: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId: 'chat',
        status: 'success',
        output,
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
      };
      await this.saveRun(runResult);
      return runResult;
    } catch (err: any) {
      log(`❌ Chat error: ${err.message}`);
      const runResult: SkillRunResult = {
        id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        skillId: 'chat',
        status: 'error',
        output: '',
        logs,
        toolCalls: toolCallLogs,
        duration: Date.now() - t0,
        startedAt,
        error: err.message || String(err),
      };
      await this.saveRun(runResult);
      return runResult;
    }
  }

  // ── Execute a single tool by name ─────────────────────────────────

  private lastToolCallAt = 0;
  private static readonly TOOL_CALL_MIN_GAP_MS = 1500; // min gap between external API calls

  private async executeTool(
    toolName: string,
    params: any,
    logs: string[],
  ): Promise<any> {
    const tool = await this.getToolByName(toolName);
    if (!tool) throw new Error(`Tool "${toolName}" not found`);

    // Rate-limit: ensure minimum gap between consecutive tool calls
    const now = Date.now();
    const elapsed = now - this.lastToolCallAt;
    if (elapsed < SkillRunnerService.TOOL_CALL_MIN_GAP_MS) {
      const wait = SkillRunnerService.TOOL_CALL_MIN_GAP_MS - elapsed;
      await new Promise(r => setTimeout(r, wait));
    }
    this.lastToolCallAt = Date.now();

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

          // Always append a timestamp so repeated runs never overwrite previous PDFs
          const ts = Date.now();
          const rand = Math.random().toString(36).substr(2, 6);
          let safeName: string;
          if (filename) {
            const base = filename.replace(/\.pdf$/i, '');
            safeName = `${base}_${ts}_${rand}.pdf`;
          } else {
            safeName = `pdf_${ts}_${rand}.pdf`;
          }
          const filePath = path.join(pdfDir, safeName);

          // ── Pre-process: fix mangled image URLs in content ──
          // The AI often rewrites /skill-images/file.png as https://skill-images.file.png
          const publicDir = path.join(__dirname, '..', '..', 'public');
          const fixedContent = content
            // Fix ![alt](https://skill-images.filename) → ![alt](/skill-images/filename)
            .replace(/(!\[[^\]]*\])\([a-zA-Z][a-zA-Z0-9+.-]*:\/?\/?\/?skill-images[./]([^)]+)\)/g, '$1(/skill-images/$2)')
            // Fix ![alt](https://skill-pdfs.filename) → ![alt](/skill-pdfs/filename)
            .replace(/(!\[[^\]]*\])\([a-zA-Z][a-zA-Z0-9+.-]*:\/?\/?\/?skill-pdfs[./]([^)]+)\)/g, '$1(/skill-pdfs/$2)')
            // Strip trailing slashes from image URLs inside markdown
            .replace(/(!\[[^\]]*\]\([^)]+?)\/\)/g, '$1)');

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
            const lines = fixedContent.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();

              // Skip empty lines — just add spacing
              if (!trimmed) {
                doc.moveDown(0.4);
                continue;
              }

              // Inline images: ![alt](/skill-images/file.png)
              const imgMatch = trimmed.match(/^!\[([^\]]*)\]\((\/skill-images\/[^)]+)\)$/);
              if (imgMatch) {
                const imgPath = path.join(publicDir, imgMatch[2]);
                if (fs.existsSync(imgPath)) {
                  try {
                    // Check remaining page space — need at least 250pt for an image
                    if (doc.y > 500) doc.addPage();
                    doc.moveDown(0.5);
                    doc.image(imgPath, {
                      fit: [495, 300],
                      align: 'center',
                      valign: 'center',
                    });
                    doc.moveDown(0.5);
                    // Render alt text as caption if present
                    if (imgMatch[1]) {
                      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666')
                        .text(imgMatch[1], { align: 'center' });
                      doc.fillColor('#000000');
                      doc.moveDown(0.3);
                    }
                    logs.push(`[PDF] Embedded image: ${imgMatch[2]}`);
                  } catch (imgErr: any) {
                    logs.push(`[PDF] Failed to embed image ${imgMatch[2]}: ${imgErr.message}`);
                    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#999999')
                      .text(`[Image: ${imgMatch[1] || imgMatch[2]}]`, { align: 'center' });
                    doc.fillColor('#000000');
                  }
                } else {
                  logs.push(`[PDF] Image not found on disk: ${imgPath}`);
                  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#999999')
                    .text(`[Image: ${imgMatch[1] || imgMatch[2]}]`, { align: 'center' });
                  doc.fillColor('#000000');
                }
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

            // Listen for events BEFORE calling end() to avoid race conditions
            stream.on('error', reject);
            stream.on('finish', async () => {
              // Small delay to let the OS flush the file to disk
              await new Promise(r => setTimeout(r, 500));
              // Verify the file was actually written
              try {
                const stat = fs.statSync(filePath);
                logs.push(`[PDF] Written ${stat.size} bytes to ${safeName}`);
              } catch { /* ignore stat errors */ }
              resolve(`/skill-pdfs/${safeName}`);
            });
            doc.end();
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

      saveFile: async (content: string, filename: string, subDir?: string): Promise<string> => {
        try {
          const dir = subDir || 'skill-files';
          const targetDir = path.join(__dirname, '..', '..', 'public', dir);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

          const ts = Date.now();
          const rand = Math.random().toString(36).substr(2, 6);
          const ext = path.extname(filename) || '';
          const base = path.basename(filename, ext);
          const safeName = `${base.replace(/[^a-zA-Z0-9_-]/g, '_')}_${ts}_${rand}${ext}`;
          const filePath = path.join(targetDir, safeName);

          // Detect if content is base64 encoded (starts with data: or is pure base64)
          if (content.startsWith('data:')) {
            const b64 = content.split(',')[1] || '';
            fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
          } else {
            fs.writeFileSync(filePath, content, 'utf-8');
          }

          const stat = fs.statSync(filePath);
          logs.push(`[FILE] Written ${stat.size} bytes to ${dir}/${safeName}`);
          return `/${dir}/${safeName}`;
        } catch (err: any) {
          throw new Error(`Failed to save file: ${err.message}`);
        }
      },

      generateExcel: async (data: any, filename?: string): Promise<string> => {
        try {
          const excelDir = path.join(__dirname, '..', '..', 'public', 'skill-files');
          if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

          const ts = Date.now();
          const rand = Math.random().toString(36).substr(2, 6);
          const baseName = filename ? filename.replace(/\.xlsx$/i, '') : 'spreadsheet';
          const safeName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${ts}_${rand}.xlsx`;
          const filePath = path.join(excelDir, safeName);

          const workbook = new ExcelJS.Workbook();
          workbook.creator = 'Skill Agent';
          workbook.created = new Date();

          // Support single array or multi-sheet format
          const sheets = Array.isArray(data)
            ? [{ name: 'Sheet1', rows: data }]
            : (data.sheets || [{ name: 'Sheet1', rows: data.rows || data }]);

          for (const sheetDef of sheets) {
            const ws = workbook.addWorksheet(sheetDef.name || 'Sheet');
            const rows = sheetDef.rows || [];
            if (rows.length === 0) continue;

            // If rows are objects, extract headers from first row
            if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
              const headers = Object.keys(rows[0]);
              ws.addRow(headers);
              // Style header row
              ws.getRow(1).font = { bold: true };
              ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667EEA' } };
              ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
              for (const row of rows) {
                ws.addRow(headers.map(h => row[h] ?? ''));
              }
              // Auto-fit column widths
              headers.forEach((h, i) => {
                const col = ws.getColumn(i + 1);
                col.width = Math.max(h.length + 2, 12);
              });
            } else {
              // rows are arrays
              for (const row of rows) {
                ws.addRow(Array.isArray(row) ? row : [row]);
              }
            }
          }

          await workbook.xlsx.writeFile(filePath);
          const stat = fs.statSync(filePath);
          logs.push(`[EXCEL] Written ${stat.size} bytes to skill-files/${safeName}`);
          return `/skill-files/${safeName}`;
        } catch (err: any) {
          throw new Error(`Failed to generate Excel: ${err.message}`);
        }
      },

      sendEmail: async (to: string, subject: string, body: string, opts?: { html?: boolean; from?: string }): Promise<{ success: boolean; messageId?: string }> => {
        try {
          const smtpHost = (() => { try { const d = this.db.readSync(); const k = (d.apiKeys||[]).find((k:any)=>k.name==='smtp_host'); return k ? this.crypto.decrypt(k.value) : null; } catch { return null; } })();
          const smtpPort = (() => { try { const d = this.db.readSync(); const k = (d.apiKeys||[]).find((k:any)=>k.name==='smtp_port'); return k ? this.crypto.decrypt(k.value) : null; } catch { return null; } })();
          const smtpUser = (() => { try { const d = this.db.readSync(); const k = (d.apiKeys||[]).find((k:any)=>k.name==='smtp_user'); return k ? this.crypto.decrypt(k.value) : null; } catch { return null; } })();
          const smtpPass = (() => { try { const d = this.db.readSync(); const k = (d.apiKeys||[]).find((k:any)=>k.name==='smtp_pass'); return k ? this.crypto.decrypt(k.value) : null; } catch { return null; } })();

          if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('SMTP credentials not configured. Add smtp_host, smtp_user, smtp_pass in Settings -> API Keys.');
          }

          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '587', 10),
            secure: parseInt(smtpPort || '587', 10) === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const mailOptions: any = {
            from: opts?.from || smtpUser,
            to,
            subject,
          };
          if (opts?.html) {
            mailOptions.html = body;
          } else {
            mailOptions.text = body;
          }

          const info = await transporter.sendMail(mailOptions);
          logs.push(`[EMAIL] Sent to ${to}: ${info.messageId}`);
          return { success: true, messageId: info.messageId };
        } catch (err: any) {
          throw new Error(`Failed to send email: ${err.message}`);
        }
      },

      generateQR: async (text: string, opts?: { size?: number; filename?: string }): Promise<string> => {
        try {
          const qrDir = path.join(__dirname, '..', '..', 'public', 'skill-images');
          if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

          const ts = Date.now();
          const rand = Math.random().toString(36).substr(2, 6);
          const safeName = opts?.filename || `qr_${ts}_${rand}.png`;
          const filePath = path.join(qrDir, safeName);

          await QRCode.toFile(filePath, text, {
            width: opts?.size || 400,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });

          const stat = fs.statSync(filePath);
          logs.push(`[QR] Generated ${stat.size} bytes: skill-images/${safeName}`);
          return `/skill-images/${safeName}`;
        } catch (err: any) {
          throw new Error(`Failed to generate QR code: ${err.message}`);
        }
      },

      createZip: async (files: Array<{ name: string; content: string }>, filename?: string): Promise<string> => {
        try {
          const zipDir = path.join(__dirname, '..', '..', 'public', 'skill-files');
          if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir, { recursive: true });

          const ts = Date.now();
          const rand = Math.random().toString(36).substr(2, 6);
          const baseName = filename ? filename.replace(/\.zip$/i, '') : 'archive';
          const safeName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${ts}_${rand}.zip`;
          const filePath = path.join(zipDir, safeName);

          return new Promise<string>((resolve, reject) => {
            const output = fs.createWriteStream(filePath);
            const archive = archiver.default('zip', { zlib: { level: 9 } });

            output.on('close', () => {
              logs.push(`[ZIP] Created ${archive.pointer()} bytes: skill-files/${safeName}`);
              resolve(`/skill-files/${safeName}`);
            });
            archive.on('error', reject);
            archive.pipe(output);

            for (const file of files) {
              archive.append(file.content, { name: file.name });
            }
            archive.finalize();
          });
        } catch (err: any) {
          throw new Error(`Failed to create zip: ${err.message}`);
        }
      },
    };
  }


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
