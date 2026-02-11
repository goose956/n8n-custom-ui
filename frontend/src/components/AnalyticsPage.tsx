'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 Analytics Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      {analytics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="inhereit" sx={{ fontSize: 12, opacity: 0.8 }}>
                      Total Apps
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {analytics.total_apps}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="inherit" sx={{ fontSize: 12, opacity: 0.8 }}>
                      Total Page Views
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {analytics.total_page_views.toLocaleString()}
                    </Typography>
                  </Box>
                  <VisibilityIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="inherit" sx={{ fontSize: 12, opacity: 0.8 }}>
                      Unique Visitors
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {analytics.total_unique_visitors.toLocaleString()}
                    </Typography>
                  </Box>
                  <GroupIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="inherit" sx={{ fontSize: 12, opacity: 0.8 }}>
                      Avg Views/App
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {analytics.total_apps > 0
                        ? Math.round(analytics.total_page_views / analytics.total_apps)
                        : 0}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Apps Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📱 Apps Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>App Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Page Views
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Unique Visitors
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Avg Views/Visitor
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics?.apps.map((app) => (
                  <TableRow
                    key={app.app_id}
                    onClick={() => handleAppClick(app)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{app.app_name}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>{app.app_slug}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {app.total_page_views.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                        {app.unique_visitors.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold' }}>
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
        </CardContent>
      </Card>

      {/* App Detail Dialog */}
      <Dialog open={!!selectedApp} onClose={handleCloseDetail} maxWidth="lg" fullWidth>
        <DialogTitle>
          📈 {selectedApp?.app_name} - Analytics
          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
            {selectedApp?.app_slug}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs
              value={detailTabIndex}
              onChange={(_e, newValue) => setDetailTabIndex(newValue)}
              sx={{ mb: 2, borderBottom: '1px solid #eee' }}
            >
              <Tab label="Overview" />
              <Tab label="Page Stats" />
              <Tab label="Visitors" />
            </Tabs>

            {/* Overview Tab */}
            {detailTabIndex === 0 && appDetail && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Total Page Views
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {appDetail.total_page_views.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Unique Visitors
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                        {appDetail.unique_visitors.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Page Views Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsByDateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#667eea" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Page Stats Tab */}
            {detailTabIndex === 1 && appDetail && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Page Views by Page
                </Typography>
                <Grid container spacing={2}>
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
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Page</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              Views
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageStatsData.map((page) => (
                            <TableRow key={page.name}>
                              <TableCell>{page.name}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {page.value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Visitors Tab */}
            {detailTabIndex === 2 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Recent Visitors ({visitors.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Visitor ID</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Page Views
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Pages Visited</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Last Visit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visitors.slice(0, 20).map((visitor) => (
                        <TableRow key={visitor.visitor_id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {visitor.visitor_id.slice(0, 12)}...
                          </TableCell>
                          <TableCell align="right">{visitor.page_views}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{visitor.pages.join(', ')}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>
                            {new Date(visitor.last_visit).toLocaleDateString()} (
                            {new Date(visitor.last_visit).toLocaleTimeString()})
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
