import React, { useState, useEffect, useCallback, useMemo } from'react';
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, Chip, Avatar, Badge, Tooltip, TextField, Paper, Divider, Skeleton } from'@mui/material';
import { Create, TrendingUp, ArrowUpward, ArrowDownward, Edit, Delete, Add, Search, CheckCircle, Warning, Error, HourglassEmpty } from'@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';

interface ScriptTemplate {
 id: string;
 title: string;
 createdAt: string;
 likes: number;
 views: number;
 comments: number;
 trend: number;
 niche: string;
}

export function MembersScriptGeneratorPage() {
 const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
 const [loading, setLoading] = useState(true);
 
 const fetchTemplates = useCallback(async () => {
 try {
 const response = await fetch(`${API_BASE}/api/scripts`);
 const data = await response.json();
 setTemplates(data);
 } catch (error) {
 console.error("Failed to fetch script templates", error);
 } finally {
 setLoading(false);
 }
 }, []);
 
 useEffect(() => {
 fetchTemplates();
 }, [fetchTemplates]);

 const renderTemplates = useMemo(() =>
 templates.length ? templates.map(template => (
 <Grid item xs={12} sm={6} md={4} key={template.id}>
 <Card sx={{ boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3,'&:hover': { transform:'translateY(-2px)', transition:'0.2s' } }}>
 <CardContent>
 <Typography variant="h6" sx={{ display:'flex', alignItems:'center', mb: 1 }}>
 <Create sx={{ mr: 1, color:'#1976d2' }} /> {template.title}
 </Typography>
 <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
 Created: {new Date(template.createdAt).toLocaleDateString()}
 </Typography>
 <Chip icon={<TrendingUp />} label={`${template.trend}% Viral Trend`} color="primary" variant="outlined" sx={{ mb: 2 }} />
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="body1"><TrendingUp sx={{ color:'#00bcd4', mr: 0.5 }} /> {template.views.toLocaleString()} Views</Typography>
 <IconButton><Edit sx={{ color:'#1976d2' }} /></IconButton>
 <IconButton><Delete color="error" /></IconButton>
 </Box>
 </CardContent>
 </Card>
 </Grid>
 )) : (
 <Box sx={{ textAlign:'center', mt: 3 }}>
 <HourglassEmpty sx={{ fontSize: 64, color:'text.disabled' }} />
 <Typography variant="h6" sx={{ mt: 2 }}>You haven't created any TikTok script-related content yet.</Typography>
 <Button startIcon={<Add />} variant="contained" sx={{ mt: 2, background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
 Create Your First Script
 </Button>
 </Box>
 ), [templates]);
 
 return (
 <Box>
 <Paper sx={{ padding: 3, mb: 4, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
 <Typography variant="h6" sx={{ color:'#fff', display:'flex', alignItems:'center', mb: 3 }}>
 <Create sx={{ mr: 1 }} /> Script Generator
 </Typography>
 <Typography variant="body1" sx={{ color:'#fff', mb: 2 }}>
 Generate fantastic scripts for TikTok by leveraging AI-backed insights from viral trends and niches. Customize your content with ease.
 </Typography>
 <TextField
 fullWidth
 variant="outlined"
 placeholder="Search your templates..."
 InputProps={{
 startAdornment: <Search sx={{ color:'#fff' }} />,
 sx: { color:'#fff', borderRadius: 3, backgroundColor:'rgba(255, 255, 255, 0.1)' }
 }}
 />
 </Paper>

 <Grid container spacing={3}>
 {loading ? (
 <>
 <Skeleton variant="rectangular" height={200} sx={{ width:'100%' }} />
 <Skeleton variant="rectangular" height={200} sx={{ width:'100%', mt: 3 }} />
 <Skeleton variant="rectangular" height={200} sx={{ width:'100%', mt: 3 }} />
 </>
 ) : renderTemplates}
 </Grid>
 </Box>
 );
}