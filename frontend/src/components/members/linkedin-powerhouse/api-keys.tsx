import { useEffect, useState, useCallback } from 'react';
import {
 Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
 Button, Chip, CircularProgress, Alert, TextField, Dialog, DialogTitle,
 DialogContent, DialogActions, IconButton, Tooltip, Avatar, Snackbar,
} from '@mui/material';
import VpnKey from '@mui/icons-material/VpnKey';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Refresh from '@mui/icons-material/Refresh';
import CheckCircle from '@mui/icons-material/CheckCircle';

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


interface ApiKey { name: string; value: string; createdAt?: string; }
const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Brave', 'Apify', 'Resend', 'Perplexity'];

/* Which API keys are needed by which tools */
const REQUIRED_KEYS: { key: string; label: string; tools: string[]; description: string }[] = [
 { key: 'openai', label: 'OpenAI', tools: ['generate-image', 'text-to-speech', 'transcribe-audio'], description: 'AI chat, DALL-E images, text-to-speech, audio transcription' },
 { key: 'brave', label: 'Brave Search', tools: ['brave-search'], description: 'Web search for research and content skills' },
 { key: 'apify', label: 'Apify', tools: ['apify-scraper'], description: 'Web scraping to read full page content' },
 { key: 'resend', label: 'Resend', tools: ['send-email'], description: 'Send emails from skills' },
];

export function MembersApiKeysPage() {
 const [keys, setKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [addOpen, setAddOpen] = useState(false);
 const [newName, setNewName] = useState('');
 const [newValue, setNewValue] = useState('');
 const [saving, setSaving] = useState(false);
 const [showValues, setShowValues] = useState<Record<string, boolean>>({});
 const [snack, setSnack] = useState('');

 const load = useCallback(async () => {
  setLoading(true);
  try { const res = await fetch(API_BASE + '/api/api-keys').then(r => r.json()); setKeys(res.keys || []); }
  catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, []);

 useEffect(() => { load(); }, [load]);

 const addKey = async () => {
  if (!newName.trim() || !newValue.trim()) return;
  setSaving(true);
  try {
   await fetch(API_BASE + '/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), value: newValue.trim() }) });
   setSnack('Key added: ' + newName); setNewName(''); setNewValue(''); setAddOpen(false); load();
  } catch (e: any) { setError(e.message); }
  finally { setSaving(false); }
 };

 const delKey = async (name: string) => {
  try { await fetch(API_BASE + '/api/api-keys/' + encodeURIComponent(name), { method: 'DELETE' }); setSnack('Deleted: ' + name); load(); }
  catch (e: any) { setError(e.message); }
 };

 const mask = (v: string) => v.slice(0, 4) + '••••••••' + v.slice(-4);

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <VpnKey /> LinkedIn Powerhouse API Keys
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>Generate and manage API keys to enhance app functionality.</Typography>
     </Box>
     <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}
      sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Add Key</Button>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* Required Keys Status */}
   <Paper sx={{ ...sectionSx, mb: 2 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
     <VpnKey sx={{ fontSize: 18 }} /> Required API Keys for Your Tools
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
     {REQUIRED_KEYS.map(rk => {
      const configured = keys.some(k => k.name.toLowerCase() === rk.key.toLowerCase() && k.value);
      return (
       <Box key={rk.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: configured ? '#e8f5e9' : '#fff3e0', flexWrap: 'wrap' }}>
        <CheckCircle sx={{ fontSize: 18, color: configured ? '#4caf50' : '#bbb' }} />
        <Typography sx={{ fontWeight: 700, fontSize: 13, minWidth: 100 }}>{rk.label}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontSize: 12 }}>{rk.description}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
         {rk.tools.map(t => <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: 10 }} />)}
        </Box>
        {configured ? (
         <Chip label="Configured" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, height: 22, fontSize: 11 }} />
        ) : (
         <Button size="small" variant="outlined" color="warning" sx={{ fontWeight: 600, fontSize: 11, height: 24, textTransform: 'none' }}
          onClick={() => { setNewName(rk.label); setAddOpen(true); }}>
          Add Key
         </Button>
        )}
       </Box>
      );
     })}
    </Box>
   </Paper>

   <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
    {PROVIDERS.map(p => (
     <Chip key={p} label={'+ ' + p} clickable onClick={() => { setNewName(p); setAddOpen(true); }} sx={{ fontWeight: 600 }} />
    ))}
   </Box>

   <Paper sx={{ ...sectionSx, p: 0 }}>
    <Table>
     <TableHead>
      <TableRow sx={{ bgcolor: COLORS.bg }}>
       <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
       <TableCell sx={{ fontWeight: 700 }}>Key</TableCell>
       <TableCell sx={{ fontWeight: 700 }}>Added</TableCell>
       <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {keys.length === 0 ? (
       <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
        <VpnKey sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No API keys yet</Typography>
        <Button size="small" onClick={() => setAddOpen(true)} sx={{ mt: 1 }}>Add your first key</Button>
       </TableCell></TableRow>
      ) : keys.map(k => (
       <TableRow key={k.name} hover>
        <TableCell>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.tint, color: COLORS.primary, fontSize: '0.8rem' }}><VpnKey sx={{ fontSize: 16 }} /></Avatar>
          <Typography sx={{ fontWeight: 600 }}>{k.name}</Typography>
         </Box>
        </TableCell>
        <TableCell>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{showValues[k.name] ? k.value : mask(k.value)}</Typography>
          <IconButton size="small" onClick={() => setShowValues(prev => ({ ...prev, [k.name]: !prev[k.name] }))}>{showValues[k.name] ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton>
         </Box>
        </TableCell>
        <TableCell>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</TableCell>
        <TableCell align="right">
         <Tooltip title="Delete"><IconButton color="error" onClick={() => delKey(k.name)}><Delete /></IconButton></Tooltip>
        </TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </Paper>

   <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
    <DialogTitle>Add API Key</DialogTitle>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
     <TextField label="Provider Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth size="small" />
     <TextField label="API Key Value" value={newValue} onChange={e => setNewValue(e.target.value)} fullWidth size="small" type="password" />
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setAddOpen(false)}>Cancel</Button>
     <Button variant="contained" onClick={addKey} disabled={saving || !newName.trim() || !newValue.trim()} sx={gradientBtnSx}>
      {saving ? <CircularProgress size={16} /> : 'Save Key'}
     </Button>
    </DialogActions>
   </Dialog>

   <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
  </Box>
 );
}