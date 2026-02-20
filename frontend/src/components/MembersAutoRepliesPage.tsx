===FILE: frontend/src/components/members/twitter-automation-/auto-replies.tsx ===
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  LinearProgress,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Reply,
  TrendingUp,
  TrendingDown,
  Add,
  Edit,
  Delete,
  Visibility,
  Link,
  Download,
  Message,
  CheckCircle,
  Schedule,
  Settings,
  Analytics,
  FilterList,
  Search,
  MoreVert,
  Person,
  Twitter,
  BookmarkAdd,
  Speed,
  ArrowUpward,
  ArrowDownward,
  PictureAsPdf,
  Close,
  PlayArrow,
  Pause
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

interface AutoReplyTemplate {
  id: string;
  name: string;
  message: string;
  ebookUrl: string;
  ebookTitle: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface IncomingReply {
  id: string;
  twitterUser: string;
  username: string;
  avatarUrl: string;
  message: string;
  originalTweet: string;
  timestamp: string;
  status: 'pending' | 'replied' | 'ignored';
  templateUsed?: string;
  conversionTracking?: {
    clicked: boolean;
    downloadedEbook: boolean;
    optedIn: boolean;
  };
}

interface ReplyStats {
  totalRepliesReceived: number;
  autoRepliesSent: number;
  responseRate: number;
  optInPageClicks: number;
  ebookDownloads: number;
  conversionRate: number;
  avgResponseTime: string;
  popularKeywords: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function MembersAutoRepliesPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AutoReplyTemplate[]>([]);
  const [incomingReplies, setIncomingReplies] = useState<IncomingReply[]>([]);
  const [stats, setStats] = useState<ReplyStats | null>(null);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoReplyTemplate | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    message: '',
    ebookUrl: '',
    ebookTitle: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setStats({
          totalRepliesReceived: 147,
          autoRepliesSent: 132,
          responseRate: 89.8,
          optInPageClicks: 67,
          ebookDownloads: 54,
          conversionRate: 36.7,
          avgResponseTime: '2.3 mins',
          popularKeywords: ['automation', 'growth', 'strategy', 'tips', 'tools']
        });

        setTemplates([
          {
            id: '1',
            name: 'Twitter Growth Ebook',
            message: 'Thanks for engaging! 🚀 I\'ve got a free Twitter Growth Guide that shows exactly how to get 10K+ followers in 90 days. Grab it here: {ebook_link}',
            ebookUrl: 'https://example.com/twitter-growth-guide.pdf',
            ebookTitle: 'Twitter Growth Mastery Guide',
            isActive: true,
            createdAt: '2024-01-15',
            lastUsed: '2024-01-20',
            usageCount: 47
          },
          {
            id: '2',
            name: 'Content Strategy Template',
            message: 'Hey! Love your engagement 💪 Want my proven content strategy template that helped me reach 50K followers? Download it free: {ebook_link}',
            ebookUrl: 'https://example.com/content-strategy.pdf',
            ebookTitle: 'Viral Content Strategy Blueprint',
            isActive: true,
            createdAt: '2024-01-10',
            lastUsed: '2024-01-19',
            usageCount: 23
          },
          {
            id: '3',
            name: 'Automation Playbook',
            message: 'Thanks for the comment! 🎯 I\'ve created a complete automation playbook that shows how to 10x your Twitter presence on autopilot. Get it here: {ebook_link}',
            ebookUrl: 'https://example.com/automation-playbook.pdf',
            ebookTitle: 'Twitter Automation Playbook',
            isActive: false,
            createdAt: '2024-01-08',
            usageCount: 12
          }
        ]);

