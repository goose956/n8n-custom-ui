import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import { StatCard } from './shared/StatCard';
import {
  Box, Grid, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Tab, Tabs, CircularProgress, Alert, Container,
  Chip, IconButton, Button, Tooltip, Snackbar, TextField, Stack,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import RedditIcon from '@mui/icons-material/Reddit';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';

const SM_API = API.socialMonitor;

/* ─── Types ────────────────────────────────────────────────────────── */

interface MonitorKeyword {
  id: string;
  term: string;
  subreddits: string[];
  enabled: boolean;
  createdAt: string;
}

interface MonitoredPost {
  id: string;
  platform: string;
  postId: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  postedAt: string;
  discoveredAt: string;
  relevanceScore: number;
  relevanceReason: string;
  status: 'new' | 'drafted' | 'reviewed' | 'posted' | 'skipped';
  draftReply: string;
  notes: string;
  keywords: string[];
}

interface Stats {
  totalPosts: number;
  activeKeywords: number;
  totalKeywords: number;
  byStatus: Record<string, number>;
  subreddits: string[];
  avgRelevance: number;
  highOpportunities: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: '#2196f3',
  drafted: '#ff9800',
  reviewed: '#9c27b0',
  posted: '#4caf50',
  skipped: '#999',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  drafted: 'Drafted',
  reviewed: 'Reviewed',
  posted: 'Posted',
  skipped: 'Skipped',
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#4caf50' : score >= 6 ? '#ff9800' : score >= 4 ? '#2196f3' : '#999';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: '50%', bgcolor: `${color}15`, color, fontWeight: 800, fontSize: '0.85rem',
    }}>
      {score}
    </Box>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */

