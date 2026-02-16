import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Skeleton, Tabs, Tab, Chip, IconButton, Avatar, Badge, LinearProgress, Paper, Tooltip, Divider, Button } from '@mui/material';
import { VideoLibrary, BarChart, ArrowUpward, ArrowDownward, Search, CheckCircle, ErrorOutline, Visibility, Refresh, Edit } from '@mui/icons-material';

interface ScriptPerformance {
    scriptId: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
}

interface ViralComponentData {
    id: string;
    title: string;
    performance: ScriptPerformance;
}

export function MembersVideoAnalysisPage() {
    const [videoData, setVideoData] = useState<ViralComponentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/videos')
            .then(res => res.json())
            .then(data => {
                setVideoData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const renderSkeleton = () => (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
    );

    const renderStatCard = (title: string, value: number, icon: React.ReactNode, trend: number) => (
        <Card
            sx={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 3,
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                    {icon}
                    <Typography variant="h6" sx={{ marginLeft: 1, flexGrow: 1 }}>{title}</Typography>
                    {trend >= 0 ? (
                        <ArrowUpward sx={{ color: 'green' }} />
                    ) : (
                        <ArrowDownward sx={{ color: 'red' }} />
                    )}
                </Box>
                <Typography variant="h3">{value}</Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ padding: 3 }}>
            <Paper sx={{ padding: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
                    <VideoLibrary sx={{ marginRight: 1 }} />
                    Video Analysis
                </Typography>
                <Typography variant="body1" sx={{ color: '#e0e0e0', marginTop: 1 }}>
                    Deep dive into the performance of your TikTok scripts and uncover the elements that drive virality, including effective hooks, pacing, and audience engagement strategies.
                </Typography>
            </Paper>

            <Grid container spacing={3} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    {renderStatCard('Scripts Generated', 340, <BarChart />, 12)}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    {renderStatCard('Viral Hooks Found', 45, <CheckCircle />, 5)}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    {renderStatCard('Videos Analyzed', 287, <Visibility />, -3)}
                </Grid>
            </Grid>

            <Paper sx={{ padding: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                    <BarChart sx={{ marginRight: 1 }} />
                    Performance Breakdown
                </Typography>
                <Tabs value={0} aria-label="Video tabs">
                    <Tab label={<Tooltip title="List View"><Search /><Typography sx={{ marginLeft: 1 }} variant="button">All Videos</Typography></Tooltip>} />
                </Tabs>
                <Divider sx={{ marginTop: 2, marginBottom: 3 }} />

                <Grid container spacing={3}>
                    {loading && Array(6).fill('').map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            {renderSkeleton()}
                        </Grid>
                    ))}
                    {!loading && videoData.map(video => (
                        <Grid item xs={12} sm={6} md={4} key={video.id}>
                            <Card
                                sx={{
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    borderRadius: 3,
                                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                                        <Avatar sx={{ marginRight: 1 }}>{video.title.charAt(0)}</Avatar>
                                        {video.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ marginBottom: 2 }}>Views: {video.performance.views}</Typography>
                                    <LinearProgress variant="determinate" value={video.performance.engagementRate} />
                                    <Box sx={{ display: 'flex', marginTop: 2 }}>
                                        <Chip label={`Likes: ${video.performance.likes}`} color="primary" icon={<CheckCircle />} sx={{ marginRight: 1 }} />
                                        <Chip label={`Comments: ${video.performance.comments}`} color="secondary" icon={<ErrorOutline />} />
                                    </Box>
                                    <IconButton sx={{ position: 'absolute', top: 8, right: 8 }}>
                                        <Edit />
                                    </IconButton>
                                    <Tooltip title="Refresh">
                                        <IconButton
                                            onClick={() => console.log('Refreshing...')}
                                            sx={{ position: 'absolute', bottom: 8, right: 8 }}
                                        >
                                            <Refresh />
                                        </IconButton>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {!loading && videoData.length === 0 && (
                    <Box sx={{ textAlign: 'center', padding: 5 }}>
                        <ErrorOutline sx={{ fontSize: 64, color: '#c1b7f9', marginBottom: 2 }} />
                        <Typography variant="body1" sx={{ marginBottom: 2 }}>You haven't analyzed any TikTok videos yet.</Typography>
                        <Button variant="contained" color="primary" startIcon={<Visibility />}>Analyze New Video</Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}