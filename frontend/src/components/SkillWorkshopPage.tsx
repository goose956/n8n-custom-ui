import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Chip, IconButton,
  Alert, CircularProgress, Tabs, Tab, Divider, Tooltip, List,
  ListItemButton, ListItemText, ListItemIcon, Select, MenuItem,
  FormControl, InputLabel, Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Build as ToolIcon,
  Description as SkillIcon,
  SmartToy as ChatBotIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { API } from '../config/api';
import { SkillBuilderChat } from './SkillBuilderChat';
import { SkillOutputRenderer } from './SkillOutputRenderer';

// ── Types ─────────────────────────────────────────────────────────────

interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

interface ToolDef {
  id: string;
  name: string;
  description: string;
  parameters: ToolParam[];
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface SkillParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

interface SkillDef {
  id: string;
  name: string;
  description: string;
  prompt: string;
  tools: string[];
  inputs: SkillParam[];
  credentials: string[];
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RunResult {
  id: string;
  skillId: string;
  status: 'success' | 'error';
  output: string;
  logs: string[];
  toolCalls: { toolName: string; input: any; output: any; duration: number }[];
  duration: number;
  startedAt: string;
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export function SkillWorkshopPage() {
  // ── State ───────────────────────────────────────────────────────────
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [mode, setMode] = useState<'skill' | 'tool' | 'none'>('none');
  const [selectedId, setSelectedId] = useState('');
  const [isNew, setIsNew] = useState(false);

  // Skill editor fields
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrompt, setSPrompt] = useState('');
  const [sTools, setSTools] = useState<string[]>([]);
  const [sInputs, setSInputs] = useState<SkillParam[]>([]);
  const [sCreds, setSCreds] = useState<string[]>([]);

  // Tool editor fields
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tParams, setTParams] = useState<ToolParam[]>([]);
  const [tCode, setTCode] = useState('');

  // Run state
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [outputTab, setOutputTab] = useState(0);

