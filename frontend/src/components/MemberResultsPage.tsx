import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, Chip, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Tooltip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { API } from '../config/api';
import { SkillOutputRenderer } from './SkillOutputRenderer';

// ── Types ─────────────────────────────────────────────────────────────

interface ToolCallEntry {
  toolName: string;
  input: any;
  output: any;
  duration: number;
}

interface RunRecord {
  id: string;
  skillId: string;
  skillName?: string;
  status: 'success' | 'error';
  output: string;
  logs: string[];
  toolCalls: ToolCallEntry[];
  duration: number;
  error?: string;
  timestamp: string;
  inputs?: Record<string, string>;
}

// ── Component ─────────────────────────────────────────────────────────

export function MemberResultsPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [limit, setLimit] = useState(50);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API.skills}/runs/all?limit=${limit}`);
      const data = await resp.json();
      setRuns(data.runs || []);
    } catch (err: any) {
      setError('Failed to load results: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const filteredRuns = useMemo(() => {
    let out = runs;
    if (filter !== 'all') out = out.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        (r.skillName || r.skillId || '').toLowerCase().includes(q) ||
        (r.output || '').toLowerCase().includes(q) ||
        (r.error || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [runs, filter, search]);

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

  const formatDate = (ts: string) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>Results</Typography>

        <TextField
          size="small" placeholder="Search results..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ width: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filter} label="Status" onChange={e => setFilter(e.target.value as any)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Show</InputLabel>
          <Select value={limit} label="Show" onChange={e => { setLimit(Number(e.target.value)); }}>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={200}>200</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={loadRuns} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mb: 1 }}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', mx: 2, mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : filteredRuns.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell sx={{ fontWeight: 700 }}>Skill</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Tools</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 150 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRuns.map(run => (
                <>
                  <TableRow key={run.id} hover sx={{ cursor: 'pointer', '& td': { borderBottom: expandedRow === run.id ? 'none' : undefined } }}
                    onClick={() => toggleRow(run.id)}>
                    <TableCell>
                      <IconButton size="small">
                        {expandedRow === run.id ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{run.skillName || run.skillId || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={run.status === 'success' ? <SuccessIcon sx={{ fontSize: 14 }} /> : <ErrorIcon sx={{ fontSize: 14 }} />}
                        label={run.status}
                        size="small"
                        color={run.status === 'success' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{(run.duration / 1000).toFixed(1)}s</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{run.toolCalls?.length || 0}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{formatDate(run.timestamp)}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${run.id}-expand`}>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <Collapse in={expandedRow === run.id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: '#1e1e1e', borderRadius: 1, m: 1 }}>
                          {/* Inputs */}
                          {run.inputs && Object.keys(run.inputs).length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9cdcfe', mb: 0.5 }}>Inputs</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {Object.entries(run.inputs).map(([k, v]) => (
                                  <Chip key={k} label={`${k}: ${v}`} size="small" sx={{ fontSize: 11, bgcolor: '#252526', color: '#d4d4d4' }} />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {/* Error */}
                          {run.error && (
                            <Box sx={{ p: 1, mb: 2, bgcolor: '#3b1111', borderRadius: 1, color: '#f48771', fontSize: 12 }}>
                              {run.error}
                            </Box>
                          )}
                          {/* Output */}
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9cdcfe', mb: 0.5 }}>Output</Typography>
                            <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: '#252526', p: 1.5, borderRadius: 1 }}>
                              <SkillOutputRenderer content={run.output || '(no output)'} />
                            </Box>
                          </Box>
                          {/* Tool Calls */}
                          {run.toolCalls?.length > 0 && (
                            <Box>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9cdcfe', mb: 0.5 }}>
                                Tool Calls ({run.toolCalls.length})
                              </Typography>
                              {run.toolCalls.map((tc, i) => (
                                <Box key={i} sx={{ p: 1, mb: 1, bgcolor: '#252526', borderRadius: 1, border: '1px solid #333' }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#dcdcaa' }}>
                                    🔧 {tc.toolName}
                                    <Typography component="span" sx={{ color: '#808080', fontSize: 11, ml: 1 }}>{tc.duration}ms</Typography>
                                  </Typography>
                                  <Box component="pre" sx={{ fontSize: 10, m: 0, mt: 0.5, color: '#ce9178', overflowX: 'auto', maxHeight: 100, overflow: 'auto' }}>
                                    {JSON.stringify(tc.input, null, 2)}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {/* Logs */}
                          {run.logs?.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9cdcfe', mb: 0.5 }}>Logs</Typography>
                              <Box component="pre" sx={{ fontSize: 10, m: 0, color: '#b5cea8', bgcolor: '#252526', p: 1.5, borderRadius: 1, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {run.logs.join('\n')}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="caption" color="text.disabled">
          Showing {filteredRuns.length} of {runs.length} results
        </Typography>
      </Box>
    </Box>
  );
}
