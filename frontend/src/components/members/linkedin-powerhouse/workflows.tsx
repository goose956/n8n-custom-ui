import { useEffect, useState, useCallback, useRef } from 'react';
import {
 Box, Typography, Paper, Chip, CircularProgress, Alert, Button, IconButton,
 Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
 Tooltip, Card, CardContent, Switch, Snackbar, LinearProgress, Table,
 TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import Schedule from '@mui/icons-material/Schedule';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Refresh from '@mui/icons-material/Refresh';
import Today from '@mui/icons-material/Today';
import DateRange from '@mui/icons-material/DateRange';
import Visibility from '@mui/icons-material/Visibility';
import Send from '@mui/icons-material/Send';
import CloudUpload from '@mui/icons-material/CloudUpload';
import TableChart from '@mui/icons-material/TableChart';
import Close from '@mui/icons-material/Close';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutline from '@mui/icons-material/Error';
import Download from '@mui/icons-material/Download';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = 14;

const COLORS = {
 primary: '#3498db',
 secondary: '#0e72b5',
 tint: '#3498db15',
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
 background: 'linear-gradient(135deg, #3498db 0%, #0e72b5 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '#3498db40' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, #3498db 0%, #0e72b5 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px #3498db40',
 '&:hover': { boxShadow: '0 6px 20px #3498db60', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};


/* ── Types ── */
type WfSchedule = 'daily' | 'weekly' | 'monitor';
interface ScheduledWorkflow {
 id: string; name: string; description: string; prompt: string;
 schedule: WfSchedule; enabled: boolean;
 dataSource?: { fileName: string; columns: string[]; rowCount: number };
 lastRun?: string; lastStatus?: 'success' | 'error'; createdAt: string;
 processedRows?: number; totalRows?: number;
}
interface RunResult { id: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: any[]; duration: number; error?: string; }
interface ProgressStep { type: string; message: string; elapsed?: number; }

/* ── SSE parser ── */
function parseSSE(
 buffer: string, isFinal: boolean,
 onProgress: (s: ProgressStep) => void, onDone: (r: RunResult) => void, onError: (msg: string) => void,
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

/* ── RichOutput (markdown renderer) ── */
function RichOutput({ text }: { text: string }) {
 if (!text) return null;
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m: any, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>);
   else if (m[5]) { const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6]; out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '#3498db' }}>{m[5]}</a>); }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }
 const lines = text.split('\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const t = line.trim();
    const imgM = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) { const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2]; return <Box key={i} sx={{ my: 1 }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>; }
    if (t.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }} dangerouslySetInnerHTML={{ __html: inlineFormat(t.slice(5)).map(n => typeof n === 'string' ? n : '').join('') || t.slice(5) }} />;
    if (t.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>{t.slice(4)}</Typography>;
    if (t.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>{t.slice(3)}</Typography>;
    if (t.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>{t.slice(2)}</Typography>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <Typography key={i} sx={{ pl: 2, fontSize: '0.92rem', lineHeight: 1.7 }}>{String.fromCharCode(8226)} {inlineFormat(t.slice(2))}</Typography>;
    if (/^\d+\.\s/.test(t)) { const c = t.replace(/^\d+\.\s*/, ''); return <Typography key={i} sx={{ pl: 2, fontSize: '0.92rem', lineHeight: 1.7 }}>{t.match(/^\d+/)?.[0]}. {inlineFormat(c)}</Typography>; }
    if (t === '---' || t === '***') return <Box key={i} sx={{ borderBottom: '1px solid #e0e0e0', my: 1.5 }} />;
    if (t === '') return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} sx={{ fontSize: '0.92rem', lineHeight: 1.8 }}>{inlineFormat(t)}</Typography>;
   })}
  </Box>
 );
}

