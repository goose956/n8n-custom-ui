import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, IconButton, Skeleton, Badge, LinearProgress, Paper, Divider } from '@mui/material';
import { VideoLibrary, Insights, TrendingUp, ArrowUpward, ArrowDownward, People, ShowChart, AutoGraphOutlined, Refresh } from '@mui/icons-material';

// Types
interface YouTubeAnalytics {
  channelId: string;
  viewerEngagement: number;
  videoPerformance: VideoPerformance[];
  subscriberGrowth: number;
}

interface VideoPerformance {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
}

// Mock Data
const mockData: YouTubeAnalytics = {
  channelId: 'UC123456',
  viewerEngagement: 80,
  videoPerformance: [
    { videoId: 'vid1', title: 'Scripted Success - Episode 1', views: 1500, likes: 120, comments: 30 },
    { videoId: 'vid2', title: 'Insights into Writing Scripts', views: 2300, likes: 200, comments: 45 },
    { videoId: 'vid3', title: 'Engaging Content Creation', views: 500, likes: 30, comments: 10 }
  ],
  subscriberGrowth: 200
};

export function MembersYoutubeInsightsPage() {
  const [analytics, setAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulating an API call with a timeout
        setTimeout(() => {
          setAnalytics(mockData);
          setLoading(false);
        }, 2000);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Hero Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" color="#fafbfc" display="flex" alignItems="center" gutterBottom>
          <Insights sx={{ mr: 1 }} />
          YouTube Insights
        </Typography>
        <Typography variant="subtitle1" color="#fafbfc">
          Explore insights of your integrated YouTube channels, monitor engagement levels, and track your script-driven subscriber growth.
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={4}>
        {loading ? (
          [0, 1, 2, 3].map(index => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'visible', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                <CardContent sx={{ position: 'relative', p: 3, lr: 3 }}>
                  <Avatar sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#ffd700' }}>
                    <People />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>Subscribers Growth</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                      {analytics?.subscriberGrowth}
                    </Typography>
                    <ArrowUpward sx={{ color: 'green', ml: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'visible', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                <CardContent sx={{ position: 'relative', p: 3 }}>
                  <Avatar sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#27ae60' }}>
                    <AutoGraphOutlined />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>Engagement Rate</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                      {analytics?.viewerEngagement}%
                    </Typography>
                    <ArrowUpward sx={{ color: 'green', ml: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'visible', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                <CardContent sx={{ position: 'relative', p: 3 }}>
                  <Avatar sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#ff6347' }}>
                    <TrendingUp />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>Top Performing Video</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                      {analytics?.videoPerformance[0].views}
                    </Typography>
                    <ArrowUpward sx={{ color: 'green', ml: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'visible', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                <CardContent sx={{ position: 'relative', p: 3 }}>
                  <Avatar sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#00bcd4' }}>
                    <VideoLibrary />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>Videos Analyzed</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                      {analytics?.videoPerformance.length}
                    </Typography>
                    <ArrowUpward sx={{ color: 'green', ml: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Detailed Performance Table */}
      <Paper sx={{ overflow: 'hidden', boxShadow: 'none' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center" sx={{ mr: 1 }}>
            <ShowChart sx={{ mr: 1 }} />
            Video Performance Details
          </Typography>
          <IconButton color="primary" sx={{ ml: 'auto' }} onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
          </Box>
        ) : analytics?.videoPerformance.length ? (
          <table width="100%" style={{ borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>Video Title</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Views</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Likes</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Comments</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.videoPerformance.map((video, index) => (
                <tr key={video.videoId} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px' }}>{video.title}</td>
                  <td style={{ padding: '12px' }}>
                    <Chip icon={<AutoGraphOutlined />} label={video.views.toLocaleString()} color="primary" />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Chip icon={<TrendingUp />} label={video.likes.toLocaleString()} sx={{ backgroundColor: '#27ae60', color: '#fff' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Chip icon={<ShowChart />} label={video.comments.toLocaleString()} sx={{ backgroundColor: '#ff6347', color: '#fff' }} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <IconButton aria-label="edit" color="primary">
                      <TrendingUp />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Insights sx={{ fontSize: 64, color: '#b0bec5' }} />
            <Typography variant="h6" sx={{ mt: 2, color: '#70757a' }}>
              You haven't created any YouTube script insights yet.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 2, color: '#70757a' }}>
              Start by generating scripts for your videos or integrating your YouTube channel.
            </Typography>
            <IconButton color="primary" size="large">
              <Refresh />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
}