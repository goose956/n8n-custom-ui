import { useState, useEffect, useCallback } from'react';
import { API } from'../config/api';
import { StatCard } from'./shared/StatCard';
import {
 Box, Grid, Typography, Paper, Container, Avatar, Chip, Button,
 LinearProgress, Skeleton,
} from'@mui/material';
import {
 Widgets as AppsIcon,
 AccountTree as WorkflowIcon,
 RssFeed as BlogIcon,
 TravelExplore as ResearchIcon,
 SmartToy as ProgrammerIcon,
 Forum as SocialIcon,
 AttachMoney as CostIcon,
 ArrowForward as ArrowIcon,
} from'@mui/icons-material';
import { Link } from'react-router-dom';

const primaryColor ='#667eea';

interface DashboardData {
 apps: { total: number; recent: any[] };
 plans: { total: number; completed: number; inProgress: number };
 blog: { total: number; published: number; drafts: number };
 research: { total: number };
 social: { totalPosts: number; opportunities: number; keywords: number };
 apiUsage: { totalCalls: number; totalTokens: number; totalCost: number };
 workflows: { total: number; active: number };
}

const QUICK_LINKS = [
 { label:'New Project', path:'/projects', icon: <AppsIcon />, color:'#667eea' },
 { label:'AI Builder', path:'/programmer', icon: <ProgrammerIcon />, color:'#764ba2' },
 { label:'Workflows', path:'/workflows', icon: <WorkflowIcon />, color:'#4caf50' },
 { label:'Blog Engine', path:'/blog', icon: <BlogIcon />, color:'#ff9800' },
 { label:'Research', path:'/research', icon: <ResearchIcon />, color:'#2196f3' },
 { label:'Social', path:'/social', icon: <SocialIcon />, color:'#FF4500' },
];

