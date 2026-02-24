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
  /** Optional: scopes this tool to a specific generated app */
  app_id?: number;
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

export type SkillCategory = 'inputs' | 'processing' | 'outputs' | 'other';

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
  /** Sidebar grouping: inputs | processing | outputs | other */
  category: SkillCategory;
  tags: string[];
  /** Optional: scopes this skill to a specific generated app */
  app_id?: number;
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
  /** Save arbitrary file content (text or base64) to public dir. Returns the download URL.
   *  subDir defaults to 'skill-files'. */
  saveFile: (content: string, filename: string, subDir?: string) => Promise<string>;
  /** Generate an Excel workbook from JSON data. Returns the download URL.
   *  data = array of objects or { sheets: [{ name, rows }] } */
  generateExcel: (data: any, filename?: string) => Promise<string>;
  /** Send an email via SMTP. Returns { success, messageId }. */
  sendEmail: (to: string, subject: string, body: string, opts?: { html?: boolean; from?: string }) => Promise<{ success: boolean; messageId?: string }>;
  /** Generate a QR code PNG image. Returns the local image URL. */
  generateQR: (text: string, opts?: { size?: number; filename?: string }) => Promise<string>;
  /** Create a zip archive from files. files = [{ name, content }]. Returns download URL. */
  createZip: (files: Array<{ name: string; content: string }>, filename?: string) => Promise<string>;
  /** Transcribe audio from a URL using OpenAI Whisper. Returns { text, language, duration }. */
  transcribeAudio: (audioUrl: string, opts?: { language?: string; prompt?: string }) => Promise<{ text: string; language?: string; duration?: number }>;
  /** Generate a Word (.docx) document from structured content. Returns download URL. */
  generateDocx: (content: { title?: string; sections: Array<{ heading?: string; body: string }> }, filename?: string) => Promise<string>;
  /** Edit/process an image (resize, crop, watermark, convert). Returns the output image URL. */
  editImage: (imageUrl: string, operations: { resize?: { width?: number; height?: number }; rotate?: number; flip?: boolean; flop?: boolean; grayscale?: boolean; blur?: number; watermark?: string; format?: 'png' | 'jpeg' | 'webp' }) => Promise<string>;
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
  /** Optional: scopes this run to a specific generated app */
  app_id?: number;
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
  app_id?: number;
}

export interface UpdateToolDto extends Partial<CreateToolDto> {}

export interface CreateSkillDto {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  inputs?: SkillParam[];
  credentials?: string[];
  category?: SkillCategory;
  tags?: string[];
  app_id?: number;
}

export interface UpdateSkillDto extends Partial<CreateSkillDto> {
  enabled?: boolean;
}

export interface RunSkillDto {
  /** Runtime input values keyed by param name */
  inputs?: Record<string, any>;
  /** Free-form instructions typed by the user before running */
  instructions?: string;
  /** Optional: scopes this run to a specific app */
  app_id?: number;
}

/** Progress event streamed to the frontend during a skill run */
export interface SkillProgressEvent {
  type: 'phase' | 'step' | 'tool-start' | 'tool-done' | 'info' | 'done' | 'error';
  message: string;
  /** Which phase we're in (e.g. "Phase 1 (content)", "Phase 2 (export)") */
  phase?: string;
  /** Tool name if relevant */
  tool?: string;
  /** Elapsed time in ms */
  elapsed?: number;
}

/** Callback for streaming progress events */
export type ProgressCallback = (event: SkillProgressEvent) => void;

// ── Capability system — atomic sub-skills that compose into pipelines ──

/** Pipeline position hint for ordering capabilities */
export type CapabilityPhase = 'input' | 'process' | 'output';

export interface CapabilityDef {
  /** .md filename in prompts/ directory */
  file: string;
  /** Tool names this capability needs */
  tools: string[];
  /** One-line description (shown to the planner) */
  description: string;
  /** Pipeline position hint */
  phase: CapabilityPhase;
}

