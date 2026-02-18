import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Button, 
    TextField, 
    Chip, 
    Skeleton, 
    Alert,
    Snackbar,
    LinearProgress,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { 
    Campaign,
    Search,
    LinkedIn,
    Person,
    CheckCircle,
    Error,
    Refresh,
    Download,
    PlayArrow,
    Stop,
    Settings
} from '@mui/icons-material';

interface LinkedInProfile {
    id: string;
    name: string;
    headline: string;
    location: string;
    profileUrl: string;
    connectionsCount?: number;
    company?: string;
}

interface ScrapingJob {
    id: string;
    status: 'running' | 'completed' | 'failed';
    profilesCount: number;
    createdAt: string;
    profiles: LinkedInProfile[];
}

export function MembersAutomatedMessagesPage() {
    const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
    const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

    const startScraping = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSnackbarMessage('Please enter search terms');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        setIsRunning(true);
        setIsLoading(true);
        const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
        
        try {
            const response = await fetch(`${API_BASE}/api/linkedin-scraper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchQuery })
            });
            
            if (!response.ok) {
                throw new Error('Failed to start scraping');
            }
            
            const data = await response.json();
            setSnackbarMessage('Scraping started successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            
            // Poll for results
            pollForResults(data.jobId);
        } catch (error) {
            setSnackbarMessage(error instanceof Error ? error.message : 'Failed to start scraping');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setIsRunning(false);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const pollForResults = useCallback(async (jobId: string) => {
        const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/api/linkedin-scraper/${jobId}`);
                const data = await response.json();
                
                if (data.status === 'completed') {
                    setProfiles(data.profiles);
                    setIsRunning(false);
                    setSnackbarMessage(`Scraping completed! Found ${data.profiles.length} profiles`);
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    clearInterval(pollInterval);
                } else if (data.status === 'failed') {
                    setIsRunning(false);
                    setSnackbarMessage('Scraping failed');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000);
        
        return () => clearInterval(pollInterval);
    }, []);

    const stopScraping = useCallback(async () => {
        setIsRunning(false);
        setSnackbarMessage('Scraping stopped');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
    }, []);
    const renderScrapingControls = () => (
        <Paper sx={{ p: 3, mb: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Search sx={{ color: '#667eea', mr: 1 }} />
                <Typography variant="h6">LinkedIn Profile Search</Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                    <TextField
                        fullWidth
                        label="Search Terms (e.g., 'Software Engineer San Francisco')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isRunning}
                        placeholder="Enter job title, location, company, etc."
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isRunning ? (
                            <Button
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={startScraping}
                                disabled={isLoading}
                                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                                Start Scraping
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                startIcon={<Stop />}
                                onClick={stopScraping}
                                color="error"
                            >
                                Stop
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>
            {isRunning && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                        Scraping LinkedIn profiles... This may take a few minutes.
                    </Typography>
                </Box>
            )}
        </Paper>
    );

    const renderProfileResults = () => (
        <Paper sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ color: '#667eea', mr: 1 }} />
                    <Typography variant="h6">Scraped Profiles ({profiles.length})</Typography>
                </Box>
                {profiles.length > 0 && (
                    <Button
                        startIcon={<Download />}
                        variant="outlined"
                        size="small"
                    >
                        Export CSV
                    </Button>
                )}
            </Box>
            
            {profiles.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinkedIn sx={{ fontSize: '64px', color: 'rgba(0,0,0,0.2)' }} />
                    <Typography variant="h6" sx={{ mt: 2, color: 'rgba(0,0,0,0.4)' }}>
                        No profiles scraped yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                        Start a scraping job to see LinkedIn profiles here
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {profiles.map((profile, index) => (
                        <Grid item xs={12} sm={6} md={4} key={profile.id || index}>
                            <Card sx={{ 
                                height: '100%',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LinkedIn sx={{ color: '#0077b5', mr: 1 }} />
                                        <Typography variant="h6" noWrap sx={{ fontSize: '1rem' }}>
                                            {profile.name || 'Unknown Name'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }} noWrap>
                                        {profile.headline || 'No headline'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }} noWrap>
                                        📍 {profile.location || 'Unknown location'}
                                    </Typography>
                                    {profile.company && (
                                        <Typography variant="body2" sx={{ mb: 2, color: '#666' }} noWrap>
                                            🏢 {profile.company}
                                        </Typography>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip 
                                            label={profile.connectionsCount ? `${profile.connectionsCount} connections` : 'LinkedIn'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Button 
                                            size="small" 
                                            href={profile.profileUrl} 
                                            target="_blank"
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            View
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Paper>
    );

    return (
        <Box>
            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', p: 3, mb: 4 }}>
                <Typography variant="h4" sx={{ color: 'white', display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Campaign sx={{ mr: 1 }}/> LinkedIn Profile Scraper
                </Typography>
                <Typography sx={{ color: 'white' }}>Use Apify to scrape LinkedIn profiles and gather member insights for your campaigns.</Typography>
            </Box>
            
            {renderScrapingControls()}
            {renderProfileResults()}
            
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert 
                    onClose={() => setSnackbarOpen(false)} 
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}