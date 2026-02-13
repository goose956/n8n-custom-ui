import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

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

export interface MembersAreaPage {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'profile' | 'support' | 'settings' | 'custom';
  required: boolean;
}

export interface BackendTask {
  id: string;
  category: 'database' | 'api' | 'integration' | 'security' | 'data';
  title: string;
  description: string;
  status: 'pending' | 'done' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  implementation?: {
    type: 'db_seed' | 'api_route' | 'config' | 'schema';
    payload: Record<string, any>;
  };
}

export interface QaIssue {
  id: string;
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  category: 'import' | 'type' | 'logic' | 'style' | 'naming' | 'api' | 'missing';
  title: string;
  description: string;
  autoFix?: string;
}

interface GenerateRequest {
  prompt: string;
  targetType?: 'page' | 'component' | 'feature' | 'full-stack' | 'members-area';
  appId?: number;
  orchestratorModel?: string;
  subAgentModel?: string;
  conversationHistory?: { role: string; content: string }[];
  pages?: MembersAreaPage[];
}

export interface GenerateResponse {
  success: boolean;
  plan: PlanStep[];
  files: GeneratedFile[];
  summary: string;
  tokensUsed: { orchestrator: number; subAgent: number; total: number };
  modelsUsed: { orchestrator: string; subAgent: string };
  suggestedPages?: MembersAreaPage[];
  apiKeysNeeded?: { key: string; reason: string; configured: boolean }[];
  searchResults?: { query: string; results: { title: string; url: string; description: string }[] }[];
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
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', tier: 'orchestrator', costPer1kTokens: 0.075 },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', tier: 'both', costPer1kTokens: 0.015 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'both', costPer1kTokens: 0.01 },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', tier: 'sub-agent', costPer1kTokens: 0.00125 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'sub-agent', costPer1kTokens: 0.00075 },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'both', costPer1kTokens: 0.015 },
];

const DEFAULT_ORCHESTRATOR = 'claude-sonnet-4-20250514';
const DEFAULT_SUB_AGENT = 'claude-3-haiku-20240307';

// Token limits per model tier — Opus can output much more
const MAX_TOKENS: Record<string, number> = {
  'claude-opus-4-20250514': 16384,
  'claude-sonnet-4-20250514': 8192,
  'claude-3-5-sonnet-20241022': 8192,
  'gpt-4o': 8192,
  'claude-3-haiku-20240307': 4096,
  'gpt-4o-mini': 4096,
};

// Estimated tokens per page for cost calculation
const EST_TOKENS_PER_PAGE: Record<string, number> = {
  dashboard: 3500,
  custom: 3000,
  profile: 2000,
  support: 2000,
  settings: 2000,
};

// ─── Default members area pages ─────────────────────────────────────────────

