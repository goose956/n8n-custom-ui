import { useState, useEffect, useRef } from 'react';
import {
 Box, Typography, Paper, Button, TextField, IconButton, Alert,
 CircularProgress, Tooltip, Divider, LinearProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

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


/* ── SSE helpers ──────────────────────────────────────── */
interface SkillRunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }

function parseSSE(
 buffer: string,
 isFinal: boolean,
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
    if (evType === 'done' && p.result) onDone(p.result);
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

/* ── Rich output renderer ─────────────────────────────── */
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

/* ── Page component ───────────────────────────────────── */
export function MembersYoutubeBloggerPage() {
 const [input, setInput] = useState('');
 const [running, setRunning] = useState(false);
 const [result, setResult] = useState<SkillRunResult | null>(null);
 const [error, setError] = useState('');
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => { inputRef.current?.focus(); }, []);

 const run = async () => {
  const msg = input.trim();
  if (!msg || running) return;
  setRunning(true); setResult(null); setError('');
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
    if (done) { parseSSE(buf, true, r => setResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, r => setResult(r), setError);
   }
   setInput('');
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 return (
  <Box>
   {/* Hero */}
   <Paper sx={heroSx}>
    <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
    <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: 20, right: 120 }} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
     <AutoAwesomeIcon sx={{ fontSize: 36, opacity: 0.9 }} />
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.5 }}>Youtube blogger</Typography>
      <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 520 }}>Create blog article using  .  Also need an aricle size into box and download as a pdf button.</Typography>
     </Box>
    </Box>
   </Paper>

   {/* Chat Input */}
   <Paper sx={{ mb: 2, overflow: 'hidden', background: 'linear-gradient(135deg, #1976d212, #0050ac08)', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
     <SmartToyIcon sx={{ color: '#1976d2', fontSize: 28 }} />
     <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Youtube blogger AI</Typography>
     </Box>
     {result && (
      <Tooltip title="Clear"><IconButton size="small" onClick={() => { setResult(null); setInput(''); }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     )}
    </Box>
    <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
     <TextField inputRef={inputRef} size="small" fullWidth placeholder="Describe what you need..."
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

   {/* Results */}
   <Paper variant="outlined" sx={{ minHeight: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 4 }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Results</Typography>
     {running && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}
     {!result && !running && !error && (
      <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 6 }}>Results will appear here...</Typography>
     )}
     {running && !result && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, justifyContent: 'center' }}>
       <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing your request...</Typography>
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
