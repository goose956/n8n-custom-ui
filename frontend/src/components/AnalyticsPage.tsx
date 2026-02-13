import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import { StatCard } from './shared/StatCard';
import {
  Box, Grid, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  Tab, Tabs, CircularProgress, Alert, Container, Avatar, Chip,
  IconButton, Button, Tooltip, Snackbar, LinearProgress,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ApiIcon from '@mui/icons-material/Api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import TokenIcon from '@mui/icons-material/Token';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';

/* ─── Types ────────────────────────────────────────────────────────── */

interface AppAnalyticsData {
  app_id: number; app_name: string; app_slug: string;
  total_page_views: number; unique_visitors: number;
}
interface AnalyticsSummary {
  total_apps: number; total_page_views: number;
  total_unique_visitors: number; apps: AppAnalyticsData[];
}
interface AppDetailAnalytics {
  app_id: number; total_page_views: number; unique_visitors: number;
  page_stats: Record<string, number>; views_by_date: Record<string, number>;
  recent_views: any[];
}
interface Visitor {
  visitor_id: string; first_visit: string; last_visit: string;
  page_views: number; pages: string[];
}
interface ErrorLog {
  id: string; source: string; severity: string; message: string;
  stack?: string; endpoint?: string; statusCode?: number;
  timestamp: string; resolved: boolean; metadata?: Record<string, any>;
}
interface ErrorSummary {
  total: number; critical: number; errors: number; warnings: number;
  unresolved: number; bySource: Record<string, number>;
}
interface ApiUsageEntry {
  id: string; provider: string; endpoint: string; model?: string;
  tokensIn?: number; tokensOut?: number; cost?: number;
  duration?: number; statusCode: number; success: boolean;
  timestamp: string; module: string;
}
interface ApiUsageSummary {
  totalCalls: number; successRate: number; totalTokens: number;
  totalCost: number; avgDuration: number;
  byProvider: Record<string, { calls: number; tokens: number; cost: number }>;
  byModule: Record<string, { calls: number; tokens: number; cost: number }>;
  byDay: { date: string; calls: number; tokens: number; cost: number }[];
}
interface N8nExecution {
  id: string; workflowId: string; workflowName?: string;
  status: string; startedAt: string; stoppedAt?: string;
  error?: string; mode?: string;
}
interface N8nSummary {
  total: number; success: number; errors: number;
  running: number; errorRate: number;
}

const COLORS = ['#667eea', '#764ba2', '#4caf50', '#ff9800', '#e91e63', '#00bcd4', '#9c27b0', '#ff5722'];
const SEVERITY_COLORS: Record<string, string> = { critical: '#d32f2f', error: '#f44336', warning: '#ff9800' };
const SOURCE_COLORS: Record<string, string> = { backend: '#667eea', frontend: '#764ba2', n8n: '#ff9800', api: '#4caf50' };
const STATUS_COLORS: Record<string, string> = { success: '#4caf50', error: '#f44336', running: '#2196f3', waiting: '#ff9800' };

/* ─── Main component ──────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [mainTab, setMainTab] = useState(0);

  // App analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppAnalyticsData | null>(null);
  const [appDetail, setAppDetail] = useState<AppDetailAnalytics | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [detailTabIndex, setDetailTabIndex] = useState(0);

  // Error state
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);

  // API usage state
  const [apiEntries, setApiEntries] = useState<ApiUsageEntry[]>([]);
  const [apiSummary, setApiSummary] = useState<ApiUsageSummary | null>(null);

  // n8n state
  const [n8nExecutions, setN8nExecutions] = useState<N8nExecution[]>([]);
  const [n8nSummary, setN8nSummary] = useState<N8nSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  /* ─── Data fetchers ─────────────────────────────────────────────── */

  const fetchAppAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API.analytics}/apps`);
      const result = await res.json();
      if (result.success) setAnalytics(result.data);
    } catch { /* ignore */ }
  }, []);

  const fetchErrors = useCallback(async () => {
    try {
      const res = await fetch(`${API.analytics}/errors?limit=200`);
      const result = await res.json();
      if (result.success) {
        setErrors(result.data.errors);
        setErrorSummary(result.data.summary);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchApiUsage = useCallback(async () => {
    try {
      const res = await fetch(`${API.analytics}/api-usage?days=30`);
      const result = await res.json();
      if (result.success) {
        setApiEntries(result.data.entries);
        setApiSummary(result.data.summary);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchN8n = useCallback(async () => {
    try {
      const res = await fetch(`${API.analytics}/n8n-executions`);
      const result = await res.json();
      if (result.success) {
        setN8nExecutions(result.data.executions);
        setN8nSummary(result.data.summary);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAppAnalytics(), fetchErrors(), fetchApiUsage(), fetchN8n()]);
    setLoading(false);
  }, [fetchAppAnalytics, fetchErrors, fetchApiUsage, fetchN8n]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* ─── Actions ───────────────────────────────────────────────────── */

  const handleAppClick = async (app: AppAnalyticsData) => {
    setSelectedApp(app);
    setDetailTabIndex(0);
    try {
      const [detailRes, visitorRes] = await Promise.all([
        fetch(`${API.analytics}/app/${app.app_id}`),
        fetch(`${API.analytics}/app/${app.app_id}/visitors`),
      ]);
      const detailData = await detailRes.json();
      const visitorData = await visitorRes.json();
      if (detailData.success) setAppDetail(detailData.data);
      if (visitorData.success) setVisitors(visitorData.data);
    } catch { /* ignore */ }
  };

  const resolveError = async (id: string) => {
    try {
      await fetch(`${API.analytics}/errors/${id}/resolve`, { method: 'POST' });
      setSnack({ open: true, msg: 'Error resolved', severity: 'success' });
      fetchErrors();
    } catch { setSnack({ open: true, msg: 'Failed to resolve', severity: 'error' }); }
  };

  const clearErrors = async (source?: string) => {
    try {
      const url = source ? `${API.analytics}/errors?source=${source}` : `${API.analytics}/errors`;
      await fetch(url, { method: 'DELETE' });
      setSnack({ open: true, msg: 'Errors cleared', severity: 'success' });
      fetchErrors();
    } catch { setSnack({ open: true, msg: 'Failed to clear', severity: 'error' }); }
  };

  /* ─── Derived data ──────────────────────────────────────────────── */

  const viewsByDateData = appDetail
    ? Object.entries(appDetail.views_by_date).map(([date, views]) => ({ date: new Date(date).toLocaleDateString(), views }))
    : [];
  const pageStatsData = appDetail
    ? Object.entries(appDetail.page_stats).map(([page, views]) => ({ name: page, value: views }))
    : [];

  const providerChartData = apiSummary
    ? Object.entries(apiSummary.byProvider).map(([name, d]) => ({ name, calls: d.calls, tokens: d.tokens, cost: d.cost }))
    : [];

  const errorSourceData = errorSummary
    ? Object.entries(errorSummary.bySource).map(([name, count]) => ({ name, value: count }))
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChartIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>Analytics</Typography>
            <Typography variant="body2" color="text.secondary">
              Track API usage, costs, and token consumption across all your AI calls. Monitor n8n workflow executions, catch errors early, and see performance trends over time.
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh all data">
          <IconButton onClick={fetchAll} sx={{ color: '#667eea' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main tabs */}
      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{
          mb: 3, borderBottom: '1px solid rgba(0,0,0,0.06)',
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.9rem', minHeight: 42 },
          '& .Mui-selected': { color: '#667eea !important' },
          '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        <Tab icon={<BarChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="App Analytics" />
        <Tab icon={<ErrorOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Errors
            {errorSummary && errorSummary.unresolved > 0 && (
              <Chip label={errorSummary.unresolved} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fce4ec', color: '#d32f2f' }} />
            )}
          </Box>
        } />
        <Tab icon={<ApiIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="API Usage" />
        <Tab icon={<AccountTreeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="n8n Workflows" />
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 0: APP ANALYTICS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === 0 && (
        <>
          {analytics && (
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3}><StatCard label="Total Apps" value={analytics.total_apps} icon={<BarChartIcon />} color="#667eea" bgColor="#eef0ff" /></Grid>
              <Grid item xs={6} sm={3}><StatCard label="Page Views" value={analytics.total_page_views} icon={<VisibilityIcon />} color="#e91e63" bgColor="#fce4ec" /></Grid>
              <Grid item xs={6} sm={3}><StatCard label="Unique Visitors" value={analytics.total_unique_visitors} icon={<GroupIcon />} color="#2196f3" bgColor="#e3f2fd" /></Grid>
              <Grid item xs={6} sm={3}><StatCard label="Avg Views/App" value={analytics.total_apps > 0 ? Math.round(analytics.total_page_views / analytics.total_apps) : 0} icon={<TrendingUpIcon />} color="#ff9800" bgColor="#fff3e0" /></Grid>
            </Grid>
          )}

          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>App Performance</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>App Name</TableCell>
                    <TableCell align="right">Page Views</TableCell>
                    <TableCell align="right">Unique Visitors</TableCell>
                    <TableCell align="right">Avg Views/Visitor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics?.apps.map((app) => (
                    <TableRow key={app.app_id} onClick={() => handleAppClick(app)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fafbfc' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#eef0ff', color: '#667eea', fontSize: '0.85rem', fontWeight: 700 }}>
                            {app.app_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{app.app_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#aaa' }}>{app.app_slug}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>{app.total_page_views.toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700, color: '#764ba2' }}>{app.unique_visitors.toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{app.unique_visitors > 0 ? (app.total_page_views / app.unique_visitors).toFixed(1) : 0}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {(!analytics?.apps || analytics.apps.length === 0) && (
                    <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No app data yet</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ERRORS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === 1 && (
        <>
          {/* Error summary cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard label="Total Errors" value={errorSummary?.total || 0} icon={<ErrorOutlineIcon />} color="#f44336" bgColor="#ffebee" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Critical" value={errorSummary?.critical || 0} icon={<WarningAmberIcon />} color="#d32f2f" bgColor="#fce4ec" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Unresolved" value={errorSummary?.unresolved || 0} icon={<ErrorOutlineIcon />} color="#ff9800" bgColor="#fff3e0" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Warnings" value={errorSummary?.warnings || 0} icon={<WarningAmberIcon />} color="#ff9800" bgColor="#fff8e1" /></Grid>
          </Grid>

          {/* Error source breakdown */}
          {errorSourceData.length > 0 && (
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', height: 260 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.85rem' }}>Errors by Source</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={errorSourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value"
                        label={({ name, value }: any) => `${name}: ${value}`}>
                        {errorSourceData.map((entry, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', height: 260, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.85rem' }}>Source Breakdown</Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'center' }}>
                    {Object.entries(errorSummary?.bySource || {}).map(([source, count]) => (
                      <Box key={source}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{source}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: SOURCE_COLORS[source] || '#667eea' }}>{count}</Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                          value={errorSummary ? (count / errorSummary.total) * 100 : 0}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.04)',
                            '& .MuiLinearProgress-bar': { bgcolor: SOURCE_COLORS[source] || '#667eea', borderRadius: 3 } }} />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Error table */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Error Log</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineIcon />}
                  onClick={() => clearErrors()} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                  Clear All
                </Button>
              </Box>
            </Box>
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 90 }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((err) => (
                    <TableRow key={err.id} sx={{
                      bgcolor: err.severity === 'critical' ? 'rgba(211,47,47,0.03)' : 'transparent',
                      '&:hover': { bgcolor: '#fafbfc' },
                    }}>
                      <TableCell>
                        <Chip label={err.severity} size="small" sx={{
                          height: 22, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: `${SEVERITY_COLORS[err.severity] || '#999'}15`,
                          color: SEVERITY_COLORS[err.severity] || '#999',
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={err.source} size="small" variant="outlined" sx={{
                          height: 22, fontSize: '0.68rem', fontWeight: 600,
                          borderColor: SOURCE_COLORS[err.source] || '#999',
                          color: SOURCE_COLORS[err.source] || '#999',
                        }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {err.message}
                        </Typography>
                        {err.endpoint && <Typography variant="caption" sx={{ color: '#999', fontFamily: 'monospace', fontSize: '0.7rem' }}>{err.endpoint}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem' }}>
                          {new Date(err.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {err.resolved ? (
                          <CheckCircleIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                        ) : (
                          <Tooltip title="Mark as resolved">
                            <IconButton size="small" onClick={() => resolveError(err.id)} sx={{ color: '#ff9800' }}>
                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {errors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 4 }}>
                          <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">No errors logged. Everything looks good!</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: API USAGE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === 2 && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard label="Total Calls" value={apiSummary?.totalCalls || 0} icon={<ApiIcon />} color="#667eea" bgColor="#eef0ff" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Total Tokens" value={apiSummary?.totalTokens || 0} icon={<TokenIcon />} color="#764ba2" bgColor="#f3e5f5" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Total Cost" value={`$${(apiSummary?.totalCost || 0).toFixed(4)}`} icon={<AttachMoneyIcon />} color="#4caf50" bgColor="#e8f5e9" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Avg Latency" value={`${apiSummary?.avgDuration || 0}ms`} icon={<SpeedIcon />} color="#ff9800" bgColor="#fff3e0" /></Grid>
          </Grid>

          {/* Charts row */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* Usage over time */}
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem' }}>API Calls Over Time</Typography>
                {(apiSummary?.byDay || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={apiSummary?.byDay || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="calls" stroke="#667eea" fill="rgba(102,126,234,0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No API usage data yet</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* By provider */}
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem' }}>By Provider</Typography>
                {providerChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={providerChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                      <RechartsTooltip />
                      <Bar dataKey="calls" fill="#667eea" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No provider data</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* By module breakdown */}
          {apiSummary && Object.keys(apiSummary.byModule).length > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem' }}>Usage by Module</Typography>
              <Grid container spacing={2}>
                {Object.entries(apiSummary.byModule).map(([mod, data], i) => (
                  <Grid item xs={6} sm={4} md={3} key={mod}>
                    <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize', color: COLORS[i % COLORS.length], mb: 0.5 }}>{mod}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.calls}</Typography>
                      <Typography variant="caption" color="text.secondary">calls</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{data.tokens.toLocaleString()} tok</Typography>
                        <Typography variant="caption" color="text.secondary">${data.cost.toFixed(4)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Recent API calls table */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Recent API Calls</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tokens</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Cost</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiEntries.map((entry) => (
                    <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                      <TableCell><Chip label={entry.provider} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{entry.module}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#666' }}>{entry.model || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{((entry.tokensIn || 0) + (entry.tokensOut || 0)).toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 600 }}>${(entry.cost || 0).toFixed(4)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{entry.duration ? `${entry.duration}ms` : '—'}</Typography></TableCell>
                      <TableCell>{entry.success ? <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} />}</TableCell>
                      <TableCell><Typography variant="caption" sx={{ color: '#888', fontSize: '0.72rem' }}>{new Date(entry.timestamp).toLocaleString()}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {apiEntries.length === 0 && (
                    <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No API calls recorded yet</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: N8N WORKFLOWS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === 3 && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard label="Total Runs" value={n8nSummary?.total || 0} icon={<AccountTreeIcon />} color="#667eea" bgColor="#eef0ff" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Successful" value={n8nSummary?.success || 0} icon={<CheckCircleIcon />} color="#4caf50" bgColor="#e8f5e9" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Errors" value={n8nSummary?.errors || 0} icon={<ErrorOutlineIcon />} color="#f44336" bgColor="#ffebee" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Error Rate" value={`${(n8nSummary?.errorRate || 0).toFixed(1)}%`} icon={<TrendingUpIcon />} color="#ff9800" bgColor="#fff3e0" /></Grid>
          </Grid>

          {/* Success rate bar */}
          {n8nSummary && n8nSummary.total > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Success Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: n8nSummary.errorRate > 20 ? '#f44336' : '#4caf50' }}>
                  {(100 - n8nSummary.errorRate).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={100 - n8nSummary.errorRate}
                sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(244,67,54,0.1)',
                  '& .MuiLinearProgress-bar': { bgcolor: n8nSummary.errorRate > 20 ? '#ff9800' : '#4caf50', borderRadius: 5 } }} />
            </Paper>
          )}

          {/* Executions table */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Recent Executions</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Workflow</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {n8nExecutions.map((exec) => {
                    const duration = exec.stoppedAt && exec.startedAt
                      ? Math.round((new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000)
                      : null;
                    return (
                      <TableRow key={exec.id} sx={{
                        bgcolor: exec.status === 'error' ? 'rgba(244,67,54,0.03)' : 'transparent',
                        '&:hover': { bgcolor: '#fafbfc' },
                      }}>
                        <TableCell>
                          <Chip label={exec.status} size="small" sx={{
                            height: 22, fontSize: '0.68rem', fontWeight: 700,
                            bgcolor: `${STATUS_COLORS[exec.status] || '#999'}15`,
                            color: STATUS_COLORS[exec.status] || '#999',
                          }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{exec.workflowName || 'Unknown'}</Typography>
                          <Typography variant="caption" sx={{ color: '#999', fontFamily: 'monospace', fontSize: '0.68rem' }}>ID: {exec.workflowId}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{exec.mode || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem' }}>{new Date(exec.startedAt).toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{duration !== null ? `${duration}s` : '—'}</Typography></TableCell>
                        <TableCell>
                          {exec.error ? (
                            <Tooltip title={exec.error}>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#f44336', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {exec.error}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#999' }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {n8nExecutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 4 }}>
                          <AccountTreeIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No n8n executions found. Make sure n8n is running and API key is configured.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* APP DETAIL DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedApp} onClose={() => { setSelectedApp(null); setAppDetail(null); setVisitors([]); }} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedApp?.app_name}</Typography>
            <Chip label={selectedApp?.app_slug} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea', mt: 0.5 }} />
          </Box>
          <IconButton size="small" onClick={() => { setSelectedApp(null); setAppDetail(null); setVisitors([]); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailTabIndex} onChange={(_, v) => setDetailTabIndex(v)}
            sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' }, '& .Mui-selected': { color: '#667eea !important' },
              '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 3, borderRadius: '3px 3px 0 0' } }}>
            <Tab label="Overview" />
            <Tab label="Page Stats" />
            <Tab label="Visitors" />
          </Tabs>

          {/* Overview */}
          {detailTabIndex === 0 && appDetail && (
            <Box>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={6}><StatCard label="Total Page Views" value={appDetail.total_page_views} icon={<VisibilityIcon />} color="#667eea" bgColor="#eef0ff" /></Grid>
                <Grid item xs={6}><StatCard label="Unique Visitors" value={appDetail.unique_visitors} icon={<GroupIcon />} color="#764ba2" bgColor="#f3e5f5" /></Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Page Views Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewsByDateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#667eea" strokeWidth={2.5} dot={{ fill: '#667eea', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Page Stats */}
          {detailTabIndex === 1 && appDetail && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pageStatsData} cx="50%" cy="50%" labelLine={false}
                      label={({ name: pn, value: pv }: any) => `${pn}: ${pv}`}
                      outerRadius={100} dataKey="value">
                      {pageStatsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Page</TableCell><TableCell align="right">Views</TableCell></TableRow></TableHead>
                    <TableBody>
                      {pageStatsData.map((p) => (
                        <TableRow key={p.name}><TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>{p.value}</Typography></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}

          {/* Visitors */}
          {detailTabIndex === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recent Visitors</Typography>
                <Chip label={`${visitors.length} total`} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea' }} />
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Visitor ID</TableCell><TableCell align="right">Views</TableCell>
                      <TableCell>Pages</TableCell><TableCell>Last Visit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitors.slice(0, 20).map((v) => (
                      <TableRow key={v.visitor_id}>
                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>{v.visitor_id.slice(0, 12)}...</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{v.page_views}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#888' }}>{v.pages.join(', ')}</Typography></TableCell>
                        <TableCell><Typography variant="caption" sx={{ color: '#aaa' }}>{new Date(v.last_visit).toLocaleString()}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
