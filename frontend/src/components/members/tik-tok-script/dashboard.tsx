import React, { useState, useEffect } from'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, Chip, IconButton, Button, Paper, Skeleton } from'@mui/material';
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward, Refresh, VideoLibrary, BarChart, Search, Add } from'@mui/icons-material';

type DashboardState = {
 scriptsGenerated: number;
 viralHooksFound: number;
 videosAnalyzed: number;
 recentTrends: ViralTrend[];
 loading: boolean;
};

interface ViralTrend {
 trendId: string;
 trendName: string;
 engagementRate: number;
 createdAt: string;
}

export function MembersDashboardPage() {
 const [dashboardData, setDashboardData] = useState<DashboardState>({
 scriptsGenerated: 0,
 viralHooksFound: 0,
 videosAnalyzed: 0,
 recentTrends: [],
 loading: true,
 });

 useEffect(() => {
 async function fetchDashboardData() {
 const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';
 const data = await (await fetch(`${API_BASE}/api/dashboard`)).json();
 setDashboardData({
 scriptsGenerated: data.scriptsGenerated,
 viralHooksFound: data.viralHooksFound,
 videosAnalyzed: data.videosAnalyzed,
 recentTrends: data.recentTrends,
 loading: false,
 });
 }
 fetchDashboardData();
 }, []);

 const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
 <Card sx={{ background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)','&:hover': { transform:'translateY(-2px)', transition:'0.2s' } }}>
 <CardContent sx={{ color:'#fff', display:'flex', alignItems:'center' }}>
 {icon}
 <Box sx={{ ml: 2 }}>
 <Typography variant="h5">{value}</Typography>
 <Typography variant="body2">{label}</Typography>
 </Box>
 </CardContent>
 </Card>
 );

 const TrendCard = (
 trend: ViralTrend,
 isPositive: boolean = trend.engagementRate >= 0
 ) => (
 <Grid item xs={12} sm={6} md={4} key={trend.trendId}>
 <Card sx={{ borderRadius: 3, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
 <CardContent>
 <Box sx={{ display:'flex', alignItems:'center' }}>
 <Typography variant="h6" sx={{ flexGrow: 1 }}>{trend.trendName}</Typography>
 <Chip
 label={`${trend.engagementRate}%`}
 color={isPositive ?'success' :'error'}
 icon={isPositive ? <TrendingUp /> : <TrendingDown />}
 />
 </Box>
 <Typography variant="body2" color="textSecondary">Identified on {new Date(trend.createdAt).toLocaleDateString()}</Typography>
 </CardContent>
 </Card>
 </Grid>
 );

 return (
 <Box sx={{ flexGrow: 1 }}>
 <Box sx={{ padding: 3 }}>
 <Paper sx={{ padding: 3, mb: 3, background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color:'#fff', borderRadius: 3 }}>
 <Typography variant="h4" sx={{ mb: 2, color:'#fff' }}>
 <VideoLibrary sx={{ verticalAlign:'bottom', mr: 1 }} />
 TikTok Script Dashboard
 </Typography>
 <Typography variant="subtitle1">Monitor key metrics and explore viral trends to optimize your TikTok scripts.</Typography>
 </Paper>

 <Grid container spacing={3}>
 {dashboardData.loading ? (
 <React.Fragment>
 <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={140} /></Grid>
 <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={140} /></Grid>
 <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={140} /></Grid>
 </React.Fragment>
 ) : (
 <React.Fragment>
 <Grid item xs={12} sm={6} md={4}>
 <StatCard label="Scripts Generated" value={dashboardData.scriptsGenerated} icon={<BarChart />} />
 </Grid>
 <Grid item xs={12} sm={6} md={4}>
 <StatCard label="Viral Hooks Found" value={dashboardData.viralHooksFound} icon={<Search />} />
 </Grid>
 <Grid item xs={12} sm={6} md={4}>
 <StatCard label="Videos Analyzed" value={dashboardData.videosAnalyzed} icon={<TrendingUp />} />
 </Grid>
 </React.Fragment>
 )}
 </Grid>

 <Typography variant="h6" sx={{ my: 3 }}>
 <Timeline sx={{ verticalAlign:'bottom', mr: 1 }} />
 Recent Viral Trends
 </Typography>
 
 <Grid container spacing={3}>
 {dashboardData.loading ? (
 <Grid item xs={12}><Skeleton variant="rectangular" height={100} /></Grid>
 ) : (
 dashboardData.recentTrends.map(trend => TrendCard(trend))
 )}
 </Grid>
 
 <Box sx={{ mt: 5, textAlign:'center' }}>
 <Button variant="contained" color="primary" startIcon={<Add />}>
 Generate New Script
 </Button>
 </Box>
 </Box>
 </Box>
 );
}