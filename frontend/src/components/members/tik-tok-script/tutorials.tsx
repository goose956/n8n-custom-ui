import React, { useState, useEffect, useCallback } from'react';
import { Box, Typography, Grid, Card, CardContent, Button, Snackbar, CircularProgress } from'@mui/material';
import { useTheme } from'@mui/system';
import { API } from'../../config/api';
import { ContactForm } from'./ContactForm';

interface Tutorial {
 id: string;
 title: string;
 description: string;
 content: string;
}

export function MembersTutorialsPage() {
 const [tutorials, setTutorials] = useState<Tutorial[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

 const theme = useTheme();

 const fetchTutorials = useCallback(async () => {
 try {
 const res = await fetch(`${API}/tutorials`);
 if (!res.ok) throw new Error('Failed to fetch tutorials');
 const data: Tutorial[] = await res.json();
 setTutorials(data);
 } catch (err: any) {
 setError(err.message);
 setSnackbarOpen(true);
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchTutorials();
 }, [fetchTutorials]);

 const handleSnackbarClose = () => {
 setSnackbarOpen(false);
 };

 return (
 <Box sx={{ p: 3 }}>
 <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight:'bold', color:'#1a1a2e' }}>
 Tutorials & Guides
 </Typography>
 {loading ? (
 <Box sx={{ display:'flex', justifyContent:'center', mt: 4 }}>
 <CircularProgress />
 </Box>
 ) : error ? (
 <Typography variant="body1" sx={{ color: theme.palette.error.main }}>
 {error}
 </Typography>
 ) : tutorials.length === 0 ? (
 <Typography variant="body1" sx={{ color:'#1a1a2e' }}>
 No tutorials available at the moment.
 </Typography>
 ) : (
 <Grid container spacing={3}>
 {tutorials.map((tutorial) => (
 <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
 <Card
 sx={{
 bgcolor:'#ffffff',
 borderRadius: theme.shape.borderRadius,
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 }}
 >
 <CardContent>
 <Typography variant="h6" sx={{ mb: 2, color:'#1976d2' }}>
 {tutorial.title}
 </Typography>
 <Typography variant="body2" sx={{ mb: 2, color:'#1a1a2e' }}>
 {tutorial.description}
 </Typography>
 <Button
 variant="contained"
 sx={{
 bgcolor:'#1976d2',
'&:hover': {
 bgcolor: theme.palette.primary.dark,
 },
 }}
 >
 View Details
 </Button>
 </CardContent>
 </Card>
 </Grid>
 ))}
 </Grid>
 )}
 <Snackbar
 open={snackbarOpen}
 autoHideDuration={6000}
 onClose={handleSnackbarClose}
 message="Error fetching tutorials"
 />
 <ContactForm />
 </Box>
 );
}