export function SocialMonitorPage() {
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState<MonitoredPost[]>([]);
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subredditFilter, setSubredditFilter] = useState<string>('');

  // Dialogs
  const [selectedPost, setSelectedPost] = useState<MonitoredPost | null>(null);
  const [keywordDialog, setKeywordDialog] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newSubreddits, setNewSubreddits] = useState('');
  const [replyContext, setReplyContext] = useState('');

  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  /* ─── Fetchers ──────────────────────────────────────────────────── */

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (subredditFilter) params.set('subreddit', subredditFilter);
      const res = await fetch(`${SM_API}/posts?${params}`);
      const json = await res.json();
      if (json.success) setPosts(json.data);
    } catch { /* ignore */ }
  }, [statusFilter, subredditFilter]);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch(`${SM_API}/keywords`);
      const json = await res.json();
      if (json.success) setKeywords(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${SM_API}/stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPosts(), fetchKeywords(), fetchStats()]);
    setLoading(false);
  }, [fetchPosts, fetchKeywords, fetchStats]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Actions ───────────────────────────────────────────────────── */

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${SM_API}/scan`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSnack({ open: true, msg: `Found ${json.data.newPosts} new posts (${json.data.duplicatesSkipped} duplicates skipped)`, severity: 'success' });
        fetchAll();
      } else {
        setSnack({ open: true, msg: json.message || 'Scan failed', severity: 'error' });
      }
    } catch {
      setSnack({ open: true, msg: 'Scan failed — check your Apify token', severity: 'error' });
    } finally {
      setScanning(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      const res = await fetch(`${SM_API}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: newKeyword.trim(),
          subreddits: newSubreddits.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSnack({ open: true, msg: 'Keyword added', severity: 'success' });
        setNewKeyword('');
        setNewSubreddits('');
        setKeywordDialog(false);
        fetchKeywords();
        fetchStats();
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to add keyword', severity: 'error' });
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      await fetch(`${SM_API}/keywords/${id}`, { method: 'DELETE' });
      fetchKeywords();
      fetchStats();
    } catch { /* ignore */ }
  };

  const handleToggleKeyword = async (id: string) => {
    try {
      await fetch(`${SM_API}/keywords/${id}/toggle`, { method: 'POST' });
      fetchKeywords();
    } catch { /* ignore */ }
  };

  const handleUpdateStatus = async (postId: string, status: string) => {
    try {
      await fetch(`${SM_API}/posts/${postId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchPosts();
      fetchStats();
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch { /* ignore */ }
  };

  const handleGenerateReply = async (postId: string) => {
    setGeneratingId(postId);
    try {
      const res = await fetch(`${SM_API}/posts/${postId}/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: replyContext }),
      });
      const json = await res.json();
      if (json.success) {
        setSnack({ open: true, msg: 'Draft reply generated', severity: 'success' });
        fetchPosts();
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, draftReply: json.data.reply, status: 'drafted' } : null);
        }
      } else {
        setSnack({ open: true, msg: json.message || 'Failed to generate', severity: 'error' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to generate reply', severity: 'error' });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSaveDraft = async (postId: string, draft: string) => {
    try {
      await fetch(`${SM_API}/posts/${postId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftReply: draft }),
      });
      setSnack({ open: true, msg: 'Draft saved', severity: 'success' });
      fetchPosts();
    } catch { /* ignore */ }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`${SM_API}/posts/${postId}`, { method: 'DELETE' });
      fetchPosts();
      fetchStats();
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch { /* ignore */ }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, msg: 'Copied to clipboard', severity: 'info' });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            background: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RedditIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>Social Monitor</Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor Reddit for conversations relevant to your product. Find high-opportunity threads, get AI-suggested replies, and engage authentically with potential customers — currently Reddit, more platforms coming soon.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll} sx={{ color: '#667eea' }}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={scanning ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            onClick={handleScan}
            disabled={scanning || keywords.filter(k => k.enabled).length === 0}
            sx={{
              background: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #e03e00 0%, #e06030 100%)' },
              textTransform: 'none', fontWeight: 600,
            }}
          >
            {scanning ? 'Scanning...' : 'Scan Reddit'}
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {stats && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><StatCard label="Total Posts" value={stats.totalPosts} icon={<RedditIcon />} color="#FF4500" bgColor="#fff3e0" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Opportunities" value={stats.highOpportunities} icon={<StarIcon />} color="#ff9800" bgColor="#fff8e1" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Keywords" value={stats.activeKeywords} icon={<SearchIcon />} color="#667eea" bgColor="#eef0ff" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Avg Relevance" value={`${stats.avgRelevance}/10`} icon={<TrendingUpIcon />} color="#4caf50" bgColor="#e8f5e9" /></Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3, borderBottom: '1px solid rgba(0,0,0,0.06)',
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.9rem', minHeight: 42 },
          '& .Mui-selected': { color: '#FF4500 !important' },
          '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)', height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        <Tab icon={<RedditIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Post Queue
            {stats && stats.byStatus.new > 0 && (
              <Chip label={stats.byStatus.new} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#2196f3' }} />
            )}
          </Box>
        } />
        <Tab icon={<SearchIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Keywords" />
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 0: POST QUEUE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="drafted">Drafted</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
                <MenuItem value="skipped">Skipped</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Subreddit</InputLabel>
              <Select value={subredditFilter} onChange={(e) => setSubredditFilter(e.target.value)} label="Subreddit">
                <MenuItem value="">All</MenuItem>
                {stats?.subreddits.map(s => <MenuItem key={s} value={s}>r/{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 550 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 50 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Post</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Subreddit</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 70 }} align="center">Upvotes</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>Age</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id} sx={{
                      cursor: 'pointer',
                      bgcolor: post.relevanceScore >= 8 ? 'rgba(76,175,80,0.03)' : 'transparent',
                      '&:hover': { bgcolor: '#fafbfc' },
                    }} onClick={() => setSelectedPost(post)}>
                      <TableCell><ScoreBadge score={post.relevanceScore} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                          {post.relevanceReason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`r/${post.subreddit}`} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600, bgcolor: '#fff3e0', color: '#FF4500' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: post.score > 10 ? '#4caf50' : '#666' }}>
                          {post.score}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={STATUS_LABELS[post.status]} size="small" sx={{
                          height: 22, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: `${STATUS_COLORS[post.status]}15`,
                          color: STATUS_COLORS[post.status],
                        }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#888' }}>{timeAgo(post.postedAt)}</Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Open on Reddit">
                          <IconButton size="small" onClick={() => window.open(post.url, '_blank')} sx={{ color: '#FF4500' }}>
                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate AI reply">
                          <IconButton size="small" onClick={() => handleGenerateReply(post.id)} disabled={generatingId === post.id} sx={{ color: '#667eea' }}>
                            {generatingId === post.id ? <CircularProgress size={14} /> : <SmartToyIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Skip">
                          <IconButton size="small" onClick={() => handleUpdateStatus(post.id, 'skipped')} sx={{ color: '#999' }}>
                            <SkipNextIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => { handleDeletePost(post.id); setSnack({ open: true, msg: 'Post removed', severity: 'info' }); }} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 5 }}>
                          <RedditIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
                          <Typography variant="body1" color="text.secondary">No posts yet</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Add keywords and click "Scan Reddit" to start finding posts
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: KEYWORDS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Monitor Keywords</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Add keywords to search Reddit for. Optionally restrict to specific subreddits.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setKeywordDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
                textTransform: 'none', fontWeight: 600,
              }}
            >
              Add Keyword
            </Button>
          </Box>

          {keywords.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Keyword</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subreddits</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Added</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keywords.map((kw) => (
                    <TableRow key={kw.id} sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e' }}>"{kw.term}"</Typography>
                      </TableCell>
                      <TableCell>
                        {kw.subreddits.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {kw.subreddits.map(s => (
                              <Chip key={s} label={`r/${s}`} size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: '#fff3e0', color: '#FF4500' }} />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#999', fontSize: '0.8rem' }}>All of Reddit</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={kw.enabled ? 'Active' : 'Paused'}
                          size="small"
                          onClick={() => handleToggleKeyword(kw.id)}
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                            bgcolor: kw.enabled ? '#e8f5e9' : '#f5f5f5',
                            color: kw.enabled ? '#4caf50' : '#999',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                          {new Date(kw.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteKeyword(kw.id)} sx={{ color: '#e74c3c' }}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">No keywords configured</Typography>
              <Typography variant="body2" color="text.secondary">Add keywords to start monitoring Reddit</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* POST DETAIL DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedPost && (
          <>
            <DialogTitle sx={{ pt: 3, pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={`r/${selectedPost.subreddit}`} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#fff3e0', color: '#FF4500' }} />
                    <ScoreBadge score={selectedPost.relevanceScore} />
                    <Chip label={STATUS_LABELS[selectedPost.status]} size="small" sx={{
                      height: 22, fontSize: '0.7rem', fontWeight: 700,
                      bgcolor: `${STATUS_COLORS[selectedPost.status]}15`,
                      color: STATUS_COLORS[selectedPost.status],
                    }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.4 }}>
                    {selectedPost.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    by u/{selectedPost.author} · {timeAgo(selectedPost.postedAt)} · {selectedPost.score} upvotes · {selectedPost.numComments} comments
                  </Typography>
                </Box>
                <Tooltip title="Open on Reddit">
                  <IconButton onClick={() => window.open(selectedPost.url, '_blank')} sx={{ color: '#FF4500' }}>
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Post body */}
              {selectedPost.body && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#fafbfc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                    {selectedPost.body}
                  </Typography>
                </Paper>
              )}

              {/* Relevance info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#eef0ff', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea', mb: 0.5 }}>
                  Why this is relevant ({selectedPost.relevanceScore}/10)
                </Typography>
                <Typography variant="body2" sx={{ color: '#555', fontSize: '0.82rem' }}>
                  {selectedPost.relevanceReason}
                </Typography>
                {selectedPost.keywords.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {selectedPost.keywords.map(k => (
                      <Chip key={k} label={k} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(102,126,234,0.15)', color: '#667eea' }} />
                    ))}
                  </Box>
                )}
              </Box>

              {/* Context for AI */}
              <TextField
                fullWidth
                label="Context for AI reply (what's your tool/offering?)"
                placeholder="e.g. I built a free workflow automation tool that connects to n8n..."
                value={replyContext}
                onChange={(e) => setReplyContext(e.target.value)}
                size="small"
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              {/* Draft reply */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Draft Reply</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={generatingId === selectedPost.id ? <CircularProgress size={14} /> : <SmartToyIcon />}
                      onClick={() => handleGenerateReply(selectedPost.id)}
                      disabled={generatingId === selectedPost.id}
                      sx={{ textTransform: 'none', color: '#667eea', fontSize: '0.8rem' }}
                    >
                      {generatingId === selectedPost.id ? 'Generating...' : 'AI Generate'}
                    </Button>
                    {selectedPost.draftReply && (
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => copyToClipboard(selectedPost.draftReply)}
                        sx={{ textTransform: 'none', color: '#4caf50', fontSize: '0.8rem' }}
                      >
                        Copy
                      </Button>
                    )}
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  value={selectedPost.draftReply || ''}
                  onChange={(e) => setSelectedPost(prev => prev ? { ...prev, draftReply: e.target.value } : null)}
                  placeholder="Click 'AI Generate' or write your reply here..."
                  variant="outlined"
                  size="small"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Button onClick={() => handleDeletePost(selectedPost.id)} sx={{ color: '#e74c3c', textTransform: 'none' }} startIcon={<DeleteOutlineIcon />}>
                Delete
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => handleUpdateStatus(selectedPost.id, 'skipped')} sx={{ color: '#999', textTransform: 'none' }}>
                Skip
              </Button>
              {selectedPost.draftReply && (
                <Button
                  onClick={() => handleSaveDraft(selectedPost.id, selectedPost.draftReply)}
                  variant="outlined"
                  sx={{ textTransform: 'none', borderColor: '#667eea', color: '#667eea' }}
                >
                  Save Draft
                </Button>
              )}
              <Button
                onClick={() => {
                  handleUpdateStatus(selectedPost.id, 'posted');
                  setSelectedPost(null);
                }}
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #43a047 0%, #5cb85c 100%)' },
                }}
              >
                Mark as Posted
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD KEYWORD DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={keywordDialog} onClose={() => setKeywordDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pt: 3 }}>Add Monitor Keyword</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Keyword or Phrase"
              placeholder="e.g. workflow automation, saas builder, no code tools"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
            />
            <TextField
              fullWidth
              label="Subreddits (optional, comma-separated)"
              placeholder="e.g. SaaS, nocode, startups, Entrepreneur"
              value={newSubreddits}
              onChange={(e) => setNewSubreddits(e.target.value)}
              helperText="Leave blank to search all of Reddit. Omit the r/ prefix."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setKeywordDialog(false)} sx={{ color: '#888', textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleAddKeyword}
            variant="contained"
            disabled={!newKeyword.trim()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
              textTransform: 'none',
            }}
          >
            Add Keyword
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SocialMonitorPage;
