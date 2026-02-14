import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Snackbar } from '@mui/material';
import { Alert } from '@mui/material';
import { API } from '../config/api';
import { AnalyticsData } from '../../types/membersArea';

export function MembersAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`${API}/analytics`);
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await res.json();
        setAnalyticsData(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
        setOpenSnackbar(true);
      }
    }
    fetchAnalytics();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 2, color: '#1976d2' }}>Analytics</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography sx={{ color: '#e74c3c' }}>Error: {error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {analyticsData.length > 0 ? analyticsData.map((data) => (
            <Grid item xs={12} sm={6} md={4} key={data.scriptId}>
              <Card sx={{ borderRadius: 12, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1976d2', marginBottom: 1 }}>
                    Script ID: {data.scriptId}
                  </Typography>
                  <Typography>Views: {data.views}</Typography>
                  <Typography>Interactions: {data.interactions}</Typography>
                  <Typography>Conversion Rate: {data.conversionRate}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          )) : (
            <Typography>No analytics data available.</Typography>
          )}
        </Grid>
      )}

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        {error ? (
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : (
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            Data loaded successfully!
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}