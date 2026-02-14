import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { API } from '../config/api';
import { User, Script } from '../../types/members';
import { BarChart, People, LibraryBooks } from '@mui/icons-material';
import { ContactForm } from './ContactForm'; // Import the new ContactForm component

interface Stats {
    totalScripts: number;
    activeUsers: number;
    totalViews: number;
}

export function MembersDashboardPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API}/stats`);
                if (!res.ok) {
                    throw new Error('Failed to fetch statistics');
                }
                const data: Stats = await res.json();
                setStats(data);
            } catch (error) {
                setError(error.message);
                enqueueSnackbar('Error loading statistics', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [enqueueSnackbar]);

    const mockStats: Stats = {
        totalScripts: 120,
        activeUsers: 75,
        totalViews: 10450,
    };

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" sx={{ marginBottom: 3, color: '#667eea' }}>
                Dashboard Overview
            </Typography>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Typography variant="body1" color="error">
                    {error}
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ borderRadius: 12, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <BarChart sx={{ fontSize: 50, color: '#667eea' }} />
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    {stats ? stats.totalScripts : mockStats.totalScripts} Scripts
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ borderRadius: 12, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <People sx={{ fontSize: 50, color: '#667eea' }} />
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    {stats ? stats.activeUsers : mockStats.activeUsers} Active Users
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ borderRadius: 12, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <LibraryBooks sx={{ fontSize: 50, color: '#667eea' }} />
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    {stats ? stats.totalViews : mockStats.totalViews} Total Views
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    Create New Script
                </Button>
            </Box>
            {/* Add ContactForm component to the Members Dashboard page */}
            <Box sx={{ mt: 4 }}>
                <ContactForm />
            </Box>
        </Box>
    );
}