export function DashboardPage() {
 const [data, setData] = useState<DashboardData | null>(null);
 const [loading, setLoading] = useState(true);

 const fetchDashboard = useCallback(async () => {
 setLoading(true);
 try {
 const [appsR, plansR, blogR, researchR, socialR, apiR, wfR] = await Promise.allSettled([
 fetch(`${API.apps}`).then(r => r.json()),
 fetch(`${API.appPlanner}/stats`).then(r => r.json()),
 fetch(`${API.blog}/stats`).then(r => r.json()),
 fetch(`${API.research}/stats`).then(r => r.json()),
 fetch(`${API.socialMonitor}/stats`).then(r => r.json()),
 fetch(`${API.analytics}/api-usage`).then(r => r.json()),
 fetch(`${API.workflows}`).then(r => r.json()),
 ]);

 const apps = appsR.status ==='fulfilled' ? appsR.value : {};
 const plans = plansR.status ==='fulfilled' ? plansR.value?.data : {};
 const blog = blogR.status ==='fulfilled' ? blogR.value : {};
 const research = researchR.status ==='fulfilled' ? researchR.value : {};
 const social = socialR.status ==='fulfilled' ? socialR.value?.data : {};
 const api = apiR.status ==='fulfilled' ? apiR.value : {};
 const wf = wfR.status ==='fulfilled' ? wfR.value : {};

 setData({
 apps: { total: apps.data?.length || apps.length || 0, recent: (apps.data || apps || []).slice(0, 3) },
 plans: { total: plans?.total || 0, completed: plans?.completed || 0, inProgress: plans?.inProgress || plans?.processing || 0 },
 blog: { total: blog?.total || 0, published: blog?.published || 0, drafts: blog?.drafts || 0 },
 research: { total: research?.total || 0 },
 social: { totalPosts: social?.totalPosts || 0, opportunities: social?.highOpportunities || 0, keywords: social?.activeKeywords || 0 },
 apiUsage: { totalCalls: api?.data?.summary?.totalCalls || 0, totalTokens: api?.data?.summary?.totalTokens || 0, totalCost: api?.data?.summary?.totalCost || 0 },
 workflows: { total: wf?.data?.length || 0, active: (wf?.data || []).filter((w: any) => w.active).length || 0 },
 });
 } catch {
 setData(null);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

 const greeting = (() => {
 const h = new Date().getHours();
 if (h < 12) return'Good morning';
 if (h < 18) return'Good afternoon';
 return'Good evening';
 })();

 return (
 <Container maxWidth="xl" sx={{ py: 4 }}>
 {/* Hero */}
 <Box sx={{ mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 {greeting}, Richard
 </Typography>
 <Typography variant="body1" color="text.secondary">
 Here's what's happening across your SaaS Factory.
 </Typography>
 </Box>

 {/* Stats Grid */}
 <Grid container spacing={2.5} sx={{ mb: 4 }}>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="Apps" value={data?.apps.total || 0} icon={<AppsIcon />} color="#667eea" bgColor="#eef0ff" />}
 </Grid>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="Workflows" value={data?.workflows.total || 0} icon={<WorkflowIcon />} color="#4caf50" bgColor="#e8f5e9" />}
 </Grid>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="Blog Posts" value={data?.blog.total || 0} icon={<BlogIcon />} color="#ff9800" bgColor="#fff3e0" />}
 </Grid>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="Research" value={data?.research.total || 0} icon={<ResearchIcon />} color="#2196f3" bgColor="#e3f2fd" />}
 </Grid>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="Social Posts" value={data?.social.totalPosts || 0} icon={<SocialIcon />} color="#FF4500" bgColor="#fff3e0" />}
 </Grid>
 <Grid item xs={6} sm={4} md={2}>
 {loading ? <Skeleton variant="rounded" height={100} /> :
 <StatCard label="API Cost" value={`$${(data?.apiUsage.totalCost || 0).toFixed(2)}`} icon={<CostIcon />} color="#764ba2" bgColor="#f3e5f5" />}
 </Grid>
 </Grid>

 <Grid container spacing={3}>
 {/* Quick Actions */}
 <Grid item xs={12} md={8}>
 <Paper elevation={0} sx={{ p: 3, border:'1px solid rgba(0,0,0,0.06)' }}>
 <Typography variant="h6" sx={{ fontWeight: 800, fontSize:'1rem', mb: 2.5 }}>
 Quick Actions
 </Typography>
 <Grid container spacing={2}>
 {QUICK_LINKS.map(link => (
 <Grid item xs={6} sm={4} key={link.path}>
 <Button
 component={Link}
 to={link.path}
 fullWidth
 sx={{
 display:'flex', flexDirection:'column', gap: 1, p: 2.5, borderRadius: 3,
 border:'1px solid rgba(0,0,0,0.06)', bgcolor:'white',
 transition:'all 0.2s',
'&:hover': { transform:'translateY(-2px)', boxShadow:'0 6px 20px rgba(0,0,0,0.08)', borderColor:`${link.color}40` },
 }}
 >
 <Avatar sx={{ width: 44, height: 44, bgcolor:`${link.color}15`, color: link.color }}>
 {link.icon}
 </Avatar>
 <Typography variant="body2" sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'0.85rem' }}>
 {link.label}
 </Typography>
 </Button>
 </Grid>
 ))}
 </Grid>
 </Paper>
 </Grid>

 {/* Activity Summary */}
 <Grid item xs={12} md={4}>
 <Paper elevation={0} sx={{ p: 3, border:'1px solid rgba(0,0,0,0.06)', height:'100%' }}>
 <Typography variant="h6" sx={{ fontWeight: 800, fontSize:'1rem', mb: 2.5 }}>
 Activity Summary
 </Typography>
 {loading ? (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2 }}>
 {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={48} />)}
 </Box>
 ) : (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1.5 }}>
 <ActivityRow label="App Plans" done={data?.plans.completed || 0} total={data?.plans.total || 0} color="#667eea" />
 <ActivityRow label="Blog Published" done={data?.blog.published || 0} total={data?.blog.total || 0} color="#ff9800" />
 <ActivityRow label="Active Workflows" done={data?.workflows.active || 0} total={data?.workflows.total || 0} color="#4caf50" />
 <ActivityRow label="Social Opportunities" done={data?.social.opportunities || 0} total={data?.social.totalPosts || 1} color="#FF4500" />

 <Box sx={{ mt: 1, pt: 2, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 0.5 }}>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#999' }}>AI TOKENS USED</Typography>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#764ba2' }}>
 {(data?.apiUsage.totalTokens || 0).toLocaleString()}
 </Typography>
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between' }}>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#999' }}>API CALLS</Typography>
 <Typography variant="caption" sx={{ fontWeight: 700, color:'#667eea' }}>
 {(data?.apiUsage.totalCalls || 0).toLocaleString()}
 </Typography>
 </Box>
 </Box>
 </Box>
 )}
 </Paper>
 </Grid>

 {/* Recent Apps */}
 <Grid item xs={12}>
 <Paper elevation={0} sx={{ p: 3, border:'1px solid rgba(0,0,0,0.06)' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 2 }}>
 <Typography variant="h6" sx={{ fontWeight: 800, fontSize:'1rem' }}>Recent Projects</Typography>
 <Button component={Link} to="/projects" endIcon={<ArrowIcon />} size="small" sx={{ color: primaryColor, fontWeight: 700, fontSize:'0.8rem' }}>
 View All
 </Button>
 </Box>
 {loading ? (
 <Grid container spacing={2}>
 {[1, 2, 3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={80} /></Grid>)}
 </Grid>
 ) : data?.apps.recent && data.apps.recent.length > 0 ? (
 <Grid container spacing={2}>
 {data.apps.recent.map((app: any, i: number) => (
 <Grid item xs={12} sm={4} key={i}>
 <Box sx={{
 p: 2, borderRadius: 2, border:'1px solid rgba(0,0,0,0.06)',
 display:'flex', alignItems:'center', gap: 2,
 transition:'all 0.2s','&:hover': { borderColor:`${primaryColor}40`, bgcolor:`${primaryColor}04` },
 }}>
 <Avatar sx={{
 width: 40, height: 40, borderRadius: 2,
 bgcolor: app.color || primaryColor, color:'white', fontWeight: 700, fontSize:'0.9rem',
 }}>
 {(app.name ||'A')[0].toUpperCase()}
 </Avatar>
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Typography variant="body2" sx={{ fontWeight: 700, fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
 {app.name ||'Untitled'}
 </Typography>
 <Typography variant="caption" color="text.secondary">
 {app.slug || app.id}
 </Typography>
 </Box>
 <Chip label={app.status ||'active'} size="small" sx={{
 fontWeight: 700, fontSize:'0.65rem', height: 20,
 bgcolor:'rgba(76,175,80,0.1)', color:'#4caf50',
 }} />
 </Box>
 </Grid>
 ))}
 </Grid>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <AppsIcon sx={{ fontSize: 48, color:'#ccc', mb: 1 }} />
 <Typography variant="body2" color="text.secondary">No projects yet. Create your first app to get started!</Typography>
 <Button component={Link} to="/projects" variant="contained" size="small" sx={{ mt: 2, background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)` }}>
 Create Project
 </Button>
 </Box>
 )}
 </Paper>
 </Grid>
 </Grid>
 </Container>
 );
}

function ActivityRow({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
 const pct = total > 0 ? Math.min((done / total) * 100, 100) : 0;
 return (
 <Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 0.5 }}>
 <Typography variant="body2" sx={{ fontWeight: 600, fontSize:'0.8rem' }}>{label}</Typography>
 <Typography variant="caption" sx={{ fontWeight: 700, color }}>{done}/{total}</Typography>
 </Box>
 <LinearProgress
 variant="determinate"
 value={pct}
 sx={{
 height: 6, borderRadius: 3, bgcolor:`${color}15`,
'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color },
 }}
 />
 </Box>
 );
}

export default DashboardPage;
