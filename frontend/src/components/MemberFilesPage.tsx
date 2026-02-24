import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, Chip, CircularProgress,
  Alert, IconButton, InputAdornment, Grid, Card, CardContent,
  CardActions, Button, Tooltip,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as HtmlIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { API } from '../config/api';

// ── Types ─────────────────────────────────────────────────────────────

interface FileEntry {
  name: string;
  category: string;
  path: string;
  size: number;
  modified: string;
  url: string;
}

type FileCategory = 'all' | 'images' | 'pdfs' | 'html' | 'files';

// ── Helpers ───────────────────────────────────────────────────────────

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (ts: string) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'images': return <ImageIcon color="success" />;
    case 'pdfs': return <PdfIcon color="error" />;
    case 'html': return <HtmlIcon color="info" />;
    default: return <FileIcon color="action" />;
  }
};



// ── Component ─────────────────────────────────────────────────────────

export function MemberFilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FileCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<FileEntry | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const catParam = category !== 'all' ? `?category=${category}` : '';
      const resp = await fetch(`${API.skills}/files${catParam}`);
      const data = await resp.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError('Failed to load files: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [files, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (category !== 'all') form.append('category', category);

      const resp = await fetch(`${API.skills}/files/upload`, { method: 'POST', body: form });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      setSuccess(`Uploaded: ${file.name}`);
      loadFiles();
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: FileEntry) => {
    setDeleteDialog(null);
    setError('');
    try {
      const resp = await fetch(`${API.skills}/files/${file.category}/${encodeURIComponent(file.name)}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Delete failed');
      setSuccess(`Deleted: ${file.name}`);
      loadFiles();
    } catch (err: any) {
      setError('Delete failed: ' + err.message);
    }
  };

  const downloadUrl = (file: FileEntry) => {
    // Build absolute URL from API base
    const base = API.skills.replace('/api/skills', '');
    return `${base}${file.url}`;
  };



  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
        <FolderIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>Documents</Typography>

        <TextField
          size="small" placeholder="Search files..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ width: 220 }}
        />

        {/* Category filter tabs */}
        <Tabs value={category} onChange={(_, v) => setCategory(v)}
          sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none', minWidth: 60 } }}>
          <Tab label="All" value="all" />
          <Tab label="Images" value="images" icon={<ImageIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
          <Tab label="PDFs" value="pdfs" icon={<PdfIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
          <Tab label="HTML" value="html" icon={<HtmlIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
          <Tab label="Files" value="files" icon={<FileIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
        </Tabs>

        {/* View toggle */}
        <IconButton size="small" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
        </IconButton>

        <Tooltip title="Refresh"><IconButton onClick={loadFiles} disabled={loading}><RefreshIcon /></IconButton></Tooltip>

        {/* Upload */}
        <input ref={fileInputRef} type="file" hidden
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.html,.htm,.doc,.docx,.txt,.csv,.md,.json,.xml"
          onChange={handleUpload} />
        <Button variant="contained" startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          Upload
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mb: 1 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mx: 2, mb: 1 }}>{success}</Alert>}

      {/* File list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : filteredFiles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No documents yet</Typography>
            <Typography color="text.disabled" sx={{ mb: 3 }}>Upload documents or run skills to generate files — JPEGs, PDFs, Word docs and more.</Typography>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              Upload your first file
            </Button>
          </Box>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={2}>
            {filteredFiles.map(file => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={file.path}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Preview area */}
                  {file.category === 'images' ? (
                    <Box sx={{
                      height: 160, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundImage: `url(${downloadUrl(file)})`, backgroundSize: 'contain', backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }} />
                  ) : (
                    <Box sx={{ height: 100, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getCategoryIcon(file.category)}
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1, pb: 0.5, pt: 1.5 }}>
                    <Tooltip title={file.name}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </Typography>
                    </Tooltip>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={file.category} size="small" sx={{ fontSize: 10, height: 20 }} />
                      <Chip label={formatSize(file.size)} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                      {formatDate(file.modified)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <Tooltip title="Download">
                      <IconButton size="small" component="a" href={downloadUrl(file)} download={file.name} target="_blank">
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(file)}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* List view */
          <Paper variant="outlined">
            {filteredFiles.map((file, i) => (
              <Box key={file.path} sx={{
                display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
                borderBottom: i < filteredFiles.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}>
                {getCategoryIcon(file.category)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </Typography>
                </Box>
                <Chip label={file.category} size="small" sx={{ fontSize: 10, height: 20 }} />
                <Typography variant="caption" color="text.disabled" sx={{ width: 80, textAlign: 'right' }}>{formatSize(file.size)}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ width: 150, textAlign: 'right' }}>{formatDate(file.modified)}</Typography>
                <Tooltip title="Download">
                  <IconButton size="small" component="a" href={downloadUrl(file)} download={file.name} target="_blank">
                    <DownloadIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => setDeleteDialog(file)}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, pb: 1, flexShrink: 0, display: 'flex', gap: 2 }}>
        <Typography variant="caption" color="text.disabled">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Total: {formatSize(filteredFiles.reduce((s, f) => s + f.size, 0))}
        </Typography>
      </Box>

      {/* Delete confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
