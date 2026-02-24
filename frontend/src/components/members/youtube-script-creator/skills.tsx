import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
 Box, Typography, Paper, Button, TextField, Chip, IconButton, Alert, Grid,
 CircularProgress, Tabs, Tab, Divider, Tooltip, Card, CardContent, CardActionArea,
 InputAdornment, LinearProgress,
} from '@mui/material';
import SmartToy from '@mui/icons-material/SmartToy';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Build from '@mui/icons-material/Build';
import Search from '@mui/icons-material/Search';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutline from '@mui/icons-material/Error';
import Input from '@mui/icons-material/Input';
import Memory from '@mui/icons-material/Memory';
import Output from '@mui/icons-material/Output';
import Category from '@mui/icons-material/Category';
import Delete from '@mui/icons-material/Delete';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Send from '@mui/icons-material/Send';
import Close from '@mui/icons-material/Close';
import Download from '@mui/icons-material/Download';
import AttachFile from '@mui/icons-material/AttachFile';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = 15;

const COLORS = {
 primary: '#1976d2',
 secondary: '#0050ac',
 tint: '#1976d215',
 bg: '#fafbfc',
 border: 'rgba(0,0,0,0.06)',
 shadow: '0 2px 12px rgba(0,0,0,0.04)',
 shadowHover: '0 8px 25px rgba(0,0,0,0.08)',
 success: '#4caf50',
 warning: '#ff9800',
 error: '#e74c3c',
 blue: '#2196f3',
 purple: '#9b59b6',
};

const heroSx = {
 p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative' as const, overflow: 'hidden',
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '#1976d240' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px #1976d240',
 '&:hover': { boxShadow: '0 6px 20px #1976d260', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};


/* ── Types ────────────────────────────────────────────── */
interface ToolDef { id: string; name: string; description: string; parameters: any[]; }
interface SkillParam { name: string; type: string; description: string; required: boolean; }
type SkillCategory = 'inputs' | 'processing' | 'outputs' | 'other';
interface SkillDef { id: string; name: string; description: string; prompt: string; tools: string[]; inputs: SkillParam[]; credentials: string[]; enabled: boolean; category: SkillCategory; tags: string[]; }
interface RunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }
interface ProgressStep { type: string; message: string; elapsed?: number; }

/* ── Category config ──────────────────────────────────── */
const CAT_META: Record<SkillCategory, { label: string; icon: any; color: string }> = {
 inputs:     { label: 'Inputs',     icon: <Input fontSize="small" />,   color: '#4caf50' },
 processing: { label: 'Processing', icon: <Memory fontSize="small" />,  color: '#ff9800' },
 outputs:    { label: 'Outputs',    icon: <Output fontSize="small" />,  color: '#2196f3' },
 other:      { label: 'Other',      icon: <Category fontSize="small" />,color: '#9e9e9e' },
};
const CAT_ORDER: SkillCategory[] = ['inputs', 'processing', 'outputs', 'other'];

/* ── SSE parser helper ────────────────────────────────── */
function parseSSE(
 buffer: string,
 isFinal: boolean,
 onProgress: (s: ProgressStep) => void,
 onDone: (r: RunResult) => void,
 onError: (msg: string) => void,
): string {
 const lines = buffer.split('\n');
 const rest = isFinal ? '' : (lines.pop() || '');
 let evType = '', evData = '';
 for (const line of lines) {
  if (line.startsWith('event: ')) evType = line.slice(7).trim();
  else if (line.startsWith('data: ')) evData = line.slice(6);
  else if (line.trim() === '' && evType && evData) {
   try {
    const p = JSON.parse(evData);
    if (evType === 'progress') onProgress(p);
    else if (evType === 'done' && p.result) onDone(p.result);
    else if (evType === 'error') onError(p.message || 'Run failed');
   } catch {}
   evType = ''; evData = '';
  }
 }
 if (isFinal && evType && evData) {
  try {
   const p = JSON.parse(evData);
   if (evType === 'done' && p.result) onDone(p.result);
   else if (evType === 'error') onError(p.message || 'Run failed');
  } catch {}
 }
 return rest;
}

