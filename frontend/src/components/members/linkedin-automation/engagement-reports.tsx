import React, { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, IconButton, Chip, Avatar, Badge, LinearProgress, Skeleton, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, Person, Visibility, Email, Timeline, PieChart, Refresh } from '@mui/icons-material';

interface EngagementReport {
    profileViews: number;
    messageOpenRate: number;
    responseTimeline: ResponseTimeline[];
}

interface ResponseTimeline {
    date: string;
    responseTime: number;
}

export function MembersEngagementReportsPage() {
    const [engagementData, setEngagementData] = useState<EngagementReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
        try {
            const response = await fetch(`${API_BASE}/api/engagement-reports`);
            const data = await response.json();
            setEngagementData(data);
        } catch (error) {
            console.error('Failed to fetch engagement reports', error);
        } finally {
            setLoading(false);
        }
    };

    const profileViewsBadge = useMemo(() => (
        <Badge badgeContent={engagementData?.profileViews || 0} color="primary" sx={{ mb: 2 }}>
            <Person fontSize="large" color="action" />
        </Badge>
    ), [engagementData]);

    return (
        <Box sx={{ padding: 3 }}>
            <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', padding: 4, borderRadius: 16, mb: 4 }}>
                <Typography variant="h4" color="white" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PieChart sx={{ mr: 1 }} /> LinkedIn Engagement Reports
                </Typography>
                <Typography variant="subtitle1" color="white">
                    Analyze your LinkedIn automation outreach performance and engagement metrics.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            {loading ? <Skeleton variant="circular" width={40} height={40} /> : profileViewsBadge}
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h5" sx={{ color: '#1976d2' }}>
                                    {loading ? <Skeleton width="40%" /> : engagementData?.profileViews}
                                </Typography>
                                <Typography color="textSecondary">Profile Views</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email fontSize="large" color="action" />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h5" sx={{ color: loading ? 'inherit' : engagementData?.messageOpenRate! > 50 ? 'green' : 'red' }}>
                                    {loading ? <Skeleton width="40%" /> : `${engagementData?.messageOpenRate}%`}
                                </Typography>
                                <Typography color="textSecondary">Message Open Rate</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Timeline fontSize="large" color="action" />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h5" sx={{ color: '#1976d2' }}>
                                    {loading ? <Skeleton width="50%" /> : engagementData?.responseTimeline.length}
                                </Typography>
                                <Typography color="textSecondary">Response Timelines</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Timeline sx={{ mr: 1 }} /> Detailed Interaction Timeline
                </Typography>

                {loading ? (
                    <Skeleton variant="rectangular" width="100%" height={150} />
                ) : engagementData && engagementData.responseTimeline.length > 0 ? (
                    <Grid container spacing={2}>
                        {engagementData.responseTimeline.map((item, index) => (
                            <Grid item xs={12} key={index}>
                                <Card sx={{ display: 'flex', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                                    <CardContent sx={{ flex: 1 }}>
                                        <Typography variant="body1" color="primary">
                                            Date: {item.date}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Response Time: {item.responseTime} minutes
                                        </Typography>
                                    </CardContent>
                                    <Tooltip title="Refresh">
                                        <IconButton onClick={fetchData}>
                                            <Refresh color="primary" />
                                        </IconButton>
                                    </Tooltip>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Visibility sx={{ fontSize: 64, color: 'gray' }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                            No interaction data available. Start engaging on LinkedIn!
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <IconButton color="primary" onClick={fetchData}>
                                <Refresh />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}