import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Button,
    Snackbar,
    IconButton
} from '@mui/material';
import { CheckCircle, Error, AccessTime, Edit, Download } from '@mui/icons-material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface Result {
    id: string;
    skillExecuted: string;
    output: string;
    executionTime: number;
    createdAt: Date;
    userRating?: number;
}

// Alert component for Snackbar notifications
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function MembersResultsPage() {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${window.location.origin}/api/results`);
                const data: Result[] = await response.json();
                setResults(data);
            } catch (err) {
                setError('Failed to load results');
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    const emptyState = (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'gray' }} />
            <Typography variant="h6" sx={{ mt: 2 }}>
                You haven't created any content yet.
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                Start Creating Now
            </Button>
        </Box>
    );

    return (
        <Box sx={{ background: '#fafbfc', p: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Results History
            </Typography>
            {loading ? (
                <LinearProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : results.length === 0 ? (
                emptyState
            ) : (
                <Grid container spacing={2}>
                    {results.map((result) => (
                        <Grid item xs={12} sm={6} md={4} key={result.id}>
                            <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 2, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                                <CardContent>
                                    <Typography variant="h5">{result.skillExecuted}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(result.createdAt).toLocaleString()}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        Output
                                    </Typography>
                                    <Typography variant="body1">{result.output}</Typography>
                                    <Chip label={`Execution time: ${result.executionTime} ms`} icon={<AccessTime />} sx={{ mt: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Button variant="contained" color="primary" startIcon={<Edit />}>
                                            Edit
                                        </Button>
                                        <Button variant="outlined" startIcon={<Download />}>
                                            Download
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}