/* ── Activity steps renderer ── */
function ActivitySteps({ steps, isRunning }: { steps: ProgressStep[]; isRunning: boolean }) {
 if (steps.length === 0 && !isRunning) return null;
 return (
  <Box sx={{ px: 2, py: 1, bgcolor: '#1a1a2e', borderRadius: 1, maxHeight: 160, overflow: 'auto',
   '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 } }}>
   {isRunning && steps.length === 0 && <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>Connecting...</Typography>}
   {steps.map((step, i) => {
    const icon = step.type === 'phase' ? '📋' : step.type === 'tool-start' ? '🔧' : step.type === 'tool-done' ? '✅' : step.type === 'error' ? '❌' : step.type === 'done' ? '🏁' : '▸';
    return (
     <Box key={i} sx={{ display: 'flex', gap: 0.75, py: 0.1 }}>
      <Typography sx={{ fontSize: 11 }}>{icon}</Typography>
      <Typography sx={{ fontSize: 11, fontFamily: 'monospace', flex: 1,
       color: step.type === 'phase' ? '#dcdcaa' : step.type === 'tool-start' ? '#569cd6' : step.type === 'tool-done' ? '#b5cea8' : step.type === 'error' ? '#f48771' : '#d4d4d4',
       fontWeight: step.type === 'phase' ? 700 : 400 }}>{step.message}</Typography>
      {step.elapsed != null && <Typography sx={{ fontSize: 9, color: '#555' }}>{(step.elapsed / 1000).toFixed(1)}s</Typography>}
     </Box>
    );
   })}
  </Box>
 );
}

/* ── Column colours ── */
const COL_COLORS: Record<WfSchedule, { bg: string; border: string; label: string; desc: string; icon: any }> = {
 daily:   { bg: '#e3f2fd', border: '#1976d2', label: 'Daily',   desc: 'Runs once a day', icon: <Today sx={{ fontSize: 20 }} /> },
 weekly:  { bg: '#f3e5f5', border: '#7b1fa2', label: 'Weekly',  desc: 'Runs once a week', icon: <DateRange sx={{ fontSize: 20 }} /> },
 monitor: { bg: '#e8f5e9', border: '#388e3c', label: 'Monitor', desc: 'Triggered by events', icon: <Visibility sx={{ fontSize: 20 }} /> },
};

/* ── Excel parser (CSV / basic xlsx via text) ── */
function parseCSV(text: string): { columns: string[]; rows: string[][] } {
 const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
 if (lines.length === 0) return { columns: [], rows: [] };
 const sep = lines[0].includes('\t') ? '\t' : ',';
 const columns = lines[0].split(sep).map(c => c.replace(/^"|"$/g, '').trim());
 const rows = lines.slice(1).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim()));
 return { columns, rows };
}

