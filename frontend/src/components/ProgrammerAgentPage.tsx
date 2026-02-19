import { useState, useEffect, useRef, useCallback, useMemo } from'react';
import { API_BASE_URL, API } from'../config/api';
import {
 Box, Typography, TextField, Button, Paper, Select, MenuItem,
 FormControl, InputLabel, Chip, CircularProgress,
 Snackbar, Alert, Tooltip, IconButton, LinearProgress,
 Dialog, DialogTitle, DialogContent, DialogActions,
 Collapse, Grid, Checkbox, Stepper, Step, StepLabel,
} from'@mui/material';
import {
 SmartToy as AgentIcon,
 Send as SendIcon,
 Code as CodeIcon,
 Save as SaveIcon,
 ContentCopy as CopyIcon,
 ExpandMore as ExpandIcon,
 ExpandLess as CollapseIcon,
 Psychology as OrchestratorIcon,
 Speed as SpeedIcon,
 Token as TokenIcon,
 CheckCircle as DoneIcon,
 Error as ErrorIcon,
 HourglassEmpty as PendingIcon,
 PlayArrow as RunningIcon,
 AutoFixHigh as RefineIcon,
 Description as FileIcon,
 Visibility as PreviewIcon,
 Dashboard as DashboardIcon,
 Person as ProfileIcon,
 Settings as SettingsIcon,
 Add as AddIcon,
 Delete as DeleteIcon,
 Search as SearchIcon,
 Key as KeyIcon,
 CheckCircleOutline as ConfiguredIcon,
 WarningAmber as MissingIcon,
 TravelExplore as BraveIcon,
 Storage as ApifyIcon,
 ViewModule as PagesIcon,
 Build as BuildIcon,
 Dns as DbIcon,
 Api as ApiIcon,
 Lock as SecurityIcon,
 Link as IntegrationIcon,
 BarChart as DataIcon,
 Bolt as AutoIcon,
 Handyman as ManualIcon,
 RocketLaunch as FinalizeIcon,
 BugReport as BugIcon,
 VerifiedUser as QaPassIcon,
 MenuBook as DocsIcon,
 Warning as WarningIcon,
 Info as InfoIcon,
 Replay as RetryIcon,
 Refresh as RefreshIcon,
 AttachMoney as CostIcon,
 VerticalSplit as SplitIcon,
 Web as FullSiteIcon,
 FlashOn as QuickIcon,
 TravelExplore as ScraperIcon,
 AccountTree as FeatureIcon,
 TableView as CrudIcon,
 ImportExport as IntegrationQuickIcon,
 Palette as UIIcon,
} from'@mui/icons-material';

