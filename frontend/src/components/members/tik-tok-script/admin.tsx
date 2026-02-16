import { useEffect, useState, useCallback } from'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
 Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
 CircularProgress, Divider, Avatar, Tooltip, IconButton, Skeleton,
 LinearProgress, Alert, Snackbar,
} from'@mui/material';
import Dashboard from'@mui/icons-material/Dashboard';
import People from'@mui/icons-material/People';
import TrendingUp from'@mui/icons-material/TrendingUp';
import AttachMoney from'@mui/icons-material/AttachMoney';
import BugReport from'@mui/icons-material/BugReport';
import Api from'@mui/icons-material/Api';
import Refresh from'@mui/icons-material/Refresh';
import CheckCircle from'@mui/icons-material/CheckCircle';
import Error from'@mui/icons-material/Error';
import Warning from'@mui/icons-material/Warning';
import ArrowUpward from'@mui/icons-material/ArrowUpward';
import Visibility from'@mui/icons-material/Visibility';
import Speed from'@mui/icons-material/Speed';
import Storage from'@mui/icons-material/Storage';

const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';

interface AppStats { app_id: number; name: string; active_subscriptions: number; total_subscriptions: number; total_revenue: number; created_at: string; }
interface Analytics { app_id: number; total_page_views: number; unique_visitors: number; page_stats: Record<string, number>; views_by_date: Record<string, number>; recent_views: any[]; }
interface Visitor { visitor_id: string; first_visit: string; last_visit: string; page_views: number; pages: string[]; }
interface ErrorLog { id: number; source: string; severity: string; message: string; timestamp: string; resolved: boolean; }
interface ApiUsageSummary { totalCalls: number; successRate: number; totalTokens: number; totalCost: number; avgDuration: number; }

