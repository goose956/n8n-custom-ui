import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, CardActionArea, Avatar, Chip, Divider, Skeleton, IconButton, Tooltip } from '@mui/material';
import { School, Insights, TrendingUp, ArrowUpward, ArrowDownward, Refresh, Article, ErrorOutline } from '@mui/icons-material';

interface Resource {
    id: string;
    title: string;
    description: string;
    category: string;
    trending: boolean;
}

export function MembersLearningResourcesPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [resources, setResources] = useState<Resource[]>([]);

    useEffect(() => {
        fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/resources`)
            .then(response => response.json())
            .then(data => {
                setResources(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading resources:', error);
                setLoading(false);
            });
    }, []);

    return (
        <Box>
            <Box sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 3, borderRadius: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <School sx={{ mr: 1 }} /> Learning Resources
                </Typography>
                <Typography variant="h6" sx={{ color: '#e4e4e4' }}>
                    Enhance your LinkedIn automation effectiveness with these expert insights and tools.
                </Typography>
            </Box>

            {loading && (
                <Grid container spacing={3}>
                    {Array.from(new Array(6)).map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {!loading && resources.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <ErrorOutline sx={{ fontSize: 64, color: 'text.secondary' }} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        No resources available
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        You haven't explored any LinkedIn automation resources yet.
                    </Typography>
                    <Tooltip title="Refresh Resources" arrow>
                        <IconButton sx={{ color: '#1976d2' }} onClick={() => setLoading(true)}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            <Grid container spacing={3}>
                {resources.map(resource => (
                    <Grid item xs={12} sm={6} md={4} key={resource.id}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } }}>
                            <CardActionArea>
                                <CardContent>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Article sx={{ mr: 1 }} /> {resource.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resource.description}
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip label={resource.category} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
                                        {resource.trending && (
                                            <Chip icon={<TrendingUp />} label="Trending" color="success" size="small" />
                                        )}
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}