import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Skeleton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Twitter,
  Reply,
  GetApp,
  Visibility,
  People,
  Timeline,
  BarChart,
  PieChart,
  Speed,
  Star,
  CheckCircle,
  Warning,
  Refresh,
  FilterList,
  ArrowUpward,
  ArrowDownward,
  CalendarToday,
  MonetizationOn,
  ContentPaste,
  AutoAwesome
} from '@mui/icons-material';

// Inline interfaces
interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  date: string;
  tweets: number;
  engagement: number;
  replies: number;
  conversions: number;
}

interface ContentCategory {
  category: string;
  tweets: number;
  avgEngagement: number;
  conversions: number;
  roi: number;
}

interface TopPerformingTweet {
  id: string;
  content: string;
  engagementRate: number;
  replies: number;
  conversions: number;
  category: string;
  date: string;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [contentCategories, setContentCategories] = useState<ContentCategory[]>([]);
  const [topTweets, setTopTweets] = useState<TopPerformingTweet[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics([
        {
          label: 'Total Tweets Posted',
          value: '1,247',
          change: 12.5,
          icon: <Twitter sx={{ fontSize: 40 }} />,
          color: '#1976d2'
        },
        {
          label: 'Avg Engagement Rate',
          value: '8.7%',
          change: 2.3,
          icon: <TrendingUp sx={{ fontSize: 40 }} />,
          color: '#27ae60'
        },
        {
          label: 'Reply Conversions',
          value: '342',
          change: -1.2,
          icon: <Reply sx={{ fontSize: 40 }} />,
          color: '#f39c12'
        },
        {
          label: 'Ebook Downloads',
          value: '589',
          change: 18.9,
          icon: <GetApp sx={{ fontSize: 40 }} />,
          color: '#9b59b6'
        },
        {
          label: 'Follower Growth',
          value: '2,856',
          change: 5.7,
          icon: <People sx={{ fontSize: 40 }} />,
          color: '#00bcd4'
        },
        {
          label: 'Automation ROI',
          value: '340%',
          change: 22.1,
          icon: <MonetizationOn sx={{ fontSize: 40 }} />,
          color: '#e74c3c'
        }
      ]);

      setChartData([
        { date: '2024-01-01', tweets: 45, engagement: 8.2, replies: 12, conversions: 8 },
        { date: '2024-01-02', tweets: 52, engagement: 9.1, replies: 15, conversions: 11 },
        { date: '2024-01-03', tweets: 38, engagement: 7.5, replies: 9, conversions: 6 },
        { date: '2024-01-04', tweets: 41, engagement: 8.8, replies: 13, conversions: 9 },
        { date: '2024-01-05', tweets: 47, engagement: 9.3, replies: 18, conversions: 14 }
      ]);

      setContentCategories([
        { category: 'Tech News', tweets: 234, avgEngagement: 9.2, conversions: 67, roi: 285 },
        { category: 'Industry Insights', tweets: 189, avgEngagement: 8.7, conversions: 52, roi: 320 },
        { category: 'Product Updates', tweets: 156, avgEngagement: 7.9, conversions: 89, roi: 410 },
        { category: 'Educational', tweets: 167, avgEngagement: 8.4, conversions: 43, roi: 290 },
        { category: 'Trending Topics', tweets: 201, avgEngagement: 10.1, conversions: 78, roi: 380 }
      ]);

      setTopTweets([
        {
          id: '1',
          content: 'Just discovered this game-changing automation tool that saves me 5 hours daily! 🚀 #ProductivityHack',
          engagementRate: 15.8,
          replies: 43,
          conversions: 12,
          category: 'Tech News',
          date: '2024-01-05'
        },
        {
          id: '2',
          content: 'The future of content creation is here: AI + Human creativity = Unstoppable results 💡',
          engagementRate: 14.2,
          replies: 38,
          conversions: 9,
          category: 'Industry Insights',
          date: '2024-01-04'
        },
        {
          id: '3',
          content: 'Breaking: New study shows automated content performs 340% better when personalized 📊',
          engagementRate: 13.7,
          replies: 35,
          conversions: 11,
          category: 'Trending Topics',
          date: '2024-01-03'
        }
      ]);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ metric }: { metric: AnalyticsMetric }) => (
    <Card sx={{
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderRadius: 3,
      transition: '0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: metric.color, 
            width: 56, 
            height: 56,
            mr: 2
          }}>
            {metric.icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {metric.label}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {metric.value}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {metric.change > 0 ? (
            <ArrowUpward sx={{ color: '#27ae60', mr: 1, fontSize: 20 }} />
          ) : (
            <ArrowDownward sx={{ color: '#e74c3c', mr: 1, fontSize: 20 }} />
          )}
          <Typography variant="body2" sx={{
            color: metric.change > 0 ? '#27ae60' : '#e74c3c',
            fontWeight: 'medium'
          }}>
            {Math.abs(metric.change)}% vs last period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        {/* Header Skeleton */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 4
        }}>
          <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
          <Skeleton variant="text" width={500} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)', mt: 1 }} />
        </Box>

        {/* Stats Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Skeleton variant="circular" width={56} height={56} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={32} />
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Content Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        color: 'white',
        p: 4,
        borderRadius: 3,
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ShowChart sx={{ mr: 2, fontSize: 32 }} />
            Twitter Automation Analytics
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Track your automated tweet performance, engagement metrics, and ROI insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchAnalyticsData}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Content Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BarChart sx={{ mr: 2 }} />
              Tweet Performance Trends
            </Typography>
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              border: '2px dashed #dee2e6'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 48, color: '#6c757d', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Interactive Chart Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tweet engagement, replies, and conversion trends over time
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            height: 'fit-content'
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Speed sx={{ mr: 2 }} />
              Performance Highlights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Best Day</Typography>
                <Chip label="Yesterday" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Top Category</Typography>
                <Chip label="Tech News" color="primary" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
                <Typography variant="body2" fontWeight="medium">2.4 mins</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Automation Efficiency
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={87} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  87% of tweets automated successfully
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Content Categories Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <PieChart sx={{ mr: 2 }} />
                Content Category Performance
              </Typography>
              <Button startIcon={<FilterList />} variant="outlined" size="small">
                Filter Categories
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <ContentPaste sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Category
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      <Twitter sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Tweets Posted
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Avg Engagement
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      <GetApp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Conversions
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      <MonetizationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                      ROI %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contentCategories.map((category, index) => (
                    <TableRow key={index} sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: '#1976d2', 
                            width: 32, 
                            height: 32, 
                            mr: 2,
                            fontSize: 14
                          }}>
                            {category.category.charAt(0)}
                          </Avatar>
                          <Typography fontWeight="medium">
                            {category.category}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{category.tweets}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${category.avgEngagement}%`}
                          color={category.avgEngagement > 8.5 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{category.conversions}</TableCell>
                      <TableCell align="center">
                        <Typography sx={{ 
                          color: category.roi > 300 ? '#27ae60' : '#f39c12',
                          fontWeight: 'bold'
                        }}>
                          {category.roi}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performing Tweets */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Star sx={{ mr: 2 }} />
              Top Performing Automated Tweets
            </Typography>
            {topTweets.map((tweet, index) => (
              <Box key={tweet.id} sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                mb: 2,
                bgcolor: index === 0 ? '#fff3e0' : '#ffffff',
                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="body1" sx={{ flex: 1, mr: 2 }}>
                    {tweet.content}
                  </Typography>
                  {index === 0 && (
                    <Chip 
                      label="Top Performer" 
                      color="warning" 
                      size="small"
                      icon={<Star />}
                    />
                  )}
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1, fontSize: 18, color: '#27ae60' }} />
                      <Typography variant="body2" color="text.secondary">
                        {tweet.engagementRate}% engagement
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Reply sx={{ mr: 1, fontSize: 18, color: '#1976d2' }} />
                      <Typography variant="body2" color="text.secondary">
                        {tweet.replies} replies
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ mr: 1, fontSize: 18, color: '#9b59b6' }} />
                      <Typography variant="body2" color="text.secondary">
                        {tweet.conversions} conversions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Chip 
                      label={tweet.category}
                      size="small"
                      sx={{ bgcolor: '#e3f2fd' }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}