import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Avatar, Chip, IconButton, TextField, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, Create, Add, Insights, CheckCircle, Error, ArrowUpward, ArrowDownward, Refresh, TextFields } from '@mui/icons-material';

interface ScriptCreatorInput {
    topic: string;
    length: number;
    style: 'informative' | 'entertaining' | 'educational';
}

interface GeneratedScript {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    status: 'completed' | 'pending';
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

function MembersScriptCreatorPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [scripts, setScripts] = useState<GeneratedScript[]>([]);
    const [input, setInput] = useState<ScriptCreatorInput>({ topic: '', length: 5, style: 'informative' });

    const fetchScripts = useCallback(async () => {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/scripts`);
        const data: GeneratedScript[] = await response.json();
        setScripts(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchScripts();
    }, [fetchScripts]);

    const handleInputChange = (key: keyof ScriptCreatorInput, value: string | number) => {
        setInput(prev => ({ ...prev, [key]: value }));
    };

    const createScript = async () => {
        const response = await fetch(`${API_BASE}/api/scripts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input)
        });
        await response.json();
        fetchScripts();
    };

    return (
        <Box sx={{ padding: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16, padding: 2 }}>
                <TextFields sx={{ fontSize: 64, color: '#fff', marginRight: 2 }} />
                <Typography variant="h4" sx={{ color: '#fff' }}>AI Script Creator</Typography>
            </Box>
            <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                                <Insights sx={{ color: '#1976d2', marginRight: 1 }} />
                                Scripts Generated
                            </Typography>
                            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', color: '#27ae60' }}>
                                34 <ArrowUpward />
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                                <TrendingUp sx={{ color: '#1976d2', marginRight: 1 }} />
                                Trending Topics
                            </Typography>
                            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', color: '#e74c3c' }}>
                                12 <TrendingDown />
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Box sx={{ marginBottom: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                    <Create sx={{ color: '#1976d2', marginRight: 1 }} />
                    Create a New Script
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Topic"
                        value={input.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        type="number"
                        variant="outlined"
                        label="Length (mins)"
                        value={input.length}
                        onChange={(e) => handleInputChange('length', parseInt(e.target.value))}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        variant="outlined"
                        label="Style"
                        value={input.style}
                        onChange={(e) => handleInputChange('style', e.target.value)}
                        sx={{ marginBottom: 2 }}
                    />
                </Box>
                <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} startIcon={<Add />} onClick={createScript}>
                    Generate Script
                </Button>
            </Box>
            <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                    <Insights sx={{ color: '#1976d2', marginRight: 1 }} />
                    Your Scripts
                </Typography>
                {loading ? (
                    <Skeleton variant="rectangular" width="100%" height={200} />
                ) : scripts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                        <Error sx={{ fontSize: 64, color: '#9b59b6', marginBottom: 2 }} />
                        <Typography variant="subtitle1">
                            You haven't generated any scripts yet.
                        </Typography>
                        <Button variant="outlined" color="primary" sx={{ borderRadius: 10, marginTop: 2 }} startIcon={<Refresh />}>
                            Refresh
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {scripts.map((script) => (
                            <Card key={script.id} sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 16, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6">{script.title}</Typography>
                                        <Chip
                                            label={script.status}
                                            color={script.status === 'completed' ? 'success' : 'primary'}
                                            icon={script.status === 'completed' ? <CheckCircle /> : <Refresh />}
                                        />
                                    </Box>
                                    <Typography variant="body2">{script.content.substring(0, 100)}...</Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export { MembersScriptCreatorPage };