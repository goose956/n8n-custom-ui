===FILE: frontend/src/components/members/twitter-automation-/automation-rules.tsx===
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  Skeleton,
  Avatar,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Automation,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Schedule,
  ContentCopy,
  Reply,
  TrendingUp,
  FilterList,
  Settings,
  Speed,
  Timeline,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  Code,
  SmartToy,
  AccessTime,
  Group,
  Category,
  Public,
  Analytics
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:3000' 
  : '';

interface AutomationRule {
  id: string;
  name: string;
  type: 'content-scraping' | 'tweet-generation' | 'reply-automation' | 'posting-schedule' | 'conditional-logic';
  status: 'active' | 'paused' | 'error';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  lastTriggered: string;
  successRate: number;
  executionCount: number;
  createdAt: string;
}

interface AutomationCondition {
  field: string;
  operator: string;
  value: string;
}

interface AutomationAction {
  type: string;
  parameters: Record<string, any>;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  type: 'content-scraping' | 'tweet-generation' | 'reply-automation' | 'posting-schedule' | 'conditional-logic';
  icon: React.ReactNode;
  defaultConditions: AutomationCondition[];
  defaultActions: AutomationAction[];
}

interface RuleMetrics {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  averageSuccessRate: number;
  todayExecutions: number;
  errorCount: number;
}

