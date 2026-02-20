import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Avatar, Chip, Badge, IconButton, Tooltip, Paper, Divider, Snackbar, LinearProgress, Skeleton } from '@mui/material';
import { Audiotrack, YouTube as YouTubeIcon, Edit, Delete, CloudUpload, ArrowUpward, ArrowDownward, Description, Error } from '@mui/icons-material';

interface Transcription {
    id: string;
    videoTitle: string;
    date: string;
    status: 'COMPLETED' | 'PROCESSING' | 'ERROR';
    text: string;
}

export function MembersTranscriptionServicePage() {
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
    
    useEffect(() => {
        fetch(`${API_BASE}/api/transcriptions`)
            .then((response) => response.json())
            .then((data: Transcription[]) => {
                setTranscriptions(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    const handleRetry = () => {
        setLoading(true);
        setError(false);
        setSnackbarOpen(false);
        // Retry fetching data
        fetch(`${API_BASE}/api/transcriptions`)
            .then((response) => response.json())
            .then((data: Transcription[]) => {
                setTranscriptions(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box sx={{ backgroundColor: '#fafbfc', p: 3 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
                <Typography variant="h6" color="white">
                    <Audiotrack sx={{ mr: 1 }} /> Enhance Your Content with Transcription Services
                </Typography>
                <Typography variant="body1" color="white" gutterBottom>
                    Convert YouTube videos into text with ease. Edit and export transcripts for engaging content and improved accessibility.
                </Typography>
            </Paper>

            {loading ? (
                <Skeleton variant="rectangular" width="100%" height={150} sx={{ mb: 3, borderRadius: 16 }} />
            ) : error ? (
                <Box sx={{ textAlign: 'center', my: 5 }}>
                    <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h6" color="error">Failed to load transcriptions.</Typography>
                    <Button variant="contained" color="primary" onClick={handleRetry} sx={{ mt: 2 }}>Retry</Button>
                </Box>
            ) : transcriptions.length ? (
                <Grid container spacing={3}>
                    {transcriptions.map((transcription) => (
                        <Grid item xs={12} sm={6} md={4} key={transcription.id}>
                            <Card sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                                <CardContent>
                                    <Typography variant="h6">
                                        <YouTubeIcon sx={{ mr: 1 }} /> {transcription.videoTitle}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        {transcription.date}
                                    </Typography>
                                    <Chip
                                        icon={transcription.status === 'COMPLETED' ? <ArrowUpward sx={{ color: 'green' }} /> : transcription.status === 'ERROR' ? <Error sx={{ color: 'red' }} /> : <LinearProgress color="info" />}
                                        label={transcription.status}
                                        color={transcription.status === 'COMPLETED' ? 'success' : transcription.status === 'ERROR' ? 'error' : 'info'}
                                        sx={{ mb: 2 }}
                                    />
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button variant="outlined" startIcon={<Edit />} color="primary">Edit</Button>
                                        <Tooltip title="Delete">
                                            <IconButton>
                                                <Delete color="error" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', my: 5 }}>
                    <Audiotrack color="action" sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h6">You haven't created any transcripts yet.</Typography>
                    <Button variant="contained" color="primary" sx={{ mt: 2 }} startIcon={<CloudUpload />}>
                        Start Transcription
                    </Button>
                </Box>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message="Action performed successfully"
            />
        </Box>
    );
}