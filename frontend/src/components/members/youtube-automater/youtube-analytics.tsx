import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Skeleton, Chip, Avatar, IconButton, Tooltip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Badge } from '@mui/material';
import { TrendingUp, TrendingDown, Visibility, LocationOn, BarChart, Refresh, ArrowUpward, ArrowDownward, VideoLibrary } from '@mui/icons-material';

export interface YouTubeAnalyticsData {
    viewCounts: number;
    watchTime: number;
    geographicDistribution: Record<string, number>;
    topVideos: Array<{
        videoId: string;
        title: string;
        performanceMetrics: { views: number; likes: number; };
    }>;
}

export function MembersYoutubeAnalyticsPage() {
    const [analyticsData, setAnalyticsData] = useState<YouTubeAnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

    useEffect(() => {
        fetch(`${API_BASE}/api/youtube/analytics`)
            .then(res => res.json())
            .then(data => setAnalyticsData(data))
            .finally(() => setLoading(false));
    }, [API_BASE]);

    if (loading) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}><Skeleton variant="rectangular" height={50} /></Grid>
                <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={150} /></Grid>
                <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={150} /></Grid>
                <Grid item xs={12} sm={6} md={4}><Skeleton variant="rectangular" height={150} /></Grid>
                <Grid item xs={12}><Skeleton variant="rectangular" height={300} /></Grid>
            </Grid>
        );
    }

    if (!analyticsData) {
        return (
            <Box sx={{ textAlign: 'center', marginTop: 10 }}>
                <Visibility sx={{ fontSize: 64, color: 'grey.400' }} />
                <Typography variant="h6" sx={{ marginY: 2 }}>
                    You haven't generated any analytics with YouTube Automater yet.
                </Typography>
                <IconButton
                    size="large"
                    sx={{
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#155a9f' }
                    }}
                >
                    <Refresh />
                </IconButton>
            </Box>
        );
    }

    const { viewCounts, watchTime, geographicDistribution, topVideos } = analyticsData;

    return (
        <Box>
            <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', padding: 3, borderRadius: 3, marginBottom: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <BarChart sx={{ marginRight: 1 }} /> YouTube Analytics Overview
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Visibility sx={{ marginRight: 1 }} /> Total Views
                            </Typography>
                            <Typography variant="h4">
                                {viewCounts.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUp sx={{ marginRight: 1 }} /> Watch Time (Hours)
                            </Typography>
                            <Typography variant="h4">
                                {watchTime.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ marginRight: 1 }} /> Audience Regions
                            </Typography>
                            {Object.entries(geographicDistribution).map(([region, count]) => (
                                <Chip key={region} label={`${region}: ${count}`} sx={{ marginBottom: 0.5 }} />
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ padding: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                            <VideoLibrary sx={{ marginRight: 1 }} /> Top Performing Videos
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Video Title</TableCell>
                                        <TableCell align="right">Views</TableCell>
                                        <TableCell align="right">Likes</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topVideos.map(video => (
                                        <TableRow key={video.videoId} hover>
                                            <TableCell>{video.title}</TableCell>
                                            <TableCell align="right">
                                                <Badge badgeContent={video.performanceMetrics.views} color="primary">
                                                    <Visibility />
                                                </Badge>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={video.performanceMetrics.likes}
                                                    sx={{
                                                        backgroundColor: '#1976d2',
                                                        color: '#fff'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Refresh Data">
                                                    <IconButton size="small" sx={{ color: '#1976d2' }}>
                                                        <Refresh />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}