export function MembersWorkflowsPage() {
 /* ── State ── */
 const [workflows, setWorkflows] = useState<ScheduledWorkflow[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [snack, setSnack] = useState('');

 /* Dialog state */
 const [addOpen, setAddOpen] = useState(false);
 const [editWf, setEditWf] = useState<ScheduledWorkflow | null>(null);
 const [form, setForm] = useState({ name: '', description: '', prompt: '', schedule: 'daily' as WfSchedule });
 const [csvData, setCsvData] = useState<{ columns: string[]; rows: string[][] } | null>(null);
 const [csvFileName, setCsvFileName] = useState('');
 const fileRef = useRef<HTMLInputElement>(null);

 /* Run state */
 const [runningId, setRunningId] = useState<string | null>(null);
 const [runProgress, setRunProgress] = useState<ProgressStep[]>([]);
 const [runResult, setRunResult] = useState<RunResult | null>(null);
 const [runRowIdx, setRunRowIdx] = useState(0);
 const [runTotalRows, setRunTotalRows] = useState(0);

 /* ── Load ── */
 const load = useCallback(async () => {
  setLoading(true);
  try {
   const res = await fetch(API_BASE + '/api/scheduled-workflows?app_id=' + APP_ID).then(r => r.json());
   setWorkflows(res.workflows || []);
  } catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, []);
 useEffect(() => { load(); }, [load]);

 /* ── File upload ── */
 const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  setCsvFileName(file.name);
  const reader = new FileReader();
  reader.onload = (ev) => {
   const text = ev.target?.result as string;
   if (text) setCsvData(parseCSV(text));
  };
  reader.readAsText(file);
  if (fileRef.current) fileRef.current.value = '';
 };

 const clearFile = () => { setCsvData(null); setCsvFileName(''); };

 /* ── Dialog helpers ── */
 const openAdd = (schedule: WfSchedule) => {
  setForm({ name: '', description: '', prompt: '', schedule });
  setCsvData(null); setCsvFileName(''); setEditWf(null); setAddOpen(true);
 };
 const openEdit = (wf: ScheduledWorkflow) => {
  setForm({ name: wf.name, description: wf.description, prompt: wf.prompt, schedule: wf.schedule });
  if (wf.dataSource) { setCsvFileName(wf.dataSource.fileName); setCsvData({ columns: wf.dataSource.columns, rows: [] }); }
  else { setCsvData(null); setCsvFileName(''); }
  setEditWf(wf); setAddOpen(true);
 };

 /* ── Save workflow ── */
 const save = async () => {
  if (!form.name.trim() || !form.prompt.trim()) return;
  const body: any = { ...form, app_id: APP_ID };
  if (csvData && csvData.columns.length > 0) {
   body.dataSource = { fileName: csvFileName, columns: csvData.columns, rowCount: csvData.rows.length, rows: csvData.rows };
  }
  try {
   if (editWf) {
    await fetch(API_BASE + '/api/scheduled-workflows/' + editWf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSnack('Workflow updated');
   } else {
    await fetch(API_BASE + '/api/scheduled-workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSnack('Workflow created');
   }
   setAddOpen(false); load();
  } catch (e: any) { setError(e.message); }
 };

 /* ── Toggle & Delete ── */
 const toggle = async (wf: ScheduledWorkflow) => {
  try {
   await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !wf.enabled }) });
   setSnack(wf.enabled ? 'Paused' : 'Enabled'); load();
  } catch (e: any) { setError(e.message); }
 };
 const del = async (id: string) => {
  try { await fetch(API_BASE + '/api/scheduled-workflows/' + id, { method: 'DELETE' }); setSnack('Deleted'); load(); }
  catch (e: any) { setError(e.message); }
 };

 /* ── Run workflow (streams via chat endpoint, processes rows if data source) ── */
 const runWorkflow = async (wf: ScheduledWorkflow) => {
  setRunningId(wf.id); setRunResult(null); setRunProgress([]); setRunRowIdx(0);
  const hasData = wf.dataSource && wf.dataSource.rowCount > 0;

  try {
   // Fetch the full workflow data including rows
   const wfRes = await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id).then(r => r.json());
   const rows = wfRes.workflow?.dataSource?.rows || [];
   const totalRows = hasData ? rows.length : 1;
   setRunTotalRows(totalRows);

   for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    setRunRowIdx(rowIdx + 1);
    let prompt = wf.prompt;
    // If there is row data, substitute column placeholders
    if (hasData && rows[rowIdx]) {
     const cols = wf.dataSource?.columns || [];
     cols.forEach((col: string, ci: number) => {
      const val = rows[rowIdx]?.[ci] || '';
      prompt = prompt.replace(new RegExp('\\{' + col.replace(/[.*+?^${}()|[\]\\]/g, '\\\$&') + '\\}', 'gi'), val);
      prompt = prompt.replace(new RegExp('\\{\\{' + col.replace(/[.*+?^${}()|[\]\\]/g, '\\\$&') + '\\}\\}', 'gi'), val);
     });
    }

    setRunProgress(p => [...p, { type: 'phase', message: hasData ? 'Row ' + (rowIdx + 1) + '/' + totalRows + ': ' + prompt.slice(0, 80) + '...' : 'Running: ' + prompt.slice(0, 100) }]);

    const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
     method: 'POST', headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ message: prompt, app_id: APP_ID }),
    });
    if (!resp.ok || !resp.body) { setRunProgress(p => [...p, { type: 'error', message: 'Request failed for row ' + (rowIdx + 1) }]); continue; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let rowResult: RunResult | null = null;
    while (true) {
     const { done, value } = await reader.read();
     if (done) { parseSSE(buf, true, s => setRunProgress(p => [...p, s]), r => { rowResult = r; setRunResult(r); }, msg => setRunProgress(p => [...p, { type: 'error', message: msg }])); break; }
     buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setRunProgress(p => [...p, s]), r => { rowResult = r; setRunResult(r); }, msg => setRunProgress(p => [...p, { type: 'error', message: msg }]));
    }
    if (rowResult) setRunProgress(p => [...p, { type: 'done', message: 'Row ' + (rowIdx + 1) + ' complete (' + ((rowResult as RunResult).duration / 1000).toFixed(1) + 's)' }]);
   }

   // Update workflow status
   await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastRun: new Date().toISOString(), lastStatus: 'success', processedRows: totalRows, totalRows }) });
   load();
  } catch (e: any) { setError(e.message); }
  finally { setRunningId(null); }
 };

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 const bySchedule = (s: WfSchedule) => workflows.filter(w => w.schedule === s);

 return (
  <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <Schedule /> LinkedIn Powerhouse Workflows
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>Automate your outreach and engagement activities effortlessly.</Typography>
     </Box>
     <Box sx={{ display: 'flex', gap: 1 }}>
      <Chip label={workflows.length + ' workflows'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
      <Chip label={workflows.filter(w => w.enabled).length + ' active'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
      <Tooltip title="Refresh"><IconButton onClick={load} sx={{ color: '#fff' }}><Refresh /></IconButton></Tooltip>
     </Box>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* ── Running panel ── */}
   {runningId && (
    <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <CircularProgress size={18} />
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Running workflow — row {runRowIdx} of {runTotalRows}</Typography>
     </Box>
     {runTotalRows > 1 && <LinearProgress variant="determinate" value={(runRowIdx / runTotalRows) * 100} sx={{ mb: 1, borderRadius: 1 }} />}
     <ActivitySteps steps={runProgress} isRunning={!!runningId} />
    </Paper>
   )}

   {/* ── Last result ── */}
   {!runningId && runResult && (
    <Paper variant="outlined" sx={{ mb: 2, p: 2, maxHeight: 300, overflow: 'auto' }}>
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {runResult.status === 'success' ? <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : <ErrorOutline sx={{ color: '#f44336', fontSize: 18 }} />}
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Last run — {(runResult.duration / 1000).toFixed(1)}s</Typography>
      <Box sx={{ flex: 1 }} />
      <IconButton size="small" onClick={() => setRunResult(null)}><Close sx={{ fontSize: 16 }} /></IconButton>
     </Box>
     {runResult.error && <Alert severity="error" sx={{ mb: 1 }}>{runResult.error}</Alert>}
     <RichOutput text={runResult.output || ''} />
    </Paper>
   )}

   {/* ── 3 Schedule columns ── */}
   <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {(['daily', 'weekly', 'monitor'] as WfSchedule[]).map(schedule => {
     const col = COL_COLORS[schedule];
     const items = bySchedule(schedule);
     return (
      <Paper key={schedule} variant="outlined" sx={{ flex: 1, minWidth: 280, borderColor: col.border, borderWidth: 2, borderRadius: 2, overflow: 'hidden' }}>
       <Box sx={{ bgcolor: col.bg, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid ' + col.border }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         {col.icon}
         <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: col.border }}>{col.label}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{col.desc}</Typography>
         </Box>
         <Chip label={items.length} size="small" sx={{ fontWeight: 700, bgcolor: col.border, color: '#fff', height: 22 }} />
        </Box>
        <Tooltip title={'Add ' + col.label + ' workflow'}>
         <IconButton size="small" sx={{ color: col.border }} onClick={() => openAdd(schedule)}><Add /></IconButton>
        </Tooltip>
       </Box>
       <Box sx={{ p: 1.5, minHeight: 120, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.length === 0 ? (
         <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
          <Schedule sx={{ fontSize: 32, mb: 0.5 }} />
          <Typography variant="body2">No {col.label.toLowerCase()} workflows yet</Typography>
          <Button size="small" startIcon={<Add />} onClick={() => openAdd(schedule)} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
           Create Workflow
          </Button>
         </Box>
        ) : items.map(wf => (
         <Card key={wf.id} variant="outlined" sx={{ borderRadius: 1.5, borderColor: wf.enabled ? col.border + '60' : '#e0e0e0', bgcolor: wf.enabled ? '#fff' : '#fafafa' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }} noWrap>{wf.name}</Typography>
            <Switch size="small" checked={wf.enabled} onChange={() => toggle(wf)} />
           </Box>
           {wf.description && <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{wf.description}</Typography>}
           <Typography variant="body2" sx={{ fontSize: 11, fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 0.5, mb: 0.5, maxHeight: 40, overflow: 'hidden' }}>
            {wf.prompt.slice(0, 120)}{wf.prompt.length > 120 ? '...' : ''}
           </Typography>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
            {wf.dataSource && <Chip icon={<TableChart sx={{ fontSize: 12 }} />} label={wf.dataSource.fileName + ' (' + wf.dataSource.rowCount + ' rows)'} size="small" sx={{ fontSize: 10, height: 20 }} />}
            {wf.lastRun && <Typography variant="caption" color="text.disabled">Last: {new Date(wf.lastRun).toLocaleString()}</Typography>}
            {wf.lastStatus && <Chip label={wf.lastStatus} size="small" color={wf.lastStatus === 'success' ? 'success' : 'error'} sx={{ height: 18, fontSize: 10 }} />}
           </Box>
           <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Run now"><IconButton size="small" onClick={() => runWorkflow(wf)} disabled={!!runningId}><PlayArrow sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(wf)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(wf.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
           </Box>
          </CardContent>
         </Card>
        ))}
       </Box>
      </Paper>
     );
    })}
   </Box>

   {/* ── Create/Edit dialog ── */}
   <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
    <DialogTitle>{editWf ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
     <TextField label="Workflow Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" placeholder="e.g. Daily Blog Article" />
     <TextField label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" />
     <TextField label="Schedule" select value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value as WfSchedule }))} fullWidth size="small">
      <MenuItem value="daily">Daily — Runs once per day</MenuItem>
      <MenuItem value="weekly">Weekly — Runs once per week</MenuItem>
      <MenuItem value="monitor">Monitor — Triggered by events</MenuItem>
     </TextField>

     <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Prompt</Typography>
     <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
      Write your AI prompt. If you import data below, use {'{'}<strong>ColumnName</strong>{'}'} placeholders to inject row values — the workflow will process each row.
     </Typography>
     <TextField label="AI Prompt" value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} fullWidth multiline rows={5} size="small"
      placeholder="Write a 500-word SEO blog article about {Topic} targeting the keyword {Keyword}. Include an engaging introduction and 3 subheadings." />

     <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Data Source (optional)</Typography>
     <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
      Upload a CSV or Excel file. Each row becomes a separate run — column headers become placeholders you can use in the prompt above.
     </Typography>
     <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" hidden onChange={handleFile} />
      <Button size="small" variant="outlined" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()} sx={{ textTransform: 'none' }}>
       {csvFileName || 'Upload CSV / Excel'}
      </Button>
      {csvFileName && <IconButton size="small" onClick={clearFile}><Close sx={{ fontSize: 16 }} /></IconButton>}
     </Box>

     {csvData && csvData.columns.length > 0 && (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
       <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Columns:</Typography>
        {csvData.columns.map(c => <Chip key={c} label={'{' + c + '}'} size="small" sx={{ fontFamily: 'monospace', fontSize: 11, height: 22 }} />)}
       </Box>
       {csvData.rows.length > 0 && (
        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
         <Table size="small">
          <TableHead>
           <TableRow>{csvData.columns.map(c => <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, py: 0.5 }}>{c}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
           {csvData.rows.slice(0, 5).map((row, ri) => (
            <TableRow key={ri}>{row.map((cell, ci) => <TableCell key={ci} sx={{ fontSize: 11, py: 0.3 }}>{cell}</TableCell>)}</TableRow>
           ))}
           {csvData.rows.length > 5 && <TableRow><TableCell colSpan={csvData.columns.length} sx={{ fontSize: 11, color: 'text.disabled', textAlign: 'center' }}>...and {csvData.rows.length - 5} more rows</TableCell></TableRow>}
          </TableBody>
         </Table>
        </Box>
       )}
       <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{csvData.rows.length} rows will be processed</Typography>
      </Paper>
     )}
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setAddOpen(false)}>Cancel</Button>
     <Button variant="contained" onClick={save} disabled={!form.name.trim() || !form.prompt.trim()}>{editWf ? 'Update' : 'Create'}</Button>
    </DialogActions>
   </Dialog>

   <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
  </Box>
 );
}