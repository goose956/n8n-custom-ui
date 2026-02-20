import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Avatar, Chip, Snackbar, IconButton, Tooltip, Badge, LinearProgress, Skeleton } from '@mui/material';
import { TrendingUp, ArrowUpward, ArrowDownward, Refresh, Edit, Search, Star, Favorite, Visibility, CheckCircle, Warning, Error, Timeline, BarChart, Speed } from '@mui/icons-material';

interface ScriptGenerationResponse {
    script: string;
}

interface StatCardProps {
    title: string;
    value: number;
    trend: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend }) => (
    <Card sx={{ mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: '#fff', borderRadius: 3 }}>
            <BarChart sx={{ fontSize: 48, mr: 2 }} />
            <Box>
                <Typography variant="h6">{title}</Typography>
                <Typography variant="h4">{value}</Typography>
                <Typography variant="subtitle2" color={trend === 'up' ? 'success.main' : 'error.main'}>
                    {trend === 'up' ? <ArrowUpward /> : <ArrowDownward />} {trend === 'up' ? 'Increase' : 'Decrease'}
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

export function MembersScriptGeneratorPage() {
    const [topic, setTopic] = useState<string>('');
    const [style, setStyle] = useState<string>('');
    const [generatedScript, setGeneratedScript] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

    const handleGenerateScript = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, style }),
            });
            const data: ScriptGenerationResponse = await response.json();
            setGeneratedScript(data.script);
            setOpenSnackbar(true);
        } catch (e) {
            setError('Failed to generate script. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [topic, style, API_BASE]);

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Create sx={{ mr: 1 }} />
                    Generate YouTube Scripts
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Use our AI tool to create compelling YouTube video scripts tailored to your topic and style.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Scripts Generated" value={128} trend="up" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Improved Engagement" value={85} trend="up" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Content Ideas" value={64} trend="down" />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Video Topic"
                        fullWidth
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Script Style"
                        fullWidth
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleGenerateScript}
                        disabled={loading}
                        startIcon={<Star />}
                        sx={{ borderRadius: 10 }}
                    >
                        Generate Script
                    </Button>
                </Grid>
            </Grid>

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}

            {loading ? (
                <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={118} />
                    <Skeleton width="80%" />
                    <Skeleton />
                    <Skeleton width="60%" />
                </Box>
            ) : (
                generatedScript && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Visibility sx={{ mr: 1 }} /> Generated Script
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                            {generatedScript}
                        </Typography>
                    </Box>
                )
            )}

            {!loading && !generatedScript && !error && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Favorite sx={{ fontSize: 64, color: 'text.disabled' }} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Start generating your first script!
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateScript}
                        startIcon={<Star />}
                        sx={{ mt: 2, borderRadius: 10 }}
                    >
                        Generate Now
                    </Button>
                </Box>
            )}

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message="Script generated successfully!"
                action={
                    <Button color="secondary" size="small" onClick={handleCloseSnackbar}>
                        Close
                    </Button>
                }
            />
        </Box>
    );
}