  // Follow-up
  const [followUpText, setFollowUpText] = useState('');
  const [followUpRunning, setFollowUpRunning] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [skillsResp, toolsResp] = await Promise.all([
        fetch(API.skills).then(r => r.json()),
        fetch(`${API.skills}/tools`).then(r => r.json()),
      ]);
      setSkills(skillsResp.skills || []);
      setTools(toolsResp.tools || []);
    } catch (err: any) {
      setError('Failed to load: ' + err.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Select handlers ───────────────────────────────────────────────
  const selectSkill = (skill: SkillDef) => {
    setMode('skill');
    setSelectedId(skill.id);
    setIsNew(false);
    setSName(skill.name);
    setSDesc(skill.description);
    setSPrompt(skill.prompt);
    setSTools([...skill.tools]);
    setSInputs([...skill.inputs]);
    setSCreds([...skill.credentials]);
    setRunResult(null);
    setRunInputs({});
    setError('');
  };

  const selectTool = (tool: ToolDef) => {
    setMode('tool');
    setSelectedId(tool.id);
    setIsNew(false);
    setTName(tool.name);
    setTDesc(tool.description);
    setTParams([...tool.parameters]);
    setTCode(tool.code);
    setError('');
  };

  // ── New handlers ──────────────────────────────────────────────────
  const newSkill = () => {
    setMode('skill');
    setSelectedId('');
    setIsNew(true);
    setSName('');
    setSDesc('');
    setSPrompt('');
    setSTools([]);
    setSInputs([]);
    setSCreds([]);
    setRunResult(null);
    setRunInputs({});
    setError('');
  };

  const newTool = () => {
    setMode('tool');
    setSelectedId('');
    setIsNew(true);
    setTName('');
    setTDesc('');
    setTParams([]);
    setTCode('');
    setError('');
  };

  // ── Save handlers ─────────────────────────────────────────────────
  const saveSkill = async () => {
    if (!sName.trim()) { setError('Skill name is required'); return; }
    if (!sPrompt.trim()) { setError('System prompt is required'); return; }

    setSaving(true);
    setError('');
    try {
      const body = { name: sName, description: sDesc, prompt: sPrompt, tools: sTools, inputs: sInputs, credentials: sCreds };
      const url = isNew ? API.skills : `${API.skills}/${selectedId}`;
      const method = isNew ? 'POST' : 'PUT';
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (data.success) {
        setSuccess('Skill saved!');
        await loadData();
        if (isNew && data.skill) selectSkill(data.skill);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveTool = async () => {
    if (!tName.trim()) { setError('Tool name is required'); return; }
    if (!tCode.trim()) { setError('Tool code is required'); return; }

    setSaving(true);
    setError('');
    try {
      const body = { name: tName, description: tDesc, parameters: tParams, code: tCode };
      const url = isNew ? `${API.skills}/tools` : `${API.skills}/tools/${selectedId}`;
      const method = isNew ? 'POST' : 'PUT';
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (data.success) {
        setSuccess('Tool saved!');
        await loadData();
        if (isNew && data.tool) selectTool(data.tool);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────
  const deleteItem = async () => {
    if (!selectedId) return;
    const confirmMsg = mode === 'skill' ? `Delete skill "${sName}"?` : `Delete tool "${tName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const url = mode === 'skill'
        ? `${API.skills}/${selectedId}`
        : `${API.skills}/tools/${selectedId}`;
      await fetch(url, { method: 'DELETE' });
      setMode('none');
      setSelectedId('');
      await loadData();
      setSuccess('Deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Run skill ─────────────────────────────────────────────────────
  const runSkill = async () => {
    if (!selectedId || mode !== 'skill') return;

    setRunning(true);
    setRunResult(null);
    setOutputTab(0);
    setError('');
    try {
      const resp = await fetch(`${API.skills}/${selectedId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: runInputs }),
      });
      const data = await resp.json();
      if (data.result) {
        setRunResult(data.result);
      } else {
        setError('No result returned');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  // ── Follow-up: chain actions on previous output ───────────────────
  const runFollowUp = async () => {
    if (!followUpText.trim() || !runResult?.output) return;

    setFollowUpRunning(true);
    setError('');
    try {
      const resp = await fetch(`${API.skills}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousOutput: runResult.output,
          message: followUpText.trim(),
          previousSkillId: selectedId || undefined,
        }),
      });
      const data = await resp.json();
      if (data.result) {
        setRunResult(data.result);
        setOutputTab(0);
        setFollowUpText('');
      } else {
        setError('Follow-up failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFollowUpRunning(false);
    }
  };

  // ── Builder chat callback ─────────────────────────────────────────
  const handleBuilderLoad = async (data: { skill?: any; tool?: any }) => {
    try {
      // Save tool first if provided
      if (data.tool) {
        await fetch(`${API.skills}/tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.tool),
        });
      }
      // Save skill if provided
      if (data.skill) {
        const resp = await fetch(API.skills, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.skill),
        });
        const result = await resp.json();
        await loadData();
        if (result.skill) selectSkill(result.skill);
      } else {
        await loadData();
      }
      setBuilderOpen(false);
      setSuccess('Loaded from AI Builder!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to load: ' + err.message);
    }
  };

  // ── Param editor sub-component ────────────────────────────────────
  const ParamEditor = ({ params, onChange, label }: {
    params: (ToolParam | SkillParam)[];
    onChange: (p: any[]) => void;
    label: string;
  }) => (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      {params.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField size="small" label="Name" value={p.name} sx={{ width: 130 }}
            onChange={e => { const c = [...params]; c[i] = { ...c[i], name: e.target.value }; onChange(c); }} />
          <FormControl size="small" sx={{ width: 110 }}>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={p.type}
              onChange={e => { const c = [...params]; c[i] = { ...c[i], type: e.target.value as any }; onChange(c); }}>
              {['string', 'number', 'boolean', 'object', 'array'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Description" value={p.description} sx={{ flex: 1 }}
            onChange={e => { const c = [...params]; c[i] = { ...c[i], description: e.target.value }; onChange(c); }} />
          <Tooltip title="Required">
            <Checkbox checked={p.required} size="small"
              onChange={e => { const c = [...params]; c[i] = { ...c[i], required: e.target.checked }; onChange(c); }} />
          </Tooltip>
          <IconButton size="small" onClick={() => onChange(params.filter((_, j) => j !== i))}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />}
        onClick={() => onChange([...params, { name: '', type: 'string', description: '', required: true }])}>
        Add {label.includes('Input') ? 'Input' : 'Parameter'}
      </Button>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ═══════════════════ SIDEBAR ═══════════════════ */}
      <Paper sx={{
        width: 260, borderRight: 1, borderColor: 'divider',
        display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0,
      }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>Skill Workshop</Typography>
          <Tooltip title="AI Builder">
            <IconButton size="small" color="primary" onClick={() => setBuilderOpen(true)}>
              <ChatBotIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        {/* Skills section */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>Skills</Typography>
          <Tooltip title="New Skill"><IconButton size="small" onClick={newSkill}><AddIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <List dense sx={{ px: 1 }}>
          {skills.map(s => (
            <ListItemButton key={s.id} selected={mode === 'skill' && selectedId === s.id}
              onClick={() => selectSkill(s)} sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><SkillIcon fontSize="small" color="primary" /></ListItemIcon>
              <ListItemText
                primary={s.name}
                secondary={`${s.tools.length} tool${s.tools.length !== 1 ? 's' : ''}`}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
            </ListItemButton>
          ))}
          {skills.length === 0 && (
            <Typography variant="caption" sx={{ px: 2, color: 'text.disabled' }}>No skills yet</Typography>
          )}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Tools section */}
        <Box sx={{ px: 2, pt: 0.5, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>Tools</Typography>
          <Tooltip title="New Tool"><IconButton size="small" onClick={newTool}><AddIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <List dense sx={{ px: 1 }}>
          {tools.map(t => (
            <ListItemButton key={t.id} selected={mode === 'tool' && selectedId === t.id}
              onClick={() => selectTool(t)} sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><ToolIcon fontSize="small" color="secondary" /></ListItemIcon>
              <ListItemText
                primary={t.name}
                secondary={`${t.parameters.length} param${t.parameters.length !== 1 ? 's' : ''}`}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500, noWrap: true }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
            </ListItemButton>
          ))}
          {tools.length === 0 && (
            <Typography variant="caption" sx={{ px: 2, color: 'text.disabled' }}>No tools yet</Typography>
          )}
        </List>
      </Paper>

      {/* ═══════════════════ MAIN AREA ═══════════════════ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Alerts */}
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 1 }}>{success}</Alert>}

        {mode === 'none' ? (
          /* ═══ Empty state ═══ */
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>Agent Skill Workshop</Typography>
              <Typography color="text.disabled" sx={{ mb: 3, lineHeight: 1.7 }}>
                Create <strong>Tools</strong> (executable code that does one thing) and <strong>Skills</strong> (AI prompts that use tools).
                When you run a skill, the AI reasons and calls tools in an agentic loop until it has an answer.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" startIcon={<ToolIcon />} onClick={newTool}>New Tool</Button>
                <Button variant="outlined" startIcon={<SkillIcon />} onClick={newSkill}>New Skill</Button>
                <Button variant="contained" startIcon={<ChatBotIcon />} onClick={() => setBuilderOpen(true)}>AI Builder</Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            {/* ═══ EDITOR AREA ═══ */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>

              {/* Top bar: type badge + name + save/delete */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Chip
                  label={mode === 'skill' ? 'SKILL' : 'TOOL'}
                  size="small"
                  color={mode === 'skill' ? 'primary' : 'secondary'}
                  sx={{ fontWeight: 700 }}
                />
                <Typography variant="h6" sx={{ flex: 1, fontSize: 16 }}>
                  {isNew ? `New ${mode === 'skill' ? 'Skill' : 'Tool'}` : (mode === 'skill' ? sName : tName)}
                </Typography>
                <Button variant="contained" size="small" startIcon={<SaveIcon />}
                  onClick={mode === 'skill' ? saveSkill : saveTool} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {!isNew && (
                  <IconButton size="small" color="error" onClick={deleteItem}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              {mode === 'skill' ? (
                /* ──────── Skill Editor ──────── */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField label="Name" value={sName} onChange={e => setSName(e.target.value)}
                      size="small" sx={{ width: 260 }} placeholder="web-research" />
                    <TextField label="Description" value={sDesc} onChange={e => setSDesc(e.target.value)}
                      size="small" sx={{ flex: 1 }} placeholder="Research a topic and write an article" />
                  </Box>

                  {/* Tool selector */}
                  <FormControl size="small">
                    <InputLabel>Tools this skill can use</InputLabel>
                    <Select
                      multiple
                      value={sTools}
                      label="Tools this skill can use"
                      onChange={e => setSTools(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {selected.map(s => <Chip key={s} label={s} size="small" />)}
                        </Box>
                      )}
                    >
                      {tools.map(t => (
                        <MenuItem key={t.name} value={t.name}>
                          <Checkbox checked={sTools.includes(t.name)} size="small" />
                          <Typography variant="body2">{t.name} — <em>{t.description}</em></Typography>
                        </MenuItem>
                      ))}
                      {tools.length === 0 && (
                        <MenuItem disabled>
                          <Typography variant="body2" color="text.disabled">No tools created yet</Typography>
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  {/* System prompt */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      System Prompt <Typography component="span" variant="caption" color="text.secondary">(Markdown — the AI's instructions)</Typography>
                    </Typography>
                    <TextField
                      multiline
                      minRows={10}
                      maxRows={20}
                      fullWidth
                      value={sPrompt}
                      onChange={e => setSPrompt(e.target.value)}
                      placeholder={`You are a research agent. Your job is to...\n\n## Process\n1. Search for the topic\n2. Search for subtopics\n3. Write an article\n\n## Rules\n- Always cite sources`}
                      sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 } }}
                    />
                  </Box>

                  {/* Inputs */}
                  <ParamEditor params={sInputs} onChange={p => setSInputs(p)} label="Skill Inputs (what the user provides)" />

                  {/* Credentials */}
                  <TextField
                    label="Credentials needed (comma-separated)"
                    size="small"
                    value={sCreds.join(', ')}
                    onChange={e => setSCreds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="brave, openai"
                    helperText="Names of API keys this skill's tools need"
                  />
                </Box>
              ) : (
                /* ──────── Tool Editor ──────── */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField label="Name" value={tName} onChange={e => setTName(e.target.value)}
                      size="small" sx={{ width: 260 }} placeholder="brave-search" />
                    <TextField label="Description (shown to AI)" value={tDesc} onChange={e => setTDesc(e.target.value)}
                      size="small" sx={{ flex: 1 }} placeholder="Search the web using Brave Search API" />
                  </Box>

                  {/* Parameters */}
                  <ParamEditor params={tParams} onChange={p => setTParams(p)} label="Tool Parameters (what AI sends when calling)" />

                  {/* Code */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Tool Code <Typography component="span" variant="caption" color="text.secondary">
                        (body of: async function(params, ctx) {'{ ... }'})
                      </Typography>
                    </Typography>
                    <TextField
                      multiline
                      minRows={14}
                      maxRows={25}
                      fullWidth
                      value={tCode}
                      onChange={e => setTCode(e.target.value)}
                      placeholder={`// params.query — the search query\n// ctx.getCredential('brave') — get API key\n// ctx.fetch(url, opts) — HTTP request\n// ctx.log(msg) — log output\n\nconst key = ctx.getCredential('brave');\nconst resp = await ctx.fetch('https://api.example.com?q=' + params.query);\nreturn resp.body;`}
                      sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 } }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* ═══ OUTPUT PANEL ═══ (only for saved skills) */}
            {mode === 'skill' && !isNew && (<>
              <Paper sx={{
                borderTop: 2, borderColor: 'divider',
                minHeight: 220, maxHeight: 400,
                display: 'flex', flexDirection: 'column', flexShrink: 0,
              }}>
                {/* Run bar */}
                <Box sx={{
                  p: 1.5, display: 'flex', gap: 1, alignItems: 'center',
                  borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap',
                }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={running ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
                    onClick={runSkill}
                    disabled={running}
                    sx={{ fontWeight: 700 }}
                  >
                    {running ? 'Running...' : 'Run Skill'}
                  </Button>

                  {/* Quick input fields */}
                  {sInputs.map(inp => (
                    <TextField
                      key={inp.name}
                      size="small"
                      label={inp.name}
                      value={runInputs[inp.name] || ''}
                      sx={{ width: 200 }}
                      onChange={e => setRunInputs(prev => ({ ...prev, [inp.name]: e.target.value }))}
                      placeholder={inp.description}
                    />
                  ))}

                  {runResult && (
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {runResult.status === 'success'
                        ? <SuccessIcon color="success" fontSize="small" />
                        : <ErrorIcon color="error" fontSize="small" />
                      }
                      <Typography variant="caption" color="text.secondary">
                        {(runResult.duration / 1000).toFixed(1)}s · {runResult.toolCalls?.length || 0} tool calls
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Output tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={outputTab}
                    onChange={(_, v) => setOutputTab(v)}
                    sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none' } }}
                  >
                    <Tab label="Output" />
                    <Tab label="Logs" />
                    <Tab label={`Tool Calls${runResult?.toolCalls?.length ? ` (${runResult.toolCalls.length})` : ''}`} />
                  </Tabs>
                </Box>

                {/* Tab content */}
                <Box sx={{
                  flex: 1, overflow: 'auto', p: 1.5,
                  fontFamily: 'monospace', fontSize: 12, bgcolor: '#1e1e1e', color: '#d4d4d4',
                }}>
                  {!runResult && !running && (
                    <Typography color="grey.500" variant="body2" sx={{ textAlign: 'center', mt: 3, fontFamily: 'inherit' }}>
                      Click "Run Skill" to execute the agentic loop
                    </Typography>
                  )}

                  {running && (
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <CircularProgress size={24} sx={{ color: '#569cd6' }} />
                      <Typography variant="body2" sx={{ mt: 1, color: '#9cdcfe', fontFamily: 'inherit' }}>
                        Running agentic loop... The AI is reasoning and calling tools.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#808080', fontFamily: 'inherit' }}>
                        This may take 30-60 seconds depending on how many tool calls are needed.
                      </Typography>
                    </Box>
                  )}

                  {/* OUTPUT tab */}
                  {runResult && outputTab === 0 && (
                    <Box>
                      {runResult.error && (
                        <Box sx={{ p: 1, mb: 1, bgcolor: '#3b1111', borderRadius: 1, color: '#f48771' }}>
                          Error: {runResult.error}
                        </Box>
                      )}
                      <SkillOutputRenderer content={runResult.output || ''} />
                    </Box>
                  )}

                  {/* LOGS tab */}
                  {runResult && outputTab === 1 && (
                    <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#b5cea8' }}>
                      {(runResult.logs || []).join('\n') || '(no logs)'}
                    </Box>
                  )}

                  {/* TOOL CALLS tab */}
                  {runResult && outputTab === 2 && (
                    <Box>
                      {(runResult.toolCalls || []).length === 0 ? (
                        <Typography sx={{ color: '#808080', fontFamily: 'inherit' }}>(no tool calls)</Typography>
                      ) : (
                        (runResult.toolCalls || []).map((tc, i) => (
                          <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: '#252526', borderRadius: 1, border: '1px solid #333' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#dcdcaa', mb: 0.5 }}>
                              🔧 {tc.toolName}
                              <Typography component="span" sx={{ color: '#808080', fontSize: 11, ml: 1 }}>
                                {tc.duration}ms
                              </Typography>
                            </Typography>
                            <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 0.5 }}>Input:</Typography>
                            <Box component="pre" sx={{ fontSize: 11, m: 0, mt: 0.5, color: '#ce9178', overflowX: 'auto' }}>
                              {JSON.stringify(tc.input, null, 2)}
                            </Box>
                            <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 1 }}>Output:</Typography>
                            <Box component="pre" sx={{
                              fontSize: 11, m: 0, mt: 0.5, color: '#b5cea8',
                              overflowX: 'auto', maxHeight: 200, overflow: 'auto',
                            }}>
                              {JSON.stringify(tc.output, null, 2)?.slice(0, 3000)}
                            </Box>
                          </Box>
                        ))
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* ═══ Follow-up Chat Input ═══ */}
              {runResult && runResult.output && !running && (
                <Paper sx={{
                  mt: 2, p: 2, bgcolor: '#1e1e2e', border: '1px solid #333',
                  borderRadius: 2,
                }}>
                  <Typography variant="caption" sx={{ color: '#808080', mb: 1, display: 'block' }}>
                    Chain another action on this output — e.g. "save as PDF", "generate a header image", "summarize for LinkedIn"
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      size="small"
                      placeholder="What do you want to do with this output?"
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          runFollowUp();
                        }
                      }}
                      disabled={followUpRunning}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#252526',
                          color: '#d4d4d4',
                          fontSize: 13,
                          '& fieldset': { borderColor: '#404040' },
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' },
                        },
                        '& .MuiInputBase-input::placeholder': { color: '#666', opacity: 1 },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={runFollowUp}
                      disabled={followUpRunning || !followUpText.trim()}
                      sx={{
                        minWidth: 44,
                        height: 40,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
                      }}
                    >
                      {followUpRunning ? <CircularProgress size={20} /> : <SendIcon sx={{ fontSize: 18 }} />}
                    </Button>
                  </Box>
                  {followUpRunning && (
                    <Typography variant="caption" sx={{ color: '#667eea', mt: 1, display: 'block' }}>
                      Processing follow-up... this may take a moment.
                    </Typography>
                  )}
                </Paper>
              )}
            </>)}
          </>
        )}
      </Box>

      {/* ═══ Builder Chat overlay ═══ */}
      {builderOpen && (
        <SkillBuilderChat
          onClose={() => setBuilderOpen(false)}
          onLoad={handleBuilderLoad}
        />
      )}
    </Box>
  );
}
