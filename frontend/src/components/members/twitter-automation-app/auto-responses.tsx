import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Badge,
  LinearProgress,
  Skeleton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  AutoAwesome,
  Reply,
  TrendingUp,
  TrendingDown,
  Block,
  Edit,
  Delete,
  Add,
  FilterList,
  Timeline,
  Analytics,
  CheckCircle,
  Error,
  Warning,
  PersonAdd,
  Email,
  Visibility,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Speed,
  Star,
  Schedule,
  Send,
  Download,
  Refresh
} from '@mui/icons-material';

// Inline interfaces for this component
interface AutoResponseTemplate {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  sentCount: number;
  conversionRate: number;
  createdAt: string;
}

interface SentResponse {
  id: string;
  recipientHandle: string;
  template: string;
  sentAt: string;
  status: 'delivered' | 'failed' | 'pending';
  converted: boolean;
  originalTweet: string;
}

interface ResponseRule {
  id: string;
  trigger: string;
  templateId: string;
  isActive: boolean;
  priority: number;
}

interface BlockedAccount {
  id: string;
  handle: string;
  reason: string;
  blockedAt: string;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersAutoResponsesPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<AutoResponseTemplate[]>([]);
  const [sentResponses, setSentResponses] = useState<SentResponse[]>([]);
  const [responseRules, setResponseRules] = useState<ResponseRule[]>([]);
  const [blockedAccounts, setBlockedAccounts] = useState<BlockedAccount[]>([]);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoResponseTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: ''
  });

  // Stats data
  const [stats, setStats] = useState({
    totalResponsesSent: 0,
    avgConversionRate: 0,
    activeTemplates: 0,
    blockedAccounts: 0,
    responsesLast24h: 0,
    trendDirection: 'up' as 'up' | 'down'
  });

  useEffect(() => {
    loadAutoResponseData();
  }, []);

  const loadAutoResponseData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app, these would be separate API calls
      const mockTemplates: AutoResponseTemplate[] = [
        {
          id: '1',
          name: 'Twitter Growth Ebook',
          content: 'Thanks for engaging! 🚀 Get my FREE Twitter Growth Guide with proven strategies to gain 10K+ followers: https://yoursite.com/twitter-growth-ebook',
          isActive: true,
          sentCount: 234,
          conversionRate: 12.5,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Content Calendar Template',
          content: 'Hey! Love your engagement 💪 Want a free 30-day Twitter content calendar? Grab it here: https://yoursite.com/content-calendar',
          isActive: true,
          sentCount: 189,
          conversionRate: 8.7,
          createdAt: '2024-01-12'
        },
        {
          id: '3',
          name: 'Viral Tweet Formula',
          content: 'Thanks for the reply! 🔥 Want to know the exact formula I use for viral tweets? Download it free: https://yoursite.com/viral-formula',
          isActive: false,
          sentCount: 67,
          conversionRate: 15.2,
          createdAt: '2024-01-10'
        }
      ];

      const mockSentResponses: SentResponse[] = [
        {
          id: '1',
          recipientHandle: '@john_marketer',
          template: 'Twitter Growth Ebook',
          sentAt: '2024-01-20 14:23',
          status: 'delivered',
          converted: true,
          originalTweet: 'Great tips on Twitter automation!'
        },
        {
          id: '2',
          recipientHandle: '@sarah_growth',
          template: 'Content Calendar Template',
          sentAt: '2024-01-20 14:18',
          status: 'delivered',
          converted: false,
          originalTweet: 'How do you schedule so many tweets?'
        },
        {
          id: '3',
          recipientHandle: '@mike_social',
          template: 'Twitter Growth Ebook',
          sentAt: '2024-01-20 14:12',
          status: 'pending',
          converted: false,
          originalTweet: 'This automation looks interesting'
        }
      ];

      const mockRules: ResponseRule[] = [
        {
          id: '1',
          trigger: 'contains: "automation", "bot", "schedule"',
          templateId: '1',
          isActive: true,
          priority: 1
        },
        {
          id: '2',
          trigger: 'contains: "content", "calendar", "plan"',
          templateId: '2',
          isActive: true,
          priority: 2
        }
      ];

      const mockBlocked: BlockedAccount[] = [
        {
          id: '1',
          handle: '@spammer123',
          reason: 'Multiple spam replies',
          blockedAt: '2024-01-18'
        },
        {
          id: '2',
          handle: '@bot_account',
          reason: 'Automated account detected',
          blockedAt: '2024-01-17'
        }
      ];

      setTemplates(mockTemplates);
      setSentResponses(mockSentResponses);
      setResponseRules(mockRules);
      setBlockedAccounts(mockBlocked);

      setStats({
        totalResponsesSent: 1247,
        avgConversionRate: 11.8,
        activeTemplates: mockTemplates.filter(t => t.isActive).length,
        blockedAccounts: mockBlocked.length,
        responsesLast24h: 23,
        trendDirection: 'up'
      });

    } catch (error) {
      console.error('Error loading auto response data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, name: templateForm.name, content: templateForm.content }
            : t
        ));
      } else {
        // Create new template
        const newTemplate: AutoResponseTemplate = {
          id: Date.now().toString(),
          name: templateForm.name,
          content: templateForm.content,
          isActive: true,
          sentCount: 0,
          conversionRate: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setTemplates(prev => [...prev, newTemplate]);
      }

      setOpenTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', content: '' });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEditTemplate = (template: AutoResponseTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      content: template.content
    });
    setOpenTemplateDialog(true);
  };

  const handleToggleTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          transform: 'none',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-2px)' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.totalResponsesSent.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Auto Responses Sent
                </Typography>
              </Box>
              <Reply sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {stats.trendDirection === 'up' ? (
                <ArrowUpward sx={{ color: '#4caf50', mr: 0.5 }} />
              ) : (
                <ArrowDownward sx={{ color: '#f44336', mr: 0.5 }} />
              )}
              <Typography variant="body2">
                {stats.responsesLast24h} in last 24h
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#27ae60' }}>
                  {stats.avgConversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Conversion Rate
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: '#27ae60' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                  {stats.activeTemplates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Response Templates
                </Typography>
              </Box>
              <AutoAwesome sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336' }}>
                  {stats.blockedAccounts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked Accounts
                </Typography>
              </Box>
              <Block sx={{ fontSize: 40, color: '#f44336' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTemplatesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome /> Response Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenTemplateDialog(true)}
          sx={{ borderRadius: 10 }}
        >
          Create Template
        </Button>
      </Box>

      {loading ? (
        <Box>
          {[1, 2, 3].map(i => (
            <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
              <CardContent>
                <Skeleton variant="text" width="30%" height={32} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center', 
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Response Templates Created
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first auto-response template to start automatically engaging with Twitter replies
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenTemplateDialog(true)}
            sx={{ borderRadius: 10 }}
          >
            Create First Template
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templates.map(template => (
            <Grid item xs={12} key={template.id}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.06)',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {template.name}
                        </Typography>
                        <Chip
                          label={template.isActive ? 'Active' : 'Inactive'}
                          color={template.isActive ? 'success' : 'default'}
                          size="small"
                          icon={template.isActive ? <CheckCircle /> : <Warning />}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.content}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleEditTemplate(template)}>
                        <Edit />
                      </IconButton>
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {template.sentCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Times Sent
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#27ae60' }}>
                          {template.conversionRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Conversion Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={template.isActive}
                              onChange={() => handleToggleTemplate(template.id)}
                              color="primary"
                            />
                          }
                          label="Active"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderRecentResponsesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline /> Recent Auto Responses
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<FilterList />} variant="outlined" sx={{ borderRadius: 10 }}>
            Filter
          </Button>
          <Button startIcon={<Refresh />} onClick={loadAutoResponseData} sx={{ borderRadius: 10 }}>
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Person />Recipient</Box></TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AutoAwesome />Template</Box></TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Schedule />Sent At</Box></TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Send />Status</Box></TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrendingUp />Converted</Box></TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Visibility />Original Tweet</Box></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sentResponses.map((response, index) => (
              <TableRow key={response.id} sx={{ bgcolor: index % 2 === 0 ? '#fafbfc' : 'white' }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                      {response.recipientHandle.slice(1, 2).toUpperCase()}
                    </Avatar>
                    {response.recipientHandle}
                  </Box>
                </TableCell>
                <TableCell>{response.template}</TableCell>
                <TableCell>{response.sentAt}</TableCell>
                <TableCell>
                  <Chip
                    label={response.status}
                    color={
                      response.status === 'delivered' ? 'success' :
                      response.status === 'failed' ? 'error' : 'warning'
                    }
                    size="small"
                    icon={
                      response.status === 'delivered' ? <CheckCircle /> :
                      response.status === 'failed' ? <Error /> : <Schedule />
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={response.converted ? 'Yes' : 'No'}
                    color={response.converted ? 'success' : 'default'}
                    size="small"
                    icon={response.converted ? <Star /> : undefined}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={response.originalTweet}>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {response.originalTweet}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Analytics /> Auto Response Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed /> Response Performance
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  Chart visualization would go here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Top Performing Templates
              </Typography>
              {templates
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 3)
                .map((template, index) => (
                  <Box key={template.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{template.name}</Typography>
                      <Typography variant="body2" color="primary">
                        {template.conversionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={template.conversionRate}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="300px" height={40} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
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
        mb: 4
      }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Reply /> Auto Response Management
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Manage automated Twitter replies, track conversions, and optimize your engagement strategy
        </Typography>
      </Box>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<AutoAwesome />} label="Templates" />
            <Tab icon={<Timeline />} label="Recent Responses" />
            <Tab icon={<Analytics />} label="Analytics" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderTemplatesTab()}
          {activeTab === 1 && renderRecentResponsesTab()}
          {activeTab === 2 && renderAnalyticsTab()}
        </Box>
      </Paper>

      {/* Template Dialog */}
      <Dialog 
        open={openTemplateDialog} 
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome />
          {editingTemplate ? 'Edit Response Template' : 'Create New Response Template'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={templateForm.name}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Response Message"
            multiline
            rows={4}
            value={templateForm.content}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
            helperText="Include your opt-in page URL to drive conversions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained"
            disabled={!templateForm.name || !templateForm.content}
            sx={{ borderRadius: 10 }}
          >
            {editingTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}