        setIncomingReplies([
          {
            id: '1',
            twitterUser: 'Sarah Miller',
            username: '@sarahmiller',
            avatarUrl: '',
            message: 'This is exactly what I needed! How do you come up with such engaging content?',
            originalTweet: '5 Twitter automation tools that will save you 10 hours per week...',
            timestamp: '2024-01-20T10:30:00Z',
            status: 'replied',
            templateUsed: 'Twitter Growth Ebook',
            conversionTracking: {
              clicked: true,
              downloadedEbook: true,
              optedIn: true
            }
          },
          {
            id: '2',
            twitterUser: 'Alex Chen',
            username: '@alexchen_dev',
            avatarUrl: '',
            message: 'Great thread! Would love to learn more about your automation setup.',
            originalTweet: 'How I automated my Twitter to grow from 0 to 10K followers in 6 months...',
            timestamp: '2024-01-20T09:45:00Z',
            status: 'pending',
            conversionTracking: {
              clicked: false,
              downloadedEbook: false,
              optedIn: false
            }
          },
          {
            id: '3',
            twitterUser: 'Marketing Pro',
            username: '@marketingpro',
            avatarUrl: '',
            message: 'This strategy actually works! Thanks for sharing.',
            originalTweet: 'The 3-step formula for viral Twitter content that works every time...',
            timestamp: '2024-01-20T08:15:00Z',
            status: 'replied',
            templateUsed: 'Content Strategy Template',
            conversionTracking: {
              clicked: true,
              downloadedEbook: false,
              optedIn: false
            }
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, []);

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id 
            ? { ...editingTemplate, ...newTemplate }
            : t
        ));
      } else {
        // Add new template
        const template: AutoReplyTemplate = {
          id: Date.now().toString(),
          ...newTemplate,
          createdAt: new Date().toISOString().split('T')[0],
          usageCount: 0
        };
        setTemplates(prev => [...prev, template]);
      }
      
