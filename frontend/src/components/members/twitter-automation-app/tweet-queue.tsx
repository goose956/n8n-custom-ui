import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Skeleton,
  Avatar,
  Badge,
  LinearProgress,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  QueueMusic,
  TrendingUp,
  Schedule,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  FilterList,
  MoreVert,
  ThumbUp,
  Repeat,
  Reply,
  Visibility,
  Speed,
  Timeline,
  Star,
  ArrowUpward,
  ArrowDownward,
  Twitter,
  SmartToy,
  Analytics,
  ContentCopy,
  Send,
  AccessTime,
  PredictiveText
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

interface QueuedTweet {
  id: string;
  content: string;
  source: string;
  createdAt: string;
  scheduledAt: string;
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed';
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  prediction: {
    score: number;
    viralPotential: 'low' | 'medium' | 'high';
    bestTime: string;
  };
  hashtags: string[];
  sourceUrl?: string;
}

interface TweetStats {
  totalQueued: number;
  approved: number;
  scheduled: number;
  posted: number;
  avgEngagement: number;
  viralTweets: number;
}

interface PerformancePrediction {
  tweetId: string;
  engagementScore: number;
  viralPotential: string;
  optimalPostTime: string;
  hashtagRecommendations: string[];
}

export function MembersTweetQueuePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TweetStats>({
    totalQueued: 0,
    approved: 0,
    scheduled: 0,
    posted: 0,
    avgEngagement: 0,
    viralTweets: 0
  });
  const [tweets, setTweets] = useState<QueuedTweet[]>([]);
  const [selectedTweets, setSelectedTweets] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTweet, setCurrentTweet] = useState<QueuedTweet | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');

  const fetchTweetQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/members/tweet-queue`);
      const data = await response.json();
      setTweets(data.tweets);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching tweet queue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweetQueue();
  }, [fetchTweetQueue]);

  const handleEditTweet = (tweet: QueuedTweet) => {
    setCurrentTweet(tweet);
    setEditDialogOpen(true);
  };

  const handleSaveTweet = async () => {
    if (!currentTweet) return;
    
    try {
      await fetch(`${API_BASE}/api/members/tweets/${currentTweet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTweet)
      });
      await fetchTweetQueue();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving tweet:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      await fetch(`${API_BASE}/api/members/tweets/bulk-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tweetIds: selectedTweets })
      });
      await fetchTweetQueue();
      setSelectedTweets([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleGenerateNewTweets = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/members/tweets/generate`, {
        method: 'POST'
      });
      await fetchTweetQueue();
    } catch (error) {
      console.error('Error generating tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'scheduled': return 'info';
      case 'posted': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getViralPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'low': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const filteredTweets = tweets.filter(tweet => 
    filterStatus === 'all' || tweet.status === filterStatus
  );

  if (loading) {
    return (
      <Box>
        <Box sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          p: 4,
          mb: 3,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <QueueMusic sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Tweet Queue Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage and schedule your AI-generated tweets from scraped content
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={2} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={60} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Skeleton variant="rectangular" height={400} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        color: 'white',
        p: 4,
        mb: 3,
        borderRadius: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <QueueMusic sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Tweet Queue Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage and schedule your AI-generated tweets from scraped content
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
          startIcon={<SmartToy />}
          onClick={handleGenerateNewTweets}
        >
          Generate New Tweets
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #1976d2',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <QueueMusic sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Queued Tweets
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {stats.totalQueued}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #27ae60',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: '#27ae60', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#27ae60' }}>
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #f39c12',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ color: '#f39c12', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Scheduled
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#f39c12' }}>
                {stats.scheduled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #9b59b6',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Send sx={{ color: '#9b59b6', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Posted Today
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#9b59b6' }}>
                {stats.posted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #e74c3c',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: '#e74c3c', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Engagement
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                  {stats.avgEngagement}%
                </Typography>
                <ArrowUpward sx={{ color: '#27ae60', fontSize: 20 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderLeft: '4px solid #00bcd4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Star sx={{ color: '#00bcd4', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Viral Tweets
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                {stats.viralTweets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tweet Management Section */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 3, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        {/* Controls Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Twitter sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Today's Generated Tweets
            </Typography>
            <Badge badgeContent={filteredTweets.length} color="primary" />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>
                <FilterList sx={{ fontSize: 16, mr: 0.5 }} />
                Status
              </InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Tweets</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
              </Select>
            </FormControl>

            {selectedTweets.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleBulkAction('approve')}
                >
                  Approve ({selectedTweets.length})
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  startIcon={<Schedule />}
                  onClick={() => handleBulkAction('schedule')}
                >
                  Schedule ({selectedTweets.length})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete ({selectedTweets.length})
                </Button>
              </Box>
            )}

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTweetQueue}
            >
              Refresh Queue
            </Button>
          </Box>
        </Box>

        {/* Tweets Table */}
        {filteredTweets.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary'
          }}>
            <QueueMusic sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No tweets in queue
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Run the content scraper to generate new tweets from trending content
            </Typography>
            <Button
              variant="contained"
              startIcon={<SmartToy />}
              onClick={handleGenerateNewTweets}
            >
              Generate Tweets from Scraped Content
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTweets.length === filteredTweets.length}
                      indeterminate={selectedTweets.length > 0 && selectedTweets.length < filteredTweets.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTweets(filteredTweets.map(tweet => tweet.id));
                        } else {
                          setSelectedTweets([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Twitter sx={{ fontSize: 16 }} />
                      Tweet Content
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContentCopy sx={{ fontSize: 16 }} />
                      Source
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                      Status
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PredictiveText sx={{ fontSize: 16 }} />
                      AI Prediction
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16 }} />
                      Scheduled
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Analytics sx={{ fontSize: 16 }} />
                      Performance
                    </Box>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTweets.map((tweet, index) => (
                  <TableRow 
                    key={tweet.id} 
                    sx={{ 
                      bgcolor: index % 2 === 0 ? 'transparent' : '#f8f9fa',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTweets.includes(tweet.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTweets([...selectedTweets, tweet.id]);
                          } else {
                            setSelectedTweets(selectedTweets.filter(id => id !== tweet.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {tweet.content.substring(0, 100)}
                        {tweet.content.length > 100 && '...'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {tweet.hashtags.map((tag, i) => (
                          <Chip 
                            key={i}
                            label={tag}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tweet.source}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tweet.status}
                        color={getStatusColor(tweet.status) as any}
                        size="small"
                        icon={
                          tweet.status === 'approved' ? <CheckCircle /> :
                          tweet.status === 'scheduled' ? <Schedule /> :
                          tweet.status === 'posted' ? <Send /> :
                          tweet.status === 'failed' ? <Error /> : <Edit />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: getViralPotentialColor(tweet.prediction.viralPotential)
                          }}
                        />
                        <Typography variant="body2">
                          {tweet.prediction.score}/10
                        </Typography>
                        <Tooltip title={`Best time: ${tweet.prediction.bestTime}`}>
                          <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(tweet.scheduledAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(tweet.scheduledAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ThumbUp sx={{ fontSize: 12, color: '#1976d2' }} />
                          <Typography variant="caption">{tweet.engagement.likes}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Repeat sx={{ fontSize: 12, color: '#27ae60' }} />
                          <Typography variant="caption">{tweet.engagement.retweets}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Reply sx={{ fontSize: 12, color: '#f39c12' }} />
                          <Typography variant="caption">{tweet.engagement.replies}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Tweet">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTweet(tweet)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Analytics">
                          <IconButton size="small">
                            <Analytics />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Options">
                          <IconButton size="small">
                            <MoreVert />
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
      </Paper>

      {/* Edit Tweet Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit />
            Edit Tweet Content
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentTweet && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Tweet Content"
                value={currentTweet.content}
                onChange={(e) => setCurrentTweet({
                  ...currentTweet,
                  content: e.target.value
                })}
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 280 }}
                helperText={`${currentTweet.content.length}/280 characters`}
              />
              
              <TextField
                fullWidth
                label="Hashtags (comma-separated)"
                value={currentTweet.hashtags.join(', ')}
                onChange={(e) => setCurrentTweet({
                  ...currentTweet,
                  hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={currentTweet.status}
                  onChange={(e) => setCurrentTweet({
                    ...currentTweet,
                    status: e.target.value as any
                  })}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="datetime-local"
                label="Schedule Time"
                value={currentTweet.scheduledAt?.slice(0, 16)}
                onChange={(e) => setCurrentTweet({
                  ...currentTweet,
                  scheduledAt: new Date(e.target.value).toISOString()
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTweet}
            startIcon={<CheckCircle />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}