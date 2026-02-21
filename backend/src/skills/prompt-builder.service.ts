/**
 * PromptBuilderService — Dynamic three-layer prompt assembly
 *
 * Layer 1: PLANNER — cheap AI call to determine which capabilities are needed
 * Layer 2: ASSEMBLER — stitch orchestrator + capability .md files into one prompt
 * Layer 3: TOOL FILTER — only expose tools required by selected capabilities
 *
 * The skill's own .prompt field provides additional context/goals.
 * The orchestrator enforces structure, phase ordering, and completion checks.
 * Each capability .md file provides detailed "how to do this" instructions.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  ToolDefinition,
  SkillDefinition,
  BuildPromptResult,
  CapabilityDef,
  CAPABILITY_REGISTRY,
  TOOL_TO_CAPABILITY,
  SKILL_ARCHETYPE,
} from './skill.types';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const PROMPTS_DIR = path.join(__dirname, 'prompts');

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  //  LAYER 1: PLANNER
  //  Cheap AI call to determine which capabilities are needed + order
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Given a task description (user inputs + instructions + skill context),
   * determine which capabilities are needed and in what order.
   *
   * Uses the skill archetype as a hint, then the AI planner refines.
   * Falls back to archetype-only if no AI key is available.
   */
  async planCapabilities(
    skill: SkillDefinition,
    userInputs: Record<string, any>,
    instructions?: string,
  ): Promise<string[]> {
    // Start with archetype if known
    const archetype = SKILL_ARCHETYPE[skill.name];

    // Build description of the task
    const inputSummary = Object.entries(userInputs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const taskDescription = [
      `Skill: ${skill.name} — ${skill.description}`,
      inputSummary ? `Inputs: ${inputSummary}` : '',
      instructions ? `User instructions: ${instructions}` : '',
    ].filter(Boolean).join('\n');

    // Try AI planner for best results
    const apiKey = this.getKey('openrouter') || this.getKey('openai');
    if (apiKey) {
      try {
        const planned = await this.callPlanner(taskDescription, apiKey);
        if (planned.length > 0) {
          this.logger.log(`Planner selected: [${planned.join(', ')}]`);
          return planned;
        }
      } catch (err: any) {
        this.logger.warn(`Planner failed: ${err.message}, falling back to archetype`);
      }
    }

    // Fallback: use archetype or infer from skill tools
    if (archetype) {
      this.logger.log(`Using archetype for ${skill.name}: [${archetype.join(', ')}]`);
      return archetype;
    }

    // Last resort: infer from tool list
    return this.inferFromTools(skill);
  }

  private async callPlanner(task: string, apiKey: string): Promise<string[]> {
    const capDescriptions = Object.entries(CAPABILITY_REGISTRY)
      .map(([name, cap]) => `- ${name}: ${cap.description}`)
      .join('\n');

    const isOpenRouter = this.getKey('openrouter') === apiKey;
    const baseURL = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';

    const resp = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: 'gpt-4o-mini',
        max_tokens: 256,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are a task planner. Given a task description, return ONLY a JSON array of capability names in execution order. Choose from the available capabilities. Return nothing but the JSON array — no markdown, no explanation.`,
          },
          {
            role: 'user',
            content: `Task:\n${task}\n\nAvailable capabilities:\n${capDescriptions}\n\nReturn a JSON array of capability names in the order they should be executed.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    let raw = resp.data.choices?.[0]?.message?.content?.trim() || '';

    // Strip markdown fences if present
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Validate — only return capabilities we actually have
    return parsed.filter((name: string) => name in CAPABILITY_REGISTRY);
  }

  /**
   * Infer capabilities from a skill's tool list (fallback when planner unavailable)
   */
  private inferFromTools(skill: SkillDefinition): string[] {
    const caps: string[] = [];
    const seen = new Set<string>();

    // Map tools → capabilities, maintaining phase order
    const byPhase: Record<string, string[]> = { input: [], process: [], output: [] };

    for (const toolName of skill.tools) {
      const capName = TOOL_TO_CAPABILITY[toolName];
      if (capName && !seen.has(capName)) {
        seen.add(capName);
        const cap = CAPABILITY_REGISTRY[capName];
        byPhase[cap.phase].push(capName);
      }
    }

    // If we have input tools (search) but no explicit process step,
    // assume the user wants an article written
    if (byPhase.input.length > 0 && byPhase.process.length === 0) {
      byPhase.process.push('write-article');
    }

    caps.push(...byPhase.input, ...byPhase.process, ...byPhase.output);

    this.logger.log(`Inferred from tools [${skill.tools.join(', ')}]: [${caps.join(', ')}]`);
    return caps;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LAYER 2: ASSEMBLER
  //  Stitch orchestrator + capability .md files into final system prompt
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Build the complete system prompt from:
   * 1. Base orchestrator (always included)
   * 2. Each capability's .md file, in execution order
   * 3. The skill's own prompt (additional context/goals)
   * 4. User inputs and instructions
   */
  buildSystemPrompt(
    capabilities: string[],
    skill: SkillDefinition,
    userInputs: Record<string, any>,
    instructions?: string,
  ): string {
    const parts: string[] = [];

    // 1. Base orchestrator
    const orchestratorPath = path.join(PROMPTS_DIR, 'orchestrator.md');
    if (fs.existsSync(orchestratorPath)) {
      parts.push(fs.readFileSync(orchestratorPath, 'utf-8'));
    } else {
      this.logger.warn('orchestrator.md not found, using inline fallback');
      parts.push(this.inlineOrchestrator());
    }

    // 2. Capability instructions (the phases)
    if (capabilities.length === 0) {
      // General-purpose fallback — no specific capabilities matched
      parts.push('\n---\n# General Assistant Mode\n');
      parts.push(
        `No specific capability pipeline was selected. ` +
        `You are a helpful general-purpose assistant. ` +
        `Use any available tools as needed to fulfil the user's request. ` +
        `Think step by step and provide a thorough, well-formatted answer.\n`,
      );
    } else {
      parts.push('\n---\n# Your Phases For This Task\n');
      parts.push(
        `Execute these phases **in the order listed**. ` +
        `Complete each phase fully before starting the next.\n`,
      );
    }

    for (let i = 0; i < capabilities.length; i++) {
      const capName = capabilities[i];
      const cap = CAPABILITY_REGISTRY[capName];
      if (!cap) continue;

      const mdPath = path.join(PROMPTS_DIR, cap.file);
      if (fs.existsSync(mdPath)) {
        const content = fs.readFileSync(mdPath, 'utf-8');
        parts.push(`\n---\n## Phase ${i + 1}: ${capName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n`);
        parts.push(content);
      } else {
        parts.push(
          `\n---\n## Phase ${i + 1}: ${capName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n` +
          `${cap.description}. ${cap.tools.length ? `Use the ${cap.tools.join(', ')} tool(s).` : 'No tools needed — pure text generation.'}\n`
        );
      }
    }

    // 3. Skill-specific context (the user's prompt from the skill definition)
    if (skill.prompt?.trim()) {
      parts.push('\n---\n# Additional Context From Skill Definition\n');
      parts.push(skill.prompt);
    }

    // 4. User inputs and instructions
    const inputSummary = Object.entries(userInputs)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join('\n');

    const userInputDescription = skill.inputs
      .map(i => `- ${i.name} (${i.type}): ${i.description}`)
      .join('\n');

    parts.push('\n---\n# Task Inputs\n');
    parts.push(inputSummary || '(none provided)');

    if (userInputDescription) {
      parts.push(`\nInput definitions:\n${userInputDescription}`);
    }

    if (instructions?.trim()) {
      parts.push(`\n---\n# User Instructions (follow these closely)\n${instructions}`);
    }

    parts.push('\n---\nIMPORTANT: Your final message MUST contain the FULL generated content. Never summarise or truncate — include every word.');

    return parts.join('\n');
  }

  private inlineOrchestrator(): string {
    return `# Orchestrator Rules

You are a task execution agent. Execute each phase in order. Do not skip ahead.

Rules:
- Never invent facts — only use information from tool results
- Retry failed tools once before giving up
- Your final response must contain ALL deliverables in full
- Complete each phase before starting the next`;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LAYER 3: TOOL FILTER
  //  Only expose tools needed by the selected capabilities
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Collect only the tool definitions needed for the selected capabilities.
   * Returns them partitioned by phase for optional multi-phase execution.
   */
  getRequiredTools(
    capabilities: string[],
    allTools: ToolDefinition[],
  ): { all: ToolDefinition[]; byPhase: Map<string, ToolDefinition[]> } {
    // General-purpose fallback: no capabilities → give ALL tools
    if (capabilities.length === 0) {
      return { all: [...allTools], byPhase: new Map() };
    }

    const allNeeded = new Set<string>();
    const byPhase = new Map<string, ToolDefinition[]>();

    for (const capName of capabilities) {
      const cap = CAPABILITY_REGISTRY[capName];
      if (!cap) continue;

      const phaseTools: ToolDefinition[] = [];
      for (const toolName of cap.tools) {
        allNeeded.add(toolName);
        const tool = allTools.find(t => t.name === toolName);
        if (tool) phaseTools.push(tool);
      }
      byPhase.set(capName, phaseTools);
    }

    const all = allTools.filter(t => allNeeded.has(t.name));
    return { all, byPhase };
  }

  // partitionPhases() removed — single prompt, single call architecture

  // ═══════════════════════════════════════════════════════════════════
  //  ENTRY POINT: build_prompt_for_task
  //  Single method that orchestrates all three layers.
  //  Caller makes ONE generateText() call with the returned prompt+tools.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Main entry point — mirrors the Python outline exactly:
   *   skill_names = plan_skills(task)
   *   system_prompt = build_system_prompt(skill_names)
   *   tools = get_required_tools(skill_names, all_tool_definitions)
   *   return { system_prompt, tools, skill_names }
   *
   * The caller just does ONE generateText() call with everything.
   */
  async buildPromptForTask(
    task: string,
    allTools: ToolDefinition[],
    skill?: SkillDefinition,
    userInputs?: Record<string, any>,
    instructions?: string,
  ): Promise<BuildPromptResult> {
    // Provide a minimal virtual skill if none given (freeform chat)
    const effectiveSkill: SkillDefinition = skill || {
      id: 'chat',
      name: 'chat',
      description: 'Freeform chat — capabilities determined by planner',
      prompt: '',
      tools: allTools.map(t => t.name),
      inputs: [],
      credentials: [],
      enabled: true,
      category: 'other' as const,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const inputs = userInputs || {};

    // LAYER 1 — PLANNER: determine capabilities
    const capabilities = await this.planCapabilities(
      effectiveSkill,
      inputs,
      instructions || task,
    );
    this.logger.log(`Planner → [${capabilities.join(', ')}]`);

    // LAYER 2 — ASSEMBLER: stitch ONE prompt from ALL capabilities
    const systemPrompt = this.buildSystemPrompt(
      capabilities,
      effectiveSkill,
      inputs,
      instructions || task,
    );

    // LAYER 3 — TOOL FILTER: collect tools for ALL capabilities
    const { all: tools } = this.getRequiredTools(capabilities, allTools);

    return { systemPrompt, tools, capabilities };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════════

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
}
