import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { API } from '../../config/api';
import { Tutorial } from '../../types/membersArea';

export function MembersTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const fetchTutorials = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tutorials`);
      if (!res.ok) throw new Error('Failed to fetch tutorials');
      const data: Tutorial[] = await res.json();
      setTutorials(data);
    } catch (error) {
      setError((error as Error).message);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
        Tutorials
      </Typography>
      <Typography variant="body1" gutterBottom>
        Learn to create effective TikTok scripts with insights from top creators.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {tutorials.length > 0 ? (
            tutorials.map((tutorial) => (
              <Grid item xs={12} md={6} key={tutorial.title}>
                <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#1976d2' }}>
                      {tutorial.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1a1a2e', marginBottom: 1 }}>
                      By: {tutorial.creator}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1a1a2e', marginBottom: 1 }}>
                      Duration: {tutorial.duration} mins
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', marginTop: 2 }}
                      onClick={() => setSnackbarOpen(true)}
                    >
                      Start Tutorial
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography variant="body2" sx={{ margin: 3 }}>
              No tutorials available at the moment.
            </Typography>
          )}
        </Grid>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Tutorial started successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}