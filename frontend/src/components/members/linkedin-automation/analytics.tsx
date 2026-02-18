import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Avatar, IconButton, Paper, Skeleton, Badge, Tooltip, Divider, Button } from '@mui/material';
import { TrendingUp, TrendingDown, BarChart, ArrowUpward, ArrowDownward, Refresh, GetApp, Assessment } from '@mui/icons-material';

interface UserAnalytics {
  userId: string;
  openRate: number;
  responseRate: number;
  engagementMetrics: Array<{
    date: string;
    messagesSent: number;
    responsesReceived: number;
  }>;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics`)
      .then((response) => response.json())
      .then((data) => {
        setAnalyticsData(data);
        setLoading(false);
      })
      .catch((e) => {
        setError('Failed to fetch analytics data');
        setLoading(false);
      });
  }, []);

  const renderLoadingState = () => (
    <Grid container spacing={3}>
      {Array.from(new Array(4)).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  );

  const renderEmptyState = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
      <BarChart sx={{ fontSize: 64, color: 'gray' }} />
      <Typography sx={{ mt: 2, mb: 1 }} variant="h6" color="textSecondary">
        No analytics data available
      </Typography>
      <Button variant="outlined" startIcon={<Refresh />} sx={{ borderRadius: 10, mt: 1 }}>
        Refresh Data
      </Button>
    </Box>
  );

  const renderAnalyticsContent = () => (
    <>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 3, mb: 3, borderRadius: 3, color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ mr: 1 }} /> Outreach Performance Overview
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1, color: analyticsData.openRate > 50 ? 'green' : 'red' }} /> Open Rate
              </Typography>
              <Typography variant="h3" sx={{ my: 2, color: analyticsData.openRate > 50 ? 'green' : 'red' }}>
                {analyticsData.openRate}%
              </Typography>
              <Chip icon={analyticsData.openRate > 50 ? <ArrowUpward /> : <ArrowDownward />} label="Trend" sx={{ backgroundColor: analyticsData.openRate > 50 ? 'green' : 'red', color: 'white' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown sx={{ mr: 1, color: analyticsData.responseRate > 50 ? 'green' : 'red' }} /> Response Rate
              </Typography>
              <Typography variant="h3" sx={{ my: 2, color: analyticsData.responseRate > 50 ? 'green' : 'red' }}>
                {analyticsData.responseRate}%
              </Typography>
              <Chip icon={analyticsData.responseRate > 50 ? <ArrowUpward /> : <ArrowDownward />} label="Trend" sx={{ backgroundColor: analyticsData.responseRate > 50 ? 'green' : 'red', color: 'white' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChart sx={{ mr: 1, color: '#1976d2' }} /> Total Messages Sent
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {analyticsData.engagementMetrics.reduce((acc, metric) => acc + metric.messagesSent, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 5 }}>
        <Paper sx={{ p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BarChart sx={{ mr: 1 }} /> Detailed Engagement Metrics
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {analyticsData.engagementMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {metric.date}
                    </Typography>
                    <Badge badgeContent={metric.responsesReceived} color="primary">
                      <Typography variant="subtitle1">Responses Received</Typography>
                    </Badge>
                    <Typography variant="subtitle1">Messages Sent: {metric.messagesSent}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button variant="contained" startIcon={<GetApp />} sx={{ mt: 3, borderRadius: 10 }}>
            Download Full Report
          </Button>
        </Paper>
      </Box>
    </>
  );

  if (loading) return renderLoadingState();
  if (error) return renderEmptyState();

  return (
    <Box>
      {analyticsData ? renderAnalyticsContent() : renderEmptyState()}
    </Box>
  );
}