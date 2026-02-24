import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
 Box, Typography, Paper, Button, TextField, IconButton, Alert, Grid,
 CircularProgress, Tooltip, Divider, LinearProgress, Card, CardContent, Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = 15;

/* ── Skill Widget helpers (auto-injected) ─────────────────── */
interface SkillProgressStep { type: string; message: string; elapsed?: number; }
interface SkillRunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }

function parseSSE(
 buffer: string,
 isFinal: boolean,
 onProgress: (s: SkillProgressStep) => void,
 onDone: (r: SkillRunResult) => void,
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

function RichOutput({ text }: { text: string }) {
 if (!text) return null;
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|\`([^\`]+)\`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m: any, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>);
   else if (m[5]) {
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
    const imgM = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
     const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2];
     return <Box key={i} sx={{ my: 1, textAlign: 'center' }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>;
    }
    const linkM = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkM) {
     const href = linkM[2].startsWith('/') ? API_BASE + linkM[2] : linkM[2];
     return <Box key={i} sx={{ my: 0.5 }}><Button variant="outlined" size="small" href={href} target="_blank" rel="noopener" sx={{ textTransform: 'none' }}>{linkM[1]}</Button></Box>;
    }
    if (trimmed.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.3, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^####\s*/, ''))}</Typography>;
    if (trimmed.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^###\s*/, ''))}</Typography>;
    if (trimmed.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ mt: 1.5, mb: 0.5, fontSize: 15, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^##\s*/, ''))}</Typography>;
    if (trimmed.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^#\s*/, ''))}</Typography>;
    if (/^[-*_]{3,}$/.test(trimmed)) return <Divider key={i} sx={{ my: 1 }} />;
    const ulM = trimmed.match(/^[-*]\s+(.+)/);
    if (ulM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>•</span><span>{inlineFormat(ulM[1])}</span></Typography>;
    const olM = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>{olM[1]}.</span><span>{inlineFormat(olM[2])}</span></Typography>;
    if (!trimmed) return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inlineFormat(trimmed)}</Typography>;
   })}
  </Box>
 );
}

function SkillWidgetActivity({ steps, isRunning }: { steps: SkillProgressStep[]; isRunning: boolean }) {
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
}

function SkillWidget({ placeholder = 'Ask the AI anything...', title = 'AI Assistant' }: { placeholder?: string; title?: string }) {
 const [input, setInput] = useState('');
 const [running, setRunning] = useState(false);
 const [result, setResult] = useState<SkillRunResult | null>(null);
 const [progress, setProgress] = useState<SkillProgressStep[]>([]);
 const [error, setError] = useState('');
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => { inputRef.current?.focus(); }, []);

 const run = async () => {
  const msg = input.trim();
  if (!msg || running) return;
  setRunning(true); setResult(null); setProgress([]); setError('');
  try {
   const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, app_id: APP_ID }),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Request failed'); setRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, s => setProgress(p => [...p, s]), r => setResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setProgress(p => [...p, s]), r => setResult(r), setError);
   }
   setInput('');
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 return (
  <Box>
   {/* Chat Input */}
   <Paper sx={{ mb: 2, overflow: 'hidden', background: 'linear-gradient(135deg, #1976d212, #0050ac08)', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
     <SmartToyIcon sx={{ color: '#1976d2', fontSize: 28 }} />
     <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
     </Box>
     {result && (
      <Tooltip title="Clear"><IconButton size="small" onClick={() => { setResult(null); setProgress([]); setInput(''); }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     )}
    </Box>
    <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
     <TextField inputRef={inputRef} size="small" fullWidth placeholder={placeholder}
      value={input} onChange={e => setInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
      sx={{ '& .MuiOutlinedInput-root': { fontSize: 14, bgcolor: 'background.paper' } }} />
     <Button variant="contained" size="small" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
      onClick={run} disabled={running || !input.trim()}
      sx={{ background: 'linear-gradient(135deg, #1976d2, #0050ac)', minWidth: 100, height: 40, fontWeight: 700, '&:hover': { background: 'linear-gradient(135deg, #0050ac, #1976d2)' } }}>
      {running ? 'Thinking...' : 'Send'}
     </Button>
    </Box>
    {running && <LinearProgress sx={{ height: 2 }} />}
   </Paper>

   {/* Activity */}
   {(progress.length > 0 || running) && (
    <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
     <Box sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Activity</Typography>
      {running && <CircularProgress size={12} />}
     </Box>
     <SkillWidgetActivity steps={progress} isRunning={running} />
    </Paper>
   )}

   {/* Results Output */}
   <Paper variant="outlined" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Results</Typography>
     {running && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}
     {!result && !running && !error && (
      <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 3 }}>Results will appear here...</Typography>
     )}
     {running && !result && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
       <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing...</Typography>
      </Box>
     )}
     {result && (
      <Box>
       {result.error && <Alert severity="error" sx={{ mb: 1 }}>{result.error}</Alert>}
       {result.status && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
         {result.status === 'success' ? <CheckCircleIcon color="success" sx={{ fontSize: 14 }} /> : <ErrorIcon color="error" sx={{ fontSize: 14 }} />}
         <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{(result.duration / 1000).toFixed(1)}s</Typography>
        </Box>
       )}
       <RichOutput text={result.output || ''} />
      </Box>
     )}
    </Box>
   </Paper>
  </Box>
 );
}
/* ── End Skill Widget ─────────────────────────────────────── */

export function MembersYoutubeContentGeneratorPage() {
  // Mock data for stats
  const stats = useMemo(() => ({
    totalScriptsCreated: 128,
    totalScriptIdeas: 45,
    scriptDraftsGenerated: 75,
    seoDescriptionsGenerated: 30
  }), []);
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#fafbfc' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center', p: 3, background: 'linear-gradient(135deg, #1976d2, #5147ad)', borderRadius: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
          <SmartToyIcon sx={{ fontSize: '1.2em', verticalAlign: 'middle', mr: 1 }} />
          Elevate Your YouTube Content Creation
        </Typography>
        <Typography variant="body1" sx={{ color: '#ddd' }}>
          Leverage AI to generate content ideas, draft scripts, and optimize your video descriptions for better performance.
        </Typography>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} /> Total Scripts Created
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{stats.totalScriptsCreated}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SmartToyIcon sx={{ color: '#1976d2', mr: 1 }} /> Script Ideas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#27ae60' }}>{stats.totalScriptIdeas}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SendIcon sx={{ color: '#e74c3c', mr: 1 }} /> Drafts Generated
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f39c12' }}>{stats.scriptDraftsGenerated}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="primary" sx={{ mr: 1 }} /> SEO Descriptions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9b59b6' }}>{stats.seoDescriptionsGenerated}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Skill Widget */}
      <SkillWidget placeholder="Describe your YouTube script needs..." title="YouTube Content AI" />
    </Box>
  );
}