===FILE: frontend/src/components/members/twitter-automation-/content-scraper.tsx===
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar,
  Skeleton,
  Divider,
  Tooltip,
  Badge,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ContentPaste,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Settings,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  Link,
  Schedule,
  Speed,
  Timeline,
  Warning,
  Error,
  Visibility,
  VisibilityOff,
  Star,
  Language,
  Rss,
  Article,
  Source,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material';

interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'blog' | 'news' | 'reddit' | 'medium';
  status: 'active' | 'paused' | 'error';
  lastScraped: string;
  articlesCount: number;
  successRate: number;
  enabled: boolean;
}

interface ScrapedArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  scrapedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  category: string;
  wordCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  quality: number;
  keywords: string[];
}

interface ScrapingStats {
  totalSources: number;
  activeSources: number;
  articlesScrapedToday: number;
  articlesApproved: number;
  avgQualityScore: number;
  successRate: number;
}

interface ScrapingFilters {
  keywords: string[];
  excludeKeywords: string[];
  minWordCount: number;
  maxWordCount: number;
  categories: string[];
  qualityThreshold: number;
  sentimentFilter: 'all' | 'positive' | 'neutral' | 'negative';
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersContentScraperPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ScrapingStats>({
    totalSources: 0,
    activeSources: 0,
    articlesScrapedToday: 0,
    articlesApproved: 0,
    avgQualityScore: 0,
    successRate: 0
  });
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [articles, setArticles] = useState<ScrapedArticle[]>([]);
  const [filters, setFilters] = useState<ScrapingFilters>({
    keywords: [],
    excludeKeywords: [],
    minWordCount: 100,
    maxWordCount: 2000,
    categories: [],
    qualityThreshold: 7,
    sentimentFilter: 'all'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ContentSource | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [scraping, setScraping] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, sourcesRes, articlesRes, filtersRes] = await Promise.all([
        fetch(`${API_BASE}/api/content-scraper/stats`),
        fetch(`${API_BASE}/api/content-scraper/sources`),
        fetch(`${API_BASE}/api/content-scraper/articles`),
        fetch(`${API_BASE}/api/content-scraper/filters`)
      ]);

      const [statsData, sourcesData, articlesData, filtersData] = await Promise.all([
        statsRes.json(),
        sourcesRes.json(),
        articlesRes.json(),
        filtersRes.json()
      ]);

      setStats(statsData);
      setSources(sourcesData);
      setArticles(articlesData);
      setFilters(filtersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for demonstration
      setStats({
        totalSources: 12,
        activeSources: 8,
        articlesScrapedToday: 47,
        articlesApproved: 28,
        avgQualityScore: 8.2,
        successRate: 94.5
      });
      setSources([
        {
          id: '1',
          name: 'TechCrunch',
          url: 'https://techcrunch.com/feed',
          type: 'rss',
          status: 'active',
          lastScraped: '2024-01-15T10:30:00Z',
          articlesCount: 156,
          successRate: 98.2,
          enabled: true
        },
        {
          id: '2',
          name: 'Hacker News',
          url: 'https://news.ycombinator.com',
          type: 'news',
          status: 'active',
          lastScraped: '2024-01-15T10:25:00Z',
          articlesCount: 89,
          successRate: 92.1,
          enabled: true
        },
        {
          id: '3',
          name: 'Medium AI Blog',
          url: 'https://medium.com/topic/artificial-intelligence',
          type: 'medium',
          status: 'paused',
          lastScraped: '2024-01-14T15:45:00Z',
          articlesCount: 234,
          successRate: 85.7,
          enabled: false
        }
      ]);
      setArticles([
        {
          id: '1',
          title: 'The Future of AI in Social Media Marketing',
          url: 'https://techcrunch.com/ai-social-media-marketing',
          source: 'TechCrunch',
          scrapedAt: '2024-01-15T09:15:00Z',
          status: 'approved',
          category: 'AI',
          wordCount: 1250,
          sentiment: 'positive',
          quality: 8.7,
          keywords: ['AI', 'social media', 'marketing', 'automation']
        },
        {
          id: '2',
          title: 'Twitter API Changes Impact on Automation Tools',
          url: 'https://hackernews.com/twitter-api-automation',
          source: 'Hacker News',
          scrapedAt: '2024-01-15T08:30:00Z',
          status: 'pending',
          category: 'Twitter',
          wordCount: 890,
          sentiment: 'neutral',
          quality: 7.3,
          keywords: ['Twitter', 'API', 'automation', 'changes']
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartScraping = async () => {
    setScraping(true);
    try {
      await fetch(`${API_BASE}/api/content-scraper/scrape`, { method: 'POST' });
      setSnackbar({ open: true, message: 'Content scraping started successfully', severity: 'success' });
      setTimeout(() => {
        fetchData();
        setScraping(false);
      }, 3000);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to start scraping', severity: 'error' });
      setScraping(false);
    }
  };

  const handleApproveArticle = async (articleId: string) => {
    try {
      await fetch(`${API_BASE}/api/content-scraper/articles/${articleId}/approve`, { method: 'PUT' });
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, status: 'approved' as const } : article
      ));
      setSnackbar({ open: true, message: 'Article approved for tweet generation', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to approve article', severity: 'error' });
    }
  };

  const handleRejectArticle = async (articleId: string) => {
    try {
      await fetch(`${API_BASE}/api/content-scraper/articles/${articleId}/reject`, { method: 'PUT' });
      setArticles(prev => prev.map(article => 
        article.id === articleId ? { ...article, status: 'rejected' as const } : article
      ));
      setSnackbar({ open: true, message: 'Article rejected', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to reject article', severity: 'error' });
    }
  };

  const handleToggleSource = async (sourceId: string, enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/api/content-scraper/sources/${sourceId}/toggle`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      setSources(prev => prev.map(source => 
        source.id === sourceId ? { ...source, enabled, status: enabled ? 'active' : 'paused' } : source
      ));
      setSnackbar({ open: true, message: `Source ${enabled ? 'enabled' : 'disabled'}`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update source', severity: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': return 'success';
      case 'paused': case 'pending': return 'warning';
      case 'error': case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'neutral': return 'default';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        color: 'white',
        padding: 4,
        borderRadius: 3,
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ContentPaste sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h3" fontWeight="bold">
                Content Scraper
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Monitor and manage your Twitter content sources
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartScraping}
              disabled={scraping}
              startIcon={scraping ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <PlayArrow />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)'
              }}
            >
              {scraping ? 'Scraping...' : 'Start Scraping'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setFiltersDialogOpen(true)}
              startIcon={<FilterList />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { borderColor: 'rgba(255,255,255,0.8)' }
              }}
            >
              Filters
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #1976d2',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Source sx={{ fontSize: 16 }} />
                    Total Sources
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#1976d2">
                    {stats.totalSources}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
                  <Source sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #27ae60',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow sx={{ fontSize: 16 }} />
                    Active Sources
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#27ae60">
                    {stats.activeSources}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#27ae60', width: 56, height: 56 }}>
                  <CheckCircle sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #f39c12',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Article sx={{ fontSize: 16 }} />
                    Scraped Today
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#f39c12" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stats.articlesScrapedToday}
                    <ArrowUpward sx={{ fontSize: 20, color: '#27ae60' }} />
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f39c12', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #9b59b6',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    Approved
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#9b59b6">
                    {stats.articlesApproved}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#9b59b6', width: 56, height: 56 }}>
                  <Star sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #00bcd4',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Speed sx={{ fontSize: 16 }} />
                    Avg Quality
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#00bcd4">
                    {stats.avgQualityScore}/10
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#00bcd4', width: 56, height: 56 }}>
                  <Timeline sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3,
            borderLeft: '4px solid #e74c3c',
            transition: '0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    Success Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#e74c3c">
                    {stats.successRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e74c3c', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              label="Content Sources" 
              icon={<Source />} 
              iconPosition="start" 
              sx={{ textTransform: 'none', fontWeight: 600 }} 
            />
            <Tab 
              label="Scraped Articles" 
              icon={<Article />} 
              iconPosition="start" 
              sx={{ textTransform: 'none', fontWeight: 600 }} 
            />
            <Tab 
              label="Quality Control" 
              icon={<CheckCircle />} 
              iconPosition="start" 
              sx={{ textTransform: 'none', fontWeight: 600 }} 
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Source />
                  Twitter Content Sources
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setSourceDialogOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Source
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell><Typography fontWeight="bold">Source</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Type</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Articles</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Success Rate</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Last Scraped</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sources.map((source, index) => (
                      <TableRow 
                        key={source.id}
                        sx={{ 
                          bgcolor: index % 2 === 0 ? 'inherit' : '#fafafa',
                          '&:hover': { bgcolor: '#f0f0f0' }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                              <Language sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                              <Typography fontWeight="bold">{source.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {source.url}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={source.type.toUpperCase()} 
                            size="small"
                            icon={source.type === 'rss' ? <Rss /> : <Language />}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={source.status}
                            size="small"
                            color={getStatusColor(source.status)}
                            icon={source.status === 'active' ? <PlayArrow /> : <Pause />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">{source.articlesCount}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{source.successRate}%</Typography>
                            {source.successRate >= 90 ? (
                              <CheckCircle sx={{ fontSize: 16, color: '#27ae60' }} />
                            ) : source.successRate >= 70 ? (
                              <Warning sx={{ fontSize: 16, color: '#f39c12' }} />
                            ) : (
                              <Error sx={{ fontSize: 16, color: '#e74c3c' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(source.lastScraped).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={source.enabled}
                                  onChange={(e) => handleToggleSource(source.id, e.target.checked)}
                                  size="small"
                                />
                              }
                              label=""
                              sx={{ m: 0 }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => {setSelectedSource(source); setSourceDialogOpen(true);}}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Article />
                  Recently Scraped Articles
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<Search />} size="small">
                    Search
                  </Button>
                  <Button variant="outlined" startIcon={<FilterList />} size="small">
                    Filter
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {articles.map((article) => (
                  <Grid item xs={12} md={6} lg={4} key={article.id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      borderRadius: 3,
                      transition: '0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip 
                            label={article.status}
                            size="small"
                            color={getStatusColor(article.status)}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`${article.quality}/10`}
                              size="small"
                              icon={<Star />}
                              color={article.quality >= 8 ? 'success' : article.quality >= 6 ? 'warning' : 'error'}
                            />
                          </Box>
                        </Box>

                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3 }}>
                          {article.title}
                        </Typography>

                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {article.source} • {article.wordCount} words
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Chip 
                            label={article.sentiment}
                            size="small"
                            color={getSentimentColor(article.sentiment)}
                          />
                          <Chip label={article.category} size="small" variant="outlined" />
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {article.keywords.slice(0, 3).map((keyword, index) => (
                            <Chip 
                              key={index}
                              label={keyword}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>