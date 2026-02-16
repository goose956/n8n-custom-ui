import React, { useState, useEffect } from'react';
import { Box, Typography, Grid, Paper, Card, CardContent, IconButton, Chip, Avatar, Badge, LinearProgress, Skeleton } from'@mui/material';
import { TrendingUp, ArrowUpward, ArrowDownward, BarChart, PieChart, Timeline, Refresh, AnalyticsIcon } from'@mui/icons-material';

interface ScriptPerformance {
 scriptId: string;
 views: number;
 likes: number;
 comments: number;
 shares: number;
 engagementRate: number;
}

interface UserScriptHistory {
 historyId: string;
 scriptId: string;
 createdAt: string;
 performance: ScriptPerformance;
}

export function MembersAnalyticsPage() {
 const [scriptsData, setScriptsData] = useState<UserScriptHistory[]>([]);
 const [loading, setLoading] = useState<boolean>(true);

 useEffect(() => {
 fetch('/api/scripts/analytics')
 .then(res => res.json())
 .then(data => {
 setScriptsData(data);
 setLoading(false);
 })
 .catch(() => setLoading(false));
 }, []);

 const renderStatCard = (title: string, value: number, trend: string, isPositive: boolean) => (
 <Grid item xs={12} sm={6} md={3}>
 <Card sx={{ boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3,'&:hover': { transform:'translateY(-2px)', transition:'0.2s' } }}>
 <CardContent sx={{ background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color:'#fff' }}>
 <Typography variant="h6">{title}</Typography>
 <Box sx={{ display:'flex', alignItems:'center' }}>
 <Typography variant="h4" sx={{ fontWeight:'bold' }}>{value}</Typography>
 {isPositive ? <ArrowUpward sx={{ color:'green', marginLeft: 1 }} /> : <ArrowDownward sx={{ color:'red', marginLeft: 1 }} />}
 </Box>
 <Typography variant="body2">{trend}</Typography>
 </CardContent>
 </Card>
 </Grid>
 );

 const renderScriptPerformance = (script: UserScriptHistory) => (
 <Grid item xs={12}>
 <Paper sx={{ padding: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3 }}>
 <Box sx={{ display:'flex', alignItems:'center', mb: 2 }}>
 <Avatar sx={{ bgcolor:'#1976d2', marginRight: 2 }}>{script.historyId.substring(0, 2)}</Avatar>
 <Typography variant="h6" sx={{ flexGrow: 1 }}>Script ID: {script.scriptId}</Typography>
 <Chip label={`Engagement Rate: ${script.performance.engagementRate}%`} color={script.performance.engagementRate > 50 ? "success" : "error"} />
 </Box>
 <Typography variant="body1">Views: {script.performance.views}</Typography>
 <Typography variant="body1">Likes: {script.performance.likes}</Typography>
 <Typography variant="body1">Comments: {script.performance.comments}</Typography>
 <Typography variant="body1">Shares: {script.performance.shares}</Typography>
 </Paper>
 </Grid>
 );

 return (
 <Box>
 <Box sx={{ background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', padding: 4, borderRadius: 3, color:'#fff', mb: 4 }}>
 <Typography variant="h4" sx={{ display:'flex', alignItems:'center' }}>
 <AnalyticsIcon sx={{ marginRight: 1 }} /> Tik Tok Script Analytics
 </Typography>
 <Typography variant="body1">Gain insights into your script's performance, audience engagement, and more!</Typography>
 </Box>
 <Grid container spacing={2}>
 {loading ? (
 Array.from(new Array(4)).map((_, index) => (
 <Grid item xs={12} sm={6} md={3} key={index}>
 <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
 </Grid>
 ))
 ) : (
 <>
 {renderStatCard('Scripts Generated', 158,'Last week performance', true)}
 {renderStatCard('Viral Hooks Found', 42,'Last month performance', false)}
 {renderStatCard('Videos Analyzed', 90,'Last year performance', true)}
 {renderStatCard('Audience Engagement', 88,'Compared to previous period', true)}
 </>
 )}
 </Grid>
 <Box mt={4}>
 <Typography variant="h6" sx={{ display:'flex', alignItems:'center', mb: 2 }}>
 <BarChart sx={{ marginRight: 1 }} /> Script Performance History
 </Typography>
 <Grid container spacing={3}>
 {loading ? (
 <Grid item xs={12}>
 <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
 </Grid>
 ) : (
 scriptsData.map(script => renderScriptPerformance(script))
 )}
 </Grid>
 </Box>
 </Box>
 );
}