export function MembersAutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState<RuleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const ruleTemplates: RuleTemplate[] = [
    {
      id: 'content-scraper',
      name: 'Content Scraping Schedule',
      description: 'Automatically scrape content from specified sources on a schedule',
      type: 'content-scraping',
      icon: <ContentCopy />,
      defaultConditions: [{ field: 'time', operator: 'daily_at', value: '09:00' }],
      defaultActions: [{ type: 'scrape_sources', parameters: { sources: ['tech-blogs', 'industry-news'] } }]
    },
    {
      id: 'tweet-generator',
      name: 'Tweet Generation Rules',
      description: 'Generate tweets based on scraped content with custom parameters',
      type: 'tweet-generation',
      icon: <SmartToy />,
      defaultConditions: [{ field: 'scraped_content', operator: 'has_new', value: 'true' }],
      defaultActions: [{ type: 'generate_tweets', parameters: { count: 5, tone: 'professional' } }]
    },
    {
      id: 'auto-reply',
      name: 'Auto Reply Trigger',
      description: 'Automatically respond to mentions and replies with opt-in links',
      type: 'reply-automation',
      icon: <Reply />,
      defaultConditions: [{ field: 'mention_type', operator: 'equals', value: 'reply' }],
      defaultActions: [{ type: 'send_auto_reply', parameters: { template: 'ebook-offer' } }]
    },
    {
      id: 'posting-schedule',
      name: 'Smart Posting Schedule',
      description: 'Post tweets at optimal times based on audience engagement',
      type: 'posting-schedule',
      icon: <Schedule />,
      defaultConditions: [{ field: 'queue_size', operator: 'greater_than', value: '0' }],
      defaultActions: [{ type: 'post_tweet', parameters: { timing: 'optimal' } }]
    },
    {
      id: 'content-filter',
      name: 'Content Category Filter',
      description: 'Apply different rules based on content type and audience segments',
      type: 'conditional-logic',
      icon: <FilterList />,
      defaultConditions: [{ field: 'content_category', operator: 'equals', value: 'technology' }],
      defaultActions: [{ type: 'apply_template', parameters: { template: 'tech-focused' } }]
    }
  ];

  const fetchData = useCallback(async () => {
    try {
      const [rulesResponse, metricsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/automation/rules`),
        fetch(`${API_BASE}/api/automation/metrics`)
      ]);

      const rulesData = await rulesResponse.json();
      const metricsData = await metricsResponse.json();

      setRules(rulesData || mockRules);
      setMetrics(metricsData || mockMetrics);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      setRules(mockRules);
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRule = async (ruleId: string, active: boolean) => {
    try {
      await fetch(`${API_BASE}/api/automation/rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });

      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: active ? 'active' : 'paused' }
          : rule
      ));

      setSnackbar({
        open: true,
        message: `Rule ${active ? 'activated' : 'paused'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update rule status',
        severity: 'error'
      });
    }
  };

  const handleCreateRule = async (template: RuleTemplate) => {
    try {
      const newRule = {
        name: template.name,
        type: template.type,
        conditions: template.defaultConditions,
        actions: template.defaultActions
      };

      const response = await fetch(`${API_BASE}/api/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });

      const createdRule = await response.json();
      
      setRules(prev => [...prev, createdRule]);
      setCreateDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Automation rule created successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create automation rule',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'paused': return <Pause />;
      case 'error': return <Error />;
      default: return <CheckCircle />;
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'content-scraping': return <ContentCopy />;
      case 'tweet-generation': return <SmartToy />;
      case 'reply-automation': return <Reply />;
      case 'posting-schedule': return <Schedule />;
      case 'conditional-logic': return <FilterList />;
      default: return <Automation />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', 
          borderRadius: 3, 
          p: 4, 
          mb: 4, 
          color: 'white' 
        }}>
          <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.2)', mt: 1 }} />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
                  <Skeleton variant="text" width="80%" height={32} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  const filteredRules = selectedTab === 0 
    ? rules 
    : rules.filter(rule => {
        const tabTypes = [
          'content-scraping',
          'tweet-generation', 
          'reply-automation',
          'posting-schedule',
          'conditional-logic'
        ];
        return rule.type === tabTypes[selectedTab - 1];
      });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', 
        borderRadius: 3, 
        p: 4, 
        mb: 4, 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Automation sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Automation Rules
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Configure workflows for content scraping, tweet generation & auto-replies
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                borderRadius: 2
              }}
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Rule
            </Button>
            <Button
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)', 
                color: 'white',
                '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
                borderRadius: 2
              }}
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }} />
      </Box>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <Automation />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Total Rules
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {metrics.totalRules}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#27ae60', mr: 2 }}>
                    <PlayArrow />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Active Rules
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#27ae60' }}>
                  {metrics.activeRules}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#f39c12', mr: 2 }}>
                    <Speed />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Today's Runs
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f39c12' }}>
                  {metrics.todayExecutions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#9b59b6', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#9b59b6' }}>
                  {metrics.averageSuccessRate}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.averageSuccessRate} 
                  sx={{ mt: 1, bgcolor: 'rgba(155,89,182,0.1)' }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#e74c3c', mr: 2 }}>
                    <Error />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Errors Today
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#e74c3c' }}>
                  {metrics.errorCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for Rule Categories */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
        mb: 3
      }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          <Tab icon={<Automation />} label="All Rules" />
          <Tab icon={<ContentCopy />} label="Content Scraping" />
          <Tab icon={<SmartToy />} label="Tweet Generation" />
          <Tab icon={<Reply />} label="Auto Replies" />
          <Tab icon={<Schedule />} label="Posting Schedule" />
          <Tab icon={<FilterList />} label="Conditional Logic" />
        </Tabs>
      </Card>

      {/* Rules List */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: 0 }}>
          {filteredRules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Automation sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Automation Rules Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first automation rule to start streamlining your Twitter workflow
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Create Your First Rule
              </Button>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbfc' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Settings sx={{ mr: 1, fontSize: 16 }} />
                      Rule Name
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Category sx={{ mr: 1, fontSize: 16 }} />
                      Type
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ mr: 1, fontSize: 16 }} />
                      Status
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Analytics sx={{ mr: 1, fontSize: 16 }} />
                      Success Rate
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                      Last Triggered
                    </Box>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow 
                    key={rule.id}
                    sx={{ 
                      '&:hover': { bgcolor: '#fafbfc' },
                      borderBottom: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: '#1976d2', width: 32, height: 32 }}>
                          {getRuleTypeIcon(rule.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {rule.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rule.executionCount} executions
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRuleTypeIcon(rule.type)}
                        label={rule.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(rule.status)}
                        label={rule.status}
                        color={getStatusColor(rule.status) as any}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                          {rule.successRate}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={rule.successRate} 
                          sx={{ width: 60, height: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(rule.lastTriggered).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rule.status === 'active'}
                              onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <IconButton size="small" onClick={() => setEditRule(rule)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{ mr: 2 }} />
            Create New Automation Rule
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a template to get started with your automation rule
          </Typography>
          <Grid container spacing={2}>
            {ruleTemplates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card sx={{ 
                  cursor: 'pointer',
                  transition: '0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  },
                  borderRadius: 3
                }}>
                  <CardContent onClick={() => handleCreateRule(template)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                        {template.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
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
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Mock data for development
const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Daily Content Scraping',
    type: 'content-scraping',
    status: 'active',
    conditions: [{ field: 'time', operator: 'daily_at', value: '09:00' }],
    actions: [{ type: 'scrape_sources', parameters: { sources: ['tech-blogs'] } }],
    lastTriggered: '2024-01-15T09:00:00Z',
    successRate: 95,
    executionCount: 47,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'AI Tweet Generator',
    type: 'tweet-generation',
    status: 'active',
    conditions: [{ field: 'scraped_content', operator: 'has_new', value: 'true' }],
    actions: [{ type: 'generate_tweets', parameters: { count: 3 } }],
    lastTriggered: '2024-01-15T10:30:00Z',
    successRate: 88,
    executionCount: 124,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Ebook Offer Replies',
    type: 'reply-automation',
    status: 'active',
    conditions: [{ field: 'mention_type', operator: 'equals', value: 'reply' }],
    actions: [{ type: 'send_auto_reply', parameters: { template: 'ebook-offer' } }],
    lastTriggered: '2024-01-15T14:22:00Z',
    successRate: 92,
    executionCount: 78,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Prime Time Posting',
    type: 'posting-schedule',
    status: 'paused',
    conditions: [{ field: 'time', operator: 'daily_at', value: '18:00' }],
    actions: [{ type: 'post_tweet', parameters: { source: 'queue' } }],
    lastTriggered: '2024-01-14T18:00:00Z',
    successRate: 97,
    executionCount: 28,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {