import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, Chip, Avatar, Stack, Divider, Skeleton, Alert, Snackbar } from '@mui/material';
import { TrendingUp, ArrowUpward, ArrowDownward, Edit, Delete, Refresh, Description } from '@mui/icons-material';

interface Transcription {
    videoTitle: string;
    content: string;
    createdAt: Date;
}

export function MembersTranscriptionsPage() {
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchTranscriptions = async () => {
            try {
                const response = await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/transcriptions`);
                if (!response.ok) throw new Error('Failed to fetch transcriptions');
                const data = await response.json();
                setTranscriptions(data);
            } catch (err) {
                setError('Failed to load transcriptions. Please try again later.');
                setSnackbar({ open: true, message: 'Failed to load transcriptions.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchTranscriptions();
    }, []);

    return (
        <Box sx={{ px: 4, py: 6 }}>
            <Box sx={{ mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', py: 4, color: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Description sx={{ mr: 1 }} /> Manage Your YouTube Video Transcriptions
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Enhance SEO and accessibility by generating text from YouTube videos.</Typography>
            </Box>

            {error && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="error">Error: {error}</Typography>
                </Box>
            )}

            {loading ? (
                <Grid container spacing={3}>
                    {Array.from(new Array(3)).map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 16 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={3}>
                    {transcriptions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                            <Avatar sx={{ width: 64, height: 64, mx: 'auto', bgcolor: 'rgba(0,0,0,0.05)' }}>
                                <Description />
                            </Avatar>
                            <Typography variant="h6" sx={{ mt: 2 }}>You haven't created any transcriptions yet.</Typography>
                            <Button variant="contained" sx={{ mt: 2, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#155a9d' } }}>
                                Start Transcribing
                            </Button>
                        </Box>
                    ) : (
                        transcriptions.map(({ videoTitle, content, createdAt }) => (
                            <Grid item xs={12} sm={6} md={4} key={videoTitle}>
                                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Description sx={{ color: '#1976d2', mr: 1 }} />
                                            <Typography variant="h6">{videoTitle}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {content}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Chip label={new Date(createdAt).toLocaleDateString()} />
                                            <Stack direction="row" spacing={1}>
                                                <IconButton color="primary" size="small">
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton color="error" size="small">
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
               <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}