/* ── Render markdown output with clickable links / images ── */
function RichOutput({ text }: { text: string }) {
 if (!text) return null;

 /* Helper: convert inline markdown (**bold**, *italic*, `code`) to React nodes */
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Regex handles **bold**, *italic*, `code`, and [link](url) inline
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);          // **bold**
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);             // *italic*
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>); // `code`
   else if (m[5]) { // [text](url)
    const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6];
    out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '#1976d2' }}>{m[5]}</a>);
   }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }

 const lines = text.split('\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const trimmed = line.trim();
    // Image line: ![alt](url)
    const imgM = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
     const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2];
     return <Box key={i} sx={{ my: 1, textAlign: 'center' }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>;
    }
    // Standalone download link: [text](url) — entire line is one link
    const linkM = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkM) {
     const href = linkM[2].startsWith('/') ? API_BASE + linkM[2] : linkM[2];
     return (
      <Box key={i} sx={{ my: 0.5 }}>
       <Button variant="outlined" size="small" startIcon={<Download />} href={href} target="_blank" rel="noopener" sx={{ textTransform: 'none' }}>
        {linkM[1]}
       </Button>
      </Box>
     );
    }
    // Headings
    if (trimmed.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.3, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^####\s*/, ''))}</Typography>;
    if (trimmed.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^###\s*/, ''))}</Typography>;
    if (trimmed.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ mt: 1.5, mb: 0.5, fontSize: 15, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^##\s*/, ''))}</Typography>;
    if (trimmed.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^#\s*/, ''))}</Typography>;
    // HR
    if (/^[-*_]{3,}$/.test(trimmed)) return <Divider key={i} sx={{ my: 1 }} />;
    // Unordered list items (- or *)
    const ulM = trimmed.match(/^[-*]\s+(.+)/);
    if (ulM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>•</span><span>{inlineFormat(ulM[1])}</span></Typography>;
    // Ordered list items (1. 2. etc)
    const olM = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>{olM[1]}.</span><span>{inlineFormat(olM[2])}</span></Typography>;
    // Empty
    if (!trimmed) return <Box key={i} sx={{ height: 8 }} />;
    // Normal text — run inline formatting
    return <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inlineFormat(trimmed)}</Typography>;
   })}
  </Box>
 );
}

/* ════════════════════════════════════════════════════════ */