/** Return type of buildPromptForTask() — everything the caller needs for ONE generateText() call */
export interface BuildPromptResult {
  /** Fully assembled system prompt (orchestrator + capability .md files + inputs) */
  systemPrompt: string;
  /** Filtered tool definitions for this task */
  tools: ToolDefinition[];
  /** Capability names selected by the planner, in execution order */
  capabilities: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY REGISTRY
// Maps capability names → description + required tools + prompt file
// These are the atomic "sub-skills" that can be composed in any order
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITY_REGISTRY: Record<string, CapabilityDef> = {
  research: {
    file: 'research.md',
    tools: ['brave-search'],
    description: 'Search the web and gather information on a topic',
    phase: 'input',
  },
  'deep-research': {
    file: 'deep-research.md',
    tools: ['brave-search', 'apify-scraper'],
    description: 'In-depth research using search and webpage scraping',
    phase: 'input',
  },
  'content-ideation': {
    file: 'content-ideation.md',
    tools: ['brave-search', 'apify-scraper'],
    description: 'Generate content ideas and topics based on research',
    phase: 'input',
  },
  enrich: {
    file: 'enrich.md',
    tools: ['brave-search', 'apify-scraper'],
    description: 'Research and compile a structured profile for a company, person, or domain',
    phase: 'input',
  },
  'write-article': {
    file: 'write-article.md',
    tools: [],
    description: 'Write a structured long-form article from research notes',
    phase: 'process',
  },
  summarise: {
    file: 'summarise.md',
    tools: [],
    description: 'Produce a concise summary of content',
    phase: 'process',
  },
  translate: {
    file: 'translate.md',
    tools: [],
    description: 'Translate content into another language',
    phase: 'process',
  },
  analyse: {
    file: 'analyse.md',
    tools: [],
    description: 'Analyse text for sentiment, classification, or insights',
    phase: 'process',
  },
  repurpose: {
    file: 'repurpose.md',
    tools: [],
    description: 'Adapt content for different platforms (Twitter, LinkedIn, etc.)',
    phase: 'process',
  },
  calculate: {
    file: 'calculate.md',
    tools: ['generate-csv'],
    description: 'Perform mathematical, statistical, or financial calculations',
    phase: 'process',
  },
  compliance: {
    file: 'compliance.md',
    tools: ['brave-search'],
    description: 'Check content against compliance regulations or policy rules',
    phase: 'process',
  },
  validate: {
    file: 'validate.md',
    tools: ['generate-csv', 'generate-json'],
    description: 'Validate, clean, and format structured data',
    phase: 'process',
  },
  compare: {
    file: 'compare.md',
    tools: [],
    description: 'Compare two document versions and produce a diff/redline',
    phase: 'process',
  },
  template: {
    file: 'template.md',
    tools: [],
    description: 'Fill templates with data — mail merge and variable substitution',
    phase: 'process',
  },
  deduplicate: {
    file: 'deduplicate.md',
    tools: ['generate-csv', 'generate-json'],
    description: 'Find and merge duplicate records in a dataset',
    phase: 'process',
  },
  'generate-image': {
    file: 'generate-image.md',
    tools: ['generate-image'],
    description: 'Generate ONE AI image that complements the content',
    phase: 'output',
  },
  'render-pdf': {
    file: 'render-pdf.md',
    tools: ['generate-pdf'],
    description: 'Export the finished content as a downloadable PDF',
    phase: 'output',
  },
  'render-csv': {
    file: 'generate-csv.md',
    tools: ['generate-csv'],
    description: 'Export structured data as a downloadable CSV file',
    phase: 'output',
  },
  'render-html': {
    file: 'generate-html.md',
    tools: ['generate-html'],
    description: 'Generate a complete styled HTML page',
    phase: 'output',
  },
  'render-qr': {
    file: 'generate-qr.md',
    tools: ['generate-qrcode'],
    description: 'Generate a QR code image',
    phase: 'output',
  },
  'send-email': {
    file: 'send-email.md',
    tools: ['send-email'],
    description: 'Compose and send an email',
    phase: 'output',
  },
  'render-excel': {
    file: 'generate-excel.md',
    tools: ['generate-excel'],
    description: 'Export data as a downloadable Excel (.xlsx) spreadsheet',
    phase: 'output',
  },
  'render-tts': {
    file: 'generate-tts.md',
    tools: ['text-to-speech'],
    description: 'Convert text to spoken audio (MP3)',
    phase: 'output',
  },
  'render-vcard': {
    file: 'generate-vcard.md',
    tools: ['generate-vcard'],
    description: 'Generate a downloadable vCard (.vcf) contact file',
    phase: 'output',
  },
  'render-zip': {
    file: 'generate-zip.md',
    tools: ['create-zip'],
    description: 'Bundle multiple files into a downloadable ZIP archive',
    phase: 'output',
  },
  'generate-ics': {
    file: 'generate-ics.md',
    tools: ['generate-ics'],
    description: 'Create downloadable iCalendar (.ics) event files',
    phase: 'output',
  },
  'send-webhook': {
    file: 'send-webhook.md',
    tools: ['send-webhook'],
    description: 'Send data to external APIs and webhooks via HTTP',
    phase: 'output',
  },
  'transcribe-audio': {
    file: 'transcribe-audio.md',
    tools: ['transcribe-audio'],
    description: 'Transcribe audio/video files to text using Whisper',
    phase: 'input',
  },
  'render-docx': {
    file: 'generate-docx.md',
    tools: ['generate-docx'],
    description: 'Generate a Word document (.docx) with formatted content',
    phase: 'output',
  },
  'send-chat-message': {
    file: 'send-chat-message.md',
    tools: ['send-chat-message'],
    description: 'Send messages to Slack, Teams, or Discord',
    phase: 'output',
  },
  'edit-image': {
    file: 'edit-image.md',
    tools: ['edit-image'],
    description: 'Edit/process images: resize, rotate, watermark, convert, effects',
    phase: 'process',
  },
};

// ── Mapping from tool names to capability names ───────────────────────────
// Used to infer capabilities from a skill's tool list when planner is unavailable
export const TOOL_TO_CAPABILITY: Record<string, string> = {
  'brave-search': 'research',
  'apify-scraper': 'deep-research',
  'generate-image': 'generate-image',
  'generate-pdf': 'render-pdf',
  'generate-csv': 'render-csv',
  'generate-html': 'render-html',
  'generate-html-page': 'render-html',
  'generate-qrcode': 'render-qr',
  'generate-qr': 'render-qr',
  'send-email': 'send-email',
  'generate-json': 'validate',
  'generate-excel': 'render-excel',
  'text-to-speech': 'render-tts',
  'generate-vcard': 'render-vcard',
  'create-zip': 'render-zip',
  'generate-ics': 'generate-ics',
  'send-webhook': 'send-webhook',
  'transcribe-audio': 'transcribe-audio',
  'generate-docx': 'render-docx',
  'send-chat-message': 'send-chat-message',
  'edit-image': 'edit-image',
  'merge-pdfs': 'render-pdf',
};

// ── Known skill archetypes → default capability pipelines ─────────────────
// Fallback capability orderings for well-known skill types.
// Used when the planner is skipped (no AI key) or as a hint.
export const SKILL_ARCHETYPE: Record<string, string[]> = {
  'web-research':       ['research', 'write-article', 'render-pdf'],
  'content-writer':     ['research', 'write-article', 'generate-image', 'render-pdf'],
  'llm-content-writer': ['research', 'write-article', 'generate-image', 'render-pdf'],
  'deep-research':      ['deep-research', 'write-article', 'render-pdf'],
  'content-ideator':    ['deep-research', 'content-ideation', 'render-pdf'],
  'image-creator':      ['generate-image'],
  'text-summariser':    ['summarise', 'render-pdf'],
  'sentiment-analyser': ['analyse', 'render-pdf'],
  'translator':         ['translate', 'render-pdf'],
  'content-repurposer': ['research', 'repurpose', 'render-pdf'],
  'classifier-router':  ['analyse', 'render-pdf'],
  'data-enrichment':    ['enrich', 'render-pdf'],
  'template-filler':    ['template', 'render-pdf'],
  'calculator':         ['calculate', 'render-csv'],
  'compliance-checker': ['research', 'compliance', 'render-pdf'],
  'data-validator':     ['validate', 'render-csv'],
  'document-comparator': ['compare', 'render-pdf'],
  'knowledge-qa':       ['deep-research', 'write-article'],
  'price-comparator':   ['deep-research', 'analyse', 'render-pdf'],
  'proposal-generator': ['write-article', 'render-pdf', 'render-excel'],
  'html-generator':     ['render-html'],
  'html-page-generator': ['render-html'],
  'qr-generator':       ['render-qr'],
  'qr-code-generator':  ['render-qr', 'render-vcard'],
  'email-composer':     ['research', 'send-email'],
  'deduplicator':       ['deduplicate', 'render-csv'],
  'deduplication-engine': ['deduplicate', 'render-csv'],
  'approval-router':    ['analyse'],
  'vcard-generator':    ['render-vcard'],
  'contact-card-generator': ['render-vcard', 'render-qr', 'render-zip'],
  'webhook-sender':     ['validate'],
  'excel-report-generator': ['research', 'render-excel', 'render-pdf'],
  'text-to-speech':     ['render-tts'],
  'archive-creator':    ['render-zip', 'render-html', 'render-csv', 'render-vcard'],
  'dashboard-generator': ['research', 'deep-research', 'render-html', 'render-excel', 'render-pdf'],
  'social-media-pack':  ['research', 'generate-image', 'render-pdf', 'render-csv'],
  'content-calendar':   ['content-ideation', 'render-csv'],
  'calendar-event-creator': ['generate-ics'],
  'webhook-pusher':     ['send-webhook'],
  'file-format-converter': ['render-pdf', 'render-csv', 'render-excel', 'render-html', 'render-docx'],
  'audio-transcriber':  ['transcribe-audio', 'render-pdf', 'render-docx'],
  'word-doc-generator': ['research', 'write-article', 'render-docx'],
  'chat-message-sender': ['send-chat-message'],
  'task-creator':       ['send-webhook'],
  'email-parser':       ['analyse', 'render-csv', 'render-excel'],
  'document-merger':    ['render-pdf', 'render-docx', 'render-zip'],
  'image-editor':       ['edit-image'],
  'invoice-generator':  ['calculate', 'render-pdf', 'render-excel'],
  'meeting-notes':      ['transcribe-audio', 'summarise', 'render-pdf', 'send-email'],
  'seo-auditor':        ['deep-research', 'analyse', 'render-pdf', 'render-html'],
  'lead-scorer':        ['enrich', 'analyse', 'render-csv', 'render-excel'],
  'competitor-analyzer': ['deep-research', 'analyse', 'render-pdf', 'render-excel'],
};
