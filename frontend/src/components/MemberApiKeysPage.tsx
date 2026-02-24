import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Chip,
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,

} from '@mui/icons-material';
import { API } from '../config/api';

// ── Types ─────────────────────────────────────────────────────────────

interface ApiKeyEntry {
  name: string;
  maskedValue: string;
  createdAt?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export function MemberApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(API.apiKeys);
      const data = await resp.json();
      setKeys(data.keys || []);
    } catch (err: any) {
      setError('Failed to load API keys: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleAdd = async () => {
    if (!newName.trim() || !newValue.trim()) {
      setError('Both name and value are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const resp = await fetch(API.apiKeys, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), value: newValue.trim() }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Save failed');
      setSuccess(`API key "${newName}" saved`);
      setAddOpen(false);
      setNewName('');
      setNewValue('');
      setShowValue(false);
      loadKeys();
    } catch (err: any) {
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    setDeleteKey(null);
    setError('');
    try {
      const resp = await fetch(`${API.apiKeys}/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Delete failed');
      setSuccess(`Deleted "${name}"`);
      loadKeys();
    } catch (err: any) {
      setError('Delete failed: ' + err.message);
    }
  };

  // Common key suggestions  
  const KEY_SUGGESTIONS = [
    { label: 'OpenAI', name: 'OPENAI_API_KEY', placeholder: 'sk-...' },
    { label: 'Anthropic', name: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' },
    { label: 'Google AI', name: 'GOOGLE_AI_API_KEY', placeholder: 'AI...' },
    { label: 'Serper (Google Search)', name: 'SERPER_API_KEY', placeholder: '' },
    { label: 'Firecrawl', name: 'FIRECRAWL_API_KEY', placeholder: 'fc-...' },
    { label: 'LinkedIn', name: 'LINKEDIN_ACCESS_TOKEN', placeholder: '' },
    { label: 'Stripe', name: 'STRIPE_SECRET_KEY', placeholder: 'sk_...' },
  ];

  const existingNames = new Set(keys.map(k => k.name));

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <KeyIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>API Keys</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add API Key
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2, lineHeight: 1.6 }}>
        Store your API keys securely. Keys are used by AI skills when they need access to external services like OpenAI, Google, Serper, etc.
        Values are encrypted and never shown in full after saving.
      </Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mb: 1 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mx: 2, mb: 1 }}>{success}</Alert>}

      {/* Keys table */}
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', mx: 2, mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : keys.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <KeyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No API keys yet</Typography>
            <Typography color="text.disabled" sx={{ mb: 3 }}>Add your API keys so AI skills can access external services.</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Add your first key
            </Button>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 100 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map(k => (
                <TableRow key={k.name} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <KeyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{k.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {k.maskedValue || '••••••••'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteKey(k.name)}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Quick-add suggestions */}
      {keys.length > 0 && (
        <Box sx={{ px: 2, pb: 2, flexShrink: 0 }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, display: 'block' }}>Quick add:</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {KEY_SUGGESTIONS.filter(s => !existingNames.has(s.name)).map(s => (
              <Chip
                key={s.name}
                label={s.label}
                size="small"
                variant="outlined"
                sx={{ cursor: 'pointer', fontSize: 11 }}
                onClick={() => { setNewName(s.name); setAddOpen(true); }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add API Key</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Key Name" fullWidth value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. OPENAI_API_KEY" helperText="Use UPPERCASE_WITH_UNDERSCORES"
            sx={{ fontFamily: 'monospace' }}
          />
          <TextField
            label="Key Value" fullWidth value={newValue} onChange={e => setNewValue(e.target.value)}
            type={showValue ? 'text' : 'password'} placeholder="Paste your API key here"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowValue(!showValue)}>
                    {showValue ? <HideIcon sx={{ fontSize: 18 }} /> : <ShowIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* Suggestions */}
          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, display: 'block' }}>Common keys:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {KEY_SUGGESTIONS.map(s => (
                <Chip key={s.name} label={s.label} size="small" variant="outlined"
                  color={newName === s.name ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer', fontSize: 11 }}
                  onClick={() => setNewName(s.name)} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddOpen(false); setNewName(''); setNewValue(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving || !newName.trim() || !newValue.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {saving ? 'Saving...' : 'Save Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteKey} onClose={() => setDeleteKey(null)}>
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteKey}</strong>? Skills that depend on this key will stop working.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteKey(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteKey && handleDelete(deleteKey)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
