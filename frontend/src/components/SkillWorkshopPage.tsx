import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Chip, IconButton,
  Alert, CircularProgress, Tabs, Tab, Divider, Tooltip, List,
  ListItemButton, ListItemText, ListItemIcon, Select, MenuItem,
  FormControl, InputLabel, Checkbox, InputAdornment, Collapse,
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
  Search as SearchIcon,
  Input as InputsIcon,
  Memory as ProcessingIcon,
  Output as OutputsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { API } from '../config/api';
import { SkillBuilderChat } from './SkillBuilderChat';
import { SkillOutputRenderer } from './SkillOutputRenderer';
import { AgentChatPanel } from './AgentChatPanel';

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

type SkillCategory = 'inputs' | 'processing' | 'outputs' | 'other';

interface SkillDef {
  id: string;
  name: string;
  description: string;
  prompt: string;
  tools: string[];
  inputs: SkillParam[];
  credentials: string[];
  enabled: boolean;
  category: SkillCategory;
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
  const [mode, setMode] = useState<'skill' | 'tool' | 'chat' | 'none'>('none');
  const [selectedId, setSelectedId] = useState('');
  const [isNew, setIsNew] = useState(false);

  // Skill editor fields
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrompt, setSPrompt] = useState('');
  const [sTools, setSTools] = useState<string[]>([]);
  const [sInputs, setSInputs] = useState<SkillParam[]>([]);
  const [sCreds, setSCreds] = useState<string[]>([]);
  const [sCategory, setSCategory] = useState<SkillCategory>('other');

  // Sidebar search & collapsed groups
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Tool editor fields
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tParams, setTParams] = useState<ToolParam[]>([]);
  const [tCode, setTCode] = useState('');

  // Run state
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runInstructions, setRunInstructions] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [outputTab, setOutputTab] = useState(0);
  const [progressSteps, setProgressSteps] = useState<Array<{ type: string; message: string; elapsed?: number; phase?: string; tool?: string }>>([]);

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
    setSCategory(skill.category || 'other');
    setRunResult(null);
    setRunInputs({});
    setProgressSteps([]);
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
    setSCategory('other');
    setRunResult(null);
    setRunInputs({});
    setProgressSteps([]);
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
      const body = { name: sName, description: sDesc, prompt: sPrompt, tools: sTools, inputs: sInputs, credentials: sCreds, category: sCategory };
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

  // ── Run skill (streaming) ───────────────────────────────────────
  const runSkill = async () => {
    if (!selectedId || mode !== 'skill') return;

    setRunning(true);
    setRunResult(null);
    setProgressSteps([]);
    setOutputTab(0);
    setError('');
    try {
      const resp = await fetch(`${API.skills}/${selectedId}/run-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: runInputs, instructions: runInstructions || undefined }),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text();
        setError(text || 'Stream failed');
        setRunning(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processEvents = (text: string, isFinal: boolean) => {
        buffer += text;
        const lines = buffer.split('\n');
        // If not final, keep the last (possibly incomplete) line in the buffer
        buffer = isFinal ? '' : (lines.pop() || '');

        let eventType = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6);
          } else if (line.trim() === '') {
            // Empty line = end of event
            if (eventType && dataStr) {
              try {
                const payload = JSON.parse(dataStr);
                if (eventType === 'progress') {
                  setProgressSteps(prev => [...prev, payload]);
                } else if (eventType === 'done') {
                  if (payload.result) {
                    setRunResult(payload.result);
                  } else {
                    setError('No result returned');
                  }
                } else if (eventType === 'error') {
                  setError(payload.message || 'Run failed');
                }
              } catch { /* ignore parse errors */ }
            }
            eventType = '';
            dataStr = '';
          }
        }

        // On final flush, process any trailing event that didn't end with empty line
        if (isFinal && eventType && dataStr) {
          try {
            const payload = JSON.parse(dataStr);
            if (eventType === 'done') {
              if (payload.result) setRunResult(payload.result);
            } else if (eventType === 'error') {
              setError(payload.message || 'Run failed');
            }
          } catch { /* ignore */ }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any remaining buffer
          processEvents('', true);
          break;
        }
        processEvents(decoder.decode(value, { stream: true }), false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
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
  //  CATEGORY CONFIG & GROUPED SKILLS
  // ══════════════════════════════════════════════════════════════════
  const CATEGORY_META: Record<SkillCategory, { label: string; icon: React.ReactNode; color: string }> = {
    inputs:     { label: 'Inputs',     icon: <InputsIcon fontSize="small" />,     color: '#4caf50' },
    processing: { label: 'Processing', icon: <ProcessingIcon fontSize="small" />, color: '#ff9800' },
    outputs:    { label: 'Outputs',    icon: <OutputsIcon fontSize="small" />,    color: '#2196f3' },
    other:      { label: 'Other',      icon: <CategoryIcon fontSize="small" />,   color: '#9e9e9e' },
  };
  const CATEGORY_ORDER: SkillCategory[] = ['inputs', 'processing', 'outputs', 'other'];

  const filteredSkills = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return skills;
    return skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      s.tools.some(t => t.toLowerCase().includes(q))
    );
  }, [skills, sidebarSearch]);

  const filteredTools = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return tools;
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }, [tools, sidebarSearch]);

  const groupedSkills = useMemo(() => {
    const groups: Record<SkillCategory, SkillDef[]> = { inputs: [], processing: [], outputs: [], other: [] };
    for (const s of filteredSkills) {
      const cat = (s.category && s.category in groups) ? s.category : 'other';
      groups[cat].push(s);
    }
    return groups;
  }, [filteredSkills]);

  const toggleGroup = (cat: string) =>
    setCollapsedGroups(prev => ({ ...prev, [cat]: !prev[cat] }));

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ═══════════════════ SIDEBAR ═══════════════════ */}
      <Paper sx={{
        width: 280, borderRight: 1, borderColor: 'divider',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>Skill Workshop</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Agent Chat">
              <IconButton size="small" color={mode === 'chat' ? 'primary' : 'default'} onClick={() => setMode('chat')}>
                <ChatBotIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="AI Builder">
              <IconButton size="small" color="primary" onClick={() => setBuilderOpen(true)}>
                <ChatBotIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Divider />

        {/* Search */}
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search skills & tools..."
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': { fontSize: 13, height: 34 },
            }}
          />
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>

          {/* ── Skills ── */}
          <Box sx={{ px: 1.5, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>Skills</Typography>
            <Tooltip title="New Skill"><IconButton size="small" onClick={newSkill}><AddIcon fontSize="small" /></IconButton></Tooltip>
          </Box>

          {CATEGORY_ORDER.map(cat => {
            const catSkills = groupedSkills[cat];
            if (catSkills.length === 0) return null;
            const meta = CATEGORY_META[cat];
            const collapsed = !!collapsedGroups[cat];
            return (
              <Box key={cat} sx={{ mb: 0.5 }}>
                {/* Category header */}
                <Box
                  onClick={() => toggleGroup(cat)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1.5, py: 0.5, cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, mx: 0.5,
                  }}
                >
                  <Box sx={{ color: meta.color, display: 'flex', alignItems: 'center' }}>{meta.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: meta.color, flex: 1, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {meta.label}
                  </Typography>
                  <Chip label={catSkills.length} size="small" sx={{ height: 18, fontSize: 10, minWidth: 20 }} />
                  {collapsed ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} /> : <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                </Box>

                <Collapse in={!collapsed}>
                  <List dense sx={{ px: 0.5, py: 0 }}>
                    {catSkills.map(s => (
                      <ListItemButton key={s.id} selected={mode === 'skill' && selectedId === s.id}
                        onClick={() => selectSkill(s)} sx={{ borderRadius: 1, mb: 0.3, py: 0.4 }}>
                        <ListItemIcon sx={{ minWidth: 26 }}><SkillIcon sx={{ fontSize: 16, color: meta.color }} /></ListItemIcon>
                        <ListItemText
                          primary={s.name}
                          secondary={`${s.tools.length} tool${s.tools.length !== 1 ? 's' : ''}`}
                          primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, noWrap: true }}
                          secondaryTypographyProps={{ fontSize: 10.5 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          })}

          {filteredSkills.length === 0 && (
            <Typography variant="caption" sx={{ px: 2, color: 'text.disabled', display: 'block', py: 1 }}>
              {sidebarSearch ? 'No matching skills' : 'No skills yet'}
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          {/* ── Tools ── */}
          <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>Tools</Typography>
            <Tooltip title="New Tool"><IconButton size="small" onClick={newTool}><AddIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
          <List dense sx={{ px: 0.5 }}>
            {filteredTools.map(t => (
              <ListItemButton key={t.id} selected={mode === 'tool' && selectedId === t.id}
                onClick={() => selectTool(t)} sx={{ borderRadius: 1, mb: 0.3, py: 0.4 }}>
                <ListItemIcon sx={{ minWidth: 26 }}><ToolIcon sx={{ fontSize: 16 }} color="secondary" /></ListItemIcon>
                <ListItemText
                  primary={t.name}
                  secondary={`${t.parameters.length} param${t.parameters.length !== 1 ? 's' : ''}`}
                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, noWrap: true }}
                  secondaryTypographyProps={{ fontSize: 10.5 }}
                />
              </ListItemButton>
            ))}
            {filteredTools.length === 0 && (
              <Typography variant="caption" sx={{ px: 2, color: 'text.disabled' }}>
                {sidebarSearch ? 'No matching tools' : 'No tools yet'}
              </Typography>
            )}
          </List>
        </Box>
      </Paper>

      {/* ═══════════════════ MAIN AREA ═══════════════════ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Alerts */}
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 1 }}>{success}</Alert>}

        {mode === 'chat' ? (
          /* ═══ Agent Chat (full area) ═══ */
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <AgentChatPanel />
          </Box>
        ) : mode === 'none' ? (
          /* ═══ Empty state ═══ */
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>Agent Skill Workshop</Typography>
              <Typography color="text.disabled" sx={{ mb: 3, lineHeight: 1.7 }}>
                Create <strong>Tools</strong> (executable code that does one thing) and <strong>Skills</strong> (AI prompts that use tools).
                When you run a skill, the AI reasons and calls tools in an agentic loop until it has an answer.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<ChatBotIcon />} onClick={() => setMode('chat')} color="primary">
                  Agent Chat
                </Button>
                <Button variant="outlined" startIcon={<ToolIcon />} onClick={newTool}>New Tool</Button>
                <Button variant="outlined" startIcon={<SkillIcon />} onClick={newSkill}>New Skill</Button>
                <Button variant="outlined" startIcon={<ChatBotIcon />} onClick={() => setBuilderOpen(true)}>AI Builder</Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            {/* ═══ EDITOR AREA ═══ */}
            <Box sx={{ flex: '1 1 auto', overflow: 'auto', p: 2, minHeight: 200 }}>

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
                      size="small" sx={{ width: 200 }} placeholder="web-research" />
                    <TextField label="Description" value={sDesc} onChange={e => setSDesc(e.target.value)}
                      size="small" sx={{ flex: 1 }} placeholder="Research a topic and write an article" />
                    <FormControl size="small" sx={{ width: 140 }}>
                      <InputLabel>Category</InputLabel>
                      <Select label="Category" value={sCategory} onChange={e => setSCategory(e.target.value as SkillCategory)}>
                        {CATEGORY_ORDER.map(cat => (
                          <MenuItem key={cat} value={cat}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ color: CATEGORY_META[cat].color, display: 'flex' }}>{CATEGORY_META[cat].icon}</Box>
                              {CATEGORY_META[cat].label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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

            {/* ═══ RUN BAR + TWO OUTPUT PANELS ═══ (only for saved skills) */}
            {mode === 'skill' && !isNew && (<>
              {/* ── Run bar ── */}
              <Paper sx={{ borderTop: 2, borderColor: 'divider', flexShrink: 0 }}>
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

                  {/* Instructions — free-form intent */}
                  <TextField
                    size="small"
                    label="Instructions (optional)"
                    value={runInstructions}
                    onChange={e => setRunInstructions(e.target.value)}
                    placeholder='e.g. "write 1000 words and save as PDF"'
                    sx={{ flex: 1, minWidth: 260 }}
                  />

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
              </Paper>

              {/* ── Two side-by-side panels ── */}
              <Box sx={{ display: 'flex', gap: 1.5, flex: '0 0 auto', height: 340, minHeight: 240 }}>

                {/* ── LEFT: Activity feed (live progress) ── */}
                <Paper sx={{
                  flex: '0 0 320px', display: 'flex', flexDirection: 'column',
                  overflow: 'hidden', bgcolor: '#1a1a2e',
                }}>
                  <Box sx={{
                    px: 1.5, py: 1, borderBottom: '1px solid #333',
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}>
                    {running && <CircularProgress size={14} sx={{ color: '#569cd6' }} />}
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#9cdcfe', fontFamily: 'monospace' }}>
                      Activity
                    </Typography>
                    {progressSteps.length > 0 && (
                      <Typography sx={{ fontSize: 10, color: '#666', ml: 'auto' }}>
                        {progressSteps.length} events
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{
                    flex: 1, overflow: 'auto', px: 1.5, py: 1,
                    display: 'flex', flexDirection: 'column', gap: 0.4,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 },
                  }}>
                    {progressSteps.length === 0 && !running && (
                      <Typography sx={{ color: '#555', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', mt: 3 }}>
                        Run a skill to see activity
                      </Typography>
                    )}
                    {progressSteps.length === 0 && running && (
                      <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>
                        Connecting...
                      </Typography>
                    )}
                    {progressSteps.map((step, i) => {
                      const isLatest = i === progressSteps.length - 1;
                      const icon = step.type === 'phase' ? '📋'
                        : step.type === 'tool-start' ? '🔧'
                        : step.type === 'tool-done' ? '✅'
                        : step.type === 'step' ? '▸'
                        : step.type === 'error' ? '❌'
                        : step.type === 'done' ? '🏁'
                        : 'ℹ️';
                      return (
                        <Box key={i} sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 0.75,
                          opacity: isLatest && running ? 1 : 0.75,
                          py: 0.15,
                        }}>
                          <Typography sx={{ fontSize: 11, lineHeight: 1.4, flexShrink: 0 }}>{icon}</Typography>
                          <Typography sx={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            lineHeight: 1.4,
                            color: step.type === 'phase' ? '#dcdcaa'
                              : step.type === 'tool-start' ? '#569cd6'
                              : step.type === 'tool-done' ? '#b5cea8'
                              : step.type === 'error' ? '#f48771'
                              : step.type === 'done' ? '#4ec9b0'
                              : '#d4d4d4',
                            fontWeight: step.type === 'phase' ? 700 : 400,
                            flex: 1,
                          }}>
                            {step.message}
                          </Typography>
                          {step.elapsed != null && (
                            <Typography sx={{ fontSize: 9, color: '#555', flexShrink: 0, whiteSpace: 'nowrap', lineHeight: 1.6 }}>
                              {(step.elapsed / 1000).toFixed(1)}s
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>

                {/* ── RIGHT: Result output (tabs) ── */}
                <Paper sx={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
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
                        Click "Run Skill" to execute
                      </Typography>
                    )}

                    {running && !runResult && outputTab === 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
                        <CircularProgress size={16} sx={{ color: '#569cd6' }} />
                        <Typography sx={{ color: '#808080', fontSize: 12, fontFamily: 'monospace' }}>
                          Waiting for result...
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
              </Box>
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
