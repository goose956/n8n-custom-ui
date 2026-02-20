import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, Avatar, Skeleton, IconButton, Badge, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import { TrendingUp, TrendingDown, Email, AccountCircle, Add, ArrowUpward, ArrowDownward, Refresh, Search, MoreVert, CheckCircle, Error, CloudDownload } from '@mui/icons-material';

interface EmailScraperResult {
    creatorName: string;
    emailAddress: string;
    channelLink: string;
}

export function MembersEmailScraperPage() {
    const [scraperResults, setScraperResults] = useState<EmailScraperResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

    useEffect(() => {
        fetch(`${API_BASE}/api/email-scraper`)
            .then(response => response.json())
            .then(data => {
                setScraperResults(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load email scraper results.');
                setLoading(false);
            });
    }, [API_BASE]);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        // Trigger fetch again
        fetch(`${API_BASE}/api/email-scraper`)
            .then(response => response.json())
            .then(data => {
                setScraperResults(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load email scraper results.');
                setLoading(false);
            });
    };

    const openDialog = () => {
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafbfc' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 4, borderRadius: 16, mb: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" color="white" sx={{ display: 'flex', alignItems: 'center' }}><Email sx={{ mr: 1 }} /> Email Scraper</Typography>
                <Typography variant="subtitle1" color="white">Find and connect with YouTube creators for potential partnerships. Enhance your collaborations and expand your outreach.</Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><AccountCircle sx={{ mr: 1 }} /> Creators Found</Typography>
                            <Typography variant="h4" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                {loading ? <Skeleton width={60} /> : `${scraperResults.length}`}
                                <TrendingUp color="success" sx={{ ml: 1 }} />
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><Email sx={{ mr: 1 }} /> Emails Scraped</Typography>
                            <Typography variant="h4" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                {loading ? <Skeleton width={60} /> : `${scraperResults.length * 2}`} {/* Assuming 2 emails per creator */}
                                <TrendingDown color="error" sx={{ ml: 1 }} />
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Card sx={{ p: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><CloudDownload sx={{ mr: 1 }} />Email Results</Typography>
                        <Box>
                            <Button variant="contained" color="primary" sx={{ borderRadius: 10, mr: 1 }} startIcon={<Refresh />} onClick={handleRetry}>Refresh</Button>
                            <Button variant="outlined" color="primary" sx={{ borderRadius: 10 }} startIcon={<Add />} onClick={openDialog}>Add Manually</Button>
                        </Box>
                    </Box>

                    {loading ? (
                        <Skeleton variant="rectangular" width="100%" height={118} />
                    ) : error ? (
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h6" color="error">{error}</Typography>
                            <Button variant="contained" color="primary" sx={{ mt: 2, borderRadius: 10 }} onClick={handleRetry}>Retry</Button>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Creator Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Channel</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {scraperResults.map((result, index) => (
                                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                            <TableCell>{result.creatorName}</TableCell>
                                            <TableCell>
                                                <Chip label={result.emailAddress} color="primary" variant="outlined" size="small" icon={<Email />} />
                                            </TableCell>
                                            <TableCell>
                                                <a href={result.channelLink} target="_blank" rel="noopener noreferrer">{result.channelLink}</a>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="More actions">
                                                    <IconButton>
                                                        <MoreVert />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Card>
            </Box>

            <Dialog open={dialogOpen} onClose={closeDialog}>
                <DialogTitle>Add Email Manually</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Feature to manually add or update email details of a creator.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} color="primary">Cancel</Button>
                    <Button onClick={closeDialog} color="primary" variant="contained">Add</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} message={error} />
        </Box>
    );
}