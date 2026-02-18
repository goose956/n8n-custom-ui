import { Injectable, Logger } from'@nestjs/common';
import * as fs from'fs';
import * as path from'path';
import { execSync } from'child_process';
import axios from'axios';
import { CryptoService } from'../shared/crypto.service';
import { DatabaseService } from'../shared/database.service';
import { AnalyticsService } from'../analytics/analytics.service';
import { getPageTemplate, TEMPLATE_PAGE_TYPES } from'./members-templates';
import { GitOps } from './git-ops';
import { RetryEngine, RetryEngineContext } from './retry-engine';
import { PromptHelpers } from './prompt-helpers';
import { CodeTools } from './code-tools';
import { DocAgentService } from './doc-agent.service';
import { TestAgentService, TestAgentContext } from './test-agent.service';

// --- Types ---------------------------------------------------------------------

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
 agent:'orchestrator' |'sub-agent';
 status:'pending' |'running' |'complete' |'failed';
 model?: string;
}

export interface MembersAreaPage {
 id: string;
 name: string;
 description: string;
 type:'dashboard' |'profile' |'settings' |'admin' |'contact' |'custom';
 required: boolean;
}

export interface BackendTask {
 id: string;
 category:'database' |'api' |'integration' |'security' |'data' |'frontend_wiring';
 title: string;
 description: string;
 status:'pending' |'done' |'in-progress';
 priority:'high' |'medium' |'low';
 targetFile?: string;
 implementation?: {
 type:'db_seed' |'api_route' |'config' |'schema' |'create_api';
 payload: Record<string, any>;
 };
}

export interface QaIssue {
 id: string;
 file: string;
 line?: number;
 severity:'error' |'warning' |'info';
 category:'import' |'type' |'logic' |'style' |'naming' |'api' |'missing';
 title: string;
 description: string;
 autoFix?: string;
}

interface GenerateRequest {
 prompt: string;
 targetType?:'page' |'component' |'feature' |'full-stack' |'members-area';
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
 task:'types' |'styles' |'utils' |'docs' |'review' |'test';
 context: string;
 model?: string;
}

export interface ModelConfig {
 id: string;
 name: string;
 provider:'anthropic' |'openai' |'openrouter';
 tier:'orchestrator' |'sub-agent' |'both';
 costPer1kTokens: number;
}

// --- Model registry ------------------------------------------------------------

const MODELS: ModelConfig[] = [
 { id:'claude-opus-4-20250514', name:'Claude Opus 4', provider:'anthropic', tier:'orchestrator', costPer1kTokens: 0.075 },
 { id:'claude-sonnet-4-20250514', name:'Claude Sonnet 4', provider:'anthropic', tier:'both', costPer1kTokens: 0.015 },
 { id:'gpt-4o', name:'GPT-4o', provider:'openai', tier:'both', costPer1kTokens: 0.01 },
 { id:'claude-3-haiku-20240307', name:'Claude 3 Haiku', provider:'anthropic', tier:'sub-agent', costPer1kTokens: 0.00125 },
 { id:'gpt-4o-mini', name:'GPT-4o Mini', provider:'openai', tier:'sub-agent', costPer1kTokens: 0.00075 },
 { id:'claude-3-5-sonnet-20241022', name:'Claude 3.5 Sonnet', provider:'anthropic', tier:'both', costPer1kTokens: 0.015 },
];

const DEFAULT_ORCHESTRATOR ='claude-sonnet-4-20250514';
const DEFAULT_SUB_AGENT ='gpt-4o-mini';

// Token limits per model tier -- Opus can output much more
const MAX_TOKENS: Record<string, number> = {
'claude-opus-4-20250514': 16384,
'claude-sonnet-4-20250514': 8192,
'claude-3-5-sonnet-20241022': 8192,
'gpt-4o': 8192,
'claude-3-haiku-20240307': 4096,
'gpt-4o-mini': 4096,
};

// Estimated tokens per page for cost calculation
// Template pages use a shared AI copy call (~600 tokens total, split across pages)
const EST_TOKENS_PER_PAGE: Record<string, number> = {
 dashboard: 120, // template + shared AI copy
 custom: 3000,
 admin: 120, // template + shared AI copy
 profile: 120, // template + shared AI copy
 settings: 120, // template + shared AI copy
 contact: 120, // template + shared AI copy
};

// --- Default members area pages ---------------------------------------------

const DEFAULT_MEMBERS_PAGES: MembersAreaPage[] = [
 { id:'dashboard', name:'Dashboard', description:'Main dashboard overview with stats, recent activity, and quick actions', type:'dashboard', required: true },
 { id:'profile', name:'Profile', description:'User profile management with avatar, bio, and account details', type:'profile', required: true },
 { id:'settings', name:'Settings', description:'Account settings, notifications, privacy, and preferences', type:'settings', required: true },
 { id:'contact', name:'Contact', description:'Contact form that sends messages directly to admin inbox via /api/contact', type:'contact', required: true },
 { id:'admin', name:'Admin Panel', description:'Admin dashboard with analytics and contact form submissions -- wired to the live backend API', type:'admin', required: true },
];

// --- Service -------------------------------------------------------------------

@Injectable()
export class ProgrammerAgentService {
 private readonly logger = new Logger(ProgrammerAgentService.name);

 // Extracted utility classes (break up the God Object)
 private readonly gitOps = new GitOps();
 private readonly promptHelpers = new PromptHelpers();
 private readonly codeTools = new CodeTools();
 private retryEngine: RetryEngine; // initialized in constructor (needs `this` context)

 constructor(
 private readonly cryptoService: CryptoService,
 private readonly db: DatabaseService,
 private readonly analyticsService: AnalyticsService,
 private readonly docAgent: DocAgentService,
 private readonly testAgent: TestAgentService,
 ) {
   // Wire up the retry engine with service methods it needs
   const ctx: RetryEngineContext = {
     callAI: this.callAI.bind(this),
     readFileFromDisk: this.readFileFromDisk.bind(this),
     searchCodebase: this.searchCodebase.bind(this),
     cleanCodeResponse: this.cleanCodeResponse.bind(this),
     parseFiles: this.parseFiles.bind(this),
     toPascalCase: this.toPascalCase.bind(this),
     getDesignSystemContext: this.getDesignSystemContext.bind(this),
   };
   this.retryEngine = new RetryEngine(ctx);
 }

 // --- API key helpers -------------------------------------------------------

 private getApiKey(provider: string): string | null {
 try {
 if (!this.db.exists()) return null;
 const data = this.db.readSync();
 const apiKeys = data.apiKeys || [];
 // Allow common aliases: "anthropic" matches "claude", "openai" matches "gpt"
 const aliases: Record<string, string[]> = {
 anthropic: ['anthropic', 'claude'],
 claude: ['claude', 'anthropic'],
 openai: ['openai', 'gpt'],
 };
 const namesToCheck = aliases[provider.toLowerCase()] || [provider.toLowerCase()];
 const keyEntry = apiKeys.find(
 (k: any) => namesToCheck.includes(k.name.toLowerCase()),
 );
 if (!keyEntry) return null;
 return this.cryptoService.decrypt(keyEntry.value);
 } catch (err) {
 this.logger.debug("Caught (returning null): " + err);
 return null;
 }
 }

 private getModelConfig(modelId: string): ModelConfig | undefined {
 return MODELS.find((m) => m.id === modelId);
 }

 /** Check what API keys are needed and which are already configured */
 checkApiKeys(): { key: string; reason: string; configured: boolean }[] {
 return [
 { key:'anthropic', reason:'AI code generation (primary)', configured: !!this.getApiKey('anthropic') },
 { key:'openai', reason:'AI code generation (alternative)', configured: !!this.getApiKey('openai') },
 { key:'brave', reason:'Web search for documentation & research', configured: !!this.getApiKey('brave') },
 { key:'apify', reason:'Data scraping and web automation', configured: !!this.getApiKey('apify') },
 ];
 }

 // --- AI call routing ------------------------------------------------------

 private async callAI(
 modelId: string,
 systemPrompt: string,
 userPrompt: string,
 history: { role: string; content: string }[] = [],
 ): Promise<{ content: string; tokensUsed: number }> {
 const model = this.getModelConfig(modelId);
 if (!model) throw new Error(`Unknown model: ${modelId}`);

 if (model.provider ==='anthropic') {
 return this.callAnthropic(modelId, systemPrompt, userPrompt, history);
 } else if (model.provider ==='openai') {
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
 if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings -> API Keys.');

 const messages = [
 ...history.map((h) => ({ role: h.role as'user' |'assistant', content: h.content })),
 { role:'user' as const, content: userPrompt },
 ];

 const maxTokens = MAX_TOKENS[model] || 8192;
 const startTime = Date.now();

 const res = await axios.post(
'https://api.anthropic.com/v1/messages',
 { model, max_tokens: maxTokens, system: systemPrompt, messages },
 {
 headers: {
'x-api-key': apiKey,
'anthropic-version':'2023-06-01',
'Content-Type':'application/json',
 },
 timeout: 240000,
 },
 );

 const content = res.data.content?.[0]?.text ||'';
 const tokensIn = res.data.usage?.input_tokens || 0;
 const tokensOut = res.data.usage?.output_tokens || 0;
 const tokensUsed = tokensIn + tokensOut;
 await this.trackCost('anthropic', model, tokensIn, tokensOut, Date.now() - startTime,'programmer-agent');
 return { content, tokensUsed };
 }

 private async callOpenAI(
 model: string,
 systemPrompt: string,
 userPrompt: string,
 history: { role: string; content: string }[] = [],
 ): Promise<{ content: string; tokensUsed: number }> {
 const apiKey = this.getApiKey('openai');
 if (!apiKey) throw new Error('OpenAI API key not configured. Add it in Settings -> API Keys.');

 const messages = [
 { role:'system' as const, content: systemPrompt },
 ...history.map((h) => ({ role: h.role as'user' |'assistant', content: h.content })),
 { role:'user' as const, content: userPrompt },
 ];

 const maxTokens = MAX_TOKENS[model] || 8192;
 const startTime = Date.now();

 const res = await axios.post(
'https://api.openai.com/v1/chat/completions',
 { model, messages, max_tokens: maxTokens },
 {
 headers: { Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json' },
 timeout: 240000,
 },
 );

 const content = res.data.choices?.[0]?.message?.content ||'';
 const tokensIn = res.data.usage?.prompt_tokens || 0;
 const tokensOut = res.data.usage?.completion_tokens || 0;
 const tokensUsed = tokensIn + tokensOut;
 await this.trackCost('openai', model, tokensIn, tokensOut, Date.now() - startTime,'programmer-agent');
 return { content, tokensUsed };
 }

 // --- Brave Search ---------------------------------------------------------

 async searchBrave(query: string, count = 5): Promise<{ title: string; url: string; description: string }[]> {
 const key = this.getApiKey('brave');
 if (!key) return [];

 try {
 const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
 params: { q: query, count },
 headers: {
 Accept:'application/json',
'Accept-Encoding':'gzip',
'X-Subscription-Token': key,
 },
 timeout: 15000,
 });

 return (res.data.web?.results || []).map((r: any) => ({
 title: r.title ||'',
 url: r.url ||'',
 description: r.description ||'',
 }));
 } catch (err) {
 this.logger.debug("Caught (returning []): " + err);
 return [];
 }
 }

 // --- Apify helper ---------------------------------------------------------

 async runApifyScraper(actorId: string, input: Record<string, any>): Promise<any[]> {
 const token = this.getApiKey('apify');
 if (!token) return [];

 try {
 const runRes = await axios.post(
`https://api.apify.com/v2/acts/${actorId}/runs`,
 input,
 {
 headers: { Authorization:`Bearer ${token}` },
 params: { waitForFinish: 120 },
 timeout: 130000,
 },
 );

 const datasetId = runRes.data?.data?.defaultDatasetId;
 if (!datasetId) return [];

 const dataRes = await axios.get(
`https://api.apify.com/v2/datasets/${datasetId}/items`,
 {
 headers: { Authorization:`Bearer ${token}` },
 params: { format:'json', limit: 50 },
 timeout: 30000,
 },
 );

 return dataRes.data || [];
 } catch (err) {
 this.logger.debug("Caught (returning []): " + err);
 return [];
 }
 }

 // --- Design system context ------------------------------------------------

 private getDesignSystemContext(): string {
 return`
DESIGN SYSTEM RULES (must follow exactly):
- Framework: React 18 with TypeScript
- UI Library: Material-UI 5 (@mui/material)
- Import pattern: import { Box, Typography, ... } from'@mui/material';
- Icons: import { IconName } from'@mui/icons-material/IconName'; -- USE ICONS LIBERALLY throughout the UI
- Colors: primary=#667eea, secondary=#764ba2, dark=#1a1a2e, bg=#fafbfc
- Gradients: background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
- Font: Inter (via theme)
- Border radius: 2-3 for small, 16 for cards, 10 for buttons (theme default is 12)
- Shadows: boxShadow:'0 2px 12px rgba(0,0,0,0.06)' for cards,'0 4px 16px rgba(0,0,0,0.1)' for elevated, border:'1px solid rgba(0,0,0,0.06)' on cards
- Use sx prop for all styling, never CSS files
- Export components as named exports: export function ComponentName()
- Use functional components with hooks
- State: useState, useEffect, useCallback, useMemo
- API calls: use fetch() with const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :''; -- do NOT import from config files. This ensures /api/ calls work in both local dev and production.
- Snackbar pattern for notifications
- Dialog pattern for modals
- Always include proper TypeScript types/interfaces -- define them inline, do NOT import from external type files
- Responsive: use MUI's Grid or Box with display:'grid' /'flex'
- Only import from:'react','@mui/material','@mui/icons-material/*','react-router-dom' -- NO other packages

VISUAL RICHNESS (CRITICAL -- pages must look polished and premium):
- Use MUI icons next to EVERY label, heading, stat, button, and nav item (e.g. TrendingUp, Person, Settings, Dashboard, Analytics, Edit, Delete, Refresh, Search, FilterList, MoreVert, CheckCircle, Warning, Error, Star, Favorite, Visibility, Timeline, BarChart, PieChart, Speed)
- Stat cards: use gradient backgrounds or colored left borders with large numbers, icons, and trend indicators (ArrowUpward/ArrowDownward with green/red text)
- Cards: use elevation, subtle shadows, rounded corners (borderRadius: 3), hover effects (transform:'translateY(-2px)', transition:'0.2s')
- Tables: use alternating row colors, icon status badges (Chip with icon), action buttons in last column
- Sections: use Paper with padding, section headers with icon + Typography variant="h6"
- Empty states: centered icon (large, 64px, muted color), helpful message, action button
- Loading: use Skeleton components (not just CircularProgress) to show content shape while loading
- Use Avatar, Chip, Badge, LinearProgress, Divider, Tooltip liberally
- Color-code statuses: success=green, warning=orange, error=red, info=blue (use MUI's color system)
- Add subtle background patterns or gradient headers to hero sections
- Use Grid containers for responsive card layouts (xs=12, sm=6, md=4 for stat cards)
`.trim();
 }

