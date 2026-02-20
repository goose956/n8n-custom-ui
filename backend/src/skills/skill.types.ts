/**
 * Skill System v2 — Two-layer Agent Architecture
 *
 * TOOLS:  Executable TypeScript/JS functions that do one specific thing
 *         (e.g., brave_search, send_email, scrape_url)
 *
 * SKILLS: System prompts (markdown) that tell the AI how to think +
 *         which tools it can use (e.g., web_research uses brave_search)
 *
 * RUNTIME: Agentic loop — AI reasons, calls tools, gets results, loops
 *          until it has a final answer.
 */

// ── Tool — executable code the AI can call ────────────────────────────

export interface ToolDefinition {
  id: string;
  /** kebab-case identifier, e.g. "brave-search" */
  name: string;
  /** Shown to the AI so it knows when to use this tool */
  description: string;
  /** Input parameters the tool accepts */
  parameters: ToolParam[];
  /** JS function body: receives (params, ctx), must return a value */
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

// ── Skill — system prompt + tool declarations ─────────────────────────

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  /** Markdown system prompt — the "brain" instructions for the AI */
  prompt: string;
  /** Tool names this skill can use, e.g. ["brave-search"] */
  tools: string[];
  /** Input parameters the user provides when running */
  inputs: SkillParam[];
  /** Credential names needed (e.g. 'brave', 'openai') */
  credentials: string[];
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

// ── Execution context for tools ───────────────────────────────────────

export interface ToolContext {
  /** Get a decrypted credential value by key name */
  getCredential: (name: string) => string | null;
  /** Make an HTTP request — returns { status, body, headers } */
  fetch: (url: string, opts?: any) => Promise<{ status: number; body: any; headers: Record<string, string> }>;
  /** Log a message (appears in run output) */
  log: (message: string) => void;
  /** Save a remote image to local storage and return the permanent local URL */
  saveImage: (remoteUrl: string, filename?: string) => Promise<string>;
  /** Convert markdown/text content to PDF and save it. Returns the download URL. */
  savePdf: (content: string, title?: string, filename?: string) => Promise<string>;
}

// ── Run results ───────────────────────────────────────────────────────

export interface SkillRunResult {
  id: string;
  skillId: string;
  status: 'success' | 'error';
  /** The AI's final text response */
  output: string;
  /** Step-by-step log of the agentic loop */
  logs: string[];
  /** Record of every tool call made during the run */
  toolCalls: ToolCallLog[];
  duration: number;
  startedAt: string;
  error?: string;
}

export interface ToolCallLog {
  toolName: string;
  input: any;
  output: any;
  duration: number;
}

// ── API DTOs ──────────────────────────────────────────────────────────

export interface CreateToolDto {
  name: string;
  description: string;
  parameters?: ToolParam[];
  code: string;
}

export interface UpdateToolDto extends Partial<CreateToolDto> {}

export interface CreateSkillDto {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  inputs?: SkillParam[];
  credentials?: string[];
  tags?: string[];
}

export interface UpdateSkillDto extends Partial<CreateSkillDto> {
  enabled?: boolean;
}

export interface RunSkillDto {
  /** Runtime input values keyed by param name */
  inputs?: Record<string, any>;
}
