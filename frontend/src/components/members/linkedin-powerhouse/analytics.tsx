import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Message,
  DonutLarge,
  Timelapse,
  Industry,
  Error,
  Refresh,
  Visibility,
  BarChart,
} from '@mui/icons-material';

interface AnalyticsData {
  effectivenessByMessageType: EffectivenessByMessageType[];
  trendsOverTime: Trend[];
}

interface EffectivenessByMessageType {
  messageType: string;
  engagementRate: number;
}

interface Trend {
  date: string;
  engagement: number;
}

export function MembersAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/analytics-data`)
      .then((response) => response.json())
      .then((data: AnalyticsData) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrendingUp sx={{ mr: 1 }} />
          Analytics Dashboard
        </Typography>
        <Typography variant="body1">
          Dive deep into your LinkedIn outreach effectiveness. See detailed breakdowns by message type, time of day, and industry.
          Use AI-powered insights to enhance your strategies.
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Message sx={{ mr: 1 }} />
                Messages Sent
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={80} />
              ) : (
                <Typography variant="h3" color="primary">
                  1,892
                </Typography>
              )}
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'green' }}>
                <ArrowUpward sx={{ mr: 0.5 }} /> 14% increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <DonutLarge sx={{ mr: 1 }} />
                Response Rate
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={80} />
              ) : (
                <Typography variant="h3" color="primary">
                  38%
                </Typography>
              )}
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'red' }}>
                <ArrowDownward sx={{ mr: 0.5 }} /> 5% decrease
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BarChart sx={{ mr: 1 }} />
          Detailed Analytics
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.effectivenessByMessageType.map((effectiveness, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    icon={<Visibility />}
                    label={effectiveness.messageType}
                    sx={{ mr: 2, bgcolor: '#e3f2fd' }}
                  />
                  Engagement Rate
                </Typography>
                <Typography variant="h6">{effectiveness.engagementRate}%</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Error color="error" sx={{ fontSize: 64 }} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Data not available. Please try refreshing the page.
            </Typography>
          </Box>
        )}
      </Paper>

      <Tooltip title="Refresh Data">
        <IconButton color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );
}