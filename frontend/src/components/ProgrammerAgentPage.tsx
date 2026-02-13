import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API } from '../config/api';
import {
  Box, Typography, TextField, Button, Paper, Select, MenuItem,
  FormControl, InputLabel, Chip, CircularProgress,
  Snackbar, Alert, Tooltip, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Grid, Checkbox, Stepper, Step, StepLabel,
} from '@mui/material';
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
  SupportAgent as SupportIcon,
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
  AttachMoney as CostIcon,
} from '@mui/icons-material';

/* ─── Types ──────────────────────────────────────────────────────────────── */

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
  agent: 'orchestrator' | 'sub-agent';
  status: 'pending' | 'running' | 'complete' | 'failed';
  model?: string;
}

interface MembersPage {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'profile' | 'support' | 'settings' | 'custom';
  required: boolean;
  enabled?: boolean;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'openrouter';
  tier: 'orchestrator' | 'sub-agent' | 'both';
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

interface QaIssue {
  id: string;
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  category: 'import' | 'type' | 'logic' | 'style' | 'naming' | 'api' | 'missing';
  title: string;
  description: string;
  autoFix?: string;
}

type Phase = 'setup' | 'planning' | 'pages' | 'generating' | 'results' | 'finalizing' | 'finalized' | 'qa-running' | 'qa-results' | 'documenting' | 'documented';

/* ─── Simple syntax highlighter ─────────────────────────────────────── */

function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  const highlighted = useMemo(() => {
    if (!code) return '';
    const isTsx = /tsx?|typescript|javascript|jsx/.test(language);
    if (!isTsx) return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Comments
      .replace(/(\/{2}.*$)/gm, '<span style="color:#6a9955">$1</span>')
      // Strings
      .replace(/('[^']*')/g, '<span style="color:#ce9178">$1</span>')
      .replace(/("[^"]*")/g, '<span style="color:#ce9178">$1</span>')
      .replace(/(`[^`]*`)/gs, '<span style="color:#ce9178">$1</span>')
      // Keywords
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|default|new|typeof|instanceof|async|await|try|catch|throw|class|extends|interface|type|enum)\b/g, '<span style="color:#c586c0">$1</span>')
      // JSX tags
      .replace(/(&lt;\/?)([A-Z]\w*)/g, '$1<span style="color:#4ec9b0">$2</span>')
      // Types after colon
      .replace(/(:\s*)(string|number|boolean|any|void|null|undefined|never|unknown)/g, '$1<span style="color:#4ec9b0">$2</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
      // true/false/null
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color:#569cd6">$1</span>');
  }, [code, language]);

  return (
    <pre
      style={{
        margin: 0,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
        fontSize: '0.82rem', lineHeight: 1.6, color: '#cdd6f4',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

/* ─── Phase stepper config ───────────────────────────────────────────── */

const PHASE_STEPS = [
  { key: 'setup', label: 'Setup' },
  { key: 'planning', label: 'Plan' },
  { key: 'pages', label: 'Pages' },
  { key: 'generating', label: 'Generate' },
  { key: 'results', label: 'Review' },
  { key: 'finalized', label: 'Finalize' },
  { key: 'qa-results', label: 'QA' },
  { key: 'documented', label: 'Docs' },
] as const;

function getStepIndex(phase: Phase): number {
  const map: Record<Phase, number> = {
    setup: 0, planning: 1, pages: 2, generating: 3, results: 4,
    finalizing: 5, finalized: 5, 'qa-running': 6, 'qa-results': 6,
    documenting: 7, documented: 7,
  };
  return map[phase] ?? 0;
}

/* ─── Page type icon helper ──────────────────────────────────────────────── */

function PageTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'dashboard': return <DashboardIcon sx={{ fontSize: 18 }} />;
    case 'profile': return <ProfileIcon sx={{ fontSize: 18 }} />;
    case 'support': return <SupportIcon sx={{ fontSize: 18 }} />;
    case 'settings': return <SettingsIcon sx={{ fontSize: 18 }} />;
    default: return <PagesIcon sx={{ fontSize: 18 }} />;
  }
}

/* ─── Main component ─────────────────────────────────────────────────── */

export function ProgrammerAgentPage() {
  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');

  // Setup state
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
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
  const [showPreview, setShowPreview] = useState(false);

  // Refine state
  const [refineDialog, setRefineDialog] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  // UI
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });
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

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const selectedApp = apps.find(a => a.id === selectedAppId) || null;
  const primaryColor = selectedApp?.primary_color || '#667eea';

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

  const orchestratorModels = models.filter(m => m.tier === 'orchestrator' || m.tier === 'both');
  const subAgentModels = models.filter(m => m.tier === 'sub-agent' || m.tier === 'both');
  const noKeysConfigured = !configured.anthropic && !configured.openai;

  // Fetch cost estimate when pages change
  useEffect(() => {
    if (pages.length === 0 || !orchestratorModel || !subAgentModel) { setCostEstimate(null); return; }
    const enabled = pages.filter(p => p.enabled !== false);
    if (enabled.length === 0) { setCostEstimate(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API.programmerAgent}/estimate-cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: enabled.map(p => ({ id: p.id, type: p.type })), orchestratorModel, subAgentModel }),
        });
        const data = await res.json();
        setCostEstimate(data);
      } catch { setCostEstimate(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [pages, orchestratorModel, subAgentModel]);

  const activeStepIndex = getStepIndex(phase);
  const failedSteps = Array.isArray(plan) ? plan.filter((s: any) => s.status === 'failed') : [];

  /* ─── Plan Members Area ────────────────────────────────────────────── */

  const handlePlan = async () => {
    if (!prompt.trim() || !selectedAppId) return;
    setPlanLoading(true);
    setPhase('planning');

    try {
      const res = await fetch(`${API.programmerAgent}/plan-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          appId: selectedAppId,
          orchestratorModel: orchestratorModel || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPages(data.pages.map((p: MembersPage) => ({ ...p, enabled: true })));
        setApiKeys(data.apiKeysNeeded || []);
        setSearchResults(data.searchResults || []);
        setPhase('pages');
        setSnack({ open: true, msg: `AI suggested ${data.pages.length} pages for the members area`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Planning failed', severity: 'error' });
        setPhase('setup');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('setup');
    } finally {
      setPlanLoading(false);
    }
  };

  /* ─── Generate Members Area ────────────────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    const enabledPages = pages.filter(p => p.enabled !== false);
    if (enabledPages.length === 0) {
      setSnack({ open: true, msg: 'Select at least one page', severity: 'error' });
      return;
    }

    setGenerating(true);
    setPhase('generating');
    setFiles([]);
    setPlan([]);
    setSummary('');
    setTokensUsed(null);
    setActiveFileTab(0);

    try {
      const res = await fetch(`${API.programmerAgent}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetType: 'members-area',
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
        setSummary(data.summary || '');
        setTokensUsed(data.tokensUsed || null);
        setSearchResults(data.searchResults || []);
        setPhase('results');
        setSnack({ open: true, msg: `Generated ${data.files?.length || 0} files — ${(data.tokensUsed?.total || 0).toLocaleString()} tokens`, severity: 'success' });
        loadStats();
      } else {
        setSnack({ open: true, msg: data.error || 'Generation failed', severity: 'error' });
        setPhase('pages');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('pages');
    } finally {
      setGenerating(false);
    }
  }, [prompt, selectedAppId, orchestratorModel, subAgentModel, pages, generating]);

  /* ─── Refine ───────────────────────────────────────────────────────── */

  const handleRefine = async () => {
    if (!refineInstruction.trim() || refining) return;
    setRefining(true);
    try {
      const res = await fetch(`${API.programmerAgent}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: refineInstruction.trim(),
          files,
          fileIndex: activeFileTab,
          model: orchestratorModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.file) {
        const updated = [...files];
        updated[activeFileTab] = data.file;
        setFiles(updated);
        setRefineHistory(prev => [...prev, { instruction: refineInstruction.trim(), fileIndex: activeFileTab, timestamp: new Date().toISOString() }]);
        setSnack({ open: true, msg: 'File refined successfully', severity: 'success' });
        setRefineDialog(false);
        setRefineInstruction('');
      } else {
        setSnack({ open: true, msg: data.error || 'Refine failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setRefining(false);
    }
  };

  /* ─── Retry Failed ─────────────────────────────────────────────────── */

  const handleRetryFailed = async () => {
    if (failedSteps.length === 0) return;
    setRetryingSteps(failedSteps.map(s => s.title));
    setPhase('generating');
    try {
      const enabledPages = pages.filter(p => p.enabled !== false);
      const res = await fetch(`${API.programmerAgent}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetType: 'members-area',
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
        setSnack({ open: true, msg: 'Retry completed successfully', severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Retry failed', severity: 'error' });
        setPhase('results');
      }
    } catch (e: any) {
      setSnack({ open: true, msg: e.message || 'Network error', severity: 'error' });
      setPhase('results');
    } finally {
      setRetryingSteps([]);
    }
  };

  /* ─── Save ─────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (files.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API.programmerAgent}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      if (data.success) {
        setSnack({ open: true, msg: `Saved ${data.saved?.length || 0} file(s) to project`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: `Some files failed: ${data.errors?.join(', ')}`, severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, msg: 'Copied to clipboard', severity: 'info' });
  };

  /* ─── Finalize: analyze backend needs ──────────────────────────────── */

  const handleFinalize = async () => {
    if (files.length === 0) return;
    setFinalizeLoading(true);
    setPhase('finalizing');
    setBackendTasks([]);
    setFinalizeSummary('');

    try {
      const res = await fetch(`${API.programmerAgent}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          model: subAgentModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(data.tasks || []);
        setFinalizeSummary(data.summary || '');
        setPhase('finalized');
        const autoCount = (data.tasks || []).filter((t: BackendTask) => t.status === 'pending' && t.implementation).length;
        setSnack({ open: true, msg: `Found ${data.tasks?.length || 0} backend tasks — ${autoCount} can be auto-implemented`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Analysis failed', severity: 'error' });
        setPhase('results');
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, appId: selectedAppId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' as const } : t));
        setSnack({ open: true, msg: data.message, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.message || 'Implementation failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setImplementingTask(null);
    }
  };

  const handleImplementAll = async () => {
    const pendingAuto = backendTasks.filter(t => t.status === 'pending' && t.implementation);
    if (pendingAuto.length === 0) return;
    setImplementingAll(true);

    try {
      const res = await fetch(`${API.programmerAgent}/implement-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: backendTasks, appId: selectedAppId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(data.tasks || backendTasks);
        const successCount = (data.results || []).filter((r: any) => r.success).length;
        setSnack({ open: true, msg: `Implemented ${successCount} task(s) successfully`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: 'Some tasks failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setImplementingAll(false);
    }
  };

  /* ─── QA Agent handlers ────────────────────────────────────────────── */

  const handleQaReview = async () => {
    if (files.length === 0) return;
    setQaLoading(true);
    setPhase('qa-running');
    setQaIssues([]);
    setQaSummary('');

    try {
      const res = await fetch(`${API.programmerAgent}/qa-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          model: subAgentModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQaIssues(data.issues || []);
        setQaSummary(data.summary || '');
        setPhase('qa-results');
        const errCount = (data.issues || []).filter((i: QaIssue) => i.severity === 'error').length;
        setSnack({
          open: true,
          msg: errCount > 0
            ? `QA found ${errCount} error(s) — review and fix below`
            : data.issues?.length > 0
              ? 'QA passed with minor suggestions'
              : 'All files passed QA!',
          severity: errCount > 0 ? 'error' : 'success',
        });
      } else {
        setSnack({ open: true, msg: data.error || 'QA review failed', severity: 'error' });
        setPhase('finalized');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('finalized');
    } finally {
      setQaLoading(false);
    }
  };

  const handleQaFix = async (issue: QaIssue) => {
    setFixingIssue(issue.id);
    try {
      const res = await fetch(`${API.programmerAgent}/qa-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setSnack({ open: true, msg: `Fixed: ${issue.title}`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Fix failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setFixingIssue(null);
    }
  };

  const handleQaFixAll = async () => {
    const fixable = qaIssues.filter(i => i.autoFix && i.severity !== 'info');
    if (fixable.length === 0) return;
    setFixingAll(true);

    try {
      const res = await fetch(`${API.programmerAgent}/qa-fix-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setSnack({ open: true, msg: `Fixed ${data.fixed?.length || 0} issue(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: 'Some fixes failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setSnack({ open: true, msg: `Generated ${data.docs?.length || 0} documentation file(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Docs generation failed', severity: 'error' });
        setPhase('qa-results');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: docsFiles }),
      });
      const data = await res.json();
      if (data.success) {
        setSnack({ open: true, msg: `Saved ${docsFiles.length} doc file(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Save failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Add custom page ──────────────────────────────────────────────── */

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const id = newPageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setPages(prev => [...prev, {
      id,
      name: newPageName.trim(),
      description: newPageDesc.trim() || `${newPageName.trim()} page`,
      type: 'custom',
      required: false,
      enabled: true,
    }]);
    setNewPageName('');
    setNewPageDesc('');
    setAddPageDialog(false);
  };

  /* ─── Preview ──────────────────────────────────────────────────────── */

  const canPreview = !!(files[activeFileTab]?.path?.match(/\.(tsx|jsx)$/));

  const previewSrcDoc = useMemo(() => {
    if (!files.length) return '';
    const file = files[activeFileTab];
    if (!file || !file.path.match(/\.(tsx|jsx)$/)) return '';

    let code = file.content;

    const iconShims: string[] = [];
    code = code.replace(
      /^import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material(?:\/\w+)?['"];?\s*$/gm,
      (_: string, names: string) => {
        names.split(',').forEach((n) => {
          const parts = n.trim().split(/\s+as\s+/);
          if (!parts[0].trim()) return;
          const imported = parts[0].trim();
          const local = (parts[1] || parts[0]).trim();
          const ligature = imported
            .replace(/(Icon|Outlined|Rounded|Sharp|TwoTone)$/, '')
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase();
          iconShims.push(
            `var ${local} = function(props) { return React.createElement('span', { className: 'material-icons', style: Object.assign({ fontSize: 'inherit', verticalAlign: 'middle' }, props && props.sx ? props.sx : {}, props && props.style ? props.style : {}) }, '${ligature}'); };`
          );
        });
        return '';
      }
    );

    code = code.replace(/^import\s+.*$/gm, '');

    const fnMatch = code.match(/function\s+([A-Z]\w*)/);
    const arrowMatch = code.match(/const\s+([A-Z]\w*)\s*[:=]/);
    const componentName = fnMatch?.[1] || arrowMatch?.[1] || 'App';

    code = code.replace(/\bexport\s+default\s+/g, '');
    code = code.replace(/\bexport\s+/g, '');
    code = code.replace(/<\/script/gi, '<\\/script');

    const muiList = 'Box,Typography,Button,Paper,Grid,Card,CardContent,CardActions,CardMedia,CardHeader,Container,Stack,Divider,Chip,Avatar,Badge,Alert,Snackbar,TextField,Select,MenuItem,FormControl,InputLabel,Autocomplete,Switch,Checkbox,Radio,RadioGroup,FormControlLabel,FormGroup,FormHelperText,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TablePagination,TableSortLabel,Dialog,DialogTitle,DialogContent,DialogContentText,DialogActions,Tabs,Tab,AppBar,Toolbar,Drawer,List,ListItem,ListItemIcon,ListItemText,ListItemButton,ListItemAvatar,ListSubheader,IconButton,Fab,Tooltip,Menu,Accordion,AccordionSummary,AccordionDetails,CircularProgress,LinearProgress,Skeleton,Rating,Slider,createTheme,ThemeProvider,CssBaseline,useTheme,styled,alpha,useMediaQuery,Collapse,Fade,Grow,Slide,Zoom,Link,Breadcrumbs,Stepper,Step,StepLabel,InputAdornment,OutlinedInput,Pagination,Popover,Popper,SwipeableDrawer,ToggleButton,ToggleButtonGroup';

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script crossorigin src="https://unpkg.com/@emotion/react@11/dist/emotion-react.umd.min.js"></script>
<script crossorigin src="https://unpkg.com/@emotion/styled@11/dist/emotion-styled.umd.min.js"></script>
<script crossorigin src="https://unpkg.com/@mui/material@5/umd/material-ui.production.min.js"></script>
<script crossorigin src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,sans-serif;background:#fff}#pr{min-height:100vh}</style>
</head><body>
<div id="pr"><div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#aaa;font-size:14px">Loading preview\u2026</div></div>
<script type="text/babel" data-presets="typescript,react">
var {${muiList}} = MaterialUI;
${iconShims.join('\n')}
var useNavigate = function(){return function(){}};
var useParams = function(){return {}};
var useLocation = function(){return {pathname:'/',search:'',hash:''}};
var useSearchParams = function(){return [new URLSearchParams(),function(){}]};
var axios = {get:function(){return Promise.resolve({data:{}})},post:function(){return Promise.resolve({data:{}})},put:function(){return Promise.resolve({data:{}})},delete:function(){return Promise.resolve({data:{}})}};

${code}

var __t = createTheme({palette:{primary:{main:'${primaryColor}'}},typography:{fontFamily:"'Inter',-apple-system,sans-serif"},shape:{borderRadius:8}});
ReactDOM.createRoot(document.getElementById('pr')).render(
  React.createElement(ThemeProvider,{theme:__t},React.createElement(CssBaseline),React.createElement(${componentName})));
</script>
<script>window.onerror=function(m,u,l){document.getElementById('pr').innerHTML='<div style="padding:32px;font-family:monospace"><div style="color:#d32f2f;font-weight:700;margin-bottom:12px">Preview Error</div><div style="color:#555;font-size:13px;white-space:pre-wrap">'+m+'</div><div style="color:#999;font-size:11px;margin-top:8px">Line '+l+'</div></div>';}</script>
</body></html>`;
  }, [files, activeFileTab, primaryColor]);

  /* ─── Render ───────────────────────────────────────────────────────── */

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AgentIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>Members Area Builder</Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered multi-page members area generation. Describe your app and let the agent build complete, styled HTML pages with login flows, dashboards, and content sections — ready to deploy.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {phase === 'results' && (
            <Button variant="outlined" size="small" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); }}>
              New Build
            </Button>
          )}
          <Button variant="outlined" size="small" startIcon={<TokenIcon />} onClick={() => setShowStats(!showStats)}>
            Usage Stats
          </Button>
        </Box>
      </Box>

      {/* Phase Stepper */}
      {phase !== 'setup' && (
        <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 3 }}>
          {PHASE_STEPS.map((s) => (
            <Step key={s.key}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 600 } }}>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* API key warning */}
      {noKeysConfigured && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          No AI API keys configured. Go to <strong>Settings → API Keys</strong> and add Anthropic or OpenAI.
        </Alert>
      )}

      {/* Stats panel */}
      <Collapse in={showStats}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '1rem' }}>Usage Statistics</Typography>
          {stats ? (
            <Grid container spacing={3}>
              {[
                { label: 'Sessions', value: stats.sessions, color: primaryColor },
                { label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), color: primaryColor },
                { label: 'Orchestrator', value: stats.orchestratorTokens.toLocaleString(), color: '#764ba2' },
                { label: 'Sub-Agent', value: stats.subAgentTokens.toLocaleString(), color: '#4caf50' },
              ].map(s => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Box sx={{ textAlign: 'center' }}>
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

      {/* ─── PHASE: SETUP ─────────────────────────────────────────────── */}
      {(phase === 'setup' || phase === 'planning') && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          {/* Left: prompt + project */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
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
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.9rem' } }}
              />

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Project *</InputLabel>
                  <Select
                    value={selectedAppId}
                    label="Select Project *"
                    onChange={(e) => setSelectedAppId(e.target.value as number | '')}
                    renderValue={(val) => {
                      const app = apps.find(a => a.id === val);
                      if (!app) return 'Select a project';
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <span>{app.name}</span>
                        </Box>
                      );
                    }}
                  >
                    {apps.map(app => (
                      <MenuItem key={app.id} value={app.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
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
                    ml: 'auto',
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                    fontWeight: 700, px: 3, borderRadius: 2, textTransform: 'none',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  {planLoading ? 'Planning…' : 'Plan Members Area'}
                </Button>
              </Box>

              {selectedApp && (
                <Box sx={{
                  mt: 2, p: 1.5, borderRadius: 2,
                  bgcolor: `${primaryColor}08`, border: `1px solid ${primaryColor}25`,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 2, bgcolor: primaryColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {selectedApp.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Building for: {selectedApp.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All pages will match this app's colour scheme ({primaryColor})
                    </Typography>
                  </Box>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: primaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                </Box>
              )}
            </Paper>

            {/* Model configuration */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Model Configuration</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <OrchestratorIcon sx={{ fontSize: 16, color: '#764ba2' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Orchestrator (complex pages)</Typography>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <Select value={orchestratorModel} onChange={(e) => setOrchestratorModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                      {orchestratorModels.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{m.name}</span>
                            <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <SpeedIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Sub-Agent (types, styles, simple pages)</Typography>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <Select value={subAgentModel} onChange={(e) => setSubAgentModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                      {subAgentModels.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{m.name}</span>
                            <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <KeyIcon sx={{ fontSize: 18, color: primaryColor }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>API Keys Status</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {apiKeys.map(k => (
                  <Box key={k.key} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: k.configured ? 'rgba(76,175,80,0.04)' : 'rgba(255,152,0,0.04)',
                    border: `1px solid ${k.configured ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)'}`,
                  }}>
                    {k.configured
                      ? <ConfiguredIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                      : <MissingIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                    }
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize' }}>
                        {k.key}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{k.reason}</Typography>
                    </Box>
                    <Chip
                      label={k.configured ? 'Ready' : 'Missing'}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 600,
                        bgcolor: k.configured ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                        color: k.configured ? '#4caf50' : '#ff9800',
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Configure keys in <strong>Settings → Integration Keys</strong>
              </Typography>
            </Paper>

            {/* Tools panel */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Agent Tools</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <BraveIcon sx={{ fontSize: 18, color: configured.brave ? '#4caf50' : '#999' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Brave Search</Typography>
                    <Typography variant="caption" color="text.secondary">Searches docs & best practices</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <ApifyIcon sx={{ fontSize: 18, color: configured.apify ? '#4caf50' : '#999' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Apify Scraper</Typography>
                    <Typography variant="caption" color="text.secondary">Web scraping & data collection</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <OrchestratorIcon sx={{ fontSize: 18, color: primaryColor }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Multi-Agent System</Typography>
                    <Typography variant="caption" color="text.secondary">Orchestrator + sub-agents for cost efficiency</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* What gets built */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Minimum Pages</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {[
                  { icon: <DashboardIcon sx={{ fontSize: 16 }} />, label: 'Dashboard', desc: 'Stats & overview' },
                  { icon: <ProfileIcon sx={{ fontSize: 16 }} />, label: 'Profile', desc: 'User management' },
                  { icon: <SupportIcon sx={{ fontSize: 16 }} />, label: 'Support', desc: 'Help & tickets' },
                  { icon: <SettingsIcon sx={{ fontSize: 16 }} />, label: 'Settings', desc: 'Preferences' },
                ].map(p => (
                  <Box key={p.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.8 }}>
                    <Box sx={{ color: primaryColor }}>{p.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', flex: 1 }}>{p.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.desc}</Typography>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  + AI suggests additional pages based on your description
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: PAGES (review & edit AI-suggested pages) ──────────── */}
      {phase === 'pages' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}20` }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Members Area Pages ({pages.filter(p => p.enabled !== false).length} selected)
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAddPageDialog(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Add Page
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pages.map((page, idx) => (
                  <Box key={page.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2,
                    bgcolor: page.enabled !== false ? `${primaryColor}04` : '#fafafa',
                    border: `1px solid ${page.enabled !== false ? `${primaryColor}15` : 'rgba(0,0,0,0.06)'}`,
                    opacity: page.enabled !== false ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}>
                    <Checkbox
                      checked={page.enabled !== false}
                      disabled={page.required}
                      onChange={(e) => {
                        const updated = [...pages];
                        updated[idx] = { ...page, enabled: e.target.checked };
                        setPages(updated);
                      }}
                      sx={{ p: 0.5, color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                      size="small"
                    />
                    <Box sx={{ color: primaryColor, display: 'flex' }}>
                      <PageTypeIcon type={page.type} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{page.name}</Typography>
                        {page.required && (
                          <Chip label="Required" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${primaryColor}10`, color: primaryColor }} />
                        )}
                        {!page.required && (
                          <Chip label="AI Suggested" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(156,39,176,0.08)', color: '#9c27b0' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{page.description}</Typography>
                    </Box>
                    {!page.required && (
                      <IconButton size="small" onClick={() => setPages(pages.filter((_, i) => i !== idx))}
                        sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Cost Estimation */}
              {costEstimate && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f0f7ff', border: '1px solid #bbdefb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CostIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.85rem' }}>
                      Est. Cost: ${costEstimate.estimatedCost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (~{costEstimate.estimatedTokens?.toLocaleString()} tokens)
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {costEstimate.breakdown?.map((b: any) => `${b.page}: ~${b.tokens} tok`).join(' · ')}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setPhase('setup')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={generating || pages.filter(p => p.enabled !== false).length === 0}
                  startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                    fontWeight: 700, px: 4, borderRadius: 2, textTransform: 'none',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  Generate {pages.filter(p => p.enabled !== false).length} Pages
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Right: search results if available */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {searchResults.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SearchIcon sx={{ fontSize: 18, color: primaryColor }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Web Research</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {searchResults.flatMap(s => s.results).slice(0, 5).map((r, i) => (
                    <Box key={i} sx={{ p: 1, borderRadius: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: primaryColor }}>
                        <a href={r.url} target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>{r.title}</a>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                  Powered by Brave Search — used as context for AI generation
                </Typography>
              </Paper>
            )}

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Generation Plan</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                The agent will:<br />
                1. Generate shared types & sidebar layout<br />
                2. Build each page (complex → orchestrator, simple → sub-agent)<br />
                3. Create a router to connect all pages<br />
                4. Match {selectedApp?.name}'s colour scheme
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: GENERATING ─────────────────────────────────────────── */}
      {phase === 'generating' && (
        <Paper sx={{ p: 4, borderRadius: 3, border: `1px solid ${primaryColor}25` }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={24} sx={{ color: primaryColor }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize: '1.1rem' }}>
              Generating Members Area…
            </Typography>
          </Box>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, mb: 3,
            bgcolor: `${primaryColor}15`,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Building {pages.filter(p => p.enabled !== false).length} pages for {selectedApp?.name}…
            This may take 1-3 minutes depending on the number of pages.
          </Typography>

          {plan.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {plan.map(step => (
                <Box key={step.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  bgcolor: step.status === 'complete' ? 'rgba(76,175,80,0.04)' :
                           step.status === 'running' ? `${primaryColor}04` : 'transparent',
                }}>
                  {step.status === 'complete' ? <DoneIcon sx={{ fontSize: 18, color: '#4caf50' }} /> :
                   step.status === 'failed' ? <ErrorIcon sx={{ fontSize: 18, color: '#f44336' }} /> :
                   step.status === 'running' ? <RunningIcon sx={{ fontSize: 18, color: primaryColor }} /> :
                   <PendingIcon sx={{ fontSize: 18, color: '#999' }} />}
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{step.title}</Typography>
                  <Chip
                    label={step.agent === 'orchestrator' ? 'Orchestrator' : 'Sub-Agent'}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.65rem', fontWeight: 600,
                      bgcolor: step.agent === 'orchestrator' ? 'rgba(118,75,162,0.1)' : 'rgba(76,175,80,0.1)',
                      color: step.agent === 'orchestrator' ? '#764ba2' : '#4caf50',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* ─── PHASE: RESULTS ────────────────────────────────────────────── */}
      {phase === 'results' && files.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 3 }}>
          {/* Left: file list + plan */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary */}
            {summary && (
              <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: primaryColor, fontSize: '0.85rem' }}>{summary}</Typography>
              </Paper>
            )}

            {/* Generated files list */}
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Generated Files ({files.length})
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {files.map((f, i) => (
                  <Box
                    key={i}
                    onClick={() => { setActiveFileTab(i); setShowPreview(false); }}
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer',
                      bgcolor: i === activeFileTab ? `${primaryColor}08` : 'transparent',
                      borderLeft: i === activeFileTab ? `3px solid ${primaryColor}` : '3px solid transparent',
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      '&:hover': { bgcolor: `${primaryColor}05` },
                      transition: 'all 0.1s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon sx={{ fontSize: 14, color: i === activeFileTab ? primaryColor : '#999' }} />
                      <Typography variant="body2" sx={{
                        fontWeight: i === activeFileTab ? 700 : 500,
                        fontSize: '0.78rem',
                        color: i === activeFileTab ? primaryColor : 'text.primary',
                      }}>
                        {f.path.split('/').pop()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 3, fontSize: '0.68rem' }}>
                      {f.path}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Plan */}
            {plan.length > 0 && (
              <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, cursor: 'pointer' }}
                  onClick={() => setShowPlan(!showPlan)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Execution Plan</Typography>
                  {showPlan ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                </Box>
                <Collapse in={showPlan}>
                  <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {plan.map(step => (
                      <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        {step.status === 'complete' ? <DoneIcon sx={{ fontSize: 14, color: '#4caf50' }} /> :
                         step.status === 'failed' ? <ErrorIcon sx={{ fontSize: 14, color: '#f44336' }} /> :
                         <PendingIcon sx={{ fontSize: 14, color: '#999' }} />}
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{step.title}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            )}

            {/* Token usage */}
            {tokensUsed && (
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Token Usage</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<OrchestratorIcon />} label={tokensUsed.orchestrator.toLocaleString()} size="small"
                    sx={{ bgcolor: 'rgba(118,75,162,0.1)', color: '#764ba2', fontWeight: 600, fontSize: '0.7rem' }} />
                  <Chip icon={<SpeedIcon />} label={tokensUsed.subAgent.toLocaleString()} size="small"
                    sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', fontWeight: 600, fontSize: '0.7rem' }} />
                  <Chip label={`Total: ${tokensUsed.total.toLocaleString()}`} size="small"
                    sx={{ bgcolor: `${primaryColor}15`, color: primaryColor, fontWeight: 600, fontSize: '0.7rem' }} />
                </Box>
              </Paper>
            )}

            {/* Save All button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {saving ? 'Saving…' : `Save All ${files.length} Files`}
              </Button>
              {failedSteps.length > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  color="warning"
                  startIcon={retryingSteps.length > 0 ? <CircularProgress size={16} color="inherit" /> : <RetryIcon />}
                  onClick={handleRetryFailed}
                  disabled={retryingSteps.length > 0}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2 }}
                >
                  {retryingSteps.length > 0 ? 'Retrying…' : `Retry ${failedSteps.length} Failed`}
                </Button>
              )}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FinalizeIcon />}
                onClick={handleFinalize}
                sx={{
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  borderColor: primaryColor, color: primaryColor,
                  '&:hover': { borderColor: primaryColor, bgcolor: `${primaryColor}08` },
                }}
              >
                Finalize &amp; Wire Up Backend
              </Button>
            </Box>
          </Box>

          {/* Right: code/preview viewer */}
          <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ fontSize: 16, color: primaryColor }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {files[activeFileTab]?.path.split('/').pop()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Refine this file">
                  <IconButton size="small" onClick={() => setRefineDialog(true)}>
                    <RefineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy code">
                  <IconButton size="small" onClick={() => copyToClipboard(files[activeFileTab]?.content || '')}>
                    <CopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                {canPreview && (
                  <Tooltip title={showPreview ? 'Show Code' : 'Preview Page'}>
                    <IconButton size="small" onClick={() => setShowPreview(!showPreview)}
                      sx={{ color: showPreview ? primaryColor : undefined }}>
                      {showPreview ? <CodeIcon sx={{ fontSize: 18 }} /> : <PreviewIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* File path */}
            <Box sx={{ px: 2, py: 0.5, bgcolor: '#f0f1f3', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.72rem' }}>
                {files[activeFileTab]?.path}
              </Typography>
            </Box>

            {/* Code / Preview */}
            {showPreview && previewSrcDoc ? (
              <Box sx={{ flex: 1, minHeight: 520, bgcolor: '#fff', position: 'relative' }}>
                <iframe
                  srcDoc={previewSrcDoc}
                  style={{ width: '100%', height: '100%', minHeight: 520, border: 'none' }}
                  sandbox="allow-scripts"
                  title="Page Preview"
                />
                <Box sx={{
                  position: 'absolute', bottom: 8, right: 8,
                  bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1.5, py: 0.5,
                  borderRadius: 1, fontSize: '0.7rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 0.5,
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: primaryColor }} />
                  Preview
                </Box>
              </Box>
            ) : (
              <Box sx={{
                flex: 1, p: 2, minHeight: 520, overflow: 'auto', bgcolor: '#1e1e2e',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#444', borderRadius: 4 },
              }}>
                <SyntaxHighlight code={files[activeFileTab]?.content || ''} language="tsx" />
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ─── PHASE: FINALIZING ─────────────────────────────────────────── */}
      {phase === 'finalizing' && (
        <Paper sx={{ p: 4, borderRadius: 3, border: `1px solid ${primaryColor}25` }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={24} sx={{ color: primaryColor }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize: '1.1rem' }}>
              Analyzing Backend Requirements…
            </Typography>
          </Box>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, mb: 3,
            bgcolor: `${primaryColor}15`,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary">
            The AI agent is examining each generated page to identify database seeding, API routes, integrations, and security work needed…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: FINALIZED (backend tasks view) ─────────────────────── */}
      {phase === 'finalized' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          {/* Left: task list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Summary */}
            <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BuildIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Backend Infrastructure Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {finalizeSummary}
                  </Typography>
                </Box>
              </Box>

              {/* Progress bar */}
              {backendTasks.length > 0 && (() => {
                const done = backendTasks.filter(t => t.status === 'done').length;
                const pct = Math.round((done / backendTasks.length) * 100);
                return (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{done}/{backendTasks.length} tasks complete</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: primaryColor }}>{pct}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{
                      borderRadius: 4, height: 8,
                      bgcolor: `${primaryColor}15`,
                      '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, #4caf50, #66bb6a)`, borderRadius: 4 },
                    }} />
                  </Box>
                );
              })()}
            </Paper>

            {/* Implement All button */}
            {backendTasks.filter(t => t.status === 'pending' && t.implementation).length > 0 && (
              <Button
                variant="contained"
                startIcon={implementingAll ? <CircularProgress size={18} color="inherit" /> : <AutoIcon />}
                onClick={handleImplementAll}
                disabled={implementingAll}
                sx={{
                  background: `linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {implementingAll ? 'Implementing…' : `Auto-Implement ${backendTasks.filter(t => t.status === 'pending' && t.implementation).length} Tasks`}
              </Button>
            )}

            {/* Task cards grouped by category */}
            {(['database', 'api', 'integration', 'security', 'data'] as const).map(cat => {
              const catTasks = backendTasks.filter(t => t.category === cat);
              if (catTasks.length === 0) return null;

              const catLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
                database: { label: 'Database', icon: <DbIcon sx={{ fontSize: 18 }} />, color: '#2196f3' },
                api: { label: 'API Routes', icon: <ApiIcon sx={{ fontSize: 18 }} />, color: '#ff9800' },
                integration: { label: 'Integrations', icon: <IntegrationIcon sx={{ fontSize: 18 }} />, color: '#9c27b0' },
                security: { label: 'Security', icon: <SecurityIcon sx={{ fontSize: 18 }} />, color: '#f44336' },
                data: { label: 'Data', icon: <DataIcon sx={{ fontSize: 18 }} />, color: '#4caf50' },
              };

              const info = catLabels[cat];

              return (
                <Paper key={cat} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: `${info.color}08`, borderBottom: `1px solid ${info.color}15`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: info.color }}>{info.icon}</Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{info.label}</Typography>
                    <Chip
                      label={`${catTasks.filter(t => t.status === 'done').length}/${catTasks.length}`}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${info.color}12`, color: info.color }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {catTasks.map(task => (
                      <Box key={task.id} sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.5, py: 2,
                        borderBottom: '1px solid rgba(0,0,0,0.03)',
                        bgcolor: task.status === 'done' ? 'rgba(76,175,80,0.03)' : 'transparent',
                        opacity: task.status === 'done' ? 0.7 : 1,
                        transition: 'all 0.15s',
                      }}>
                        {task.status === 'done'
                          ? <DoneIcon sx={{ fontSize: 20, color: '#4caf50', mt: 0.3 }} />
                          : <PendingIcon sx={{ fontSize: 20, color: '#bbb', mt: 0.3 }} />
                        }
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 600, fontSize: '0.85rem',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            }}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: task.priority === 'high' ? 'rgba(244,67,54,0.08)' : task.priority === 'medium' ? 'rgba(255,152,0,0.08)' : 'rgba(0,0,0,0.04)',
                                color: task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#999',
                              }}
                            />
                            {task.implementation && task.status !== 'done' && (
                              <Chip icon={<AutoIcon sx={{ fontSize: '12px !important' }} />} label="Auto" size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(76,175,80,0.08)', color: '#4caf50' }} />
                            )}
                            {!task.implementation && task.status !== 'done' && (
                              <Chip icon={<ManualIcon sx={{ fontSize: '12px !important' }} />} label="Manual" size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#999' }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            {task.description}
                          </Typography>
                        </Box>
                        {task.implementation && task.status !== 'done' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleImplementTask(task)}
                            disabled={implementingTask === task.id || implementingAll}
                            startIcon={implementingTask === task.id ? <CircularProgress size={12} /> : <AutoIcon />}
                            sx={{
                              textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                              borderColor: '#4caf50', color: '#4caf50', flexShrink: 0,
                              borderRadius: 1.5, px: 1.5, minWidth: 0,
                              '&:hover': { borderColor: '#4caf50', bgcolor: 'rgba(76,175,80,0.04)' },
                            }}
                          >
                            {implementingTask === task.id ? '…' : 'Run'}
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Paper>
              );
            })}

            {/* Navigation */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setPhase('results')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Back to Code
              </Button>
              <Button
                variant="contained"
                startIcon={<BugIcon />}
                onClick={handleQaReview}
                sx={{
                  background: `linear-gradient(135deg, #ff9800 0%, #f57c00 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                QA &amp; Docs Agent
              </Button>
              <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                New Build
              </Button>
            </Box>
          </Box>

          {/* Right: overview + tips */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Generated pages reference */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Generated Pages</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {files.filter(f => f.path.match(/\.(tsx|jsx)$/)).map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <FileIcon sx={{ fontSize: 14, color: primaryColor }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{f.path.split('/').pop()}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Category legend */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Task Categories</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { icon: <DbIcon sx={{ fontSize: 16 }} />, label: 'Database', desc: 'Tables, records, seeds', color: '#2196f3' },
                  { icon: <ApiIcon sx={{ fontSize: 16 }} />, label: 'API Routes', desc: 'Endpoints the pages call', color: '#ff9800' },
                  { icon: <IntegrationIcon sx={{ fontSize: 16 }} />, label: 'Integrations', desc: 'Stripe, email, webhooks', color: '#9c27b0' },
                  { icon: <SecurityIcon sx={{ fontSize: 16 }} />, label: 'Security', desc: 'Auth, JWT, validation', color: '#f44336' },
                  { icon: <DataIcon sx={{ fontSize: 16 }} />, label: 'Data', desc: 'Sample/mock data', color: '#4caf50' },
                ].map(c => (
                  <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: c.color }}>{c.icon}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{c.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Badge legend */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Badges</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<AutoIcon sx={{ fontSize: '12px !important' }} />} label="Auto" size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(76,175,80,0.08)', color: '#4caf50' }} />
                  <Typography variant="caption" color="text.secondary">Can be auto-implemented (DB seed)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<ManualIcon sx={{ fontSize: '12px !important' }} />} label="Manual" size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#999' }} />
                  <Typography variant="caption" color="text.secondary">Requires manual coding / setup</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: QA-RUNNING (loading) ───────────────────────────────── */}
      {phase === 'qa-running' && (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <BugIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>QA Agent Reviewing Code…</Typography>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, maxWidth: 400, mx: 'auto', mb: 2,
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #ff9800, #f57c00)' },
          }} />
          <Typography variant="body2" color="text.secondary">
            Checking imports, types, logic, API calls, and cross-file references…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: QA-RESULTS ─────────────────────────────────────────── */}
      {phase === 'qa-results' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary header */}
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${qaIssues.some(i => i.severity === 'error') ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)'}`, bgcolor: qaIssues.some(i => i.severity === 'error') ? 'rgba(244,67,54,0.02)' : 'rgba(76,175,80,0.02)' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 3,
                background: qaIssues.some(i => i.severity === 'error')
                  ? 'linear-gradient(135deg, #f44336, #e53935)'
                  : qaIssues.length > 0
                    ? 'linear-gradient(135deg, #ff9800, #f57c00)'
                    : 'linear-gradient(135deg, #4caf50, #66bb6a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {qaIssues.some(i => i.severity === 'error')
                  ? <ErrorIcon sx={{ color: '#fff', fontSize: 24 }} />
                  : qaIssues.length > 0
                    ? <WarningIcon sx={{ color: '#fff', fontSize: 24 }} />
                    : <QaPassIcon sx={{ color: '#fff', fontSize: 24 }} />
                }
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {qaIssues.length === 0 ? 'All Clear!' : `Found ${qaIssues.length} Issue${qaIssues.length !== 1 ? 's' : ''}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">{qaSummary}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['error', 'warning', 'info'] as const).map(sev => {
                  const count = qaIssues.filter(i => i.severity === sev).length;
                  if (count === 0) return null;
                  const colors = { error: '#f44336', warning: '#ff9800', info: '#2196f3' };
                  return (
                    <Chip key={sev} label={`${count} ${sev}`} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: `${colors[sev]}12`, color: colors[sev] }} />
                  );
                })}
              </Box>
            </Box>
          </Paper>

          {/* Fix All button */}
          {qaIssues.filter(i => i.autoFix && i.severity !== 'info').length > 0 && (
            <Button
              variant="contained"
              startIcon={fixingAll ? <CircularProgress size={18} color="inherit" /> : <RefineIcon />}
              onClick={handleQaFixAll}
              disabled={fixingAll}
              sx={{
                background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {fixingAll ? 'Fixing…' : `Auto-Fix ${qaIssues.filter(i => i.autoFix && i.severity !== 'info').length} Issue(s)`}
            </Button>
          )}

          {/* Issues list */}
          {qaIssues.length > 0 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              {qaIssues.map((issue, idx) => {
                const sevColors = { error: '#f44336', warning: '#ff9800', info: '#2196f3' };
                const sevIcons = {
                  error: <ErrorIcon sx={{ fontSize: 18, color: sevColors.error }} />,
                  warning: <WarningIcon sx={{ fontSize: 18, color: sevColors.warning }} />,
                  info: <InfoIcon sx={{ fontSize: 18, color: sevColors.info }} />,
                };
                return (
                  <Box key={issue.id} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.5, py: 2,
                    borderBottom: idx < qaIssues.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}>
                    {sevIcons[issue.severity]}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {issue.title}
                        </Typography>
                        <Chip label={issue.category} size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#666' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {issue.file}{issue.line ? `:${issue.line}` : ''}
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
                          textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                          borderColor: sevColors[issue.severity], color: sevColors[issue.severity],
                          borderRadius: 1.5, px: 1.5, minWidth: 0, flexShrink: 0,
                          '&:hover': { borderColor: sevColors[issue.severity], bgcolor: `${sevColors[issue.severity]}08` },
                        }}
                      >
                        {fixingIssue === issue.id ? '…' : 'Fix'}
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Paper>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setPhase('finalized')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Back to Tasks
            </Button>
            <Button
              variant="contained"
              startIcon={<DocsIcon />}
              onClick={handleGenerateDocs}
              sx={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              Generate Documentation
            </Button>
            <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              New Build
            </Button>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: DOCUMENTING (loading) ──────────────────────────────── */}
      {phase === 'documenting' && (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <DocsIcon sx={{ fontSize: 48, color: primaryColor, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Generating Documentation…</Typography>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, maxWidth: 400, mx: 'auto', mb: 2,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary">
            Writing README, component docs, and API reference…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: DOCUMENTED (show docs) ─────────────────────────────── */}
      {phase === 'documented' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header */}
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 3,
                background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DocsIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  Documentation Generated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {docsFiles.length} documentation file{docsFiles.length !== 1 ? 's' : ''} ready
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Doc tabs */}
          {docsFiles.length > 0 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              {/* Tab headers */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                {docsFiles.map((doc, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setActiveDocTab(idx)}
                    sx={{
                      px: 2.5, py: 1.5, cursor: 'pointer',
                      fontWeight: activeDocTab === idx ? 700 : 500,
                      fontSize: '0.8rem',
                      borderBottom: activeDocTab === idx ? `2px solid ${primaryColor}` : '2px solid transparent',
                      color: activeDocTab === idx ? primaryColor : 'text.secondary',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    }}
                  >
                    <FileIcon sx={{ fontSize: 14 }} />
                    {doc.path.split('/').pop()}
                  </Box>
                ))}
              </Box>

              {/* Doc content */}
              <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Tooltip title="Copy">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(docsFiles[activeDocTab]?.content || '');
                      setSnack({ open: true, msg: 'Copied to clipboard', severity: 'success' });
                    }}>
                      <CopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                    color: '#333',
                  }}
                >
                  {docsFiles[activeDocTab]?.content || ''}
                </Box>
              </Box>
            </Paper>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setPhase('qa-results')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Back to QA
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveDocs}
              disabled={saving || docsFiles.length === 0}
              sx={{
                background: `linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {saving ? 'Saving…' : 'Save Documentation'}
            </Button>
            <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              New Build
            </Button>
          </Box>
        </Box>
      )}

      {/* ─── Add Page Dialog ───────────────────────────────────────────── */}
      <Dialog open={addPageDialog} onClose={() => setAddPageDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Page</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus label="Page Name" placeholder="e.g. Courses, Downloads, Community"
            value={newPageName} onChange={(e) => setNewPageName(e.target.value)}
            sx={{ mt: 1, mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth multiline minRows={2} label="Description" placeholder="What should this page contain?"
            value={newPageDesc} onChange={(e) => setNewPageDesc(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddPageDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPage} disabled={!newPageName.trim()}
            sx={{ textTransform: 'none', fontWeight: 600, background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)` }}>
            Add Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Refine Dialog ─────────────────────────────────────────────── */}
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
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Previous refinements:</Typography>
              {refineHistory.filter(h => h.fileIndex === activeFileTab).map((h, i) => (
                <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  • {h.instruction}
                </Typography>
              ))}
            </Box>
          )}
          <TextField
            multiline minRows={3} maxRows={8} fullWidth autoFocus
            placeholder="e.g., Add pagination to the table, change the layout to 3 columns, add a search bar..."
            value={refineInstruction} onChange={(e) => setRefineInstruction(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefineDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleRefine}
            disabled={!refineInstruction.trim() || refining}
            startIcon={refining ? <CircularProgress size={16} color="inherit" /> : <RefineIcon />}
            sx={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
              textTransform: 'none', fontWeight: 600,
            }}
          >
            {refining ? 'Refining…' : 'Refine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