/* "€"€"€ Types "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

interface GeneratedFile {
 path: string;
 content: string;
 language: string;
 description: string;
}

interface PlanStep {
 id: number;
 title: string;
 description: string;
 agent:'orchestrator' |'sub-agent';
 status:'pending' |'running' |'complete' |'failed';
 model?: string;
}

interface MembersPage {
 id: string;
 name: string;
 description: string;
 type:'dashboard' |'profile' |'settings' |'admin' |'custom';
 required: boolean;
 enabled?: boolean;
}

interface ModelConfig {
 id: string;
 name: string;
 provider:'anthropic' |'openai' |'openrouter';
 tier:'orchestrator' |'sub-agent' |'both';
 costPer1kTokens: number;
}

interface ModelsResponse {
 success: boolean;
 models: ModelConfig[];
 configured: { anthropic: boolean; openai: boolean; brave: boolean; apify: boolean };
 defaults: { orchestrator: string; subAgent: string };
}

interface StatsData {
 sessions: number;
 totalTokens: number;
 orchestratorTokens: number;
 subAgentTokens: number;
 filesGenerated: number;
 history: { date: string; orchestratorModel: string; subAgentModel: string; orchestratorTokens: number; subAgentTokens: number }[];
}

interface AppInfo {
 id: number;
 name: string;
 slug: string;
 primary_color: string;
 description?: string;
 active: boolean;
}

interface ApiKeyStatus {
 key: string;
 reason: string;
 configured: boolean;
}

interface BackendTask {
 id: string;
 category:'database' |'api' |'integration' |'security' |'data' |'frontend_wiring';
 title: string;
 description: string;
 status:'pending' |'done' |'in-progress';
 priority:'high' |'medium' |'low';
 implementation?: {
 type:'db_seed' |'api_route' |'config' |'schema';
 payload: Record<string, any>;
 };
}

interface QaIssue {
 id: string;
 file: string;
 line?: number;
 severity:'error' |'warning' |'info';
 category:'import' |'type' |'logic' |'style' |'naming' |'api' |'missing';
 title: string;
 description: string;
 autoFix?: string;
}

type Phase ='setup' |'planning' |'pages' |'generating' |'results' |'finalizing' |'finalized' |'qa-running' |'qa-results' |'documenting' |'documented';

/* "€"€"€ Quick Key Templates "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

interface QuickKeyTemplate {
  id: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  dialogTitle: string;
  dialogPlaceholder: string;
  dialogHelperText: string;
  extraFields?: { key: string; label: string; placeholder: string; multiline?: boolean }[];
  buildPrompt: (input: string, extras: Record<string, string>) => string;
}

const QUICK_KEY_TEMPLATES: QuickKeyTemplate[] = [
  {
    id: 'apify-scraper',
    label: 'Apify Scraper',
    description: 'Build a full Apify scraper integration with API & results page',
    icon: 'scraper',
    color: '#00b894',
    dialogTitle: 'Which Apify scraper do you want?',
    dialogPlaceholder: 'e.g. Instagram Profile Scraper, Google Maps Scraper...',
    dialogHelperText: 'Enter the exact Apify actor name or describe what you want to scrape',
    extraFields: [
      { key: 'resultsFields', label: 'Key data fields', placeholder: 'e.g. name, email, followers, website' },
    ],
    buildPrompt: (input, extras) => {
      const fields = extras.resultsFields || 'all available fields';
      return `## APIFY SCRAPER INTEGRATION: ${input}\n\nPlease build a COMPLETE Apify scraper integration for "${input}". Follow this EXACT order:\n\n### Step 1 — Backend API (MUST DO FIRST)\nCreate a full NestJS module at backend/src/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/\n- Controller with POST /api/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/run (accepts scraper input params)\n- Controller with GET /api/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/results (returns stored results)\n- Controller with GET /api/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/status (returns run status)\n- Service that calls Apify API: const client = new ApifyClient({ token: process.env.APIFY_TOKEN || apiKey }); const run = await client.actor("ACTOR_ID").call(inputParams); const { items } = await client.dataset(run.defaultDatasetId).listItems();\n- Store results in db.json under a new collection\n- Register the module in app.module.ts\n\n### Step 2 — Update API Config\nAdd the new endpoints to frontend/src/config/api.ts so the frontend can reach them.\n\n### Step 3 — Database Seeding\nAdd 5-10 realistic sample records to the db.json collection so the results page looks populated immediately.\n\n### Step 4 — Results Page\nCreate a beautiful results page at frontend/src/components/ with:\n- MUI DataGrid or styled table showing: ${fields}\n- Search/filter bar\n- Export to CSV button\n- Run new scrape button that opens a dialog for input parameters\n- Status indicator showing if a scrape is running\n- Auto-refresh results\n- Responsive design with proper loading states\n\n### Step 5 — Router & Navigation\nAdd the page to the router and sidebar/navigation so users can find it.\n\nIMPORTANT: Each step depends on the previous one. Do NOT skip the backend.`;
    },
  },
  {
    id: 'crud-feature',
    label: 'CRUD Feature',
    description: 'Create, read, update & delete with backend API + management page',
    icon: 'crud',
    color: '#6c5ce7',
    dialogTitle: 'What resource do you want to manage?',
    dialogPlaceholder: 'e.g. Products, Contacts, Projects, Invoices...',
    dialogHelperText: 'Name the entity this CRUD feature will manage',
    extraFields: [
      { key: 'fields', label: 'Fields / columns', placeholder: 'e.g. name, email, status, created_at' },
    ],
    buildPrompt: (input, extras) => {
      const fields = extras.fields || 'id, name, description, status, createdAt, updatedAt';
      return `## FULL CRUD FEATURE: ${input}\n\nBuild a COMPLETE CRUD management feature for "${input}". Follow this EXACT order:\n\n### Step 1 — Backend API\nCreate a NestJS module at backend/src/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/\n- Full REST endpoints: GET (list + single), POST (create), PUT (update), DELETE\n- Validation and error handling\n- Fields: ${fields}\n- Store in db.json\n- Register in app.module.ts\n\n### Step 2 — Update API Config\nAdd endpoints to frontend/src/config/api.ts\n\n### Step 3 — Seed Data\nAdd 8-10 realistic sample records to db.json.\n\n### Step 4 — Management Page\nCreate a management page with:\n- Data table with sorting, search, pagination\n- Create/Edit dialog with form validation\n- Delete confirmation\n- Status badges and proper formatting\n- Toast notifications for actions\n- Loading and empty states\n\n### Step 5 — Router & Navigation\nAdd to router and sidebar navigation.\n\nIMPORTANT: Backend first, then frontend. Do NOT skip steps.`;
    },
  },
  {
    id: 'api-integration',
    label: 'API Integration',
    description: 'Integrate an external API with backend proxy & frontend UI',
    icon: 'integration',
    color: '#e17055',
    dialogTitle: 'Which external API do you want to integrate?',
    dialogPlaceholder: 'e.g. Stripe Payments, OpenAI Chat, SendGrid Email...',
    dialogHelperText: 'Describe the API or service to integrate',
    buildPrompt: (input) => {
      return `## API INTEGRATION: ${input}\n\nBuild a COMPLETE integration with "${input}". Follow this EXACT order:\n\n### Step 1 — Backend Proxy API\nCreate a NestJS module at backend/src/${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/\n- Proxy endpoints that call the external ${input} API\n- Secure API key storage (use environment variables / settings)\n- Response transformation to normalize the data\n- Error handling with meaningful messages\n- Rate limiting awareness\n- Register in app.module.ts\n\n### Step 2 — Update API Config\nAdd endpoints to frontend/src/config/api.ts\n\n### Step 3 — Frontend Interface\nCreate a UI page with:\n- Configuration section for API keys/settings\n- Interactive interface to use the integration\n- Results display\n- Error states and loading indicators\n- Usage/status dashboard\n\n### Step 4 — Router & Navigation\nAdd to router and sidebar.\n\nIMPORTANT: Backend proxy first — never expose API keys to the frontend.`;
    },
  },
  {
    id: 'new-feature',
    label: 'Full Feature',
    description: 'Build a complete end-to-end feature with backend + frontend',
    icon: 'feature',
    color: '#0984e3',
    dialogTitle: 'Describe the feature you want to build',
    dialogPlaceholder: 'e.g. A blog system with posts, categories, and comments...',
    dialogHelperText: 'Be specific about what the feature should do',
    buildPrompt: (input) => {
      return `## NEW FEATURE: ${input}\n\nBuild this feature end-to-end: "${input}". Follow this EXACT order:\n\n### Step 1 — Backend API\nCreate a NestJS module with all necessary endpoints.\n- Full REST API with proper validation\n- Database storage in db.json\n- Register in app.module.ts\n\n### Step 2 — Update API Config\nAdd all new endpoints to frontend/src/config/api.ts\n\n### Step 3 — Seed Database\nAdd realistic sample data to db.json so the feature works immediately.\n\n### Step 4 — Frontend Pages\nCreate beautiful, responsive React pages with MUI components:\n- Proper loading, empty, and error states\n- Forms with validation\n- Data display with sorting/filtering where appropriate\n- Toast notifications for user actions\n\n### Step 5 — Router & Navigation\nAdd all pages to the router and navigation.\n\nIMPORTANT: Build backend first, then frontend. Each step must complete before the next.`;
    },
  },
  {
    id: 'ui-page',
    label: 'UI Page Only',
    description: 'Create a beautiful frontend page with mock data',
    icon: 'ui',
    color: '#fd79a8',
    dialogTitle: 'What page do you want to create?',
    dialogPlaceholder: 'e.g. Analytics Dashboard, User Settings, Landing Page...',
    dialogHelperText: 'This creates a frontend-only page with mock data',
    buildPrompt: (input) => {
      return `## UI PAGE: ${input}\n\nCreate a beautiful frontend page for: "${input}"\n\n### Requirements\n- Create at frontend/src/components/\n- Use MUI components with a polished, professional design\n- Include realistic mock/sample data directly in the component\n- Responsive layout that works on all screen sizes\n- Proper loading skeleton and empty states\n- Add to the router and navigation\n\nMake it look production-ready with attention to spacing, typography, and visual hierarchy.`;
    },
  },
];

const QUICK_KEY_ICON_MAP: Record<string, typeof CodeIcon> = {
  scraper: ScraperIcon,
  crud: CrudIcon,
  integration: IntegrationQuickIcon,
  feature: FeatureIcon,
  ui: UIIcon,
};

/* "€"€"€ Simple syntax highlighter "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

function SyntaxHighlight({ code, language }: { code: string; language: string }) {
 const highlighted = useMemo(() => {
 if (!code) return'';
 const isTsx = /tsx?|typescript|javascript|jsx/.test(language);
 if (!isTsx) return code.replace(/</g,'&lt;').replace(/>/g,'&gt;');
 return code
 .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
 // Comments
 .replace(/(\/{2}.*$)/gm,'<span style="color:#6a9955">$1</span>')
 // Strings
 .replace(/('[^']*')/g,'<span style="color:#ce9178">$1</span>')
 .replace(/("[^"]*")/g,'<span style="color:#ce9178">$1</span>')
 .replace(/(`[^`]*`)/gs,'<span style="color:#ce9178">$1</span>')
 // Keywords
 .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|default|new|typeof|instanceof|async|await|try|catch|throw|class|extends|interface|type|enum)\b/g,'<span style="color:#c586c0">$1</span>')
 // JSX tags
 .replace(/(&lt;\/?)([A-Z]\w*)/g,'$1<span style="color:#4ec9b0">$2</span>')
 // Types after colon
 .replace(/(:\s*)(string|number|boolean|any|void|null|undefined|never|unknown)/g,'$1<span style="color:#4ec9b0">$2</span>')
 // Numbers
 .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#b5cea8">$1</span>')
 // true/false/null
 .replace(/\b(true|false|null|undefined)\b/g,'<span style="color:#569cd6">$1</span>');
 }, [code, language]);

 return (
 <pre
 style={{
 margin: 0,
 fontFamily:'"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
 fontSize:'0.82rem', lineHeight: 1.6, color:'#cdd6f4',
 whiteSpace:'pre-wrap', wordBreak:'break-word',
 }}
 dangerouslySetInnerHTML={{ __html: highlighted }}
 />
 );
}

/* "€"€"€ Phase stepper config "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

const PHASE_STEPS = [
 { key:'setup', label:'Setup' },
 { key:'planning', label:'Plan' },
 { key:'pages', label:'Pages' },
 { key:'generating', label:'Generate' },
 { key:'results', label:'Review' },
 { key:'finalized', label:'Finalize' },
 { key:'qa-results', label:'QA' },
 { key:'documented', label:'Docs' },
] as const;

function getStepIndex(phase: Phase): number {
 const map: Record<Phase, number> = {
 setup: 0, planning: 1, pages: 2, generating: 3, results: 4,
 finalizing: 5, finalized: 5,'qa-running': 6,'qa-results': 6,
 documenting: 7, documented: 7,
 };
 return map[phase] ?? 0;
}

/* "€"€"€ Page type icon helper "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

function PageTypeIcon({ type }: { type: string }) {
 switch (type) {
 case'dashboard': return <DashboardIcon sx={{ fontSize: 18 }} />;
 case'profile': return <ProfileIcon sx={{ fontSize: 18 }} />;
 case'settings': return <SettingsIcon sx={{ fontSize: 18 }} />;
 default: return <PagesIcon sx={{ fontSize: 18 }} />;
 }
}

/* "€"€"€ Main component "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

export function ProgrammerAgentPage() {
 // Phase state
 const [phase, setPhase] = useState<Phase>('setup');

 // Setup state
 const [apps, setApps] = useState<AppInfo[]>([]);
 const [selectedAppId, setSelectedAppId] = useState<number |''>('');
 const [prompt, setPrompt] = useState('');
 const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);

 // Model state
 const [models, setModels] = useState<ModelConfig[]>([]);
 const [orchestratorModel, setOrchestratorModel] = useState('');
 const [subAgentModel, setSubAgentModel] = useState('');
 const [configured, setConfigured] = useState({ anthropic: false, openai: false, brave: false, apify: false });

 // Planning state
 const [pages, setPages] = useState<MembersPage[]>([]);
 const [planLoading, setPlanLoading] = useState(false);
 const [searchResults, setSearchResults] = useState<{ query: string; results: { title: string; url: string; description: string }[] }[]>([]);

 // Generation state
 const [generating, setGenerating] = useState(false);
 const [plan, setPlan] = useState<PlanStep[]>([]);
 const [files, setFiles] = useState<GeneratedFile[]>([]);
 const [summary, setSummary] = useState('');
 const [tokensUsed, setTokensUsed] = useState<{ orchestrator: number; subAgent: number; total: number } | null>(null);
 const [activeFileTab, setActiveFileTab] = useState(0);
 const [showPreview, setShowPreview] = useState(true);
 const [splitView, setSplitView] = useState(false);
  const [fullSiteLoading, setFullSiteLoading] = useState(false);
  const fullSiteSessionRef = useRef<string | null>(null);

 // Chat panel state (same as Pages tab)
 const [chatPanelOpen, setChatPanelOpen] = useState(true);
 const [chatMode, setChatMode] = useState<'design' |'backend' |'coder'>('design');
 const [designMessages, setDesignMessages] = useState<{ id: string; role:'user' |'assistant'; content: string }[]>([]);
 const [backendMessages, setBackendMessages] = useState<{ id: string; role:'user' |'assistant'; content: string }[]>([]);
 const [coderMessages, setCoderMessages] = useState<{ id: string; role:'user' |'assistant'; content: string }[]>([]);
 // Active messages getter/setter based on current tab
 const chatMessages = chatMode ==='design' ? designMessages : chatMode ==='backend' ? backendMessages : coderMessages;
 const setChatMessages = chatMode ==='design' ? setDesignMessages : chatMode ==='backend' ? setBackendMessages : setCoderMessages;
 const [chatInput, setChatInput] = useState('');
 const [chatLoading, setChatLoading] = useState(false);
 const [coderHistory, setCoderHistory] = useState<{ role:'user' |'assistant'; content: string }[]>([]);
 const [coderPendingFiles, setCoderPendingFiles] = useState<{ generated: any[]; modified: any[] }>({ generated: [], modified: [] });

 // Edit existing pages mode
 const [editMode, setEditMode] = useState(false);
 const [loadingFiles, setLoadingFiles] = useState(false);

 // Refine state
 const [refineDialog, setRefineDialog] = useState(false);
 const [refineInstruction, setRefineInstruction] = useState('');
 const [refining, setRefining] = useState(false);
 const [saving, setSaving] = useState(false);

 // Stats
 const [showStats, setShowStats] = useState(false);
 const [stats, setStats] = useState<StatsData | null>(null);

 // UI
 const [snack, setSnack] = useState<{ open: boolean; msg: string; severity:'success' |'error' |'info' }>({ open: false, msg:'', severity:'info' });
 const [showPlan, setShowPlan] = useState(true);
 const [addPageDialog, setAddPageDialog] = useState(false);
 const [newPageName, setNewPageName] = useState('');
 const [newPageDesc, setNewPageDesc] = useState('');

 // Finalize state
 const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
 const [, setFinalizeLoading] = useState(false);
 const [finalizeSummary, setFinalizeSummary] = useState('');
 const [implementingTask, setImplementingTask] = useState<string | null>(null);
 const [implementingAll, setImplementingAll] = useState(false);

 // QA & Docs state
 const [qaIssues, setQaIssues] = useState<QaIssue[]>([]);
 const [qaSummary, setQaSummary] = useState('');
 const [, setQaLoading] = useState(false);
 const [fixingIssue, setFixingIssue] = useState<string | null>(null);
 const [fixingAll, setFixingAll] = useState(false);
 const [docsFiles, setDocsFiles] = useState<GeneratedFile[]>([]);
 const [, setDocsLoading] = useState(false);
 const [activeDocTab, setActiveDocTab] = useState(0);

 // Cost estimation
 const [costEstimate, setCostEstimate] = useState<{ estimatedTokens: number; estimatedCost: number; breakdown: { role: string; model: string; tokens: number; cost: number }[] } | null>(null);

 // Refinement history
 const [refineHistory, setRefineHistory] = useState<{ instruction: string; fileIndex: number; timestamp: string }[]>([]);

 // Retry state
 const [retryingSteps, setRetryingSteps] = useState<string[]>([]);

  // Coder Agent enhanced state
  const [snapshotHash, setSnapshotHash] = useState<string | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [fileDiffs, setFileDiffs] = useState<{ file: string; diff: string }[]>([]);
  const [showDiffs, setShowDiffs] = useState(false);
  const [clarifyQuestion, setClarifyQuestion] = useState<string | null>(null);

  // Test results state
  const [testResults, setTestResults] = useState<{
    passed: number; warnings: number; failures: number;
    results: Array<{ id: string; category: string; severity: 'pass' | 'warn' | 'fail'; title: string; detail: string; file?: string; line?: number }>;
    summary: string;
  } | null>(null);
  const [showTestResults, setShowTestResults] = useState(false);

 const promptRef = useRef<HTMLTextAreaElement>(null);
 const coderChatEndRef = useRef<HTMLDivElement>(null);
 const coderAbortRef = useRef<AbortController | null>(null);
 const [quickKeyDialog, setQuickKeyDialog] = useState<QuickKeyTemplate | null>(null);
 const [quickKeyInput, setQuickKeyInput] = useState('');
 const [quickKeyExtras, setQuickKeyExtras] = useState<Record<string, string>>({});

 // --- Load existing members files for editing -------------------------
 const loadMembersFiles = async () => {
 if (!selectedAppId) {
 setSnack({ open: true, msg:'Please select an app first to load its members pages.', severity:'warning' });
 return;
 }
 setLoadingFiles(true);
 try {
 // Stop any existing preview session so it starts fresh
 if (previewSessionRef.current) {
 fetch(`${API_BASE_URL}/api/preview/stop`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ sessionId: previewSessionRef.current }),
 }).catch(() => {});
 previewSessionRef.current = null;
 }
 previewStartingRef.current = false;
 setPreviewPort(null);
 setShowPreview(true);

 const res = await fetch(`${API.programmerAgent}/members-files?appId=${selectedAppId}`);
 const data = await res.json();
 if (data.success && data.files.length > 0) {
 const appName = apps.find(a => a.id === selectedAppId)?.name ||'App';
 setFiles(data.files);
 setActiveFileTab(0);
 setPlan([]);
 setSummary('');
 setEditMode(true);
 setPhase('results');
 setChatPanelOpen(true);
 setChatMode('design');
 setDesignMessages([]);
 setBackendMessages([]);
 setCoderMessages([]);
 setCoderHistory([]);
 setSnack({ open: true, msg:`Loaded ${data.files.length} pages for "${appName}"`, severity:'success' });
 } else {
 setSnack({ open: true, msg:'No members area files found for this app. Generate them first using the builder.', severity:'info' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Failed to load files', severity:'error' });
 } finally {
 setLoadingFiles(false);
 }
 };

 // Auto-scroll coder chat when messages change
 useEffect(() => {
 if (chatMode ==='coder' && coderChatEndRef.current) {
 coderChatEndRef.current.scrollIntoView({ behavior:'smooth' });
 }
 }, [coderMessages, chatMode]);

 const selectedApp = apps.find(a => a.id === selectedAppId) || null;
 const primaryColor = selectedApp?.primary_color ||'#667eea';

 // Load on mount
 useEffect(() => {
 loadModels();
 loadStats();
 loadApps();
 loadApiKeys();
 }, []);

 const loadApps = async () => {
 try {
 const res = await fetch(API.apps);
 const json = await res.json();
 const appList = Array.isArray(json) ? json : json.data || json.apps || [];
 setApps(appList.filter((a: AppInfo) => a.active));
 } catch { /* ignore */ }
 };

 const loadModels = async () => {
 try {
 const res = await fetch(`${API.programmerAgent}/models`);
 const data: ModelsResponse = await res.json();
 if (data.success) {
 setModels(data.models);
 setConfigured(data.configured);
 setOrchestratorModel(data.defaults.orchestrator);
 setSubAgentModel(data.defaults.subAgent);
 }
 } catch { /* ignore */ }
 };

 const loadStats = async () => {
 try {
 const res = await fetch(`${API.programmerAgent}/stats`);
 const data = await res.json();
 if (data.success) setStats(data.data);
 } catch { /* ignore */ }
 };

 const loadApiKeys = async () => {
 try {
 const res = await fetch(`${API.programmerAgent}/api-keys`);
 const data = await res.json();
 if (data.success) setApiKeys(data.keys);
 } catch { /* ignore */ }
 };

 const orchestratorModels = models.filter(m => m.tier ==='orchestrator' || m.tier ==='both');
 const subAgentModels = models.filter(m => m.tier ==='sub-agent' || m.tier ==='both');
 const noKeysConfigured = !configured.anthropic && !configured.openai;

 // Fetch cost estimate when pages change
 useEffect(() => {
 if (pages.length === 0 || !orchestratorModel || !subAgentModel) { setCostEstimate(null); return; }
 const enabled = pages.filter(p => p.enabled !== false);
 if (enabled.length === 0) { setCostEstimate(null); return; }
 const timer = setTimeout(async () => {
 try {
 const res = await fetch(`${API.programmerAgent}/estimate-cost`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ pages: enabled.map(p => ({ id: p.id, type: p.type })), orchestratorModel, subAgentModel }),
 });
 const data = await res.json();
 setCostEstimate(data);
 } catch { setCostEstimate(null); }
 }, 300);
 return () => clearTimeout(timer);
 }, [pages, orchestratorModel, subAgentModel]);

 const activeStepIndex = getStepIndex(phase);
 const failedSteps = Array.isArray(plan) ? plan.filter((s: any) => s.status ==='failed') : [];

 /* "€"€"€ Plan Members Area "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handlePlan = async () => {
 if (!prompt.trim() || !selectedAppId) return;
 setPlanLoading(true);
 setPhase('planning');

 try {
 const res = await fetch(`${API.programmerAgent}/plan-members`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 prompt: prompt.trim(),
 appId: selectedAppId,
 orchestratorModel: orchestratorModel || undefined,
 }),
 });

 const data = await res.json();
 if (data.success) {
 // Filter out blocked page types (support pages were removed from the product)
 const BLOCKED_PAGE_IDS = new Set(['support','support-ticket']);
 const filteredPages = (data.pages as MembersPage[]).filter(
 (p) => !BLOCKED_PAGE_IDS.has(p.id) && !BLOCKED_PAGE_IDS.has(p.type)
 );
 setPages(filteredPages.map((p: MembersPage) => ({ ...p, enabled: true })));
 setApiKeys(data.apiKeysNeeded || []);
 setSearchResults(data.searchResults || []);
 setPhase('pages');
 setSnack({ open: true, msg:`AI suggested ${filteredPages.length} pages for the members area`, severity:'success' });
 } else {
 setSnack({ open: true, msg: data.error ||'Planning failed', severity:'error' });
 setPhase('setup');
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 setPhase('setup');
 } finally {
 setPlanLoading(false);
 }
 };

 /* "€"€"€ Generate Members Area "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleGenerate = useCallback(async () => {
 if (generating) return;
 const enabledPages = pages.filter(p => p.enabled !== false);
 if (enabledPages.length === 0) {
 setSnack({ open: true, msg:'Select at least one page', severity:'error' });
 return;
 }

 setGenerating(true);
  setTestResults(null);
  setShowTestResults(false);
 setPhase('generating');
 setFiles([]);
 setPlan([]);
 setSummary('');
 setTokensUsed(null);
 setActiveFileTab(0);

 try {
 const res = await fetch(`${API.programmerAgent}/generate`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 prompt: prompt.trim(),
 targetType:'members-area',
 appId: selectedAppId || undefined,
 orchestratorModel: orchestratorModel || undefined,
 subAgentModel: subAgentModel || undefined,
 pages: enabledPages,
 }),
 });

 const data = await res.json();

 if (data.success) {
 setPlan(data.plan || []);
 setFiles(data.files || []);
 setSummary(data.summary ||'');
 setTokensUsed(data.tokensUsed || null);
 setSearchResults(data.searchResults || []);
 setPhase('results');
 setSnack({ open: true, msg:`Generated ${data.files?.length || 0} files - ${(data.tokensUsed?.total || 0).toLocaleString()} tokens`, severity:'success' });
 loadStats();
 } else {
 setSnack({ open: true, msg: data.error ||'Generation failed', severity:'error' });
 setPhase('pages');
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 setPhase('pages');
 } finally {
 setGenerating(false);
 }
 }, [prompt, selectedAppId, orchestratorModel, subAgentModel, pages, generating]);

 /* "€"€"€ Refine "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleRefine = async () => {
 if (!refineInstruction.trim() || refining) return;
 setRefining(true);
 try {
 const res = await fetch(`${API.programmerAgent}/refine`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 instruction: refineInstruction.trim(),
 files,
 fileIndex: activeFileTab,
 model: orchestratorModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success && data.question) {
 // AI is asking a clarifying question instead of making changes
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role: 'assistant',
 content: `\u2753 ${data.question}`,
 }]);
 } else if (data.success && data.file) {
 const updated = [...files];
 updated[activeFileTab] = data.file;
 setFiles(updated);
 setRefineHistory(prev => [...prev, { instruction: refineInstruction.trim(), fileIndex: activeFileTab, timestamp: new Date().toISOString() }]);
 setSnack({ open: true, msg:'File refined successfully', severity:'success' });
 setRefineDialog(false);
 setRefineInstruction('');
 } else {
 setSnack({ open: true, msg: data.error ||'Refine failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setRefining(false);
 }
 };

 /* "€"€"€ Chat Panel: Design & Backend (same as Pages tab) "€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleChatSend = async (directMessage?: string) => {
 const msgText = directMessage || chatInput;
 if (!msgText.trim()) return;

 const userMsg = { id: Date.now().toString(), role:'user' as const, content: msgText };
 setChatMessages(prev => [...prev, userMsg]);
 setChatInput('');
 setChatLoading(true);

 try {
 if (chatMode ==='design') {
 // Design mode: refine the active file via the refine endpoint
 if (!files.length) {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:'No files loaded. Please load or generate pages first before using the design chat.',
 }]);
 setChatLoading(false);
 return;
 }
 const res = await fetch(`${API.programmerAgent}/refine`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 instruction: msgText.trim(),
 files,
 fileIndex: activeFileTab,
 model: orchestratorModel || undefined,
 }),
 });
 if (!res.ok) {
 const errText = await res.text().catch(() => `Server error (${res.status})`);
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`Error: ${errText}`,
 }]);
 setChatLoading(false);
 return;
 }
 const data = await res.json();
 if (data.success && data.question) {
 // AI is asking a clarifying question
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role: 'assistant',
 content: `\u2753 ${data.question}`,
 }]);
 } else if (data.success && data.file) {
 const updated = [...files];
 updated[activeFileTab] = data.file;
 setFiles(updated);
 setRefineHistory(prev => [...prev, { instruction: msgText.trim(), fileIndex: activeFileTab, timestamp: new Date().toISOString() }]);
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`\u2705 Updated ${files[activeFileTab]?.path.split('/').pop()}. The preview has been refreshed with your changes.`,
 }]);
 } else {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`\u26a0\ufe0f ${data.error ||'Could not apply the change. Try rephrasing your request.'}`,
 }]);
 }
 } else if (chatMode ==='backend') {
 // Backend mode: analyze or implement backend tasks for the ACTIVE page
 const lc = msgText.toLowerCase();
 const isAnalyze = !backendTasks.length || lc.includes('analyze') || lc.includes('scan') || lc.includes('what') || lc.includes('check');
 const isImplement = lc.includes('implement') || lc.includes('fix') || lc.includes('run') || lc.includes('do it') || lc.includes('execute') || lc.includes('seed');

 if (isAnalyze && !isImplement) {
 // Analyze backend tasks scoped to the currently active page only
 const activeFile = files[activeFileTab];
 const scopedFiles = activeFile ? [activeFile] : files;
 const res = await fetch(`${API.programmerAgent}/finalize`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files: scopedFiles,
 appId: selectedAppId || undefined,
 model: orchestratorModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setBackendTasks(data.tasks || []);
 const pageName = activeFile?.path.split('/').pop() ||'current page';
 const taskList = (data.tasks || []).map((t: any) =>`${t.status ==='done' ?'\u2705' : t.implementation ?'\u26a1' :'\u23f3'} ${t.title} (${t.category} / ${t.priority})`).join('\n');
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`Found ${data.tasks?.length || 0} backend tasks for **${pageName}**:\n\n${taskList}\n\nSay "implement all" to auto-implement tasks marked \u26a1, or click individual tasks.`,
 }]);
 } else {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`\u26a0\ufe0f ${data.error ||'Could not analyze backend tasks.'}`,
 }]);
 }
 } else if (isImplement) {
 if (!backendTasks.length) {
 // No tasks analyzed yet -- analyze first for active page, then implement
 const activeFile = files[activeFileTab];
 const scopedFiles = activeFile ? [activeFile] : files;
 const analyzeRes = await fetch(`${API.programmerAgent}/finalize`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files: scopedFiles,
 appId: selectedAppId || undefined,
 model: orchestratorModel || undefined,
 }),
 });
 const analyzeData = await analyzeRes.json();
 if (analyzeData.success && analyzeData.tasks?.length) {
 setBackendTasks(analyzeData.tasks);
 // Now implement them
 const implRes = await fetch(`${API.programmerAgent}/implement-all`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ tasks: analyzeData.tasks, appId: selectedAppId || undefined }),
 });
 const implData = await implRes.json();
 if (implData.success) {
 setBackendTasks(implData.tasks || analyzeData.tasks);
 const successCount = (implData.results || []).filter((r: any) => r.success).length;
 const failCount = (implData.results || []).filter((r: any) => !r.success).length;
 const messages = (implData.results || []).map((r: any) =>`${r.success ?'\u2705' :'\u274c'} ${r.message}`).join('\n');
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`\u2705 Implemented ${successCount} task(s)${failCount > 0 ?`, ${failCount} failed` :''}.\n\n${messages}`,
 }]);
 }
 } else {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:'\u2705 No backend tasks needed for this page.',
 }]);
 }
 } else {
 // Implement existing analyzed tasks
 const res = await fetch(`${API.programmerAgent}/implement-all`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ tasks: backendTasks, appId: selectedAppId || undefined }),
 });
 const data = await res.json();
 if (data.success) {
 setBackendTasks(data.tasks || backendTasks);
 const successCount = (data.results || []).filter((r: any) => r.success).length;
 const failCount = (data.results || []).filter((r: any) => !r.success).length;
 const messages = (data.results || []).map((r: any) =>`${r.success ?'\u2705' :'\u274c'} ${r.message}`).join('\n');
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`\u2705 Implemented ${successCount} task(s)${failCount > 0 ?`, ${failCount} failed` :''}.\n\n${messages}`,
 }]);
 }
 }
 } else {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:'Try asking:\n\u2022 "What backend tasks does this page need?"\n\u2022 "Fix backend tasks" or "Implement all"\n\u2022 Or click individual tasks in the task list above.',
 }]);
 }
 } else if (chatMode ==='coder') {
 // Coder Agent: autonomous builder with SSE streaming for live progress
 const activeFile = files[activeFileTab] || null;
 // Create AbortController for cancel support
 const abortCtrl = new AbortController();
 coderAbortRef.current = abortCtrl;

 const res = await fetch(`${API.programmerAgent}/coder-chat`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 signal: abortCtrl.signal,
 body: JSON.stringify({
 message: msgText.trim(),
 files,
 activeFile: activeFile ? { path: activeFile.path, description: activeFile.description } : undefined,
 conversationHistory: coderHistory,
 appId: selectedAppId || undefined,
 model: orchestratorModel || undefined,
 }),
 });

 if (!res.ok) {
 throw new Error(`Server error (${res.status}). Make sure the backend is running.`);
 }

 // Process SSE stream - show live progress as the agent works
 const reader = res.body?.getReader();
 const decoder = new TextDecoder();
 let sseBuffer ='';

 if (!reader) throw new Error('No response stream');

 // Tracking ID for updating the "working" message in-place
 const workingMsgId =`working-${Date.now()}`;
 let workingLines: string[] = [];

 const updateWorkingMessage = (lines: string[]) => {
 workingLines = lines;
 setCoderMessages(prev => {
 const existing = prev.findIndex(m => m.id === workingMsgId);
 const msg = { id: workingMsgId, role:'assistant' as const, content: lines.join('\n') };
 if (existing >= 0) {
 const updated = [...prev];
 updated[existing] = msg;
 return updated;
 }
 return [...prev, msg];
 });
 };

 const appendWorkingLine = (line: string) => {
 updateWorkingMessage([...workingLines, line]);
 };

 let finalData: any = null;

 // Inactivity timeout: abort if no events received for 90s
 let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
 const resetInactivityTimer = () => {
 if (inactivityTimer) clearTimeout(inactivityTimer);
 inactivityTimer = setTimeout(() => {
 abortCtrl.abort();
 appendWorkingLine('\nConnection timed out (no response for 90s). Try again.');
 }, 90_000);
 };
 resetInactivityTimer();

 // Read SSE events
 let reading = true;
 while (reading) {
 const { value, done } = await reader.read();
 if (done) break;
 resetInactivityTimer();

 sseBuffer += decoder.decode(value, { stream: true });
 const events = sseBuffer.split('\n\n');
 sseBuffer = events.pop() ||''; // Keep incomplete event in buffer

 for (const evt of events) {
 if (!evt.trim()) continue;
 const eventMatch = evt.match(/^event:\s*(.+)$/m);
 const dataMatch = evt.match(/^data:\s*(.+)$/m);
 if (!eventMatch || !dataMatch) continue;

 const eventType = eventMatch[1].trim();
 let eventData: any;
 try { eventData = JSON.parse(dataMatch[1]); } catch { continue; }

 switch (eventType) {
 case'plan': {
 // Show which file(s) the agent is targeting
 const targets = eventData.targetFiles?.length > 0
 ? eventData.targetFiles.map((f: string) => f.split('/').pop()).join(',')
 : eventData.activeFile?.split('/').pop() || null;
 const targetLine = targets ?`\n **Working on:** ${targets}` :'';
 const planLines = (eventData.steps || []).map((s: any) =>` ${s.id}. ${s.title}`);
 appendWorkingLine(` ï¸ **Plan:** ${eventData.summary}${targetLine}\n${planLines.join('\n')}`);
 break;
 }
 case'step_start': {
 appendWorkingLine(`\n- ${eventData.title}...`);
 break;
 }
 case'step_complete': {
 // Replace the last "- title..." line with the completed version
 const icon = eventData.status ==='done' ?'...' :'Œ';
 let lastPendingIdx = -1;
 for (let i = workingLines.length - 1; i >= 0; i--) {
 if (workingLines[i].includes(`- ${eventData.title}`)) { lastPendingIdx = i; break; }
 }
 if (lastPendingIdx >= 0) {
 workingLines[lastPendingIdx] =`${icon} ${eventData.title} - ${eventData.detail ||''}`;
 updateWorkingMessage([...workingLines]);
 } else {
 appendWorkingLine(`${icon} ${eventData.title} - ${eventData.detail ||''}`);
 }
 break;
 }
 case'progress': {
 appendWorkingLine(eventData.message);
 break;
 }
 case'snapshot': {
 if (eventData.hash) {
 setSnapshotHash(eventData.hash);
 appendWorkingLine('Snapshot saved for undo');
 }
 break;
 }
 case'clarify': {
 setClarifyQuestion(eventData.question || 'Could you clarify?');
 appendWorkingLine('\nClarification needed: ' + (eventData.question || ''));
 break;
 }
 case'result': {
 finalData = eventData;
 break;
 }
 case'ping': {
 // Heartbeat from server
 break;
 }
 case'test_results': {
  setTestResults(eventData);
  const p = eventData.passed || 0;
  const w = eventData.warnings || 0;
  const f = eventData.failures || 0;
  appendWorkingLine(`\nTest Results: ${p} passed, ${w} warnings, ${f} failures`);
  break;
  }
  case'error': {
 appendWorkingLine(`\nŒ ${eventData.message}`);
 break;
 }
 case'done': {
 reading = false;
 break;
 }
 }
 }
 }

 if (inactivityTimer) clearTimeout(inactivityTimer);
 coderAbortRef.current = null;

 // Process the final result data
 if (finalData) {
 // Save snapshot hash and file diffs for undo
 if (finalData.snapshotHash) setSnapshotHash(finalData.snapshotHash);
 if (finalData.diffs) { setFileDiffs(finalData.diffs); setShowDiffs(false); }

 // Update conversation history
 setCoderHistory(prev => [
 ...prev,
 { role:'user' as const, content: msgText.trim() },
 { role:'assistant' as const, content: finalData.response ||'No response' },
 ]);

 // Auto-apply files so the preview updates immediately
 if (finalData.generatedFiles?.length > 0 || finalData.modifiedFiles?.length > 0) {
 const genFiles = finalData.generatedFiles || [];
 const modFiles = finalData.modifiedFiles || [];

 // Merge into files state (same logic as "Apply All" button)
 setFiles(prev => {
 const updated = [...prev];
 for (const gf of genFiles) {
 const idx = updated.findIndex(f => f.path === gf.path);
 if (idx >= 0) updated[idx] = gf;
 else updated.push(gf);
 }
 for (const mf of modFiles) {
 const idx = updated.findIndex(f => f.path === mf.path);
 if (idx >= 0) updated[idx] = mf;
 else updated.push(mf);
 }

 // Auto-switch to the first changed file tab so user sees it
 const firstChanged = modFiles[0] || genFiles[0];
 if (firstChanged) {
 const changedIdx = updated.findIndex(f => f.path === firstChanged.path);
 if (changedIdx >= 0) {
 setTimeout(() => {
 setActiveFileTab(changedIdx);
 setShowPreview(false); // Switch to code view so changes are visible
 }, 100);
 }
 }

 return updated;
 });

 // Also store as pending so the banner shows what was applied
 setCoderPendingFiles({
 generated: genFiles,
 modified: modFiles,
 });
 }

 // Add final summary as a separate message
   if (finalData.response) {
     const tokenFooter = finalData.tokensUsed
       ? `\n\n---\n*${finalData.tokensUsed.toLocaleString()} tokens${finalData.estimatedCost ? ` · ~$${finalData.estimatedCost.toFixed(4)}` : ''}${finalData.durationMs ? ` · ${(finalData.durationMs / 1000).toFixed(1)}s` : ''}*`
       : '';
     setCoderMessages(prev => [...prev, {
       id:`summary-${Date.now()}`,
       role:'assistant',
       content: (finalData.success ? finalData.response : ` ï¸ ${finalData.response}`) + tokenFooter,
     }]);
   }
 }
 }
 } catch (err) {
 console.error('Chat send error:', err);
 if (err instanceof DOMException && err.name === 'AbortError') {
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:'Cancelled by user.',
 }]);
 coderAbortRef.current = null;
 return;
 }
 setChatMessages(prev => [...prev, {
 id: (Date.now() + 1).toString(),
 role:'assistant',
 content:`Error: ${err instanceof Error ? err.message : 'Network error'}`,
 }]);
 } finally {
 setChatLoading(false);
 }
 };

 const handleImplementSingleTask = async (task: BackendTask) => {
 setChatLoading(true);
 try {
 const res = await fetch(`${API.programmerAgent}/implement-task`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ task, appId: selectedAppId || undefined }),
 });
 const data = await res.json();
 if (data.success) {
 setBackendTasks(prev => prev.map(t => t.id === task.id ? { ...t, status:'done' as const } : t));
 setChatMessages(prev => [...prev, {
 id: Date.now().toString(),
 role:'assistant',
 content:`\u2705 ${task.title} - implemented successfully.`,
 }]);
 } else {
 setChatMessages(prev => [...prev, {
 id: Date.now().toString(),
 role:'assistant',
 content:`\u26a0\ufe0f ${task.title} - ${data.message || data.error ||'implementation failed'}.`,
 }]);
 }
 } catch (err) {
 setChatMessages(prev => [...prev, {
 id: Date.now().toString(),
 role:'assistant',
 content:`\u274c ${task.title} - ${err instanceof Error ? err.message :'network error'}.`,
 }]);
 } finally {
 setChatLoading(false);
 }
 };

 /* "€"€"€ Retry Failed "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleRetryFailed = async () => {
 if (failedSteps.length === 0) return;
 setRetryingSteps(failedSteps.map(s => s.title));
 setPhase('generating');
 try {
 const enabledPages = pages.filter(p => p.enabled !== false);
 const res = await fetch(`${API.programmerAgent}/generate`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 prompt: prompt.trim(),
 targetType:'members-area',
 appId: selectedAppId || undefined,
 orchestratorModel: orchestratorModel || undefined,
 subAgentModel: subAgentModel || undefined,
 pages: enabledPages,
 }),
 });
 const data = await res.json();
 if (data.success) {
 if (data.plan) setPlan(data.plan);
 if (data.files) setFiles(data.files);
 if (data.summary) setSummary(data.summary);
 if (data.tokensUsed) setTokensUsed(data.tokensUsed);
 setPhase('results');
 setSnack({ open: true, msg:'Retry completed successfully', severity:'success' });
 } else {
 setSnack({ open: true, msg: data.error ||'Retry failed', severity:'error' });
 setPhase('results');
 }
 } catch (e: any) {
 setSnack({ open: true, msg: e.message ||'Network error', severity:'error' });
 setPhase('results');
 } finally {
 setRetryingSteps([]);
 }
 };

 /* "€"€"€ Save "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleSave = async () => {
    if (files.length === 0) return;
    const activeFile = files[activeFileTab];
    if (!activeFile) return;
    setSaving(true);
    try {
      const res = await fetch(`${API.programmerAgent}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [activeFile] }),
      });
      const data = await res.json();
      if (data.success) {
        const fileName = activeFile.path.split('/').pop() || activeFile.path;
        setSnack({ open: true, msg: `Saved ${fileName} to project`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: `Save failed: ${data.errors?.join(', ')}`, severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 setSnack({ open: true, msg:'Copied to clipboard', severity:'info' });
 };

/* --- Finalize Agent: analyze + implement all tasks --- */

  const handleFinalize = async () => {
    if (files.length === 0) return;
    setFinalizeLoading(true);
    setPhase('finalizing');
    setBackendTasks([]);
    setFinalizeSummary('Analyzing pages for backend requirements...');

    try {
      const res = await fetch(`${API.programmerAgent}/finalize-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          model: orchestratorModel || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        setSnack({ open: true, msg: `Server error (${res.status})`, severity: 'error' });
        setPhase('results');
        setFinalizeLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));

              if (eventType === 'status') {
                setFinalizeSummary(data.message || '');
                if (data.tasks) setBackendTasks(data.tasks);
                if (data.phase === 'done') {
                  setPhase('finalized');
                  setFinalizeLoading(false);
                  const doneCount = (data.tasks || []).filter((t) => t.status === 'done').length;
                  const total = (data.tasks || []).length;
                  setSnack({ open: true, msg: `Backend agent complete: ${doneCount}/${total} tasks implemented`, severity: 'success' });
                }
              } else if (eventType === 'tasks') {
                setBackendTasks(data.tasks || []);
                setFinalizeSummary(data.summary || '');
              } else if (eventType === 'task-start') {
                setBackendTasks(prev => prev.map(t =>
                  t.id === data.taskId ? { ...t, status: 'in-progress' } : t
                ));
                setFinalizeSummary(`[${data.progress}] Working on: ${data.title}...`);
              } else if (eventType === 'task-done') {
                setBackendTasks(prev => prev.map(t =>
                  t.id === data.taskId ? { ...t, status: data.success ? 'done' : 'pending' } : t
                ));
                if (data.success) {
                  setFinalizeSummary(`Completed: ${data.message}`);
                } else {
                  setFinalizeSummary(`Failed: ${data.message}`);
                }
              } else if (eventType === 'file-update') {
                // AI edited a frontend file (e.g. wired admin panel to show contact form submissions)
                if (data.path && data.content) {
                  setFiles(prev => prev.map(f =>
                    (f.path.includes(data.path) || data.path.includes(f.path))
                      ? { ...f, content: data.content }
                      : f
                  ));
                  setSnack({ open: true, msg: `Updated ${data.path.split('/').pop()}`, severity: 'info' });
                }
              } else if (eventType === 'error') {
                setSnack({ open: true, msg: data.message || 'Agent error', severity: 'error' });
              } else if (eventType === 'done') {
                setFinalizeLoading(false);
                setPhase('finalized');
              }
            } catch { /* ignore parse errors */ }
            eventType = '';
          }
        }
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('results');
    } finally {
      setFinalizeLoading(false);
    }
  };

 const handleImplementTask = async (task: BackendTask) => {
 setImplementingTask(task.id);
 try {
 const res = await fetch(`${API.programmerAgent}/implement-task`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ task, appId: selectedAppId || undefined }),
 });
 const data = await res.json();
 if (data.success) {
 setBackendTasks(prev => prev.map(t => t.id === task.id ? { ...t, status:'done' as const } : t));
 setSnack({ open: true, msg: data.message, severity:'success' });
 } else {
 setSnack({ open: true, msg: data.message ||'Implementation failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setImplementingTask(null);
 }
 };

 const handleImplementAll = async () => {
 const pendingAuto = backendTasks.filter(t => t.status ==='pending' && t.implementation);
 if (pendingAuto.length === 0) return;
 setImplementingAll(true);

 try {
 const res = await fetch(`${API.programmerAgent}/implement-all`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ tasks: backendTasks, appId: selectedAppId || undefined }),
 });
 const data = await res.json();
 if (data.success) {
 setBackendTasks(data.tasks || backendTasks);
 const successCount = (data.results || []).filter((r: any) => r.success).length;
 setSnack({ open: true, msg:`Implemented ${successCount} task(s) successfully`, severity:'success' });
 } else {
 setSnack({ open: true, msg:'Some tasks failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setImplementingAll(false);
 }
 };

 /* "€"€"€ QA Agent handlers "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleQaReview = async () => {
 if (files.length === 0) return;
 setQaLoading(true);
 setPhase('qa-running');
 setQaIssues([]);
 setQaSummary('');

 try {
 const res = await fetch(`${API.programmerAgent}/qa-review`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files,
 appId: selectedAppId || undefined,
 model: subAgentModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setQaIssues(data.issues || []);
 setQaSummary(data.summary ||'');
 setPhase('qa-results');
 const errCount = (data.issues || []).filter((i: QaIssue) => i.severity ==='error').length;
 setSnack({
 open: true,
 msg: errCount > 0
 ?`QA found ${errCount} error(s) - review and fix below`
 : data.issues?.length > 0
 ?'QA passed with minor suggestions'
 :'All files passed QA!',
 severity: errCount > 0 ?'error' :'success',
 });
 } else {
 setSnack({ open: true, msg: data.error ||'QA review failed', severity:'error' });
 setPhase('finalized');
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 setPhase('finalized');
 } finally {
 setQaLoading(false);
 }
 };

 const handleQaFix = async (issue: QaIssue) => {
 setFixingIssue(issue.id);
 try {
 const res = await fetch(`${API.programmerAgent}/qa-fix`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files,
 issue,
 model: orchestratorModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success && data.file) {
 setFiles(prev => prev.map(f => f.path === issue.file ? data.file : f));
 setQaIssues(prev => prev.filter(i => i.id !== issue.id));
 setSnack({ open: true, msg:`Fixed: ${issue.title}`, severity:'success' });
 } else {
 setSnack({ open: true, msg: data.error ||'Fix failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setFixingIssue(null);
 }
 };

 const handleQaFixAll = async () => {
 const fixable = qaIssues.filter(i => i.autoFix && i.severity !=='info');
 if (fixable.length === 0) return;
 setFixingAll(true);

 try {
 const res = await fetch(`${API.programmerAgent}/qa-fix-all`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files,
 issues: fixable,
 model: orchestratorModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setFiles(data.files || files);
 setQaIssues(prev => prev.filter(i => !data.fixed?.includes(i.id)));
 setSnack({ open: true, msg:`Fixed ${data.fixed?.length || 0} issue(s)`, severity:'success' });
 } else {
 setSnack({ open: true, msg:'Some fixes failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setFixingAll(false);
 }
 };

 const handleGenerateDocs = async () => {
 if (files.length === 0) return;
 setDocsLoading(true);
 setPhase('documenting');
 setDocsFiles([]);

 try {
 const res = await fetch(`${API.programmerAgent}/generate-docs`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files,
 appId: selectedAppId || undefined,
 backendTasks: backendTasks.length > 0 ? backendTasks : undefined,
 model: subAgentModel || undefined,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setDocsFiles(data.docs || []);
 setPhase('documented');
 setSnack({ open: true, msg:`Generated ${data.docs?.length || 0} documentation file(s)`, severity:'success' });
 } else {
 setSnack({ open: true, msg: data.error ||'Docs generation failed', severity:'error' });
 setPhase('qa-results');
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 setPhase('qa-results');
 } finally {
 setDocsLoading(false);
 }
 };

 const handleSaveDocs = async () => {
 if (docsFiles.length === 0) return;
 setSaving(true);
 try {
 const res = await fetch(`${API.programmerAgent}/save`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ files: docsFiles }),
 });
 const data = await res.json();
 if (data.success) {
 setSnack({ open: true, msg:`Saved ${docsFiles.length} doc file(s)`, severity:'success' });
 } else {
 setSnack({ open: true, msg: data.error ||'Save failed', severity:'error' });
 }
 } catch (err) {
 setSnack({ open: true, msg: err instanceof Error ? err.message :'Network error', severity:'error' });
 } finally {
 setSaving(false);
 }
 };

 /* "€"€"€ Add custom page "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 const handleAddPage = () => {
 if (!newPageName.trim()) return;
 const id = newPageName.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
 setPages(prev => [...prev, {
 id,
 name: newPageName.trim(),
 description: newPageDesc.trim() ||`${newPageName.trim()} page`,
 type:'custom',
 required: false,
 enabled: true,
 }]);
 setNewPageName('');
 setNewPageDesc('');
 setAddPageDialog(false);
 };

 /* "€"€"€ Preview (Vite dev server) "€"€"€"€ */

 const canPreview = !!(files[activeFileTab]?.path?.match(/\.(tsx|jsx)$/));

 const previewSessionRef = useRef<string | null>(null);
 const previewStartingRef = useRef(false);
 const [previewPort, setPreviewPort] = useState<number | null>(null);
 const [previewLoading, setPreviewLoading] = useState(false);
 const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 // Helper: detect component name from file content
 const detectComponentName = (code: string) => {
 const fnMatch = code.match(/export\s+(?:default\s+)?function\s+([A-Z]\w*)/);
 const arrowMatch = code.match(/export\s+(?:default\s+)?const\s+([A-Z]\w*)\s*[:=]/);
 const plainFn = code.match(/function\s+([A-Z]\w*)/);
 const plainArrow = code.match(/const\s+([A-Z]\w*)\s*[:=]/);
 return fnMatch?.[1] || arrowMatch?.[1] || plainFn?.[1] || plainArrow?.[1] ||'App';
 };

 // Start or update Vite preview session
 useEffect(() => {
 if (!files.length || !canPreview) {
 setPreviewPort(null);
 return;
 }

 const file = files[activeFileTab];
 if (!file) return;

 const componentName = detectComponentName(file.content);

 if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
 setPreviewLoading(true);

 // Start quickly on first load, debounce updates
 const delay = previewSessionRef.current ? 500 : 100;

 previewTimerRef.current = setTimeout(async () => {
 try {
 if (!previewSessionRef.current && !previewStartingRef.current) {
 // First time: spin up Vite dev server
 previewStartingRef.current = true;
 const resp = await fetch(`${API_BASE_URL}/api/preview/start`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 files: files.map(f => ({ path: f.path, content: f.content })),
 entryFile: file.path,
 componentName,
 primaryColor,
 }),
 });
 const data = await resp.json();
 previewSessionRef.current = data.sessionId;
 setPreviewPort(data.port);
 previewStartingRef.current = false;
 } else if (previewSessionRef.current) {
 // Subsequent: just write files, Vite HMR refreshes
 await fetch(`${API_BASE_URL}/api/preview/update`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 sessionId: previewSessionRef.current,
 files: files.map(f => ({ path: f.path, content: f.content })),
 entryFile: file.path,
 componentName,
 primaryColor,
 }),
 });
 }
 } catch (err) {
 console.error('Preview error:', err);
 } finally {
 setPreviewLoading(false);
 }
 }, delay);

 return () => {
 if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
 };
 }, [files, activeFileTab, primaryColor, canPreview]);

 // Cleanup: stop Vite session on unmount
 useEffect(() => {
 return () => {
 if (previewSessionRef.current) {
 fetch(`${API_BASE_URL}/api/preview/stop`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ sessionId: previewSessionRef.current }),
 }).catch(() => {});
 previewSessionRef.current = null;
 }
 };
 }, []);

 /* "€"€"€ Render "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */

 return (
 <Box sx={{ maxWidth: 1400, mx:'auto', p: 4 }}>
 {/* Header */}
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: 4 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Box sx={{
 width: 48, height: 48, borderRadius: 3,
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <AgentIcon sx={{ color:'#fff', fontSize: 28 }} />
 </Box>
 <Box>
 <Typography variant="h4" sx={{ fontSize:'1.5rem' }}>Members Area Builder</Typography>
 <Typography variant="body2" color="text.secondary">
 AI-powered multi-page members area generation. Describe your app and let the agent build complete, styled HTML pages with login flows, dashboards, and content sections - ready to deploy.
 </Typography>
 </Box>
 </Box>
 <Box sx={{ display:'flex', gap: 1 }}>
 {phase ==='results' && (
 <Button variant="outlined" size="small" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setEditMode(false); }}>
 {editMode ?'Back to Builder' :'New Build'}
 </Button>
 )}
 {phase ==='setup' && (
 <Button
 variant="contained"
 size="small"
 startIcon={loadingFiles ? <CircularProgress size={14} color="inherit" /> : <CodeIcon />}
 disabled={loadingFiles}
 onClick={loadMembersFiles}
 sx={{
 background:'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
 fontWeight: 700, textTransform:'none', borderRadius: 2,
'&:hover': { opacity: 0.9 },
 }}
 >
 {loadingFiles ?'Loading...' :'Edit Existing Pages'}
 </Button>
 )}
 <Button variant="outlined" size="small" startIcon={<TokenIcon />} onClick={() => setShowStats(!showStats)}>
 Usage Stats
 </Button>
 </Box>
 </Box>

 {/* Phase Stepper -- hide in edit mode */}
 {phase !=='setup' && !editMode && (
 <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 3 }}>
 {PHASE_STEPS.map((s) => (
 <Step key={s.key}>
 <StepLabel sx={{'& .MuiStepLabel-label': { fontSize:'0.75rem', fontWeight: 600 } }}>{s.label}</StepLabel>
 </Step>
 ))}
 </Stepper>
 )}

 {/* Edit mode header banner */}
 {editMode && phase ==='results' && (
 <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border:'1px solid #2196f315', bgcolor:'#2196f305', display:'flex', alignItems:'center', gap: 2 }} elevation={0}>
 <CodeIcon sx={{ color:'#2196f3', fontSize: 24 }} />
 <Box sx={{ flex: 1 }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#2196f3' }}>Editing Members Area Pages{selectedApp ?` -- ${selectedApp.name}` :''}</Typography>
 <Typography variant="caption" color="text.secondary">
 Use the Design chat, Coder agent, or Refine tool to modify pages. Changes are saved to disk when you click Save.
 </Typography>
 </Box>
 <Chip label={`${files.length} files`} size="small" sx={{ fontWeight: 700 }} />
 </Paper>
 )}

 {/* API key warning */}
 {noKeysConfigured && (
 <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
 No AI API keys configured. Go to <strong>Settings &gt; API Keys</strong> and add Anthropic or OpenAI.
 </Alert>
 )}

 {/* Stats panel */}
 <Collapse in={showStats}>
 <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize:'1rem' }}>Usage Statistics</Typography>
 {stats ? (
 <Grid container spacing={3}>
 {[
 { label:'Sessions', value: stats.sessions, color: primaryColor },
 { label:'Total Tokens', value: stats.totalTokens.toLocaleString(), color: primaryColor },
 { label:'Orchestrator', value: stats.orchestratorTokens.toLocaleString(), color:'#764ba2' },
 { label:'Sub-Agent', value: stats.subAgentTokens.toLocaleString(), color:'#4caf50' },
 ].map(s => (
 <Grid item xs={6} sm={3} key={s.label}>
 <Box sx={{ textAlign:'center' }}>
 <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
 <Typography variant="caption" color="text.secondary">{s.label}</Typography>
 </Box>
 </Grid>
 ))}
 </Grid>
 ) : (
 <Typography variant="body2" color="text.secondary">No usage data yet.</Typography>
 )}
 </Paper>
 </Collapse>

 {/* "€"€"€ PHASE: SETUP "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {(phase ==='setup' || phase ==='planning') && (
 <Box sx={{ display:'grid', gridTemplateColumns:'1fr 340px', gap: 3 }}>
 {/* Left: prompt + project */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
 Describe the members area you want to build
 </Typography>
 <TextField
 inputRef={promptRef}
 multiline
 minRows={5}
 maxRows={14}
 fullWidth
 placeholder={"Describe what the members area should include:\n\ne.g. A fishing community members area with a dashboard showing catch stats, a lessons library with video tutorials, a community forum feed, and a tackle shop with product listings"}
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 sx={{ mb: 2,'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.9rem' } }}
 />

 <Box sx={{ display:'flex', gap: 2, alignItems:'center', flexWrap:'wrap' }}>
 <FormControl size="small" sx={{ minWidth: 200 }}>
 <InputLabel>Select Project *</InputLabel>
 <Select
 value={selectedAppId}
 label="Select Project *"
 onChange={(e) => setSelectedAppId(e.target.value as number |'')}
 renderValue={(val) => {
 const app = apps.find(a => a.id === val);
 if (!app) return'Select a project';
 return (
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor: app.primary_color, flexShrink: 0, border:'1px solid rgba(0,0,0,0.1)' }} />
 <span>{app.name}</span>
 </Box>
 );
 }}
 >
 {apps.map(app => (
 <MenuItem key={app.id} value={app.id}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor: app.primary_color, flexShrink: 0, border:'1px solid rgba(0,0,0,0.1)' }} />
 <span>{app.name}</span>
 </Box>
 </MenuItem>
 ))}
 </Select>
 </FormControl>

 <Button
 variant="contained"
 onClick={handlePlan}
 disabled={!prompt.trim() || !selectedAppId || planLoading || noKeysConfigured}
 startIcon={planLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
 sx={{
 ml:'auto',
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 fontWeight: 700, px: 3, borderRadius: 2, textTransform:'none',
'&:hover': { opacity: 0.9 },
 }}
 >
 {planLoading ?'Planning-..' :'Plan Members Area'}
 </Button>
 </Box>

 {selectedApp && (
 <Box sx={{
 mt: 2, p: 1.5, borderRadius: 2,
 bgcolor:`${primaryColor}08`, border:`1px solid ${primaryColor}25`,
 display:'flex', alignItems:'center', gap: 1.5,
 }}>
 <Box sx={{
 width: 32, height: 32, borderRadius: 2, bgcolor: primaryColor,
 display:'flex', alignItems:'center', justifyContent:'center',
 color:'#fff', fontWeight: 700, fontSize:'0.8rem',
 }}>
 {selectedApp.name.charAt(0).toUpperCase()}
 </Box>
 <Box sx={{ flex: 1 }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.82rem' }}>
 Building for: {selectedApp.name}
 </Typography>
 <Typography variant="caption" color="text.secondary">
 All pages will match this app's colour scheme ({primaryColor})
 </Typography>
 </Box>
 <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: primaryColor, border:'1px solid rgba(0,0,0,0.1)' }} />
 </Box>
 )}
 </Paper>

 {/* Model configuration */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Model Configuration</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2 }}>
 <Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.5 }}>
 <OrchestratorIcon sx={{ fontSize: 16, color:'#764ba2' }} />
 <Typography variant="caption" sx={{ fontWeight: 600 }}>Orchestrator (complex pages)</Typography>
 </Box>
 <FormControl size="small" fullWidth>
 <Select value={orchestratorModel} onChange={(e) => setOrchestratorModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize:'0.85rem' }}>
 {orchestratorModels.map((m) => (
 <MenuItem key={m.id} value={m.id}>
 <Box sx={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
 <span>{m.name}</span>
 <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize:'0.7rem' }} />
 </Box>
 </MenuItem>
 ))}
 </Select>
 </FormControl>
 </Box>
 <Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.5 }}>
 <SpeedIcon sx={{ fontSize: 16, color:'#4caf50' }} />
 <Typography variant="caption" sx={{ fontWeight: 600 }}>Sub-Agent (types, styles, simple pages)</Typography>
 </Box>
 <FormControl size="small" fullWidth>
 <Select value={subAgentModel} onChange={(e) => setSubAgentModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize:'0.85rem' }}>
 {subAgentModels.map((m) => (
 <MenuItem key={m.id} value={m.id}>
 <Box sx={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
 <span>{m.name}</span>
 <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize:'0.7rem' }} />
 </Box>
 </MenuItem>
 ))}
 </Select>
 </FormControl>
 </Box>
 </Box>
 </Paper>
 </Box>

 {/* Right: API keys status */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 2 }}>
 <KeyIcon sx={{ fontSize: 18, color: primaryColor }} />
 <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>API Keys Status</Typography>
 </Box>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1.5 }}>
 {apiKeys.map(k => (
 <Box key={k.key} sx={{
 display:'flex', alignItems:'center', gap: 1.5, p: 1.5, borderRadius: 2,
 bgcolor: k.configured ?'rgba(76,175,80,0.04)' :'rgba(255,152,0,0.04)',
 border:`1px solid ${k.configured ?'rgba(76,175,80,0.15)' :'rgba(255,152,0,0.15)'}`,
 }}>
 {k.configured
 ? <ConfiguredIcon sx={{ fontSize: 18, color:'#4caf50' }} />
 : <MissingIcon sx={{ fontSize: 18, color:'#ff9800' }} />
 }
 <Box sx={{ flex: 1 }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.82rem', textTransform:'capitalize' }}>
 {k.key}
 </Typography>
 <Typography variant="caption" color="text.secondary">{k.reason}</Typography>
 </Box>
 <Chip
 label={k.configured ?'Ready' :'Missing'}
 size="small"
 sx={{
 height: 20, fontSize:'0.65rem', fontWeight: 600,
 bgcolor: k.configured ?'rgba(76,175,80,0.1)' :'rgba(255,152,0,0.1)',
 color: k.configured ?'#4caf50' :'#ff9800',
 }}
 />
 </Box>
 ))}
 </Box>
 <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>
 Configure keys in <strong>Settings &gt; Integration Keys</strong>
 </Typography>
 </Paper>

 {/* Tools panel */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Agent Tools</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, p: 1, borderRadius: 1 }}>
 <BraveIcon sx={{ fontSize: 18, color: configured.brave ?'#4caf50' :'#999' }} />
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem' }}>Brave Search</Typography>
 <Typography variant="caption" color="text.secondary">Searches docs & best practices</Typography>
 </Box>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, p: 1, borderRadius: 1 }}>
 <ApifyIcon sx={{ fontSize: 18, color: configured.apify ?'#4caf50' :'#999' }} />
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem' }}>Apify Scraper</Typography>
 <Typography variant="caption" color="text.secondary">Web scraping & data collection</Typography>
 </Box>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, p: 1, borderRadius: 1 }}>
 <OrchestratorIcon sx={{ fontSize: 18, color: primaryColor }} />
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem' }}>Multi-Agent System</Typography>
 <Typography variant="caption" color="text.secondary">Orchestrator + sub-agents for cost efficiency</Typography>
 </Box>
 </Box>
 </Box>
 </Paper>

 {/* What gets built */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Minimum Pages</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 0.8 }}>
 {[
 { icon: <DashboardIcon sx={{ fontSize: 16 }} />, label:'Dashboard', desc:'Stats & overview' },
 { icon: <ProfileIcon sx={{ fontSize: 16 }} />, label:'Profile', desc:'User management' },
 { icon: <SettingsIcon sx={{ fontSize: 16 }} />, label:'Settings', desc:'Preferences' },
 ].map(p => (
 <Box key={p.label} sx={{ display:'flex', alignItems:'center', gap: 1, p: 0.8 }}>
 <Box sx={{ color: primaryColor }}>{p.icon}</Box>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem', flex: 1 }}>{p.label}</Typography>
 <Typography variant="caption" color="text.secondary">{p.desc}</Typography>
 </Box>
 ))}
 <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle:'italic' }}>
 + AI suggests additional pages based on your description
 </Typography>
 </Box>
 </Paper>
 </Box>
 </Box>
 )}

 {/* "€"€"€ PHASE: PAGES (review & edit AI-suggested pages) "€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='pages' && (
 <Box sx={{ display:'grid', gridTemplateColumns:'1fr 340px', gap: 3 }}>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 <Paper sx={{ p: 3, borderRadius: 3, border:`1px solid ${primaryColor}20` }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: 2 }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
 Members Area Pages ({pages.filter(p => p.enabled !== false).length} selected)
 </Typography>
 <Button size="small" startIcon={<AddIcon />} onClick={() => setAddPageDialog(true)}
 sx={{ textTransform:'none', fontWeight: 600 }}>
 Add Page
 </Button>
 </Box>

 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {pages.map((page, idx) => (
 <Box key={page.id} sx={{
 display:'flex', alignItems:'center', gap: 1.5, p: 2, borderRadius: 2,
 bgcolor: page.enabled !== false ?`${primaryColor}04` :'#fafafa',
 border:`1px solid ${page.enabled !== false ?`${primaryColor}15` :'rgba(0,0,0,0.06)'}`,
 opacity: page.enabled !== false ? 1 : 0.5,
 transition:'all 0.15s',
 }}>
 <Checkbox
 checked={page.enabled !== false}
 disabled={page.required}
 onChange={(e) => {
 const updated = [...pages];
 updated[idx] = { ...page, enabled: e.target.checked };
 setPages(updated);
 }}
 sx={{ p: 0.5, color: primaryColor,'&.Mui-checked': { color: primaryColor } }}
 size="small"
 />
 <Box sx={{ color: primaryColor, display:'flex' }}>
 <PageTypeIcon type={page.type} />
 </Box>
 <Box sx={{ flex: 1 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.85rem' }}>{page.name}</Typography>
 {page.required && (
 <Chip label="Required" size="small" sx={{ height: 18, fontSize:'0.6rem', fontWeight: 600, bgcolor:`${primaryColor}10`, color: primaryColor }} />
 )}
 {!page.required && (
 <Chip label="AI Suggested" size="small" sx={{ height: 18, fontSize:'0.6rem', fontWeight: 600, bgcolor:'rgba(156,39,176,0.08)', color:'#9c27b0' }} />
 )}
 </Box>
 <Typography variant="caption" color="text.secondary">{page.description}</Typography>
 </Box>
 {!page.required && (
 <IconButton size="small" onClick={() => setPages(pages.filter((_, i) => i !== idx))}
 sx={{ color:'#ccc','&:hover': { color:'#e74c3c' } }}>
 <DeleteIcon sx={{ fontSize: 16 }} />
 </IconButton>
 )}
 </Box>
 ))}
 </Box>

 {/* Cost Estimation */}
 {costEstimate && (
 <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor:'#f0f7ff', border:'1px solid #bbdefb' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 1 }}>
 <CostIcon sx={{ fontSize: 18, color:'#1976d2' }} />
 <Typography variant="body2" sx={{ fontWeight: 700, color:'#1976d2', fontSize:'0.85rem' }}>
 Est. Cost: ${costEstimate.estimatedCost}
 </Typography>
 <Typography variant="caption" color="text.secondary">
 (~{costEstimate.estimatedTokens?.toLocaleString()} tokens)
 </Typography>
 </Box>
 <Typography variant="caption" color="text.secondary">
 {costEstimate.breakdown?.map((b: any) =>`${b.page}: ~${b.tokens} tok`).join(' -')}
 </Typography>
 </Box>
 )}

 <Box sx={{ display:'flex', gap: 2, mt: 3, justifyContent:'space-between' }}>
 <Button variant="outlined" onClick={() => setPhase('setup')} sx={{ borderRadius: 2, textTransform:'none' }}>
 Back
 </Button>
 <Button
 variant="contained"
 onClick={handleGenerate}
 disabled={generating || pages.filter(p => p.enabled !== false).length === 0}
 startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
 sx={{
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 fontWeight: 700, px: 4, borderRadius: 2, textTransform:'none',
'&:hover': { opacity: 0.9 },
 }}
 >
 Generate {pages.filter(p => p.enabled !== false).length} Pages
 </Button>
 </Box>
 </Paper>
 </Box>

 {/* Right: search results if available */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 {searchResults.length > 0 && (
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 2 }}>
 <SearchIcon sx={{ fontSize: 18, color: primaryColor }} />
 <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Web Research</Typography>
 </Box>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {searchResults.flatMap(s => s.results).slice(0, 5).map((r, i) => (
 <Box key={i} sx={{ p: 1, borderRadius: 1, border:'1px solid rgba(0,0,0,0.04)' }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.78rem', color: primaryColor }}>
 <a href={r.url} target="_blank" rel="noopener" style={{ color:'inherit', textDecoration:'none' }}>{r.title}</a>
 </Typography>
 <Typography variant="caption" color="text.secondary" sx={{ display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
 {r.description}
 </Typography>
 </Box>
 ))}
 </Box>
 <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display:'block', fontStyle:'italic' }}>
 Powered by Brave Search - used as context for AI generation
 </Typography>
 </Paper>
 )}

 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Generation Plan</Typography>
 <Typography variant="body2" color="text.secondary" sx={{ fontSize:'0.82rem' }}>
 The agent will:<br />
 1. Generate shared types & sidebar layout<br />
 2. Build each page (complex &gt; orchestrator, simple &gt; sub-agent)<br />
 3. Create a router to connect all pages<br />
 4. Match {selectedApp?.name}'s colour scheme
 </Typography>
 </Paper>
 </Box>
 </Box>
 )}

 {/* "€"€"€ PHASE: GENERATING "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='generating' && (
 <Paper sx={{ p: 4, borderRadius: 3, border:`1px solid ${primaryColor}25` }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2, mb: 3 }}>
 <CircularProgress size={24} sx={{ color: primaryColor }} />
 <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize:'1.1rem' }}>
 Generating Members Area-..
 </Typography>
 </Box>
 <LinearProgress sx={{
 borderRadius: 4, height: 6, mb: 3,
 bgcolor:`${primaryColor}15`,
'& .MuiLinearProgress-bar': { background:`linear-gradient(90deg, ${primaryColor}, #764ba2)` },
 }} />
 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
 Building {pages.filter(p => p.enabled !== false).length} pages for {selectedApp?.name}-..
 This may take 1-3 minutes depending on the number of pages.
 </Typography>

 {plan.length > 0 && (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {plan.map(step => (
 <Box key={step.id} sx={{
 display:'flex', alignItems:'center', gap: 1.5, p: 1.5, borderRadius: 2,
 border:'1px solid rgba(0,0,0,0.06)',
 bgcolor: step.status ==='complete' ?'rgba(76,175,80,0.04)' :
 step.status ==='running' ?`${primaryColor}04` :'transparent',
 }}>
 {step.status ==='complete' ? <DoneIcon sx={{ fontSize: 18, color:'#4caf50' }} /> :
 step.status ==='failed' ? <ErrorIcon sx={{ fontSize: 18, color:'#f44336' }} /> :
 step.status ==='running' ? <RunningIcon sx={{ fontSize: 18, color: primaryColor }} /> :
 <PendingIcon sx={{ fontSize: 18, color:'#999' }} />}
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.82rem', flex: 1 }}>{step.title}</Typography>
 <Chip
 label={step.agent ==='orchestrator' ?'Orchestrator' :'Sub-Agent'}
 size="small"
 sx={{
 height: 20, fontSize:'0.65rem', fontWeight: 600,
 bgcolor: step.agent ==='orchestrator' ?'rgba(118,75,162,0.1)' :'rgba(76,175,80,0.1)',
 color: step.agent ==='orchestrator' ?'#764ba2' :'#4caf50',
 }}
 />
 </Box>
 ))}
 </Box>
 )}
 </Paper>
 )}

 {/* "€"€"€ PHASE: RESULTS "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='results' && files.length > 0 && (
 <Box sx={{ display:'grid', gridTemplateColumns: chatPanelOpen ?'280px 1fr 380px' :'280px 1fr', gap: 2, transition:'grid-template-columns 0.3s' }}>
 {/* Left: file list + plan */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2 }}>
 {/* Summary */}
 {summary && !editMode && (
 <Paper sx={{ p: 2.5, borderRadius: 3, border:`1px solid ${primaryColor}15`, bgcolor:`${primaryColor}02` }} elevation={0}>
 <Typography variant="body2" sx={{ fontWeight: 600, color: primaryColor, fontSize:'0.85rem' }}>{summary}</Typography>
 </Paper>
 )}

 {/* Files list */}
 <Paper sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }} elevation={0}>
 <Box sx={{ px: 2, py: 1.5, bgcolor:'#f8f9fa', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize:'0.85rem' }}>
 {editMode ?'Members Pages' :'Generated Files'} ({files.length})
 </Typography>
 </Box>
 <Box sx={{ maxHeight: 400, overflow:'auto' }}>
 {files.map((f, i) => (
 <Box
 key={i}
 onClick={() => { setActiveFileTab(i); }}
 sx={{
 px: 2, py: 1.5, cursor:'pointer',
 bgcolor: i === activeFileTab ?`${primaryColor}08` :'transparent',
 borderLeft: i === activeFileTab ?`3px solid ${primaryColor}` :'3px solid transparent',
 borderBottom:'1px solid rgba(0,0,0,0.03)',
'&:hover': { bgcolor:`${primaryColor}05` },
 transition:'all 0.1s',
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <FileIcon sx={{ fontSize: 14, color: i === activeFileTab ? primaryColor :'#999' }} />
 <Typography variant="body2" sx={{
 fontWeight: i === activeFileTab ? 700 : 500,
 fontSize:'0.78rem',
 color: i === activeFileTab ? primaryColor :'text.primary',
 }}>
 {f.path.split('/').pop()}
 </Typography>
 </Box>
 <Typography variant="caption" color="text.secondary" sx={{ pl: 3, fontSize:'0.68rem' }}>
 {f.path}
 </Typography>
 </Box>
 ))}
 </Box>
 </Paper>

 {/* Plan */}
 {plan.length > 0 && (
 <Paper sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Box
 sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', px: 2, py: 1.5, cursor:'pointer' }}
 onClick={() => setShowPlan(!showPlan)}
 >
 <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize:'0.85rem' }}>Execution Plan</Typography>
 {showPlan ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
 </Box>
 <Collapse in={showPlan}>
 <Box sx={{ px: 2, pb: 2, display:'flex', flexDirection:'column', gap: 0.5 }}>
 {plan.map(step => (
 <Box key={step.id} sx={{ display:'flex', alignItems:'center', gap: 1, py: 0.5 }}>
 {step.status ==='complete' ? <DoneIcon sx={{ fontSize: 14, color:'#4caf50' }} /> :
 step.status ==='failed' ? <ErrorIcon sx={{ fontSize: 14, color:'#f44336' }} /> :
 <PendingIcon sx={{ fontSize: 14, color:'#999' }} />}
 <Typography variant="caption" sx={{ fontWeight: 500 }}>{step.title}</Typography>
 </Box>
 ))}
 </Box>
 </Collapse>
 </Paper>
 )}

 {/* Token usage */}
 {tokensUsed && (
 <Paper sx={{ p: 2, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="caption" sx={{ fontWeight: 700, display:'block', mb: 1 }}>Token Usage</Typography>
 <Box sx={{ display:'flex', gap: 1, flexWrap:'wrap' }}>
 <Chip icon={<OrchestratorIcon />} label={tokensUsed.orchestrator.toLocaleString()} size="small"
 sx={{ bgcolor:'rgba(118,75,162,0.1)', color:'#764ba2', fontWeight: 600, fontSize:'0.7rem' }} />
 <Chip icon={<SpeedIcon />} label={tokensUsed.subAgent.toLocaleString()} size="small"
 sx={{ bgcolor:'rgba(76,175,80,0.1)', color:'#4caf50', fontWeight: 600, fontSize:'0.7rem' }} />
 <Chip label={`Total: ${tokensUsed.total.toLocaleString()}`} size="small"
 sx={{ bgcolor:`${primaryColor}15`, color: primaryColor, fontWeight: 600, fontSize:'0.7rem' }} />
 </Box>
 </Paper>
 )}

 {/* Save All button */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 <Button
 variant="contained"
 fullWidth
 startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
 onClick={handleSave}
 disabled={saving}
 sx={{
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 {saving ?'Saving-..' :`Save ${files[activeFileTab]?.path?.split('/').pop() || 'File'}`}
 </Button>
 {!editMode && failedSteps.length > 0 && (
 <Button
 variant="outlined"
 fullWidth
 color="warning"
 startIcon={retryingSteps.length > 0 ? <CircularProgress size={16} color="inherit" /> : <RetryIcon />}
 onClick={handleRetryFailed}
 disabled={retryingSteps.length > 0}
 sx={{ fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2 }}
 >
 {retryingSteps.length > 0 ?'Retrying-..' :`Retry ${failedSteps.length} Failed`}
 </Button>
 )}
 {editMode && (
 <Button
 variant="outlined"
 fullWidth
 startIcon={loadingFiles ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
 onClick={loadMembersFiles}
 disabled={loadingFiles}
 sx={{ fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2, borderColor:'#1976d2', color:'#1976d2' }}
 >
 {loadingFiles ?'Reloading-..' :'Reload from Disk'}
 </Button>
 )}
 <Button
 variant="outlined"
 fullWidth
 startIcon={phase === 'finalizing' ? <CircularProgress size={16} color="inherit" /> : <FinalizeIcon />}
 onClick={handleFinalize}
 disabled={phase === 'finalizing'}
 sx={{
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
 borderColor: primaryColor, color: primaryColor,
'&:hover': { borderColor: primaryColor, bgcolor:`${primaryColor}08` },
 }}
 >
 {phase === 'finalizing' ? 'Agent Working...' : 'Finalize & Wire Up Backend'}
 </Button>
 </Box>
 </Box>

 {/* Right: code/preview viewer with browser chrome (same pattern as Pages tab) */}
 <Paper sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.08)', overflow:'hidden', display:'flex', flexDirection:'column', bgcolor:'#f5f5f7' }} elevation={0}>

 {/* "€"€"€ Browser Chrome (same as Pages tab) "€"€"€ */}
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, px: 2, py: 1, bgcolor:'#e8e8ec', borderBottom:'1px solid rgba(0,0,0,0.08)' }}>
 {/* Traffic lights */}
 <Box sx={{ display:'flex', gap: 0.6, mr: 1 }}>
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#ff5f57', border:'1px solid #e0443e' }} />
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#ffbd2e', border:'1px solid #dea123' }} />
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#28c840', border:'1px solid #1aab29' }} />
 </Box>

 {/* Address bar */}
 <Box sx={{
 flex: 1, display:'flex', alignItems:'center', gap: 1,
 bgcolor:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius: 2,
 px: 1.5, py: 0.5, mx: 1,
 }}>
 <SecurityIcon sx={{ fontSize: 14, color:'#4caf50' }} />
 <Typography variant="caption" sx={{ fontFamily:'monospace', color:'#555', fontSize:'0.72rem', flex: 1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
 https://{selectedApp?.slug ||'app'}.example.com/{files[activeFileTab]?.path.split('/').pop()?.replace(/\.(tsx|jsx)$/,'').toLowerCase().replace(/page$/,'') ||''}
 </Typography>
 </Box>

 {/* View mode toggles: Preview / Code / Split */}
 <Box sx={{ display:'flex', gap: 0.3, bgcolor:'#d8d8dc', borderRadius: 1.5, p: 0.3 }}>
 <Tooltip title="Preview">
 <IconButton size="small" onClick={() => { setShowPreview(true); setSplitView(false); }}
 sx={{ bgcolor: showPreview && !splitView ?'#fff' :'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: showPreview && !splitView ?'0 1px 3px rgba(0,0,0,0.1)' :'none' }}>
 <PreviewIcon sx={{ fontSize: 15, color: showPreview && !splitView ? primaryColor :'#888' }} />
 </IconButton>
 </Tooltip>
 <Tooltip title="Code">
 <IconButton size="small" onClick={() => { setShowPreview(false); setSplitView(false); }}
 sx={{ bgcolor: !showPreview && !splitView ?'#fff' :'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: !showPreview && !splitView ?'0 1px 3px rgba(0,0,0,0.1)' :'none' }}>
 <CodeIcon sx={{ fontSize: 15, color: !showPreview && !splitView ? primaryColor :'#888' }} />
 </IconButton>
 </Tooltip>
 {canPreview && (
 <Tooltip title="Split View">
 <IconButton size="small" onClick={() => { setSplitView(!splitView); setShowPreview(true); }}
 sx={{ bgcolor: splitView ?'#fff' :'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: splitView ?'0 1px 3px rgba(0,0,0,0.1)' :'none' }}>
 <SplitIcon sx={{ fontSize: 15, color: splitView ? primaryColor :'#888' }} />
 </IconButton>
 </Tooltip>
 )}
 <Tooltip title="Open Full Site Preview">
 <IconButton size="small" disabled={fullSiteLoading} onClick={async () => {
 if (fullSiteLoading) return;
 setFullSiteLoading(true);
 try {
 if (fullSiteSessionRef.current) {
 fetch(`${API_BASE_URL}/api/preview/stop`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ sessionId: fullSiteSessionRef.current }),
 }).catch(() => {});
 fullSiteSessionRef.current = null;
 }
 const res = await fetch(`${API_BASE_URL}/api/preview/start-fullsite`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 files: files.map(f => ({ path: f.path, content: f.content })),
 primaryColor,
 appName: selectedApp?.name || 'Members Area',
 }),
 });
 const data = await res.json();
 fullSiteSessionRef.current = data.sessionId;
 window.open(`http://localhost:${data.port}`, '_blank');
 setFullSiteLoading(false);
 } catch (err: any) {
 console.error('Full site preview error:', err);
 setFullSiteLoading(false);
 setSnack({ open: true, msg: 'Failed to start full site preview', severity: 'error' });
 }
 }}
 sx={{ bgcolor: 'transparent', borderRadius: 1, width: 28, height: 28 }}>
 {fullSiteLoading ? <CircularProgress size={14} sx={{ color: primaryColor }} /> : <FullSiteIcon sx={{ fontSize: 15, color: '#888' }} />}
 </IconButton>
 </Tooltip>
 </Box>
 </Box>

 {/* "€"€"€ Toolbar "€"€"€ */}
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', px: 2, py: 0.8, bgcolor:'#f0f0f3', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <FileIcon sx={{ fontSize: 14, color: primaryColor }} />
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem', color:'#444' }}>
 {files[activeFileTab]?.path.split('/').pop()}
 </Typography>
 <Typography variant="caption" sx={{ color:'#aaa', fontSize:'0.68rem' }}>
 {files[activeFileTab]?.path}
 </Typography>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
 <Tooltip title="Refine this file">
 <IconButton size="small" onClick={() => setRefineDialog(true)} sx={{ color:'#888' }}>
 <RefineIcon sx={{ fontSize: 16 }} />
 </IconButton>
 </Tooltip>
 <Tooltip title="Copy code">
 <IconButton size="small" onClick={() => copyToClipboard(files[activeFileTab]?.content ||'')} sx={{ color:'#888' }}>
 <CopyIcon sx={{ fontSize: 16 }} />
 </IconButton>
 </Tooltip>
 </Box>
 </Box>

 {/* "€"€"€ Content: Preview / Code / Split (iframe renders actual TSX) "€"€"€ */}
 {splitView && canPreview ? (
 /* Split view: preview left, code right */
 <Box sx={{ flex: 1, display:'grid', gridTemplateColumns:'1fr 1fr', minHeight: 580 }}>
 <Box sx={{ bgcolor:'#fff', overflow:'hidden', borderRight:'1px solid rgba(0,0,0,0.08)', position:'relative' }}>
 {previewLoading && (
 <Box sx={{ position:'absolute', top: 0, left: 0, right: 0, bottom: 0, display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'rgba(255,255,255,0.85)', zIndex: 10 }}>
 <CircularProgress size={28} />
 <Typography variant="body2" sx={{ ml: 1.5, color:'#888' }}>Starting preview-..</Typography>
 </Box>
 )}
 <iframe
 src={previewPort ?`http://localhost:${previewPort}` : undefined}
 style={{ width:'100%', height:'100%', minHeight: 580, border:'none' }}
 title="Page Preview"
 />
 </Box>
 <Box sx={{ overflow:'auto', bgcolor:'#1e1e2e', p: 2,'&::-webkit-scrollbar': { width: 6 },'&::-webkit-scrollbar-thumb': { bgcolor:'#444', borderRadius: 3 } }}>
 <SyntaxHighlight code={files[activeFileTab]?.content ||''} language="tsx" />
 </Box>
 </Box>
 ) : showPreview && canPreview && previewPort ? (
 /* Full preview - Vite dev server */
 <Box sx={{ flex: 1, bgcolor:'#fff', position:'relative', minHeight: 580 }}>
 {previewLoading && (
 <Box sx={{ position:'absolute', top: 0, left: 0, right: 0, bottom: 0, display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'rgba(255,255,255,0.85)', zIndex: 10 }}>
 <CircularProgress size={28} />
 <Typography variant="body2" sx={{ ml: 1.5, color:'#888' }}>Starting preview-..</Typography>
 </Box>
 )}
 <iframe
 src={previewPort ?`http://localhost:${previewPort}` : undefined}
 style={{ width:'100%', height:'100%', minHeight: 580, border:'none' }}
 title="Page Preview"
 />
 </Box>
 ) : (
 /* Code view */
 <Box sx={{
 flex: 1, p: 2, minHeight: 580, overflow:'auto', bgcolor:'#1e1e2e',
'&::-webkit-scrollbar': { width: 6 },
'&::-webkit-scrollbar-thumb': { bgcolor:'#444', borderRadius: 3 },
 }}>
 <SyntaxHighlight code={files[activeFileTab]?.content ||''} language="tsx" />
 </Box>
 )}
 </Paper>

 {/* "€"€"€ Chat Panel (Design + Backend) "€"€"€ */}
 {chatPanelOpen && (
 <Paper sx={{
 borderRadius: 3, border:'1px solid rgba(0,0,0,0.08)', overflow:'hidden',
 display:'flex', flexDirection:'column', bgcolor:'#fafbfc', minHeight: 580,
 }} elevation={0}>
 {/* Tab header */}
 <Box sx={{ px: 1, py: 0.75, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box sx={{
 display:'flex', gap: 0.3, bgcolor:'#f0f0f2', borderRadius: 1.5, p: 0.3,
 }}>
 <Button size="small" onClick={() => setChatMode('design')} sx={{
 fontSize:'0.72rem', fontWeight: 700, textTransform:'none', px: 1.5, py: 0.4,
 borderRadius: 1, minWidth: 0,
 bgcolor: chatMode ==='design' ?'#fff' :'transparent',
 boxShadow: chatMode ==='design' ?'0 1px 3px rgba(0,0,0,0.1)' :'none',
 color: chatMode ==='design' ? primaryColor :'#888',
 }}>
 <AgentIcon sx={{ fontSize: 14, mr: 0.5 }} /> Design
 </Button>
 <Button size="small" onClick={() => setChatMode('backend')} sx={{
 fontSize:'0.72rem', fontWeight: 700, textTransform:'none', px: 1.5, py: 0.4,
 borderRadius: 1, minWidth: 0,
 bgcolor: chatMode ==='backend' ?'#fff' :'transparent',
 boxShadow: chatMode ==='backend' ?'0 1px 3px rgba(0,0,0,0.1)' :'none',
 color: chatMode ==='backend' ?'#e67e22' :'#888',
 }}>
 <BuildIcon sx={{ fontSize: 14, mr: 0.5 }} /> Backend
 </Button>
 <Button size="small" onClick={() => setChatMode('coder')} sx={{
 fontSize:'0.72rem', fontWeight: 700, textTransform:'none', px: 1.5, py: 0.4,
 borderRadius: 1, minWidth: 0,
 bgcolor: chatMode ==='coder' ?'#fff' :'transparent',
 boxShadow: chatMode ==='coder' ?'0 1px 3px rgba(0,0,0,0.1)' :'none',
 color: chatMode ==='coder' ?'#00897b' :'#888',
 }}>
 <CodeIcon sx={{ fontSize: 14, mr: 0.5 }} /> Coder
 </Button>
 </Box>
 <IconButton size="small" onClick={() => setChatPanelOpen(false)} sx={{ color:'#bbb' }}>
 <CollapseIcon sx={{ fontSize: 18, transform:'rotate(-90deg)' }} />
 </IconButton>
 </Box>

 {/* *** DESIGN CHAT *** */}
 {chatMode ==='design' && (
 <>
 {/* Undo & Diff toolbar */}
  {snapshotHash && (
  <Box sx={{ px: 2, py: 1, borderBottom:'1px solid #e0e0e0', display:'flex', alignItems:'center', gap: 1, bgcolor:'#f5f5f5' }}>
  <Button size="small" variant="outlined" color="warning"
  disabled={undoLoading}
  onClick={async () => {
  setUndoLoading(true);
  try {
  const res = await fetch(`${API_BASE_URL}/api/programmer-agent/rollback`, {
  method:'POST', headers: {'Content-Type':'application/json' },
  body: JSON.stringify({ hash: snapshotHash, appId: selectedAppId }),
  });
  const data = await res.json();
  setSnack({ open: true, msg: data.message || 'Rolled back', severity:'success' });
  setSnapshotHash(null);
  } catch (e: any) { setSnack({ open: true, msg: e.message, severity:'error' }); }
  setUndoLoading(false);
  }}
  sx={{ fontSize:'0.68rem', textTransform:'none' }}>
  {undoLoading ? 'Rolling back...' : 'Undo Changes'}
  </Button>
  {fileDiffs.length > 0 && (
  <Button size="small" onClick={() => setShowDiffs(!showDiffs)}
  sx={{ fontSize:'0.68rem', textTransform:'none', color:'#1976d2' }}>
  {showDiffs ? 'Hide Diffs' : `Show Diffs (${fileDiffs.length})`}
  </Button>
  )}
  </Box>
  )}
  {showDiffs && fileDiffs.length > 0 && (
  <Box sx={{ maxHeight: 300, overflow:'auto', bgcolor:'#1e1e1e', borderBottom:'1px solid #333' }}>
  {fileDiffs.map((d: any, i: number) => (
  <Box key={i} sx={{ mb: 1 }}>
  <Typography sx={{ fontSize:'0.72rem', color:'#89b4fa', px: 1, py: 0.5, fontWeight: 600, fontFamily:'monospace' }}>
  {d.file}
  </Typography>
  <pre style={{ margin: 0, padding:'0 8px', fontSize:'0.68rem', fontFamily:'monospace', lineHeight: 1.4 }}>
  {(d.diff || '').split('\n').map((line: string, li: number) => {
  let color ='#ccc'; let bg ='transparent';
  if (line.startsWith('+')) { color ='#a6e3a1'; bg ='rgba(166,227,161,0.1)'; }
  else if (line.startsWith('-')) { color ='#f38ba8'; bg ='rgba(243,139,168,0.1)'; }
  else if (line.startsWith('@@')) { color ='#89b4fa'; }
  return <div key={li} style={{ color, backgroundColor: bg, paddingLeft: 4 }}>{line}</div>;
  })}
  </pre>
  </Box>
  ))}
  </Box>
  )}

  {/* Clarification question banner */}
  {clarifyQuestion && (
  <Box sx={{ px: 2, py: 1.5, borderBottom:'1px solid #bbdefb', bgcolor:'#e3f2fd' }}>
  <Typography variant="caption" sx={{ fontWeight: 700, color:'#1565c0', fontSize:'0.78rem', display:'block', mb: 1 }}>
  Clarification needed
  </Typography>
  <Typography variant="body2" sx={{ color:'#333', mb: 1.5, fontSize:'0.82rem' }}>
  {clarifyQuestion}
  </Typography>
  <Box sx={{ display:'flex', gap: 1 }}>
  <TextField size="small" fullWidth placeholder="Type your answer..."
  value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
  onKeyPress={(e: any) => {
  if (e.key ==='Enter' && !e.shiftKey && chatInput.trim()) {
  e.preventDefault();
  setClarifyQuestion(null);
  handleChatSend();
  }
  }}
  sx={{ '& .MuiInputBase-root': { fontSize:'0.82rem' } }} />
  <Button size="small" variant="contained" onClick={() => { setClarifyQuestion(null); handleChatSend(); }}
  disabled={!chatInput.trim()}
  sx={{ fontSize:'0.7rem', textTransform:'none', bgcolor:'#1976d2', whiteSpace:'nowrap' }}>
  Answer
  </Button>
  </Box>
  </Box>
  )}

  {/* Test Results panel */}
  {testResults && (
  <Box sx={{ px: 2, py: 1.5, borderBottom:'1px solid #c8e6c9' }}>
  <Box
  sx={{ display:'flex', alignItems:'center', gap: 1, cursor:'pointer', userSelect:'none' }}
  onClick={() => setShowTestResults(!showTestResults)}
  >
  <Typography variant="caption" sx={{ fontWeight: 700, color:'#2e7d32', fontSize:'0.78rem' }}>
  Test Results
  </Typography>
  <Chip label={`${testResults.passed} passed`} size="small"
  sx={{ bgcolor:'#e8f5e9', color:'#2e7d32', fontWeight: 600, fontSize:'0.7rem', height: 20 }} />
  {testResults.warnings > 0 && (
  <Chip label={`${testResults.warnings} warn`} size="small"
  sx={{ bgcolor:'#fff3e0', color:'#e65100', fontWeight: 600, fontSize:'0.7rem', height: 20 }} />
  )}
  {testResults.failures > 0 && (
  <Chip label={`${testResults.failures} fail`} size="small"
  sx={{ bgcolor:'#ffebee', color:'#c62828', fontWeight: 600, fontSize:'0.7rem', height: 20 }} />
  )}
  <Box sx={{ flex: 1 }} />
  <IconButton size="small" sx={{ p: 0.3 }}>
  {showTestResults ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
  </IconButton>
  </Box>
  <Collapse in={showTestResults}>
  <Box sx={{ mt: 1, maxHeight: 300, overflow:'auto' }}>
  {testResults.results.map((tr: any, idx: number) => (
  <Box key={tr.id || idx} sx={{
  display:'flex', alignItems:'flex-start', gap: 1, py: 0.5, px: 1,
  borderBottom:'1px solid #f0f0f0', fontSize:'0.78rem',
  bgcolor: tr.severity ==='fail' ?'#fff5f5' : tr.severity ==='warn' ?'#fffaf0' :'transparent',
  }}>
  <Typography sx={{
  fontSize:'0.75rem', fontWeight: 700, minWidth: 36, textAlign:'center',
  color: tr.severity ==='pass' ?'#2e7d32' : tr.severity ==='warn' ?'#e65100' :'#c62828',
  bgcolor: tr.severity ==='pass' ?'#e8f5e9' : tr.severity ==='warn' ?'#fff3e0' :'#ffebee',
  borderRadius: 1, px: 0.5, py: 0.2, lineHeight: 1.4,
  }}>
  {tr.severity ==='pass' ?'PASS' : tr.severity ==='warn' ?'WARN' :'FAIL'}
  </Typography>
  <Box sx={{ flex: 1, minWidth: 0 }}>
  <Typography sx={{ fontSize:'0.78rem', fontWeight: 600, color:'#333' }}>
  {tr.title}
  </Typography>
  <Typography sx={{ fontSize:'0.72rem', color:'#666', mt: 0.2 }}>
  {tr.detail}
  </Typography>
  {tr.file && (
  <Typography sx={{ fontSize:'0.68rem', color:'#999', mt: 0.2, fontFamily:'monospace' }}>
  {tr.file}{tr.line ? `:${tr.line}` :''}
  </Typography>
  )}
  </Box>
  <Chip label={tr.category} size="small" variant="outlined"
  sx={{ fontSize:'0.65rem', height: 18, borderColor:'#ddd', color:'#888' }} />
  </Box>
  ))}
  {testResults.summary && (
  <Typography sx={{ fontSize:'0.72rem', color:'#555', mt: 1, fontStyle:'italic', px: 1 }}>
  {testResults.summary}
  </Typography>
  )}
  </Box>
  </Collapse>
  </Box>
  )}
  <Box sx={{
 flex: 1, overflow:'auto', px: 2, py: 1.5, display:'flex', flexDirection:'column', gap: 1.5,
'&::-webkit-scrollbar': { width: 6 },'&::-webkit-scrollbar-thumb': { bgcolor:'#ccc', borderRadius: 3 },
 }}>
 {chatMessages.length === 0 ? (
 <Box sx={{ m:'auto', textAlign:'center', py: 4 }}>
 <AgentIcon sx={{ fontSize: 40, color:'#ddd', mb: 1 }} />
 <Typography variant="body2" sx={{ color:'#999', mb: 0.5 }}>Design Chat</Typography>
 <Typography variant="caption" sx={{ color:'#bbb', lineHeight: 1.5, display:'block' }}>
 Ask the AI to change the design, add sections, update content, or modify styling of the active file.
 </Typography>
 <Box sx={{ mt: 2, display:'flex', flexDirection:'column', gap: 1 }}>
 {['Add a sidebar navigation','Make the stats cards more colourful','Add a notifications section','Change the layout to a 2-column grid'].map(s => (
 <Button key={s} size="small" variant="outlined" onClick={() => handleChatSend(s)}
 sx={{ fontSize:'0.7rem', textTransform:'none', borderColor:'#e0e0e0', color:'#888', justifyContent:'flex-start','&:hover': { borderColor: primaryColor, color: primaryColor } }}>
 {s}
 </Button>
 ))}
 </Box>
 </Box>
 ) : (
 chatMessages.map((msg) => (
 <Box key={msg.id} sx={{
 p: 1.5, borderRadius: 2,
 bgcolor: msg.role ==='user' ?'#e8f0fe' :'#f0faf0',
 border: msg.role ==='user' ?'1px solid #d0ddf7' :'1px solid #c8e6c9',
 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.5, mb: 0.5 }}>
 {msg.role ==='assistant' && <RefineIcon sx={{ fontSize: 14, color:'#4caf50' }} />}
 <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role ==='user' ?'#5a7bbf' :'#4caf50' }}>
 {msg.role ==='user' ?'You' :'AI'}
 </Typography>
 </Box>
 <Typography variant="body2" sx={{ whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'0.8rem', lineHeight: 1.6, color:'#333' }}>
 {msg.content}
 </Typography>
 </Box>
 ))
 )}
 {chatLoading && (
 <Box sx={{ display:'flex', gap: 1, alignItems:'center', p: 1.5, bgcolor:'#f5f0ff', borderRadius: 2, border:'1px solid #e8dff5' }}>
 <CircularProgress size={16} sx={{ color: primaryColor }} />
 <Typography variant="caption" sx={{ color:'#764ba2', fontWeight: 600 }}>Refining design...</Typography>
 </Box>
 )}
 </Box>
 <Box sx={{ p: 2, borderTop:'1px solid #eee', bgcolor:'#fff' }}>
 <Typography variant="caption" sx={{ color:'#bbb', fontSize:'0.65rem', mb: 0.5, display:'block' }}>
 Editing: {files[activeFileTab]?.path?.split('/').pop() ||'file'}
 </Typography>
 <Box sx={{ display:'flex', gap: 1, alignItems:'flex-end' }}>
 <TextField fullWidth size="small" placeholder='e.g. "Add a progress bar to each course"'
 value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
 onKeyPress={(e: any) => { if (e.key ==='Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
 disabled={chatLoading} multiline maxRows={3}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.85rem' } }}
 />
 <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
 sx={{
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 color:'#fff', borderRadius: 2, width: 40, height: 40,
'&:hover': { opacity: 0.9 },'&.Mui-disabled': { bgcolor:'#e0e0e0', color:'#aaa' },
 }}>
 <SendIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Box>
 </Box>
 </>
 )}

 {/* *** BACKEND AGENT *** */}
 {chatMode ==='backend' && (
 <>
 {backendTasks.length > 0 && (
 <Box sx={{ px: 2, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 0.75 }}>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'0.75rem' }}>Backend Readiness</Typography>
 <Chip label={`${backendTasks.filter((t: any) => t.status ==='done').length}/${backendTasks.length}`} size="small"
 sx={{ height: 20, fontSize:'0.7rem', fontWeight: 700,
 bgcolor: backendTasks.every((t: any) => t.status ==='done') ?'#e8f5e9' :'#fff3e0',
 color: backendTasks.every((t: any) => t.status ==='done') ?'#2e7d32' :'#e65100',
 }} />
 </Box>
 <LinearProgress variant="determinate"
 value={backendTasks.length > 0 ? (backendTasks.filter((t: any) => t.status ==='done').length / backendTasks.length) * 100 : 0}
 sx={{ height: 6, borderRadius: 3, bgcolor:'#f0f0f0',
'& .MuiLinearProgress-bar': { background:'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)', borderRadius: 3 },
 }} />
 </Box>
 )}
 {backendTasks.length > 0 && (
 <Box sx={{ px: 2, py: 1, borderBottom:'1px solid #f0f0f0', maxHeight: 200, overflow:'auto',
'&::-webkit-scrollbar': { width: 5 },'&::-webkit-scrollbar-thumb': { bgcolor:'#ddd', borderRadius: 3 },
 }}>
 {backendTasks.map((task: any) => (
 <Box key={task.id} sx={{ display:'flex', alignItems:'center', gap: 1, py: 0.75, borderBottom:'1px solid #f8f8f8','&:last-child': { borderBottom:'none' } }}>
 {task.status ==='done' ? <DoneIcon sx={{ fontSize: 16, color:'#4caf50' }} /> : <PendingIcon sx={{ fontSize: 16, color:'#e0e0e0' }} />}
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Typography variant="caption" sx={{ fontWeight: 600, color: task.status ==='done' ?'#999' :'#1a1a2e', fontSize:'0.72rem', display:'block', lineHeight: 1.3, textDecoration: task.status ==='done' ?'line-through' :'none' }}>
 {task.title}
 </Typography>
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
 <Typography variant="caption" sx={{ color:'#bbb', fontSize:'0.65rem' }}>{task.category} - {task.priority}</Typography>
 {task.status !=='done' && (
 <Typography variant="caption" sx={{
 fontSize:'0.6rem', fontWeight: 700, px: 0.6, py: 0.1, borderRadius:'4px',
 ...(task.implementation ? { color:'#e67e22', bgcolor:'#fff3e0' } : { color:'#78909c', bgcolor:'#eceff1' }),
 }}>
 {task.implementation ?' Auto' :' Manual'}
 </Typography>
 )}
 </Box>
 </Box>
 {task.status !=='done' && task.implementation && (
 <Tooltip title="Auto-implement this task">
 <IconButton size="small" onClick={() => handleImplementSingleTask(task)} disabled={chatLoading}
 sx={{ color:'#e67e22','&:hover': { bgcolor:'#fff3e0' } }}>
 <RunningIcon sx={{ fontSize: 16 }} />
 </IconButton>
 </Tooltip>
 )}
 </Box>
 ))}
 </Box>
 )}
 <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display:'flex', gap: 0.75, justifyContent:'center', borderBottom:'1px solid #f0f0f0' }}>
 <Button size="small" variant="outlined" onClick={() => handleChatSend('What backend tasks does this page need?')}
 disabled={chatLoading}
 sx={{ fontSize:'0.7rem', textTransform:'none', borderColor:'#e67e22', color:'#e67e22','&:hover': { bgcolor:'#fff8f0', borderColor:'#d35400' } }}>
 {backendTasks.length > 0 ?'Re-scan' :'Analyze'}
 </Button>
 <Button size="small" variant="outlined" onClick={() => handleChatSend('Implement all')}
 disabled={chatLoading || backendTasks.filter((t: any) => t.status ==='pending' && t.implementation).length === 0}
 sx={{ fontSize:'0.7rem', textTransform:'none', borderColor:'#e67e22', color:'#e67e22','&:hover': { bgcolor:'#fff8f0', borderColor:'#d35400' } }}>
 Implement all
 </Button>
 </Box>
 <Box sx={{
 flex: 1, overflow:'auto', px: 2, py: 1.5, display:'flex', flexDirection:'column', gap: 1.5,
'&::-webkit-scrollbar': { width: 6 },'&::-webkit-scrollbar-thumb': { bgcolor:'#ccc', borderRadius: 3 },
 }}>
 {chatMessages.length === 0 ? (
 <Box sx={{ m:'auto', textAlign:'center', py: 3 }}>
 <BuildIcon sx={{ fontSize: 36, color:'#e0e0e0', mb: 1 }} />
 <Typography variant="body2" sx={{ color:'#999', mb: 0.5, fontSize:'0.85rem' }}>Backend Agent</Typography>
 <Typography variant="caption" sx={{ color:'#bbb', lineHeight: 1.5, display:'block' }}>
 Analyze what backend work the current page needs - database seeding, API routes, integrations, and security.
 </Typography>
 </Box>
 ) : (
 chatMessages.map((msg: any) => (
 <Box key={msg.id} sx={{
 p: 1.5, borderRadius: 2,
 bgcolor: msg.role ==='user' ?'#fef3e8' :'#fff',
 border: msg.role ==='user' ?'1px solid #f5d5b0' :'1px solid #e8e8e8',
 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.5, mb: 0.5 }}>
 {msg.role ==='assistant' && <BuildIcon sx={{ fontSize: 14, color:'#e67e22' }} />}
 <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role ==='user' ?'#bf6c1a' :'#e67e22' }}>
 {msg.role ==='user' ?'You' :'Backend Agent'}
 </Typography>
 </Box>
 <Typography variant="body2" sx={{ whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'0.8rem', lineHeight: 1.6, color:'#333' }}>
 {msg.content}
 </Typography>
 </Box>
 ))
 )}
 {chatLoading && (
 <Box sx={{ display:'flex', gap: 1, alignItems:'center', p: 1.5, bgcolor:'#fff8f0', borderRadius: 2, border:'1px solid #f5d5b0' }}>
 <CircularProgress size={16} sx={{ color:'#e67e22' }} />
 <Typography variant="caption" sx={{ color:'#d35400', fontWeight: 600 }}>Working...</Typography>
 </Box>
 )}
 </Box>
 <Box sx={{ p: 2, borderTop:'1px solid #eee', bgcolor:'#fff' }}>
 <Box sx={{ display:'flex', gap: 1, alignItems:'flex-end' }}>
 <TextField fullWidth size="small" placeholder='e.g. "What does this page need?" or "Fix backend tasks"'
 value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
 onKeyPress={(e: any) => { if (e.key ==='Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
 disabled={chatLoading} multiline maxRows={3}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.85rem' } }}
 />
 <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
 sx={{
 background:'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)',
 color:'#fff', borderRadius: 2, width: 40, height: 40,
'&:hover': { background:'linear-gradient(135deg, #d35400 0%, #c0392b 100%)' },
'&.Mui-disabled': { bgcolor:'#e0e0e0', color:'#aaa' },
 }}>
 <SendIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Box>
 </Box>
 </>
 )}

 {/* *** CODER AGENT (Autonomous Builder) *** */}
 {chatMode ==='coder' && (
 <>
 {/* Pending files banner */}
 {(coderPendingFiles.generated.length > 0 || coderPendingFiles.modified.length > 0) && (
 <Box sx={{ px: 2, py: 1.5, borderBottom:'1px solid #b2dfdb', bgcolor:'#e0f2f1' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 0.75 }}>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#00695c', fontSize:'0.75rem' }}>
 {coderPendingFiles.generated.length + coderPendingFiles.modified.length} file(s) ready to apply
 </Typography>
 <Box sx={{ display:'flex', gap: 0.5 }}>
 <Button size="small" variant="contained" onClick={() => {
 // Apply generated files - add to project
 const newFiles = [...files];
 for (const gf of coderPendingFiles.generated) {
 const existing = newFiles.findIndex(f => f.path === gf.path);
 if (existing >= 0) newFiles[existing] = gf;
 else newFiles.push(gf);
 }
 // Apply modified files - update in place
 for (const mf of coderPendingFiles.modified) {
 const existing = newFiles.findIndex(f => f.path === mf.path);
 if (existing >= 0) newFiles[existing] = mf;
 else newFiles.push(mf);
 }
 setFiles(newFiles);
 setCoderPendingFiles({ generated: [], modified: [] });
 setChatMessages(prev => [...prev, {
 id: Date.now().toString(),
 role:'assistant',
 content:`\u2705 Applied ${coderPendingFiles.generated.length + coderPendingFiles.modified.length} file(s) to your project. Check the preview!`,
 }]);
 }}
 sx={{ fontSize:'0.68rem', textTransform:'none', bgcolor:'#00897b', fontWeight: 700, py: 0.3, px: 1.5,
'&:hover': { bgcolor:'#00695c' } }}>
 \u2705 Apply All
 </Button>
 <Button size="small" onClick={() => setCoderPendingFiles({ generated: [], modified: [] })}
 sx={{ fontSize:'0.65rem', textTransform:'none', color:'#999', minWidth: 0 }}>
 Dismiss
 </Button>
 </Box>
 </Box>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 0.3 }}>
 {[...coderPendingFiles.generated.map((f: any) => ({ ...f, _type:'new' })), ...coderPendingFiles.modified.map((f: any) => ({ ...f, _type:'mod' }))].map((f: any, i: number) => (
 <Box key={i} sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
 <Chip label={f._type ==='new' ?'NEW' :'MOD'} size="small"
 sx={{ height: 16, fontSize:'0.55rem', fontWeight: 800, minWidth: 32,
 bgcolor: f._type ==='new' ?'#c8e6c9' :'#fff3e0',
 color: f._type ==='new' ?'#2e7d32' :'#e65100' }} />
 <Typography variant="caption" sx={{ fontSize:'0.65rem', color:'#555', fontFamily:'monospace' }}>
 {f.path}
 </Typography>
 </Box>
 ))}
 </Box>
 </Box>
 )}
 <Box sx={{
 flex: 1, overflow:'auto', px: 2, py: 1.5, display:'flex', flexDirection:'column', gap: 1.5,
'&::-webkit-scrollbar': { width: 6 },'&::-webkit-scrollbar-thumb': { bgcolor:'#ccc', borderRadius: 3 },
 }}>
 {chatMessages.length === 0 ? (
 <Box sx={{ m:'auto', textAlign:'center', py: 3, px: 1, maxWidth: 340 }}>
 <QuickIcon sx={{ fontSize: 28, color:'#b2dfdb', mb: 1 }} />
 <Typography variant="body2" sx={{ color:'#888', fontSize:'0.8rem', mb: 2.5 }}>
 Quick-start a build or ask me anything.
 </Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {QUICK_KEY_TEMPLATES.map((tpl) => {
 const Icon = QUICK_KEY_ICON_MAP[tpl.icon] || CodeIcon;
 return (
 <Button key={tpl.id} variant="outlined" size="small"
 startIcon={<Icon sx={{ fontSize: 16 }} />}
 onClick={() => { setQuickKeyInput(''); setQuickKeyExtras({}); setQuickKeyDialog(tpl); }}
 sx={{
 textTransform:'none', justifyContent:'flex-start', borderColor:'#e0e0e0',
 color:'#555', fontSize:'0.78rem', py: 1, px: 2, borderRadius: 2,
 '&:hover': { borderColor:'#00897b', color:'#00897b', bgcolor:'#e0f2f1' },
 }}>
 <Box sx={{ textAlign:'left' }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.78rem', lineHeight: 1.3 }}>{tpl.label}</Typography>
 <Typography variant="caption" sx={{ color:'#999', fontSize:'0.68rem', lineHeight: 1.2 }}>{tpl.description}</Typography>
 </Box>
 </Button>
 );
 })}
 </Box>
 </Box>
 ) : (
 chatMessages.map((msg) => (
 <Box key={msg.id} sx={{
 p: 1.5, borderRadius: 2,
 bgcolor: msg.role ==='user' ?'#e0f2f1' :'#fafafa',
 border: msg.role ==='user' ?'1px solid #b2dfdb' :'1px solid #e8e8e8',
 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.5, mb: 0.5 }}>
 {msg.role ==='assistant' && <CodeIcon sx={{ fontSize: 14, color:'#00897b' }} />}
 <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role ==='user' ?'#00695c' :'#00897b' }}>
 {msg.role ==='user' ?'You' :'Builder Agent'}
 </Typography>
 </Box>
 <Typography variant="body2" sx={{ whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:'0.8rem', lineHeight: 1.6, color:'#333' }}>
 {msg.content}
 </Typography>
 </Box>
 ))
 )}
 {chatLoading && (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1, p: 1.5, bgcolor:'#e0f2f1', borderRadius: 2, border:'1px solid #b2dfdb' }}>
 <Box sx={{ display:'flex', gap: 1, alignItems:'center' }}>
 <CircularProgress size={16} sx={{ color:'#00897b' }} />
 <Typography variant="caption" sx={{ color:'#00695c', fontWeight: 600 }}>Working...</Typography>
 </Box>
 <LinearProgress sx={{ height: 3, borderRadius: 2, bgcolor:'#b2dfdb',
'& .MuiLinearProgress-bar': { bgcolor:'#00897b' } }} />
 </Box>
 )}
 <div ref={coderChatEndRef} />
 </Box>
 <Box sx={{ px: 2, pt: 0.5, pb: 0.5, borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'flex-end' }}>
 <Button size="small" onClick={() => { setCoderMessages([]); setCoderHistory([]); setCoderPendingFiles({ generated: [], modified: [] }); setChatInput(''); }}
 sx={{ fontSize:'0.65rem', textTransform:'none', color:'#999','&:hover': { color:'#00897b' } }}>
 Clear chat
 </Button>
 </Box>
 <Box sx={{ p: 2, borderTop:'1px solid #eee', bgcolor:'#fff' }}>
 {/* Quick key chips above input */}
 {chatMessages.length > 0 && chatMode === 'coder' && !chatLoading && (
 <Box sx={{ display:'flex', gap: 0.5, flexWrap:'wrap', mb: 1 }}>
 {QUICK_KEY_TEMPLATES.map((tpl) => (
 <Chip key={tpl.id} label={tpl.label} size="small" variant="outlined"
 icon={(() => { const Icon = QUICK_KEY_ICON_MAP[tpl.icon] || CodeIcon; return <Icon sx={{ fontSize:'14px !important' }} />; })()}
 onClick={() => { setQuickKeyInput(''); setQuickKeyExtras({}); setQuickKeyDialog(tpl); }}
 sx={{
 fontSize:'0.68rem', height: 26, borderColor:'#e0e0e0', color:'#666',
 '& .MuiChip-icon': { color:'#999' },
 '&:hover': { borderColor:'#00897b', color:'#00897b', bgcolor:'#e0f2f1', '& .MuiChip-icon': { color:'#00897b' } },
 }}
 />
 ))}
 </Box>
 )}
 <Box sx={{ display:'flex', gap: 1, alignItems:'flex-end' }}>
 <TextField fullWidth size="small" placeholder="Ask me anything..."
 value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
 onKeyPress={(e: any) => { if (e.key ==='Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
 disabled={chatLoading} multiline maxRows={3}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.85rem' } }}
 />
 <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
 sx={{
 background:'linear-gradient(135deg, #00897b 0%, #004d40 100%)',
 color:'#fff', borderRadius: 2, width: 40, height: 40,
'&:hover': { background:'linear-gradient(135deg, #00695c 0%, #003d33 100%)' },
'&.Mui-disabled': { bgcolor:'#e0e0e0', color:'#aaa' },
 }}>
 <SendIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Box>
 </Box>
 </>
 )}
 </Paper>
 )}

 {/* Open chat FAB (when closed) */}
 {!chatPanelOpen && (
 <Box sx={{ position:'fixed', right: 24, bottom: 24, zIndex: 10 }}>
 <Tooltip title="Open AI Chat">
 <IconButton onClick={() => setChatPanelOpen(true)}
 sx={{
 width: 56, height: 56, borderRadius: 3,
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 color:'#fff', boxShadow:'0 4px 16px rgba(102, 126, 234, 0.4)',
'&:hover': { opacity: 0.9, transform:'scale(1.05)' },
 transition:'all 0.2s',
 }}>
 <AgentIcon sx={{ fontSize: 28 }} />
 </IconButton>
 </Tooltip>
 </Box>
 )}
 </Box>
 )}

 {/* "€"€"€ PHASE: FINALIZING "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='finalizing' && (
 <Paper sx={{ p: 4, borderRadius: 3, border:`1px solid ${primaryColor}25` }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2, mb: 3 }}>
 <CircularProgress size={24} sx={{ color: primaryColor }} />
 <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize:'1.1rem' }}>
 Analyzing Backend Requirements-..
 </Typography>
 </Box>
 <LinearProgress sx={{
 borderRadius: 4, height: 6, mb: 3,
 bgcolor:`${primaryColor}15`,
'& .MuiLinearProgress-bar': { background:`linear-gradient(90deg, ${primaryColor}, #764ba2)` },
 }} />
 <Typography variant="body2" color="text.secondary">
 {finalizeSummary || 'The AI agent is analyzing pages and implementing backend tasks one by one...'}-..
 </Typography>
 </Paper>
 )}

 {/* "€"€"€ PHASE: FINALIZED (backend tasks view) "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {(phase ==='finalized' || phase ==='finalizing') && (
 <Box sx={{ display:'grid', gridTemplateColumns:'1fr 340px', gap: 3 }}>
 {/* Left: task list */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 {/* Summary */}
 <Paper sx={{ p: 3, borderRadius: 3, border:`1px solid ${primaryColor}15`, bgcolor:`${primaryColor}02` }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Box sx={{
 width: 44, height: 44, borderRadius: 2.5,
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <BuildIcon sx={{ color:'#fff', fontSize: 22 }} />
 </Box>
 <Box sx={{ flex: 1 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, fontSize:'1.05rem' }}>
 Backend Infrastructure Tasks
 </Typography>
 <Typography variant="body2" color="text.secondary">
 {finalizeSummary}
 </Typography>
 </Box>
 </Box>

 {/* Progress bar */}
 {backendTasks.length > 0 && (() => {
 const done = backendTasks.filter(t => t.status ==='done').length;
 const pct = Math.round((done / backendTasks.length) * 100);
 return (
 <Box sx={{ mt: 2 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 0.5 }}>
 <Typography variant="caption" sx={{ fontWeight: 600 }}>{done}/{backendTasks.length} tasks complete</Typography>
 <Typography variant="caption" sx={{ fontWeight: 600, color: primaryColor }}>{pct}%</Typography>
 </Box>
 <LinearProgress variant="determinate" value={pct} sx={{
 borderRadius: 4, height: 8,
 bgcolor:`${primaryColor}15`,
'& .MuiLinearProgress-bar': { background:`linear-gradient(90deg, #4caf50, #66bb6a)`, borderRadius: 4 },
 }} />
 </Box>
 );
 })()}
 </Paper>

 {/* Implement All button */}
 {backendTasks.filter(t => t.status ==='pending' && t.implementation).length > 0 && (
 <Button
 variant="contained"
 startIcon={implementingAll ? <CircularProgress size={18} color="inherit" /> : <AutoIcon />}
 onClick={handleImplementAll}
 disabled={implementingAll}
 sx={{
 background:`linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 {implementingAll ?'Implementing-..' :`Auto-Implement ${backendTasks.filter(t => t.status ==='pending' && t.implementation).length} Tasks`}
 </Button>
 )}

 {/* Task cards grouped by category */}
 {(['database','api','integration','security','data'] as const).map(cat => {
 const catTasks = backendTasks.filter(t => t.category === cat);
 if (catTasks.length === 0) return null;

 const catLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
 database: { label:'Database', icon: <DbIcon sx={{ fontSize: 18 }} />, color:'#2196f3' },
 api: { label:'API Routes', icon: <ApiIcon sx={{ fontSize: 18 }} />, color:'#ff9800' },
 integration: { label:'Integrations', icon: <IntegrationIcon sx={{ fontSize: 18 }} />, color:'#9c27b0' },
 security: { label:'Security', icon: <SecurityIcon sx={{ fontSize: 18 }} />, color:'#f44336' },
 data: { label:'Data', icon: <DataIcon sx={{ fontSize: 18 }} />, color:'#4caf50' },
 };

 const info = catLabels[cat];

 return (
 <Paper key={cat} sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }} elevation={0}>
 <Box sx={{ px: 2.5, py: 1.5, bgcolor:`${info.color}08`, borderBottom:`1px solid ${info.color}15`, display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ color: info.color }}>{info.icon}</Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize:'0.88rem', flex: 1 }}>{info.label}</Typography>
 <Chip
 label={`${catTasks.filter(t => t.status ==='done').length}/${catTasks.length}`}
 size="small"
 sx={{ height: 22, fontSize:'0.7rem', fontWeight: 700, bgcolor:`${info.color}12`, color: info.color }}
 />
 </Box>

 <Box sx={{ display:'flex', flexDirection:'column' }}>
 {catTasks.map(task => (
 <Box key={task.id} sx={{
 display:'flex', alignItems:'flex-start', gap: 1.5, px: 2.5, py: 2,
 borderBottom:'1px solid rgba(0,0,0,0.03)',
 bgcolor: task.status ==='done' ?'rgba(76,175,80,0.03)' : task.status ==='in-progress' ? `${primaryColor}08` :'transparent',
 opacity: task.status ==='done' ? 0.7 : 1,
 transition:'all 0.15s',
 }}>
 {task.status ==='done'
 ? <DoneIcon sx={{ fontSize: 20, color:'#4caf50', mt: 0.3 }} />
 : task.status ==='in-progress'
 ? <CircularProgress size={18} sx={{ color: primaryColor, mt: 0.3 }} />
 : <PendingIcon sx={{ fontSize: 20, color:'#bbb', mt: 0.3 }} />
 }
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.3 }}>
 <Typography variant="body2" sx={{
 fontWeight: 600, fontSize:'0.85rem',
 textDecoration: task.status ==='done' ?'line-through' :'none',
 }}>
 {task.title}
 </Typography>
 <Chip
 label={task.priority}
 size="small"
 sx={{
 height: 18, fontSize:'0.6rem', fontWeight: 700,
 bgcolor: task.priority ==='high' ?'rgba(244,67,54,0.08)' : task.priority ==='medium' ?'rgba(255,152,0,0.08)' :'rgba(0,0,0,0.04)',
 color: task.priority ==='high' ?'#f44336' : task.priority ==='medium' ?'#ff9800' :'#999',
 }}
 />
 {task.implementation && task.status !=='done' && (
 <Chip icon={<AutoIcon sx={{ fontSize:'12px !important' }} />} label="Auto" size="small"
 sx={{ height: 18, fontSize:'0.6rem', fontWeight: 700, bgcolor:'rgba(76,175,80,0.08)', color:'#4caf50' }} />
 )}
 {!task.implementation && task.status !=='done' && (
 <Chip icon={<ManualIcon sx={{ fontSize:'12px !important' }} />} label="Manual" size="small"
 sx={{ height: 18, fontSize:'0.6rem', fontWeight: 700, bgcolor:'rgba(0,0,0,0.04)', color:'#999' }} />
 )}
 </Box>
 <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
 {task.description}
 </Typography>
 </Box>
 {task.implementation && task.status !=='done' && (
 <Button
 size="small"
 variant="outlined"
 onClick={() => handleImplementTask(task)}
 disabled={implementingTask === task.id || implementingAll}
 startIcon={implementingTask === task.id ? <CircularProgress size={12} /> : <AutoIcon />}
 sx={{
 textTransform:'none', fontWeight: 600, fontSize:'0.72rem',
 borderColor:'#4caf50', color:'#4caf50', flexShrink: 0,
 borderRadius: 1.5, px: 1.5, minWidth: 0,
'&:hover': { borderColor:'#4caf50', bgcolor:'rgba(76,175,80,0.04)' },
 }}
 >
 {implementingTask === task.id ?'-..' :'Run'}
 </Button>
 )}
 </Box>
 ))}
 </Box>
 </Paper>
 );
 })}

 {/* Navigation */}
 <Box sx={{ display:'flex', gap: 2, justifyContent:'space-between' }}>
 <Button variant="outlined" onClick={() => setPhase('results')} sx={{ borderRadius: 2, textTransform:'none' }}>
 Back to Code
 </Button>
 <Button
 variant="contained"
 startIcon={<BugIcon />}
 onClick={handleQaReview}
 sx={{
 background:`linear-gradient(135deg, #ff9800 0%, #f57c00 100%)`,
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 QA &amp; Docs Agent
 </Button>
 <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
 sx={{ borderRadius: 2, textTransform:'none' }}>
 New Build
 </Button>
 </Box>
 </Box>

 {/* Right: overview + tips */}
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 {/* Generated pages reference */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.88rem' }}>Generated Pages</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 0.5 }}>
 {files.filter(f => f.path.match(/\.(tsx|jsx)$/)).map((f, i) => (
 <Box key={i} sx={{ display:'flex', alignItems:'center', gap: 1, py: 0.5 }}>
 <FileIcon sx={{ fontSize: 14, color: primaryColor }} />
 <Typography variant="caption" sx={{ fontWeight: 500 }}>{f.path.split('/').pop()}</Typography>
 </Box>
 ))}
 </Box>
 </Paper>

 {/* Category legend */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.88rem' }}>Task Categories</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {[
 { icon: <DbIcon sx={{ fontSize: 16 }} />, label:'Database', desc:'Tables, records, seeds', color:'#2196f3' },
 { icon: <ApiIcon sx={{ fontSize: 16 }} />, label:'API Routes', desc:'Endpoints the pages call', color:'#ff9800' },
 { icon: <IntegrationIcon sx={{ fontSize: 16 }} />, label:'Integrations', desc:'Stripe, email, webhooks', color:'#9c27b0' },
 { icon: <SecurityIcon sx={{ fontSize: 16 }} />, label:'Security', desc:'Auth, JWT, validation', color:'#f44336' },
 { icon: <DataIcon sx={{ fontSize: 16 }} />, label:'Data', desc:'Sample/mock data', color:'#4caf50' },
 ].map(c => (
 <Box key={c.label} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ color: c.color }}>{c.icon}</Box>
 <Box sx={{ flex: 1 }}>
 <Typography variant="caption" sx={{ fontWeight: 600, display:'block' }}>{c.label}</Typography>
 <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>{c.desc}</Typography>
 </Box>
 </Box>
 ))}
 </Box>
 </Paper>

 {/* Badge legend */}
 <Paper sx={{ p: 3, borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.88rem' }}>Badges</Typography>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Chip icon={<AutoIcon sx={{ fontSize:'12px !important' }} />} label="Auto" size="small"
 sx={{ height: 20, fontSize:'0.65rem', fontWeight: 700, bgcolor:'rgba(76,175,80,0.08)', color:'#4caf50' }} />
 <Typography variant="caption" color="text.secondary">Can be auto-implemented (DB seed)</Typography>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Chip icon={<ManualIcon sx={{ fontSize:'12px !important' }} />} label="Manual" size="small"
 sx={{ height: 20, fontSize:'0.65rem', fontWeight: 700, bgcolor:'rgba(0,0,0,0.04)', color:'#999' }} />
 <Typography variant="caption" color="text.secondary">Requires manual coding / setup</Typography>
 </Box>
 </Box>
 </Paper>
 </Box>
 </Box>
 )}

 {/* "€"€"€ PHASE: QA-RUNNING (loading) "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='qa-running' && (
 <Paper sx={{ p: 4, borderRadius: 3, textAlign:'center', border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <BugIcon sx={{ fontSize: 48, color:'#ff9800', mb: 2 }} />
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>QA Agent Reviewing Code-..</Typography>
 <LinearProgress sx={{
 borderRadius: 4, height: 6, maxWidth: 400, mx:'auto', mb: 2,
'& .MuiLinearProgress-bar': { background:'linear-gradient(90deg, #ff9800, #f57c00)' },
 }} />
 <Typography variant="body2" color="text.secondary">
 Checking imports, types, logic, API calls, and cross-file references-..
 </Typography>
 </Paper>
 )}

 {/* "€"€"€ PHASE: QA-RESULTS "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='qa-results' && (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 {/* Summary header */}
 <Paper sx={{ p: 3, borderRadius: 3, border:`1px solid ${qaIssues.some(i => i.severity ==='error') ?'rgba(244,67,54,0.15)' :'rgba(76,175,80,0.15)'}`, bgcolor: qaIssues.some(i => i.severity ==='error') ?'rgba(244,67,54,0.02)' :'rgba(76,175,80,0.02)' }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Box sx={{
 width: 48, height: 48, borderRadius: 3,
 background: qaIssues.some(i => i.severity ==='error')
 ?'linear-gradient(135deg, #f44336, #e53935)'
 : qaIssues.length > 0
 ?'linear-gradient(135deg, #ff9800, #f57c00)'
 :'linear-gradient(135deg, #4caf50, #66bb6a)',
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 {qaIssues.some(i => i.severity ==='error')
 ? <ErrorIcon sx={{ color:'#fff', fontSize: 24 }} />
 : qaIssues.length > 0
 ? <WarningIcon sx={{ color:'#fff', fontSize: 24 }} />
 : <QaPassIcon sx={{ color:'#fff', fontSize: 24 }} />
 }
 </Box>
 <Box sx={{ flex: 1 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, fontSize:'1.1rem' }}>
 {qaIssues.length === 0 ?'All Clear!' :`Found ${qaIssues.length} Issue${qaIssues.length !== 1 ?'s' :''}`}
 </Typography>
 <Typography variant="body2" color="text.secondary">{qaSummary}</Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 1 }}>
 {(['error','warning','info'] as const).map(sev => {
 const count = qaIssues.filter(i => i.severity === sev).length;
 if (count === 0) return null;
 const colors = { error:'#f44336', warning:'#ff9800', info:'#2196f3' };
 return (
 <Chip key={sev} label={`${count} ${sev}`} size="small"
 sx={{ fontWeight: 700, fontSize:'0.72rem', bgcolor:`${colors[sev]}12`, color: colors[sev] }} />
 );
 })}
 </Box>
 </Box>
 </Paper>

 {/* Fix All button */}
 {qaIssues.filter(i => i.autoFix && i.severity !=='info').length > 0 && (
 <Button
 variant="contained"
 startIcon={fixingAll ? <CircularProgress size={18} color="inherit" /> : <RefineIcon />}
 onClick={handleQaFixAll}
 disabled={fixingAll}
 sx={{
 background:'linear-gradient(135deg, #ff9800, #f57c00)',
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 {fixingAll ?'Fixing-..' :`Auto-Fix ${qaIssues.filter(i => i.autoFix && i.severity !=='info').length} Issue(s)`}
 </Button>
 )}

 {/* Issues list */}
 {qaIssues.length > 0 && (
 <Paper sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }} elevation={0}>
 {qaIssues.map((issue, idx) => {
 const sevColors = { error:'#f44336', warning:'#ff9800', info:'#2196f3' };
 const sevIcons = {
 error: <ErrorIcon sx={{ fontSize: 18, color: sevColors.error }} />,
 warning: <WarningIcon sx={{ fontSize: 18, color: sevColors.warning }} />,
 info: <InfoIcon sx={{ fontSize: 18, color: sevColors.info }} />,
 };
 return (
 <Box key={issue.id} sx={{
 display:'flex', alignItems:'flex-start', gap: 1.5, px: 2.5, py: 2,
 borderBottom: idx < qaIssues.length - 1 ?'1px solid rgba(0,0,0,0.04)' :'none',
 }}>
 {sevIcons[issue.severity]}
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.3, flexWrap:'wrap' }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.85rem' }}>
 {issue.title}
 </Typography>
 <Chip label={issue.category} size="small"
 sx={{ height: 18, fontSize:'0.6rem', fontWeight: 700, bgcolor:'rgba(0,0,0,0.04)', color:'#666' }} />
 <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.7rem' }}>
 {issue.file}{issue.line ?`:${issue.line}` :''}
 </Typography>
 </Box>
 <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
 {issue.description}
 </Typography>
 </Box>
 {issue.autoFix && (
 <Button
 size="small" variant="outlined"
 onClick={() => handleQaFix(issue)}
 disabled={fixingIssue === issue.id || fixingAll}
 startIcon={fixingIssue === issue.id ? <CircularProgress size={12} /> : <RefineIcon />}
 sx={{
 textTransform:'none', fontWeight: 600, fontSize:'0.72rem',
 borderColor: sevColors[issue.severity], color: sevColors[issue.severity],
 borderRadius: 1.5, px: 1.5, minWidth: 0, flexShrink: 0,
'&:hover': { borderColor: sevColors[issue.severity], bgcolor:`${sevColors[issue.severity]}08` },
 }}
 >
 {fixingIssue === issue.id ?'-..' :'Fix'}
 </Button>
 )}
 </Box>
 );
 })}
 </Paper>
 )}

 {/* Navigation */}
 <Box sx={{ display:'flex', gap: 2, justifyContent:'space-between' }}>
 <Button variant="outlined" onClick={() => setPhase('finalized')} sx={{ borderRadius: 2, textTransform:'none' }}>
 Back to Tasks
 </Button>
 <Button
 variant="contained"
 startIcon={<DocsIcon />}
 onClick={handleGenerateDocs}
 sx={{
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 Generate Documentation
 </Button>
 <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
 sx={{ borderRadius: 2, textTransform:'none' }}>
 New Build
 </Button>
 </Box>
 </Box>
 )}

 {/* "€"€"€ PHASE: DOCUMENTING (loading) "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='documenting' && (
 <Paper sx={{ p: 4, borderRadius: 3, textAlign:'center', border:'1px solid rgba(0,0,0,0.06)' }} elevation={0}>
 <DocsIcon sx={{ fontSize: 48, color: primaryColor, mb: 2 }} />
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Generating Documentation-..</Typography>
 <LinearProgress sx={{
 borderRadius: 4, height: 6, maxWidth: 400, mx:'auto', mb: 2,
'& .MuiLinearProgress-bar': { background:`linear-gradient(90deg, ${primaryColor}, #764ba2)` },
 }} />
 <Typography variant="body2" color="text.secondary">
 Writing README, component docs, and API reference-..
 </Typography>
 </Paper>
 )}

 {/* "€"€"€ PHASE: DOCUMENTED (show docs) "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {phase ==='documented' && (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 3 }}>
 {/* Header */}
 <Paper sx={{ p: 3, borderRadius: 3, border:`1px solid ${primaryColor}15`, bgcolor:`${primaryColor}02` }} elevation={0}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Box sx={{
 width: 48, height: 48, borderRadius: 3,
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <DocsIcon sx={{ color:'#fff', fontSize: 24 }} />
 </Box>
 <Box sx={{ flex: 1 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, fontSize:'1.1rem' }}>
 Documentation Generated
 </Typography>
 <Typography variant="body2" color="text.secondary">
 {docsFiles.length} documentation file{docsFiles.length !== 1 ?'s' :''} ready
 </Typography>
 </Box>
 </Box>
 </Paper>

 {/* Doc tabs */}
 {docsFiles.length > 0 && (
 <Paper sx={{ borderRadius: 3, border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }} elevation={0}>
 {/* Tab headers */}
 <Box sx={{ display:'flex', borderBottom:'1px solid rgba(0,0,0,0.06)', bgcolor:'rgba(0,0,0,0.01)' }}>
 {docsFiles.map((doc, idx) => (
 <Box
 key={idx}
 onClick={() => setActiveDocTab(idx)}
 sx={{
 px: 2.5, py: 1.5, cursor:'pointer',
 fontWeight: activeDocTab === idx ? 700 : 500,
 fontSize:'0.8rem',
 borderBottom: activeDocTab === idx ?`2px solid ${primaryColor}` :'2px solid transparent',
 color: activeDocTab === idx ? primaryColor :'text.secondary',
 transition:'all 0.15s',
 display:'flex', alignItems:'center', gap: 0.5,
'&:hover': { bgcolor:'rgba(0,0,0,0.02)' },
 }}
 >
 <FileIcon sx={{ fontSize: 14 }} />
 {doc.path.split('/').pop()}
 </Box>
 ))}
 </Box>

 {/* Doc content */}
 <Box sx={{ p: 3, maxHeight:'60vh', overflow:'auto' }}>
 <Box sx={{ display:'flex', justifyContent:'flex-end', mb: 1 }}>
 <Tooltip title="Copy">
 <IconButton size="small" onClick={() => {
 navigator.clipboard.writeText(docsFiles[activeDocTab]?.content ||'');
 setSnack({ open: true, msg:'Copied to clipboard', severity:'success' });
 }}>
 <CopyIcon sx={{ fontSize: 16 }} />
 </IconButton>
 </Tooltip>
 </Box>
 <Box
 component="pre"
 sx={{
 fontFamily:'"Fira Code", "JetBrains Mono", monospace',
 fontSize:'0.8rem',
 lineHeight: 1.6,
 whiteSpace:'pre-wrap',
 wordBreak:'break-word',
 m: 0,
 color:'#333',
 }}
 >
 {docsFiles[activeDocTab]?.content ||''}
 </Box>
 </Box>
 </Paper>
 )}

 {/* Navigation */}
 <Box sx={{ display:'flex', gap: 2, justifyContent:'space-between' }}>
 <Button variant="outlined" onClick={() => setPhase('qa-results')} sx={{ borderRadius: 2, textTransform:'none' }}>
 Back to QA
 </Button>
 <Button
 variant="contained"
 startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
 onClick={handleSaveDocs}
 disabled={saving || docsFiles.length === 0}
 sx={{
 background:`linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
 fontWeight: 700, borderRadius: 2, textTransform:'none', py: 1.2,
'&:hover': { opacity: 0.9 },
 }}
 >
 {saving ?'Saving-..' :'Save Documentation'}
 </Button>
 <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
 sx={{ borderRadius: 2, textTransform:'none' }}>
 New Build
 </Button>
 </Box>
 </Box>
 )}

 {/* "€"€"€ Add Page Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={addPageDialog} onClose={() => setAddPageDialog(false)} maxWidth="xs" fullWidth
 PaperProps={{ sx: { borderRadius: 3 } }}>
 <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Page</DialogTitle>
 <DialogContent>
 <TextField
 fullWidth autoFocus label="Page Name" placeholder="e.g. Courses, Downloads, Community"
 value={newPageName} onChange={(e) => setNewPageName(e.target.value)}
 sx={{ mt: 1, mb: 2,'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 <TextField
 fullWidth multiline minRows={2} label="Description" placeholder="What should this page contain?"
 value={newPageDesc} onChange={(e) => setNewPageDesc(e.target.value)}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 </DialogContent>
 <DialogActions sx={{ px: 3, pb: 2 }}>
 <Button onClick={() => setAddPageDialog(false)} sx={{ textTransform:'none' }}>Cancel</Button>
 <Button variant="contained" onClick={handleAddPage} disabled={!newPageName.trim()}
 sx={{ textTransform:'none', fontWeight: 600, background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)` }}>
 Add Page
 </Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Refine Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={refineDialog} onClose={() => setRefineDialog(false)} maxWidth="sm" fullWidth
 PaperProps={{ sx: { borderRadius: 3 } }}>
 <DialogTitle sx={{ fontWeight: 700 }}>
 Refine: {files[activeFileTab]?.path.split('/').pop()}
 </DialogTitle>
 <DialogContent>
 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
 Describe the changes you want for this file.
 </Typography>
 {refineHistory.filter(h => h.fileIndex === activeFileTab).length > 0 && (
 <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor:'#f5f5f5', maxHeight: 120, overflow:'auto' }}>
 <Typography variant="caption" sx={{ fontWeight: 700, display:'block', mb: 0.5 }}>Previous refinements:</Typography>
 {refineHistory.filter(h => h.fileIndex === activeFileTab).map((h, i) => (
 <Typography key={i} variant="caption" color="text.secondary" sx={{ display:'block', fontSize:'0.7rem' }}>
 - {h.instruction}
 </Typography>
 ))}
 </Box>
 )}
 <TextField
 multiline minRows={3} maxRows={8} fullWidth autoFocus
 placeholder="e.g., Add pagination to the table, change the layout to 3 columns, add a search bar..."
 value={refineInstruction} onChange={(e) => setRefineInstruction(e.target.value)}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 </DialogContent>
 <DialogActions sx={{ px: 3, pb: 2 }}>
 <Button onClick={() => setRefineDialog(false)} sx={{ textTransform:'none' }}>Cancel</Button>
 <Button
 variant="contained" onClick={handleRefine}
 disabled={!refineInstruction.trim() || refining}
 startIcon={refining ? <CircularProgress size={16} color="inherit" /> : <RefineIcon />}
 sx={{
 background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
 textTransform:'none', fontWeight: 600,
 }}
 >
 {refining ?'Refining-..' :'Refine'}
 </Button>
 </DialogActions>
 </Dialog>

 {/* Snackbar */}
 <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}
 anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
 <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
 {snack.msg}
 </Alert>
 </Snackbar>

 {/* Quick Key Dialog */}
 <Dialog open={!!quickKeyDialog} onClose={() => setQuickKeyDialog(null)} maxWidth="sm" fullWidth
   PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}>
   {quickKeyDialog && (() => {
     const Icon = QUICK_KEY_ICON_MAP[quickKeyDialog.icon] || CodeIcon;
     return (
       <>
         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
           <Box sx={{
             width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #00897b 0%, #004d40 100%)',
           }}>
             <Icon sx={{ color: '#fff', fontSize: 22 }} />
           </Box>
           <Box>
             <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
               {quickKeyDialog.dialogTitle}
             </Typography>
             <Typography variant="caption" sx={{ color: '#888' }}>
               Quick Key &bull; Sends a detailed prompt to the builder agent
             </Typography>
           </Box>
         </DialogTitle>
         <DialogContent sx={{ pt: '8px !important' }}>
           <TextField
             autoFocus fullWidth size="small" label={quickKeyDialog.dialogTitle}
             placeholder={quickKeyDialog.dialogPlaceholder}
             helperText={quickKeyDialog.dialogHelperText}
             value={quickKeyInput}
             onChange={(e) => setQuickKeyInput(e.target.value)}
             onKeyPress={(e) => {
               if (e.key === 'Enter' && !e.shiftKey && quickKeyInput.trim()) {
                 e.preventDefault();
                 const prompt = quickKeyDialog.buildPrompt(quickKeyInput.trim(), quickKeyExtras);
                 setQuickKeyDialog(null);
                 setChatMode('coder');
                 handleChatSend(prompt);
               }
             }}
             sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
           />
           {quickKeyDialog.extraFields?.map((field) => (
             <TextField
               key={field.key} fullWidth size="small" label={field.label}
               placeholder={field.placeholder} multiline={field.multiline} minRows={field.multiline ? 2 : 1} maxRows={4}
               value={quickKeyExtras[field.key] || ''}
               onChange={(e) => setQuickKeyExtras(prev => ({ ...prev, [field.key]: e.target.value }))}
               sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
             />
           ))}
           <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, border: '1px solid #e8e8e8' }}>
             <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', display: 'block', mb: 0.5 }}>
               What this will do:
             </Typography>
             <Typography variant="caption" sx={{ color: '#888', lineHeight: 1.6, display: 'block' }}>
               {quickKeyDialog.id === 'apify-scraper' && '1. Create backend API for the Apify scraper  2. Update API config  3. Build results page with data table  4. Seed sample data  5. Add to router & navigation'}
               {quickKeyDialog.id === 'crud-feature' && '1. Create full CRUD backend API  2. Update API config  3. Build management page with create/edit/delete  4. Seed sample records  5. Add to router & navigation'}
               {quickKeyDialog.id === 'api-integration' && '1. Create backend proxy API  2. Update API config  3. Build frontend interface  4. Add to router & navigation'}
               {quickKeyDialog.id === 'new-feature' && '1. Create backend API  2. Update API config  3. Seed database  4. Build frontend page(s)  5. Add to router & navigation'}
               {quickKeyDialog.id === 'ui-page' && '1. Create a beautiful frontend page with mock data  2. Add to router & navigation'}
             </Typography>
           </Box>
         </DialogContent>
         <DialogActions sx={{ px: 3, pb: 2.5 }}>
           <Button onClick={() => setQuickKeyDialog(null)} sx={{ textTransform: 'none', color: '#999' }}>
             Cancel
           </Button>
           <Button variant="contained" disabled={!quickKeyInput.trim()}
             onClick={() => {
               const prompt = quickKeyDialog.buildPrompt(quickKeyInput.trim(), quickKeyExtras);
               setQuickKeyDialog(null);
               setChatMode('coder');
               handleChatSend(prompt);
             }}
             sx={{
               textTransform: 'none', borderRadius: 2, px: 3,
               background: 'linear-gradient(135deg, #00897b 0%, #004d40 100%)',
               '&:hover': { background: 'linear-gradient(135deg, #00695c 0%, #003d33 100%)' },
             }}
             startIcon={<SendIcon sx={{ fontSize: 16 }} />}>
             Build it
           </Button>
         </DialogActions>
       </>
     );
   })()}
 </Dialog>
 </Box>
 );
}