export function MembersAdminPage() {
 const [tab, setTab] = useState(0);
 const [loading, setLoading] = useState(true);
 const [stats, setStats] = useState<AppStats | null>(null);
 const [analytics, setAnalytics] = useState<Analytics | null>(null);
 const [visitors, setVisitors] = useState<Visitor[]>([]);
 const [errors, setErrors] = useState<ErrorLog[]>([]);
 const [apiUsage, setApiUsage] = useState<ApiUsageSummary | null>(null);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity:'success' |'error' }>({ open: false, message:'', severity:'success' });

 const fetchAll = useCallback(async () => {
 setLoading(true);
 try {
 const [statsRes, analyticsRes, visitorsRes, errorsRes, apiRes] = await Promise.all([
 fetch(`${API_BASE}/api/apps/6/stats`).then(r => r.json()).catch(() => null),
 fetch(`${API_BASE}/api/analytics/app/6`).then(r => r.json()).catch(() => null),
 fetch(`${API_BASE}/api/analytics/app/6/visitors`).then(r => r.json()).catch(() => []),
 fetch(`${API_BASE}/api/analytics/errors?resolved=false`).then(r => r.json()).catch(() => ({ errors: [], summary: {} })),
 fetch(`${API_BASE}/api/analytics/api-usage`).then(r => r.json()).catch(() => ({ summary: {} })),
 ]);
 if (statsRes) setStats(statsRes);
 if (analyticsRes) setAnalytics(analyticsRes);
 setVisitors(Array.isArray(visitorsRes) ? visitorsRes : []);
 const errData = errorsRes?.errors || errorsRes || [];
 setErrors(Array.isArray(errData) ? errData : []);
 if (apiRes?.summary) setApiUsage(apiRes.summary);
 } catch (e) {
 setSnackbar({ open: true, message:'Failed to load some data', severity:'error' });
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => { fetchAll(); }, [fetchAll]);

 const resolveError = async (id: number) => {
 try {
 await fetch(`${API_BASE}/api/analytics/errors/${id}/resolve`, { method:'POST' });
 setErrors(prev => prev.filter(e => e.id !== id));
 setSnackbar({ open: true, message:'Error resolved', severity:'success' });
 } catch { setSnackbar({ open: true, message:'Failed to resolve error', severity:'error' }); }
 };

 const StatCard = ({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) => (
 <Card sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', position:'relative', overflow:'hidden' }}>
 <Box sx={{ position:'absolute', top: 0, left: 0, width: 4, height:'100%', bgcolor: color }} />
 <CardContent sx={{ pl: 3 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
 <Box>
 <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
 <Typography variant="h4" fontWeight={700}>{value}</Typography>
 {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
 </Box>
 <Avatar sx={{ bgcolor: color +'20', color }}>{icon}</Avatar>
 </Box>
 </CardContent>
 </Card>
 );

 if (loading) {
 return (
 <Box sx={{ p: 2 }}>
 <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
 <Grid container spacing={2}>
 {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
 </Grid>
 <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mt: 3 }} />
 </Box>
 );
 }

 return (
 <Box>
 {/* Header */}
 <Paper sx={{
 p: 3, mb: 3, borderRadius: 3,
 background:'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center',
 }}>
 <Box>
 <Typography variant="h4" fontWeight={700} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Dashboard /> tik tok script Admin
 </Typography>
 <Typography variant="body2" sx={{ opacity: 0.85 }}>Real-time monitoring & management</Typography>
 </Box>
 <Button variant="contained" startIcon={<Refresh />} onClick={fetchAll}
 sx={{ bgcolor:'rgba(255,255,255,0.2)','&:hover': { bgcolor:'rgba(255,255,255,0.3)' } }}>
 Refresh
 </Button>
 </Paper>

 {/* KPI Cards */}
 <Grid container spacing={2} sx={{ mb: 3 }}>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<People />} label="Active Users" value={stats?.active_subscriptions ?? 0} color="#1976d2" sub={`${stats?.total_subscriptions ?? 0} total`} />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<Visibility />} label="Page Views" value={analytics?.total_page_views ?? 0} color="#2196f3" sub={`${analytics?.unique_visitors ?? 0} unique visitors`} />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<AttachMoney />} label="Revenue" value={'$' + (stats?.total_revenue ?? 0).toLocaleString()} color="#4caf50" />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<BugReport />} label="Open Errors" value={errors.length} color={errors.length > 0 ?'#f44336' :'#4caf50'} />
 </Grid>
 </Grid>

 {/* Tabs */}
 <Paper sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom:'1px solid rgba(0,0,0,0.06)', px: 2 }}>
 <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
 <Tab icon={<People />} label={`Visitors (${visitors.length})`} iconPosition="start" />
 <Tab icon={<BugReport />} label={`Errors (${errors.length})`} iconPosition="start" />
 <Tab icon={<Api />} label="API Usage" iconPosition="start" />
 </Tabs>

 <Box sx={{ p: 3 }}>
 {/* Analytics Tab */}
 {tab === 0 && (
 <Box>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Page Performance</Typography>
 {analytics?.page_stats && Object.keys(analytics.page_stats).length > 0 ? (
 <Table size="small">
 <TableHead><TableRow sx={{ bgcolor:'grey.50' }}>
 <TableCell><Typography fontWeight={600}>Page</Typography></TableCell>
 <TableCell align="right"><Typography fontWeight={600}>Views</Typography></TableCell>
 <TableCell align="right"><Typography fontWeight={600}>Share</Typography></TableCell>
 </TableRow></TableHead>
 <TableBody>
 {Object.entries(analytics.page_stats).map(([page, views]) => {
 const total = analytics.total_page_views || 1;
 const pct = Math.round(((views as number) / total) * 100);
 return (
 <TableRow key={page} sx={{'&:nth-of-type(even)': { bgcolor:'grey.50' } }}>
 <TableCell>{page}</TableCell>
 <TableCell align="right"><Typography fontWeight={500}>{(views as number).toLocaleString()}</Typography></TableCell>
 <TableCell align="right">
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap: 1 }}>
 <LinearProgress variant="determinate" value={pct} sx={{ width: 60, height: 6, borderRadius: 3 }} />
 <Typography variant="body2">{pct}%</Typography>
 </Box>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <TrendingUp sx={{ fontSize: 48, color:'text.disabled' }} />
 <Typography color="text.secondary">No analytics data yet</Typography>
 </Box>
 )}
 </Box>
 )}

 {/* Visitors Tab */}
 {tab === 1 && (
 <Box>
 {visitors.length > 0 ? (
 <Table size="small">
 <TableHead><TableRow sx={{ bgcolor:'grey.50' }}>
 <TableCell><Typography fontWeight={600}>Visitor</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>First Visit</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Last Visit</Typography></TableCell>
 <TableCell align="right"><Typography fontWeight={600}>Pages Viewed</Typography></TableCell>
 </TableRow></TableHead>
 <TableBody>
 {visitors.slice(0, 20).map((v, i) => (
 <TableRow key={i} sx={{'&:nth-of-type(even)': { bgcolor:'grey.50' } }}>
 <TableCell>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor:'#1976d2' }}>{(v.visitor_id ||'?')[0].toUpperCase()}</Avatar>
 <Typography variant="body2">{v.visitor_id?.slice(0, 12) ||'Unknown'}...</Typography>
 </Box>
 </TableCell>
 <TableCell><Typography variant="body2">{new Date(v.first_visit).toLocaleDateString()}</Typography></TableCell>
 <TableCell><Typography variant="body2">{new Date(v.last_visit).toLocaleDateString()}</Typography></TableCell>
 <TableCell align="right"><Chip label={v.page_views} size="small" /></TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <People sx={{ fontSize: 48, color:'text.disabled' }} />
 <Typography color="text.secondary">No visitor data yet</Typography>
 </Box>
 )}
 </Box>
 )}

 {/* Errors Tab */}
 {tab === 2 && (
 <Box>
 {errors.length > 0 ? (
 <Table size="small">
 <TableHead><TableRow sx={{ bgcolor:'grey.50' }}>
 <TableCell><Typography fontWeight={600}>Severity</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Source</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Message</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Time</Typography></TableCell>
 <TableCell align="center"><Typography fontWeight={600}>Action</Typography></TableCell>
 </TableRow></TableHead>
 <TableBody>
 {errors.map(err => (
 <TableRow key={err.id} sx={{'&:nth-of-type(even)': { bgcolor:'grey.50' } }}>
 <TableCell>
 <Chip size="small" label={err.severity}
 color={err.severity ==='critical' ?'error' : err.severity ==='error' ?'warning' :'default'}
 icon={err.severity ==='critical' ? <Error /> : <Warning />} />
 </TableCell>
 <TableCell><Typography variant="body2">{err.source}</Typography></TableCell>
 <TableCell><Typography variant="body2" sx={{ maxWidth: 300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{err.message}</Typography></TableCell>
 <TableCell><Typography variant="body2">{new Date(err.timestamp).toLocaleString()}</Typography></TableCell>
 <TableCell align="center">
 <Tooltip title="Mark as resolved">
 <IconButton size="small" color="success" onClick={() => resolveError(err.id)}><CheckCircle /></IconButton>
 </Tooltip>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <CheckCircle sx={{ fontSize: 48, color:'#4caf50' }} />
 <Typography color="text.secondary">No unresolved errors -- all clear!</Typography>
 </Box>
 )}
 </Box>
 )}

 {/* API Usage Tab */}
 {tab === 3 && (
 <Box>
 {apiUsage ? (
 <Grid container spacing={2}>
 {[
 { label:'Total API Calls', value: apiUsage.totalCalls?.toLocaleString() ??'0', icon: <Api />, color:'#1976d2' },
 { label:'Success Rate', value: (apiUsage.successRate ?? 0).toFixed(1) +'%', icon: <CheckCircle />, color:'#4caf50' },
 { label:'Total Tokens', value: (apiUsage.totalTokens ?? 0).toLocaleString(), icon: <Storage />, color:'#ff9800' },
 { label:'Total Cost', value:'$' + (apiUsage.totalCost ?? 0).toFixed(2), icon: <AttachMoney />, color:'#2196f3' },
 { label:'Avg Duration', value: (apiUsage.avgDuration ?? 0).toFixed(0) +'ms', icon: <Speed />, color:'#9c27b0' },
 ].map((item, i) => (
 <Grid item xs={12} sm={6} md={4} key={i}>
 <Card sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <CardContent sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Avatar sx={{ bgcolor: item.color +'20', color: item.color }}>{item.icon}</Avatar>
 <Box>
 <Typography variant="body2" color="text.secondary">{item.label}</Typography>
 <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
 </Box>
 </CardContent>
 </Card>
 </Grid>
 ))}
 </Grid>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <Api sx={{ fontSize: 48, color:'text.disabled' }} />
 <Typography color="text.secondary">No API usage data yet</Typography>
 </Box>
 )}
 </Box>
 )}
 </Box>
 </Paper>

 <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
 <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
 </Snackbar>
 </Box>
 );
}