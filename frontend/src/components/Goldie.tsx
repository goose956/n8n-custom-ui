import React from 'react';
import { Box, Typography, Paper, Container, Grid, Card, CardContent, Button, Chip, LinearProgress, Avatar, Divider } from '@mui/material';
import { AutoAwesome, VideoLibrary, TrendingUp, Analytics, Timeline, BarChart, Speed, Lightbulb, Visibility, ThumbUp, Share, PlayArrow, Edit, Star } from '@mui/icons-material';

interface GoldieProps {
  loading?: boolean;
  data?: any;
}

export function Goldie({ loading = false, data }: GoldieProps) {
  return (
    <Box className="page-wrapper" component="main" sx={{ bgcolor: '#fafbfc', minHeight: '100vh' }}>
      <Box className="hero-section" component="header" sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        color: 'white',
        py: 6
      }}>
        <Container className="container" maxWidth="lg">
          <Typography 
            className="page-title"
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginBottom: 2
            }}
          >
            <AutoAwesome sx={{ fontSize: '3rem' }} />
            Goldie - AI Script Generator
          </Typography>
          <Typography className="subtitle" variant="h6" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoLibrary />
            Generate viral TikTok scripts using AI-powered analysis
          </Typography>
        </Container>
      </Box>

      <Container className="container main-content" maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3} className="stats-grid">
          <Grid item xs={12} md={4}>
            <Card className="stat-card" sx={{ 
              borderRadius: 3, 
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
              background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: '0.2s'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <TrendingUp sx={{ fontSize: '2.5rem' }} />
                  <Box>
                    <Typography className="stat-number" variant="h3" sx={{ fontWeight: 'bold' }}>
                      {loading ? '...' : '847'}
                    </Typography>
                    <Typography className="stat-label" variant="body2">Viral Videos Analyzed</Typography>
                  </Box>
                </Box>
                <Chip 
                  icon={<TrendingUp />} 
                  label="+15% this week" 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="stat-card" sx={{ 
              borderRadius: 3, 
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
              border: '1px solid rgba(0,0,0,0.06)',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: '0.2s'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <Analytics sx={{ fontSize: '2.5rem', color: '#1976d2' }} />
                  <Box>
                    <Typography className="stat-number" variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {loading ? '...' : '92%'}
                    </Typography>
                    <Typography className="stat-label" variant="body2" color="text.secondary">Success Rate</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={92} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(25, 118, 210, 0.1)' }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="stat-card" sx={{ 
              borderRadius: 3, 
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
              border: '1px solid rgba(0,0,0,0.06)',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: '0.2s'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <Speed sx={{ fontSize: '2.5rem', color: '#1976d2' }} />
                  <Box>
                    <Typography className="stat-number" variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {loading ? '...' : '2.4M'}
                    </Typography>
                    <Typography className="stat-label" variant="body2" color="text.secondary">Scripts Generated</Typography>
                  </Box>
                </Box>
                <Chip 
                  icon={<Star />} 
                  label="Premium Quality" 
                  size="small" 
                  color="primary"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper className="main-panel" sx={{ 
          p: 4,
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.06)',
          mt: 4
        }}>
          <Box className="section-header" sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Lightbulb />
              AI Script Generation
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Transform viral video insights into compelling scripts for your TikTok content
            </Typography>
          </Box>

          <Grid container spacing={3} className="feature-grid">
            <Grid item xs={12} md={6}>
              <Card className="feature-card" sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <Timeline />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Viral Analysis
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Analyze thousands of viral TikTok videos to understand what makes content go viral
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<PlayArrow />}
                    sx={{ borderRadius: 10 }}
                  >
                    Start Analysis
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card className="feature-card" sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <Edit />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Script Generation
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generate custom scripts based on viral patterns and your specific niche
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AutoAwesome />}
                    sx={{ borderRadius: 10 }}
                  >
                    Generate Script
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box className="metrics-section" sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <BarChart />
              Performance Metrics
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Chip 
                  icon={<Visibility />}
                  label="2.4M+ Views Generated"
                  color="primary"
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Chip 
                  icon={<ThumbUp />}
                  label="847K+ Likes"
                  color="primary"
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Chip 
                  icon={<Share />}
                  label="156K+ Shares"
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}