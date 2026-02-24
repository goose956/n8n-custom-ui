import { useEffect, useState, useCallback, useRef } from 'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button,
 Chip, CircularProgress, Alert, TextField, InputAdornment, IconButton,
 Tooltip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions as DActions,
} from '@mui/material';
import Folder from '@mui/icons-material/Folder';
import Image from '@mui/icons-material/Image';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Code from '@mui/icons-material/Code';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import ViewList from '@mui/icons-material/ViewList';
import ViewModule from '@mui/icons-material/ViewModule';

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


interface FileEntry { name: string; category: string; path: string; size: number; modified: string; url: string; }

const fmtSize = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB';
const catIcon = (c: string) => c === 'images' ? <Image color="success" /> : c === 'pdfs' ? <PictureAsPdf color="error" /> : c === 'html' ? <Code color="info" /> : <InsertDriveFile color="action" />;

export function MembersDocumentsPage() {
 const [files, setFiles] = useState<FileEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('all');
 const [view, setView] = useState<'grid'|'list'>('grid');
 const [uploading, setUploading] = useState(false);
 const [delTarget, setDelTarget] = useState<FileEntry | null>(null);
 const fileRef = useRef<HTMLInputElement>(null);

 const load = useCallback(async () => {
  setLoading(true);
  try {
   const params = new URLSearchParams();
   params.set('app_id', String(APP_ID));
   if (category !== 'all') params.set('category', category);
   const res = await fetch(API_BASE + '/api/skills/files?' + params.toString()).then(r => r.json());
   setFiles(res.files || []);
  } catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, [category]);

 useEffect(() => { load(); }, [load]);

 const filtered = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

 const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  setUploading(true); setError(''); setSuccess('');
  try {
   const form = new FormData(); form.append('file', file);
   if (category !== 'all') form.append('category', category);
   form.append('app_id', String(APP_ID));
   const res = await fetch(API_BASE + '/api/skills/files/upload', { method: 'POST', body: form }).then(r => r.json());
   if (!res.success) throw new Error(res.message);
   setSuccess('Uploaded: ' + file.name); load();
  } catch (e: any) { setError(e.message); }
  finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
 };

 const del = async (f: FileEntry) => {
  setDelTarget(null);
  try {
   const res = await fetch(API_BASE + '/api/skills/files/' + f.category + '/' + encodeURIComponent(f.name) + '?app_id=' + APP_ID, { method: 'DELETE' }).then(r => r.json());
   if (!res.success) throw new Error(res.message);
   setSuccess('Deleted: ' + f.name); load();
  } catch (e: any) { setError(e.message); }
 };

 const dlUrl = (f: FileEntry) => API_BASE + f.url;

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <Folder /> YouTube script creator Documents
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>Easily manage all your scripts, transcriptions, and thumbnails in one organized space.</Typography>
     </Box>
     <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.html,.doc,.docx,.txt,.csv,.md,.json,.xml" onChange={upload} />
      <Button variant="contained" startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
       onClick={() => fileRef.current?.click()} disabled={uploading}
       sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Upload</Button>
     </Box>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
   {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

   <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
     InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 220 }} />
    <Tabs value={category} onChange={(_, v) => setCategory(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none', minWidth: 60 } }}>
     <Tab label="All" value="all" /><Tab label="Images" value="images" /><Tab label="PDFs" value="pdfs" /><Tab label="HTML" value="html" /><Tab label="Files" value="files" />
    </Tabs>
    <Box sx={{ flex: 1 }} />
    <IconButton onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? <ViewList /> : <ViewModule />}</IconButton>
    <Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip>
   </Box>

   {filtered.length === 0 ? (
    <Box sx={{ textAlign: 'center', py: 6 }}>
     <Folder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
     <Typography variant="h6" color="text.secondary">No documents yet</Typography>
     <Typography color="text.disabled" sx={{ mb: 2 }}>Upload documents or run skills to generate files.</Typography>
     <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()}>Upload first file</Button>
    </Box>
   ) : (
    <Grid container spacing={2}>
     {filtered.map(f => (
      <Grid item xs={12} sm={6} md={view === 'grid' ? 3 : 12} key={f.path}>
       <Card sx={cardSx}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
         {catIcon(f.category)}
         <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={f.name}><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }} noWrap>{f.name}</Typography></Tooltip>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
           <Chip label={f.category} size="small" sx={{ fontSize: 10, height: 20 }} />
           <Chip label={fmtSize(f.size)} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
          </Box>
         </Box>
         <Tooltip title="Download"><IconButton size="small" component="a" href={dlUrl(f)} download={f.name} target="_blank"><Download /></IconButton></Tooltip>
         <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDelTarget(f)}><Delete /></IconButton></Tooltip>
        </CardContent>
       </Card>
      </Grid>
     ))}
    </Grid>
   )}

   <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
    <Typography variant="caption" color="text.disabled">{filtered.length} files</Typography>
    <Typography variant="caption" color="text.disabled">Total: {fmtSize(filtered.reduce((s, f) => s + f.size, 0))}</Typography>
   </Box>

   <Dialog open={!!delTarget} onClose={() => setDelTarget(null)}>
    <DialogTitle>Delete File</DialogTitle>
    <DialogContent><Typography>Delete <strong>{delTarget?.name}</strong>?</Typography></DialogContent>
    <DActions><Button onClick={() => setDelTarget(null)}>Cancel</Button><Button color="error" variant="contained" onClick={() => delTarget && del(delTarget)}>Delete</Button></DActions>
   </Dialog>
  </Box>
 );
}