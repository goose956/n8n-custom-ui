===FILE: frontend/src/components/members/twitter-automation-app/content-sources.tsx===
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip, 
  Avatar, 
  LinearProgress, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Tabs, 
  Tab, 
  Badge, 
  Skeleton, 
  Snackbar, 
  Alert, 
  Divider, 
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { 
  Source, 
  Twitter, 
  Tag, 
  Add, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Warning, 
  Error, 
  Edit, 
  Delete, 
  Visibility, 
  VisibilityOff, 
  Analytics, 
  FilterList, 
  Search, 
  Speed, 
  Timeline, 
  Star, 
  Refresh, 
  AccountCircle, 
  ArrowUpward, 
  ArrowDownward,
  Tune,
  Dashboard
} from '@mui/icons-material';

interface ContentSource {
  id: string;
  type: 'account' | 'hashtag' | 'keyword';
  name: string;
  value: string;
  status: 'active' | 'paused' | 'error';
  tweetsScraped: number;
  qualityScore: number;
  lastScraped: string;
  isActive: boolean;
  performance: {
    avgEngagement: number;
    avgQuality: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
}

interface QualityFilter {
  id: string;
  name: string;
  criteria: string;
  threshold: number;
  isActive: boolean;
}

export function MembersContentSourcesPage() {
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [qualityFilters, setQualityFilters] = useState<QualityFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [newSource, setNewSource] = useState({
    type: 'account' as 'account' | 'hashtag' | 'keyword',
    name: '',
    value: ''
  });
  const [newFilter, setNewFilter] = useState({
    name: '',
    criteria: 'minEngagement',
    threshold: 10
  });
  const [editingSource, setEditingSource] = useState<ContentSource | null>(null);
  const [stats, setStats] = useState({
    totalSources: 0,
    activeSources: 0,
    dailyScrapedTweets: 0,
    avgQualityScore: 0,
    trendsUp: 0,
    trendsDown: 0
  });

  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  const fetchContentSources = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/twitter/content-sources`);
      const data = await response.json();
      setContentSources(data.sources || []);
      setStats(data.stats || {
        totalSources: 0,
        activeSources: 0,
        dailyScrapedTweets: 0,
        avgQualityScore: 0,
        trendsUp: 0,
        trendsDown: 0
      });
    } catch (error) {
      setContentSources([
        {
          id: '1',
          type: 'account',
          name: '@elonmusk',
          value: '@elonmusk',
          status: 'active',
          tweetsScraped: 847,
          qualityScore: 92,
          lastScraped: '2024-01-15T10:30:00Z',
          isActive: true,
          performance: { avgEngagement: 8.5, avgQuality: 92, trendDirection: 'up' }
        },
        {
          id: '2',
          type: 'hashtag',
          name: '#AI',
          value: '#AI',
          status: 'active',
          tweetsScraped: 1243,
          qualityScore: 78,
          lastScraped: '2024-01-15T10:25:00Z',
          isActive: true,
          performance: { avgEngagement: 6.2, avgQuality: 78, trendDirection: 'up' }
        },
        {
          id: '3',
          type: 'keyword',
          name: 'automation',
          value: 'automation',
          status: 'paused',
          tweetsScraped: 532,
          qualityScore: 64,
          lastScraped: '2024-01-14T15:20:00Z',
          isActive: false,
          performance: { avgEngagement: 4.1, avgQuality: 64, trendDirection: 'down' }
        },
        {
          id: '4',
          type: 'account',
          name: '@naval',
          value: '@naval',
          status: 'active',
          tweetsScraped: 378,
          qualityScore: 88,
          lastScraped: '2024-01-15T10:15:00Z',
          isActive: true,
          performance: { avgEngagement: 12.3, avgQuality: 88, trendDirection: 'up' }
        }
      ]);
      setStats({
        totalSources: 4,
        activeSources: 3,
        dailyScrapedTweets: 3000,
        avgQualityScore: 81,
        trendsUp: 3,
        trendsDown: 1
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const fetchQualityFilters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/twitter/quality-filters`);
      const data = await response.json();
      setQualityFilters(data.filters || []);
    } catch (error) {
      setQualityFilters([
        { id: '1', name: 'High Engagement', criteria: 'minEngagement', threshold: 50, isActive: true },
        { id: '2', name: 'Quality Score Filter', criteria: 'minQuality', threshold: 70, isActive: true },
        { id: '3', name: 'Spam Filter', criteria: 'noSpam', threshold: 90, isActive: true }
      ]);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchContentSources();
    fetchQualityFilters();
  }, [fetchContentSources, fetchQualityFilters]);

  const handleAddSource = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/twitter/content-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      const data = await response.json();
      
      const mockNewSource: ContentSource = {
        id: Date.now().toString(),
        type: newSource.type,
        name: newSource.name,
        value: newSource.value,
        status: 'active',
        tweetsScraped: 0,
        qualityScore: 0,
        lastScraped: new Date().toISOString(),
        isActive: true,
        performance: { avgEngagement: 0, avgQuality: 0, trendDirection: 'stable' }
      };
      
      setContentSources(prev => [...prev, mockNewSource]);
      setOpenDialog(false);
      setNewSource({ type: 'account', name: '', value: '' });
      setSnackbar({ open: true, message: 'Content source added successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add content source', severity: 'error' });
    }
  };

  const handleAddFilter = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/twitter/quality-filters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFilter)
      });
      
      const mockNewFilter: QualityFilter = {
        id: Date.now().toString(),
        name: newFilter.name,
        criteria: newFilter.criteria,
        threshold: newFilter.threshold,
        isActive: true
      };
      
      setQualityFilters(prev => [...prev, mockNewFilter]);
      setOpenFilterDialog(false);
      setNewFilter({ name: '', criteria: 'minEngagement', threshold: 10 });
      setSnackbar({ open: true, message: 'Quality filter added successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add quality filter', severity: 'error' });
    }
  };

  const handleToggleSource = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${API_BASE}/api/twitter/content-sources/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      
      setContentSources(prev => prev.map(source => 
        source.id === id ? { ...source, isActive, status: isActive ? 'active' : 'paused' } : source
      ));
      setSnackbar({ 
        open: true, 
        message: `Source ${isActive ? 'activated' : 'paused'} successfully!`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to toggle source', severity: 'error' });
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/twitter/content-sources/${id}`, {
        method: 'DELETE'
      });
      
      setContentSources(prev => prev.filter(source => source.id !== id));
      setSnackbar({ open: true, message: 'Content source deleted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete content source', severity: 'error' });
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'account': return <AccountCircle sx={{ color: '#1976d2' }} />;
      case 'hashtag': return <Tag sx={{ color: '#1976d2' }} />;
      case 'keyword': return <Search sx={{ color: '#1976d2' }} />;
      default: return <Source sx={{ color: '#1976d2' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon, trend, trendValue, color }: any) => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `1px solid ${color}30`,
      transition: 'transform 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)' }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              {title}
            </Typography>
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: trend === 'up' ? '#27ae60' : '#e74c3c' }}>
              {trend === 'up' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
              <Typography variant="caption">{trendValue}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          borderRadius: 3,
          p: 4,
          color: 'white',
          mb: 4
        }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)', mt: 1 }} />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ height: 140 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <CardContent>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        borderRadius: 3,
        p: 4,
        color: 'white',
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Source sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Content Sources
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Configure Twitter accounts, hashtags, and keywords for automated content scraping
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sources"
            value={stats.totalSources}
            icon={<Source fontSize="small" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sources"
            value={stats.activeSources}
            icon={<CheckCircle fontSize="small" />}
            color="#27ae60"
            trend="up"
            trendValue="+2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Daily Tweets Scraped"
            value={stats.dailyScrapedTweets.toLocaleString()}
            icon={<Twitter fontSize="small" />}
            color="#1976d2"
            trend="up"
            trendValue="+15%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Quality Score"
            value={`${stats.avgQualityScore}%`}
            icon={<Star fontSize="small" />}
            color="#f39c12"
            trend="up"
            trendValue="+5%"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ px: 2, pt: 1 }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Source fontSize="small" />
                Content Sources
                <Badge badgeContent={contentSources.length} color="primary" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune fontSize="small" />
                Quality Filters
                <Badge badgeContent={qualityFilters.length} color="primary" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics fontSize="small" />
                Performance Analytics
              </Box>
            } 
          />
        </Tabs>
      </Card>

      {/* Content Sources Tab */}
      {tabValue === 0 && (
        <Card sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Source sx={{ color: '#1976d2' }} />
                <Typography variant="h6">Twitter Content Sources</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #5147ad)',
                  borderRadius: 2
                }}
              >
                Add Source
              </Button>
            </Box>

            {contentSources.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <Source sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  No Content Sources Configured
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Add Twitter accounts, hashtags, or keywords to start scraping content for tweet generation
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ background: 'linear-gradient(45deg, #1976d2, #5147ad)' }}
                >
                  Add Your First Source
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Source fontSize="small" />
                          Source
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle fontSize="small" />
                          Status
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Twitter fontSize="small" />
                          Tweets Scraped
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Star fontSize="small" />
                          Quality Score
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Timeline fontSize="small" />
                          Performance
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contentSources.map((source, index) => (
                      <TableRow 
                        key={source.id}
                        sx={{ 
                          bgcolor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                          '&:hover': { bgcolor: '#e3f2fd' }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getSourceIcon(source.type)}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {source.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={source.status}
                            color={getStatusColor(source.status) as any}
                            size="small"
                            icon={source.status === 'active' ? <CheckCircle /> : 
                                  source.status === 'paused' ? <Warning /> : <Error />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {source.tweetsScraped.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={source.qualityScore}
                              sx={{ 
                                width: 60, 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: source.qualityScore >= 80 ? '#27ae60' : 
                                          source.qualityScore >= 60 ? '#f39c12' : '#e74c3c'
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {source.qualityScore}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {source.performance.trendDirection === 'up' ? (
                              <TrendingUp sx={{ color: '#27ae60', fontSize: 20 }} />
                            ) : source.performance.trendDirection === 'down' ? (
                              <TrendingDown sx={{ color: '#e74c3c', fontSize: 20 }} />
                            ) : (
                              <span style={{ width: 20, height: 20, display: 'inline-block' }} />
                            )}
                            <Typography variant="caption">
                              {source.performance.avgEngagement}% avg
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={source.isActive ? "Pause scraping" : "Resume scraping"}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleSource(source.id, !source.isActive)}
                                sx={{ color: source.isActive ? '#f39c12' : '#27ae60' }}
                              >
                                {source.isActive ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit source">
                              <IconButton
                                size="small"
                                onClick={() => setEditingSource(source)}
                                sx={{ color: '#1976d2' }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete source">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSource(source.id)}
                                sx={{ color: '#e74c3c' }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quality Filters Tab */}
      {tabValue === 1 && (
        <Card sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune sx={{ color: '#1976d2' }} />
                <Typography variant="h6">Content Quality Filters</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenFilterDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #5147ad)',
                  borderRadius: 2
                }}
              >
                Add Filter
              </Button>
            </Box>

            <Grid container spacing={3}>
              {qualityFilters.map((filter) => (
                <Grid item xs={12} md={6} key={filter.id}>
                  <Card sx={{ 
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderLeft: filter.isActive ? '4px solid #27ae60' : '4px solid #e0e0e0',
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FilterList sx={{ color: '#1976d2' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {filter.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={filter.isActive ? 'Active' : 'Inactive'}
                          color={filter.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {filter.criteria === 'minEngagement' && `Minimum ${filter.threshold}% engagement rate`}
                        {filter.criteria === 'minQuality' && `Minimum ${filter.threshold}% quality score`}
                        {filter.criteria === 'noSpam' && `${filter.threshold}% spam detection confidence`}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={filter.isActive}
                              onChange={() => {
                                setQualityFilters(prev => prev.map(f => 
                                  f.id === filter.id ? { ...f, isActive: !f.isActive } : f
                                ));
                              }}
                              color="primary"
                            />
                          }
                          label="Active"
                        />
                        <Box>
                          <IconButton size="small" sx={{ color: '#1976d2' }}>
                            <Edit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#e74c3c' }}
                            onClick={() => {
                              setQualityFilters(prev => prev.filter(f => f.id !== filter.id));
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Performance Analytics Tab */}
      {tabValue === 2 && (
        <Card sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Analytics sx={{ color: '#1976d2' }} />
              <Typography variant="h6">Source Performance Analytics</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <CardContent>