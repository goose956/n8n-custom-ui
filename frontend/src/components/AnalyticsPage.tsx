'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
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
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Container,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';

interface AppAnalyticsData {
  app_id: number;
  app_name: string;
  app_slug: string;
  total_page_views: number;
  unique_visitors: number;
}

interface AnalyticsSummary {
  total_apps: number;
  total_page_views: number;
  total_unique_visitors: number;
  apps: AppAnalyticsData[];
}

interface AppDetailAnalytics {
  app_id: number;
  total_page_views: number;
  unique_visitors: number;
  page_stats: { [key: string]: number };
  views_by_date: { [key: string]: number };
  recent_views: any[];
}

interface Visitor {
  visitor_id: string;
  first_visit: string;
  last_visit: string;
  page_views: number;
  pages: string[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppAnalyticsData | null>(null);
  const [appDetail, setAppDetail] = useState<AppDetailAnalytics | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [detailTabIndex, setDetailTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/analytics/apps');
        const result = await response.json();
        if (result.success) {
          setAnalytics(result.data);
        }
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    fetchAnalytics();
    return () => clearInterval(interval);
  }, []);

  const handleAppClick = async (app: AppAnalyticsData) => {
    setSelectedApp(app);
    setDetailTabIndex(0);
    try {
      const [detailRes, visitorRes] = await Promise.all([
        fetch(`http://localhost:3000/api/analytics/app/${app.app_id}`),
        fetch(`http://localhost:3000/api/analytics/app/${app.app_id}/visitors`),
      ]);

      const detailData = await detailRes.json();
      const visitorData = await visitorRes.json();

      if (detailData.success) {
        setAppDetail(detailData.data);
      }
      if (visitorData.success) {
        setVisitors(visitorData.data);
      }
    } catch (err) {
      setError('Failed to load app details');
    }
  };

  const handleCloseDetail = () => {
    setSelectedApp(null);
    setAppDetail(null);
    setVisitors([]);
  };

  // Prepare data for charts
  const viewsByDateData = appDetail
    ? Object.entries(appDetail.views_by_date).map(([date, views]) => ({
        date: new Date(date).toLocaleDateString(),
        views,
      }))
    : [];

  const pageStatsData = appDetail
    ? Object.entries(appDetail.page_stats).map(([page, views]) => ({
        name: page,
        value: views,
      }))
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ color: '#1a1a2e', mb: 0.5 }}>
          Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#888', lineHeight: 1.7 }}>
          Track page views, visitors, and performance across all your apps.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      {analytics && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                    Total Apps
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {analytics.total_apps}
                  </Typography>
                </Box>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#eef0ff', color: '#667eea' }}>
                  <BarChartIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                    Page Views
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {analytics.total_page_views.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#fce4ec', color: '#e91e63' }}>
                  <VisibilityIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                    Unique Visitors
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {analytics.total_unique_visitors.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#e3f2fd', color: '#2196f3' }}>
                  <GroupIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                    Avg Views/App
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {analytics.total_apps > 0
                      ? Math.round(analytics.total_page_views / analytics.total_apps)
                      : 0}
                  </Typography>
                </Box>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#fff3e0', color: '#ff9800' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Apps Table */}
      <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.1rem' }}>
            App Performance
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>App Name</TableCell>
                <TableCell align="right">Page Views</TableCell>
                <TableCell align="right">Unique Visitors</TableCell>
                <TableCell align="right">Avg Views/Visitor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics?.apps.map((app) => (
                <TableRow
                  key={app.app_id}
                  onClick={() => handleAppClick(app)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: '#fafbfc' },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#eef0ff', color: '#667eea', fontSize: '0.85rem', fontWeight: 700 }}>
                        {app.app_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>{app.app_name}</Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>{app.app_slug}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
                      {app.total_page_views.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#764ba2' }}>
                      {app.unique_visitors.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                      {app.unique_visitors > 0
                        ? (app.total_page_views / app.unique_visitors).toFixed(1)
                        : 0}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* App Detail Dialog */}
      <Dialog open={!!selectedApp} onClose={handleCloseDetail} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              {selectedApp?.app_name}
            </Typography>
            <Chip label={selectedApp?.app_slug} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea', mt: 0.5 }} />
          </Box>
          <IconButton size="small" onClick={handleCloseDetail} sx={{ color: '#888' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Tabs
              value={detailTabIndex}
              onChange={(_e, newValue) => setDetailTabIndex(newValue)}
              sx={{
                mb: 3,
                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none', color: '#888' },
                '& .Mui-selected': { color: '#667eea !important' },
                '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 3, borderRadius: '3px 3px 0 0' },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Page Stats" />
              <Tab label="Visitors" />
            </Tabs>

            {/* Overview Tab */}
            {detailTabIndex === 0 && appDetail && (
              <Box>
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <Typography variant="body2" sx={{ color: '#999', mb: 0.5, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Page Views
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#667eea' }}>
                        {appDetail.total_page_views.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <Typography variant="body2" sx={{ color: '#999', mb: 0.5, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Unique Visitors
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#764ba2' }}>
                        {appDetail.unique_visitors.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1a1a2e' }}>
                  Page Views Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsByDateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#667eea" strokeWidth={2.5} dot={{ fill: '#667eea', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Page Stats Tab */}
            {detailTabIndex === 1 && appDetail && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1a1a2e' }}>
                  Page Views by Page
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pageStatsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name: pageName, value: pageValue }: any) => `${pageName}: ${pageValue}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pageStatsData.map((_entry: any, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Page</TableCell>
                              <TableCell align="right">Views</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pageStatsData.map((page) => (
                              <TableRow key={page.name} sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>{page.name}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>{page.value}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Visitors Tab */}
            {detailTabIndex === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    Recent Visitors
                  </Typography>
                  <Chip label={`${visitors.length} total`} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea' }} />
                </Box>
                <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Visitor ID</TableCell>
                          <TableCell align="right">Page Views</TableCell>
                          <TableCell>Pages Visited</TableCell>
                          <TableCell>Last Visit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visitors.slice(0, 20).map((visitor) => (
                          <TableRow key={visitor.visitor_id} sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
                                {visitor.visitor_id.slice(0, 12)}...
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>{visitor.page_views}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#888' }}>{visitor.pages.join(', ')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#aaa' }}>
                                {new Date(visitor.last_visit).toLocaleDateString()} ({new Date(visitor.last_visit).toLocaleTimeString()})
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