export function MembersSkillsPage() {
 /* ── State ── */
 const [skills, setSkills] = useState<SkillDef[]>([]);
 const [tools, setTools] = useState<ToolDef[]>([]);
 const [selectedId, setSelectedId] = useState('');

 // Skill read-only detail
 const [sName, setSName] = useState('');
 const [sDesc, setSDesc] = useState('');
 const [sTools, setSTools] = useState<string[]>([]);
 const [sInputs, setSInputs] = useState<SkillParam[]>([]);

 // Skills browse
 const [catTab, setCatTab] = useState(0);
 const [search, setSearch] = useState('');

 // Skill run state
 const [runInputs, setRunInputs] = useState<Record<string,string>>({});
 const [runInstructions, setRunInstructions] = useState('');
 const [running, setRunning] = useState(false);
 const [runResult, setRunResult] = useState<RunResult | null>(null);
 const [outputTab, setOutputTab] = useState(0);
 const [progress, setProgress] = useState<ProgressStep[]>([]);

 // Chat state
 const [chatInput, setChatInput] = useState('');
 const [chatRunning, setChatRunning] = useState(false);
 const [chatResult, setChatResult] = useState<RunResult | null>(null);
 const [chatProgress, setChatProgress] = useState<ProgressStep[]>([]);
 const [chatOutputTab, setChatOutputTab] = useState(0);
 const [chatCopied, setChatCopied] = useState(false);
 const chatInputRef = useRef<HTMLInputElement>(null);
 const chatFileRef = useRef<HTMLInputElement>(null);
 const [chatFiles, setChatFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);

 const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files; if (!files) return;
  const newFiles: Array<{ name: string; content: string; type: string }> = [];
  const textExts = ['txt','md','csv','json','xml','html','htm','js','ts','jsx','tsx','css','py','yaml','yml','toml','ini','cfg','log','sql','sh','bat','env','gitignore'];
  for (let i = 0; i < files.length; i++) {
   const f = files[i];
   const ext = f.name.split('.').pop()?.toLowerCase() || '';
   const isText = f.type.startsWith('text/') || textExts.includes(ext) || f.type === 'application/json' || f.type === 'application/xml';
   try {
    if (isText) {
     const text = await f.text();
     newFiles.push({ name: f.name, content: text.slice(0, 50000), type: 'text' });
    } else {
     const buf = await f.arrayBuffer();
     const b64 = btoa(String.fromCharCode(...new Uint8Array(buf).slice(0, 30000)));
     newFiles.push({ name: f.name, content: b64, type: 'base64' });
    }
   } catch {}
  }
  setChatFiles(prev => [...prev, ...newFiles]);
  if (chatFileRef.current) chatFileRef.current.value = '';
 };

 // UI
 const [error, setError] = useState('');

 /* ── Load ── */
 const loadData = useCallback(async () => {
  try {
   const [sR, tR] = await Promise.all([
    fetch(API_BASE + '/api/skills?app_id=' + APP_ID).then(r => r.json()),
    fetch(API_BASE + '/api/skills/tools?app_id=' + APP_ID).then(r => r.json()),
   ]);
   setSkills(sR.skills || []);
   setTools(tR.tools || []);
  } catch (e: any) { setError('Failed to load: ' + e.message); }
 }, []);
 useEffect(() => { loadData(); }, [loadData]);
 useEffect(() => { chatInputRef.current?.focus(); }, []);

 /* ── Filters ── */
 const grouped = useMemo(() => {
  const g: Record<SkillCategory, SkillDef[]> = { inputs:[], processing:[], outputs:[], other:[] };
  const q = search.toLowerCase().trim();
  for (const s of skills) {
   if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) continue;
   const c = (s.category && s.category in g) ? s.category : 'other';
   g[c].push(s);
  }
  return g;
 }, [skills, search]);

 const activeCat = CAT_ORDER[catTab] || 'inputs';
 const activeSkills = grouped[activeCat];

 const filteredTools = useMemo(() => {
  const q = search.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
 }, [tools, search]);

 /* ── Select skill ── */
 const selectSkill = (s: SkillDef) => {
  setSelectedId(s.id);
  setSName(s.name); setSDesc(s.description); setSTools([...s.tools]); setSInputs([...s.inputs]);
  setRunResult(null); setRunInputs({}); setRunInstructions(''); setProgress([]); setError('');
 };

 /* ── Run skill (SSE) ── */
 const runSkill = async () => {
  if (!selectedId) return;
  setRunning(true); setRunResult(null); setProgress([]); setOutputTab(0); setError('');
  try {
   const resp = await fetch(API_BASE + '/api/skills/' + selectedId + '/run-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: runInputs, instructions: runInstructions || undefined, app_id: APP_ID }),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Stream failed'); setRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, s => setProgress(p => [...p, s]), r => setRunResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setProgress(p => [...p, s]), r => setRunResult(r), setError);
   }
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 /* ── Chat (SSE) ── */
 const runChat = async () => {
  const msg = chatInput.trim();
  if (!msg || chatRunning) return;
  setChatRunning(true); setChatResult(null); setChatProgress([]); setChatOutputTab(0); setChatCopied(false);
  try {
   const payload: any = { message: msg, app_id: APP_ID };
   if (chatFiles.length > 0) payload.attachments = chatFiles;
   const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Chat failed'); setChatRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, s => setChatProgress(p => [...p, s]), r => setChatResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setChatProgress(p => [...p, s]), r => setChatResult(r), setError);
   }
   setChatInput(''); setChatFiles([]);
  } catch (e: any) { setError(e.message); }
  finally { setChatRunning(false); }
 };

 /* ── Activity renderer ── */
 const ActivitySteps = ({ steps, isRunning }: { steps: ProgressStep[]; isRunning: boolean }) => {
  if (steps.length === 0 && !isRunning) return null;
  return (
   <Box sx={{ px: 2, py: 1, bgcolor: '#1a1a2e', borderRadius: 1, mb: 1, maxHeight: 160, overflow: 'auto',
    '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 } }}>
    {isRunning && steps.length === 0 && <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>Connecting...</Typography>}
    {steps.map((step, i) => {
     const icon = step.type === 'phase' ? '📋' : step.type === 'tool-start' ? '🔧' : step.type === 'tool-done' ? '✅' : step.type === 'error' ? '❌' : step.type === 'done' ? '🏁' : '▸';
     return (
      <Box key={i} sx={{ display: 'flex', gap: 0.75, py: 0.1, alignItems: 'flex-start' }}>
       <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{icon}</Typography>
       <Typography sx={{ fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, flex: 1,
        color: step.type === 'phase' ? '#dcdcaa' : step.type === 'tool-start' ? '#569cd6' : step.type === 'tool-done' ? '#b5cea8' : step.type === 'error' ? '#f48771' : '#d4d4d4',
        fontWeight: step.type === 'phase' ? 700 : 400 }}>{step.message}</Typography>
       {step.elapsed != null && <Typography sx={{ fontSize: 9, color: '#555', flexShrink: 0 }}>{(step.elapsed / 1000).toFixed(1)}s</Typography>}
      </Box>
     );
    })}
   </Box>
  );
 };

 /* ── Output renderer (no tabs) ── */
 const OutputTabs = ({ result, isRunning }: { result: RunResult | null; isRunning: boolean; tab?: number; setTab?: (v: number) => void; copied?: boolean; onCopy?: () => void }) => (
  <Box>
   {!result && !isRunning && <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 3 }}>Waiting for result...</Typography>}
   {isRunning && !result && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
     <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing...</Typography>
    </Box>
   )}
   {result && (
    <Box>
     {result.error && <Alert severity="error" sx={{ mb: 1 }}>{result.error}</Alert>}
     {result.status && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
       {result.status === 'success' ? <CheckCircle color="success" sx={{ fontSize: 14 }} /> : <ErrorOutline color="error" sx={{ fontSize: 14 }} />}
       <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{(result.duration / 1000).toFixed(1)}s</Typography>
      </Box>
     )}
     <RichOutput text={result.output || ''} />
    </Box>
   )}
  </Box>
 );

 /* ══════════════ RENDER ══════════════ */

 /* Which result to show in the bottom output panel */
 const activeResult = runResult || chatResult;
 const activeRunning = running || chatRunning;
 const activeProgress = running ? progress : chatProgress;
 const activeTab = running || runResult ? outputTab : chatOutputTab;
 const setActiveTab = running || runResult ? setOutputTab : setChatOutputTab;

 return (
  <>
  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1200, mx: 'auto' }}>
   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* ═══ TOP ROW: Chat Input (left) + Activity Commentary (right) ═══ */}
   <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={12} md={6}>
     <Paper sx={{ height: '100%', overflow: 'hidden', background: 'linear-gradient(135deg, #1976d212, #0050ac08)', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
       <SmartToy sx={{ color: '#1976d2', fontSize: 28 }} />
       <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>YouTube script creator AI Assistant</Typography>
        <Typography variant="caption" color="text.secondary">Harness AI-powered features to create scripts, scrape emails, transcribe, and design thumbnails.</Typography>
       </Box>
       {chatResult && (
        <Tooltip title="Clear"><IconButton size="small" onClick={() => { setChatResult(null); setChatProgress([]); setChatInput(''); setChatFiles([]); }}><Delete sx={{ fontSize: 18 }} /></IconButton></Tooltip>
       )}
      </Box>
      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
       <input ref={chatFileRef} type="file" hidden multiple accept=".txt,.md,.csv,.json,.xml,.html,.pdf,.doc,.docx,.xls,.xlsx,.py,.js,.ts,.yaml,.yml,.sql,.log,.ini,.cfg,.env" onChange={handleFileAttach} />
       <Tooltip title="Attach document"><IconButton size="small" onClick={() => chatFileRef.current?.click()} disabled={chatRunning}
        sx={{ bgcolor: chatFiles.length > 0 ? '#1976d220' : 'transparent', color: chatFiles.length > 0 ? '#1976d2' : 'text.secondary' }}><AttachFile sx={{ fontSize: 20 }} /></IconButton></Tooltip>
       <TextField inputRef={chatInputRef} size="small" fullWidth placeholder={chatFiles.length > 0 ? 'Describe what to do with the attached file(s)...' : 'Ask the AI anything — research, create content, generate documents...'}
        value={chatInput} onChange={e => setChatInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runChat(); } }}
        sx={{ '& .MuiOutlinedInput-root': { fontSize: 14, bgcolor: 'background.paper' } }} />
       <Button variant="contained" size="small" startIcon={chatRunning ? <CircularProgress size={16} color="inherit" /> : <Send />}
        onClick={runChat} disabled={chatRunning || !chatInput.trim()} sx={{ ...gradientBtnSx, minWidth: 100, height: 40 }}>
        {chatRunning ? 'Thinking...' : 'Send'}
       </Button>
      </Box>
      {chatFiles.length > 0 && (
       <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {chatFiles.map((f, i) => <Chip key={i} label={f.name} size="small" onDelete={() => setChatFiles(prev => prev.filter((_, j) => j !== i))}
         icon={<AttachFile sx={{ fontSize: 14 }} />} sx={{ fontSize: 11, height: 24, bgcolor: '#1976d210' }} />)}
       </Box>
      )}
      {chatRunning && <LinearProgress sx={{ height: 2 }} />}
     </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
     <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 120 }}>
      <Box sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
       <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Activity</Typography>
       {activeRunning && <CircularProgress size={12} />}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 2 } }}>
       {activeProgress.length === 0 && !activeRunning ? (
        <Typography color="text.disabled" variant="body2" sx={{ p: 2, textAlign: 'center' }}>Activity will appear here</Typography>
       ) : (
        <ActivitySteps steps={activeProgress} isRunning={activeRunning} />
       )}
      </Box>
     </Paper>
    </Grid>
   </Grid>

   {/* ═══ SKILLS BOX (fixed height, scrollable) ═══ */}
   <Paper variant="outlined" sx={{ mb: 2, display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'hidden' }}>
    <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
     <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Skills</Typography>
     <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
      InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
      sx={{ width: 200, '& .MuiOutlinedInput-root': { fontSize: 13, height: 32 } }} />
     {tools.length > 0 && (
      <Tooltip title={tools.map(t => t.name).join(', ')}>
       <Chip icon={<Build sx={{ fontSize: 14 }} />} label={tools.length + ' tool' + (tools.length !== 1 ? 's' : '') + ' available'} size="small" variant="outlined" />
      </Tooltip>
     )}
    </Box>
    <Tabs value={catTab} onChange={(_, v) => setCatTab(v)}
     sx={{ px: 2, minHeight: 36, flexShrink: 0, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: 13, fontWeight: 600, py: 0 } }}>
     {CAT_ORDER.map((cat, i) => {
      const meta = CAT_META[cat];
      const count = grouped[cat].length;
      return <Tab key={cat} icon={meta.icon} iconPosition="start" label={meta.label + (count ? ' (' + count + ')' : '')}
       sx={{ color: meta.color, '&.Mui-selected': { color: meta.color } }} />;
     })}
    </Tabs>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {activeSkills.length === 0 && (
      <Typography color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>{search ? 'No matching skills in this category' : 'No skills in this category yet'}</Typography>
     )}
     <Grid container spacing={1.5}>
      {activeSkills.map(s => (
       <Grid item xs={12} sm={6} md={4} key={s.id}>
        <Card variant="outlined" sx={{ height: '100%', border: selectedId === s.id ? '2px solid #1976d2' : undefined, transition: 'border 0.15s' }}>
         <CardActionArea onClick={() => selectSkill(s)} sx={{ height: '100%' }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
           <Typography sx={{ fontWeight: 600, fontSize: 13.5, mb: 0.3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.name}</Typography>
           <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{s.description}</Typography>
           <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {s.tools.slice(0, 3).map(t => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: 10 }} />)}
            {s.tools.length > 3 && <Chip label={'+' + (s.tools.length - 3)} size="small" sx={{ height: 18, fontSize: 10 }} />}
           </Box>
          </CardContent>
         </CardActionArea>
        </Card>
       </Grid>
      ))}
     </Grid>
    </Box>
   </Paper>

   {/* ═══ SELECTED SKILL RUN BAR (inline, below skills) ═══ */}
   {selectedId && (
    <Paper variant="outlined" sx={{ mb: 2 }}>
     <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
      <Chip label="SKILL" size="small" color="primary" sx={{ fontWeight: 700 }} />
      <Typography sx={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{sName}</Typography>
      {sTools.length > 0 && sTools.slice(0, 3).map(t => <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 22, fontSize: 10 }} />)}
      <Tooltip title="Close"><IconButton size="small" onClick={() => setSelectedId('')}><Close sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     </Box>
     <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', bgcolor: '#fafafa' }}>
      {sInputs.map(inp => (
       <TextField key={inp.name} size="small" label={inp.name} value={runInputs[inp.name] || ''} sx={{ width: 180 }}
        onChange={e => setRunInputs(prev => ({ ...prev, [inp.name]: e.target.value }))} placeholder={inp.description} />
      ))}
      <TextField size="small" label="Instructions (optional)" value={runInstructions} onChange={e => setRunInstructions(e.target.value)}
       placeholder='e.g. "write 1000 words and save as PDF"' sx={{ flex: 1, minWidth: 200 }} />
      <Button variant="contained" color="success" size="small" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
       onClick={runSkill} disabled={running} sx={{ fontWeight: 700, height: 36 }}>
       {running ? 'Running...' : 'Run'}
      </Button>
     </Box>
     {running && <LinearProgress sx={{ height: 2 }} />}
    </Paper>
   )}

   {/* ═══ OUTPUT PANEL (below content, fixed height, scrollable) ═══ */}
   <Paper variant="outlined" sx={{
    height: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden',
   }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Output</Typography>
     {activeRunning && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {!activeResult && !activeRunning ? (
      <Typography color="text.disabled" sx={{ p: 3, textAlign: 'center' }}>Output will appear here when you send a chat message or run a skill.</Typography>
     ) : (
      <Box sx={{ p: 1.5 }}>
       <OutputTabs result={activeResult} isRunning={activeRunning} tab={activeTab} setTab={setActiveTab} />
      </Box>
     )}
    </Box>
   </Paper>

  </Box>
  </>
 );
}