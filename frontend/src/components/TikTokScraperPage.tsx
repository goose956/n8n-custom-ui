import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Grid,
  InputAdornment,
  Skeleton,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  VideoLibrary,
  Search,
  Download,
  Add,
  Refresh,
  PlayArrow,
  Pause,
  Visibility,
  ThumbUp,
  Comment,
  Share,
  Person,
  DateRange,
  Timeline,
  TrendingUp,
  FilterList,
  GetApp,
  SmartToy,
  Close,
} from '@mui/icons-material';
import { API } from '../../config/api';

interface TikTokVideo {
  id: string;
  url: string;
  username: string;
  displayName: string;
  description: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number;
  createTime: string;
  hashtags: string[];
  musicTitle?: string;
  videoUrl: string;
  thumbnailUrl: string;
}

interface ScraperInput {
  hashtags?: string[];
  usernames?: string[];
  videoUrls?: string[];
  maxResults: number;
  searchType: 'hashtag' | 'user' | 'video';
}

interface ScraperStatus {
  isRunning: boolean;
  progress: number;
  lastRun?: string;
  totalResults: number;
}

export function TikTokScraperPage() {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<TikTokVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<ScraperStatus>({ isRunning: false, progress: 0, totalResults: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Dialog form state
  const [scraperInput, setScraperInput] = useState<ScraperInput>({
    hashtags: [],
    usernames: [],
    videoUrls: [],
    maxResults: 20,
    searchType: 'hashtag',
  });
  const [inputText, setInputText] = useState('');

  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clockworks-tiktok-scraper/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setVideos(data);
      setFilteredVideos(data);
    } catch (error) {
      console.error('Error fetching results:', error);
      setSnackbar({ open: true, message: 'Failed to fetch results', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clockworks-tiktok-scraper/status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchResults();
    fetchStatus();
  }, [fetchResults, fetchStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status.isRunning) {
        fetchStatus();
        fetchResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status.isRunning, fetchStatus, fetchResults]);

  useEffect(() => {
    const filtered = videos.filter(video =>
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredVideos(filtered);
  }, [searchQuery, videos]);

  const handleRunScraper = async () => {
    try {
      setDialogOpen(false);
      const inputData = {
        ...scraperInput,
        [scraperInput.searchType === 'hashtag' ? 'hashtags' : 
          scraperInput.searchType === 'user' ? 'usernames' : 'videoUrls']: 
          inputText.split('\n').filter(line => line.trim()),
      };

      const response = await fetch(`${API_BASE}/api/clockworks-tiktok-scraper/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) throw new Error('Failed to start scraper');
      
      setSnackbar({ open: true, message: 'Scraper started successfully!', severity: 'success' });
      fetchStatus();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to start scraper', severity: 'error' });
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Username', 'Display Name', 'Description', 'Views', 'Likes', 'Comments', 'Shares', 'Duration', 'Created', 'Hashtags', 'Music', 'URL'].join(','),
      ...filteredVideos.map(video => [
        video.username,
        video.displayName,
        `"${video.description.replace(/"/g, '""')}"`,
        video.viewCount,
        video.likeCount,
        video.commentCount,
        video.shareCount,
        video.duration,
        video.createTime,
        `"${video.hashtags.join(', ')}"`,
        video.musicTitle || '',
        video.url,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiktok-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: 48, height: 48 }}>
            <VideoLibrary fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              TikTok Scraper
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Extract data from TikTok videos, users, and hashtags
            </Typography>
          </Box>
        </Box>
        
        {status.isRunning && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <SmartToy fontSize="small" />
              <Typography variant="body2">Scraper running...</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={status.progress}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: 'white' }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    Total Videos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {videos.length.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                  <VideoLibrary />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    Total Views
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {formatNumber(videos.reduce((sum, v) => sum + v.viewCount, 0))}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                  <Visibility />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    Total Likes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                    {formatNumber(videos.reduce((sum, v) => sum + v.likeCount, 0))}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                  <ThumbUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip
                      size="small"
                      icon={status.isRunning ? <PlayArrow /> : <Pause />}
                      label={status.isRunning ? 'Running' : 'Idle'}
                      color={status.isRunning ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: status.isRunning ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)', color: status.isRunning ? '#4caf50' : '#9e9e9e' }}>
                  <Timeline />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search videos, users, or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2 }}
            disabled={status.isRunning}
          >
            New Scrape
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchResults}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2 }}
            disabled={filteredVideos.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Paper>

      {/* Results Table */}
      <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    User
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoLibrary fontSize="small" />
                    Video
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp fontSize="small" />
                    Engagement
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRange fontSize="small" />
                    Created
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton variant="rectangular" width="100%" height={60} /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))
              ) : filteredVideos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <VideoLibrary sx={{ fontSize: 64, color: '#ccc' }} />
                      <Typography variant="h6" color="textSecondary">
                        No videos found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Run a new scrape to collect TikTok data
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setDialogOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Start Scraping
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVideos.map((video, index) => (
                  <TableRow key={video.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#fafbfc' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={video.thumbnailUrl} sx={{ width: 40, height: 40 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            @{video.username}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {video.displayName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {video.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {video.hashtags.slice(0, 3).map((tag, idx) => (
                            <Chip key={idx} size="small" label={`#${tag}`} variant="outlined" />
                          ))}
                          {video.hashtags.length > 3 && (
                            <Chip size="small" label={`+${video.hashtags.length - 3}`} variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                          Duration: {formatDuration(video.duration)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Visibility fontSize="small" color="action" />
                          <Typography variant="caption">{formatNumber(video.viewCount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ThumbUp fontSize="small" color="action" />
                          <Typography variant="caption">{formatNumber(video.likeCount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Comment fontSize="small" color="action" />
                          <Typography variant="caption">{formatNumber(video.commentCount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Share fontSize="small" color="action" />
                          <Typography variant="caption">{formatNumber(video.shareCount)}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(video.createTime).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Open Video">
                        <IconButton
                          size="small"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* New Scrape Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#1976d2' }}>
              <SmartToy />
            </Avatar>
            <Typography variant="h6">Run TikTok Scraper</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Search Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { value: 'hashtag', label: 'Hashtags' },
                  { value: 'user', label: 'Users' },
                  { value: 'video', label: 'Video URLs' },
                ].map((type) => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    onClick={() => setScraperInput({ ...scraperInput, searchType: type.value as any })}
                    color={scraperInput.searchType === type.value ? 'primary' : 'default'}
                    variant={scraperInput.searchType === type.value ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label={
                scraperInput.searchType === 'hashtag' ? 'Hashtags (one per line)' :
                scraperInput.searchType === 'user' ? 'Usernames (one per line)' :
                'Video URLs (one per line)'
              }
              multiline
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                scraperInput.searchType === 'hashtag' ? 'funny\ndance\ntravel' :
                scraperInput.searchType === 'user' ? 'username1\nusername2\nusername3' :
                'https://www.tiktok.com/@user/video/123\nhttps://www.tiktok.com/@user/video/456'
              }
            />

            <TextField
              label="Max Results"
              type="number"
              value={scraperInput.maxResults}
              onChange={(e) => setScraperInput({ ...scraperInput, maxResults: parseInt(e.target.value) || 20 })}
              inputProps={{ min: 1, max: 1000 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRunScraper}
            disabled={!inputText.trim()}
            startIcon={<PlayArrow />}
          >
            Start Scraping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}