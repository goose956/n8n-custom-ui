===FILE: frontend/src/components/members/twitter-automation-app/analytics.tsx===
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Divider,
  Avatar,
  Button,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Twitter,
  AutoAwesome,
  Reply,
  Person,
  Speed,
  Schedule,
  AttachMoney,
  BarChart,
  Timeline,
  ArrowUpward,
  ArrowDownward,
  Visibility,
  ThumbUp,
  Repeat,
  FilterList,
  DateRange,
  Download
} from '@mui/icons-material';

// Inline types
interface EngagementMetrics {
  date: string;
  tweets: number;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagementRate: number;
}

interface FollowerGrowth {
  date: string;
  followers: number;
  growth: number;
  growthFromAutomation: number;
}

interface OptInFunnel {
  autoRepliesSent: number;
  linksClicked: number;
  optInsCompleted: number;
  conversionRate: number;
}

interface ScrapingEfficiency {
  totalJobs: number;
  successfulJobs: number;
  averageDuration: number;
  contentQualityScore: number;
  tweetsGenerated: number;
}

interface ResponseAnalytics {
  averageResponseTime: number;
  totalResponsesSent: number;
  responseSuccessRate: number;
  blockedAccounts: number;
}

interface ROIMetrics {
  totalCost: number;
  leadValue: number;
  roi: number;
  costPerLead: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

export function MembersAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('30d');
  const [engagementData, setEngagementData] = useState<EngagementMetrics[]>([]);
  const [followerData, setFollowerData] = useState<FollowerGrowth[]>([]);
  const [optInFunnel, setOptInFunnel] = useState<OptInFunnel | null>(null);
  const [scrapingEfficiency, setScrapingEfficiency] = useState<ScrapingEfficiency | null>(null);
  const [responseAnalytics, setResponseAnalytics] = useState<ResponseAnalytics | null>(null);
  const [roiMetrics, setROIMetrics] = useState<ROIMetrics | null>(null);

  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      
      // Mock API calls - replace with real endpoints
      const mockEngagement: EngagementMetrics[] = [
        { date: '2024-01-15', tweets: 12, likes: 245, retweets: 67, replies: 34, impressions: 5400, engagementRate: 6.4 },
        { date: '2024-01-16', tweets: 15, likes: 312, retweets: 89, replies: 45, impressions: 6800, engagementRate: 6.6 },
        { date: '2024-01-17', tweets: 10, likes: 198, retweets: 52, replies: 28, impressions: 4200, engagementRate: 6.6 },
        { date: '2024-01-18', tweets: 13, likes: 267, retweets: 73, replies: 38, impressions: 5900, engagementRate: 6.4 }
      ];

      const mockFollower: FollowerGrowth[] = [
        { date: '2024-01-15', followers: 2350, growth: 23, growthFromAutomation: 18 },
        { date: '2024-01-16', followers: 2378, growth: 28, growthFromAutomation: 22 },
        { date: '2024-01-17', followers: 2401, growth: 23, growthFromAutomation: 16 },
        { date: '2024-01-18', followers: 2429, growth: 28, growthFromAutomation: 21 }
      ];

      setEngagementData(mockEngagement);
      setFollowerData(mockFollower);
      setOptInFunnel({
        autoRepliesSent: 145,
        linksClicked: 67,
        optInsCompleted: 23,
        conversionRate: 15.9
      });
      setScrapingEfficiency({
        totalJobs: 28,
        successfulJobs: 26,
        averageDuration: 4.2,
        contentQualityScore: 87,
        tweetsGenerated: 342
      });
      setResponseAnalytics({
        averageResponseTime: 1.3,
        totalResponsesSent: 89,
        responseSuccessRate: 94.4,
        blockedAccounts: 3
      });
      setROIMetrics({
        totalCost: 99,
        leadValue: 1840,
        roi: 1757,
        costPerLead: 4.30
      });