const DEFAULT_MEMBERS_PAGES: MembersAreaPage[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard overview with stats, recent activity, and quick actions', type: 'dashboard', required: true },
  { id: 'profile', name: 'Profile', description: 'User profile management with avatar, bio, and account details', type: 'profile', required: true },
  { id: 'support', name: 'Support', description: 'Help center with FAQ, ticket submission, and contact options', type: 'support', required: true },
  { id: 'settings', name: 'Settings', description: 'Account settings, notifications, privacy, and preferences', type: 'settings', required: true },
];

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgrammerAgentService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ─── API key helpers ───────────────────────────────────────────────────────

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

  /** Check what API keys are needed and which are already configured */
  checkApiKeys(): { key: string; reason: string; configured: boolean }[] {
    return [
      { key: 'anthropic', reason: 'AI code generation (primary)', configured: !!this.getApiKey('anthropic') },
      { key: 'openai', reason: 'AI code generation (alternative)', configured: !!this.getApiKey('openai') },
      { key: 'brave', reason: 'Web search for documentation & research', configured: !!this.getApiKey('brave') },
      { key: 'apify', reason: 'Data scraping and web automation', configured: !!this.getApiKey('apify') },
    ];
  }

  // ─── AI call routing ──────────────────────────────────────────────────────

  private async callAI(
    modelId: string,
    systemPrompt: string,
    userPrompt: string,
    history: { role: string; content: string }[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    const model = this.getModelConfig(modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);

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

    const maxTokens = MAX_TOKENS[model] || 8192;
    const startTime = Date.now();

    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model, max_tokens: maxTokens, system: systemPrompt, messages },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 240000,
      },
    );

    const content = res.data.content?.[0]?.text || '';
    const tokensIn = res.data.usage?.input_tokens || 0;
    const tokensOut = res.data.usage?.output_tokens || 0;
    const tokensUsed = tokensIn + tokensOut;
    await this.trackCost('anthropic', model, tokensIn, tokensOut, Date.now() - startTime, 'programmer-agent');
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

    const maxTokens = MAX_TOKENS[model] || 8192;
    const startTime = Date.now();

    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages, max_tokens: maxTokens },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 240000,
      },
    );

    const content = res.data.choices?.[0]?.message?.content || '';
    const tokensIn = res.data.usage?.prompt_tokens || 0;
    const tokensOut = res.data.usage?.completion_tokens || 0;
    const tokensUsed = tokensIn + tokensOut;
    await this.trackCost('openai', model, tokensIn, tokensOut, Date.now() - startTime, 'programmer-agent');
    return { content, tokensUsed };
  }

  // ─── Brave Search ─────────────────────────────────────────────────────────

  async searchBrave(query: string, count = 5): Promise<{ title: string; url: string; description: string }[]> {
    const key = this.getApiKey('brave');
    if (!key) return [];

    try {
      const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: { q: query, count },
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': key,
        },
        timeout: 15000,
      });

      return (res.data.web?.results || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        description: r.description || '',
      }));
    } catch {
      return [];
    }
  }

  // ─── Apify helper ─────────────────────────────────────────────────────────

  async runApifyScraper(actorId: string, input: Record<string, any>): Promise<any[]> {
    const token = this.getApiKey('apify');
    if (!token) return [];

    try {
      const runRes = await axios.post(
        `https://api.apify.com/v2/acts/${actorId}/runs`,
        input,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { waitForFinish: 120 },
          timeout: 130000,
        },
      );

      const datasetId = runRes.data?.data?.defaultDatasetId;
      if (!datasetId) return [];

      const dataRes = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { format: 'json', limit: 50 },
          timeout: 30000,
        },
      );

      return dataRes.data || [];
    } catch {
      return [];
    }
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

      const appPages = (data.pages || []).filter((p: any) => p.app_id === appId);
      const pagesSummary = appPages.map((p: any) => {
        const css = p.custom_css ? `\n    Custom CSS: ${p.custom_css.slice(0, 300)}` : '';
        const colors = this.extractColorsFromContent(p.content_json);
        const colorInfo = colors.length > 0 ? `\n    Colors used: ${colors.join(', ')}` : '';
        return `  - ${p.title} (${p.page_type})${colorInfo}${css}`;
      }).join('\n');

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

  private extractColorsFromContent(obj: any, found: Set<string> = new Set()): string[] {
    if (!obj || typeof obj !== 'object') return [];
    const hexPattern = /#[0-9a-fA-F]{6}/g;
    const json = JSON.stringify(obj);
    const matches = json.match(hexPattern);
    if (matches) matches.forEach(c => found.add(c.toLowerCase()));
    return Array.from(found).slice(0, 12);
  }

  private deriveSecondary(hex: string): string {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const nr = Math.min(255, Math.max(0, Math.round(r * 0.7 + b * 0.3)));
      const ng = Math.min(255, Math.max(0, Math.round(g * 0.6)));
      const nb = Math.min(255, Math.max(0, Math.round(b * 0.8 + r * 0.2)));
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    } catch {
      return '#764ba2';
    }
  }

  // ─── Plan the members area ────────────────────────────────────────────────

  async planMembersArea(
    prompt: string,
    appId?: number,
    orchestratorModel?: string,
  ): Promise<{ success: boolean; pages: MembersAreaPage[]; apiKeysNeeded: { key: string; reason: string; configured: boolean }[]; searchResults: any[]; error?: string }> {
    const model = orchestratorModel || DEFAULT_ORCHESTRATOR;

    const apiKeysNeeded = this.checkApiKeys();
    const hasAI = apiKeysNeeded.find(k => k.key === 'anthropic')?.configured || apiKeysNeeded.find(k => k.key === 'openai')?.configured;

    if (!hasAI) {
      return {
        success: false,
        pages: [],
        apiKeysNeeded,
        searchResults: [],
        error: 'No AI API key configured. Add Anthropic or OpenAI key in Settings.',
      };
    }

    // Search for relevant documentation if Brave is available
    let searchResults: any[] = [];
    const hasBrave = !!this.getApiKey('brave');
    if (hasBrave) {
      try {
        const searchQuery = `${prompt} members area dashboard react best practices`;
        const results = await this.searchBrave(searchQuery, 5);
        if (results.length > 0) {
          searchResults = [{ query: searchQuery, results }];
        }
      } catch { /* non-critical */ }
    }

    const appContext = this.getAppContext(appId);
    const searchContext = searchResults.length > 0
      ? `\n\nWEB RESEARCH RESULTS:\n${searchResults[0].results.map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.description}`).join('\n')}`
      : '';

    const planPrompt = `You are planning a members area for a web application. The user wants:

${prompt}

${appContext}
${searchContext}

The minimum required pages are:
1. Dashboard - Main overview page with stats, activity, quick actions
2. Profile - User profile management
3. Support - Help/FAQ/ticket system
4. Settings - Account settings and preferences

Based on the user's description, suggest additional pages that would be needed. Think about what content and features the members area should have.

Return ONLY a JSON array of pages. Each page:
- id: lowercase slug (e.g., "courses", "billing")
- name: Display name
- description: What this page contains and does (be specific)
- type: "dashboard" | "profile" | "support" | "settings" | "custom"
- required: true for the 4 core pages, false for extras

Include the 4 required pages plus any additional pages that make sense for this specific app.