      setTemplateDialog(false);
      setEditingTemplate(null);
      setNewTemplate({ name: '', message: '', ebookUrl: '', ebookTitle: '', isActive: true });
      setSnackbar({ open: true, message: 'Template saved successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save template', severity: 'error' });
    }
  };

  const handleEditTemplate = (template: AutoReplyTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      message: template.message,
      ebookUrl: template.ebookUrl,
      ebookTitle: template.ebookTitle,
      isActive: template.isActive
    });
    setTemplateDialog(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setSnackbar({ open: true, message: 'Template deleted successfully!', severity: 'success' });
  };

  const handleToggleTemplate = async (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const getStatusChip = (status: string) => {
    const configs = {
      pending: { color: 'warning' as const, icon: <Schedule sx={{ fontSize: 16 }} /> },
      replied: { color: 'success' as const, icon: <CheckCircle sx={{ fontSize: 16 }} /> },
      ignored: { color: 'default' as const, icon: <Close sx={{ fontSize: 16 }} /> }
    };
    
    const config = configs[status as keyof typeof configs];
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Reply sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Auto Replies Management
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
          Automate your Twitter responses and drive traffic to your opt-in pages with personalized ebook offers
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              borderRadius: 2
            }}
            startIcon={<Add />}
            onClick={() => setTemplateDialog(true)}
          >
            New Reply Template
          </Button>
          <Button
            variant="outlined"
            sx={{ 
              borderColor: 'rgba(255,255,255,0.5)', 
              color: 'white',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              borderRadius: 2
            }}
            startIcon={<Analytics />}
          >
            View Analytics
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Message sx={{ fontSize: 16, mr: 1 }} />
                    Replies Received
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {stats?.totalRepliesReceived}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <ArrowUpward sx={{ fontSize: 16, color: '#27ae60', mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#27ae60' }}>+23% this week</Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', width: 56, height: 56 }}>
                  <Message />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Reply sx={{ fontSize: 16, mr: 1 }} />
                    Auto Replies Sent
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {stats?.autoRepliesSent}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#27ae60' }}>
                      {stats?.responseRate}% response rate
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#e8f5e8', color: '#27ae60', width: 56, height: 56 }}>
                  <Reply />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Link sx={{ fontSize: 16, mr: 1 }} />
                    Opt-in Page Clicks
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {stats?.optInPageClicks}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <ArrowUpward sx={{ fontSize: 16, color: '#27ae60', mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#27ae60' }}>+15% this week</Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#fff3e0', color: '#f57c00', width: 56, height: 56 }}>
                  <Link />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Download sx={{ fontSize: 16, mr: 1 }} />
                    Ebook Downloads
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {stats?.ebookDownloads}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#9c27b0' }}>
                      {stats?.conversionRate}% conversion
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#f3e5f5', color: '#9c27b0', width: 56, height: 56 }}>
                  <Download />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ fontSize: 20, mr: 1 }} />
                  Reply Templates
                  <Badge badgeContent={templates.filter(t => t.isActive).length} color="primary" sx={{ ml: 1 }}>
                    <Box />
                  </Badge>
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Message sx={{ fontSize: 20, mr: 1 }} />
                  Incoming Replies
                  <Badge badgeContent={incomingReplies.filter(r => r.status === 'pending').length} color="error" sx={{ ml: 1 }}>
                    <Box />
                  </Badge>
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics sx={{ fontSize: 20, mr: 1 }} />
                  Performance Analytics
                </Box>
              }
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Reply Templates */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Settings sx={{ fontSize: 24, mr: 1 }} />
              Auto Reply Templates
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setTemplateDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Create Template
            </Button>
          </Box>

          {templates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Reply sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Reply Templates Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first auto-reply template to start automating Twitter responses
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setTemplateDialog(true)}
              >
                Create Your First Template
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: template.isActive ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.06)',
                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <BookmarkAdd sx={{ fontSize: 20, mr: 1, color: '#1976d2' }} />
                            {template.name}
                            {template.isActive && (
                              <Chip
                                label="Active"
                                color="success"
                                size="small"
                                sx={{ ml: 1 }}
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {template.message.length > 150 
                              ? `${template.message.substring(0, 150)}...` 
                              : template.message
                            }
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <PictureAsPdf sx={{ fontSize: 16, mr: 1, color: '#f44336' }} />
                            <Typography variant="body2" color="text.secondary">
                              {template.ebookTitle}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Used {template.usageCount} times
                          </Typography>
                          {template.lastUsed && (
                            <Typography variant="body2" color="text.secondary">
                              Last used: {new Date(template.lastUsed).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Toggle Active Status">
                            <Switch
                              checked={template.isActive}
                              onChange={() => handleToggleTemplate(template.id)}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Edit Template">
                            <IconButton
                              size="small"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Template">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Incoming Replies */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Message sx={{ fontSize: 24, mr: 1 }} />
              Incoming Twitter Replies
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<FilterList />}>
                Filter
              </Button>
              <Button variant="outlined" startIcon={<Search />}>
                Search
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ fontSize: 18, mr: 1 }} />
                      User
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reply Message</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Original Tweet</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 18, mr: 1 }} />
                      Time
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Conversion</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incomingReplies.map((reply, index) => (
                  <TableRow 
                    key={reply.id}
                    sx={{ 
                      bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                      '&:hover': { bgcolor: '#f0f0f0' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#1976d2' }}>
                          <Twitter sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {reply.twitterUser}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {reply.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {reply.message.length > 80 
                          ? `${reply.message.substring(0, 80)}...` 
                          : reply.message
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {reply.originalTweet.length > 60 
                          ? `${reply.originalTweet.substring(0, 60)}...` 
                          : reply.originalTweet
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(reply.timestamp).toLocaleDateString()} {new Date(reply.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(reply.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {reply.conversionTracking?.clicked && (
                          <Chip label="Clicked" color="info" size="small" />
                        )}
                        {reply.conversionTracking?.downloadedEbook && (
                          <Chip label="Downloaded" color="success" size="small" />
                        )}
                        {reply.conversionTracking?.optedIn && (
                          <Chip label="Opted In" color="primary" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {reply.status === 'pending' && (
                          <Tooltip title="Send Reply">
                            <IconButton size="small" color="primary">
                              <Reply />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>