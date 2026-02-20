import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Tooltip, LinearProgress, InputAdornment,
  Alert, Snackbar, Grid, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/GetApp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DataIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';

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
};

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const API_URL = `${API_BASE}/api/youtube-automations-scraper`;

interface ScraperResult {
  [key: string]: any;
}

export function MembersYoutubeAutomationsScraperPage() {
  const [results, setResults] = useState<ScraperResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ScraperResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [maxItems, setMaxItems] = useState(100);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  // Poll status when a run is active
  useEffect(() => {
    if (!runId || runStatus === 'SUCCEEDED' || runStatus === 'FAILED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/status?runId=${runId}`);
        const data = await res.json();
        if (data.success) {
          setRunStatus(data.status);
          if (data.status === 'SUCCEEDED') {
            setSnack({ open: true, msg: 'Scrape completed! Loading results...', severity: 'success' });
            loadResults(runId);
          } else if (data.status === 'FAILED') {
            setSnack({ open: true, msg: 'Scrape failed. Please try again.', severity: 'error' });
          }
        }
      } catch (err) { /* keep polling */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [runId, runStatus]);

  // Filter results when search changes
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredResults(results); return; }
    const q = searchQuery.toLowerCase();
    setFilteredResults(results.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    ));
  }, [searchQuery, results]);

  const loadResults = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/results?runId=${rid}`);
      const data = await res.json();
      if (data.success && data.data) {
        setResults(data.data);
        setFilteredResults(data.data);
      }
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to load results', severity: 'error' });
    }
    setLoading(false);
  }, []);

  const startScrape = async () => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      setSnack({ open: true, msg: 'Enter at least one URL', severity: 'error' });
      return;
    }
    setRunDialogOpen(false);
    setLoading(true);
    setRunStatus('STARTING');
    try {
      const res = await fetch(`${API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, options: { maxItems } }),
      });
      const data = await res.json();
      if (data.success && data.runId) {
        setRunId(data.runId);
        setRunStatus('RUNNING');
        setSnack({ open: true, msg: 'Scraper started! Results will appear when complete.', severity: 'success' });
      } else {
        setRunStatus(null);
        setSnack({ open: true, msg: data.message || 'Failed to start', severity: 'error' });
      }
    } catch (err) {
      setRunStatus(null);
      setSnack({ open: true, msg: 'Network error starting scraper', severity: 'error' });
    }
    setLoading(false);
  };

  const exportCsv = () => {
    if (filteredResults.length === 0) return;
    const keys = Object.keys(filteredResults[0]).filter(k => typeof filteredResults[0][k] !== 'object');
    const header = keys.join(',');
    const rows = filteredResults.map(r => keys.map(k => {
      const v = String(r[k] ?? '').replace(/"/g, '""');
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-automations-scraper-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive columns from first result
  const columns = results.length > 0
    ? Object.keys(results[0]).filter(k => typeof results[0][k] !== 'object').slice(0, 8)
    : [];

  const isRunning = runStatus === 'RUNNING' || runStatus === 'STARTING';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Hero header */}
      <Paper sx={{
        p: { xs: 3, md: 4 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, #1976d2 0%, #0050ac 100%)`, color: '#fff',
      }} elevation={0}>
        <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
        <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -30, left: '30%' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <DataIcon sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              youtube automations Scraper
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Run Apify scrapers, view results, and export data. Connect any Apify actor to power your youtube automations integrations.
          </Typography>
        </Box>
      </Paper>

      {/* Status bar */}
      {isRunning && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', alignItems: 'center', gap: 2 }} elevation={0}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>Scraper running...</Typography>
            <LinearProgress sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: COLORS.tint, '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />
          </Box>
          <Chip icon={<TimerIcon />} label={runStatus} size="small" sx={{ fontWeight: 600 }} />
        </Paper>
      )}

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Results', value: results.length, icon: <DataIcon />, color: COLORS.primary },
          { label: 'Filtered', value: filteredResults.length, icon: <SearchIcon />, color: '#2196f3' },
          { label: 'Status', value: runStatus || 'Ready', icon: runStatus === 'SUCCEEDED' ? <CheckCircleIcon /> : <TimerIcon />, color: runStatus === 'SUCCEEDED' ? COLORS.success : COLORS.warning },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.25s', '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover } }} elevation={0}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', fontSize: '0.7rem' }}>{stat.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{stat.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }} elevation={0}>
        <TextField
          size="small" placeholder="Search results..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#999' }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
        />
        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setRunDialogOpen(true)}
          disabled={isRunning}
          sx={{
            background: `linear-gradient(135deg, #1976d2 0%, #0050ac 100%)`,
            color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 3,
            boxShadow: '0 4px 15px #1976d240',
            '&:hover': { boxShadow: '0 6px 20px #1976d260' },
          }}>
          {isRunning ? 'Running...' : 'New Scrape'}
        </Button>
        <Tooltip title="Refresh results">
          <IconButton onClick={() => runId && loadResults(runId)} disabled={!runId || loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export CSV">
          <IconButton onClick={exportCsv} disabled={filteredResults.length === 0}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Results table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid ' + COLORS.border, overflow: 'hidden' }} elevation={0}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}
          </Box>
        ) : filteredResults.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <DataIcon sx={{ fontSize: 56, color: '#ddd', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#999', mb: 1 }}>No results yet</Typography>
            <Typography variant="body2" sx={{ color: '#bbb', mb: 3 }}>
              Click "New Scrape" to run your first scrape and see results here.
            </Typography>
            <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setRunDialogOpen(true)}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}>
              Run First Scrape
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8f9fa' }}>#</TableCell>
                  {columns.map(col => (
                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8f9fa' }}>
                      {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.slice(0, 200).map((row, idx) => (
                  <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fafbfc' } }}>
                    <TableCell sx={{ color: '#999', fontSize: '0.78rem' }}>{idx + 1}</TableCell>
                    {columns.map(col => (
                      <TableCell key={col} sx={{ fontSize: '0.8rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(row[col] ?? '—').startsWith('http') ? (
                          <Tooltip title={String(row[col])}>
                            <IconButton size="small" onClick={() => window.open(String(row[col]), '_blank')} sx={{ color: COLORS.primary }}>
                              <OpenInNewIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          String(row[col] ?? '—').slice(0, 100)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {filteredResults.length > 200 && (
          <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa', borderTop: '1px solid ' + COLORS.border }}>
            <Typography variant="caption" sx={{ color: '#999' }}>Showing 200 of {filteredResults.length} results. Export CSV for full data.</Typography>
          </Box>
        )}
      </Paper>

      {/* Run Scraper Dialog */}
      <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrowIcon sx={{ color: COLORS.primary }} />
            New Scrape
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            Enter URLs to scrape (one per line). The scraper will extract data from each URL.
          </Typography>
          <TextField
            fullWidth multiline rows={4} placeholder={"Enter URLs here (one per line)\nhttps://example.com/page1\nhttps://example.com/page2"}
            value={urlInput} onChange={e => setUrlInput(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ color: '#999' }} /></InputAdornment> }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth type="number" label="Max results per URL" value={maxItems}
            onChange={e => setMaxItems(parseInt(e.target.value) || 100)}
            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRunDialogOpen(false)} sx={{ textTransform: 'none', color: '#999' }}>Cancel</Button>
          <Button variant="contained" onClick={startScrape} startIcon={<PlayArrowIcon />}
            disabled={!urlInput.trim()}
            sx={{
              background: `linear-gradient(135deg, #1976d2 0%, #0050ac 100%)`,
              color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: 2,
            }}>
            Start Scrape
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
