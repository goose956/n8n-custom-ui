import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Person,
  TrendingUp,
  VideoCall,
  Analytics,
  Star,
  PlayArrow,
  Timeline,
  Speed,
  CheckCircle
} from '@mui/icons-material';

interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  viralScore: number;
  usageCount: number;
  status: 'active' | 'trending' | 'new';
}

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

export function Lucas() {
  const templates: ScriptTemplate[] = [
    {
      id: '1',
      title: 'The Hook Master',
      category: 'Comedy',
      viralScore: 95,
      usageCount: 1247,
      status: 'trending'
    },
    {
      id: '2',
      title: 'Story Builder Pro',
      category: 'Educational',
      viralScore: 88,
      usageCount: 856,
      status: 'active'
    },
    {
      id: '3',
      title: 'Trend Catcher',
      category: 'Entertainment',
      viralScore: 92,
      usageCount: 2103,
      status: 'new'
    }
  ];

  const metrics: PerformanceMetric[] = [
    {
      label: 'Scripts Generated',
      value: '12,547',
      change: 15.3,
      icon: <VideoCall sx={{ color: '#1976d2' }} />
    },
    {
      label: 'Viral Success Rate',
      value: '87%',
      change: 8.2,
      icon: <TrendingUp sx={{ color: '#27ae60' }} />
    },
    {
      label: 'User Satisfaction',
      value: '4.8/5',
      change: 2.1,
      icon: <Star sx={{ color: '#f39c12' }} />
    },
    {
      label: 'Templates Active',
      value: '156',
      change: 12.5,
      icon: <PlayArrow sx={{ color: '#9b59b6' }} />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trending': return '#e74c3c';
      case 'new': return '#27ae60';
      default: return '#1976d2';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trending': return <TrendingUp />;
      case 'new': return <Star />;
      default: return <CheckCircle />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafbfc', minHeight: '100vh' }}>
      <Paper
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Person sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Lucas Dashboard
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Advanced Script Analytics & Template Management
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: '0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {metric.icon}
                  <Typography variant="h4" fontWeight="bold">
                    {metric.value}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ color: '#27ae60', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#27ae60', fontWeight: 600 }}>
                    +{metric.change}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {metric.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Timeline sx={{ color: '#1976d2' }} />
          <Typography variant="h5" fontWeight="bold">
            Script Templates Performance
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={4} key={template.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: '0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {template.title}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(template.status)}
                      label={template.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(template.status),
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Viral Score
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {template.viralScore}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={template.viralScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#1976d2',
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Analytics sx={{ color: '#1976d2', fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        Usage Count
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {template.usageCount.toLocaleString()}
                    </Typography>
                  </Box>

                  <Chip
                    label={template.category}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      mb: 2
                    }}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Speed />}
                    sx={{
                      mt: 2,
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565c0'
                      },
                      borderRadius: 2
                    }}
                  >
                    Analyze Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

export default Lucas;