      setLoading(false);
    };

    fetchAnalytics();
  }, [timeframe]);

  const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = '#1976d2' }: any) => (
    <Card sx={{
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.06)',
      transition: '0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Icon sx={{ color, fontSize: 32 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend === 'up' ? (
              <ArrowUpward sx={{ color: '#27ae60', fontSize: 16 }} />
            ) : (
              <ArrowDownward sx={{ color: '#e74c3c', fontSize: 16 }} />
            )}
            <Typography variant="caption" sx={{ color: trend === 'up' ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
              {trendValue}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5 }}>
          {loading ? <Skeleton width={80} /> : value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {loading ? <Skeleton width={120} /> : title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        color: 'white',
        p: 4,
        borderRadius: 3,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Assessment sx={{ fontSize: 40 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Twitter Automation Analytics
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
          Comprehensive insights into your automated Twitter activities, engagement metrics, and ROI performance.
        </Typography>
      </Box>

      {/* Time Range Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <DateRange sx={{ color: '#1976d2' }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button
          startIcon={<Download />}
          variant="outlined"
          sx={{ color: '#1976d2', borderColor: '#1976d2' }}
        >
          Export Report
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tweet Engagement"
            value="6.5%"
            trend="up"
            trendValue={12}
            icon={ThumbUp}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Follower Growth (Auto)"
            value="+77"
            trend="up"
            trendValue={8}
            icon={Person}
            color="#27ae60"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Opt-in Conversion Rate"
            value="15.9%"
            trend="up"
            trendValue={5}
            icon={AutoAwesome}
            color="#f39c12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Automation ROI"
            value="1,757%"
            trend="up"
            trendValue={23}
            icon={AttachMoney}
            color="#9b59b6"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Tabs */}
      <Paper sx={{
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ px: 2 }}
          >
            <Tab icon={<BarChart />} label="Tweet Engagement" />
            <Tab icon={<TrendingUp />} label="Follower Growth" />
            <Tab icon={<AutoAwesome />} label="Opt-in Funnel" />
            <Tab icon={<Speed />} label="Scraping Efficiency" />
            <Tab icon={<Reply />} label="Response Analytics" />
            <Tab icon={<Timeline />} label="ROI Tracking" />
          </Tabs>
        </Box>

        {/* Tweet Engagement Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <BarChart sx={{ color: '#1976d2' }} />
              <Typography variant="h6">Tweet Performance Metrics</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <Visibility sx={{ fontSize: 16, mr: 1 }} />
                    Average Impressions
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {loading ? <Skeleton width={60} /> : '5,575'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderLeft: '4px solid #27ae60' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <ThumbUp sx={{ fontSize: 16, mr: 1 }} />
                    Total Likes
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {loading ? <Skeleton width={60} /> : '1,022'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderLeft: '4px solid #f39c12' }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <Repeat sx={{ fontSize: 16, mr: 1 }} />
                    Total Retweets
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {loading ? <Skeleton width={60} /> : '281'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Tweets Posted</TableCell>
                    <TableCell>Impressions</TableCell>
                    <TableCell>Engagement Rate</TableCell>
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from(new Array(4)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    engagementData.map((row, index) => (
                      <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            icon={<Twitter />}
                            label={`${row.tweets} tweets`}
                            size="small"
                            sx={{ bgcolor: '#e3f2fd' }}
                          />
                        </TableCell>
                        <TableCell>{row.impressions.toLocaleString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {row.engagementRate}%
                            <LinearProgress
                              variant="determinate"
                              value={row.engagementRate}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.engagementRate >= 6.5 ? 'Excellent' : row.engagementRate >= 5 ? 'Good' : 'Average'}
                            color={row.engagementRate >= 6.5 ? 'success' : row.engagementRate >= 5 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Follower Growth Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUp sx={{ color: '#27ae60' }} />
              <Typography variant="h6">Automated Follower Acquisition</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    <Person sx={{ mr: 1 }} />
                    Growth Attribution
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>From Automation</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: '#e0e0e0' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>75% (77 followers)</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666' }}>Organic Growth</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={25}
                      sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: '#e0e0e0' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>25% (25 followers)</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    <Schedule sx={{ mr: 1 }} />
                    Growth Velocity
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#27ae60', fontWeight: 700, mb: 1 }}>
                    +25.5
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    Average daily follower growth from automation
                  </Typography>
                  <Chip
                    icon={<ArrowUpward />}
                    label="↑ 8% vs last period"
                    color="success"
                    size="small"
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Opt-in Funnel Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AutoAwesome sx={{ color: '#f39c12' }} />
              <Typography variant="h6">Auto-Response to Opt-in Conversion</Typography>
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Reply sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {optInFunnel?.autoRepliesSent}
                    </Typography>
                    <Typography variant="body2">Auto-Replies Sent</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Visibility sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {optInFunnel?.linksClicked}
                    </Typography>
                    <Typography variant="body2">Links Clicked</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <AutoAwesome sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {optInFunnel?.optInsCompleted}
                    </Typography>
                    <Typography variant="body2">Opt-ins Completed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Assessment sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {optInFunnel?.conversionRate}%
                    </Typography>
                    <Typography variant="body2">Conversion Rate</Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Conversion Funnel Analysis</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2">Reply → Click: 46.2%</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2">Click → Opt-in: 34.3%</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2">Overall: 15.9%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={15.9}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Paper>
          </Box>
        </TabPanel>

        {/* Scraping Efficiency Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Speed sx={{ color: '#00bcd4' }} />
              <Typography variant="h6">Content Scraping Performance</Typography>
            </Box>

            {loading ? (
              <Grid container spacing={3}>
                {Array.from(new Array(4)).map((_, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Skeleton variant="rectangular" height={120} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, borderLeft: '4px solid #00bcd4' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <FilterList sx={{ mr: 1 }} />
                      Job Success Rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#00bcd4', mb: 1 }}>
                      {((scrapingEfficiency?.successfulJobs! / scrapingEfficiency?.totalJobs!) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {scrapingEfficiency?.successfulJobs} of {scrapingEfficiency?.totalJobs} jobs completed successfully
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, borderLeft: '4px solid #9c27b0' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <Schedule sx={{ mr: 1 }} />
                      Average Duration
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0', mb: 1 }}>
                      {scrapingEfficiency?.averageDuration} min
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Per scraping job completion time
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <Assessment sx={{ mr: 1 }} />
                      Content Quality Score
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                      {scrapingEfficiency?.contentQualityScore}/100
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      AI-evaluated content relevance rating
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <Twitter sx={{ mr: 1 }} />
                      Tweets Generated
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                      {scrapingEfficiency?.tweetsGenerated}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Total tweets created from scraped content
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Response Analytics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Reply sx={{ color: '#e91e63' }} />
              <Typography variant="h6">Auto-Response Performance</Typography>
            </Box>

            {loading ? (
              <Grid container spacing={3}>
                {Array.from(new Array(3)).map((_, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Skeleton variant="rectangular" height={150} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Schedule sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {responseAnalytics?.averageResponseTime} min
                    </Typography>
                    <Typography variant="body2">Average Response Time</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Reply sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {responseAnalytics?.totalResponsesSent}
                    </Typography>
                    <Typography variant="body2">Total Responses Sent</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <Assessment sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {responseAnalytics?.responseSuccessRate}%
                    </Typography>
                    <Typography variant="body2">Success Rate</Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Response Quality Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Successful