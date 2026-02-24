import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, TextField, IconButton, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Alert, Stack,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, UploadFile as UploadIcon,
  Description as DocIcon, PictureAsPdf as PdfIcon, TextSnippet as TextIcon,
  Language as UrlIcon, Search as SearchIcon, Storage as StorageIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

interface KBSource {
  type: string;
  filename?: string;
  url?: string;
  uploadedAt: string;
  pageCount?: number;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  sources: KBSource[];
  chunks: any[];
  totalChunks: number;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

const API = `${API_BASE_URL}/api/knowledge-base`;

export function KnowledgeBasePage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);

  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);


  const fetchAll = useCallback(async () => {
    try {
      const r = await fetch(API);
      const data = await r.json();
      if (data.success) setKbs(data.knowledgeBases);
    } catch (e: any) { setError(e.message); }
  }, []);

  const fetchOne = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${API}/${id}`);
      const data = await r.json();
      if (data.success) setSelectedKb(data.knowledgeBase);
    } catch (e: any) { setError(e.message); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      const data = await r.json();
      if (data.success) {
        setCreateOpen(false);
        setNewName('');
        setNewDesc('');
        fetchAll();
        setSelectedKb(data.knowledgeBase);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge base and all its data?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (selectedKb?.id === id) setSelectedKb(null);
    fetchAll();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedKb || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch(`${API}/${selectedKb.id}/upload`, { method: 'POST', body: form });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      await fetchOne(selectedKb.id);
      fetchAll();
    } catch (e: any) { setError(e.message); }
    setUploading(false);
    e.target.value = '';
  };

  const handleAddText = async () => {
    if (!selectedKb || !textInput.trim()) return;
    setUploading(true);
    try {
      await fetch(`${API}/${selectedKb.id}/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      });
      setAddTextOpen(false);
      setTextInput('');
      await fetchOne(selectedKb.id);
      fetchAll();
    } catch (e: any) { setError(e.message); }
    setUploading(false);
  };

  const handleAddUrl = async () => {
    if (!selectedKb || !urlInput.trim()) return;
    setUploading(true);
    try {
      await fetch(`${API}/${selectedKb.id}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      setAddUrlOpen(false);
      setUrlInput('');
      await fetchOne(selectedKb.id);
      fetchAll();
    } catch (e: any) { setError(e.message); }
    setUploading(false);
  };

  const handleRemoveSource = async (sourceIndex: number) => {
    if (!selectedKb) return;
    await fetch(`${API}/${selectedKb.id}/source/${sourceIndex}`, { method: 'DELETE' });
    await fetchOne(selectedKb.id);
    fetchAll();
  };

  const handleQuery = async () => {
    if (!selectedKb || !queryText.trim()) return;
    try {
      const r = await fetch(`${API}/${selectedKb.id}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });
      const data = await r.json();
      if (data.success) setQueryResults(data.chunks);
    } catch (e: any) { setError(e.message); }
  };

  const sourceIcon = (type: string) => {
    if (type === 'pdf') return <PdfIcon color="error" />;
    if (type === 'docx') return <DocIcon color="primary" />;
    if (type === 'url') return <UrlIcon color="secondary" />;
    return <TextIcon />;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Knowledge Base</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload documents and content for your chat agents to reference
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Knowledge Base
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: KB List */}
        <Paper sx={{ width: 320, flexShrink: 0, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Your Knowledge Bases</Typography>
          {kbs.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No knowledge bases yet. Create one to get started.
            </Typography>
          )}
          <List dense>
            {kbs.map((kb) => (
              <ListItem
                key={kb.id}
                button
                selected={selectedKb?.id === kb.id}
                onClick={() => fetchOne(kb.id)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon><StorageIcon fontSize="small" /></ListItemIcon>
                <ListItemText
                  primary={kb.name}
                  secondary={`${kb.totalChunks} chunks · ~${kb.totalTokens.toLocaleString()} tokens`}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => handleDelete(kb.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Right: KB Detail */}
        <Box sx={{ flex: 1 }}>
          {!selectedKb ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Select or create a knowledge base</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* Header */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">{selectedKb.name}</Typography>
                {selectedKb.description && (
                  <Typography variant="body2" color="text.secondary">{selectedKb.description}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip size="small" label={`${selectedKb.totalChunks} chunks`} />
                  <Chip size="small" label={`~${selectedKb.totalTokens.toLocaleString()} tokens`} />
                  <Chip size="small" label={`${selectedKb.sources.length} sources`} />
                  <Chip size="small" label={`ID: ${selectedKb.id}`} variant="outlined"
                    onClick={() => navigator.clipboard.writeText(selectedKb.id)}
                    icon={<CopyIcon />} />
                </Box>
              </Paper>

              {/* Add Sources */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Content</Typography>
                {uploading && <LinearProgress sx={{ mb: 1 }} />}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small">
                    Upload PDF / DOCX
                    <input type="file" hidden accept=".pdf,.docx,.txt,.csv,.md" onChange={handleFileUpload} />
                  </Button>
                  <Button variant="outlined" startIcon={<TextIcon />} size="small" onClick={() => setAddTextOpen(true)}>
                    Paste Text
                  </Button>
                  <Button variant="outlined" startIcon={<UrlIcon />} size="small" onClick={() => setAddUrlOpen(true)}>
                    Add URL
                  </Button>
                </Box>
              </Paper>

              {/* Sources */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Sources ({selectedKb.sources.length})</Typography>
                {selectedKb.sources.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No sources added yet</Typography>
                ) : (
                  <List dense>
                    {selectedKb.sources.map((src, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>{sourceIcon(src.type)}</ListItemIcon>
                        <ListItemText
                          primary={src.filename || src.url || `Text source #${i + 1}`}
                          secondary={`${src.type.toUpperCase()} · ${new Date(src.uploadedAt).toLocaleDateString()}${src.pageCount ? ` · ${src.pageCount} pages` : ''}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => handleRemoveSource(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              {/* Test Query */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Test Query</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small" fullWidth placeholder="Ask a question to test retrieval..."
                    value={queryText} onChange={(e) => setQueryText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  />
                  <Button variant="contained" onClick={handleQuery} startIcon={<SearchIcon />}>
                    Test
                  </Button>
                </Box>
                {queryResults.length > 0 && (
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {queryResults.length} relevant chunks found
                    </Typography>
                    {queryResults.map((chunk, i) => (
                      <Card key={chunk.id} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="caption" color="primary">
                            Source #{chunk.sourceIndex + 1} {chunk.pageNumber ? `· Page ${chunk.pageNumber}` : ''} · {chunk.tokenCount} tokens
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13 }}>
                            {chunk.text.substring(0, 300)}{chunk.text.length > 300 ? '...' : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Knowledge Base</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Name" sx={{ mt: 1, mb: 2 }}
            placeholder="e.g., Product Documentation"
            value={newName} onChange={(e) => setNewName(e.target.value)}
          />
          <TextField
            fullWidth label="Description" multiline rows={2}
            placeholder="What kind of content will this contain?"
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Add Text Dialog */}
      <Dialog open={addTextOpen} onClose={() => setAddTextOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Paste Text Content</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline rows={10} sx={{ mt: 1 }}
            placeholder="Paste your content here — FAQ answers, product descriptions, policies, etc."
            value={textInput} onChange={(e) => setTextInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTextOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddText} disabled={!textInput.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add URL Dialog */}
      <Dialog open={addUrlOpen} onClose={() => setAddUrlOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add URL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            The page content will be scraped and added to the knowledge base.
          </Typography>
          <TextField
            autoFocus fullWidth label="URL" sx={{ mt: 1 }}
            placeholder="https://example.com/about"
            value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUrlOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUrl} disabled={!urlInput.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
