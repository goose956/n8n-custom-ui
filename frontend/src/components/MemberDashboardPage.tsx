import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Chip, Avatar,
  LinearProgress, Tooltip,
} from '@mui/material';
import {
  SmartToy as SkillsIcon,
  History as ResultsIcon,
  Folder as FilesIcon,
  VpnKey as KeysIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Build as ToolIcon,
  Schedule as RecentIcon,
} from '@mui/icons-material';
import { API } from '../config/api';

// ── Types ─────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface RecentRun {
  id: string;
  skillId: string;
  skillName?: string;
  status: 'success' | 'error';
  duration: number;
  timestamp: string;
  toolCalls?: any[];
}

// ── Component ─────────────────────────────────────────────────────────

export function MemberDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skillCount, setSkillCount] = useState(0);
  const [toolCount, setToolCount] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [keyCount, setKeyCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [skillsRes, toolsRes, runsRes, filesRes, keysRes] = await Promise.all([
        fetch(API.skills).then(r => r.json()).catch(() => ({ skills: [] })),
        fetch(`${API.skills}/tools`).then(r => r.json()).catch(() => ({ tools: [] })),
        fetch(`${API.skills}/runs/all?limit=10`).then(r => r.json()).catch(() => ({ runs: [] })),
        fetch(`${API.skills}/files`).then(r => r.json()).catch(() => ({ total: 0 })),
        fetch(API.apiKeys).then(r => r.json()).catch(() => ({ keys: [] })),
      ]);
      setSkillCount((skillsRes.skills || []).length);
      setToolCount((toolsRes.tools || []).length);
      setRecentRuns(runsRes.runs || []);
      setFileCount(filesRes.total || 0);
      setKeyCount((keysRes.keys || []).length);
    } catch (err: any) {
      setError('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const successRate = recentRuns.length > 0
    ? Math.round((recentRuns.filter(r => r.status === 'success').length / recentRuns.length) * 100)
    : 0;
  const avgDuration = recentRuns.length > 0
    ? (recentRuns.reduce((s, r) => s + (r.duration || 0), 0) / recentRuns.length / 1000).toFixed(1)
    : '0';

  const stats: StatCard[] = [
    { label: 'AI Skills', value: skillCount, icon: <SkillsIcon />, color: '#667eea', subtitle: `${toolCount} tools available` },
    { label: 'Recent Runs', value: recentRuns.length, icon: <ResultsIcon />, color: '#764ba2', subtitle: `${successRate}% success rate` },
    { label: 'Avg Duration', value: `${avgDuration}s`, icon: <SpeedIcon />, color: '#2196f3', subtitle: 'per skill execution' },
    { label: 'Files', value: fileCount, icon: <FilesIcon />, color: '#4caf50', subtitle: 'generated outputs' },
    { label: 'API Keys', value: keyCount, icon: <KeysIcon />, color: '#ff9800', subtitle: 'configured services' },
  ];

  const formatDate = (ts: string) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Your AI workspace overview — skills, runs, and files at a glance.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map(stat => (
          <Grid item xs={12} sm={6} md key={stat.label}>
            <Paper sx={{
              p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
              border: '1px solid', borderColor: 'divider',
              transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}>
              <Avatar sx={{ bgcolor: stat.color + '18', color: stat.color, width: 48, height: 48 }}>
                {stat.icon}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>{stat.label}</Typography>
                {stat.subtitle && (
                  <Typography variant="caption" color="text.disabled">{stat.subtitle}</Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent activity */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
          <RecentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>Recent Activity</Typography>
          <Chip label={`${recentRuns.length} runs`} size="small" />
        </Box>

        {recentRuns.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <SkillsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No skill runs yet</Typography>
            <Typography variant="caption" color="text.disabled">Run a skill from the Skills page to see activity here.</Typography>
          </Box>
        ) : (
          <Box>
            {recentRuns.slice(0, 8).map((run, i) => (
              <Box key={run.id || i} sx={{
                display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5,
                borderBottom: i < Math.min(recentRuns.length - 1, 7) ? '1px solid' : 'none',
                borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' },
              }}>
                {run.status === 'success'
                  ? <SuccessIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  : <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
                }
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.skillName || run.skillId || 'Unknown Skill'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.disabled">{(run.duration / 1000).toFixed(1)}s</Typography>
                    {run.toolCalls && run.toolCalls.length > 0 && (
                      <Tooltip title={`${run.toolCalls.length} tool calls`}>
                        <Chip icon={<ToolIcon sx={{ fontSize: 12 }} />} label={run.toolCalls.length} size="small"
                          sx={{ height: 18, fontSize: 10, '& .MuiChip-icon': { fontSize: 12 } }} />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.disabled">{formatDate(run.timestamp)}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Success rate bar */}
        {recentRuns.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Success Rate</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: successRate >= 80 ? 'success.main' : successRate >= 50 ? 'warning.main' : 'error.main' }}>
                {successRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate" value={successRate}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: successRate >= 80 ? 'success.main' : successRate >= 50 ? 'warning.main' : 'error.main',
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
