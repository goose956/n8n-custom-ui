import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
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
  Skeleton,
  Avatar,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  Queue,
  TrendingUp,
  Schedule,
  Edit,
  Delete,
  Add,
  Send,
  Visibility,
  Twitter,
  Analytics,
  CheckCircle,
  Warning,
  Error,
  AccessTime,
  Speed,
  Timeline,
  FilterList,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Star,
  AutoMode,
  Psychology,
  PlayArrow,
  Pause
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000' 
  : '';

interface QueuedTweet {
  id: string;
  content: string;
  scheduledTime: string;
  status: 'pending' | 'approved' | 'scheduled' | 'posted';
  source: 'ai-generated' | 'manual' | 'scraped-content';
  engagementPrediction: number;
  hashtags: string[];
  mediaUrl?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdAt: string;
  estimatedReach: number;
  confidenceScore: number;
}

interface QueueStats {
  totalTweets: number;
  pendingApproval: number;
  scheduledToday: number;
  avgEngagementPrediction: number;
  topPerformingCategory: string;
  dailyGoal: number;
  completionRate: number;
}

export function MembersTweetQueuePage() {
  const [loading, setLoading] = useState(true);
  const [tweets, setTweets] = useState<QueuedTweet[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState<QueuedTweet | null>(null);
  const [newTweetDialog, setNewTweetDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [autoMode, setAutoMode] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch queue stats
      const statsResponse = await fetch(`${API_BASE}/api/tweet-queue/stats`);
      const statsData = await statsResponse.json();
      
      // Fetch tweets
      const tweetsResponse = await fetch(`${API_BASE}/api/tweet-queue/tweets`);
      const tweetsData = await tweetsResponse.json();
      
      setStats(statsData);
      setTweets(tweetsData);
    } catch (error) {
      console.error('Error fetching tweet queue data:', error);
      // Mock data for demo
      setStats({
        totalTweets: 47,
        pendingApproval: 12,
        scheduledToday: 8,
        avgEngagementPrediction: 4.2,
        topPerformingCategory: 'AI & Technology',
        dailyGoal: 10,
        completionRate: 80
      });
      
      setTweets([
        {
          id: '1',
          content: '🚀 The future of AI automation is here! Our latest breakthrough in content analysis shows 300% improvement in tweet engagement prediction. #AI #Automation #TechInnovation',
          scheduledTime: '2024-01-15T09:00:00Z',
          status: 'pending',
          source: 'ai-generated',
          engagementPrediction: 8.5,
          hashtags: ['AI', 'Automation', 'TechInnovation'],
          priority: 'high',
          category: 'AI & Technology',
          createdAt: '2024-01-14T15:30:00Z',
          estimatedReach: 15000,
          confidenceScore: 92
        },
        {
          id: '2',
          content: 'Just discovered an incredible insight about social media automation: timing is everything! Our AI now predicts optimal posting windows with 85% accuracy. 📊✨',
          scheduledTime: '2024-01-15T14:30:00Z',
          status: 'approved',
          source: 'scraped-content',
          engagementPrediction: 6.8,
          hashtags: ['SocialMedia', 'Analytics', 'Growth'],
          priority: 'medium',
          category: 'Marketing',
          createdAt: '2024-01-14T16:15:00Z',
          estimatedReach: 8500,
          confidenceScore: 85
        },
        {
          id: '3',
          content: 'Breaking: Twitter automation saves content creators an average of 4 hours per day! Are you ready to join the automation revolution? 🤖💪',
          scheduledTime: '2024-01-15T18:00:00Z',
          status: 'scheduled',
          source: 'ai-generated',
          engagementPrediction: 7.2,
          hashtags: ['TwitterAutomation', 'Productivity', 'ContentCreator'],
          priority: 'high',
          category: 'Productivity',
          createdAt: '2024-01-14T14:20:00Z',
          estimatedReach: 12000,
          confidenceScore: 88
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tweetId: string, newStatus: string) => {
    try {
      await fetch(`${API_BASE}/api/tweet-queue/${tweetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      setTweets(prev => prev.map(tweet => 
        tweet.id === tweetId ? { ...tweet, status: newStatus as any } : tweet
      ));
    } catch (error) {
      console.error('Error updating tweet status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'scheduled': return 'primary';
      case 'posted': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const filteredTweets = tweets.filter(tweet => {
    if (filter === 'all') return true;
    return tweet.status === filter;
  });

  const tabCounts = {
    all: tweets.length,
    pending: tweets.filter(t => t.status === 'pending').length,
    approved: tweets.filter(t => t.status === 'approved').length,
    scheduled: tweets.filter(t => t.status === 'scheduled').length
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={500} height={24} sx={{ mt: 1 }} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Queue sx={{ fontSize: 32, mr: 2 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Tweet Queue Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Review, edit, and schedule your AI-generated tweets for optimal engagement
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={autoMode} 
                  onChange={(e) => setAutoMode(e.target.checked)}
                  sx={{ '& .MuiSwitch-thumb': { bgcolor: 'white' } }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoMode />
                  <Typography>Auto Mode</Typography>
                </Box>
              }
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setNewTweetDialog(true)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Add Custom Tweet
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: '4px solid #1976d2'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Queue sx={{ color: '#1976d2', mr: 2 }} />
                <Typography variant="h6">Total Tweets</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats?.totalTweets || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ArrowUpward sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                  +12% from yesterday
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: '4px solid #ff9800'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: '#ff9800', mr: 2 }} />
                <Typography variant="h6">Pending Approval</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats?.pendingApproval || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Require manual review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: '4px solid #4caf50'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ color: '#4caf50', mr: 2 }} />
                <Typography variant="h6">Scheduled Today</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats?.scheduledToday || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#666', mr: 1 }}>
                  Goal: {stats?.dailyGoal || 0}
                </Typography>
                <Chip 
                  size="small" 
                  label={`${stats?.completionRate || 0}%`} 
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: '4px solid #9c27b0'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: '#9c27b0', mr: 2 }} />
                <Typography variant="h6">Avg Engagement</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats?.avgEngagementPrediction || 0}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Predicted performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Management */}
      <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ color: '#1976d2', mr: 2 }} />
              <Typography variant="h6">Tweet Queue</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value)}
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Tweets</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
              <Button
                startIcon={<Refresh />}
                onClick={fetchData}
                variant="outlined"
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ px: 3 }}
          >
            <Tab 
              icon={<Queue />} 
              label={
                <Badge badgeContent={tabCounts.all} color="primary">
                  All
                </Badge>
              } 
            />
            <Tab 
              icon={<Warning />} 
              label={
                <Badge badgeContent={tabCounts.pending} color="warning">
                  Pending
                </Badge>
              } 
            />
            <Tab 
              icon={<CheckCircle />} 
              label={
                <Badge badgeContent={tabCounts.approved} color="info">
                  Approved
                </Badge>
              } 
            />
            <Tab 
              icon={<Schedule />} 
              label={
                <Badge badgeContent={tabCounts.scheduled} color="success">
                  Scheduled
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {filteredTweets.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Twitter sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, color: '#666' }}>
                No tweets in queue
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#999' }}>
                Your AI tweet generator hasn't created any content yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setNewTweetDialog(true)}
              >
                Add Custom Tweet
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tweet Content</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Scheduled Time</TableCell>
                    <TableCell>Engagement Prediction</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTweets.map((tweet, index) => (
                    <TableRow 
                      key={tweet.id}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}
                    >
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {tweet.content.substring(0, 100)}
                            {tweet.content.length > 100 && '...'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                            {tweet.hashtags.map((tag) => (
                              <Chip
                                key={tag}
                                label={`#${tag}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Estimated Reach">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Visibility sx={{ fontSize: 14, mr: 0.5, color: '#666' }} />
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {tweet.estimatedReach.toLocaleString()}
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Tooltip title="AI Confidence">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Psychology sx={{ fontSize: 14, mr: 0.5, color: '#666' }} />
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {tweet.confidenceScore}%
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tweet.status}
                          color={getStatusColor(tweet.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {tweet.source === 'ai-generated' && <AutoMode sx={{ mr: 1, fontSize: 16 }} />}
                          {tweet.source === 'manual' && <Edit sx={{ mr: 1, fontSize: 16 }} />}
                          {tweet.source === 'scraped-content' && <Analytics sx={{ mr: 1, fontSize: 16 }} />}
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {tweet.source.replace('-', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                          <Typography variant="body2">
                            {new Date(tweet.scheduledTime).toLocaleDateString()} at{' '}
                            {new Date(tweet.scheduledTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Speed sx={{ fontSize: 16, color: '#1976d2' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {tweet.engagementPrediction}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={tweet.engagementPrediction * 10}
                            sx={{ 
                              width: 60, 
                              height: 4, 
                              borderRadius: 2,
                              bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: tweet.engagementPrediction > 7 ? '#4caf50' : 
                                        tweet.engagementPrediction > 4 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getPriorityColor(tweet.priority),
                              mr: 1
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ 
                              textTransform: 'capitalize',
                              color: getPriorityColor(tweet.priority),
                              fontWeight: 600
                            }}
                          >
                            {tweet.priority}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Tweet">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedTweet(tweet);
                                setEditDialog(true);
                              }}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          
                          {tweet.status === 'pending' && (
                            <Tooltip title="Approve Tweet">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(tweet.id, 'approved')}
                                sx={{ color: '#4caf50' }}
                              >
                                <CheckCircle sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {tweet.status === 'approved' && (
                            <Tooltip title="Schedule Tweet">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(tweet.id, 'scheduled')}
                                sx={{ color: '#1976d2' }}
                              >
                                <Schedule sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Delete Tweet">
                            <IconButton
                              size="small"
                              sx={{ color: '#f44336' }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
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

      {/* Edit Tweet Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Edit sx={{ mr: 2 }} />
          Edit Tweet
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tweet Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={selectedTweet?.content || ''}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Scheduled Time"
                type="datetime-local"
                fullWidth
                variant="outlined"
                value={selectedTweet?.scheduledTime?.split('.')[0] || ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedTweet?.priority || 'medium'}
                  label="Priority"
                >
                  <MenuItem value="high">High Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="low">Low Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<CheckCircle />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Tweet Dialog */}
      <Dialog 
        open={newTweetDialog} 
        onClose={() => setNewTweetDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Add sx={{ mr: 2 }} />
          Add Custom Tweet
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Manually added tweets will be analyzed by our AI for optimal engagement prediction
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Tweet Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Write your tweet content here..."
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Scheduled Time"
                type="datetime-local"
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Priority</InputLabel>
                <Select
                  value="medium"
                  label="Priority"
                >
                  <MenuItem value="high">High Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="low">Low Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTweetDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Add />}>
            Add to Queue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}