import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Skeleton, Chip, Avatar, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Button } from '@mui/material';
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward, Refresh, BarChart, Search, Warning, Error, Info } from '@mui/icons-material';

interface AnalyticsData {
  totalMessagesSent: number;
  totalRepliesReceived: number;
  engagementRate: number;
  openRate: number;
  clickThroughRate: number;
  responseAnalysis: Array<{ date: string; value: number }>;
}

export function MembersAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/analytics`)
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        setError('Failed to load analytics data');
        setSnackbarOpen(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box sx={{ bgcolor: '#fafbfc', padding: 3 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: 'white', borderRadius: 16, padding: 3, marginBottom: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" gutterBottom>
          <BarChart sx={{ fontSize: 40, marginRight: 1 }} />
          Analytics Overview
        </Typography>
        <Typography variant="body1">
          Gain insights on your LinkedIn outreach performance.
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '200px' }}>
          <Error sx={{ fontSize: 64, color: 'red', marginBottom: 2 }} />
          <Typography variant="body1" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} startIcon={<Refresh />} sx={{ borderRadius: 10 }}>
            Retry
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Messages Sent
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: '#1976d2', marginRight: 1 }} />
                    <Typography variant="h3" color="primary">
                      {data!.totalMessagesSent}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Total messages dispatched
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Replies Received
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ fontSize: 40, color: '#e74c3c', marginRight: 1 }} />
                    <Typography variant="h3" color="error">
                      {data!.totalRepliesReceived}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Total replies from prospects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Engagement Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpward sx={{ fontSize: 40, color: '#27ae60', marginRight: 1 }} />
                    <Typography variant="h3" sx={{ color: '#27ae60' }}>
                      {data!.engagementRate}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Rate of interaction with messages
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ marginTop: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Open Rate</TableCell>
                  <TableCell>Click-Through Rate</TableCell>
                  <TableCell>Response Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data!.responseAnalysis.map((analysis, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f4f6f8' } }}>
                    <TableCell>{analysis.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${data!.openRate}%`}
                        icon={data!.openRate >= 50 ? <ArrowUpward /> : <ArrowDownward />}
                        sx={{ bgcolor: data!.openRate >= 50 ? '#27ae60' : '#e74c3c', color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${data!.clickThroughRate}%`}
                        icon={data!.clickThroughRate >= 20 ? <ArrowUpward /> : <ArrowDownward />}
                        sx={{ bgcolor: data!.clickThroughRate >= 20 ? '#27ae60' : '#e74c3c', color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{analysis.value}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={error}
        action={
          <Button color="inherit" size="small" onClick={handleSnackbarClose}>
            Close
          </Button>
        }
      />
    </Box>
  );
}