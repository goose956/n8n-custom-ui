import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '../config/api';
import {
  Box, Typography, TextField, Button, Paper, Select, MenuItem,
  FormControl, InputLabel, Chip, CircularProgress, Tabs, Tab,
  Snackbar, Alert, Tooltip, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Grid,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Send as SendIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  Apps as AppsIcon,
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
  configured: { anthropic: boolean; openai: boolean };
  defaults: { orchestrator: string; subAgent: string };
}

interface GenerateResponse {
  success: boolean;
  plan: PlanStep[];
  files: GeneratedFile[];
  summary: string;
  tokensUsed: { orchestrator: number; subAgent: number; total: number };
  modelsUsed: { orchestrator: string; subAgent: string };
  error?: string;
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

type TargetType = 'page' | 'component' | 'feature' | 'full-stack';

/* ─── Main component ─────────────────────────────────────────────────── */

export function ProgrammerAgentPage() {
  // State
  const [prompt, setPrompt] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('page');
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [summary, setSummary] = useState('');
  const [tokensUsed, setTokensUsed] = useState<{ orchestrator: number; subAgent: number; total: number } | null>(null);
  const [activeFileTab, setActiveFileTab] = useState(0);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [orchestratorModel, setOrchestratorModel] = useState('');
  const [subAgentModel, setSubAgentModel] = useState('');
  const [configured, setConfigured] = useState({ anthropic: false, openai: false });
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });
  const [showPlan, setShowPlan] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [refineDialog, setRefineDialog] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Load models, stats, and apps on mount
  useEffect(() => {
    loadModels();
    loadStats();
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const res = await fetch(API.apps);
      const json = await res.json();
      const appList = Array.isArray(json) ? json : json.data || json.apps || [];
      setApps(appList.filter((a: AppInfo) => a.active));
    } catch { /* ignore */ }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId) || null;

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

  const orchestratorModels = models.filter(m => m.tier === 'orchestrator' || m.tier === 'both');
  const subAgentModels = models.filter(m => m.tier === 'sub-agent' || m.tier === 'both');

  /* ─── Generate ─────────────────────────────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
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
          targetType,
          appId: selectedAppId || undefined,
          orchestratorModel: orchestratorModel || undefined,
          subAgentModel: subAgentModel || undefined,
          conversationHistory,
        }),
      });

      const data: GenerateResponse = await res.json();

      if (data.success) {
        setPlan(data.plan);
        setFiles(data.files);
        setSummary(data.summary);
        setTokensUsed(data.tokensUsed);
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: prompt.trim() },
          { role: 'assistant', content: data.summary },
        ]);
        setSnack({ open: true, msg: `Generated ${data.files.length} file(s) — ${data.tokensUsed.total.toLocaleString()} tokens used`, severity: 'success' });
        loadStats();
      } else {
        setSnack({ open: true, msg: data.error || 'Generation failed', severity: 'error' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [prompt, targetType, selectedAppId, orchestratorModel, subAgentModel, conversationHistory, generating]);

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
        setSnack({ open: true, msg: 'File refined successfully', severity: 'success' });
        setRefineDialog(false);
        setRefineInstruction('');
      } else {
        setSnack({ open: true, msg: data.error || 'Refine failed', severity: 'error' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setRefining(false);
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
      const msg = err instanceof Error ? err.message : 'Network error';
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Copy ─────────────────────────────────────────────────────────── */

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, msg: 'Copied to clipboard', severity: 'info' });
  };

  /* ─── Key handler ──────────────────────────────────────────────────── */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const noKeysConfigured = !configured.anthropic && !configured.openai;

  /* ─── Render ───────────────────────────────────────────────────────── */

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AgentIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>Programmer Agent</Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered code generation with cost-optimized model routing
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TokenIcon />}
            onClick={() => setShowStats(!showStats)}
          >
            Usage Stats
          </Button>
        </Box>
      </Box>

      {/* API key warning */}
      {noKeysConfigured && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          No API keys configured. Go to <strong>Settings → API Keys</strong> and add your Anthropic or OpenAI key.
        </Alert>
      )}

      {/* Stats panel */}
      <Collapse in={showStats}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '1rem' }}>Usage Statistics</Typography>
          {stats ? (
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>{stats.sessions}</Typography>
                  <Typography variant="caption" color="text.secondary">Sessions</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>{stats.totalTokens.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Tokens</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2' }}>{stats.orchestratorTokens.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Orchestrator</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>{stats.subAgentTokens.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Sub-Agent (saved)</Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">No usage data yet.</Typography>
          )}
        </Paper>
      </Collapse>

      {/* Main layout: prompt + config | output */}
      <Box sx={{ display: 'grid', gridTemplateColumns: files.length > 0 ? '1fr 1.4fr' : '1fr', gap: 3 }}>
        {/* Left column: input */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Prompt input */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>What would you like to build?</Typography>
            <TextField
              inputRef={promptRef}
              multiline
              minRows={5}
              maxRows={14}
              fullWidth
              placeholder="Describe the page, component, or feature you want to build...&#10;&#10;Example: Create a customer management page with a data table, search/filter bar, add/edit customer dialog, and export to CSV button. Include proper loading states and error handling."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.9rem' } }}
            />

            {/* Project + Target type + Generate */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={selectedAppId}
                  label="Project"
                  onChange={(e) => setSelectedAppId(e.target.value as number | '')}
                  renderValue={(val) => {
                    const app = apps.find(a => a.id === val);
                    if (!app) return 'No project';
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <span>{app.name}</span>
                      </Box>
                    );
                  }}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AppsIcon sx={{ fontSize: 16, color: '#999' }} />
                      <em>No project (generic)</em>
                    </Box>
                  </MenuItem>
                  {apps.map(app => (
                    <MenuItem key={app.id} value={app.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <span>{app.name}</span>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', pl: 1 }}>{app.slug}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Target</InputLabel>
                <Select value={targetType} label="Target" onChange={(e) => setTargetType(e.target.value as TargetType)}>
                  <MenuItem value="page">Full Page</MenuItem>
                  <MenuItem value="component">Component</MenuItem>
                  <MenuItem value="feature">Feature</MenuItem>
                  <MenuItem value="full-stack">Full-Stack</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating || noKeysConfigured}
                startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{
                  ml: 'auto',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)' },
                }}
              >
                {generating ? 'Generating…' : 'Generate'}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Ctrl+Enter to generate
            </Typography>

            {/* Selected app context banner */}
            {selectedApp && (
              <Box sx={{
                mt: 2, p: 1.5, borderRadius: 2,
                bgcolor: `${selectedApp.primary_color}08`,
                border: `1px solid ${selectedApp.primary_color}25`,
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: 2,
                  bgcolor: selectedApp.primary_color,
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
                    Generated code will match this app's color scheme ({selectedApp.primary_color}) and style
                  </Typography>
                </Box>
                <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: selectedApp.primary_color, border: '1px solid rgba(0,0,0,0.1)' }} />
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
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Orchestrator (complex tasks)</Typography>
                </Box>
                <FormControl size="small" fullWidth>
                  <Select
                    value={orchestratorModel}
                    onChange={(e) => setOrchestratorModel(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                  >
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
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Sub-Agent (types, styles, utils)</Typography>
                </Box>
                <FormControl size="small" fullWidth>
                  <Select
                    value={subAgentModel}
                    onChange={(e) => setSubAgentModel(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                  >
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

          {/* Plan display */}
          {plan.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Execution Plan</Typography>
                <IconButton size="small" onClick={() => setShowPlan(!showPlan)}>
                  {showPlan ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              </Box>
              <Collapse in={showPlan}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {plan.map((step) => (
                    <Box key={step.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, borderRadius: 2,
                      bgcolor: step.status === 'complete' ? 'rgba(76,175,80,0.04)' :
                               step.status === 'failed' ? 'rgba(244,67,54,0.04)' :
                               step.status === 'running' ? 'rgba(102,126,234,0.04)' : 'transparent',
                      border: '1px solid',
                      borderColor: step.status === 'complete' ? 'rgba(76,175,80,0.15)' :
                                   step.status === 'failed' ? 'rgba(244,67,54,0.15)' :
                                   step.status === 'running' ? 'rgba(102,126,234,0.15)' : 'rgba(0,0,0,0.06)',
                    }}>
                      {step.status === 'complete' ? <DoneIcon sx={{ fontSize: 18, color: '#4caf50' }} /> :
                       step.status === 'failed' ? <ErrorIcon sx={{ fontSize: 18, color: '#f44336' }} /> :
                       step.status === 'running' ? <RunningIcon sx={{ fontSize: 18, color: '#667eea' }} /> :
                       <PendingIcon sx={{ fontSize: 18, color: '#999' }} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{step.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{step.description}</Typography>
                      </Box>
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
              </Collapse>
            </Paper>
          )}

          {/* Token usage */}
          {tokensUsed && (
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.82rem' }}>Token Usage</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title="Orchestrator tokens (expensive model)">
                  <Chip icon={<OrchestratorIcon />} label={`${tokensUsed.orchestrator.toLocaleString()}`} size="small"
                    sx={{ bgcolor: 'rgba(118,75,162,0.1)', color: '#764ba2', fontWeight: 600 }} />
                </Tooltip>
                <Tooltip title="Sub-agent tokens (cheap model)">
                  <Chip icon={<SpeedIcon />} label={`${tokensUsed.subAgent.toLocaleString()}`} size="small"
                    sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', fontWeight: 600 }} />
                </Tooltip>
                <Chip label={`Total: ${tokensUsed.total.toLocaleString()}`} size="small"
                  sx={{ bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea', fontWeight: 600 }} />
              </Box>
            </Paper>
          )}
        </Box>

        {/* Right column: output */}
        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary */}
            {summary && (
              <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(102,126,234,0.15)', bgcolor: 'rgba(102,126,234,0.02)' }} elevation={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea', fontSize: '0.85rem' }}>{summary}</Typography>
              </Paper>
            )}

            {/* File tabs + actions */}
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, bgcolor: '#f8f9fa' }}>
                <Tabs
                  value={activeFileTab}
                  onChange={(_, v) => setActiveFileTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.5 },
                    '& .Mui-selected': { color: '#667eea' },
                    '& .MuiTabs-indicator': { backgroundColor: '#667eea' },
                  }}
                >
                  {files.map((f, i) => (
                    <Tab key={i} icon={<FileIcon sx={{ fontSize: 14, mr: 0.5 }} />} iconPosition="start"
                      label={f.path.split('/').pop()} />
                  ))}
                </Tabs>
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
                </Box>
              </Box>

              {/* File path label */}
              <Box sx={{ px: 2, py: 0.5, bgcolor: '#f0f1f3', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.72rem' }}>
                  {files[activeFileTab]?.path}
                </Typography>
              </Box>

              {/* Code display */}
              <Box sx={{
                p: 2,
                maxHeight: 520,
                overflow: 'auto',
                bgcolor: '#1e1e2e',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#444', borderRadius: 4 },
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: '#cdd6f4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {files[activeFileTab]?.content || ''}
                </pre>
              </Box>
            </Paper>

            {/* Save button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => { setFiles([]); setPlan([]); setSummary(''); setTokensUsed(null); setPrompt(''); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', px: 3,
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)' },
                }}
              >
                {saving ? 'Saving…' : `Save ${files.length} File(s) to Project`}
              </Button>
            </Box>
          </Box>
        )}

        {/* Empty state when no files */}
        {files.length === 0 && !generating && (
          <Box sx={{
            display: files.length === 0 ? 'none' : 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            p: 6, borderRadius: 3, border: '2px dashed rgba(0,0,0,0.08)',
          }}>
            <CodeIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography color="text.secondary">Generated files will appear here</Typography>
          </Box>
        )}
      </Box>

      {/* Generating progress */}
      {generating && (
        <Paper sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px solid rgba(102,126,234,0.2)' }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={20} sx={{ color: '#667eea' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
              Generating code with orchestrator + sub-agents…
            </Typography>
          </Box>
          <LinearProgress sx={{
            borderRadius: 4, height: 6,
            bgcolor: 'rgba(102,126,234,0.1)',
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #667eea, #764ba2)' },
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Orchestrator plans → Sub-agents generate types/styles → Orchestrator assembles final code
          </Typography>
        </Paper>
      )}

      {/* Refine dialog */}
      <Dialog open={refineDialog} onClose={() => setRefineDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Refine: {files[activeFileTab]?.path.split('/').pop()}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe the changes you want for this file. The AI will regenerate it with your instructions.
          </Typography>
          <TextField
            multiline minRows={3} maxRows={8} fullWidth autoFocus
            placeholder="e.g., Add pagination to the table, change the color scheme to blue, add a delete confirmation dialog..."
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefineDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRefine}
            disabled={!refineInstruction.trim() || refining}
            startIcon={refining ? <CircularProgress size={16} color="inherit" /> : <RefineIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none', fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)' },
            }}
          >
            {refining ? 'Refining…' : 'Refine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}
          sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