Return ONLY the JSON array. No explanation, no markdown fences.`;

    try {
      const result = await this.callAI(model, 'You are a senior UX architect planning members area pages for a SaaS application. Return only valid JSON.', planPrompt);

      let pages = DEFAULT_MEMBERS_PAGES;
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          pages = parsed.map((p: any) => ({
            id: p.id || 'custom',
            name: p.name || 'Page',
            description: p.description || '',
            type: p.type || 'custom',
            required: !!p.required,
          }));
        }
      } catch { /* use defaults */ }

      return { success: true, pages, apiKeysNeeded, searchResults };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, pages: DEFAULT_MEMBERS_PAGES, apiKeysNeeded, searchResults, error: message };
    }
  }

  // ─── Generate members area (multi-page) ───────────────────────────────────

  async generateMembersArea(request: GenerateRequest): Promise<GenerateResponse> {
    const orchestratorModel = request.orchestratorModel || DEFAULT_ORCHESTRATOR;
    const subAgentModel = request.subAgentModel || DEFAULT_SUB_AGENT;
    const pages = request.pages || DEFAULT_MEMBERS_PAGES;

    let totalOrchestratorTokens = 0;
    let totalSubAgentTokens = 0;
    const allFiles: GeneratedFile[] = [];
    const allPlanSteps: PlanStep[] = [];
    const searchResults: any[] = [];

    const apiKeysNeeded = this.checkApiKeys();

    try {
      // Step 0: Web research if Brave is available
      const hasBrave = !!this.getApiKey('brave');
      if (hasBrave) {
        const queries = [
          `${request.prompt} react members area`,
          `react dashboard profile settings page MUI`,
        ];
        for (const q of queries) {
          const results = await this.searchBrave(q, 3);
          if (results.length > 0) {
            searchResults.push({ query: q, results });
          }
        }
      }

      const searchContext = searchResults.length > 0
        ? `\n\nWEB RESEARCH (use for inspiration and best practices):\n${searchResults.flatMap(s => s.results).map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.description}`).join('\n')}`
        : '';

      // Step 1: Generate shared types + navigation layout with sub-agent
      allPlanSteps.push({
        id: 1,
        title: 'Shared types & layout',
        description: 'Generate TypeScript interfaces, shared types, and navigation sidebar layout',
        agent: 'sub-agent',
        status: 'running',
      });

      const pagesDescription = pages.map(p => `- ${p.name} (${p.id}): ${p.description}`).join('\n');

      let sharedCode = '';
      try {
        const sharedResult = await this.callAI(
          subAgentModel,
          `You are a TypeScript expert. Generate clean shared types and a sidebar navigation component for a members area.\n${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}`,
          `Generate two files for a members area with these pages:\n${pagesDescription}\n\nFile 1: TypeScript interfaces and types for all the data structures needed across the members area.\nFile 2: A MembersLayout component that has a left sidebar navigation with links to each page, and a main content area. The sidebar should highlight the active page. Use MUI components.\n\nUse the ===FILE: path=== / ===END_FILE=== format.\n\nReturn ONLY the code. No explanations.`,
        );
        totalSubAgentTokens += sharedResult.tokensUsed;
        sharedCode = sharedResult.content;
        const sharedFiles = this.parseFiles(sharedResult.content);
        allFiles.push(...sharedFiles);
        allPlanSteps[0].status = 'complete';
      } catch {
        allPlanSteps[0].status = 'failed';
      }

      // Step 2: Generate each page
      const complexPageTypes = ['dashboard', 'custom'];
      let stepId = 2;

      for (const page of pages) {
        const isComplex = complexPageTypes.includes(page.type);
        const agent = isComplex ? 'orchestrator' : 'sub-agent';
        const model = isComplex ? orchestratorModel : subAgentModel;

        const step: PlanStep = {
          id: stepId++,
          title: `${page.name} page`,
          description: page.description,
          agent,
          status: 'running',
        };
        allPlanSteps.push(step);

        try {
          const pagePrompt = `Generate a complete React page component for the "${page.name}" page of a members area.

Page purpose: ${page.description}

Overall members area description: ${request.prompt}

Pages in this members area:
${pagesDescription}

${sharedCode ? `\nAlready generated shared code (import from these):\n${sharedCode}` : ''}
${searchContext}

IMPORTANT RULES:
- Export the component as a named export: export function Members${this.toPascalCase(page.id)}Page()
- The component will be rendered inside a layout — do NOT include sidebar navigation
- Use the app's color scheme consistently
- Include loading states, error handling, empty states
- Use realistic demo/mock data for the initial state
- Make it look professional and polished
- Include all necessary imports

Return the file using ===FILE: frontend/src/components/members/${page.id}.tsx=== / ===END_FILE=== format.
Return ONLY the code. No explanations.`;

          const result = await this.callAI(
            model,
            `You are an expert React developer building a ${page.name} page for a members area.\n${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}`,
            pagePrompt,
          );

          if (isComplex) {
            totalOrchestratorTokens += result.tokensUsed;
          } else {
            totalSubAgentTokens += result.tokensUsed;
          }

          const pageFiles = this.parseFiles(result.content);
          if (pageFiles.length === 0 && result.content.trim()) {
            allFiles.push({
              path: `frontend/src/components/members/${page.id}.tsx`,
              content: result.content.replace(/^```(?:tsx?|typescript)?\n?/m, '').replace(/\n?```$/m, '').trim(),
              language: 'typescript',
              description: `${page.name} page`,
            });
          } else {
            allFiles.push(...pageFiles);
          }
          step.status = 'complete';
        } catch {
          step.status = 'failed';
        }
      }

      // Step 3: Generate index/router file
      const routerStep: PlanStep = {
        id: stepId++,
        title: 'Members area router',
        description: 'Generate the main router/index that connects all members area pages',
        agent: 'sub-agent',
        status: 'running',
      };
      allPlanSteps.push(routerStep);

      try {
        const routerPrompt = `Generate a MembersArea index component that:
1. Imports all the page components from the members/ folder
2. Uses React Router (react-router-dom) with nested routes
3. Wraps pages in the MembersLayout sidebar component
4. Defines routes for each page

Pages to include:
${pages.map(p => `- /${p.id} → Members${this.toPascalCase(p.id)}Page`).join('\n')}

Default route should redirect to /dashboard.

The already generated files are:
${allFiles.map(f => `- ${f.path}`).join('\n')}

Use ===FILE: frontend/src/components/members/index.tsx=== / ===END_FILE=== format.
Return ONLY the code.`;

        const routerResult = await this.callAI(
          subAgentModel,
          `You are a React Router expert.\n${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}`,
          routerPrompt,
        );
        totalSubAgentTokens += routerResult.tokensUsed;
        const routerFiles = this.parseFiles(routerResult.content);
        allFiles.push(...routerFiles);
        routerStep.status = 'complete';
      } catch {
        routerStep.status = 'failed';
      }

      this.recordUsage(orchestratorModel, subAgentModel, totalOrchestratorTokens, totalSubAgentTokens);

      return {
        success: true,
        plan: allPlanSteps,
        files: allFiles,
        summary: `Generated ${allFiles.length} files for the members area with ${pages.length} pages: ${pages.map(p => p.name).join(', ')}`,
        tokensUsed: {
          orchestrator: totalOrchestratorTokens,
          subAgent: totalSubAgentTokens,
          total: totalOrchestratorTokens + totalSubAgentTokens,
        },
        modelsUsed: { orchestrator: orchestratorModel, subAgent: subAgentModel },
        suggestedPages: pages,
        apiKeysNeeded,
        searchResults,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        plan: allPlanSteps,
        files: allFiles,
        summary: '',
        tokensUsed: {
          orchestrator: totalOrchestratorTokens,
          subAgent: totalSubAgentTokens,
          total: totalOrchestratorTokens + totalSubAgentTokens,
        },
        modelsUsed: { orchestrator: orchestratorModel, subAgent: subAgentModel },
        apiKeysNeeded,
        error: message,
      };
    }
  }

  private toPascalCase(str: string): string {
    return str.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }

  // ─── Single page / component generate (original flow) ─────────────────────

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (request.targetType === 'members-area') {
      return this.generateMembersArea(request);
    }

    const orchestratorModel = request.orchestratorModel || DEFAULT_ORCHESTRATOR;
    const subAgentModel = request.subAgentModel || DEFAULT_SUB_AGENT;
    let totalOrchestratorTokens = 0;
    let totalSubAgentTokens = 0;

    try {
      const planPrompt = this.buildPlanPrompt(request);
      const planResult = await this.callAI(
        orchestratorModel,
        this.getArchitectSystemPrompt(),
        planPrompt,
        request.conversationHistory || [],
      );
      totalOrchestratorTokens += planResult.tokensUsed;
      const plan = this.parsePlan(planResult.content);

      const subTasks = plan.filter((s) => s.agent === 'sub-agent');
      const orchestratorTasks = plan.filter((s) => s.agent === 'orchestrator');

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
        } catch {
          task.status = 'failed';
        }
      }

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
      const files = this.parseFiles(mainResult.content);
      orchestratorTasks.forEach((t) => (t.status = 'complete'));
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
      if (!targetFile) return { success: false, file: null, tokensUsed: 0, error: 'File index out of range' };

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

      return { success: true, file: { ...targetFile, content: updatedContent }, tokensUsed: result.tokensUsed };
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
        system: 'You are a senior code reviewer. Find bugs, security issues, performance problems, and suggest improvements.',
        user: `Review this code and provide actionable feedback:\n${request.context}`,
      },
      test: {
        system: 'You are a testing expert. Generate unit tests using Jest and React Testing Library. Return only the test code.',
        user: `Generate tests for:\n${request.context}`,
      },
    };

    const taskPrompt = prompts[request.task];
    if (!taskPrompt) return { success: false, result: '', tokensUsed: 0, error: `Unknown task type: ${request.task}` };

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
        const filePath = path.resolve(projectRoot, file.path);
        if (!filePath.startsWith(projectRoot)) {
          errors.push(`${file.path}: path escapes project root`);
          continue;
        }
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
    const hasAnthropic = !!this.getApiKey('anthropic');
    const hasOpenAI = !!this.getApiKey('openai');
    const hasBrave = !!this.getApiKey('brave');
    const hasApify = !!this.getApiKey('apify');

    const available = MODELS.filter((m) => {
      if (m.provider === 'anthropic') return hasAnthropic;
      if (m.provider === 'openai') return hasOpenAI;
      return false;
    });

    return {
      success: true,
      models: available,
      configured: { anthropic: hasAnthropic, openai: hasOpenAI, brave: hasBrave, apify: hasApify },
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

  /** Estimate token cost before generation */
  estimateCost(
    pages: { id: string; type: string }[],
    orchestratorModel: string,
    subAgentModel: string,
  ): { estimatedTokens: number; estimatedCost: number; breakdown: { role: string; model: string; tokens: number; cost: number }[] } {
    const orchConfig = this.getModelConfig(orchestratorModel || DEFAULT_ORCHESTRATOR);
    const subConfig = this.getModelConfig(subAgentModel || DEFAULT_SUB_AGENT);
    const orchCost = orchConfig?.costPer1kTokens || 0.015;
    const subCost = subConfig?.costPer1kTokens || 0.00125;

    // Shared types + layout (sub-agent)
    const sharedTokens = 1500;
    // Router (sub-agent)
    const routerTokens = 800;
    // Per-page estimates
    const complexTypes = ['dashboard', 'custom'];
    let orchTokens = 0;
    let subTokens = sharedTokens + routerTokens;

    for (const page of pages) {
      const est = EST_TOKENS_PER_PAGE[page.type] || 2500;
      if (complexTypes.includes(page.type)) {
        orchTokens += est;
      } else {
        subTokens += est;
      }
    }

    // Add ~30% for input tokens (prompts + context)
    const totalOrch = Math.round(orchTokens * 1.3);
    const totalSub = Math.round(subTokens * 1.3);

    return {
      estimatedTokens: totalOrch + totalSub,
      estimatedCost: parseFloat(((totalOrch / 1000) * orchCost + (totalSub / 1000) * subCost).toFixed(4)),
      breakdown: [
        { role: 'Orchestrator', model: orchConfig?.name || orchestratorModel, tokens: totalOrch, cost: parseFloat(((totalOrch / 1000) * orchCost).toFixed(4)) },
        { role: 'Sub-Agent', model: subConfig?.name || subAgentModel, tokens: totalSub, cost: parseFloat(((totalSub / 1000) * subCost).toFixed(4)) },
      ],
    };
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
      stats.history.push({ date: new Date().toISOString(), orchestratorModel, subAgentModel, orchestratorTokens, subAgentTokens });
      if (stats.history.length > 100) stats.history = stats.history.slice(-100);
      this.db.writeSync(data);
    } catch { /* non-critical */ }
  }

  // ─── Prompt builders ────────────────────────────────────────────────────

  private getArchitectSystemPrompt(): string {
    return `You are a senior software architect. Analyze the request and return a JSON array of implementation steps.

Step schema: {id: number, title: string, description: string, agent: "orchestrator"|"sub-agent"}

Delegation: sub-agent → types, utils, constants, styles. orchestrator → React components, complex logic, state.
2-5 steps max. Output ONLY the JSON array.`;
  }

  private getSubAgentSystemPrompt(taskTitle: string): string {
    return `You are a fast, efficient code generator handling the "${taskTitle}" sub-task. Generate clean, well-typed TypeScript code. Return ONLY the code, no explanations, no markdown fences.`;
  }

  private getCodeGenSystemPrompt(): string {
    return `Expert React/TypeScript developer. Generate production-quality code.

${this.getDesignSystemContext()}

FORMAT: ===FILE: path=== ... ===END_FILE=== then SUMMARY: line.
RULES: Complete runnable files, correct imports, error/loading/empty states, TypeScript types, functional components with hooks. No placeholders or TODOs.`;
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

    return [{ id: 1, title: 'Generate code', description: 'Generate all code in a single pass', agent: 'orchestrator', status: 'pending' }];
  }

  private parseFiles(content: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const filePattern = /===FILE:\s*(.+?)===\n([\s\S]*?)===END_FILE===/g;
    let match: RegExpExecArray | null;

    while ((match = filePattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      const ext = path.extname(filePath).slice(1);
      const langMap: Record<string, string> = { tsx: 'typescript', ts: 'typescript', jsx: 'javascript', js: 'javascript', css: 'css', json: 'json', md: 'markdown', sql: 'sql' };
      files.push({ path: filePath, content: fileContent, language: langMap[ext] || ext, description: `Generated file: ${filePath}` });
    }

    if (files.length === 0 && content.trim().length > 0) {
      const cleanContent = content
        .replace(/^```(?:tsx?|typescript|javascript)?\n?/m, '')
        .replace(/\n?```$/m, '')
        .replace(/^SUMMARY:.*$/m, '')
        .trim();

      if (cleanContent) {
        files.push({ path: 'frontend/src/components/GeneratedPage.tsx', content: cleanContent, language: 'typescript', description: 'Generated component' });
      }
    }

    return files;
  }

  private extractSummary(content: string): string {
    const summaryMatch = content.match(/SUMMARY:\s*(.+)/);
    return summaryMatch?.[1]?.trim() || 'Code generated successfully.';
  }

  // ─── Finalize: analyze generated pages for backend work ───────────────────

  async analyzeBackendNeeds(
    files: GeneratedFile[],
    appId?: number,
    model?: string,
  ): Promise<{
    success: boolean;
    tasks: BackendTask[];
    summary: string;
    error?: string;
  }> {
    const aiModel = model || DEFAULT_SUB_AGENT;

    // Build a condensed view of the generated TSX files for the AI
    const tsxFiles = files.filter(f => f.path.match(/\.(tsx|ts)$/));
    if (tsxFiles.length === 0) {
      return { success: true, tasks: [], summary: 'No pages to analyze.' };
    }

    const filesContext = tsxFiles.map(f => {
      // Truncate very large files to save tokens
      const content = f.content.length > 4000 ? f.content.slice(0, 4000) + '\n// ... truncated ...' : f.content;
      return `--- ${f.path} ---\n${content}\n--- END ---`;
    }).join('\n\n');

    const appContext = this.getAppContext(appId);
    const db = this.db.readSync();

    // Summarise existing DB tables
    const dbTables: string[] = [];
    for (const key of Object.keys(db)) {
      if (Array.isArray(db[key])) {
        const filtered = appId
          ? (db[key] as any[]).filter((r: any) => !r.app_id || r.app_id === appId)
          : db[key];
        dbTables.push(`${key}: ${(filtered as any[]).length} records`);
      }
    }

    const systemPrompt = `You are a senior backend engineer analysing React frontend pages to determine what backend infrastructure they need to actually work.

Your job is to identify:
1. Database tables/records that need to exist (users, plans, courses, products, etc.)
2. API endpoints the frontend calls or implies
3. Integration work (Stripe, email, auth, webhooks)
4. Security requirements (JWT auth, RBAC, input validation)
5. Sample/seed data that should be created

EXISTING DATABASE:
${dbTables.join('\n')}

${appContext}

Return ONLY a JSON array of task objects. Each task:
{
  "id": "unique-slug",
  "category": "database" | "api" | "integration" | "security" | "data",
  "title": "Short title",
  "description": "What needs to be done and why",
  "priority": "high" | "medium" | "low",
  "autoImplement": true/false (true ONLY for database seeding tasks where you can provide sample data),
  "seedData": { "table": "tableName", "records": [...] } // only if autoImplement is true
}

Rules:
- Be practical and specific — reference actual component names and data they display
- Mark a task as autoImplement:true ONLY if it's a database seed (creating sample records)
- For seed data, provide realistic, domain-appropriate records (5-10 per table)
- Include app_id in seed records where appropriate
- Don't duplicate tasks
- Order by priority (high first)
- Typically 5-15 tasks for a full members area

Return ONLY the JSON array. No markdown fences, no explanation.`;

    try {
      const result = await this.callAI(aiModel, systemPrompt, `Analyze these generated frontend pages and identify all backend work needed:\n\n${filesContext}`);

      let tasks: BackendTask[] = [];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          tasks = parsed.map((t: any) => ({
            id: t.id || `task-${Math.random().toString(36).slice(2, 8)}`,
            category: t.category || 'api',
            title: t.title || 'Untitled task',
            description: t.description || '',
            priority: t.priority || 'medium',
            status: 'pending' as const,
            implementation: t.autoImplement && t.seedData ? {
              type: 'db_seed' as const,
              payload: t.seedData,
            } : undefined,
          }));
        }
      } catch { /* parsing failed, return empty */ }

      // Check which tasks are already done (e.g. table already has records)
      for (const task of tasks) {
        if (task.implementation?.type === 'db_seed') {
          const table = task.implementation.payload.table;
          const existing = Array.isArray(db[table])
            ? (appId ? (db[table] as any[]).filter((r: any) => r.app_id === appId) : db[table] as any[])
            : [];
          if (existing.length > 0) {
            task.status = 'done';
          }
        }
      }

      const pending = tasks.filter(t => t.status !== 'done');
      const auto = tasks.filter(t => t.status === 'pending' && t.implementation);
      const summary = tasks.length === 0
        ? 'No backend tasks identified.'
        : `${pending.length} tasks need attention. ${auto.length} can be auto-implemented.`;

      return { success: true, tasks, summary };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, tasks: [], summary: '', error: message };
    }
  }

  /** Implement a single backend task (currently supports db_seed) */
  implementTask(task: BackendTask, appId?: number): { success: boolean; taskId: string; message: string } {
    if (task.status === 'done') {
      return { success: true, taskId: task.id, message: `"${task.title}" is already done.` };
    }
    if (!task.implementation) {
      return { success: false, taskId: task.id, message: `"${task.title}" requires manual implementation: ${task.description}` };
    }

    try {
      if (task.implementation.type === 'db_seed') {
        return this.executeSeedTask(task, appId);
      }
      return { success: false, taskId: task.id, message: `Implementation type "${task.implementation.type}" not supported yet.` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, taskId: task.id, message: `Failed: ${msg}` };
    }
  }

  /** Execute all auto-implementable tasks */
  implementAllTasks(
    tasks: BackendTask[],
    appId?: number,
  ): { results: { success: boolean; taskId: string; message: string }[]; tasks: BackendTask[] } {
    const results: { success: boolean; taskId: string; message: string }[] = [];

    for (const task of tasks) {
      if (task.status === 'pending' && task.implementation) {
        const result = this.implementTask(task, appId);
        results.push(result);
        if (result.success) {
          task.status = 'done';
        }
      }
    }

    return { results, tasks };
  }

  /** Seed database records for a task */
  private executeSeedTask(
    task: BackendTask,
    appId?: number,
  ): { success: boolean; taskId: string; message: string } {
    const db = this.db.readSync();
    const payload = task.implementation!.payload;
    const table = payload.table as string;
    const records = payload.records as any[];

    if (!Array.isArray(records) || records.length === 0) {
      return { success: false, taskId: task.id, message: `No seed records provided for "${table}".` };
    }

    if (!db[table]) {
      db[table] = [];
    }

    const maxId = Math.max(0, ...(db[table] as any[]).map((r: any) => r.id || 0));
    let nextId = maxId + 1;
    const created: any[] = [];

    for (const record of records) {
      const newRecord: any = {
        id: nextId++,
        ...(appId ? { app_id: appId } : {}),
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      (db[table] as any[]).push(newRecord);
      created.push(newRecord);
    }

    db.last_updated = new Date().toISOString();
    this.db.writeSync(db);

    return {
      success: true,
      taskId: task.id,
      message: `Seeded ${created.length} records into "${table}".`,
    };
  }

  // ─── QA Agent: review generated files for errors ──────────────────────────

  async qaReview(
    files: GeneratedFile[],
    appId?: number,
    model?: string,
  ): Promise<{
    success: boolean;
    issues: QaIssue[];
    passedFiles: string[];
    failedFiles: string[];
    summary: string;
    error?: string;
  }> {
    const aiModel = model || DEFAULT_SUB_AGENT;

    const tsxFiles = files.filter(f => f.path.match(/\.(tsx?|jsx?)$/));
    if (tsxFiles.length === 0) {
      return { success: true, issues: [], passedFiles: [], failedFiles: [], summary: 'No code files to review.' };
    }

    // Build cross-file context so the AI can check imports between files
    const allExports: string[] = [];
    for (const f of tsxFiles) {
      const exportMatches = f.content.match(/export\s+(?:function|const|class|interface|type|enum)\s+(\w+)/g);
      if (exportMatches) {
        allExports.push(`${f.path}: exports ${exportMatches.map(m => m.replace(/export\s+(?:function|const|class|interface|type|enum)\s+/, '')).join(', ')}`);
      }
    }

    const filesContext = tsxFiles.map(f => {
      const content = f.content.length > 5000 ? f.content.slice(0, 5000) + '\n// ... truncated ...' : f.content;
      return `--- ${f.path} ---\n${content}\n--- END ---`;
    }).join('\n\n');

    const systemPrompt = `You are a senior code reviewer performing QA on AI-generated React/TypeScript files for a members area.

CROSS-FILE EXPORTS (use to verify imports between generated files):
${allExports.join('\n')}

Check for these categories of issues:

1. IMPORT errors: wrong import paths, importing non-existent modules, missing imports for used symbols, importing from '@mui/material' or '@mui/icons-material' with wrong names
2. TYPE errors: undefined variables, wrong prop types, missing interface fields, type mismatches
3. LOGIC errors: unreachable code, infinite loops, missing return statements, broken event handlers, calling .map on non-arrays
4. STYLE issues: hardcoded colors that should use the theme, inconsistent spacing, missing responsive breakpoints
5. NAMING issues: components not matching file names, inconsistent naming patterns across files
6. API issues: fetch calls with wrong URLs, missing error handling, hardcoded API paths instead of using config
7. MISSING code: TODO placeholders, empty function bodies, missing loading/error states, missing key props on mapped elements

Return ONLY a JSON array of issues. Each issue:
{
  "id": "unique-slug",
  "file": "path/to/file.tsx",
  "line": 42,
  "severity": "error" | "warning" | "info",
  "category": "import" | "type" | "logic" | "style" | "naming" | "api" | "missing",
  "title": "Short title",
  "description": "What's wrong and why it matters",
  "autoFix": "Brief instruction for AI to fix this specific issue (or null if manual review needed)"
}

Rules:
- Focus on REAL bugs that would prevent compilation or cause runtime errors — not nitpicks
- severity=error for anything that would crash or fail to compile
- severity=warning for things that would cause bad UX or subtle bugs
- severity=info for style/best-practice suggestions
- Be specific: include the actual symbol/import/variable name
- autoFix should be a clear, actionable instruction (e.g. "Change import from './types' to './shared/types'")
- Return an empty array [] if the code is clean

Return ONLY the JSON array. No markdown, no explanation.`;

    try {
      const result = await this.callAI(aiModel, systemPrompt, `Review these generated files:\n\n${filesContext}`);

      let issues: QaIssue[] = [];
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          issues = JSON.parse(jsonMatch[0]).map((issue: any) => ({
            id: issue.id || `qa-${Math.random().toString(36).slice(2, 8)}`,
            file: issue.file || '',
            line: issue.line || undefined,
            severity: issue.severity || 'warning',
            category: issue.category || 'logic',
            title: issue.title || 'Issue',
            description: issue.description || '',
            autoFix: issue.autoFix || undefined,
          }));
        }
      } catch { /* parsing failed */ }

      const errorFiles = new Set(issues.filter(i => i.severity === 'error').map(i => i.file));
      const allFilePaths = tsxFiles.map(f => f.path);
      const failedFiles = allFilePaths.filter(f => errorFiles.has(f));
      const passedFiles = allFilePaths.filter(f => !errorFiles.has(f));

      const errors = issues.filter(i => i.severity === 'error').length;
      const warnings = issues.filter(i => i.severity === 'warning').length;
      const infos = issues.filter(i => i.severity === 'info').length;

      let summary: string;
      if (issues.length === 0) {
        summary = `All ${tsxFiles.length} files passed QA — no issues found.`;
      } else if (errors === 0) {
        summary = `QA complete: ${warnings} warning(s), ${infos} suggestion(s). No blocking errors.`;
      } else {
        summary = `QA found ${errors} error(s), ${warnings} warning(s), ${infos} info(s) across ${failedFiles.length} file(s).`;
      }

      return { success: true, issues, passedFiles, failedFiles, summary };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, issues: [], passedFiles: [], failedFiles: [], summary: '', error: message };
    }
  }

  /** Auto-fix a specific QA issue by sending it to the orchestrator */
  async qaAutoFix(
    files: GeneratedFile[],
    issue: QaIssue,
    model?: string,
  ): Promise<{ success: boolean; file: GeneratedFile | null; tokensUsed: number; error?: string }> {
    const fileIndex = files.findIndex(f => f.path === issue.file);
    if (fileIndex === -1) {
      return { success: false, file: null, tokensUsed: 0, error: `File "${issue.file}" not found in generated files.` };
    }

    const instruction = `Fix this QA issue:\n\nCategory: ${issue.category}\nSeverity: ${issue.severity}\nTitle: ${issue.title}\nDescription: ${issue.description}\n${issue.line ? `Around line: ${issue.line}` : ''}\n\nFix instruction: ${issue.autoFix || issue.description}`;

    return this.refineFile({
      instruction,
      files,
      fileIndex,
      model: model || DEFAULT_ORCHESTRATOR,
    });
  }

  /** Auto-fix all fixable QA issues sequentially */
  async qaAutoFixAll(
    files: GeneratedFile[],
    issues: QaIssue[],
    model?: string,
  ): Promise<{
    success: boolean;
    files: GeneratedFile[];
    fixed: string[];
    failed: string[];
    tokensUsed: number;
  }> {
    let currentFiles = [...files];
    const fixed: string[] = [];
    const failed: string[] = [];
    let totalTokens = 0;

    const fixableIssues = issues.filter(i => i.autoFix && i.severity !== 'info');

    for (const issue of fixableIssues) {
      try {
        const result = await this.qaAutoFix(currentFiles, issue, model);
        totalTokens += result.tokensUsed;

        if (result.success && result.file) {
          const idx = currentFiles.findIndex(f => f.path === issue.file);
          if (idx >= 0) {
            currentFiles[idx] = result.file;
            fixed.push(issue.id);
          }
        } else {
          failed.push(issue.id);
        }
      } catch {
        failed.push(issue.id);
      }
    }

    return { success: true, files: currentFiles, fixed, failed, tokensUsed: totalTokens };
  }

  // ─── Documentation Agent ─────────────────────────────────────────────────

  async generateDocs(
    files: GeneratedFile[],
    appId?: number,
    backendTasks?: BackendTask[],
    model?: string,
  ): Promise<{
    success: boolean;
    docs: GeneratedFile[];
    tokensUsed: number;
    error?: string;
  }> {
    const aiModel = model || DEFAULT_SUB_AGENT;
    let totalTokens = 0;
    const docs: GeneratedFile[] = [];

    const appContext = this.getAppContext(appId);

    // Build context from generated files
    const fileList = files.map(f => `- ${f.path}: ${f.description || f.path.split('/').pop()}`).join('\n');
    const componentNames = files
      .filter(f => f.path.match(/\.tsx$/))
      .map(f => {
        const match = f.content.match(/export\s+function\s+(\w+)/);
        return match ? `${f.path} → ${match[1]}` : f.path;
      })
      .join('\n');

    const taskSummary = backendTasks && backendTasks.length > 0
      ? `\n\nBACKEND TASKS:\n${backendTasks.map(t => `- [${t.status.toUpperCase()}] ${t.title} (${t.category}): ${t.description}`).join('\n')}`
      : '';

    // Generate README
    try {
      const readmeResult = await this.callAI(
        aiModel,
        'You are a technical documentation writer. Write clear, well-structured Markdown documentation.',
        `Generate a comprehensive README.md for this members area application.

${appContext}

GENERATED FILES:
${fileList}

COMPONENTS:
${componentNames}
${taskSummary}

The README should include:
1. **Overview** — what the members area does, key features
2. **Pages** — list each page with a description of its purpose and features
3. **File Structure** — tree view of all generated files
4. **Components** — each component's purpose, props, and key features
5. **API Endpoints** — what APIs the frontend expects (derived from fetch/axios calls in the code)
6. **Database Requirements** — what data tables/records are needed
7. **Setup Instructions** — how to integrate the members area into the main app
8. **Color Scheme & Theming** — the primary color and design tokens used
9. **Dependencies** — required npm packages

Write in a professional, developer-friendly tone. Use code blocks for examples.
Return ONLY the Markdown content. No wrapping code fences.`,
      );
      totalTokens += readmeResult.tokensUsed;

      docs.push({
        path: 'frontend/src/components/members/README.md',
        content: readmeResult.content.replace(/^```(?:md|markdown)?\n?/m, '').replace(/\n?```$/m, '').trim(),
        language: 'markdown',
        description: 'Members area documentation',
      });
    } catch { /* non-critical */ }

    // Generate API reference from source code
    try {
      const apiCodeContext = files
        .filter(f => f.path.match(/\.tsx?$/))
        .map(f => {
          // Extract fetch/API calls
          const apiCalls = f.content.match(/fetch\([^)]+\)|axios\.\w+\([^)]+\)/g) || [];
          if (apiCalls.length === 0) return null;
          return `${f.path}:\n${apiCalls.join('\n')}`;
        })
        .filter(Boolean)
        .join('\n\n');

      if (apiCodeContext) {
        const apiResult = await this.callAI(
          aiModel,
          'You are an API documentation writer. Generate clear endpoint documentation from frontend code.',
          `From these frontend API calls, generate an API_REFERENCE.md documenting each endpoint:

${apiCodeContext}
${taskSummary}

For each endpoint include:
- Method & URL
- Purpose
- Request body/params (if visible)
- Expected response shape
- Which component uses it

Return ONLY the Markdown. No wrapping code fences.`,
        );
        totalTokens += apiResult.tokensUsed;

        docs.push({
          path: 'frontend/src/components/members/API_REFERENCE.md',
          content: apiResult.content.replace(/^```(?:md|markdown)?\n?/m, '').replace(/\n?```$/m, '').trim(),
          language: 'markdown',
          description: 'API endpoint reference',
        });
      }
    } catch { /* non-critical */ }

    return {
      success: true,
      docs,
      tokensUsed: totalTokens,
    };
  }

  private async trackCost(provider: string, model: string, tokensIn: number, tokensOut: number, duration: number, module: string): Promise<void> {
    const rates: Record<string, [number, number]> = {
      'gpt-4o-mini': [0.15, 0.60], 'gpt-4o': [2.50, 10.00], 'gpt-3.5-turbo': [0.50, 1.50],
      'gpt-4': [30.00, 60.00], 'google/gemini-2.0-flash-001': [0.10, 0.40],
      'anthropic/claude-sonnet-4': [3.00, 15.00], 'claude-sonnet-4-20250514': [3.00, 15.00],
      'claude-3-5-sonnet-20241022': [3.00, 15.00], 'openai/gpt-4o': [2.50, 10.00],
    };
    const [inR, outR] = rates[model] || [1.00, 3.00];
    const cost = (tokensIn * inR + tokensOut * outR) / 1_000_000;
    await this.analyticsService.trackApiUsage({
      provider: provider as any, endpoint: '/chat/completions', model, tokensIn, tokensOut, cost, duration, statusCode: 200, success: true, module,
    }).catch(() => {});
  }
}