 /** Shared import rules prompt fragment — used by generate_component, modify_file, and fallback prompts */
 private getImportRulesContext(filePath?: string): string {
   // Infer import depth from file path
   let apiImportPath = '../../config/api';
   if (filePath) {
     if (/frontend\/src\/components\/[^/]+\.tsx$/.test(filePath)) apiImportPath = '../config/api';
     else if (/frontend\/src\/components\/members\//.test(filePath)) apiImportPath = '../../config/api';
     else if (/frontend\/src\/components\/shared\//.test(filePath)) apiImportPath = '../../config/api';
   }
   return `
IMPORT RULES (CRITICAL -- follow exactly):
- API config: \`import { API } from '${apiImportPath}';\`. API is an OBJECT: use \`API.apps\`, \`API.chat\`, etc. NEVER \`\${API}/path\`.
- MUI components: \`import { Box, Typography, ... } from '@mui/material';\`
- React hooks: \`import { useState, useEffect, ... } from 'react';\`
- Do NOT import from paths that don't exist. If you need a type, define it INLINE in the component file.
- Do NOT import from \`../../types/\` or \`../../../types/\` -- these directories may not exist. Define interfaces inline.
`.trim();
 }

 /** Build API config context block for prompts — reads api.ts once and caches per call */
 private getApiConfigContext(): string {
   const apiConfig = this.readFileFromDisk('frontend/src/config/api.ts');
   if (!apiConfig) return '';
   return `\n## Frontend API Configuration (frontend/src/config/api.ts):\n\`\`\`typescript\n${apiConfig}\`\`\`\nIMPORTANT: Use the API object from this config for API calls (e.g. \`import { API } from '../../config/api'; fetch(API.apps)\`). The API object has named properties for each endpoint. Do NOT hardcode URLs or create mock endpoints.\n`;
 }

 /** Estimate cost from token count using the given model's pricing */
 private estimateCostFromTokens(tokens: number, modelId: string): number {
   const config = this.getModelConfig(modelId);
   if (!config) return 0;
   return (tokens / 1000) * (config as any).costPer1kTokens || 0;
 }

 private getAppContext(appId?: number): string {
 if (!appId) return'';
 try {
 const data = this.db.readSync();
 const app = (data.apps || []).find((a: any) => a.id === appId);
 if (!app) return'';

 const appPages = (data.pages || []).filter((p: any) => p.app_id === appId);
 const pagesSummary = appPages.map((p: any) => {
 const css = p.custom_css ?`\n Custom CSS: ${p.custom_css.slice(0, 300)}` :'';
 const colors = this.extractColorsFromContent(p.content_json);
 const colorInfo = colors.length > 0 ?`\n Colors used: ${colors.join(',')}` :'';
 return` - ${p.title} (${p.page_type})${colorInfo}${css}`;
 }).join('\n');

 const appSettings = (data.settings || []).filter((s: any) => s.app_id === appId);
 const brandSettings = appSettings.map((s: any) =>` - ${s.key}: ${JSON.stringify(s.value).slice(0, 200)}`).join('\n');

 const primaryColor = app.primary_color ||'#667eea';

 return`
APP CONTEXT -- You MUST match this app's existing visual style:
- App name: ${app.name}
- App slug: ${app.slug}
- Primary color: ${primaryColor}
- Description: ${app.description ||'No description'}

COLOR SCHEME (override default design system colors with these):
- Primary: ${primaryColor}
- Use this primary color for buttons, links, accents, gradients, and highlights
- Derive hover/active states by darkening the primary color by 10-15%
- Keep dark nav (#1a1a2e) and light bg (#fafbfc) unchanged
- Gradient: use "linear-gradient(135deg, ${primaryColor} 0%, ${this.deriveSecondary(primaryColor)} 100%)"

${appPages.length > 0 ?`EXISTING PAGES (match their style conventions):\n${pagesSummary}` :'No existing pages yet -- establish the visual style using the primary color above.'}
${brandSettings ?`\nAPP SETTINGS:\n${brandSettings}` :''}

STYLE CONSISTENCY RULES:
- Typography, spacing, border-radius, and card patterns must match existing pages
- Use the app's primary color instead of the default #667eea everywhere
- If existing pages use specific icon styles, section layouts, or component patterns, reuse them
- The new page should look like it belongs in the same app as the existing pages
`;
 } catch (err) {
 this.logger.debug('Failed to build app context: ' + err);
 return'';
 }
 }

 /**
 * Look up an app's slug from the database. Used for per-app folder paths.
 */
 private getAppSlug(appId?: number): string | null {
 if (!appId) return null;
 try {
 const data = this.db.readSync();
 const app = (data.apps || []).find((a: any) => a.id === appId);
 return app?.slug || null;
 } catch (err) { this.logger.debug("Caught (returning null): " + err); return null; }
 }

 /**
 * Get the members directory path for a specific app.
 * Returns`frontend/src/components/members/{slug}` for app-specific pages.
 */
 private getMembersDir(appId?: number): string {
 const slug = this.getAppSlug(appId);
 if (slug) return`frontend/src/components/members/${slug}`;
 return'frontend/src/components/members';
 }

 private extractColorsFromContent(obj: any, found: Set<string> = new Set()): string[] {
 if (!obj || typeof obj !=='object') return [];
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
 return`#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
 } catch (err) {
 this.logger.debug('Failed to compute accent color: ' + err);
 return'#764ba2';
 }
 }

 // --- Plan the members area ------------------------------------------------

 async planMembersArea(
 prompt: string,
 appId?: number,
 orchestratorModel?: string,
 ): Promise<{ success: boolean; pages: MembersAreaPage[]; apiKeysNeeded: { key: string; reason: string; configured: boolean }[]; searchResults: any[]; error?: string }> {
 const model = orchestratorModel || DEFAULT_ORCHESTRATOR;

 const apiKeysNeeded = this.checkApiKeys();
 const hasAI = apiKeysNeeded.find(k => k.key ==='anthropic')?.configured || apiKeysNeeded.find(k => k.key ==='openai')?.configured;

 if (!hasAI) {
 return {
 success: false,
 pages: [],
 apiKeysNeeded,
 searchResults: [],
 error:'No AI API key configured. Add Anthropic or OpenAI key in Settings.',
 };
 }

 // Search for relevant documentation if Brave is available
 let searchResults: any[] = [];
 const hasBrave = !!this.getApiKey('brave');
 if (hasBrave) {
 try {
 const searchQuery =`${prompt} members area dashboard react best practices`;
 const results = await this.searchBrave(searchQuery, 5);
 if (results.length > 0) {
 searchResults = [{ query: searchQuery, results }];
 }
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }
 }

 const appContext = this.getAppContext(appId);
 const searchContext = searchResults.length > 0
 ?`\n\nWEB RESEARCH RESULTS:\n${searchResults[0].results.map((r: any, i: number) =>`${i + 1}. ${r.title}: ${r.description}`).join('\n')}`
 :'';

 const planPrompt =`You are planning a members area for a web application. The user wants:

${prompt}

${appContext}
${searchContext}

The minimum required pages are:
1. Dashboard - Main overview page with stats, activity, quick actions
2. Profile - User profile management
3. Settings - Account settings and preferences

Based on the user's description, suggest additional pages that would be needed. Think about what content and features the members area should have.

IMPORTANT: Do NOT suggest a "Support" or "Support Ticket" page. Support functionality is handled within the Admin Panel.

Return ONLY a JSON array of pages. Each page:
- id: lowercase slug (e.g., "courses", "billing")
- name: Display name
- description: What this page contains and does -- be VERY specific to this app's domain. Include what real data/metrics/content a user of this app would see on this page. Do NOT use generic descriptions.
- type: "dashboard" | "profile" | "settings" | "admin" | "contact" | "custom"
- required: true for the 5 core pages (dashboard, profile, settings, admin, contact), false for extras

The 5 required pages are ALWAYS included:
1. Dashboard (type: "dashboard") - Main overview with stats, activity, quick actions
2. Profile (type: "profile") - User profile management
3. Settings (type: "settings") - Account settings and preferences
4. Admin (type: "admin") - Admin panel with analytics and contact form submissions
5. Contact (type: "contact") - Contact form for users to reach out

Include these 5 required pages plus any additional custom pages that make sense for this specific app.
Use type "custom" ONLY for app-specific pages beyond the 5 core pages.

Return ONLY the JSON array. No explanation, no markdown fences.`;

 try {
 const result = await this.callAI(model,'You are a senior UX architect planning members area pages for a SaaS application. Return only valid JSON.', planPrompt);

 let pages = DEFAULT_MEMBERS_PAGES;
 try {
 const jsonMatch = result.content.match(/\[[\s\S]*\]/);
 if (jsonMatch) {
 const parsed = JSON.parse(jsonMatch[0]);
 // IDs that are allowed to be marked "required"
 const REQUIRED_IDS = new Set(DEFAULT_MEMBERS_PAGES.filter(dp => dp.required).map(dp => dp.id));
 // IDs that must never appear (removed page types)
 const BLOCKED_IDS = new Set(['support','support-ticket']);

 const aiPages: MembersAreaPage[] = parsed
 .filter((p: any) => !BLOCKED_IDS.has((p.id ||'').toLowerCase()) && !BLOCKED_IDS.has((p.type ||'').toLowerCase()))
 .map((p: any) => {
 const id = (p.id ||'custom').toLowerCase();
 // Force correct type for core pages regardless of what AI returns
 const CORE_ID_TO_TYPE: Record<string, MembersAreaPage['type']> = { dashboard:'dashboard', profile:'profile', settings:'settings', admin:'admin', contact:'contact' };
 const type: MembersAreaPage['type'] = CORE_ID_TO_TYPE[id] || p.type ||'custom';
 return {
 id,
 name: p.name ||'Page',
 description: p.description ||'',
 type,
 required: REQUIRED_IDS.has(id) ? true : false,
 };
 });
 // Ensure all required default pages are always present
 const existingIds = new Set(aiPages.map(p => p.id));
 const missingRequired = DEFAULT_MEMBERS_PAGES.filter(dp => dp.required && !existingIds.has(dp.id));
 pages = [...aiPages, ...missingRequired];
 }
 } catch (err) { this.logger.debug("Caught (use defaults): " + err); }

 return { success: true, pages, apiKeysNeeded, searchResults };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, pages: DEFAULT_MEMBERS_PAGES, apiKeysNeeded, searchResults, error: message };
 }
 }

 // --- Generate members area (multi-page) -----------------------------------

 async generateMembersArea(request: GenerateRequest): Promise<GenerateResponse> {
 const orchestratorModel = request.orchestratorModel || DEFAULT_ORCHESTRATOR;
 const subAgentModel = request.subAgentModel || DEFAULT_SUB_AGENT;
 let pages = request.pages || DEFAULT_MEMBERS_PAGES;

 // Filter out blocked page types (support was removed)
 const BLOCKED_PAGE_IDS = new Set(['support','support-ticket']);
 pages = pages.filter(p => !BLOCKED_PAGE_IDS.has(p.id) && !BLOCKED_PAGE_IDS.has(p.type));

 // Force correct type for core pages regardless of what was passed in
 const CORE_ID_TO_TYPE: Record<string, MembersAreaPage['type']> = { dashboard:'dashboard', profile:'profile', settings:'settings', admin:'admin', contact:'contact' };
 pages = pages.map(p => CORE_ID_TO_TYPE[p.id] ? { ...p, type: CORE_ID_TO_TYPE[p.id] } : p);

 // Ensure admin page is always included even if the plan didn't have it
 const hasAdmin = pages.some(p => p.id ==='admin' || p.type ==='admin');
 if (!hasAdmin) {
 const adminPage = DEFAULT_MEMBERS_PAGES.find(p => p.id ==='admin');
 if (adminPage) pages = [...pages, adminPage];
 }

 // Ensure contact page is always included
 const hasContact = pages.some(p => p.id ==='contact' || p.type ==='contact');
 if (!hasContact) {
 const contactPage = DEFAULT_MEMBERS_PAGES.find(p => p.id ==='contact');
 if (contactPage) pages = [...pages, contactPage];
 }

 // Resolve the app's name and description so we can inject them into prompts
 let appName ='';
 let appDescription ='';
 if (request.appId) {
 try {
 const data = this.db.readSync();
 const app = (data.apps || []).find((a: any) => a.id === request.appId);
 if (app) {
 appName = app.name ||'';
 appDescription = app.description ||'';
 }
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }
 }
 const appIdentity = appName
 ?`This is the "${appName}" app. App description: "${appDescription}". ALL content, labels, stats, and copy must be specifically about ${appName} and its features.`
 :`App description: "${request.prompt}". ALL content must be relevant to this description.`;

 // Resolve per-app folder path
 const membersPath = this.getMembersDir(request.appId);

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
 ?`\n\nWEB RESEARCH (use for inspiration and best practices):\n${searchResults.flatMap(s => s.results).map((r: any, i: number) =>`${i + 1}. ${r.title}: ${r.description}`).join('\n')}`
 :'';

 // Step 1: Generate shared types + navigation layout with sub-agent
 allPlanSteps.push({
 id: 1,
 title:'Shared types & layout',
 description:'Generate TypeScript interfaces, shared types, and navigation sidebar layout',
 agent:'sub-agent',
 status:'running',
 });

 const pagesDescription = pages.map(p =>`- ${p.name} (${p.id}): ${p.description}`).join('\n');

 let sharedCode ='';
 try {
 const sharedResult = await this.callAI(
 subAgentModel,
`You are a TypeScript expert. Generate clean shared types and a sidebar navigation component for a members area.\n${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}`,
`${appIdentity}\n\nGenerate two files for a members area with these pages:\n${pagesDescription}\n\nThe members area is for: ${request.prompt}\n\nFile 1: TypeScript interfaces and types for all the data structures needed across the members area. Type names, field names, and comments should reflect the actual domain of this app (not generic names).\nFile 2: A MembersLayout component that has a left sidebar navigation with links to each page, and a main content area. The sidebar should highlight the active page. Navigation labels must be specific to this app's features. Use MUI components.\n\nUse the ===FILE: path=== / ===END_FILE=== format.\n\nReturn ONLY the code. No explanations.`,
 );
 totalSubAgentTokens += sharedResult.tokensUsed;
 sharedCode = sharedResult.content;
 const sharedFiles = this.parseFiles(sharedResult.content);
 allFiles.push(...sharedFiles);
 allPlanSteps[0].status ='complete';
 } catch (err) {
 this.logger.debug("Caught: " + err);
 allPlanSteps[0].status ='failed';
 }

 // Step 2: Generate each page
 const complexPageTypes = ['custom'];
 let stepId = 2;

 // Resolve app info for templates
 let templateAppName = appName ||'App';
 let templateAppId = request.appId || 1;
 let templatePrimaryColor ='#667eea';
 if (request.appId) {
 try {
 const data = this.db.readSync();
 const app = (data.apps || []).find((a: any) => a.id === request.appId);
 if (app) templatePrimaryColor = app.primary_color ||'#667eea';
 } catch (err) { this.logger.debug("Caught (use defaults): " + err); }
 }

 // Generate AI copy for all template pages in one cheap call
 let templateCopy: Record<string, Record<string, any>> = {};
 const hasTemplatePages = pages.some(pg => (TEMPLATE_PAGE_TYPES as readonly string[]).includes(pg.type));
 if (hasTemplatePages && (appDescription || appName)) {
 try {
 const copyResult = await this.callAI(
 subAgentModel,
 'You are a SaaS copywriter. Return ONLY valid JSON. No markdown fences, no explanation.',
 `Generate marketing copy for a SaaS members area.\nApp: "${templateAppName}"\nDescription: "${appDescription || request.prompt}"\n\nReturn JSON matching this EXACT structure:\n{\n  "dashboard": {\n    "heroSubtitle": "One sentence about what the user can track or do here",\n    "stats": [\n      { "label": "Domain-specific metric", "value": "Realistic sample", "change": "+X%" },\n      { "label": "Domain-specific metric", "value": "Realistic sample", "change": "+X%" },\n      { "label": "Domain-specific metric", "value": "Realistic sample", "change": "+X%" },\n      { "label": "Domain-specific metric", "value": "Realistic sample", "change": "Top X%" }\n    ],\n    "activity": [\n      { "title": "Short action title", "desc": "One-sentence detail" },\n      { "title": "Short action title", "desc": "One-sentence detail" },\n      { "title": "Short action title", "desc": "One-sentence detail" },\n      { "title": "Short action title", "desc": "One-sentence detail" }\n    ],\n    "gettingStarted": ["Step 1 label", "Step 2 label", "Step 3 label", "Step 4 label"]\n  },\n  "profile": { "bio": "Default bio text relevant to this app and its users" },\n  "settings": { "heroSubtitle": "Sentence about managing preferences for this app" },\n  "admin": { "heroSubtitle": "Sentence about admin capabilities for this app" },\n  "contact": {\n    "heroSubtitle": "Encouraging sentence about reaching out",\n    "infoCards": [\n      { "title": "Support channel name", "desc": "Availability info" },\n      { "title": "Support channel name", "desc": "Availability info" },\n      { "title": "Support channel name", "desc": "Availability info" }\n    ]\n  }\n}\n\nAll copy must be specific to "${templateAppName}". Use realistic sample data for this industry.`,
 );
 totalSubAgentTokens += copyResult.tokensUsed;
 const cleaned = copyResult.content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
 templateCopy = JSON.parse(cleaned);
 this.logger.log(`Generated AI copy for template pages (${copyResult.tokensUsed} tokens)`);
 } catch (err) {
 this.logger.warn(`Failed to generate copy, using template defaults: ${err}`);
 }
 }

 for (const page of pages) {
 const isComplex = complexPageTypes.includes(page.type);
 const agent = isComplex ?'orchestrator' :'sub-agent';
 const model = isComplex ? orchestratorModel : subAgentModel;

 const step: PlanStep = {
 id: stepId++,
 title:`${page.name} page`,
 description: page.description,
 agent,
 status:'running',
 };
 allPlanSteps.push(step);

 try {
 // Check for static template first -- saves ~2000-4000 tokens per page
 const templateCode = getPageTemplate(page.type, {
 appName: templateAppName,
 appId: templateAppId,
 primaryColor: templatePrimaryColor,
 copy: templateCopy[page.type] || {},
 });
 if (templateCode) {
 this.logger.log(`Using template with AI copy for ${page.type} page`);
 allFiles.push({
 path:`${membersPath}/${page.id}.tsx`,
 content: templateCode,
 language:'typescript',
 description:`${page.name} page (template)`,
 });
 step.status ='complete';
 continue;
 }
 const adminApiGuide = page.type ==='admin' ?`

ADMIN PANEL -- REAL API WIRING (CRITICAL):
This admin page MUST make real fetch() calls to the backend.
Use: const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';
The app ID for API calls is: ${request.appId}

Available endpoints (all return { success: boolean, data: T, timestamp: string }):

1. GET /api/apps/${request.appId}/stats
 Response data: { app_id, name, active_subscriptions, total_subscriptions, total_revenue, created_at }

2. GET /api/analytics/app/${request.appId}
 Response data: { app_id, total_page_views, unique_visitors, page_stats (Record<string,number>), views_by_date (Record<string,number>), recent_views[] }

3. GET /api/analytics/app/${request.appId}/visitors
 Response data: Array<{ visitor_id, first_visit, last_visit, page_views, pages[] }>

4. GET /api/analytics/errors?resolved=false
 Response data: { errors: Array<{ id, source, severity, message, timestamp, resolved }>, summary: { total, critical, errors, warnings, unresolved, bySource } }

5. POST /api/analytics/errors/:id/resolve (resolves an error)

6. GET /api/analytics/api-usage
 Response data: { entries[], summary: { totalCalls, successRate, totalTokens, totalCost, avgDuration, byProvider, byModule, byDay[] } }

7. GET /api/pages?app_id=${request.appId}
 Response data: Page[] -- each has { id, app_id, page_type, title, content_json, created_at, updated_at }

8. GET /api/analytics/n8n-executions
 Response data: { executions[], summary: { total, success, errors, running, errorRate } }

9. GET /api/apps/${request.appId}/members
 Response data: Array<{ id, app_id, name, email, plan_name, plan_price, status, created_at, subscription_id }>
 This returns all registered members for the app -- show in a "Users" tab with name, email, plan/tier, status, signup date.

10. DELETE /api/apps/${request.appId}/members/:userId   (removes a member)

11. PATCH /api/apps/${request.appId}/members/:userId   (body: { status: 'disabled' | 'active' } to enable/disable)

IMPLEMENTATION RULES:
- Use useEffect + useState to fetch data on mount from these REAL endpoints
- Show loading spinners while fetching
- Handle errors gracefully with error states
- Add a refresh button that re-fetches all data
- Include tabs or sections for: Users (registered members with plan/tier, disable and delete actions), Analytics (charts), Visitors, Error Logs (with resolve button), API Usage
- The Users tab is the FIRST tab -- it shows all registered members with columns: Name, Email, Plan, Status, Signed Up, Actions (disable/delete). Include a confirmation dialog before deleting.
- The support tickets section should show errors from /api/analytics/errors -- the admin can resolve them
- Do NOT use mock data -- ALL data comes from real API calls
- Use MUI Table, TableHead, TableRow, TableCell, TableBody for tabular data -- do NOT use @mui/x-data-grid (it is NOT installed)
- Use simple bar/line charts with MUI or inline SVG (no recharts/chart.js -- they are not installed)
- Use: const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :''; -- do NOT import from any config file. This works in both local dev and production.
- Do NOT import types from external files -- define any interfaces inline in this file
- Only import from'react','@mui/material','@mui/icons-material/*', and'react-router-dom' -- these are the ONLY available packages
` :'';

 const pagePrompt =`Generate a complete React page component for the "${page.name}" page of a members area.

${appIdentity}

Page purpose: ${page.description}

Overall members area description: ${request.prompt}

Pages in this members area:
${pagesDescription}

${sharedCode ?`\nAlready generated shared types (you may import types from these, but do NOT import or reference MembersLayout):\n${sharedCode}` :''}
${searchContext}
${adminApiGuide}
IMPORTANT RULES:
- Export the component as a named export: export function Members${this.toPascalCase(page.id)}Page()
- The component will be rendered inside a layout -- do NOT include sidebar navigation
- do NOT import or use MembersLayout -- the layout is provided externally. Your component is ONLY the page content.
- do NOT wrap the return in MembersLayout, the layout wrapper is handled by the preview system
- Use the app's color scheme consistently
- Include loading states (use Skeleton components to show content placeholders), error handling, empty states (centered icon + message + action button)
- Make it look PREMIUM and visually rich -- this should look like a $99/month SaaS dashboard, NOT a basic tutorial
- Include all necessary imports
- Use MUI icons (from @mui/icons-material) next to EVERY heading, stat, button, tab label, and list item
- Use Cards with shadows, gradients, colored accents, hover effects
- Use Chip components for tags/statuses, Avatar for user images, Badge for counts
- Stat cards should have large numbers, trend arrows (ArrowUpward/ArrowDownward), and icon decorations
- Use Grid layout for responsive card grids (xs=12, sm=6, md=4 or md=3)
- Add visual hierarchy: gradient header/hero section at top, then stat cards row, then detailed content below
- Tables need: alternating row backgrounds, status Chips with colors, action IconButtons
- Do NOT import from any config files or external type files -- define ALL interfaces and types INLINE in this same file
- Do NOT import from paths like'../config/api','../../types/','../shared/' -- the file must be 100% self-contained
- The ONLY allowed imports are:'react','@mui/material','@mui/icons-material/XxxIcon','react-router-dom'
- Do NOT use \`extends SomeType\` or \`implements SomeInterface\` unless you define that type in this same file
- Do NOT check response.ok or response.status after fetch() -- just call .json() and use the data. Errors are handled by the runtime.
- Use useState with sensible defaults (empty arrays [], null, 0) so the component never crashes before data arrives

CONTENT & COPY RULES (CRITICAL -- READ CAREFULLY):
- This is "${appName || request.prompt}" -- every piece of text on this page must relate to it
- ALL headings, labels, stats, descriptions, button text, and placeholder text MUST be specific to this app
- FORBIDDEN: generic text like "Lorem ipsum", "Item 1", "Sample data", "Total Items", "Welcome to your dashboard", "Your content here"
- Dashboard stats example: if this is a TikTok script app -> "Scripts Generated", "Viral Hooks Found", "Videos Analyzed". If fitness -> "Workouts", "Calories". Match the domain.
- Mock data: use ${appName ?`data that a "${appName}" user would actually see` :'realistic domain-specific data'}
- Empty states: "${appName ?`You haven't created any ${appName.toLowerCase()}-related content yet` :'No items yet'}" -- NOT "No items found"
- Section titles, card headers, and action buttons must all reference the app's actual features
- Think: "If I were a paying user of ${appName ||'this app'}, what would I expect to see on this ${page.name} page?"

Return the file using ===FILE: ${membersPath}/${page.id}.tsx=== / ===END_FILE=== format.
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
 path:`${membersPath}/${page.id}.tsx`,
 content: result.content.replace(/^```(?:tsx?|typescript)?\n?/m,'').replace(/\n?```$/m,'').trim(),
 language:'typescript',
 description:`${page.name} page`,
 });
 } else {
 allFiles.push(...pageFiles);
 }
 step.status ='complete';
 } catch (err) {
 this.logger.debug("Caught: " + err);
 step.status ='failed';
 }
 }

 // Step 3: Generate index/router file
 const routerStep: PlanStep = {
 id: stepId++,
 title:'Members area router',
 description:'Generate the main router/index that connects all members area pages',
 agent:'sub-agent',
 status:'running',
 };
 allPlanSteps.push(routerStep);

 try {
 // Generate the router deterministically -- no AI needed since we know the exact pages
 const routerImports = pages.map(p =>
`import { Members${this.toPascalCase(p.id)}Page } from'./${p.id}';`
 ).join('\n');
 const routerRoutes = pages.map(p =>
` <Route path="/${p.id}" element={<Members${this.toPascalCase(p.id)}Page />} />`
 ).join('\n');
 const routerCode =`import { Routes, Route, Navigate } from'react-router-dom';
${routerImports}

export function MembersArea() {
 return (
 <Routes>
${routerRoutes}
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
`;
 allFiles.push({
 path:`${membersPath}/index.tsx`,
 content: routerCode,
 language:'typescript',
 description:'Members area router',
 });
 routerStep.status ='complete';
 } catch (err) {
 this.logger.debug("Caught: " + err);
 routerStep.status ='failed';
 }

 this.recordUsage(orchestratorModel, subAgentModel, totalOrchestratorTokens, totalSubAgentTokens);

 // Auto-save all generated files to disk immediately
 if (allFiles.length > 0) {
 const writeResult = this.writeGeneratedFilesToDisk(allFiles);
 this.logger.log(`Auto-saved ${writeResult.written.length}/${allFiles.length} files to disk`);
 if (writeResult.errors.length > 0) {
 this.logger.warn(`Save errors: ${writeResult.errors.join(', ')}`);
 }
 }

 return {
 success: true,
 plan: allPlanSteps,
 files: allFiles,
 summary:`Generated ${allFiles.length} files for the members area with ${pages.length} pages: ${pages.map(p => p.name).join(',')}`,
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
 summary:'',
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

 // --- Single page / component generate (original flow) ---------------------

 async generate(request: GenerateRequest): Promise<GenerateResponse> {
 if (request.targetType ==='members-area') {
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

 const subTasks = plan.filter((s) => s.agent ==='sub-agent');
 const orchestratorTasks = plan.filter((s) => s.agent ==='orchestrator');

 const subResults: Map<number, string> = new Map();
 for (const task of subTasks) {
 try {
 task.status ='running';
 const result = await this.callAI(
 subAgentModel,
 this.getSubAgentSystemPrompt(task.title),
`${this.getDesignSystemContext()}\n${this.getAppContext(request.appId)}\n\nOriginal request: ${request.prompt}\n\nYour specific task: ${task.description}\n\nGenerate ONLY the code. No explanations, no markdown fences. Just the raw code.`,
 );
 subResults.set(task.id, result.content);
 totalSubAgentTokens += result.tokensUsed;
 task.status ='complete';
 } catch (err) {
 this.logger.debug("Caught: " + err);
 task.status ='failed';
 }
 }

 const subContext = Array.from(subResults.entries())
 .map(([id, content]) => {
 const task = plan.find((s) => s.id === id);
 return`--- Sub-agent output for "${task?.title}" ---\n${content}\n--- End ---`;
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
 orchestratorTasks.forEach((t) => (t.status ='complete'));
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
 summary:'',
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

 // --- Refine a single file ------------------------------------------------

 async refineFile(request: RefineRequest): Promise<{ success: boolean; file: GeneratedFile | null; tokensUsed: number; error?: string; question?: string }> {
 const model = request.model || DEFAULT_ORCHESTRATOR;
 try {
 const targetFile = request.files[request.fileIndex];
 if (!targetFile) return { success: false, file: null, tokensUsed: 0, error:'File index out of range' };

 const allFilesContext = request.files
 .map((f, i) =>`--- ${f.path} ${i === request.fileIndex ?'(TARGET FILE -- modify this one)' :''} ---\n${f.content}\n--- End ---`)
 .join('\n\n');

 const systemPrompt = `You are an expert React/TypeScript UI designer and developer. You are modifying an existing React component file based on the user's instructions.

${this.getDesignSystemContext()}

CAPABILITIES -- you can and MUST do ALL of the following when asked:
1. ADD new elements: Insert new JSX elements (Typography, Box, Button, Card, TextField, etc.) anywhere in the component tree. When asked to add text, headings, paragraphs, sections, form fields, buttons, images, dividers, or any other element -- DO IT by inserting the appropriate JSX.
2. DELETE/REMOVE elements: Remove any JSX elements, sections, or components the user wants removed. When asked to remove, delete, or hide something -- find it in the JSX tree and remove it entirely.
3. RESTRUCTURE/REORDER: Move elements around, wrap them in new containers, change the layout structure, reorder sections.
4. MODIFY STYLES: Change colors, fonts, spacing, sizes, backgrounds, borders, shadows, gradients, etc. via the sx prop.
5. MODIFY CONTENT: Change text content, labels, headings, placeholder text, button labels, etc.
6. ADD/MODIFY INTERACTIVITY: Add state variables (useState), event handlers, toggles, dialogs, form submissions, etc.

IMPORTANT RULES:
- ALWAYS return the COMPLETE file content with your changes applied. Never return partial code or just the changed section.
- Preserve ALL existing functionality, imports, and code that the user did NOT ask to change.
- Add any necessary new imports at the top of the file (e.g. new MUI components, icons).
- Make sure the JSX is valid and the component will compile without errors.
- Be bold and thorough with changes -- if the user asks to add an element, add it with proper styling that matches the existing design.

WHEN YOU ARE UNSURE:
If the user's instruction is ambiguous or you need more information to make the right change (e.g. you don't know WHERE to place a new element, WHAT content it should have, or WHICH element they're referring to), respond with ONLY a JSON object in this exact format:
{"question": "Your clarifying question here"}

Examples of when to ask:
- "Add a button" -- where? what label? what action?
- "Change the color" -- which element? what color?
- "Move it" -- move what? to where?

Only ask ONE clear question at a time. If you can make a reasonable assumption, just do it rather than asking.

OUTPUT FORMAT:
- If you can fulfill the request: Return the complete updated file content. No markdown fences, no explanations.
- If you need clarification: Return {"question": "your question"}`;

 const prompt = `Here are the current generated files:\n\n${allFilesContext}\n\nInstruction for the TARGET file (${targetFile.path}):\n${request.instruction}\n\nApply the requested changes to the TARGET file. Remember: you can ADD new JSX elements, DELETE existing ones, RESTRUCTURE the layout, and MODIFY styles/content. Return the complete updated file content.`;

 const result = await this.callAI(model, systemPrompt, prompt);

 const rawContent = result.content.trim();

 // Check if the AI is asking a clarifying question
 const questionMatch = rawContent.match(/^\s*\{\s*"question"\s*:\s*"([^"]+)"\s*\}\s*$/);
 if (questionMatch) {
 return { success: true, file: null, tokensUsed: result.tokensUsed, question: questionMatch[1] };
 }

 // Also handle cases where the question JSON might be wrapped in markdown fences
 const fenceStripped = rawContent.replace(/^```(?:json)?\n?/m,'').replace(/\n?```$/m,'').trim();
 const questionMatch2 = fenceStripped.match(/^\s*\{\s*"question"\s*:\s*"([^"]+)"\s*\}\s*$/);
 if (questionMatch2) {
 return { success: true, file: null, tokensUsed: result.tokensUsed, question: questionMatch2[1] };
 }

 const updatedContent = rawContent
 .replace(/^```(?:tsx?|typescript|javascript)?\n?/m,'')
 .replace(/\n?```$/m,'')
 .trim();

 const updatedFile = { ...targetFile, content: updatedContent };
 // Auto-save refined file to disk
 try {
 this.writeGeneratedFilesToDisk([updatedFile]);
 this.logger.log(`Auto-saved refined file: ${updatedFile.path}`);
 } catch (e) { this.logger.warn(`Failed to auto-save: ${e}`); }

 return { success: true, file: updatedFile, tokensUsed: result.tokensUsed };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, file: null, tokensUsed: 0, error: message };
 }
 }

 // --- Sub-task (cheap model) ----------------------------------------------

 async runSubTask(request: SubTaskRequest): Promise<{ success: boolean; result: string; tokensUsed: number; error?: string }> {
 const model = request.model || DEFAULT_SUB_AGENT;
 const prompts: Record<string, { system: string; user: string }> = {
 types: {
 system:'You are a TypeScript type generation expert. Generate clean, well-documented TypeScript interfaces and types. Return only the code.',
 user:`Generate TypeScript types/interfaces for:\n${request.context}`,
 },
 styles: {
 system:`You are a Material-UI styling expert. Generate sx prop objects and MUI theme customizations. ${this.getDesignSystemContext()}\nReturn only the code.`,
 user:`Generate MUI styles for:\n${request.context}`,
 },
 utils: {
 system:'You are a utility function expert. Generate clean, well-typed TypeScript utility functions. Return only the code.',
 user:`Generate utility functions for:\n${request.context}`,
 },
 docs: {
 system:'You are a documentation expert. Generate clear JSDoc comments and README content.',
 user:`Generate documentation for:\n${request.context}`,
 },
 review: {
 system:'You are a senior code reviewer. Find bugs, security issues, performance problems, and suggest improvements.',
 user:`Review this code and provide actionable feedback:\n${request.context}`,
 },
 test: {
 system:'You are a testing expert. Generate unit tests using Jest and React Testing Library. Return only the test code.',
 user:`Generate tests for:\n${request.context}`,
 },
 };

 const taskPrompt = prompts[request.task];
 if (!taskPrompt) return { success: false, result:'', tokensUsed: 0, error:`Unknown task type: ${request.task}` };

 try {
 const aiResult = await this.callAI(model, taskPrompt.system, taskPrompt.user);
 return { success: true, result: aiResult.content, tokensUsed: aiResult.tokensUsed };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, result:'', tokensUsed: 0, error: message };
 }
 }

 // --- Load existing members area files from disk -------------------------

 async getMembersFiles(appId?: number): Promise<{ success: boolean; files: { path: string; content: string; language: string; description: string }[]; appSlug?: string }> {
 const projectRoot = path.resolve(__dirname,'..','..','..');
 const slug = this.getAppSlug(appId);
 const membersBase = path.resolve(projectRoot,'frontend','src','components','members');
 // If appId given and slug exists, read from per-app subfolder
 const membersDir = slug ? path.resolve(membersBase, slug) : membersBase;
 const layoutPath = path.resolve(projectRoot,'src','components','MembersLayout.tsx');
 const loadedFiles: { path: string; content: string; language: string; description: string }[] = [];

 try {
 // Load MembersLayout.tsx if it exists
 if (fs.existsSync(layoutPath)) {
 const content = fs.readFileSync(layoutPath,'utf-8');
 loadedFiles.push({
 path:'src/components/MembersLayout.tsx',
 content,
 language:'tsx',
 description:'Members area layout with navigation sidebar',
 });
 }

 // Load all .tsx/.ts files from the app's members folder
 if (fs.existsSync(membersDir)) {
 const relPrefix = slug ?`frontend/src/components/members/${slug}` :'frontend/src/components/members';
 const entries = fs.readdirSync(membersDir).filter(f => {
 // Only pick files, not subdirectories
 const fullPath = path.resolve(membersDir, f);
 return (f.endsWith('.tsx') || f.endsWith('.ts')) && fs.statSync(fullPath).isFile();
 }).sort();
 for (const entry of entries) {
 const filePath = path.resolve(membersDir, entry);
 const content = fs.readFileSync(filePath,'utf-8');
 const name = entry.replace(/\.(tsx|ts)$/,'');
 loadedFiles.push({
 path:`${relPrefix}/${entry}`,
 content,
 language: entry.endsWith('.tsx') ?'tsx' :'typescript',
 description:`${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g,'')} page`,
 });
 }
 }

 return { success: true, files: loadedFiles, appSlug: slug || undefined };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, files: [], error: message } as any;
 }
 }

 // --- Save files to disk --------------------------------------------------

 async saveFiles(files: { path: string; content: string }[]): Promise<{ success: boolean; saved: string[]; errors: string[] }> {
 const saved: string[] = [];
 const errors: string[] = [];
 const projectRoot = path.resolve(__dirname,'..','..','..');

 for (const file of files) {
 try {
 // Normalise path: strip leading slashes, fix bare /src/ to frontend/src/
 let safePath = file.path.replace(/^\/+/, '').replace(/^\\+/, '');
 if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
 const filePath = path.resolve(projectRoot, safePath);
 if (!filePath.startsWith(projectRoot)) {
 errors.push(`${file.path}: path escapes project root`);
 continue;
 }
 const dir = path.dirname(filePath);
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 fs.writeFileSync(filePath, file.content,'utf-8');
 saved.push(file.path);
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 errors.push(`${file.path}: ${message}`);
 }
 }

 return { success: errors.length === 0, saved, errors };
 }

 // --- Git Snapshot & Rollback (delegates to GitOps) --------------------------

 /** Create a git snapshot before the agent starts making changes */
 createGitSnapshot(label?: string) { return this.gitOps.createSnapshot(label); }

 /** Rollback to a previous git snapshot */
 rollbackToSnapshot(commitHash: string) { return this.gitOps.rollback(commitHash); }

 /** Get the diff between current state and a snapshot */
 getSnapshotDiff(commitHash: string) { return this.gitOps.getDiff(commitHash); }

 // --- Codebase Search (delegates to CodeTools) --------------------------------

 searchCodebase(query: string, options?: { includePattern?: string; isRegex?: boolean; maxResults?: number }) {
   return this.codeTools.searchCodebase(query, options);
 }

 // --- Diff Generation (delegates to CodeTools) --------------------------------

 private generateDiff(oldContent: string, newContent: string, filePath: string): string {
   return this.codeTools.generateDiff(oldContent, newContent, filePath);
 }

 // =========================================================================
 // DIAGNOSTIC RETRY SYSTEM (delegates to RetryEngine)
 // =========================================================================

 private async diagnosticRetry(
   step: any, originalError: string, modelId: string,
   existingFiles: GeneratedFile[], generatedFiles: GeneratedFile[], modifiedFiles: GeneratedFile[],
   webContext: string, fileContext: string,
   sendEvent: (event: string, data: any) => void, appContext: string,
 ) {
   return this.retryEngine.diagnosticRetry(step, originalError, modelId, existingFiles, generatedFiles, modifiedFiles, webContext, fileContext, sendEvent, appContext);
 }

 private async rePlanRemainingSteps(
   failedSteps: { title: string; error: string }[], completedSteps: { title: string; detail: string }[],
   remainingSteps: any[], originalMessage: string, modelId: string,
   existingFiles: GeneratedFile[], generatedFiles: GeneratedFile[], appContext: string,
 ) {
   return this.retryEngine.rePlanRemainingSteps(failedSteps, completedSteps, remainingSteps, originalMessage, modelId, existingFiles, generatedFiles, appContext);
 }

 // --- Run shell command safely --------------------------------------------

 private runCommand(command: string, cwd?: string): { success: boolean; output: string; error?: string } {
 const projectRoot = path.resolve(__dirname,'..','..','..');
 const workDir = cwd ? path.resolve(projectRoot, cwd) : projectRoot;
 try {
 const output = execSync(command, {
 cwd: workDir,
 encoding:'utf-8',
 timeout: 120_000, // 2 min max
 stdio: ['pipe','pipe','pipe'],
 env: { ...process.env, NODE_ENV:'development' },
 });
 return { success: true, output: output.trim() };
 } catch (err: any) {
 return {
 success: false,
 output: (err.stdout ||'').toString().trim(),
 error: (err.stderr || err.message ||'').toString().trim(),
 };
 }
 }

 // --- Install npm packages -----------------------------------------------

 private installPackages(packages: string[], target:'frontend' |'backend' ='frontend', dev = false): { success: boolean; installed: string[]; error?: string } {
 if (!packages || packages.length === 0) return { success: true, installed: [] };

 // Normalise: if a string was passed instead of array, split it
 if (typeof packages === 'string') {
 packages = (packages as string).split(/[\s,]+/).filter(Boolean);
 }

 // Sanitize package names to prevent command injection
 const validPkg = /^@?[a-zA-Z0-9][\w.\-\/]*(@[\w.\-^~>=<*]+)?$/;
 const safe: string[] = [];
 for (const pkg of packages) {
 const trimmed = pkg.trim();
 // Reject single-character "packages" (symptom of string-as-iterable bug)
 if (trimmed.length <= 1) continue;
 if (!validPkg.test(trimmed)) {
 return { success: false, installed: [], error: `Invalid package name rejected: "${trimmed}"` };
 }
 safe.push(trimmed);
 }

 const flag = dev ?'--save-dev' :'--save';
 const cmd = `npm install ${flag} ${safe.join(' ')}`;
 const result = this.runCommand(cmd, target);
 if (result.success) {
 return { success: true, installed: safe };
 }
 return { success: false, installed: [], error: result.error || result.output };
 }

 // --- Write generated files directly to disk -----------------------------

 private writeGeneratedFilesToDisk(files: GeneratedFile[]): { written: string[]; errors: string[] } {
 const projectRoot = path.resolve(__dirname,'..','..','..');
 const written: string[] = [];
 const errors: string[] = [];

 for (const file of files) {
 try {
 // Normalise path: strip leading slashes, fix bare /src/ to frontend/src/
 let safePath = file.path.replace(/^\/+/, '').replace(/^\\+/, '');
 if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
 const filePath = path.resolve(projectRoot, safePath);
 if (!filePath.startsWith(projectRoot)) {
 errors.push(`${file.path}: path escapes project root`);
 continue;
 }
 const dir = path.dirname(filePath);
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 fs.writeFileSync(filePath, file.content,'utf-8');
 written.push(file.path);
 } catch (err) {
 errors.push(`${file.path}: ${err instanceof Error ? err.message : String(err)}`);
 }
 }
 return { written, errors };
 }

 // --- Read a file from disk ----------------------------------------------

 private readFileFromDisk(filePath: string): string | null {
 const projectRoot = path.resolve(__dirname,'..','..','..');
 let safePath = filePath.replace(/^\/+/, '').replace(/^\\+/, '');
 if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
 const absPath = path.resolve(projectRoot, safePath);
 if (!absPath.startsWith(projectRoot)) return null;
 try {
 return fs.readFileSync(absPath,'utf-8');
 } catch (err) { this.logger.debug("Caught (returning null): " + err); return null; }
 }

 // --- List directory -----------------------------------------------------

 private listDirectory(dirPath: string): string[] {
 const projectRoot = path.resolve(__dirname,'..','..','..');
 const absDir = path.resolve(projectRoot, dirPath);
 if (!absDir.startsWith(projectRoot)) return [];
 try {
 return fs.readdirSync(absDir, { recursive: true }).map(f => f.toString());
 } catch (err) { this.logger.debug("Caught (returning []): " + err); return []; }
 }

 // --- Verify TypeScript build (only for files we touched) -----------------

 private verifyBuild(target:'frontend' |'backend', onlyFiles?: string[]): { success: boolean; errors: string[] } {
 const result = this.runCommand('npx tsc --noEmit 2>&1', target);
 if (result.success && !result.output.includes('error TS')) {
 return { success: true, errors: [] };
 }
 // Parse ALL TS errors
 const allErrorLines = (result.output +'\n' + (result.error ||'')).split('\n').filter(l => l.includes('error TS'));

 // If we have a list of files we touched, only report errors in THOSE files
 if (onlyFiles && onlyFiles.length > 0) {
 const normalizedPaths = onlyFiles.map(f => {
 // Strip leading target dir (e.g.'frontend/src/...' >src/...')
 const stripped = f.replace(/^(frontend|backend)\//,'');
 return stripped.replace(/\//g,'\\'); // normalize to backslash for Windows matching
 });
 const relevantErrors = allErrorLines.filter(errLine => {
 return normalizedPaths.some(p => errLine.includes(p) || errLine.includes(p.replace(/\\/g,'/')));
 });
 if (relevantErrors.length === 0) {
 return { success: true, errors: [] }; // our files are clean, ignore pre-existing errors
 }
 return { success: false, errors: relevantErrors.slice(0, 30) };
 }

 return { success: false, errors: allErrorLines.slice(0, 30) };
 }

 // --- Auto-fix build errors via AI ---------------------------------------

 private async autoFixBuildErrors(
 errors: string[],
 files: GeneratedFile[],
 modelId: string,
 ): Promise<{ fixed: GeneratedFile[]; remainingErrors: string[] }> {
 // Group errors by file
 const errorsByFile: Record<string, string[]> = {};
 for (const err of errors) {
 const match = err.match(/^(.+?)\(\d+,\d+\):/);
 if (match) {
 const file = match[1].replace(/\\/g,'/');
 if (!errorsByFile[file]) errorsByFile[file] = [];
 errorsByFile[file].push(err);
 }
 }

 const fixedFiles: GeneratedFile[] = [];

 for (const [errFilePath, fileErrors] of Object.entries(errorsByFile)) {
 // Find the file in our generated files -- normalize both paths for comparison
 const normalizedErrPath = errFilePath.replace(/\\/g,'/');
 const genFile = files.find(f => {
 const normGenPath = f.path.replace(/\\/g,'/');
 // Match by: exact path, end-of-path match, or stripping frontend/backend prefix
 return normalizedErrPath.endsWith(normGenPath)
 || normalizedErrPath.endsWith(normGenPath.replace(/^(frontend|backend)\//,''))
 || normGenPath.endsWith(normalizedErrPath);
 });

 if (!genFile) {
 // If the file isn't one we generated, try reading it from disk to fix it
 const diskContent = this.readFileFromDisk(errFilePath) || this.readFileFromDisk('frontend/' + errFilePath) || this.readFileFromDisk('backend/' + errFilePath);
 if (!diskContent) continue;
 // Create a synthetic GeneratedFile for the disk file
 const synthFile: GeneratedFile = {
 path: errFilePath,
 content: diskContent,
 language: errFilePath.endsWith('.tsx') ?'tsx' :'typescript',
 };
 files.push(synthFile);
 // Now fix it
 const fixPrompt = this.buildFixPrompt(synthFile, fileErrors);
 try {
 const fixResult = await this.callAI(modelId,'Expert TypeScript/React debugger. Fix all compilation errors while preserving ALL existing functionality. Do not remove features.', fixPrompt);
 const fixedContent = this.cleanCodeResponse(fixResult.content);
 if (fixedContent.length > 50) {
 synthFile.content = fixedContent;
 fixedFiles.push(synthFile);
 }
 } catch (err) { this.logger.debug("Caught (skip): " + err); }
 continue;
 }

 const fixPrompt = this.buildFixPrompt(genFile, fileErrors);
 try {
 const fixResult = await this.callAI(modelId,'Expert TypeScript/React debugger. Fix all compilation errors while preserving ALL existing functionality. Do not remove features.', fixPrompt);
 const fixedContent = this.cleanCodeResponse(fixResult.content);
 if (fixedContent.length > 50) {
 genFile.content = fixedContent;
 fixedFiles.push(genFile);
 }
 } catch (err) { this.logger.debug("Caught (skip unfixable files): " + err); }
 }

 return { fixed: fixedFiles, remainingErrors: [] };
 }

 private buildFixPrompt(file: GeneratedFile, errors: string[]): string {
 // Include diagnostic context if available (set by escalated build verification)
 const diagnosticCtx = (file as any)._diagnosticContext || '';

 return`Fix ALL TypeScript compilation errors in this file. Do NOT remove any existing functionality -- only fix the errors.

## File: ${file.path}
\`\`\`${file.language}
${file.content}
\`\`\`

## Compilation Errors (${errors.length}):
${errors.join('\n')}

${diagnosticCtx ? `## Related files (imports / types referenced by this file):\n${diagnosticCtx}\n` : ''}

## Fix Strategy:
1. Read each error carefully -- understand the ROOT CAUSE, don't just suppress it
2. Missing imports: add the import statement with the CORRECT path from the project
3. Type errors: check what the actual type should be from the imported module, don't just cast to 'any'
4. Unused variables: prefix with _ only if truly unused. If it should be used, wire it up correctly
5. Module not found: check the related files above for correct import paths. Use relative paths
6. Property does not exist: check the interface/type definition in the related files
7. 'err' is of type 'unknown': use (err instanceof Error ? err.message : String(err))

IMPORTANT: Do NOT remove features, functionality, or imports that aren't causing errors.
IMPORTANT: Do NOT replace complex logic with simplified stubs -- preserve the original intent.

Fix every single error. Return ONLY the complete corrected file content. No markdown fences, no explanation.`;
 }

 private cleanCodeResponse(content: string): string {
 return content
 .replace(/^```(?:tsx?|typescript|javascript)?\n?/m,'')
 .replace(/\n?```$/m,'')
 .trim();
 }

 // --- Auto-register a NestJS module in app.module.ts ---------------------

 private registerNestModule(moduleName: string, modulePath: string): boolean {
 const appModulePath = path.resolve(__dirname,'..','app.module.ts');
 try {
 let content = fs.readFileSync(appModulePath,'utf-8');
 // Check if already registered
 if (content.includes(moduleName)) return true;

 // Add import
 const importLine =`import { ${moduleName} } from'${modulePath}';\n`;
 content = importLine + content;

 // Add to imports array
 content = content.replace(
 /imports:\s*\[/,
`imports: [\n ${moduleName},`,
 );

 fs.writeFileSync(appModulePath, content,'utf-8');
 return true;
 } catch (err) { this.logger.debug("Caught (returning false): " + err); return false; }
 }

 // --- Detect required npm packages from code -----------------------------

 private detectRequiredPackages(files: GeneratedFile[]): { frontend: string[]; backend: string[] } {
 const frontendPkgs = new Set<string>();
 const backendPkgs = new Set<string>();

 // Common package patterns to detect
 const packageMap: Record<string, { pkg: string; target:'frontend' |'backend' }> = {
'xlsx': { pkg:'xlsx', target:'frontend' },
'file-saver': { pkg:'file-saver', target:'frontend' },
'FileSaver': { pkg:'file-saver', target:'frontend' },
'saveAs': { pkg:'file-saver', target:'frontend' },
'react-beautiful-dnd': { pkg:'react-beautiful-dnd', target:'frontend' },
'@hello-pangea/dnd': { pkg:'@hello-pangea/dnd', target:'frontend' },
'recharts': { pkg:'recharts', target:'frontend' },
'chart.js': { pkg:'chart.js react-chartjs-2', target:'frontend' },
'react-chartjs-2': { pkg:'chart.js react-chartjs-2', target:'frontend' },
'date-fns': { pkg:'date-fns', target:'frontend' },
'dayjs': { pkg:'dayjs', target:'frontend' },
'moment': { pkg:'moment', target:'frontend' },
'react-hook-form': { pkg:'react-hook-form', target:'frontend' },
'zod': { pkg:'zod', target:'frontend' },
'framer-motion': { pkg:'framer-motion', target:'frontend' },
'react-router-dom': { pkg:'react-router-dom', target:'frontend' },
'react-dropzone': { pkg:'react-dropzone', target:'frontend' },
'@dnd-kit': { pkg:'@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities', target:'frontend' },
'apify-client': { pkg:'apify-client', target:'backend' },
'puppeteer': { pkg:'puppeteer', target:'backend' },
'cheerio': { pkg:'cheerio', target:'backend' },
'nodemailer': { pkg:'nodemailer', target:'backend' },
'stripe': { pkg:'stripe', target:'backend' },
'jsonwebtoken': { pkg:'jsonwebtoken', target:'backend' },
'bcrypt': { pkg:'bcrypt', target:'backend' },
'class-validator': { pkg:'class-validator class-transformer', target:'backend' },
'bull': { pkg:'bull', target:'backend' },
'@nestjs/schedule': { pkg:'@nestjs/schedule', target:'backend' },
 };

 for (const file of files) {
 const content = file.content;
 for (const [importKey, { pkg, target }] of Object.entries(packageMap)) {
 if (content.includes(importKey)) {
 const pkgs = pkg.split('');
 for (const p of pkgs) {
 if (target ==='frontend') frontendPkgs.add(p);
 else backendPkgs.add(p);
 }
 }
 }

 // Also detect from import statements: import ... from'package-name'
 const importMatches = content.matchAll(/from\s+['"]([@a-z][a-z0-9\-\/\.]*)['"]/g);
 for (const m of importMatches) {
 const pkg = m[1];
 // Skip relative imports, react, react-dom, and MUI (already installed)
 if (pkg.startsWith('.') || pkg.startsWith('@mui') || pkg ==='react' || pkg ==='react-dom') continue;
 const target = file.path.startsWith('backend/') ?'backend' :'frontend';
 if (target ==='frontend') frontendPkgs.add(pkg);
 else backendPkgs.add(pkg);
 }
 }

 return {
 frontend: [...frontendPkgs],
 backend: [...backendPkgs],
 };
 }

 // --- Models & Stats ------------------------------------------------------

 getAvailableModels() {
 const hasAnthropic = !!this.getApiKey('anthropic');
 const hasOpenAI = !!this.getApiKey('openai');
 const hasBrave = !!this.getApiKey('brave');
 const hasApify = !!this.getApiKey('apify');

 const available = MODELS.filter((m) => {
 if (m.provider ==='anthropic') return hasAnthropic;
 if (m.provider ==='openai') return hasOpenAI;
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
 } catch (err) {
 this.logger.debug('Failed to read agent stats: ' + err);
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
 const complexTypes = ['dashboard','custom'];
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
 { role:'Orchestrator', model: orchConfig?.name || orchestratorModel, tokens: totalOrch, cost: parseFloat(((totalOrch / 1000) * orchCost).toFixed(4)) },
 { role:'Sub-Agent', model: subConfig?.name || subAgentModel, tokens: totalSub, cost: parseFloat(((totalSub / 1000) * subCost).toFixed(4)) },
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
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }
 }

 // --- Prompt builders ----------------------------------------------------

 private getArchitectSystemPrompt(): string {
 return`You are a senior software architect. Analyze the request and return a JSON array of implementation steps.

Step schema: {id: number, title: string, description: string, agent: "orchestrator"|"sub-agent"}

Delegation: sub-agent -> types, utils, constants, styles. orchestrator -> React components, complex logic, state.
2-5 steps max. Output ONLY the JSON array.`;
 }

 private getSubAgentSystemPrompt(taskTitle: string): string {
 return`You are a fast, efficient code generator handling the "${taskTitle}" sub-task. Generate clean, well-typed TypeScript code. Return ONLY the code, no explanations, no markdown fences.`;
 }

 private getCodeGenSystemPrompt(): string {
 return`Expert React/TypeScript developer. Generate production-quality code.

${this.getDesignSystemContext()}

FORMAT: ===FILE: path=== ... ===END_FILE=== then SUMMARY: line.
RULES: Complete runnable files, correct imports, error/loading/empty states, TypeScript types, functional components with hooks. No placeholders or TODOs.`;
 }

 private buildPlanPrompt(request: GenerateRequest): string {
 const targetInfo = request.targetType ?`Target type: ${request.targetType}` :'';
 const appContext = this.getAppContext(request.appId);
 return`Create an implementation plan for:\n\n${request.prompt}\n\n${targetInfo}\n${appContext}\n\nOutput ONLY the JSON array of steps.`;
 }

 private buildMainCodePrompt(request: GenerateRequest, subAgentOutputs: string): string {
 const appContext = this.getAppContext(request.appId);
 const subSection = subAgentOutputs
 ?`\n\nSub-agent generated code (incorporate or reference as needed):\n${subAgentOutputs}`
 :'';
 return`Generate the code for:\n\n${request.prompt}\n\n${appContext}${subSection}\n\nGenerate all necessary files using the ===FILE: path=== / ===END_FILE=== format. End with a SUMMARY: line.`;
 }

 // --- Response parsers ----------------------------------------------------

 private parsePlan(content: string): PlanStep[] {
 try {
 const jsonMatch = content.match(/\[[\s\S]*\]/);
 if (jsonMatch) {
 const parsed = JSON.parse(jsonMatch[0]);
 return parsed.map((step: any) => ({
 id: step.id || 0,
 title: step.title ||'Untitled',
 description: step.description ||'',
 agent: step.agent ==='sub-agent' ?'sub-agent' :'orchestrator',
 status:'pending' as const,
 }));
 }
 } catch (err) { this.logger.debug("Caught (fall through): " + err); }

 return [{ id: 1, title:'Generate code', description:'Generate all code in a single pass', agent:'orchestrator', status:'pending' }];
 }

 private parseFiles(content: string): GeneratedFile[] {
 const files: GeneratedFile[] = [];
 const filePattern = /===FILE:\s*(.+?)===\n([\s\S]*?)===END_FILE===/g;
 let match: RegExpExecArray | null;

 while ((match = filePattern.exec(content)) !== null) {
 const filePath = match[1].trim();
 const fileContent = match[2].trim();
 const ext = path.extname(filePath).slice(1);
 const langMap: Record<string, string> = { tsx:'typescript', ts:'typescript', jsx:'javascript', js:'javascript', css:'css', json:'json', md:'markdown', sql:'sql' };
 files.push({ path: filePath, content: fileContent, language: langMap[ext] || ext, description:`Generated file: ${filePath}` });
 }

 if (files.length === 0 && content.trim().length > 0) {
 const cleanContent = content
 .replace(/^```(?:tsx?|typescript|javascript)?\n?/m,'')
 .replace(/\n?```$/m,'')
 .replace(/^SUMMARY:.*$/m,'')
 .trim();

 if (cleanContent) {
 // Detect if this is backend code (NestJS patterns) vs frontend
 const isBackend = cleanContent.includes('@Controller') || cleanContent.includes('@Injectable') || cleanContent.includes('@Module') || cleanContent.includes('NestFactory');
 if (isBackend) {
 // Don't fallback to GeneratedPage.tsx for backend code -- try to extract a reasonable path
 const controllerMatch = cleanContent.match(/@Controller\(['"](?:api\/)?([\\w-]+)['"]\)/);
 const slug = controllerMatch ? controllerMatch[1] :'generated-api';
 files.push({ path:`backend/src/${slug}/${slug}.service.ts`, content: cleanContent, language:'typescript', description:`Generated backend: ${slug}` });
 } else {
 // Try to extract component name from export statement
 const exportMatch = cleanContent.match(/export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/);
 const componentName = exportMatch ? exportMatch[1] :'GeneratedComponent';
 files.push({ path:`frontend/src/components/${componentName}.tsx`, content: cleanContent, language:'typescript', description:`Generated component: ${componentName}` });
 }
 }
 }

 return files;
 }

 private extractSummary(content: string): string {
 const summaryMatch = content.match(/SUMMARY:\s*(.+)/);
 return summaryMatch?.[1]?.trim() ||'Code generated successfully.';
 }

 // --- Finalize: analyze generated pages for backend work -------------------

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
 return { success: true, tasks: [], summary:'No pages to analyze.' };
 }

 const filesContext = tsxFiles.map(f => {
 // Truncate very large files to save tokens
 const content = f.content.length > 4000 ? f.content.slice(0, 4000) +'\n// ... truncated ...' : f.content;
 return`--- ${f.path} ---\n${content}\n--- END ---`;
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

 const systemPrompt =`You are a senior backend engineer analysing React frontend pages to determine what backend infrastructure they need to actually work.

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
 "category": "database" | "api" | "integration" | "security" | "data" | "frontend_wiring",
 "title": "Short title",
 "description": "What needs to be done and why",
 "priority": "high" | "medium" | "low",
 "autoImplement": true/false,
 "seedData": { "table": "tableName", "records": [...] }, // only if autoImplement is true AND category is "database" or "data"
 "apiSpec": { "route": "/api/route-name", "methods": ["GET","POST"], "description": "What this API does" } // only if category is "api"
}

IMPORTANT -- CROSS-PAGE RELATIONSHIPS:
Analyse how pages relate to each other. Common patterns:
- Contact / enquiry / booking forms --> need a DB table AND the admin/dashboard page must display submissions
- User profiles / settings forms --> need stored data AND admin visibility
- Comment / review sections --> need a DB table AND admin moderation view
- Order / purchase flows --> need orders table AND admin order management
- Newsletter / subscription forms --> need subscribers table AND admin list view
For each form or user-generated-content component, create TWO tasks:
  1) "database" task to create the table with seed data
  2) "frontend_wiring" task to amend the admin/dashboard page to display that data
Set category:"frontend_wiring" for tasks that require editing an existing frontend page.
Include "targetFile" in the task -- the file path of the page that needs editing.

Rules:
- Be practical and specific -- reference actual component names and data they display
- Mark a task as autoImplement:true if it's a database seed (creating sample records) -- provide seedData
- For API tasks, set category:"api" and include apiSpec -- these CAN be auto-implemented
- For frontend_wiring tasks, set category:"frontend_wiring" and include targetFile (the path of the page to edit)
- For seed data, provide realistic, domain-appropriate records (5-10 per table)
- Include app_id in seed records where appropriate
- Don't duplicate tasks
- Order by priority (high first) -- database tasks before frontend_wiring tasks that depend on them
- Typically 5-15 tasks for a full members area
- Do NOT include security tasks (JWT auth, RBAC, input validation) unless specifically requested -- these are handled separately

Return ONLY the JSON array. No markdown fences, no explanation.`;

 try {
 const result = await this.callAI(aiModel, systemPrompt,`Analyze these generated frontend pages and identify all backend work needed:\n\n${filesContext}`);

 let tasks: BackendTask[] = [];
 try {
 const jsonMatch = result.content.match(/\[[\s\S]*\]/);
 if (jsonMatch) {
 const parsed = JSON.parse(jsonMatch[0]);
 tasks = parsed.map((t: any) => ({
 id: t.id ||`task-${Math.random().toString(36).slice(2, 8)}`,
 category: t.category ||'api',
 title: t.title ||'Untitled task',
 description: t.description ||'',
 priority: t.priority ||'medium',
 status:'pending' as const,
 ...(t.targetFile ? { targetFile: t.targetFile } : {}),
 implementation: t.autoImplement && t.seedData ? {
 type:'db_seed' as const,
 payload: t.seedData,
 } : t.category ==='api' && t.apiSpec ? {
 type:'create_api' as const,
 payload: t.apiSpec,
 } : undefined,
 }));
 }
 } catch (err) { this.logger.debug("Caught (parsing failed, return empty): " + err); }

 // Check which tasks are already done (e.g. table already has records)
 for (const task of tasks) {
 if (task.implementation?.type ==='db_seed') {
 const table = task.implementation.payload.table;
 const existing = Array.isArray(db[table])
 ? (appId ? (db[table] as any[]).filter((r: any) => r.app_id === appId) : db[table] as any[])
 : [];
 if (existing.length > 0) {
 task.status ='done';
 }
 }
 }

 const pending = tasks.filter(t => t.status !=='done');
 const auto = tasks.filter(t => t.status ==='pending' && t.implementation);
 const summary = tasks.length === 0
 ?'No backend tasks identified.'
 :`${pending.length} tasks need attention. ${auto.length} can be auto-implemented.`;

 return { success: true, tasks, summary };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, tasks: [], summary:'', error: message };
 }
 }

 /** Implement a single backend task (supports db_seed and create_api) */
 implementTask(task: BackendTask, appId?: number): { success: boolean; taskId: string; message: string } {
 if (task.status ==='done') {
 return { success: true, taskId: task.id, message:`"${task.title}" is already done.` };
 }
 if (!task.implementation) {
 return { success: false, taskId: task.id, message:`"${task.title}" requires manual implementation: ${task.description}` };
 }

 try {
 if (task.implementation.type ==='db_seed') {
 return this.executeSeedTask(task, appId);
 }
 if (task.implementation.type ==='create_api') {
 // API creation is async -- mark as pending for async implementation
 return { success: true, taskId: task.id, message:`API task "${task.title}" queued for auto-implementation` };
 }
 return { success: false, taskId: task.id, message:`Implementation type "${task.implementation.type}" not supported yet.` };
 } catch (err) {
 const msg = err instanceof Error ? err.message : String(err);
 return { success: false, taskId: task.id, message:`Failed: ${msg}` };
 }
 }

 /** Execute all auto-implementable tasks */
 implementAllTasks(
 tasks: BackendTask[],
 appId?: number,
 ): { results: { success: boolean; taskId: string; message: string }[]; tasks: BackendTask[] } {
 const results: { success: boolean; taskId: string; message: string }[] = [];

 for (const task of tasks) {
 if (task.status ==='pending' && task.implementation) {
 const result = this.implementTask(task, appId);
 results.push(result);
 if (result.success) {
 task.status ='done';
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

 if (!table || table ==='undefined' || table ==='null') {
 return { success: false, taskId: task.id, message:'No valid table name provided for seeding.' };
 }

 if (!Array.isArray(records) || records.length === 0) {
 return { success: false, taskId: task.id, message:`No seed records provided for "${table}".` };
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
 message:`Seeded ${created.length} records into "${table}".`,
 };
 }

 // --- Finalize Agent: analyze + implement tasks one-by-one with AI ---------

 async finalizeAgentStream(
 files: GeneratedFile[],
 appId: number | undefined,
 model: string | undefined,
 sendEvent: (event: string, data: any) => void,
 ): Promise<void> {
 const aiModel = model || DEFAULT_ORCHESTRATOR;

 // Step 1: Analyze backend needs
 sendEvent('status', { phase: 'analyzing', message: 'Analyzing pages for backend requirements...' });
 const analysis = await this.analyzeBackendNeeds(files, appId, aiModel);

 if (!analysis.success || analysis.tasks.length === 0) {
 sendEvent('status', { phase: 'done', message: analysis.tasks.length === 0 ? 'No backend tasks needed -- your pages are self-contained!' : (analysis.error || 'Analysis failed') });
 return;
 }

 const tasks = analysis.tasks;
 sendEvent('tasks', { tasks, summary: analysis.summary });

 // Step 2: Work through each pending task
 let completedCount = 0;
 const totalPending = tasks.filter(t => t.status === 'pending').length;

 for (const task of tasks) {
 if (task.status === 'done') {
 completedCount++;
 continue;
 }

 sendEvent('task-start', {
 taskId: task.id,
 title: task.title,
 category: task.category,
 progress: `${completedCount + 1}/${totalPending}`,
 });

 try {
 // For db_seed tasks with existing implementation data, just execute directly
 if (task.implementation?.type === 'db_seed' && task.implementation.payload?.records) {
 const seedResult = this.executeSeedTask(task, appId);
 if (seedResult.success) {
 task.status = 'done';
 sendEvent('task-done', { taskId: task.id, success: true, message: seedResult.message });
 } else {
 sendEvent('task-done', { taskId: task.id, success: false, message: seedResult.message });
 }
 completedCount++;
 continue;
 }

 // For all other tasks, use AI to generate and execute the implementation
 const implResult = await this.aiImplementTask(task, files, appId, aiModel);
 if (implResult.success) {
 task.status = 'done';
 // If this task produced a file edit, send it to the frontend
 if (implResult.fileEdit) {
 const edit = implResult.fileEdit;
 // Also update our local files array so subsequent tasks see the change
 const fileIdx = files.findIndex(f => f.path.includes(edit.path) || edit.path.includes(f.path));
 if (fileIdx >= 0) {
 files[fileIdx] = { ...files[fileIdx], content: edit.content };
 }
 sendEvent('file-update', { path: edit.path, content: edit.content });
 }
 sendEvent('task-done', { taskId: task.id, success: true, message: implResult.message });
 } else {
 sendEvent('task-done', { taskId: task.id, success: false, message: implResult.message });
 }
 } catch (err) {
 const msg = err instanceof Error ? err.message : String(err);
 sendEvent('task-done', { taskId: task.id, success: false, message: `Error: ${msg}` });
 }
 completedCount++;
 }

 // Final summary
 const doneCount = tasks.filter(t => t.status === 'done').length;
 sendEvent('status', {
 phase: 'done',
 message: `Completed ${doneCount}/${tasks.length} tasks.`,
 tasks,
 });
 }

 /** Use AI to figure out and execute a backend task */
 private async aiImplementTask(
 task: BackendTask,
 files: GeneratedFile[],
 appId: number | undefined,
 model: string,
 ): Promise<{ success: boolean; message: string; fileEdit?: { path: string; content: string } }> {
 const db = this.db.readSync();

 // Build context about the current DB state
 const dbContext: string[] = [];
 for (const key of Object.keys(db)) {
 if (Array.isArray(db[key])) {
 const items = appId ? (db[key] as any[]).filter((r: any) => !r.app_id || r.app_id === appId) : db[key] as any[];
 if (items.length > 0) {
 const sample = JSON.stringify(items[0]).slice(0, 200);
 dbContext.push(`${key}: ${items.length} records (sample: ${sample})`);
 } else {
 dbContext.push(`${key}: 0 records`);
 }
 }
 }

 // Get relevant file context -- for frontend_wiring tasks, include the target file first
 let relevantFiles: typeof files;
 if (task.category === 'frontend_wiring' && task.targetFile) {
 const targetFile = files.find(f => f.path.includes(task.targetFile!));
 const others = files.filter(f => f !== targetFile && (
 f.content.toLowerCase().includes(task.title.toLowerCase().split(' ')[0]) ||
 task.description.toLowerCase().split(' ').some((w: string) => w.length > 4 && f.content.toLowerCase().includes(w))
 )).slice(0, 2);
 relevantFiles = targetFile ? [targetFile, ...others] : others;
 } else {
 relevantFiles = files.filter(f => {
 const content = f.content.toLowerCase();
 return content.includes(task.category) ||
 content.includes(task.title.toLowerCase().split(' ')[0]) ||
 task.description.toLowerCase().split(' ').some((w: string) => w.length > 4 && content.includes(w));
 }).slice(0, 3);
 }

 const maxLen = task.category === 'frontend_wiring' ? 12000 : 2000;
 const filesContext = relevantFiles.map(f => {
 const truncated = f.content.length > maxLen ? f.content.slice(0, maxLen) + '\n// ... truncated' : f.content;
 return `--- ${f.path} ---\n${truncated}\n--- END ---`;
 }).join('\n\n');

 const systemPrompt = `You are a backend infrastructure agent. You implement backend tasks for a SaaS application that uses:
- NestJS backend with a JSON file database (db.json)
- The database is a flat JSON object where each key is a "table" containing an array of records
- Each record has an id (number), optional app_id, created_at, updated_at fields

CURRENT DATABASE STATE:
${dbContext.join('\n')}

APP ID: ${appId || 'none'}

YOUR TASK: "${task.title}"
Category: ${task.category}
Description: ${task.description}

RELEVANT FRONTEND CODE:
${filesContext}

You must return a JSON object with the actions to take. Available action types:

1. SEED DATA: Create records in a table
{
  "action": "seed",
  "table": "table_name",
  "records": [{ "field1": "value1", ... }]
}

2. CREATE TABLE: Initialize a new table with seed data
{
  "action": "create_table",
  "table": "table_name",
  "records": [{ "field1": "value1", ... }]
}

3. UPDATE RECORDS: Modify existing records
{
  "action": "update",
  "table": "table_name",
  "filter": { "field": "value" },
  "updates": { "field": "newValue" }
}

4. EDIT FRONTEND FILE: Modify an existing React page (e.g. add a section to admin panel to show contact submissions)
{
  "action": "edit_file",
  "filePath": "pages/AdminDashboard.tsx",
  "newContent": "... the COMPLETE updated file content ..."
}
Use this when you need to wire up an admin panel, dashboard, or any existing page to display new data.
You MUST return the ENTIRE file content (not just a diff). Keep all existing functionality intact and add the new section/component.
The file should be valid TSX/React code using Material UI (MUI) components.

Rules:
- Return ONLY valid JSON, no markdown fences
- Provide realistic, domain-appropriate data
- Include 5-10 records for seed data
- Always include app_id: ${appId || 'null'} in records if the table is app-scoped
- Field names should be snake_case
- Include sensible timestamps, amounts, statuses
- For API endpoint tasks, create a record in an "api_routes" table documenting the endpoint
- Be thorough -- make the data look real and useful`;

 try {
 const result = await this.callAI(model, systemPrompt, `Implement this task now. Return the JSON action to execute.`);

 // Parse the AI response
 let action: any;
 try {
 const jsonMatch = result.content.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 action = JSON.parse(jsonMatch[0]);
 }
 } catch (err) {
 this.logger.debug('Failed to parse backend agent action: ' + err);
 return { success: false, message: `Could not parse AI response for "${task.title}"` };
 }

 if (!action || !action.action) {
 return { success: false, message: `AI did not return a valid action for "${task.title}"` };
 }

 // Execute the action
 if (action.action === 'seed' || action.action === 'create_table') {
 const table = action.table as string;
 const records = action.records as any[];

 if (!table || !Array.isArray(records) || records.length === 0) {
 return { success: false, message: `Invalid seed data for "${task.title}"` };
 }

 if (!db[table]) db[table] = [];

 const maxId = Math.max(0, ...(db[table] as any[]).map((r: any) => r.id || 0));
 let nextId = maxId + 1;
 let created = 0;

 for (const record of records) {
 (db[table] as any[]).push({
 id: nextId++,
 ...(appId ? { app_id: appId } : {}),
 ...record,
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 });
 created++;
 }

 db.last_updated = new Date().toISOString();
 this.db.writeSync(db);

 return { success: true, message: `Created ${created} records in "${table}"` };
 }

 if (action.action === 'update') {
 const table = action.table as string;
 const filter = action.filter || {};
 const updates = action.updates || {};

 if (!db[table] || !Array.isArray(db[table])) {
 return { success: false, message: `Table "${table}" not found` };
 }

 let updated = 0;
 for (const record of db[table] as any[]) {
 const matches = Object.entries(filter).every(([k, v]) => record[k] === v);
 if (matches) {
 Object.assign(record, updates, { updated_at: new Date().toISOString() });
 updated++;
 }
 }

 if (updated > 0) {
 db.last_updated = new Date().toISOString();
 this.db.writeSync(db);
 }

 return { success: true, message: `Updated ${updated} records in "${table}"` };
 }

 if (action.action === 'edit_file') {
 const filePath = action.filePath as string;
 const newContent = action.newContent as string;
 if (!filePath || !newContent) {
 return { success: false, message: `Invalid edit_file action for "${task.title}" -- missing filePath or newContent` };
 }
 // Return the file edit so the caller can send it to the frontend
 return { success: true, message: `Updated ${filePath}`, fileEdit: { path: filePath, content: newContent } };
 }

 return { success: false, message: `Unknown action type: ${action.action}` };
 } catch (err) {
 const msg = err instanceof Error ? err.message : String(err);
 return { success: false, message: `AI implementation failed: ${msg}` };
 }
 }

 // --- QA Agent: review generated files for errors --------------------------

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
 return { success: true, issues: [], passedFiles: [], failedFiles: [], summary:'No code files to review.' };
 }

 // Build cross-file context so the AI can check imports between files
 const allExports: string[] = [];
 for (const f of tsxFiles) {
 const exportMatches = f.content.match(/export\s+(?:function|const|class|interface|type|enum)\s+(\w+)/g);
 if (exportMatches) {
 allExports.push(`${f.path}: exports ${exportMatches.map(m => m.replace(/export\s+(?:function|const|class|interface|type|enum)\s+/,'')).join(',')}`);
 }
 }

 const filesContext = tsxFiles.map(f => {
 const content = f.content.length > 5000 ? f.content.slice(0, 5000) +'\n// ... truncated ...' : f.content;
 return`--- ${f.path} ---\n${content}\n--- END ---`;
 }).join('\n\n');

 const systemPrompt =`You are a senior code reviewer performing QA on AI-generated React/TypeScript files for a members area.

CROSS-FILE EXPORTS (use to verify imports between generated files):
${allExports.join('\n')}

Check for these categories of issues:

1. IMPORT errors: wrong import paths, importing non-existent modules, missing imports for used symbols, importing from'@mui/material' or'@mui/icons-material' with wrong names
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
- Focus on REAL bugs that would prevent compilation or cause runtime errors -- not nitpicks
- severity=error for anything that would crash or fail to compile
- severity=warning for things that would cause bad UX or subtle bugs
- severity=info for style/best-practice suggestions
- Be specific: include the actual symbol/import/variable name
- autoFix should be a clear, actionable instruction (e.g. "Change import from'./types' to'./shared/types'")
- Return an empty array [] if the code is clean

Return ONLY the JSON array. No markdown, no explanation.`;

 try {
 const result = await this.callAI(aiModel, systemPrompt,`Review these generated files:\n\n${filesContext}`);

 let issues: QaIssue[] = [];
 try {
 const jsonMatch = result.content.match(/\[[\s\S]*\]/);
 if (jsonMatch) {
 issues = JSON.parse(jsonMatch[0]).map((issue: any) => ({
 id: issue.id ||`qa-${Math.random().toString(36).slice(2, 8)}`,
 file: issue.file ||'',
 line: issue.line || undefined,
 severity: issue.severity ||'warning',
 category: issue.category ||'logic',
 title: issue.title ||'Issue',
 description: issue.description ||'',
 autoFix: issue.autoFix || undefined,
 }));
 }
 } catch (err) { this.logger.debug("Caught (parsing failed): " + err); }

 const errorFiles = new Set(issues.filter(i => i.severity ==='error').map(i => i.file));
 const allFilePaths = tsxFiles.map(f => f.path);
 const failedFiles = allFilePaths.filter(f => errorFiles.has(f));
 const passedFiles = allFilePaths.filter(f => !errorFiles.has(f));

 const errors = issues.filter(i => i.severity ==='error').length;
 const warnings = issues.filter(i => i.severity ==='warning').length;
 const infos = issues.filter(i => i.severity ==='info').length;

 let summary: string;
 if (issues.length === 0) {
 summary =`All ${tsxFiles.length} files passed QA -- no issues found.`;
 } else if (errors === 0) {
 summary =`QA complete: ${warnings} warning(s), ${infos} suggestion(s). No blocking errors.`;
 } else {
 summary =`QA found ${errors} error(s), ${warnings} warning(s), ${infos} info(s) across ${failedFiles.length} file(s).`;
 }

 return { success: true, issues, passedFiles, failedFiles, summary };
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 return { success: false, issues: [], passedFiles: [], failedFiles: [], summary:'', error: message };
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
 return { success: false, file: null, tokensUsed: 0, error:`File "${issue.file}" not found in generated files.` };
 }

 const instruction =`Fix this QA issue:\n\nCategory: ${issue.category}\nSeverity: ${issue.severity}\nTitle: ${issue.title}\nDescription: ${issue.description}\n${issue.line ?`Around line: ${issue.line}` :''}\n\nFix instruction: ${issue.autoFix || issue.description}`;

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

 const fixableIssues = issues.filter(i => i.autoFix && i.severity !=='info');

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
 } catch (err) {
 this.logger.debug("Caught: " + err);
 failed.push(issue.id);
 }
 }

 return { success: true, files: currentFiles, fixed, failed, tokensUsed: totalTokens };
 }

 // --- Documentation Agent -------------------------------------------------

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
 const docsDir = this.getMembersDir(appId);

 const appContext = this.getAppContext(appId);

 // Build context from generated files
 const fileList = files.map(f =>`- ${f.path}: ${f.description || f.path.split('/').pop()}`).join('\n');
 const componentNames = files
 .filter(f => f.path.match(/\.tsx$/))
 .map(f => {
 const match = f.content.match(/export\s+function\s+(\w+)/);
 return match ?`${f.path} -> ${match[1]}` : f.path;
 })
 .join('\n');

 const taskSummary = backendTasks && backendTasks.length > 0
 ?`\n\nBACKEND TASKS:\n${backendTasks.map(t =>`- [${t.status.toUpperCase()}] ${t.title} (${t.category}): ${t.description}`).join('\n')}`
 :'';

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
1. **Overview** -- what the members area does, key features
2. **Pages** -- list each page with a description of its purpose and features
3. **File Structure** -- tree view of all generated files
4. **Components** -- each component's purpose, props, and key features
5. **API Endpoints** -- what APIs the frontend expects (derived from fetch/axios calls in the code)
6. **Database Requirements** -- what data tables/records are needed
7. **Setup Instructions** -- how to integrate the members area into the main app
8. **Color Scheme & Theming** -- the primary color and design tokens used
9. **Dependencies** -- required npm packages

Write in a professional, developer-friendly tone. Use code blocks for examples.
Return ONLY the Markdown content. No wrapping code fences.`,
 );
 totalTokens += readmeResult.tokensUsed;

 docs.push({
 path:`${docsDir}/README.md`,
 content: readmeResult.content.replace(/^```(?:md|markdown)?\n?/m,'').replace(/\n?```$/m,'').trim(),
 language:'markdown',
 description:'Members area documentation',
 });
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }

 // Generate API reference from source code
 try {
 const apiCodeContext = files
 .filter(f => f.path.match(/\.tsx?$/))
 .map(f => {
 // Extract fetch/API calls
 const apiCalls = f.content.match(/fetch\([^)]+\)|axios\.\w+\([^)]+\)/g) || [];
 if (apiCalls.length === 0) return null;
 return`${f.path}:\n${apiCalls.join('\n')}`;
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
 path:`${docsDir}/API_REFERENCE.md`,
 content: apiResult.content.replace(/^```(?:md|markdown)?\n?/m,'').replace(/\n?```$/m,'').trim(),
 language:'markdown',
 description:'API endpoint reference',
 });
 }
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }

 return {
 success: true,
 docs,
 tokensUsed: totalTokens,
 };
 }

 // --- Coder Agent: Autonomous Builder --------------------------------------

 async coderChatStream(
 body: {
 message: string;
 files?: { path: string; content: string; language: string; description?: string }[];
 activeFile?: { path: string; description?: string };
 conversationHistory?: { role:'user' |'assistant'; content: string }[];
 appId?: number;
 model?: string;
 },
 sendEvent: (event: string, data: any) => void,
 ): Promise<void> {
 const modelId = body.model || DEFAULT_ORCHESTRATOR;

 // --- Tunable limits (extracted from scattered magic numbers) ---
 const MAX_HISTORY_MESSAGES = 16;
 const FILE_CONTEXT_LIMIT = 3000;       // chars per file in planner context
 const COMPONENT_READ_LIMIT = 8000;     // chars when pre-reading member components
 const SHARED_READ_LIMIT = 4000;        // chars for shared component snippets
 const COMPONENT_SIZE_CAP = 12000;      // skip pre-reading files larger than this
 const MODIFY_FILE_FULL_LIMIT = -1;     // no truncation for modify targets (uses line numbers)

 // Check AI key is available before doing any work
 const modelConfig = this.getModelConfig(modelId);
 if (modelConfig?.provider ==='anthropic' && !this.getApiKey('anthropic')) {
 sendEvent('error', { message:'Anthropic API key not configured. Add it in Settings -> API Keys.' });
 return;
 }
 if (modelConfig?.provider ==='openai' && !this.getApiKey('openai')) {
 sendEvent('error', { message:'OpenAI API key not configured. Add it in Settings -> API Keys.' });
 return;
 }

 // Trim conversation history to last 16 messages to avoid blowing context windows
 const rawHistory = (body.conversationHistory || []).map(m => ({
 role: m.role as'user' |'assistant',
 content: m.content,
 }));
 const history = rawHistory.length > MAX_HISTORY_MESSAGES ? rawHistory.slice(-MAX_HISTORY_MESSAGES) : rawHistory;
 const existingFiles = body.files || [];
 const appId = body.appId;

 // Gather available API keys for context
 const apiKeysStatus = this.checkApiKeys();
 const configuredKeys = apiKeysStatus
 .filter(k => k.configured)
 .map(k => k.key);

 // DB tables summary
 let dbSummary ='';
 try {
 const db = this.db.readSync();
 const tables = Object.keys(db).filter(k => Array.isArray(db[k]));
 dbSummary = tables.map(t => {
 const rows = appId ? (db[t] as any[]).filter((r: any) => !r.app_id || r.app_id === appId) : db[t] as any[];
 return`${t}: ${rows.length} records`;
 }).join(',');
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }

 // Smart truncation: keeps head (imports/types) + tail (component end) instead of just head
 const smartTruncate = (content: string, limit: number): string => {
   if (content.length <= limit) return content;
   const headSize = Math.floor(limit * 0.6);
   const tailSize = limit - headSize - 40;
   return content.slice(0, headSize) + '\n// ... truncated ...\n' + content.slice(-tailSize);
 };

 // Build file context
 const fileContext = existingFiles.map(f =>
`### ${f.path} (${f.language})${f.description ?' --' + f.description :''}\n\`\`\`${f.language}\n${smartTruncate(f.content, FILE_CONTEXT_LIMIT)}\n\`\`\``
 ).join('\n\n');

 const appContext = this.getAppContext(appId);

 let totalTokens = 0;
 const MAX_TOKEN_BUDGET = 500_000; // Hard ceiling to prevent runaway cost
 const start = Date.now();

 /** Check if we've exceeded the token budget and emit error if so */
 const checkBudget = (): boolean => {
   if (totalTokens > MAX_TOKEN_BUDGET) {
     sendEvent('error', { message: `Token budget exceeded (${totalTokens.toLocaleString()} / ${MAX_TOKEN_BUDGET.toLocaleString()}). Stopping to prevent excessive cost.` });
     return true; // over budget
   }
   return false;
 };

 // ----------------------------------------------------------------------
 // STEP 0.5: Pre-planning context scan (like Copilot -- read BEFORE you plan)
 // ----------------------------------------------------------------------

 // Read project structure so planner knows what exists
 const frontendComponents = this.listDirectory('frontend/src/components');
 const membersDir = this.getMembersDir(appId);
 const frontendMembers = this.listDirectory(membersDir);
 const backendModules = this.listDirectory('backend/src');
 const apiConfigContent = this.readFileFromDisk('frontend/src/config/api.ts');
 const appTsxContent = this.readFileFromDisk('frontend/src/App.tsx');

 // Pre-read the active file from disk so it's available for modify_file steps
 if (body.activeFile?.path) {
 const activeInMemory = existingFiles.find(f => f.path === body.activeFile!.path);
 if (!activeInMemory) {
 const diskContent = this.readFileFromDisk(body.activeFile.path);
 if (diskContent) {
 const ext = path.extname(body.activeFile.path).slice(1);
 existingFiles.push({
 path: body.activeFile.path,
 content: diskContent,
 language: ext ==='tsx' || ext ==='ts' ?'typescript' : ext,
 description: body.activeFile.description ||`Active file: ${body.activeFile.path}`,
 });
 }
 }
 }

 // Scan shared/types directories for available imports
 const frontendShared = this.listDirectory('frontend/src/components/shared');
 const frontendTypes = this.listDirectory('frontend/src/types');
 const frontendUtils = this.listDirectory('frontend/src/utils');
 const frontendConfig = this.listDirectory('frontend/src/config');

 // Pre-read ALL member components so the AI knows what existing components look like
 // This prevents the "doesn't know what a ContactForm is" problem
 const componentSnippets: string[] = [];
 for (const memberFile of frontendMembers.filter(f => f.endsWith('.tsx'))) {
 const memberPath =`${membersDir}/${memberFile}`;
 const alreadyLoaded = existingFiles.find(f => f.path === memberPath);
 if (!alreadyLoaded) {
 const content = this.readFileFromDisk(memberPath);
 if (content && content.length < COMPONENT_SIZE_CAP) {
 componentSnippets.push(`### ${memberPath}:\n\`\`\`tsx\n${content.slice(0, COMPONENT_READ_LIMIT)}\n\`\`\``);
 }
 }
 }
 // Also read shared components
 for (const sharedFile of frontendShared.filter(f => f.endsWith('.tsx'))) {
 const sharedPath =`frontend/src/components/shared/${sharedFile}`;
 const alreadyLoaded = existingFiles.find(f => f.path === sharedPath);
 if (!alreadyLoaded) {
 const content = this.readFileFromDisk(sharedPath);
 if (content && content.length < COMPONENT_READ_LIMIT) {
 componentSnippets.push(`### ${sharedPath}:\n\`\`\`tsx\n${content.slice(0, SHARED_READ_LIMIT)}\n\`\`\``);
 }
 }
 }
 const componentLibrary = componentSnippets.length > 0
 ?`## EXISTING COMPONENTS (read from disk -- use these as reference when modifying files):\n${componentSnippets.join('\n\n')}`
 :'';

 // Build a project map for the planner
 const projectMap =`## PROJECT STRUCTURE (auto-scanned from disk):
### Frontend Components:
${frontendComponents.filter(f => f.endsWith('.tsx')).map(f =>`- frontend/src/components/${f}`).join('\n')}
### Members Area Pages:
${frontendMembers.filter(f => f.endsWith('.tsx')).map(f =>`- ${membersDir}/${f}`).join('\n')}
### Shared Components:
${frontendShared.filter(f => f.endsWith('.tsx')).map(f =>`- frontend/src/components/shared/${f}`).join('\n') ||'(none yet)'}
### Types (frontend/src/types/):
${frontendTypes.filter(f => f.endsWith('.ts')).map(f =>`- frontend/src/types/${f}`).join('\n') ||'(none -- define types inline in components)'}
### Utilities (frontend/src/utils/):
${frontendUtils.filter(f => f.endsWith('.ts')).map(f =>`- frontend/src/utils/${f}`).join('\n') ||'(none)'}
### Config files (frontend/src/config/):
${frontendConfig.filter(f => f.endsWith('.ts')).map(f =>`- frontend/src/config/${f}`).join('\n') ||'(none)'}
### Backend Modules:
${backendModules.filter(f => !f.includes('node_modules')).filter(f => f.endsWith('.ts') || !f.includes('.')).slice(0, 50).map(f =>`- backend/src/${f}`).join('\n')}
### API Config (frontend/src/config/api.ts):
\`\`\`typescript
${apiConfigContent?.slice(0, 2000) ||'(not found)'}
\`\`\`
### App Router (frontend/src/App.tsx) -- first 100 lines:
\`\`\`tsx
${appTsxContent?.slice(0, 3000) ||'(not found)'}
\`\`\``;

 // ----------------------------------------------------------------------
 // STEP 1: Ask the AI to classify the request and create an execution plan
 // ----------------------------------------------------------------------

 const plannerPrompt =`You are an elite autonomous coding agent that can FULLY complete ANY programming task. You have access to the filesystem, npm, shell commands, and can write, compile, and verify code end-to-end.

## Available Actions:
1. **chat** -- Just answer a question / give advice (no file changes)
2. **search_web** -- Search the web for documentation, API references, solutions
3. **search_codebase** -- Search the local codebase for a pattern (like grep). Specify "searchQuery". Use this to find existing code, imports, usages, etc. BEFORE modifying files.
4. **generate_component** -- Create a brand new React/TypeScript file. You MUST specify a "newFilePath".
5. **modify_file** -- Modify an existing file (you MUST specify a "targetFile")
6. **modify_files** -- Modify MULTIPLE existing files in a single coordinated step. Specify "targetFiles" (array of file paths) when changes across files must be synchronized (e.g. adding a route + component + type).
7. **install_packages** -- Install npm packages. Specify "packages" (array of package names) and "target" ("frontend" or "backend")
8. **run_command** -- Run any shell command (build, test, lint, curl, etc). Specify "command" and optionally "cwd" ("frontend" or "backend")
9. **delegate_backend** -- Hand off backend work (DB seeding, API analysis) to the Backend Agent. It analyzes generated files and auto-implements what it can.
10. **create_api** -- Generate a NestJS controller + service + module for a backend feature. Files are written to disk and auto-registered in app.module.ts.
11. **read_file** -- Read an existing file from disk to understand its contents. Specify "targetFile".
12. **list_directory** -- List files in a directory. Specify "targetDir".
13. **clarify** -- Ask the user a clarifying question BEFORE building. Only use when the request is genuinely ambiguous and you cannot infer the best approach. Specify "question" with the clarification question.

## You ALWAYS:
- Install any npm packages your code needs (xlsx, apify-client, chart.js, etc.)
- Write files directly to disk, not just hold them in memory
- Auto-register new NestJS modules in app.module.ts
- Verify the build compiles after writing files
- Auto-fix any TypeScript compilation errors
- Create COMPLETE, fully-functional implementations -- not stubs or placeholders

## APIFY INTEGRATION GUIDE (for web scraping tasks):
When building scrapers or data-fetching features that use Apify:

### Architecture Pattern (REQUIRED):
1. **Backend API endpoint** -- Create a NestJS controller+service that calls the Apify API server-side (the API token is stored server-side, NEVER expose it to frontend)
2. **Frontend UI** -- Create a React component that calls YOUR backend endpoint, NOT Apify directly

### How to call Apify from a NestJS service:
\`\`\`typescript
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

// Get the Apify token:
private getApiKey(provider: string): string | null {
  const data = this.db.readSync();
  const apiKeys = data.apiKeys || [];
  const keyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === provider.toLowerCase());
  if (!keyEntry) return null;
  return this.cryptoService.decrypt(keyEntry.value);
}

// Call an Apify actor:
async runApifyActor(actorId: string, input: Record<string, any>): Promise<any[]> {
  const token = this.getApiKey('apify');
  if (!token) throw new Error('Apify API key not configured. Add it in Settings -> Integration Keys.');

  // Start the actor run and wait for it to finish (up to 120s)
  const runResponse = await axios.post(
    \\\`https://api.apify.com/v2/acts/\\\${actorId}/runs\\\`,
    input,
    {
      headers: { 'Authorization': \\\`Bearer \\\${token}\\\` },
      params: { waitForFinish: 120 },
      timeout: 130000,
    },
  );

  const datasetId = runResponse.data?.data?.defaultDatasetId;
  if (!datasetId) throw new Error('Apify run completed but no dataset was returned');

  // Fetch the results from the dataset
  const results = await axios.get(
    \\\`https://api.apify.com/v2/datasets/\\\${datasetId}/items\\\`,
    {
      headers: { 'Authorization': \\\`Bearer \\\${token}\\\` },
      params: { format: 'json' },
      timeout: 15000,
    },
  );

  return results.data || [];
}
\`\`\`

### Common Apify Actor IDs:
- LinkedIn Profile Scraper: \`curious_coder/linkedin-profile-scraper\` -- Input: { "urls": ["https://www.linkedin.com/in/username/"] }
- LinkedIn Company Scraper: \`curious_coder/linkedin-company-scraper\` -- Input: { "urls": ["https://www.linkedin.com/company/name/"] }  
- LinkedIn Search Scraper: \`apify/linkedin-search-scraper\` -- Input: { "searchTerms": ["keyword"], "maxResults": 10 }
- Reddit Scraper: \`trudax~reddit-scraper-lite\` -- Input: { "startUrls": [{"url": "..."}], "maxItems": 25 }
- Instagram Scraper: \`apify/instagram-scraper\` -- Input: { "usernames": ["username"] }
- Twitter/X Scraper: \`apidojo/tweet-scraper\` -- Input: { "startUrls": [{"url": "..."}], "maxItems": 20 }
- Google Maps Scraper: \`compass/crawler-google-places\` -- Input: { "searchStringsArray": ["query"], "maxCrawledPlacesPerSearch": 10 }
- Google Search Scraper: \`apify/google-search-scraper\` -- Input: { "queries": "search term", "maxPagesPerQuery": 1 }
- Website Content Crawler: \`apify/website-content-crawler\` -- Input: { "startUrls": [{"url": "..."}], "maxCrawlPages": 10 }

### Frontend Pattern:
The frontend should:
1. Have an input form (e.g., LinkedIn URL input, search query, etc.)
2. Call YOUR backend API endpoint (e.g., \`fetch(API.linkedinScrape, { method: 'POST', body: JSON.stringify({ url }) })\`)
3. Show loading state while Apify runs (can take 30-120 seconds)
4. Display the scraped data in a nice table/card layout
5. NEVER call Apify directly from the browser -- always go through the backend

### Working Example (social-monitor):
The project already has a working Apify integration in \`backend/src/social-monitor/social-monitor.service.ts\`. Use search_codebase to read it if you need a reference for how to:
- Get the Apify token from stored API keys
- POST to the Apify actor runs endpoint
- Wait for completion and fetch dataset results
- Handle errors and timeouts

### IMPORTANT -- Apify scrapers do NOT need extra npm packages:
The backend already has \`axios\` installed. Apify is called via REST API (axios.post), NOT via an npm SDK. Do NOT install apify-client, stripe, puppeteer, or any other packages for Apify scraping tasks. The only packages that should be installed are ones the frontend/backend code ACTUALLY imports and doesn't already have.

## PROJECT KNOWLEDGE (auto-scanned by documentation agent):
${this.docAgent.getPromptContext()}

## Context:
- Available API keys: ${configuredKeys.join(',') ||'none'}
- Database: ${dbSummary ||'empty'}
- Existing files: ${existingFiles.map(f => f.path).join(',') ||'none'}
${appContext}
- Frontend: React + Vite + MUI (in frontend/ directory)
- Backend: NestJS (in backend/ directory) -- uses db.json for data storage
- Project root: contains both frontend/ and backend/ directories

${projectMap}

## API Keys:
API keys (OpenAI, Stripe, etc.) are ALREADY stored encrypted in db.json and can be read server-side. You do NOT need to "add" or "configure" API keys -- they are already saved.
When creating backend APIs that call external services, use create_api which auto-injects the API key access pattern.
NEVER create a step to "add API key" or "configure API key" -- they are already stored.

## Frontend API Config:
The frontend uses \`frontend/src/config/api.ts\` which exports an \`API\` object (NOT a string):
\`\`\`typescript
import { API } from'../../config/api';
// Usage: fetch(API.apps), fetch(API.pages), fetch(API.generateImage), etc.
// API is an OBJECT with named endpoints, NOT a string base URL.
// To add a new endpoint, use modify_file on frontend/src/config/api.ts to add a new property.
\`\`\`
When generating frontend code that calls APIs, ALWAYS use the named API config pattern: \`API.endpointName\`.
When creating a new backend API, ALSO add its URL to the API config object via a modify_file step.

## Current project files:
${fileContext ||'(no files loaded)'}

## User's currently-viewed file:
${body.activeFile ?`**${body.activeFile.path}**${body.activeFile.description ?` -- ${body.activeFile.description}` :''}
This is the file the user currently has open. ONLY use this as targetFile if the user explicitly says "this page", "this file", "the current page", or "modify this".
Do NOT default to modifying this file. If the user asks to CREATE something new, use generate_component with a newFilePath -- do NOT modify this file.` :'(No file currently selected)'}

## User's request:
${body.message}

## Your task:
Return a JSON execution plan. The plan must be a JSON object with:
{
 "intent": "chat" | "build",
 "confidence": 0-100 (how confident you are that you understand EXACTLY what the user wants),
 "summary": "One-line summary of what you'll do",
 "clarifyQuestion": "If confidence < 90, ask a specific question to resolve the ambiguity",
 "steps": [
 {
 "id": 1,
 "action": "search_web | search_codebase | generate_component | modify_file | modify_files | install_packages | run_command | delegate_backend | create_api | read_file | list_directory | delete_file | chat",
 "title": "Short step title",
 "detail": "What this step does",
 "searchQuery": "query (for search_web, search_codebase)",
 "targetFile": "path/to/file (for modify_file, read_file)",
 "targetFiles": ["path1", "path2"] (for modify_files -- coordinated multi-file edit),
 "targetDir": "path/to/dir (for list_directory)",
 "newFilePath": "path/for/new/file (for generate_component, create_api)",
 "packages": ["pkg1", "pkg2"] (for install_packages),
 "target": "frontend | backend" (for install_packages, run_command),
 "command": "shell command" (for run_command),
 "confirmMessage": "message to show user before destructive action (for delete_file)"
 }
 ]
}

If the request is just a question (intent: "chat"), return a single step with action: "chat".

## CONFIDENCE SCORING (CRITICAL):
You MUST include a "confidence" score (0-100) in every plan. This represents how sure you are about WHAT the user wants.
- **90-100**: You know exactly what to build. Proceed with the plan.
- **70-89**: You're mostly sure but some details are unclear. Include a "clarifyQuestion" asking the ONE most important thing you need to know.
- **0-69**: The request is vague or could mean multiple things. Include a "clarifyQuestion" with a specific question.

Examples:
- "Create a new page called goldie" -> confidence: 95 (clear request)
- "Build a scraper" -> confidence: 60 (scrape what? from where? what data?)
- "Add a chart to the dashboard" -> confidence: 75 (what data? what chart type?)
- "Fix the bug on this page" -> confidence: 40 (which bug?)
- "Delete the analytics page" -> confidence: 95 (clear request)

ALWAYS include your full plan in "steps" even if confidence is low. The system will decide whether to ask the question or proceed.

Order steps logically: search_codebase -> search_web -> read_file/list_directory -> install_packages -> generate_component -> create_api -> modify_file -> delegate_backend.

## ACTION SELECTION RULES (CRITICAL):
- User says "create", "make", "build", "add a new" + page/component -> use **generate_component** with newFilePath. Do NOT use modify_file on an existing file.
- User says "modify", "change", "update", "fix", "edit" + an existing page -> use **modify_file** with targetFile pointing to the existing file.
- User says "delete", "remove" + a file -> use **delete_file** with targetFile. The system will confirm with the user before deleting.
- User says "scraper", "Apify", "API integration" -> use **create_api** for backend + **generate_component** or **modify_file** for frontend. The create_api tool will auto-search the web for documentation if needed.
- If an external service requires an API key that is NOT in the available keys list, add a step with action "chat" that tells the user they need to add the missing key in Settings.

IMPORTANT RULES:
- ALWAYS use search_codebase BEFORE modify_file to find the exact code you need to change. This prevents hallucinating file contents.
- Do NOT add steps for build verification, compile checking, linting, or "npm run build" -- these happen AUTOMATICALLY after all steps complete.
- Do NOT add steps for testing or verification -- a Test Agent automatically runs after build passes. It performs static analysis, API smoke tests, and AI functional review to verify the code actually works end-to-end.
- Do NOT add steps to run "npm run build", "tsc", "npx tsc", "npm run lint", or any build/lint/verify commands -- the system handles this.
- Do NOT add steps to "add API key", "configure API key", or "store API key" -- keys are already stored encrypted and accessed server-side automatically.
- Only use run_command for custom commands like curl, data migration scripts, or API testing.
- When reading files, use the FULL relative path from project root (e.g. "frontend/src/components/MyPage.tsx" or "backend/src/app.module.ts").
- If you're not sure of a file path, use list_directory first to find it, or use search_codebase to grep for patterns.
- Use **create_api** (NOT delegate_backend) when you need to create a new backend API endpoint. create_api generates the actual NestJS code.
- Use **delegate_backend** only for DB seeding and backend analysis of existing files.
- When creating a new backend API, ALWAYS also add a step to modify_file "frontend/src/config/api.ts" to add the new endpoint URL to the API config object.
- When frontend code calls backend APIs, use the API config object: \`API.endpointName\` (e.g. \`API.generateImage\`), NOT string concatenation like \`\${API}/path\`.

CRITICAL: Be PROPORTIONAL to the request.
- For simple UI changes (add a form, edit text, change styling, add a section), use 1-3 steps max (generate_component and/or modify_file). Do NOT create backend APIs or tables unless the user explicitly asks for backend functionality.
- For medium requests (add a new page with API calls), use 3-5 steps.
- For large features (build a complete scraper with backend + frontend + data), use 5-8 steps.

NEVER create unrelated backend tasks. If the user asks "add a contact form", do NOT also create tables for scripts, analytics, FAQs, user profiles, or community posts. Only create what the user actually asked for.
NEVER add a delegate_backend step unless the user specifically asks for database seeding or backend analysis.

For example, if asked to "add a contact form to a page", you should plan: generate_component (ContactForm.tsx) -> modify_file (import and add ContactForm to the target page). That's it -- 2 steps.
If asked to "create a new page called goldie", you should plan: generate_component with newFilePath "frontend/src/components/members/<app>/goldie.tsx". That's 1 step. Do NOT modify any existing file.
If asked to "delete the goldie page", you should plan: delete_file with targetFile "frontend/src/components/members/<app>/goldie.tsx". The system confirms before deleting.

Return ONLY the JSON object. No markdown fences, no explanation.`;

 try {
 const planResult = await this.callAI(modelId,'You are an autonomous builder agent that creates execution plans. Return only valid JSON.', plannerPrompt, history);
 totalTokens += planResult.tokensUsed || 0;

 let plan: any;
 try {
 const jsonMatch = planResult.content.match(/\{[\s\S]*\}/);
 plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
 } catch (err) {
 this.logger.debug('Plan JSON parsing failed, falling back to chat: ' + err);
 // If plan parsing fails, fall back to chat mode
 plan = { intent:'chat', summary:'Responding to your question', steps: [{ id: 1, action:'chat', title:'Answer', detail: body.message }] };
 }

 if (!plan || !plan.steps || plan.steps.length === 0) {
 plan = { intent:'chat', summary:'Responding to your question', steps: [{ id: 1, action:'chat', title:'Answer', detail: body.message }] };
 }

 // --- Validate plan schema ---
 const validActions = new Set([
   'search_web', 'generate_component', 'modify_file', 'install_packages',
   'run_command', 'read_file', 'delegate_backend', 'create_database',
   'search_codebase', 'modify_files', 'delete_file', 'chat', 'create_api',
 ]);
 if (!plan.intent || typeof plan.intent !== 'string') {
   plan.intent = 'chat';
 }
 if (!plan.summary || typeof plan.summary !== 'string') {
   plan.summary = body.message.slice(0, 120);
 }
 // Normalise & filter steps
 plan.steps = (plan.steps as any[]).filter((s: any, i: number) => {
   if (!s || typeof s !== 'object') return false;
   if (!s.action || !validActions.has(s.action)) return false;
   if (!s.id) s.id = i + 1;
   if (!s.title || typeof s.title !== 'string') s.title = `Step ${s.id}`;
   return true;
 });
 if (plan.steps.length === 0) {
   plan = { intent:'chat', summary:'Responding to your question', steps: [{ id: 1, action:'chat', title:'Answer', detail: body.message }] };
 }

 // --- Auto-correct plan: prevent common AI planner mistakes ---
 const msgLower = body.message.toLowerCase();
 const isCreateRequest = /\b(create|make|build|add\s+a\s+new|generate|new\s+page|new\s+component)\b/.test(msgLower);
 const isDeleteRequest = /\b(delete|remove|destroy)\b/.test(msgLower);

 if (isCreateRequest && !isDeleteRequest) {
   // If user asked to CREATE but planner only used modify_file on the active file, convert to generate_component
   for (const step of plan.steps) {
     if (step.action === 'modify_file' && step.targetFile === body.activeFile?.path && !step.newFilePath) {
       this.logger.debug(`Auto-correcting step "${step.title}" from modify_file to generate_component (user asked to create, not modify)`);
       step.action = 'generate_component';
       // Infer a newFilePath from the step detail or title
       const nameMatch = body.message.match(/(?:called|named)\s+[\"']?(\w[\w-]*)/i);
       const slug = nameMatch ? nameMatch[1].toLowerCase() : step.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
       step.newFilePath = step.targetFile?.replace(/[^/]+\.tsx$/, `${slug}.tsx`) || `frontend/src/components/${slug}.tsx`;
       delete step.targetFile;
     }
   }
   // Ensure intent is build for create requests
   if (plan.intent === 'chat') plan.intent = 'build';
 }

 // Never allow clarify intent -- confidence system handles this
 if (plan.intent === 'clarify') {
   plan.intent = 'build';
 }

 // --- Confidence-based clarification ---
 const confidence = typeof plan.confidence === 'number' ? plan.confidence : 100;
 const CONFIDENCE_THRESHOLD = 90;

 if (confidence < CONFIDENCE_THRESHOLD && plan.clarifyQuestion) {
   sendEvent('plan', {
     summary: plan.summary,
     intent: 'clarify',
     confidence,
     activeFile: body.activeFile?.path || null,
     targetFiles: [],
     steps: plan.steps.map((s: any) => ({ id: s.id, title: s.title, action: s.action })),
   });
   sendEvent('clarify', { question: plan.clarifyQuestion, confidence, summary: plan.summary });
   sendEvent('result', {
     success: true,
     response: `**I'm ${confidence}% confident I understand your request.**\n\n${plan.clarifyQuestion}\n\n_Reply with more details and I'll build it._`,
     intent: 'clarify',
     confidence,
     tokensUsed: totalTokens,
   });
   return;
 }

 // Emit the plan to the client so they see what's coming
 const targetFiles = plan.steps
 .filter((s: any) => s.targetFile || s.newFilePath)
 .map((s: any) => s.targetFile || s.newFilePath);
 sendEvent('plan', {
 summary: plan.summary,
 intent: plan.intent,
 activeFile: body.activeFile?.path || null,
 targetFiles,
 steps: plan.steps.map((s: any) => ({ id: s.id, title: s.title, action: s.action })),
 });

 // ------------------------------------------------------------------
 // STEP 1.6: Create a git snapshot before making changes (for undo)
 // ------------------------------------------------------------------
 let snapshotHash: string | null = null;
 if (plan.intent === 'build') {
 sendEvent('progress', { message: '\ud83d\udcbe Creating snapshot for undo...' });
 const snapshot = this.createGitSnapshot(plan.summary);
 if (snapshot.success && snapshot.commitHash) {
 snapshotHash = snapshot.commitHash;
 sendEvent('snapshot', { commitHash: snapshot.commitHash, label: plan.summary });
 }
 }

 // ------------------------------------------------------------------
 // STEP 2: Execute each step in the plan
 // ------------------------------------------------------------------

 const executedPlan: { id: number; title: string; status: string; detail?: string }[] = [];
 const generatedFiles: GeneratedFile[] = [];
 const modifiedFiles: GeneratedFile[] = [];
 const dbChanges: { table: string; action: string; count: number }[] = [];
 let searchResults: { title: string; url: string; description: string }[] = [];
 let chatResponse ='';
 let webContext ='';
 const backendDelegationTasks: BackendTask[] = [];

 for (const step of plan.steps) {
 // Budget guard: stop executing if we've burned too many tokens
 if (checkBudget()) {
   sendEvent('result', {
     success: false,
     response: `⚠️ Stopped after ${executedPlan.length} steps — token budget exceeded (${totalTokens.toLocaleString()} tokens). Partial results may have been applied.`,
     generatedFiles, modifiedFiles, executedPlan, tokensUsed: totalTokens,
   });
   return;
 }

 const stepResult: any = { id: step.id, title: step.title, status:'running', detail: step.detail };
 executedPlan.push(stepResult);

 // Notify client this step is starting
 sendEvent('step_start', { id: step.id, title: step.title, action: step.action });

 try {
 switch (step.action) {

 // -- Web Search ---------------------------------------------
 case'search_web': {
 const query = step.searchQuery || step.detail || body.message;
 const results = await this.searchBrave(query, 5);
 searchResults = [...searchResults, ...results];
 webContext = results.map((r, i) =>`${i + 1}. ${r.title}: ${r.description} (${r.url})`).join('\n');
 stepResult.status ='done';
 stepResult.detail =`Found ${results.length} results for "${query}"`;
 break;
 }

 // -- Generate New Component ---------------------------------
 case'generate_component': {
 // Read api.ts config so generated components use correct API patterns
 const genApiConfig = this.getApiConfigContext();

 // Read an existing component as an example template (like Copilot reads existing patterns)
 let exampleComponent ='';
 const targetDir = step.newFilePath?.includes('members/') ? membersDir :'frontend/src/components';
 const existingComponents = this.listDirectory(targetDir).filter(f => f.endsWith('.tsx') && !f.includes('ProgrammerAgent'));
 if (existingComponents.length > 0) {
 // Pick a component to use as example pattern
 const examplePath =`${targetDir}/${existingComponents[0]}`;
 const exampleContent = this.readFileFromDisk(examplePath);
 if (exampleContent && exampleContent.length < 5000) {
 exampleComponent =`\n## EXAMPLE -- Follow this component's patterns (imports, structure, API usage, styling):\n### ${examplePath}:\n\`\`\`tsx\n${exampleContent}\`\`\`\nStudy the example above. Match its import patterns, API call patterns, export style, and MUI usage.\n`;
 }
 }

 const componentPrompt =`Generate a complete, production-quality React component.

${this.getDesignSystemContext()}
${appContext}

## Task: ${step.detail}
## File path: ${step.newFilePath ||'frontend/src/components/NewComponent.tsx'}
${genApiConfig}
${exampleComponent}
${componentLibrary}

## USER'S ORIGINAL REQUEST (follow this exactly):
"${body.message}"

${existingFiles.length > 0 ?`## Existing files for context:\n${existingFiles.map(f =>`- ${f.path}`).join('\n')}` :''}
${webContext ?`## Web research results:\n${webContext}` :''}

## COMMON UI PATTERNS (use as templates for what the user asks for):

### Contact Form:
A contact form should have Name, Email, Subject, and Message fields with a Submit button.

### Buy/Purchase Button:
A prominent call-to-action button, typically styled with a gradient or solid primary color.

### Pricing Section:
Cards with plan name, price, features list, and a CTA button.

## IMPORT RULES (CRITICAL -- follow exactly):
- API config: \`import { API } from'../../config/api';\` (or adjust depth for file path). API is an OBJECT: use \`API.apps\`, \`API.chat\`, etc. NEVER \`\${API}/path\`.
- MUI components: \`import { Box, Typography, ... } from'@mui/material';\`
- React hooks: \`import { useState, useEffect, ... } from'react';\`
- Do NOT import from paths that don't exist. If you need a type, define it INLINE in the component file.
- Do NOT import from \`../../types/\` or \`../../../types/\` -- these directories may not exist. Define interfaces inline.
- The import depth depends on the file's location. For files in \`frontend/src/components/\`, use \`../config/api\`. For \`frontend/src/components/members/\`, use \`../../config/api\`. For \`frontend/src/components/shared/\`, use \`../../config/api\`.

CRITICAL RULES:
- Export as a named export
- Include all imports
- Use MUI components and sx prop styling
- Include loading states, error handling, empty states
- Make it fully functional with useState, event handlers, etc.
- Include proper TypeScript types
- Make it look polished and professional
- Follow the import patterns and API call patterns from the example component
- Use \`import { API } from'../../config/api';\` then \`fetch(API.endpointName)\` for ALL API calls
- NEVER hardcode API URLs or use mock endpoints

Return ONLY the code. No markdown fences, no explanation.`;

 const genResult = await this.callAI(modelId,`Expert React developer. ${this.getDesignSystemContext()}`, componentPrompt);
 totalTokens += genResult.tokensUsed || 0;

 const filePath = step.newFilePath ||`frontend/src/components/${this.toPascalCase(step.title.replace(/\s+/g,'-'))}.tsx`;
 const cleanContent = genResult.content
 .replace(/^```(?:tsx?|typescript|javascript)?\n?/m,'')
 .replace(/\n?```$/m,'')
 .trim();

 // Check if the AI returned multiple files with ===FILE: markers
 const hasFileMarkers = /===FILE:\s*.+?===/.test(genResult.content);
 const parsedFiles = this.parseFiles(genResult.content);
 if (parsedFiles.length > 0) {
 if (!hasFileMarkers && parsedFiles.length === 1) {
 // parseFiles used its fallback generic path -- override with the planned path
 parsedFiles[0].path = filePath;
 parsedFiles[0].description = step.detail || step.title;
 }
 generatedFiles.push(...parsedFiles);
 } else {
 generatedFiles.push({
 path: filePath,
 content: cleanContent,
 language:'typescript',
 description: step.detail || step.title,
 });
 }

 // Sync generated files into existingFiles so subsequent modify_file steps can find them
 const newFiles = parsedFiles.length > 0 ? parsedFiles : [{ path: filePath, content: cleanContent, language: 'typescript' as string, description: step.detail || step.title }];
 for (const nf of newFiles) {
   const efIdx = existingFiles.findIndex(f => f.path === nf.path);
   if (efIdx >= 0) existingFiles[efIdx] = { ...existingFiles[efIdx], content: nf.content };
   else existingFiles.push({ path: nf.path, content: nf.content, language: nf.language || 'typescript', description: nf.description || '' });
 }

 stepResult.status ='done';
 stepResult.detail =`Generated ${parsedFiles.length || 1} file(s)`;
 break;
 }

 // -- Modify Existing File -----------------------------------
 case'modify_file': {
 const targetPath = step.targetFile;
 let targetFile = existingFiles.find(f => f.path === targetPath);

 // Fallback: read from disk if not in existingFiles
 if (!targetFile && targetPath) {
 const diskContent = this.readFileFromDisk(targetPath);
 if (diskContent) {
 const ext = path.extname(targetPath).slice(1);
 targetFile = {
 path: targetPath,
 content: diskContent,
 language: ext ==='tsx' || ext ==='ts' ?'typescript' : ext,
 description:`Read from disk: ${targetPath}`,
 };
 } else {
 // Try common path variations
 const variations = [
 targetPath,
`frontend/${targetPath}`,
`backend/${targetPath}`,
 targetPath.replace(/^src\//,'frontend/src/'),
 targetPath.replace(/^src\//,'backend/src/'),
 ];
 for (const vPath of variations) {
 const content = this.readFileFromDisk(vPath);
 if (content) {
 const ext = path.extname(vPath).slice(1);
 targetFile = {
 path: vPath,
 content,
 language: ext ==='tsx' || ext ==='ts' ?'typescript' : ext,
 description:`Read from disk: ${vPath}`,
 };
 break;
 }
 }
 }
 }

 // Also check generatedFiles and modifiedFiles (exact path first, then filename match)
 if (!targetFile) {
 targetFile = generatedFiles.find(f => f.path === targetPath) || modifiedFiles.find(f => f.path === targetPath);
 }
 if (!targetFile) {
 const basename = targetPath.split('/').pop();
 if (basename) {
 targetFile = generatedFiles.find(f => f.path.split('/').pop() === basename)
 || modifiedFiles.find(f => f.path.split('/').pop() === basename);
 }
 }

 if (!targetFile) {
 stepResult.status ='failed';
 stepResult.detail =`File not found on disk or in loaded files: ${targetPath}`;
 break;
 }

 // Read api.ts config so the AI knows the correct API patterns
 const apiConfigContext = this.getApiConfigContext();

 // Read any components referenced in the step detail so the AI knows what they look like
 let referencedComponentContext ='';
 const componentRefs = (step.detail ||'').match(/\b([A-Z][a-zA-Z]+(?:Form|Button|Card|List|Table|Modal|Dialog|Panel|Section|Header|Footer|Nav|Sidebar|Layout|Page|Widget|Banner|Alert))\b/g) || [];
 for (const compName of [...new Set(componentRefs)]) {
 // Search in members/ (per-app) and shared/ directories
 for (const dir of [membersDir,'frontend/src/components/shared']) {
 const compPath =`${dir}/${compName}.tsx`;
 const content = this.readFileFromDisk(compPath);
 if (content) {
 referencedComponentContext +=`\n## Referenced component ${compName} (${compPath}):\n\`\`\`tsx\n${content.slice(0, 3000)}\n\`\`\`\n`;
 break;
 }
 }
 }

 // -- LINE-BASED EDIT approach --------------------------
 // Instead of fragile string matching, use line numbers for edits.
 // GPT sees numbered lines and specifies edits by line range -- much more reliable.
 const fileLines = targetFile.content.split('\n');
 const numberedContent = fileLines.map((line, i) =>`${i + 1}: ${line}`).join('\n');
 const totalLines = fileLines.length;

 const modifyPrompt =`You are modifying an existing file. Return LINE-BASED EDITS.

## Current file (${targetFile.path}) -- ${totalLines} lines:
\`\`\`${targetFile.language}
${numberedContent}
\`\`\`

## Instruction: ${step.detail}

## USER'S ORIGINAL REQUEST (follow placement cues like "at the bottom", "at the top", "below X"):
"${body.message}"
${apiConfigContext}
${referencedComponentContext}
${componentLibrary}
${webContext ?`## Web research for reference:\n${webContext}` :''}

Return a JSON object with line-based edits. Each edit specifies a line range to replace or a line to insert after.

Format:
\`\`\`json
{
 "edits": [
 {
 "type": "replace",
 "startLine": 10,
 "endLine": 12,
 "newCode": "the new code that replaces lines 10-12"
 },
 {
 "type": "insert_after",
 "afterLine": 45,
 "newCode": "new code to insert after line 45"
 },
 {
 "type": "delete",
 "startLine": 20,
 "endLine": 22
 }
 ],
 "newImports": "any new import lines to add at the top (or empty string)"
}
\`\`\`

RULES:
1. **Line numbers** refer to the numbers shown above (1-indexed). Use them precisely.
2. **"replace"** replaces lines startLine through endLine (inclusive) with newCode.
3. **"insert_after"** inserts newCode AFTER the specified line. Use afterLine: 0 to insert at the very top.
4. **"delete"** removes lines startLine through endLine (inclusive).
5. **newCode** should NOT include line numbers -- just the raw code.
6. **newImports** -- any import lines to add. They'll be inserted after the last existing import.

PLACEMENT GUIDANCE:
- The file has ${totalLines} lines total.
- "add at the bottom of the page" -> insert_after the SECOND-TO-LAST line (the last closing tag before the final \`}\`). Look for the last \`</Box>\` or \`</div>\` before the final return closing.
- "add at the top of the page" -> find the first JSX element after \`return (\` and insert_after that opening tag line.
- "add a button/form/section" -> create a complete JSX block with proper indentation.

A CONTACT FORM looks like:
\`\`\`tsx
<Box sx={{ mt: 4, p: 3, border:'1px solid rgba(0,0,0,0.1)', borderRadius: 2 }}>
 <Typography variant="h6" sx={{ mb: 2 }}>Contact Us</Typography>
 <TextField fullWidth label="Name" sx={{ mb: 2 }} />
 <TextField fullWidth label="Email" type="email" sx={{ mb: 2 }} />
 <TextField fullWidth label="Message" multiline rows={4} sx={{ mb: 2 }} />
 <Button variant="contained">Send Message</Button>
</Box>
\`\`\`

A BUY/PURCHASE BUTTON looks like:
\`\`\`tsx
<Button variant="contained" size="large" sx={{ mt: 3, px: 4, py: 1.5, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
 Buy Now
</Button>
\`\`\`

IMPORT RULES:
- For files in frontend/src/components/members/: use \`../../config/api\`, \`../shared/X\`
- For files in frontend/src/components/: use \`../config/api\`, \`./shared/X\`
- Define TypeScript interfaces INLINE -- do NOT import from nonexistent type files
- Use MUI components: \`import { Box, Button, TextField, Typography, ... } from'@mui/material';\`

Return ONLY the JSON object. No markdown fences, no explanation.`;

 const modResult = await this.callAI(
 modelId,
`Expert code editor. You produce line-based edits using line numbers. NEVER return the whole file. Return a JSON object with an edits array only. ${this.getDesignSystemContext()}`,
 modifyPrompt,
 );
 totalTokens += modResult.tokensUsed || 0;

 // Apply line-based edits to the file
 let updatedContent = targetFile.content;
 let editApplied = false;
 try {
 const jsonMatch = modResult.content.match(/\{[\s\S]*\}/);
 if (!jsonMatch) throw new Error('No JSON found in AI response');

 const editPlan = JSON.parse(jsonMatch[0]);
 let currentLines = [...fileLines];
 
 // Add new imports first (before line-shifting edits)
 if (editPlan.newImports && editPlan.newImports.trim()) {
 const importText = editPlan.newImports.trim();
 let lastImportLine = -1;
 for (let i = 0; i < currentLines.length; i++) {
 if (currentLines[i].trimStart().startsWith('import')) lastImportLine = i;
 }
 const insertAt = lastImportLine >= 0 ? lastImportLine + 1 : 0;
 currentLines.splice(insertAt, 0, ...importText.split('\n'));
 }

 // Sort edits by line number DESCENDING so earlier edits don't shift later line numbers
 const edits = (editPlan.edits || []).sort((a: any, b: any) => {
 const lineA = a.startLine || a.afterLine || 0;
 const lineB = b.startLine || b.afterLine || 0;
 return lineB - lineA;
 });

 let appliedCount = 0;
 for (const edit of edits) {
 try {
 if (edit.type ==='replace' && edit.startLine && edit.endLine) {
 const start = edit.startLine - 1; // convert to 0-indexed
 const count = edit.endLine - edit.startLine + 1;
 if (start >= 0 && start + count <= currentLines.length) {
 const newCodeLines = (edit.newCode ||'').split('\n');
 currentLines.splice(start, count, ...newCodeLines);
 appliedCount++;
 }
 } else if (edit.type ==='insert_after' && edit.afterLine !== undefined) {
 const after = edit.afterLine; // 0 = top, else 1-indexed
 const newCodeLines = (edit.newCode ||'').split('\n');
 if (after >= 0 && after <= currentLines.length) {
 currentLines.splice(after, 0, ...newCodeLines);
 appliedCount++;
 }
 } else if (edit.type ==='delete' && edit.startLine && edit.endLine) {
 const start = edit.startLine - 1;
 const count = edit.endLine - edit.startLine + 1;
 if (start >= 0 && start + count <= currentLines.length) {
 currentLines.splice(start, count);
 appliedCount++;
 }
 }
 } catch (editErr) {
 this.logger.error(`Individual edit failed: ${editErr}`);
 }
 }

 if (appliedCount > 0) {
 updatedContent = currentLines.join('\n');
 editApplied = true;
 stepResult.detail =`Modified ${targetFile.path} (${appliedCount}/${edits.length} line edits applied)`;
 } else if (edits.length > 0) {
 throw new Error(`No edits could be applied (0/${edits.length})`);
 } else {
 throw new Error('No edits in response');
 }
 } catch (editError) {
 // -- RETRY: Full-file approach ----------------------------
 this.logger.warn(`Line-based edits failed, trying full-file fallback: ${editError}`);
 const fallbackPrompt =`Modify this existing file according to the instruction. Return the COMPLETE updated file.

## Current file (${targetFile.path}):
\`\`\`${targetFile.language}
${targetFile.content}
\`\`\`

## Instruction: ${step.detail}

## USER'S ORIGINAL REQUEST:
"${body.message}"
${apiConfigContext}

CRITICAL:
1. Preserve ALL existing functionality. Only add/change what the instruction asks for.
2. Do NOT remove existing code unless explicitly asked.
3. Return the file EXACTLY ONCE -- do NOT duplicate it.
4. Do NOT import from nonexistent paths. Define types inline.

Return ONLY the complete updated file. No markdown fences, no explanations.`;
 
 const fallbackResult = await this.callAI(modelId,`Expert code editor. Preserve all existing code. Return the file exactly once. ${this.getDesignSystemContext()}`, fallbackPrompt);
 totalTokens += fallbackResult.tokensUsed || 0;
 updatedContent = fallbackResult.content
 .replace(/^```(?:tsx?|typescript|javascript)?\n?/gm,'')
 .replace(/\n?```\s*$/gm,'')
 .trim();
 editApplied = true;
 stepResult.detail =`Modified ${targetFile.path} (full-file fallback)`;
 }

 // -- VERIFICATION ------------------------------------------
 if (editApplied && updatedContent === targetFile.content) {
 stepResult.detail +=' -- WARNING: no actual changes detected';
 }

 // -- Deduplication guard ------------------------------------
 const originalExport = (targetFile.content.match(/export\s+(default\s+)?function\s+\w+/g) || []);
 const updatedExport = (updatedContent.match(/export\s+(default\s+)?function\s+\w+/g) || []);
 if (originalExport.length > 0 && updatedExport.length > originalExport.length) {
 const firstExportFunc = originalExport[0]!;
 const secondOccurrence = updatedContent.indexOf(firstExportFunc, updatedContent.indexOf(firstExportFunc) + firstExportFunc.length);
 if (secondOccurrence > 0) {
 updatedContent = updatedContent.slice(0, secondOccurrence).trimEnd();
 stepResult.detail +=' (dedup applied)';
 }
 }

 modifiedFiles.push({
 ...targetFile,
 content: updatedContent,
 description:`Modified: ${step.detail}`,
 });

 // Keep existingFiles in sync so later steps see the updated content
 const efIdx = existingFiles.findIndex(f => f.path === targetFile.path);
 if (efIdx >= 0) {
   existingFiles[efIdx] = { ...existingFiles[efIdx], content: updatedContent };
 }

 stepResult.status ='done';
 break;
 }

 // -- Delegate to Backend Agent -------------------------------
 case'delegate_backend':
 case'create_database': {
 // Collect all generated + modified files so far for backend analysis
 const allFilesForBackend = [
 ...existingFiles,
 ...generatedFiles,
 ...modifiedFiles,
 ];

 if (allFilesForBackend.length === 0) {
 stepResult.status ='done';
 stepResult.detail ='No files to analyze -- skipping backend delegation';
 break;
 }

 try {
 // Ask the Backend Agent to analyze what backend work is needed
 const analysis = await this.analyzeBackendNeeds(allFilesForBackend, appId, modelId);
 totalTokens += 1000; // estimate for analysis tokens

 if (!analysis.success || analysis.tasks.length === 0) {
 stepResult.status ='done';
 stepResult.detail ='Backend Agent found no additional backend tasks needed';
 break;
 }

 // Auto-implement all tasks that the Backend Agent can handle (DB seeding, etc.)
 const autoSeedTasks = analysis.tasks.filter(t => t.status ==='pending' && t.implementation?.type ==='db_seed');
 const autoApiTasks = analysis.tasks.filter(t => t.status ==='pending' && t.implementation?.type ==='create_api');
 const manualTasks = analysis.tasks.filter(t => t.status ==='pending' && !t.implementation);

 let implementedCount = 0;

 // Auto-implement seed tasks
 if (autoSeedTasks.length > 0) {
 const implResult = this.implementAllTasks(autoSeedTasks, appId);
 implementedCount = implResult.results.filter(r => r.success).length;

 // Record DB changes from backend agent
 for (const task of autoSeedTasks) {
 if (task.status ==='done' && task.implementation?.payload) {
 const payload = task.implementation.payload;
 dbChanges.push({
 table: payload.table as string,
 action:'seeded (via Backend Agent)',
 count: Array.isArray(payload.records) ? payload.records.length : 0,
 });
 }
 }
 }

 // Auto-implement API tasks by generating NestJS code
 for (const apiTask of autoApiTasks) {
 try {
 const apiSpec = apiTask.implementation!.payload;
 const apiGenPrompt =`Generate a COMPLETE NestJS backend implementation for:

${apiTask.title}: ${apiTask.description}
Route: ${apiSpec.route ||'/api/' + apiTask.id}
Methods: ${(apiSpec.methods || ['GET','POST']).join(',')}

## Requirements:
- NestJS controller with proper decorators
- NestJS service with business logic
- NestJS module that exports the controller and service
- Use JSON file database pattern: constructor(private readonly db: DatabaseService) with this.db.readSync() / this.db.writeSync(data)
- Import DatabaseService from'../shared/database.service'
- Controller routes MUST be prefixed with'api/' (e.g. @Controller('api/${apiTask.id}'))
- If calling external services, import CryptoService from'../shared/crypto.service' and use the getApiKey pattern
- Make it FULLY FUNCTIONAL -- not stubs

Return the code using ===FILE: path=== / ===END_FILE=== format.
Include controller, service, AND module files.`;

 const apiResult = await this.callAI(
 modelId,
'Expert NestJS backend developer. Generate clean, complete API code. Include module file.',
 apiGenPrompt,
 );
 totalTokens += apiResult.tokensUsed || 0;

 const apiFiles = this.parseFiles(apiResult.content);
 if (apiFiles.length > 0) {
 generatedFiles.push(...apiFiles);
 // Write to disk immediately
 this.writeGeneratedFilesToDisk(apiFiles);

 // Auto-register module
 const moduleFile = apiFiles.find(f => f.path.includes('.module.'));
 if (moduleFile) {
 const moduleNameMatch = moduleFile.content.match(/export\s+class\s+(\w+Module)/);
 if (moduleNameMatch) {
 const moduleName = moduleNameMatch[1];
 const relativePath ='./' + moduleFile.path.replace('backend/src/','').replace('.ts','');
 this.registerNestModule(moduleName, relativePath);
 }
 }

 apiTask.status ='done';
 implementedCount++;
 }
 } catch (apiErr) {
 // API generation failed -- leave as manual
 this.logger.error(`Failed to auto-generate API for "${apiTask.title}": ${apiErr}`);
 }
 }

 // Store backend tasks for the response
 backendDelegationTasks.push(...analysis.tasks);

 const parts: string[] = [];
 if (implementedCount > 0) parts.push(`auto-implemented ${implementedCount} task(s)`);
 if (manualTasks.length > 0) parts.push(`${manualTasks.length} manual task(s) identified`);
 const alreadyDone = analysis.tasks.filter(t => t.status ==='done').length - implementedCount;
 if (alreadyDone > 0) parts.push(`${alreadyDone} already done`);

 stepResult.status ='done';
 stepResult.detail =`Backend Agent: ${parts.join(',') ||'analysis complete'}`;
 } catch (backendErr) {
 stepResult.status ='failed';
 stepResult.detail =`Backend Agent error: ${backendErr instanceof Error ? backendErr.message :'Unknown'}`;
 }
 break;
 }

 // -- Install Packages --------------------------------------
 case'install_packages': {
 // Normalise: AI sometimes returns a string instead of an array
 let packages: string[] = Array.isArray(step.packages) ? step.packages : 
 (typeof step.packages === 'string' ? (step.packages as string).split(/[\s,]+/).filter(Boolean) : []);
 const target = step.target ||'frontend';

 if (packages.length === 0) {
 stepResult.status ='done';
 stepResult.detail ='No packages to install';
 break;
 }

 const installResult = this.installPackages(packages, target as'frontend' |'backend');
 if (installResult.success) {
 stepResult.status ='done';
 stepResult.detail =`Installed ${packages.join(',')} in ${target}`;
 } else {
 stepResult.status ='failed';
 stepResult.detail =`Install failed: ${installResult.error?.slice(0, 200)}`;
 }
 break;
 }

 // -- Run Shell Command --------------------------------------
 case'run_command': {
 const command = step.command;
 if (!command) {
 stepResult.status ='failed';
 stepResult.detail ='No command specified';
 break;
 }

 // Skip build/lint/verify/test commands -- these are handled automatically in step 3c+3d
 const buildCmds = ['npm run build','npx tsc','npm run lint','npx eslint','npm run check','tsc --noEmit','tsc','eslint','npm test','npm run test','jest','vitest'];
 if (buildCmds.some(b => command.toLowerCase().includes(b))) {
 stepResult.status ='done';
 stepResult.detail ='Skipped -- build verification and testing happen automatically after all steps';
 break;
 }

 // Security: allowlist -- only permit known safe commands
 const allowedPrefixes = [
   'npm test', 'npm run', 'npm ls', 'npm outdated', 'npm info', 'npm view',
   'npx ', 'node ', 'echo ', 'cat ', 'type ', 'dir ', 'ls ',
   'git status', 'git log', 'git diff', 'git show', 'git branch',
   'curl ', 'wget ', 'find ', 'grep ', 'head ', 'tail ', 'wc ',
   'pwd', 'cd ', 'mkdir ',
 ];
 const cmdLower = command.trim().toLowerCase();
 const isAllowed = allowedPrefixes.some(p => cmdLower.startsWith(p));
 if (!isAllowed) {
 stepResult.status ='failed';
 stepResult.detail =`Command blocked: only safe commands are allowed (npm, npx, node, git, etc.). Got: "${command.slice(0, 80)}"`;
 break;
 }

 // Additional safety: block shell chaining operators
 if (/[;&|`$]/.test(command) && !command.startsWith('echo')) {
 stepResult.status ='failed';
 stepResult.detail ='Command blocked: shell operators (;, &, |, `, $) are not allowed';
 break;
 }

 const cmdResult = this.runCommand(command, step.target || undefined);
 if (cmdResult.success) {
 stepResult.status ='done';
 stepResult.detail =`Command completed: ${cmdResult.output.slice(0, 300)}`;
 // Make command output available as context
 webContext +=`\nCommand output (${command}):\n${cmdResult.output.slice(0, 1000)}\n`;
 } else {
 stepResult.status ='failed';
 stepResult.detail =`Command failed: ${(cmdResult.error || cmdResult.output).slice(0, 300)}`;
 }
 break;
 }

 // -- Read File from Disk (with fallback paths) --------------
 case'read_file': {
 const targetPath = step.targetFile;
 if (!targetPath) {
 stepResult.status ='failed';
 stepResult.detail ='No file path specified';
 break;
 }

 // Try the exact path first, then common fallback patterns
 const pathsToTry = [
 targetPath,
 targetPath.replace(/^(frontend|backend)\//,'src/'),
`frontend/${targetPath}`,
`backend/${targetPath}`,
 targetPath.replace(/^src\//,'frontend/src/'),
 targetPath.replace(/^src\//,'backend/src/'),
 ];

 let foundContent: string | null = null;
 let foundPath = targetPath;
 for (const tryPath of pathsToTry) {
 const content = this.readFileFromDisk(tryPath);
 if (content) {
 foundContent = content;
 foundPath = tryPath;
 break;
 }
 }

 // If still not found, try to find similar files in parent dir
 if (!foundContent) {
 const filename = path.basename(targetPath);
 const dir = path.dirname(targetPath);
 for (const prefix of ['','frontend/','backend/']) {
 const dirFiles = this.listDirectory(prefix + dir);
 const match = dirFiles.find(f => f.includes(filename) || filename.includes(f));
 if (match) {
 const fullPath = prefix + dir +'/' + match;
 const content = this.readFileFromDisk(fullPath);
 if (content) {
 foundContent = content;
 foundPath = fullPath;
 break;
 }
 }
 }
 }

 if (foundContent) {
 webContext +=`\nFile contents (${foundPath}):\n${foundContent.slice(0, 3000)}\n`;
 // Also add to existingFiles so modify_file can find it later
 if (!existingFiles.find(f => f.path === foundPath)) {
 const ext = path.extname(foundPath).slice(1);
 existingFiles.push({
 path: foundPath,
 content: foundContent,
 language: ext ==='tsx' || ext ==='ts' ?'typescript' : ext,
 description:`Read from disk: ${foundPath}`,
 });
 }
 stepResult.status ='done';
 stepResult.detail =`Read ${foundPath} (${foundContent.length} chars)`;
 } else {
 // Don't fail -- just note and continue
 stepResult.status ='done';
 stepResult.detail =`File not found: ${targetPath} (tried multiple paths, continuing without it)`;
 webContext +=`\nNote: Could not find file ${targetPath}. Proceeding without it.\n`;
 }
 break;
 }

 // -- List Directory -----------------------------------------
 case'list_directory': {
 const dirPath = step.targetDir || step.detail ||'.';
 const dirFiles = this.listDirectory(dirPath);
 if (dirFiles.length > 0) {
 webContext +=`\nDirectory listing (${dirPath}):\n${dirFiles.join('\n')}\n`;
 stepResult.status ='done';
 stepResult.detail =`Listed ${dirFiles.length} files in ${dirPath}`;
 } else {
 stepResult.status ='done';
 stepResult.detail =`Directory ${dirPath} is empty or not found`;
 }
 break;
 }

 // -- Create API (NestJS backend) ----------------------------
 case'create_api': {
 // Auto-search web for API documentation if no web context yet
 if (!webContext && this.getApiKey('brave')) {
 try {
 const apiSearchQuery = `${step.detail || step.title} API documentation NestJS implementation`;
 sendEvent('progress', { message: `Researching: "${apiSearchQuery}"...` });
 const apiSearchResults = await this.searchBrave(apiSearchQuery, 5);
 if (apiSearchResults.length > 0) {
 searchResults = [...searchResults, ...apiSearchResults];
 webContext = apiSearchResults.map((r, i) => `${i + 1}. ${r.title}: ${r.description} (${r.url})`).join('\n');
 }
 } catch (err) { this.logger.debug('Auto web search for create_api failed: ' + err); }
 }

 // Read existing backend module as an example template (like Copilot reads existing patterns)
 let backendExamples ='';
 const existingModuleDirs = this.listDirectory('backend/src').filter(f => !f.includes('.') && !f.includes('node_modules'));
 // Find a simple existing module to use as template
 for (const dir of ['chat','apps','health','pages','settings']) {
 if (existingModuleDirs.includes(dir)) {
 const ctrlContent = this.readFileFromDisk(`backend/src/${dir}/${dir}.controller.ts`);
 const svcContent = this.readFileFromDisk(`backend/src/${dir}/${dir}.service.ts`);
 const modContent = this.readFileFromDisk(`backend/src/${dir}/${dir}.module.ts`);
 if (ctrlContent && svcContent && modContent) {
 backendExamples =`\n## EXISTING BACKEND MODULE TO USE AS TEMPLATE -- follow this exact pattern:\n### Controller (backend/src/${dir}/${dir}.controller.ts):\n\`\`\`typescript\n${ctrlContent.slice(0, 3000)}\n\`\`\`\n### Service (backend/src/${dir}/${dir}.service.ts):\n\`\`\`typescript\n${svcContent.slice(0, 3000)}\n\`\`\`\n### Module (backend/src/${dir}/${dir}.module.ts):\n\`\`\`typescript\n${modContent}\n\`\`\`\nStudy the template above carefully. Match its import patterns, decorator usage, DatabaseService usage, error handling, and code structure exactly.\n`;
 break;
 }
 }
 }

 const apiPrompt =`Generate a COMPLETE NestJS backend implementation for:

${step.detail}
${backendExamples}

## Requirements:
- NestJS controller with proper decorators (@Controller, @Get, @Post, @Put, @Delete)
- NestJS service with business logic
- NestJS module that exports the controller and service
- Use JSON file database pattern: constructor(private readonly db: DatabaseService) with this.db.readSync() / this.db.writeSync(data)
- Import DatabaseService from'../shared/database.service'
- Include proper TypeScript types/interfaces
- Add error handling and validation
- Follow RESTful conventions
- Make it FULLY FUNCTIONAL -- not stubs
- Controller routes MUST be prefixed with'api/' (e.g. @Controller('api/generate-image'))

## API Key Access Pattern:
If this API needs to call an external service (OpenAI, Stripe, etc.), use this pattern to read stored API keys:
\`\`\`typescript
import { CryptoService } from'../shared/crypto.service';
// In constructor: private readonly cryptoService: CryptoService
private getApiKey(provider: string): string | null {
 const data = this.db.readSync();
 const apiKeys = data.apiKeys || [];
 const keyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === provider.toLowerCase());
 if (!keyEntry) return null;
 return this.cryptoService.decrypt(keyEntry.value);
}
\`\`\`
Available stored API keys: ${configuredKeys.join(',') ||'none'}
Always check if the key exists and return a clear error message if not configured.

## Apify Integration Pattern (for scraping/data features):
If this API calls Apify actors for web scraping, use this EXACT pattern:
\\\`\\\`\\\`typescript
import axios from 'axios';

async runApifyActor(actorId: string, input: Record<string, any>): Promise<any[]> {
  const token = this.getApiKey('apify');
  if (!token) throw new Error('Apify API key not configured');
  
  const runResponse = await axios.post(
    \\\`https://api.apify.com/v2/acts/\\\${actorId}/runs\\\`,
    input,
    { headers: { 'Authorization': \\\`Bearer \\\${token}\\\` }, params: { waitForFinish: 120 }, timeout: 130000 },
  );
  
  const datasetId = runResponse.data?.data?.defaultDatasetId;
  if (!datasetId) throw new Error('No dataset returned from Apify');
  
  const results = await axios.get(\\\`https://api.apify.com/v2/datasets/\\\${datasetId}/items\\\`, {
    headers: { 'Authorization': \\\`Bearer \\\${token}\\\` }, params: { format: 'json' }, timeout: 15000,
  });
  return results.data || [];
}
\\\`\\\`\\\`
Common actor IDs: curious_coder/linkedin-profile-scraper, curious_coder/linkedin-company-scraper, trudax~reddit-scraper-lite, apify/instagram-scraper, apify/google-search-scraper

${webContext ?`## Reference:\n${webContext}` :''}

Return the code using ===FILE: path=== / ===END_FILE=== format.
You MUST return EXACTLY 3 files using this delimiter format. Do NOT return a single code block.

Example output format:
===FILE: backend/src/example/example.controller.ts===
import { Controller } from'@nestjs/common';
// ... controller code
===END_FILE===

===FILE: backend/src/example/example.service.ts===
import { Injectable } from'@nestjs/common';
// ... service code
===END_FILE===

===FILE: backend/src/example/example.module.ts===
import { Module } from'@nestjs/common';
// ... module code
===END_FILE===

Return ALL 3 files (controller, service, module) using ===FILE: path=== and ===END_FILE=== delimiters. No other text.`;

 const apiResult = await this.callAI(
 modelId,
'Expert NestJS backend developer. Generate clean, well-structured, COMPLETE API code. Include module file. No stubs or placeholders.',
 apiPrompt,
 );
 totalTokens += apiResult.tokensUsed || 0;

 let apiFiles = this.parseFiles(apiResult.content);
 
 // If parseFiles returned only 1 file, AI didn't use the delimiter format -- try to split the code
 if (apiFiles.length <= 1) {
 const cleanApi = apiResult.content
 .replace(/^```(?:tsx?|typescript)?\n?/m,'')
 .replace(/\n?```$/m,'')
 .trim();
 
 // Detect the slug from @Controller decorator
 const controllerMatch = cleanApi.match(/@Controller\(['"](?:api\/)?([\\w-]+)['"]\)/);
 const slug = controllerMatch ? controllerMatch[1] : (step.title ||'api').toLowerCase().replace(/[^a-z0-9]+/g,'-');
 
 // Try to split by class boundaries
 const controllerCode = cleanApi.match(/(import[\s\S]*?@Controller[\s\S]*?export\s+class\s+\w+Controller[\s\S]*?^})/m);
 const serviceCode = cleanApi.match(/(import[\s\S]*?@Injectable[\s\S]*?export\s+class\s+\w+Service[\s\S]*?^})/m);
 const moduleCode = cleanApi.match(/(import[\s\S]*?@Module[\s\S]*?export\s+class\s+\w+Module[\s\S]*?^})/m);
 
 apiFiles = [];
 if (controllerCode) apiFiles.push({ path:`backend/src/${slug}/${slug}.controller.ts`, content: controllerCode[1], language:'typescript', description:`Controller for ${slug}` });
 if (serviceCode) apiFiles.push({ path:`backend/src/${slug}/${slug}.service.ts`, content: serviceCode[1], language:'typescript', description:`Service for ${slug}` });
 if (moduleCode) apiFiles.push({ path:`backend/src/${slug}/${slug}.module.ts`, content: moduleCode[1], language:'typescript', description:`Module for ${slug}` });
 
 // If splitting failed, just save the whole thing as the service
 if (apiFiles.length === 0) {
 apiFiles.push({
 path:`backend/src/${slug}/${slug}.service.ts`,
 content: cleanApi,
 language:'typescript',
 description: step.detail,
 });
 }
 }

 if (apiFiles.length > 0) {
 generatedFiles.push(...apiFiles);

 // Auto-register module in app.module.ts
 const moduleFile = apiFiles.find(f => f.path.includes('.module.'));
 if (moduleFile) {
 const moduleNameMatch = moduleFile.content.match(/export\s+class\s+(\w+Module)/);
 if (moduleNameMatch) {
 const moduleName = moduleNameMatch[1];
 const relativePath ='./' + moduleFile.path.replace('backend/src/','').replace('.ts','');
 this.registerNestModule(moduleName, relativePath);
 }
 }

 stepResult.status ='done';
 stepResult.detail =`Generated ${apiFiles.length} API file(s) + registered module`;
 }
 break;
 }

 // -- Search Codebase (grep) ---------------------------------
 case'search_codebase': {
 const query = step.searchQuery || step.detail || body.message;
 const searchOpts: { includePattern?: string; isRegex?: boolean; maxResults?: number } = {};
 if (step.targetFile) searchOpts.includePattern = step.targetFile;

 sendEvent('progress', { message: `🔍 Searching codebase for "${query}"...` });
 const searchResult = this.searchCodebase(query, searchOpts);
 const matches = searchResult.matches;
 if (matches.length > 0) {
 const formatted = matches.slice(0, 30).map(r => `${r.file}:${r.line}: ${r.text}`).join('\n');
 webContext += `\nCodebase search results for "${query}":\n${formatted}\n`;

 // Auto-read the most relevant files found
 const uniqueFiles = [...new Set(matches.map(r => r.file))].slice(0, 5);
 for (const foundFile of uniqueFiles) {
 if (!existingFiles.find(f => f.path === foundFile)) {
 const content = this.readFileFromDisk(foundFile);
 if (content) {
 const ext = path.extname(foundFile).slice(1);
 existingFiles.push({
 path: foundFile,
 content,
 language: ext === 'tsx' || ext === 'ts' ? 'typescript' : ext,
 description: `Found via search: ${foundFile}`,
 });
 }
 }
 }

 stepResult.status = 'done';
 stepResult.detail = `Found ${matches.length} matches across ${uniqueFiles.length} files for "${query}"`;
 } else {
 stepResult.status = 'done';
 stepResult.detail = `No matches found for "${query}" -- continuing`;
 webContext += `\nNo codebase matches for "${query}".\n`;
 }
 break;
 }

 // -- Multi-File Coordinated Edit ----------------------------
 case'modify_files': {
 const targetFilePaths: string[] = step.targetFiles || [];
 if (targetFilePaths.length === 0) {
 stepResult.status = 'failed';
 stepResult.detail = 'No target files specified for modify_files';
 break;
 }

 sendEvent('progress', { message: `📝 Coordinated edit across ${targetFilePaths.length} files...` });

 // Read all target files
 const filesToModify: Array<{path: string; content: string; language: string}> = [];
 for (const fp of targetFilePaths) {
 // Try exact path and fallbacks
 const pathsToTry = [fp, `frontend/${fp}`, `backend/${fp}`, fp.replace(/^src\//, 'frontend/src/')];
 for (const tryPath of pathsToTry) {
 const content = this.readFileFromDisk(tryPath);
 if (content) {
 const ext = path.extname(tryPath).slice(1);
 filesToModify.push({ path: tryPath, content, language: ext === 'tsx' || ext === 'ts' ? 'typescript' : ext });
 break;
 }
 }
 }

 if (filesToModify.length === 0) {
 stepResult.status = 'failed';
 stepResult.detail = `Could not read any of: ${targetFilePaths.join(', ')}`;
 break;
 }

 // Send all files to AI for coordinated modification
 const multiFilePrompt = `You must modify ${filesToModify.length} files in a COORDINATED way. All changes must be consistent across files.

## Task: ${step.detail}

## USER'S ORIGINAL REQUEST:
"${body.message}"

${filesToModify.map(f => `## FILE: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

${webContext ? `## Context:\n${webContext}` : ''}

Return ALL modified files using this format:
===FILE: path/to/file.ext===
(complete file content)
===END_FILE===

Include EVERY file, even if unchanged. Ensure imports, types, and references are consistent across all files.`;

 const multiResult = await this.callAI(
 modelId,
 `Expert full-stack developer. You modify multiple files in a coordinated way, ensuring consistency across all changes. ${this.getDesignSystemContext()}`,
 multiFilePrompt,
 );
 totalTokens += multiResult.tokensUsed || 0;

 const parsedMultiFiles = this.parseFiles(multiResult.content);
 if (parsedMultiFiles.length > 0) {
 for (const parsed of parsedMultiFiles) {
 // Check if this was an existing file being modified vs a new file
 const original = filesToModify.find(f => f.path === parsed.path || parsed.path.endsWith(path.basename(f.path)));
 if (original) {
 modifiedFiles.push({
 ...parsed,
 description: `Modified (coordinated): ${step.detail}`,
 });
 } else {
 generatedFiles.push(parsed);
 }
 }
 stepResult.status = 'done';
 stepResult.detail = `Coordinated edit: ${parsedMultiFiles.length} files modified`;
 } else {
 stepResult.status = 'failed';
 stepResult.detail = 'AI returned no parseable files for multi-file edit';
 }
 break;
 }

 // -- Delete File (with confirmation) -------------------------
 case'delete_file': {
 const delPath = step.targetFile;
 if (!delPath) {
 stepResult.status = 'failed';
 stepResult.detail = 'No file path specified for deletion';
 break;
 }
 // Check file exists
 const delContent = this.readFileFromDisk(delPath);
 if (!delContent) {
 stepResult.status = 'failed';
 stepResult.detail = `File not found: ${delPath}`;
 break;
 }
 // Delete the file
 try {
 const projectRoot = path.resolve(__dirname, '..', '..', '..');
 let safePath = delPath.replace(/^\/+/, '').replace(/^\\+/, '');
 if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
 const absPath = path.resolve(projectRoot, safePath);
 if (!absPath.startsWith(projectRoot)) {
 stepResult.status = 'failed';
 stepResult.detail = 'Path escapes project root';
 break;
 }
 fs.unlinkSync(absPath);
 stepResult.status = 'done';
 stepResult.detail = `Deleted file: ${delPath}`;
 sendEvent('progress', { message: `Deleted: ${delPath}` });
 } catch (delErr) {
 stepResult.status = 'failed';
 stepResult.detail = `Delete failed: ${delErr instanceof Error ? delErr.message : String(delErr)}`;
 }
 break;
 }

 // -- Chat / Advise ------------------------------------------
 case'chat':
 default: {
 const chatPrompt =`${body.message}

${webContext ?`\nWeb research:\n${webContext}` :''}
${fileContext ?`\nProject files:\n${fileContext}` :''}`;

 const chatResult = await this.callAI(
 modelId,
`You are an elite full-stack coding agent. Available API keys: ${configuredKeys.join(',') ||'none'}. Database: ${dbSummary}. ${appContext}`,
 chatPrompt,
 history,
 );
 totalTokens += chatResult.tokensUsed || 0;

 // Safety: if the AI returned code with file markers, extract into files instead of dumping to chat
 const extractedFiles = this.parseFiles(chatResult.content);
 if (extractedFiles.length > 0) {
 for (const ef of extractedFiles) {
 generatedFiles.push(ef);
 }
 chatResponse = `Generated ${extractedFiles.length} file(s): ${extractedFiles.map(f => f.path).join(', ')}`;
 // Upgrade intent to build so files get written to disk
 if (plan.intent === 'chat') plan.intent = 'build';
 } else {
 chatResponse = chatResult.content;
 }
 stepResult.status ='done';
 break;
 }
 }
 } catch (stepErr) {
 stepResult.status ='failed';
 const errorMsg = stepErr instanceof Error ? stepErr.message :'Unknown error';
 stepResult.detail =`Error: ${errorMsg}`;

 // Notify client of initial failure
 sendEvent('step_complete', { id: step.id, title: step.title, status:'failed', detail: stepResult.detail });

 // -- Diagnostic Retry System (3 escalating strategies) ---------
 if (step.action !=='chat' && step.action !=='search_web' && step.action !=='clarify') {
 sendEvent('progress', { message: `🧠 Engaging diagnostic retry system for "${step.title}"...` });

 const retryResult = await this.diagnosticRetry(
   step,
   errorMsg,
   modelId,
   existingFiles,
   generatedFiles,
   modifiedFiles,
   webContext,
   fileContext,
   sendEvent,
   appContext,
 );
 totalTokens += retryResult.tokensUsed;

 if (retryResult.success && retryResult.files.length > 0) {
   // Merge recovered files into the appropriate arrays
   for (const file of retryResult.files) {
     const existingGenIdx = generatedFiles.findIndex(f => f.path === file.path);
     const existingModIdx = modifiedFiles.findIndex(f => f.path === file.path);
     if (existingGenIdx >= 0) {
       generatedFiles[existingGenIdx] = file;
     } else if (existingModIdx >= 0) {
       modifiedFiles[existingModIdx] = file;
     } else {
       generatedFiles.push(file);
     }
   }
   stepResult.status ='done';
   stepResult.detail += ` → ${retryResult.detail}`;
   sendEvent('progress', { message: `✅ Recovered: ${retryResult.detail}` });
 } else {
   stepResult.detail += ` → ${retryResult.detail}`;
   sendEvent('progress', { message: `❌ All retry strategies exhausted for "${step.title}"` });
   // Record this failure as a gotcha so future sessions avoid it
   try {
     this.docAgent.addGotcha(
       `Step "${step.title}" (${step.action}) failed: ${errorMsg.slice(0, 200)}`,
       retryResult.detail || 'All retry strategies exhausted',
     );
   } catch (err) { this.logger.debug("Caught (non-critical): " + err); }
 }
 }
 }

 // Notify client of step completion (final status)
 if (stepResult.status ==='done' || stepResult.status ==='failed') {
 sendEvent('step_complete', { id: step.id, title: step.title, status: stepResult.status, detail: stepResult.detail });
 }
 }

 // ------------------------------------------------------------------
 // STEP 2.3: Re-plan if multiple steps failed
 // ------------------------------------------------------------------
 const failedStepResults = executedPlan.filter(s => s.status === 'failed');
 const completedStepResults = executedPlan.filter(s => s.status === 'done');
 const executedStepIds = new Set(executedPlan.map(s => s.id));
 const remainingSteps = plan.steps.filter((s: any) => !executedStepIds.has(s.id));

 if (failedStepResults.length >= 2 && remainingSteps.length > 0) {
   sendEvent('progress', { message: `🔄 ${failedStepResults.length} steps failed — re-planning remaining ${remainingSteps.length} step(s)...` });

   const rePlanResult = await this.rePlanRemainingSteps(
     failedStepResults.map(s => ({ title: s.title, error: s.detail || 'Unknown' })),
     completedStepResults.map(s => ({ title: s.title, detail: s.detail || '' })),
     remainingSteps,
     body.message,
     modelId,
     existingFiles,
     generatedFiles,
     appContext,
   );
   totalTokens += rePlanResult.tokensUsed;

   if (rePlanResult.success && rePlanResult.revisedSteps.length > 0) {
     sendEvent('progress', { message: `📋 Revised plan: ${rePlanResult.revisedSteps.length} new step(s)` });
     sendEvent('plan', {
       summary: `Revised plan after ${failedStepResults.length} failures`,
       intent: 'build',
       steps: rePlanResult.revisedSteps.map((s: any) => ({ id: s.id, title: s.title, action: s.action })),
     });

     // Execute the revised steps (re-enter the step loop)
     for (const revisedStep of rePlanResult.revisedSteps) {
       const rStepResult: any = { id: revisedStep.id, title: revisedStep.title, status: 'running', detail: revisedStep.detail };
       executedPlan.push(rStepResult);
       sendEvent('step_start', { id: revisedStep.id, title: revisedStep.title, action: revisedStep.action });

       try {
         // For revised steps, only handle the most common actions to avoid deep recursion
         switch (revisedStep.action) {
           case 'search_codebase': {
             const q = revisedStep.searchQuery || revisedStep.detail;
             const sr = this.searchCodebase(q, {});
             if (sr.matches.length > 0) {
               const formatted = sr.matches.slice(0, 20).map(r => `${r.file}:${r.line}: ${r.text}`).join('\n');
               webContext += `\nRevised search "${q}":\n${formatted}\n`;
               const uniqueFiles = [...new Set(sr.matches.map(r => r.file))].slice(0, 5);
               for (const ff of uniqueFiles) {
                 if (!existingFiles.find(f => f.path === ff)) {
                   const c = this.readFileFromDisk(ff);
                   if (c) existingFiles.push({ path: ff, content: c, language: 'typescript', description: `Revised search` });
                 }
               }
             }
             rStepResult.status = 'done';
             rStepResult.detail = `Found ${sr.matches.length} matches`;
             break;
           }
           case 'generate_component':
           case 'modify_file':
           case 'modify_files': {
             const targetPath = revisedStep.targetFile || revisedStep.newFilePath;
             let existingContent = '';
             if (targetPath) {
               const ef = existingFiles.find(f => f.path === targetPath);
               existingContent = ef ? ef.content : (this.readFileFromDisk(targetPath) || '');
             }

             const revisedPrompt = `${revisedStep.detail}

${existingContent ? `## Current file (${targetPath}):\n\`\`\`\n${existingContent.slice(0, 6000)}\n\`\`\`\n` : ''}
${webContext ? `## Context:\n${webContext.slice(0, 4000)}\n` : ''}
${fileContext ? `## Project:\n${fileContext.slice(0, 3000)}\n` : ''}

Generate the complete code. No explanation, no markdown fences.`;

             const genResult = await this.callAI(modelId, `Expert coder executing revised plan step. ${this.getDesignSystemContext()}. ${appContext}`, revisedPrompt);
             totalTokens += genResult.tokensUsed || 0;
             const clean = this.cleanCodeResponse(genResult.content);

             if (clean.length > 50) {
               const files = this.parseFiles(genResult.content);
               if (files.length > 0) {
                 generatedFiles.push(...files);
               } else {
                 generatedFiles.push({
                   path: targetPath || `frontend/src/components/${this.toPascalCase(revisedStep.title)}.tsx`,
                   content: clean,
                   language: 'typescript',
                   description: `Revised: ${revisedStep.detail}`,
                 });
               }
               rStepResult.status = 'done';
               rStepResult.detail = `Revised step completed`;
             } else {
               rStepResult.status = 'failed';
               rStepResult.detail = 'Revised step produced insufficient output';
             }
             break;
           }
           case 'read_file': {
             const content = this.readFileFromDisk(revisedStep.targetFile);
             if (content) {
               webContext += `\nFile ${revisedStep.targetFile}:\n${content.slice(0, 3000)}\n`;
               if (!existingFiles.find(f => f.path === revisedStep.targetFile)) {
                 existingFiles.push({ path: revisedStep.targetFile, content, language: 'typescript', description: 'Revised read' });
               }
               rStepResult.status = 'done';
             } else {
               rStepResult.status = 'done';
               rStepResult.detail = `File not found: ${revisedStep.targetFile}`;
             }
             break;
           }
           default: {
             rStepResult.status = 'done';
             rStepResult.detail = `Skipped action "${revisedStep.action}" in revised plan`;
             break;
           }
         }
       } catch (rErr) {
         rStepResult.status = 'failed';
         rStepResult.detail = `Revised step error: ${rErr instanceof Error ? rErr.message : String(rErr)}`;
       }

       sendEvent('step_complete', { id: revisedStep.id, title: revisedStep.title, status: rStepResult.status, detail: rStepResult.detail });
     }
   }
 }

 // ------------------------------------------------------------------
 // STEP 2.5: Auto-delegate to Backend Agent if not already done
 // ------------------------------------------------------------------

 const hadBackendStep = plan.steps.some((s: any) => s.action ==='delegate_backend' || s.action ==='create_database' || s.action ==='create_api');
 // Only auto-delegate if: (a) the plan didn't already handle backend, (b) there are 3+ generated files
 // (suggesting a substantial feature build), and (c) the plan is a build intent
 if (!hadBackendStep && generatedFiles.length >= 3 && plan.intent ==='build') {
 try {
 const allFilesForAutoDelegate = [...existingFiles, ...generatedFiles, ...modifiedFiles];
 const analysis = await this.analyzeBackendNeeds(allFilesForAutoDelegate, appId, modelId);

 if (analysis.success && analysis.tasks.length > 0) {
 const autoTasks = analysis.tasks.filter(t => t.status ==='pending' && t.implementation);
 if (autoTasks.length > 0) {
 const implResult = this.implementAllTasks(autoTasks, appId);
 const implementedCount = implResult.results.filter(r => r.success).length;

 for (const task of autoTasks) {
 if (task.status ==='done' && task.implementation?.payload) {
 const payload = task.implementation.payload;
 dbChanges.push({
 table: payload.table as string,
 action:'seeded (auto-delegated to Backend Agent)',
 count: Array.isArray(payload.records) ? payload.records.length : 0,
 });
 }
 }
 backendDelegationTasks.push(...analysis.tasks);

 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Backend Agent (auto-delegated)',
 status:'done',
 detail:`Auto-implemented ${implementedCount} backend task(s), ${analysis.tasks.filter(t => !t.implementation).length} manual task(s) identified`,
 });
 }
 }
 } catch (err) { this.logger.debug("Caught (auto-delegation is best-effort): " + err); }
 }

 // ------------------------------------------------------------------
 // STEP 3: Auto-write files to disk, install packages, verify build
 // ------------------------------------------------------------------

 const filesWritten: string[] = [];
 const packagesInstalled: string[] = [];
 const buildErrors: string[] = [];

 if (plan.intent ==='build' && (generatedFiles.length > 0 || modifiedFiles.length > 0)) {
 // 3a: Write all generated and modified files to disk
 const allToWrite = [...generatedFiles, ...modifiedFiles];
 if (allToWrite.length > 0) {
 sendEvent('progress', { message:` Writing ${allToWrite.length} file(s) to disk...` });
 const writeResult = this.writeGeneratedFilesToDisk(allToWrite);
 filesWritten.push(...writeResult.written);
 if (writeResult.errors.length > 0) {
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Write files to disk',
 status: writeResult.written.length > 0 ?'done' :'failed',
 detail:`Wrote ${writeResult.written.length} file(s)${writeResult.errors.length > 0 ?`, ${writeResult.errors.length} error(s)` :''}`,
 });
 sendEvent('step_complete', { id:'write', title:'Write files to disk', status: writeResult.written.length > 0 ?'done' :'failed', detail:`Wrote ${writeResult.written.length} file(s), ${writeResult.errors.length} error(s)` });
 } else {
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Write files to disk',
 status:'done',
 detail:`Wrote ${writeResult.written.length} file(s): ${writeResult.written.join(',')}`,
 });
 sendEvent('step_complete', { id:'write', title:'Write files to disk', status:'done', detail:`Wrote ${writeResult.written.length} file(s): ${writeResult.written.join(',')}` });
 }
 }

 // 3a-2: Auto-update frontend/src/config/api.ts for any new backend controllers
 try {
 const newControllers = allToWrite.filter(f => f.path.includes('.controller.') && f.path.startsWith('backend/'));
 if (newControllers.length > 0) {
 const projRoot = path.resolve(__dirname,'..','..','..');
 const apiConfigPath = path.join(projRoot,'frontend','src','config','api.ts');
 if (fs.existsSync(apiConfigPath)) {
 let apiConfig = fs.readFileSync(apiConfigPath,'utf-8');
 let updated = false;

 for (const ctrl of newControllers) {
 // Extract route from @Controller('api/xxx')
 const routeMatch = ctrl.content.match(/@Controller\(['"]api\/([^'"]+)['"]\)/);
 if (!routeMatch) continue;
 const route = routeMatch[1];
 // Convert route-name to camelCase endpoint name
 const endpointName = route.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());

 // Check if already in API config
 if (apiConfig.includes(`${endpointName}:`)) continue;

 // Add before the closing "} as const"
 const insertBefore ='} as const;';
 if (apiConfig.includes(insertBefore)) {
 apiConfig = apiConfig.replace(
 insertBefore,
` ${endpointName}: \`\${API_BASE_URL}/api/${route}\`,\n${insertBefore}`,
 );
 updated = true;
 }
 }

 if (updated) {
 fs.writeFileSync(apiConfigPath, apiConfig,'utf-8');
 filesWritten.push('frontend/src/config/api.ts');
 }
 }
 }
 } catch (err) { this.logger.debug("Caught (non-critical): " + err); }

 // 3b: Detect and install any missing npm packages
 const hadInstallStep = plan.steps.some((s: any) => s.action ==='install_packages');
 if (!hadInstallStep) {
 const detected = this.detectRequiredPackages(allToWrite);
 if (detected.frontend.length > 0) {
 const frontendInstall = this.installPackages(detected.frontend,'frontend');
 if (frontendInstall.success) {
 packagesInstalled.push(...detected.frontend);
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Install frontend packages',
 status:'done',
 detail:`Installed: ${detected.frontend.join(',')}`,
 });
 } else {
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Install frontend packages',
 status:'failed',
 detail:`Failed to install ${detected.frontend.join(',')}: ${frontendInstall.error?.slice(0, 150)}`,
 });
 }
 }
 if (detected.backend.length > 0) {
 const backendInstall = this.installPackages(detected.backend,'backend');
 if (backendInstall.success) {
 packagesInstalled.push(...detected.backend);
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Install backend packages',
 status:'done',
 detail:`Installed: ${detected.backend.join(',')}`,
 });
 } else {
 executedPlan.push({
 id: executedPlan.length + 1,
 title:'Install backend packages',
 status:'failed',
 detail:`Failed to install ${detected.backend.join(',')}: ${backendInstall.error?.slice(0, 150)}`,
 });
 }
 }
 }

 // 3c: Verify TypeScript build and auto-fix errors (retry loop, up to 5 attempts with diagnostic escalation)
 const hasFrontendFiles = allToWrite.some(f => f.path.startsWith('frontend/'));
 const hasBackendFiles = allToWrite.some(f => f.path.startsWith('backend/'));

 for (const target of (['frontend','backend'] as const)) {
 if ((target ==='frontend' && !hasFrontendFiles) || (target ==='backend' && !hasBackendFiles)) continue;

 sendEvent('progress', { message:` Verifying ${target} build...` });

 // Only check errors in files we actually touched
 const ourFilePaths = allToWrite.filter(f => f.path.startsWith(`${target}/`)).map(f => f.path);
 let buildCheck = this.verifyBuild(target, ourFilePaths);

 if (!buildCheck.success && buildCheck.errors.length > 0) {
 sendEvent('progress', { message:`[!] ${buildCheck.errors.length} build error(s) in ${target} -- attempting auto-fix...` });
 let fixAttempt = 0;
 const maxAttempts = 5; // increased from 3: 3 direct fixes + 2 diagnostic attempts
 let lastFixCount = 0;
 let previousErrorCount = buildCheck.errors.length;
 let stuckCount = 0; // track if error count stops decreasing

 while (!buildCheck.success && buildCheck.errors.length > 0 && fixAttempt < maxAttempts) {
 fixAttempt++;

 // After 3 basic attempts, escalate to diagnostic fix approach
 if (fixAttempt > 3 && stuckCount >= 2) {
   sendEvent('progress', { message: `🧠 Escalating to diagnostic build fix (attempt ${fixAttempt})...` });

   // Read related files to give the AI more context
   const errorFiles = [...new Set(buildCheck.errors.map(e => {
     const m = e.match(/^(.+?)\(\d+,\d+\):/);
     return m ? m[1].replace(/\\/g, '/') : '';
   }).filter(Boolean))];

   let diagnosticBuildContext = '';
   for (const errFile of errorFiles.slice(0, 3)) {
     // Find imports in the error file and read them too
     const errContent = this.readFileFromDisk(errFile) || this.readFileFromDisk(`${target}/${errFile}`);
     if (errContent) {
       const importPaths = errContent.match(/from\s+['"]([^'"]+)['"]/g) || [];
       for (const imp of importPaths.slice(0, 5)) {
         const impPath = imp.match(/from\s+['"]([^'"]+)['"]/)?.[1];
         if (impPath && impPath.startsWith('.')) {
           const resolvedPath = path.join(path.dirname(errFile), impPath).replace(/\\/g, '/') + '.ts';
           const impContent = this.readFileFromDisk(resolvedPath) || this.readFileFromDisk(resolvedPath + 'x');
           if (impContent) {
             diagnosticBuildContext += `\n## Imported file: ${resolvedPath}\n\`\`\`typescript\n${impContent.slice(0, 2000)}\n\`\`\`\n`;
           }
         }
       }
     }
   }

   // Use the diagnostic context in the fix prompt
   const diagFixFiles = allToWrite.filter(f => f.path.startsWith(`${target}/`));
   for (const df of diagFixFiles) {
     (df as any)._diagnosticContext = diagnosticBuildContext;
   }
 }

 const targetFiles = allToWrite.filter(f => f.path.startsWith(`${target}/`));
 const fixResult = await this.autoFixBuildErrors(buildCheck.errors, targetFiles, modelId);
 totalTokens += 800; // estimate per fix attempt

 if (fixResult.fixed.length > 0) {
 // Write fixed files to disk
 this.writeGeneratedFilesToDisk(fixResult.fixed);

 // Update the generated/modified files arrays with fixes
 for (const fixed of fixResult.fixed) {
 const genIdx = generatedFiles.findIndex(f => f.path === fixed.path);
 if (genIdx >= 0) generatedFiles[genIdx] = fixed;
 const modIdx = modifiedFiles.findIndex(f => f.path === fixed.path);
 if (modIdx >= 0) modifiedFiles[modIdx] = fixed;
 }

 lastFixCount += fixResult.fixed.length;

 // Re-verify (only our files)
 buildCheck = this.verifyBuild(target, ourFilePaths);
 if (buildCheck.success) break; // all clean!

 // Track if we're making progress
 if (buildCheck.errors.length >= previousErrorCount) {
   stuckCount++;
 } else {
   stuckCount = 0;
 }
 previousErrorCount = buildCheck.errors.length;
 } else {
 stuckCount++;
 if (stuckCount >= 2 && fixAttempt < maxAttempts) {
   // Don't break immediately -- let it try the diagnostic approach
   continue;
 }
 break; // AI couldn't fix anything, stop retrying
 }
 }

 executedPlan.push({
 id: executedPlan.length + 1,
 title:`Build verification (${target})`,
 status: buildCheck.success ?'done' :'failed',
 detail: buildCheck.success
 ?`${target} builds clean after ${fixAttempt} fix attempt(s)`
 :`Fixed ${lastFixCount} file(s) in ${fixAttempt} attempt(s), ${buildCheck.errors.length} error(s) remain in our files`,
 });
 sendEvent('step_complete', { id:`build-${target}`, title:`Build verification (${target})`, status: buildCheck.success ?'done' :'failed', detail: buildCheck.success ?`${target} builds clean` :`${buildCheck.errors.length} error(s) remain` });
 if (!buildCheck.success) buildErrors.push(...buildCheck.errors);
 } else {
 executedPlan.push({
 id: executedPlan.length + 1,
 title:`Build verification (${target})`,
 status:'done',
 detail:`${target} -- our files compile clean`,
 });
 sendEvent('step_complete', { id:`build-${target}`, title:`Build verification (${target})`, status:'done', detail:`${target} -- compiles clean` });
 }
 }
 }

 // ------------------------------------------------------------------
 // STEP 3d: Test Agent — functional verification
 // ------------------------------------------------------------------
 if ((generatedFiles.length > 0 || modifiedFiles.length > 0) && buildErrors.length === 0) {
   sendEvent('progress', { message: '🧪 Running test agent...' });
   try {
     const testCtx: TestAgentContext = {
       userMessage: body.message,
       generatedFiles,
       modifiedFiles,
       callAI: this.callAI.bind(this),
       modelId,
       appId,
     };
     const testReport = await this.testAgent.runTests(testCtx, sendEvent);
     totalTokens += testReport.tokensUsed;

     // Add test results to the executed plan
     const testStatus = testReport.failures > 0 ? 'failed' as const : 'done' as const;
     executedPlan.push({
       id: executedPlan.length + 1,
       title: 'Test agent verification',
       status: testStatus,
       detail: testReport.summary,
     });
     sendEvent('step_complete', {
       id: 'test-agent',
       title: 'Test agent verification',
       status: testStatus,
       detail: testReport.summary,
     });

     // Send individual test results so frontend can display them
     sendEvent('test_results', {
       passed: testReport.passed,
       warnings: testReport.warnings,
       failures: testReport.failures,
       results: testReport.results,
       summary: testReport.summary,
     });

     // If there are failures, record them as gotchas for the doc agent
     for (const fail of testReport.results.filter(r => r.severity === 'fail')) {
       try {
         this.docAgent.addGotcha(
           `Test failure: ${fail.title} in ${fail.file || 'unknown'}`,
           fail.detail,
         );
       } catch { /* non-critical */ }
     }
   } catch (err) {
     this.logger.warn('Test agent failed: ' + err);
     sendEvent('progress', { message: '⚠️ Test agent encountered an error — skipping' });
   }
 }

 // ------------------------------------------------------------------
 // STEP 4: Build a summary response
 // ------------------------------------------------------------------

 const doneSteps = executedPlan.filter(s => s.status ==='done').length;
 const failedSteps = executedPlan.filter(s => s.status ==='failed').length;

 if (plan.intent ==='chat' && chatResponse) {
 // Pure chat -- send the AI's response
 const duration = Date.now() - start;
 const config = this.getModelConfig(modelId);
 await this.trackCost(config?.provider ||'anthropic', modelId, Math.round(totalTokens * 0.7), Math.round(totalTokens * 0.3), duration,'coder-agent');
 sendEvent('result', { success: true, response: chatResponse, searchResults: searchResults.length > 0 ? searchResults : undefined, tokensUsed: totalTokens });
 return;
 }

 // Build mode -- create a structured report
 const report: string[] = [];
 report.push(`## ${plan.summary ||'Build Complete'}\n`);
 report.push(`**${doneSteps}/${executedPlan.length} steps completed** ${failedSteps > 0 ?`(${failedSteps} failed)` :''}\n`);

 if (generatedFiles.length > 0) {
 report.push(`### New Files (${generatedFiles.length})`);
 for (const f of generatedFiles) {
 report.push(`- \`${f.path}\` -- ${f.description ||'Generated'}`);
 }
 report.push('');
 }

 if (modifiedFiles.length > 0) {
 report.push(`### Modified Files (${modifiedFiles.length})`);
 for (const f of modifiedFiles) {
 report.push(`- \`${f.path}\` -- ${f.description ||'Modified'}`);
 }
 report.push('');
 }

 if (dbChanges.length > 0) {
 report.push(`### Database Changes`);
 for (const c of dbChanges) {
 report.push(`- \`${c.table}\`: ${c.action} ${c.count} records`);
 }
 report.push('');
 }

 if (searchResults.length > 0) {
 report.push(`### Web Research`);
 for (const r of searchResults.slice(0, 3)) {
 report.push(`- [${r.title}](${r.url})`);
 }
 report.push('');
 }

 if (backendDelegationTasks.length > 0) {
 const done = backendDelegationTasks.filter(t => t.status ==='done');
 const pending = backendDelegationTasks.filter(t => t.status ==='pending');
 report.push(`### Backend Agent Delegation`);
 if (done.length > 0) {
 report.push(`**Auto-implemented (${done.length}):**`);
 for (const t of done) report.push(`- [OK] ${t.title}`);
 }
 if (pending.length > 0) {
 report.push(`**Needs manual setup (${pending.length}):**`);
 for (const t of pending) report.push(`- ... ${t.title} -- ${t.description}`);
 }
 report.push('');
 }

 report.push('\n---\n');

 for (const step of executedPlan) {
 const icon = step.status ==='done' ?'[OK]' : step.status ==='failed' ?'[X]' :'...';
 report.push(`${icon} **${step.title}** -- ${step.detail ||''}`);
 }

 if (filesWritten.length > 0) {
 report.push(`\n\n **${filesWritten.length} file(s) written to disk** -- already saved to your project.`);
 }
 if (packagesInstalled.length > 0) {
 report.push(` **Packages installed:** ${packagesInstalled.join(',')}`);
 }
 if (buildErrors.length > 0) {
 report.push(`\n[!] **${buildErrors.length} build error(s) remaining** -- may need manual attention.`);
 } else if (filesWritten.length > 0) {
 report.push(`\n[OK] **Build verified** -- all files compile without errors.`);
 }

 if (generatedFiles.length > 0 && filesWritten.length === 0) {
 report.push('\n\nTip: **Click "Apply All" to add these files to your project, or review each file individually.**');
 }

 const duration = Date.now() - start;
 const config = this.getModelConfig(modelId);
 await this.trackCost(config?.provider ||'anthropic', modelId, Math.round(totalTokens * 0.7), Math.round(totalTokens * 0.3), duration,'coder-agent');

 // Generate diffs for all modified files
 const diffs: Array<{file: string; diff: string}> = [];
 for (const mf of modifiedFiles) {
 const original = existingFiles.find(f => f.path === mf.path);
 if (original) {
 const diff = this.generateDiff(original.content, mf.content, mf.path);
 if (diff) diffs.push({ file: mf.path, diff });
 }
 }

 sendEvent('result', {
 success: true,
 response: report.join('\n'),
 plan: executedPlan,
 generatedFiles: generatedFiles.length > 0 ? generatedFiles : undefined,
 modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : undefined,
 dbChanges: dbChanges.length > 0 ? dbChanges : undefined,
 backendTasks: backendDelegationTasks.length > 0 ? backendDelegationTasks : undefined,
 searchResults: searchResults.length > 0 ? searchResults : undefined,
 filesWritten: filesWritten.length > 0 ? filesWritten : undefined,
 packagesInstalled: packagesInstalled.length > 0 ? packagesInstalled : undefined,
 buildVerified: buildErrors.length === 0 && filesWritten.length > 0,
 diffs: diffs.length > 0 ? diffs : undefined,
 snapshotHash: snapshotHash || undefined,
 tokensUsed: totalTokens,
 estimatedCost: this.estimateCostFromTokens(totalTokens, modelId),
 durationMs: Date.now() - start,
 });
 } catch (err) {
 sendEvent('error', { message:`Error: ${err instanceof Error ? err.message :'Unknown error occurred'}` });
 }
 }

 // --- Upsell Page AI Generation ----------------------------------------

 async generateUpsellPage(request: {
   appId: number;
   pageType: 'upsell' | 'checkout' | 'order-bump' | 'downsell' | 'thankyou-upsell';
   productName: string;
   productDescription: string;
   price: string;
   originalPrice?: string;
   features?: string[];
   urgency?: string;
   testimonial?: string;
   style?: 'minimal' | 'bold' | 'elegant' | 'aggressive';
   model?: string;
   existingCode?: string;
   instruction?: string;
 }): Promise<{ success: boolean; code: string; tokensUsed: number; htmlPreview?: string; error?: string }> {
   const model = request.model || 'gpt-4o';
   try {
     const appContext = this.getAppContext(request.appId);
     const designSystem = this.getDesignSystemContext();

     const pageTypeDescriptions: Record<string, string> = {
       'upsell': 'A one-click upsell offer page shown AFTER initial checkout. The customer has already purchased. Show a compelling add-on offer with a prominent "Yes, Add This!" button and a smaller "No Thanks" link. Include urgency, social proof, and a clear value proposition.',
       'checkout': 'A checkout/order page with product details, pricing breakdown, trust badges, money-back guarantee, and a payment form area. Show what they\'re getting with feature bullets and testimonials.',
       'order-bump': 'An order bump component shown ON the checkout page — a small boxed section with a checkbox to add an extra item. Uses a dashed border, slight background tint, and compelling "Add to order" copy.',
       'downsell': 'A downsell page shown when a customer declines an upsell. Offer a lower-priced or stripped-down version of the upsell. Empathetic tone — "We understand, how about this instead?" with a discounted offer.',
       'thankyou-upsell': 'A thank-you page that ALSO presents a final upsell. Start with "Thank you for your purchase!" confirmation, then below present "Wait! One more thing..." offer with a special one-time discount.',
     };

     const pageDesc = pageTypeDescriptions[request.pageType] || pageTypeDescriptions['upsell'];

     const styleGuides: Record<string, string> = {
       'minimal': 'Clean, lots of whitespace, muted colors, subtle shadows. Let the product speak for itself.',
       'bold': 'Large headings, bright CTA buttons, strong contrast, urgency badges, countdown-style elements.',
       'elegant': 'Premium feel with gradient accents, refined typography, gold/dark color accents, luxury branding.',
       'aggressive': 'High-converting sales page style: red urgency, strikethrough prices, scarcity indicators, multiple CTAs, testimonial blocks, guarantee badges.',
     };

     const styleGuide = styleGuides[request.style || 'bold'] || styleGuides['bold'];

     // If editing existing code, use refine flow
     if (request.existingCode && request.instruction) {
       const files: GeneratedFile[] = [{
         path: 'UpsellPage.tsx',
         content: request.existingCode,
         language: 'typescript',
       }];
       return this.refineFile({
         instruction: request.instruction,
         files,
         fileIndex: 0,
         model,
       }).then(result => ({
         success: result.success,
         code: result.file?.content || request.existingCode || '',
         tokensUsed: result.tokensUsed,
         error: result.error || (result.question ? `AI asks: ${result.question}` : undefined),
       }));
     }

     // Generate new upsell page
     const systemPrompt = `You are an expert conversion-optimized landing page designer specializing in upsell and checkout pages for SaaS products.

${designSystem}

${appContext}

PAGE TYPE: ${request.pageType.toUpperCase()}
${pageDesc}

STYLE: ${styleGuide}

DESIGN CONSISTENCY (CRITICAL — the upsell page must look like it belongs in the SAME app as the rest of the funnel):
- Font family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Font weights: 800 for headings, 700 for subheadings/buttons, 600 for labels, 400 for body text
- Background: #fafbfc (page), #fff (cards)
- Text colors: #1a1a2e (headings), #333 (subheadings), #555-#666 (body), #888-#999 (muted)
- Primary gradient: linear-gradient(135deg, #667eea, #764ba2) — use on primary CTAs and hero accents
- Card style: background #fff, border-radius 16px, padding 32px, box-shadow 0 2px 12px rgba(0,0,0,0.06), border 1px solid rgba(0,0,0,0.06)
- Primary button: gradient background, border-radius 10px, padding 14px 32px, font-weight 700, full-width, hover translateY(-1px) with shadow
- Secondary/decline button: transparent background, subtle text, font-size 0.82rem, no border
- Benefits grid: grid layout, 200px min-width, gap 16px, items have bg #f8f9ff, border-radius 12px, padding 20px 16px
- Benefit icons: emoji icons (⚡✨🔒🚀💎📊🎯) at 1.8rem, NOT svg/img icons
- Trust badges: inline flex, pills with bg #f0f0f0, border-radius 20px, padding 6px 14px, font-weight 600, font-size 0.72rem
- Price display: font-size 2rem, font-weight 800, color #667eea, with period text in 0.85rem #999
- Strikethrough prices: text-decoration line-through, color #999
- Checkmark lists: ✓ prefix in #27ae60 font-weight 700, item text in 0.82rem #555
- Max-width container: 720px centered with 40px 24px padding
- Hero section: text-align center, h1 at 2rem weight 800, subtitle at 1.05rem color #666
- All spacing consistent: 24px between sections, 16px between items, 12px between heading and subheading
- Use the same color palette throughout — NO random bright colors, keep it polished and cohesive

CONVERSION OPTIMIZATION RULES:
- Above-the-fold CTA — the main action button must be visible without scrolling
- Use visual hierarchy: headline → subheadline → benefits → social proof → CTA
- Price anchoring: show original price crossed out next to the offer price
- Feature bullets with checkmark prefix (✓ in green)
- Trust signals: guarantee badge, secure payment icon, testimonial quote — use the trust-badge pill style
- Urgency elements when appropriate: "Limited time", "Only X left" — use subtle urgency, not garish
- The "Yes" CTA should be 3x more prominent than any "No thanks" option
- Colors for status: green (#27ae60) for success/savings, subtle orange for urgency

THE PAGE MUST LOOK LIKE IT WAS BUILT BY THE SAME DESIGNER AS THE PRICING, REGISTER, AND CHECKOUT PAGES. Consistent fonts, colors, spacing, card styles, and button styles throughout.

STRIPE INTEGRATION:
- Include a handleCheckout function that calls: fetch(\`\${API_BASE}/api/stripe/checkout\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app_id: APP_ID, price_id: PRICE_ID, success_url: window.location.origin + '/thank-you', cancel_url: window.location.href }) })
- Include a handleDecline function for the "No Thanks" that navigates to the next step
- Use React Router's useNavigate for navigation
- Define const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

OUTPUT: Return ONLY the complete React/TypeScript component code. No markdown fences, no explanation. Export as: export function UpsellPage()`;

     const features = request.features?.length
       ? request.features.map(f => `  ✓ ${f}`).join('\n')
       : '  ✓ Premium feature included';

     const userPrompt = `Generate a ${request.pageType} page component for:

PRODUCT: ${request.productName}
DESCRIPTION: ${request.productDescription}
PRICE: ${request.price}${request.originalPrice ? ` (was ${request.originalPrice})` : ''}
FEATURES:
${features}
${request.urgency ? `URGENCY MESSAGE: ${request.urgency}` : ''}
${request.testimonial ? `TESTIMONIAL: ${request.testimonial}` : ''}

The component should be a complete, self-contained React component that looks premium and converts well. Include the Stripe checkout integration and proper state management.`;

     const result = await this.callAI(model, systemPrompt, userPrompt);
     let code = result.content.trim();

     // Strip markdown fences if present
     code = code.replace(/^```(?:tsx?|javascript|jsx)?\n?/m, '').replace(/\n?```$/m, '').trim();

     return { success: true, code, tokensUsed: result.tokensUsed, htmlPreview: await this.convertToHtmlPreview(code) };
   } catch (err) {
     return {
       success: false,
       code: '',
       tokensUsed: 0,
       error: err instanceof Error ? err.message : String(err),
     };
   }
 }

 async refineUpsellPage(request: {
   code: string;
   instruction: string;
   appId?: number;
   model?: string;
 }): Promise<{ success: boolean; code: string; tokensUsed: number; error?: string; question?: string; htmlPreview?: string }> {
   const files: GeneratedFile[] = [{
     path: 'UpsellPage.tsx',
     content: request.code,
     language: 'typescript',
   }];
   const result = await this.refineFile({
     instruction: request.instruction,
     files,
     fileIndex: 0,
     model: request.model || 'gpt-4o',
   });
   const updatedCode = result.file?.content || request.code;
   let htmlPreview: string | undefined;
   if (result.success && result.file?.content) {
     try { htmlPreview = await this.convertToHtmlPreview(updatedCode); } catch (err) { this.logger.debug("Caught: " + err); }
   }
   return {
     success: result.success,
     code: updatedCode,
     tokensUsed: result.tokensUsed,
     error: result.error,
     question: result.question,
     htmlPreview,
   };
 }

 /**
  * Convert a React/MUI component to standalone HTML with inline styles for iframe preview.
  * Uses a cheap/fast model (gpt-4o-mini) for the conversion.
  */
 private async convertToHtmlPreview(reactCode: string): Promise<string> {
   const model = 'gpt-4o-mini';
   const systemPrompt = `You convert React/MUI components into standalone HTML pages that look IDENTICAL visually.

RULES:
- Output a complete <!DOCTYPE html> document with <html>, <head>, <body>
- Use ONLY inline styles that precisely match the MUI styling from the React code
- Use Google Fonts link for Inter: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
- Set body font-family to: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Replace MUI icons with appropriate Unicode/emoji equivalents:
  • CheckCircle → ✅  • Timer → ⏱️  • ShoppingCart → 🛒  • Star → ⭐  • Security/Shield → 🔒
  • ThumbUp → 👍  • TrendingUp → 📈  • Warning → ⚠️  • CheckBox → ☑️  • ArrowForward → →
- Replicate ALL gradients, shadows, border-radius, spacing, colors exactly

DESIGN TOKENS TO ENFORCE (override any deviations in the React code):
- Body: margin 0, background #fafbfc, font-family Inter
- Headings: color #1a1a2e, font-weight 800
- Body text: color #555 or #666, line-height 1.6
- Muted text: color #888 or #999
- Cards: background #fff, border-radius 16px, padding 32px, box-shadow 0 2px 12px rgba(0,0,0,0.06), border 1px solid rgba(0,0,0,0.06)
- Primary buttons: background linear-gradient(135deg, #667eea, #764ba2), color #fff, border-radius 10px, padding 14px 32px, font-weight 700, hover translateY(-1px)
- Container: max-width 720px, margin 0 auto, padding 40px 24px
- Benefits: background #f8f9ff, border-radius 12px, padding 20px 16px
- Trust badges: background #f0f0f0, border-radius 20px, padding 6px 14px, font-weight 600
- Price: font-size 2rem, font-weight 800, color #667eea
- Checkmarks: ✓ in color #27ae60, font-weight 700

- Make buttons look clickable with hover effects (CSS :hover)
- Responsive: use max-width containers, flexbox/grid as in original
- The page must look production-ready and PREMIUM
- Do NOT include any JavaScript or React code
- Output ONLY the raw HTML. No markdown fences, no explanation, no comments.`;

   const result = await this.callAI(model, systemPrompt, `Convert this React component to a standalone HTML page:\n\n${reactCode}`);
   let html = result.content.trim();
   html = html.replace(/^```(?:html)?\n?/m, '').replace(/\n?```$/m, '').trim();
   return html;
 }

 private async trackCost(provider: string, model: string, tokensIn: number, tokensOut: number, duration: number, module: string): Promise<void> {
 const rates: Record<string, [number, number]> = {
'gpt-4o-mini': [0.15, 0.60],'gpt-4o': [2.50, 10.00],'gpt-3.5-turbo': [0.50, 1.50],
'gpt-4': [30.00, 60.00],'google/gemini-2.0-flash-001': [0.10, 0.40],
'anthropic/claude-sonnet-4': [3.00, 15.00],'claude-sonnet-4-20250514': [3.00, 15.00],
'claude-3-5-sonnet-20241022': [3.00, 15.00],'openai/gpt-4o': [2.50, 10.00],
 };
 const [inR, outR] = rates[model] || [1.00, 3.00];
 const cost = (tokensIn * inR + tokensOut * outR) / 1_000_000;
 await this.analyticsService.trackApiUsage({
 provider: provider as any, endpoint:'/chat/completions', model, tokensIn, tokensOut, cost, duration, statusCode: 200, success: true, module,
 }).catch(() => {});
 }
}
