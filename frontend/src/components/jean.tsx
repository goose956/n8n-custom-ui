import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { API } from '../../config/api';

interface JeanProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  profileImage: string;
  connections: number;
  engagementRate: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'pending';
}

interface JeanStats {
  totalMessages: number;
  responseRate: number;
  connectionsGrowth: number;
  campaignsActive: number;
}

export function Jean() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<JeanProfile | null>(null);
  const [stats, setStats] = useState<JeanStats | null>(null);

  useEffect(() => {
    fetchJeanData();
  }, []);

  const fetchJeanData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      setProfile({
        id: '1',
        name: 'Jean Anderson',
        title: 'Senior Marketing Director',
        company: 'TechCorp Solutions',
        location: 'San Francisco, CA',
        email: 'jean.anderson@techcorp.com',
        phone: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/jeananderson',
        profileImage: '',
        connections: 2847,
        engagementRate: 8.5,
        lastActive: '2024-01-15T10:30:00Z',
        status: 'active'
      });

      setStats({
        totalMessages: 156,
        responseRate: 12.8,
        connectionsGrowth: 23,
        campaignsActive: 3
      });
    } catch (error) {
      console.error('Failed to fetch Jean data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <ScheduleIcon />;
      case 'pending': return <ScheduleIcon />;
      default: return <ScheduleIcon />;
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#fafbfc' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon sx={{ fontSize: 32, color: '#1976d2' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              Jean Profile
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchJeanData}
            disabled={loading}
            sx={{ borderRadius: 3 }}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body1" sx={{ color: '#666', maxWidth: 600 }}>
          Comprehensive profile view and analytics for Jean Anderson
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="70%" height={20} />
                </Box>
              ) : profile ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                        fontSize: 24,
                        fontWeight: 600
                      }}
                    >
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {profile.name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(profile.status)}
                        label={profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                        color={getStatusColor(profile.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profile.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', ml: 3 }}>
                      {profile.company}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                      <Typography variant="body2">{profile.location}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                      <Typography variant="body2">{profile.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                      <Typography variant="body2">{profile.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinkedInIcon sx={{ fontSize: 16, color: '#0077b5', mr: 1 }} />
                      <Typography
                        variant="body2"
                        component="a"
                        href={profile.linkedinUrl}
                        target="_blank"
                        sx={{ color: '#0077b5', textDecoration: 'none' }}
                      >
                        LinkedIn Profile
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
                }}
              >
                {loading ? (
                  <Box>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 0.5
                        }}
                      >
                        Messages Sent
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.5rem' }}
                      >
                        {stats?.totalMessages.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#e3f2fd', color: '#1976d2' }}>
                      <MessageIcon />
                    </Avatar>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
                }}
              >
                {loading ? (
                  <Box>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 0.5
                        }}
                      >
                        Response Rate
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.5rem' }}
                      >
                        {stats?.responseRate}%
                      </Typography>
                    </Box>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#e8f5e8', color: '#27ae60' }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
                }}
              >
                {loading ? (
                  <Box>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 0.5
                        }}
                      >
                        Connections
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.5rem' }}
                      >
                        {profile?.connections.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#fff3e0', color: '#f39c12' }}>
                      <PersonIcon />
                    </Avatar>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
                }}
              >
                {loading ? (
                  <Box>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 0.5
                        }}
                      >
                        Active Campaigns
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.5rem' }}
                      >
                        {stats?.campaignsActive}
                      </Typography>
                    </Box>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#f3e5f5', color: '#9b59b6' }}>
                      <AnalyticsIcon />
                    </Avatar>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Engagement Progress */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StarIcon sx={{ color: '#1976d2', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Engagement Progress
              </Typography>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={8} />
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Current Rate: {profile?.engagementRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Target: 15%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(profile?.engagementRate || 0) / 15 * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)'
                    }
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                borderRadius: 3,
                px: 3
              }}
            >
              Send Message
            </Button>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ borderRadius: 3, px: 3 }}
            >
              View Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              sx={{ borderRadius: 3, px: 3 }}
            >
              Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}