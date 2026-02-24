import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Chip, IconButton,
  Alert, CircularProgress, Tabs, Tab, Divider, Tooltip, List,
  ListItemButton, ListItemText, ListItemIcon,
  InputAdornment, Collapse,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
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
import { SkillOutputRenderer } from './SkillOutputRenderer';
import { AgentChatPanel } from './AgentChatPanel';

// ── Types ─────────────────────────────────────────────────────────────

interface ToolDef {
  id: string;
  name: string;
  description: string;
  parameters: any[];
}

interface SkillParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
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
}

interface RunResult {
  id: string;
  skillId: string;
  status: 'success' | 'error';
  output: string;
  logs: string[];
  toolCalls: { toolName: string; input: any; output: any; duration: number }[];
  duration: number;
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export function MemberSkillConsolePage() {
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [mode, setMode] = useState<'skill' | 'chat' | 'none'>('none');
  const [selectedId, setSelectedId] = useState('');

  // Skill fields (read-only)
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sTools, setSTools] = useState<string[]>([]);
  const [sInputs, setSInputs] = useState<SkillParam[]>([]);


  // Sidebar
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Run state
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runInstructions, setRunInstructions] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [outputTab, setOutputTab] = useState(0);
  const [progressSteps, setProgressSteps] = useState<Array<{ type: string; message: string; elapsed?: number; phase?: string; tool?: string }>>([]);

  // UI
  const [error, setError] = useState('');

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

  // ── Select skill ──────────────────────────────────────────────────
  const selectSkill = (skill: SkillDef) => {
    setMode('skill');
    setSelectedId(skill.id);
    setSName(skill.name);
    setSDesc(skill.description);
    setSTools([...skill.tools]);
    setSInputs([...skill.inputs]);
    setRunResult(null);
    setRunInputs({});
    setProgressSteps([]);
    setError('');
  };

  // ── Run skill (streaming) ────────────────────────────────────────
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
        setError(await resp.text() || 'Stream failed');
        setRunning(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processEvents = (text: string, isFinal: boolean) => {
        buffer += text;
        const lines = buffer.split('\n');
        buffer = isFinal ? '' : (lines.pop() || '');

        let eventType = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
          else if (line.trim() === '') {
            if (eventType && dataStr) {
              try {
                const payload = JSON.parse(dataStr);
                if (eventType === 'progress') setProgressSteps(prev => [...prev, payload]);
                else if (eventType === 'done' && payload.result) setRunResult(payload.result);
                else if (eventType === 'error') setError(payload.message || 'Run failed');
              } catch { /* ignore */ }
            }
            eventType = '';
            dataStr = '';
          }
        }
        if (isFinal && eventType && dataStr) {
          try {
            const payload = JSON.parse(dataStr);
            if (eventType === 'done' && payload.result) setRunResult(payload.result);
            else if (eventType === 'error') setError(payload.message || 'Run failed');
          } catch { /* ignore */ }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) { processEvents('', true); break; }
        processEvents(decoder.decode(value, { stream: true }), false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  // ── Category config ────────────────────────────────────────────
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
      s.tools.some(t => t.toLowerCase().includes(q))
    );
  }, [skills, sidebarSearch]);

  const filteredTools = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return tools;
    return tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
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

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ═══ SIDEBAR ═══ */}
      <Paper sx={{
        width: 260, borderRight: 1, borderColor: 'divider',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
      }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700 }}>AI Skills</Typography>
          <Tooltip title="Chat with AI">
            <IconButton size="small" color={mode === 'chat' ? 'primary' : 'default'} onClick={() => setMode('chat')}>
              <ChatBotIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <TextField
            size="small" fullWidth placeholder="Search skills..."
            value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            }}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: 13, height: 34 } }}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Skills by category */}
          {CATEGORY_ORDER.map(cat => {
            const catSkills = groupedSkills[cat];
            if (catSkills.length === 0) return null;
            const meta = CATEGORY_META[cat];
            const collapsed = !!collapsedGroups[cat];
            return (
              <Box key={cat} sx={{ mb: 0.5 }}>
                <Box
                  onClick={() => toggleGroup(cat)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5,
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, mx: 0.5,
                  }}
                >
                  <Box sx={{ color: meta.color, display: 'flex', alignItems: 'center' }}>{meta.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: meta.color, flex: 1, fontSize: 11, textTransform: 'uppercase' }}>
                    {meta.label}
                  </Typography>
                  <Chip label={catSkills.length} size="small" sx={{ height: 18, fontSize: 10 }} />
                  {collapsed ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ExpandLessIcon sx={{ fontSize: 16 }} />}
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

          {/* Tools (read-only listing) */}
          <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>Available Tools</Typography>
          </Box>
          <List dense sx={{ px: 0.5 }}>
            {filteredTools.map(t => (
              <ListItemButton key={t.id} sx={{ borderRadius: 1, mb: 0.3, py: 0.4, cursor: 'default' }}>
                <ListItemIcon sx={{ minWidth: 26 }}><ToolIcon sx={{ fontSize: 16 }} color="secondary" /></ListItemIcon>
                <ListItemText
                  primary={t.name}
                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, noWrap: true }}
                  secondaryTypographyProps={{ fontSize: 10.5 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Paper>

      {/* ═══ MAIN AREA ═══ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>{error}</Alert>}

        {mode === 'chat' ? (
          <Box sx={{ flex: 1, overflow: 'hidden' }}><AgentChatPanel /></Box>
        ) : mode === 'none' ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
              <ChatBotIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>AI Skills Console</Typography>
              <Typography color="text.disabled" sx={{ mb: 3, lineHeight: 1.7 }}>
                Select a skill from the sidebar to run it, or open the <strong>AI Chat</strong> to have a conversation.
              </Typography>
              <Button variant="contained" startIcon={<ChatBotIcon />} onClick={() => setMode('chat')}>
                Open AI Chat
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Skill detail (read-only) */}
            <Box sx={{ flex: '1 1 auto', overflow: 'auto', p: 2, minHeight: 200 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Chip label="SKILL" size="small" color="primary" sx={{ fontWeight: 700 }} />
                <Typography variant="h6" sx={{ flex: 1, fontSize: 16 }}>{sName}</Typography>
              </Box>

              {/* Description */}
              {sDesc && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {sDesc}
                </Typography>
              )}

              {/* Tags: tools + category */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {sTools.map(t => <Chip key={t} label={t} size="small" variant="outlined" icon={<ToolIcon sx={{ fontSize: 14 }} />} />)}
              </Box>
            </Box>

            {/* ═══ RUN BAR + OUTPUT ═══ */}
            <Paper sx={{ borderTop: 2, borderColor: 'divider', flexShrink: 0 }}>
              <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center', borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
                <Button
                  variant="contained" color="success" size="small"
                  startIcon={running ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
                  onClick={runSkill} disabled={running} sx={{ fontWeight: 700 }}
                >
                  {running ? 'Running...' : 'Run Skill'}
                </Button>
                {sInputs.map(inp => (
                  <TextField key={inp.name} size="small" label={inp.name} value={runInputs[inp.name] || ''}
                    sx={{ width: 200 }} onChange={e => setRunInputs(prev => ({ ...prev, [inp.name]: e.target.value }))}
                    placeholder={inp.description} />
                ))}
                <TextField
                  size="small" label="Instructions (optional)" value={runInstructions}
                  onChange={e => setRunInstructions(e.target.value)}
                  placeholder='e.g. "write 1000 words and save as PDF"'
                  sx={{ flex: 1, minWidth: 260 }}
                />
                {runResult && (
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {runResult.status === 'success' ? <SuccessIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                    <Typography variant="caption" color="text.secondary">
                      {(runResult.duration / 1000).toFixed(1)}s · {runResult.toolCalls?.length || 0} tool calls
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Two side-by-side panels */}
            <Box sx={{ display: 'flex', gap: 1.5, flex: '0 0 auto', height: 340, minHeight: 240 }}>
              {/* Activity feed */}
              <Paper sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#1a1a2e' }}>
                <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {running && <CircularProgress size={14} sx={{ color: '#569cd6' }} />}
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#9cdcfe', fontFamily: 'monospace' }}>Activity</Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  {progressSteps.length === 0 && !running && (
                    <Typography sx={{ color: '#555', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', mt: 3 }}>
                      Run a skill to see activity
                    </Typography>
                  )}
                  {progressSteps.map((step, i) => {
                    const icon = step.type === 'phase' ? '📋' : step.type === 'tool-start' ? '🔧' : step.type === 'tool-done' ? '✅' : step.type === 'error' ? '❌' : step.type === 'done' ? '🏁' : '▸';
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.15 }}>
                        <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{icon}</Typography>
                        <Typography sx={{
                          fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, flex: 1,
                          color: step.type === 'phase' ? '#dcdcaa' : step.type === 'tool-start' ? '#569cd6' : step.type === 'tool-done' ? '#b5cea8' : step.type === 'error' ? '#f48771' : '#d4d4d4',
                          fontWeight: step.type === 'phase' ? 700 : 400,
                        }}>
                          {step.message}
                        </Typography>
                        {step.elapsed != null && (
                          <Typography sx={{ fontSize: 9, color: '#555', flexShrink: 0, lineHeight: 1.6 }}>{(step.elapsed / 1000).toFixed(1)}s</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Output panel */}
              <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={outputTab} onChange={(_, v) => setOutputTab(v)}
                    sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none' } }}>
                    <Tab label="Output" />
                    <Tab label="Logs" />
                    <Tab label={`Tool Calls${runResult?.toolCalls?.length ? ` (${runResult.toolCalls.length})` : ''}`} />
                  </Tabs>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, fontFamily: 'monospace', fontSize: 12, bgcolor: '#1e1e1e', color: '#d4d4d4' }}>
                  {!runResult && !running && (
                    <Typography color="grey.500" variant="body2" sx={{ textAlign: 'center', mt: 3, fontFamily: 'inherit' }}>
                      Click "Run Skill" to execute
                    </Typography>
                  )}
                  {running && !runResult && outputTab === 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
                      <CircularProgress size={16} sx={{ color: '#569cd6' }} />
                      <Typography sx={{ color: '#808080', fontSize: 12, fontFamily: 'monospace' }}>Waiting for result...</Typography>
                    </Box>
                  )}
                  {runResult && outputTab === 0 && (
                    <Box>
                      {runResult.error && <Box sx={{ p: 1, mb: 1, bgcolor: '#3b1111', borderRadius: 1, color: '#f48771' }}>Error: {runResult.error}</Box>}
                      <SkillOutputRenderer content={runResult.output || ''} />
                    </Box>
                  )}
                  {runResult && outputTab === 1 && (
                    <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#b5cea8' }}>
                      {(runResult.logs || []).join('\n') || '(no logs)'}
                    </Box>
                  )}
                  {runResult && outputTab === 2 && (
                    <Box>
                      {(runResult.toolCalls || []).length === 0
                        ? <Typography sx={{ color: '#808080', fontFamily: 'inherit' }}>(no tool calls)</Typography>
                        : runResult.toolCalls.map((tc, i) => (
                          <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: '#252526', borderRadius: 1, border: '1px solid #333' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#dcdcaa', mb: 0.5 }}>
                              🔧 {tc.toolName}
                              <Typography component="span" sx={{ color: '#808080', fontSize: 11, ml: 1 }}>{tc.duration}ms</Typography>
                            </Typography>
                            <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 0.5 }}>Input:</Typography>
                            <Box component="pre" sx={{ fontSize: 11, m: 0, mt: 0.5, color: '#ce9178', overflowX: 'auto' }}>
                              {JSON.stringify(tc.input, null, 2)}
                            </Box>
                            <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 1 }}>Output:</Typography>
                            <Box component="pre" sx={{ fontSize: 11, m: 0, mt: 0.5, color: '#b5cea8', overflowX: 'auto', maxHeight: 200, overflow: 'auto' }}>
                              {JSON.stringify(tc.output, null, 2)?.slice(0, 3000)}
                            </Box>
                          </Box>
                        ))
                      }
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
