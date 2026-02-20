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
  Skeleton,
  Divider,
  LinearProgress,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CampaignOutlined,
  TrendingUp,
  TrendingDown,
  Email,
  PeopleAlt,
  Analytics,
  Edit,
  Visibility,
  Add,
  Download,
  Link,
  Assessment,
  AutoAwesome,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  MoreVert,
  OpenInNew,
  Timeline,
  Speed,
  Science,
  Integration,
  Share,
  FileCopy
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

interface OptInPage {
  id: string;
  name: string;
  url: string;
  ebookTitle: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  conversions: number;
  visitors: number;
  conversionRate: number;
  isABTest: boolean;
  variant?: 'A' | 'B';
}

interface EmailIntegration {
  id: string;
  name: string;
  platform: 'mailchimp' | 'convertkit' | 'aweber' | 'activecampaign';
  status: 'connected' | 'disconnected' | 'error';
  subscriberCount: number;
  lastSync: string;
}

interface ConversionStats {
  totalOptIns: number;
  totalOptInsChange: number;
  avgConversionRate: number;
  avgConversionRateChange: number;
  autoResponseOptIns: number;
  autoResponseOptInsChange: number;
  emailSubscribers: number;
  emailSubscribersChange: number;
}

interface ABTestResult {
  id: string;
  testName: string;
  variantA: {
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  };
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  winner?: 'A' | 'B';
}

export function MembersOptInManagementPage() {
  const [loading, setLoading] = useState(true);
  const [optInPages, setOptInPages] = useState<OptInPage[]>([]);
  const [emailIntegrations, setEmailIntegrations] = useState<EmailIntegration[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats>({
    totalOptIns: 0,
    totalOptInsChange: 0,
    avgConversionRate: 0,
    avgConversionRateChange: 0,
    autoResponseOptIns: 0,
    autoResponseOptInsChange: 0,
    emailSubscribers: 0,
    emailSubscribersChange: 0
  });
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [createPageDialogOpen, setCreatePageDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchOptInData();
  }, []);

  const fetchOptInData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConversionStats({
        totalOptIns: 1247,
        totalOptInsChange: 12.5,
        avgConversionRate: 18.7,
        avgConversionRateChange: -2.1,
        autoResponseOptIns: 834,
        autoResponseOptInsChange: 8.9,
        emailSubscribers: 2156,
        emailSubscribersChange: 15.3
      });

      setOptInPages([
        {
          id: '1',
          name: 'Twitter Growth Masterclass',
          url: 'https://twitter-auto.app/opt-in/growth-masterclass',
          ebookTitle: 'The Ultimate Twitter Growth Guide',
          description: 'Complete guide to growing your Twitter following with automation',
          status: 'active',
          createdAt: '2024-01-15',
          conversions: 342,
          visitors: 1847,
          conversionRate: 18.5,
          isABTest: false
        },
        {
          id: '2',
          name: 'Content Automation Secrets',
          url: 'https://twitter-auto.app/opt-in/content-secrets',
          ebookTitle: 'Twitter Content Automation Playbook',
          description: 'Learn how to automate your Twitter content creation process',
          status: 'active',
          createdAt: '2024-01-20',
          conversions: 187,
          visitors: 923,
          conversionRate: 20.3,
          isABTest: true,
          variant: 'A'
        },
        {
          id: '3',
          name: 'Content Automation Secrets B',
          url: 'https://twitter-auto.app/opt-in/content-secrets-b',
          ebookTitle: 'Twitter Content Automation Playbook',
          description: 'Learn how to automate your Twitter content creation process (Variant B)',
          status: 'active',
          createdAt: '2024-01-20',
          conversions: 162,
          visitors: 891,
          conversionRate: 18.2,
          isABTest: true,
          variant: 'B'
        }
      ]);

      setEmailIntegrations([
        {
          id: '1',
          name: 'Twitter Growth List',
          platform: 'mailchimp',
          status: 'connected',
          subscriberCount: 1247,
          lastSync: '2024-01-25T10:30:00Z'
        },
        {
          id: '2',
          name: 'Content Automation Subscribers',
          platform: 'convertkit',
          status: 'connected',
          subscriberCount: 892,
          lastSync: '2024-01-25T09:15:00Z'
        }
      ]);

      setAbTestResults([
        {
          id: '1',
          testName: 'Content Automation Landing Page',
          variantA: {
            name: 'Original Headline',
            visitors: 923,
            conversions: 187,
            conversionRate: 20.3
          },
          variantB: {
            name: 'Benefit-Focused Headline',
            visitors: 891,
            conversions: 162,
            conversionRate: 18.2
          },
          status: 'running',
          startDate: '2024-01-20',
          winner: 'A'
        }
      ]);

    } catch (error) {
      console.error('Error fetching opt-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = () => {
    setSnackbarMessage('New opt-in page created successfully!');
    setSnackbarOpen(true);
    setCreatePageDialogOpen(false);
    fetchOptInData();
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSnackbarMessage('Opt-in URL copied to clipboard!');
    setSnackbarOpen(true);
  };

  const StatCard = ({ title, value, change, icon, color = '#1976d2' }: {
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
      borderRadius: 3,
      '&:hover': {
        transform: 'translateY(-2px)',
        transition: '0.2s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {change > 0 ? (
              <TrendingUp sx={{ color: '#27ae60', mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: '#e74c3c', mr: 0.5 }} />
            )}
            <Typography variant="body2" color={change > 0 ? '#27ae60' : '#e74c3c'} fontWeight={600}>
              {change > 0 ? '+' : ''}{change}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={700} color="textPrimary">
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 3
        }}>
          <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Skeleton variant="text" width={500} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 1 }} />
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} />
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
        borderRadius: 3,
        mb: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CampaignOutlined sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700}>
              Opt-in Management
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Manage your ebook opt-in pages from Twitter auto-responses and track conversion performance
          </Typography>
        </Box>
        <Box sx={{ 
          position: 'absolute',
          right: -50,
          top: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 1
        }} />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Opt-ins"
            value={conversionStats.totalOptIns.toLocaleString()}
            change={conversionStats.totalOptInsChange}
            icon={<PeopleAlt />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Conversion Rate"
            value={`${conversionStats.avgConversionRate}%`}
            change={conversionStats.avgConversionRateChange}
            icon={<TrendingUp />}
            color="#27ae60"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Auto-Response Opt-ins"
            value={conversionStats.autoResponseOptIns.toLocaleString()}
            change={conversionStats.autoResponseOptInsChange}
            icon={<AutoAwesome />}
            color="#f39c12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Email Subscribers"
            value={conversionStats.emailSubscribers.toLocaleString()}
            change={conversionStats.emailSubscribersChange}
            icon={<Email />}
            color="#9b59b6"
          />
        </Grid>
      </Grid>

      {/* Opt-in Pages */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link sx={{ mr: 2, color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Active Opt-in Pages
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreatePageDialogOpen(true)}
            sx={{ 
              bgcolor: '#1976d2',
              borderRadius: 2,
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Create New Page
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, fontSize: 18 }} />
                    Page Details
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Visibility sx={{ mr: 1, fontSize: 18 }} />
                    Visitors
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ mr: 1, fontSize: 18 }} />
                    Conversions
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Speed sx={{ mr: 1, fontSize: 18 }} />
                    Conversion Rate
                  </Box>
                </TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {optInPages.map((page, index) => (
                <TableRow 
                  key={page.id}
                  sx={{ 
                    bgcolor: index % 2 === 0 ? '#fafbfc' : 'white',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {page.name}
                        {page.isABTest && (
                          <Chip 
                            label={`Variant ${page.variant}`}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {page.ebookTitle}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Created: {new Date(page.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight={600}>
                      {page.visitors.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight={600} color="#1976d2">
                      {page.conversions.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="h6" 
                      fontWeight={600}
                      color={page.conversionRate > 15 ? '#27ae60' : page.conversionRate > 10 ? '#f39c12' : '#e74c3c'}
                    >
                      {page.conversionRate}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={page.status}
                      color={page.status === 'active' ? 'success' : page.status === 'paused' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Copy URL">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyUrl(page.url)}
                          sx={{ color: '#1976d2' }}
                        >
                          <FileCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Page">
                        <IconButton 
                          size="small"
                          component="a"
                          href={page.url}
                          target="_blank"
                          sx={{ color: '#27ae60' }}
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Page">
                        <IconButton size="small" sx={{ color: '#f39c12' }}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* A/B Test Results */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Science sx={{ mr: 2, color: '#1976d2' }} />
          <Typography variant="h6" fontWeight={600}>
            A/B Test Results
          </Typography>
        </Box>

        {abTestResults.map((test) => (
          <Card key={test.id} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {test.testName}
                </Typography>
                <Chip
                  label={test.status}
                  color={test.status === 'running' ? 'primary' : test.status === 'completed' ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: test.winner === 'A' ? '#27ae6015' : '#f5f5f5', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Variant A: {test.variantA.name}
                      </Typography>
                      {test.winner === 'A' && (
                        <Chip label="Winner" color="success" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Visitors: {test.variantA.visitors.toLocaleString()}</Typography>
                      <Typography variant="body2">Conversions: {test.variantA.conversions}</Typography>
                    </Box>
                    <Typography variant="h6" color="#1976d2" fontWeight={600}>
                      {test.variantA.conversionRate}% conversion rate
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: test.winner === 'B' ? '#27ae6015' : '#f5f5f5', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Variant B: {test.variantB.name}
                      </Typography>
                      {test.winner === 'B' && (
                        <Chip label="Winner" color="success" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Visitors: {test.variantB.visitors.toLocaleString()}</Typography>
                      <Typography variant="body2">Conversions: {test.variantB.conversions}</Typography>
                    </Box>
                    <Typography variant="h6" color="#1976d2" fontWeight={600}>
                      {test.variantB.conversionRate}% conversion rate
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Paper>

      {/* Email Integrations */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Integration sx={{ mr: 2, color: '#1976d2' }} />
          <Typography variant="h6" fontWeight={600}>
            Email Marketing Integrations
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {emailIntegrations.map((integration) => (
            <Grid item xs={12} md={6} key={integration.id}>
              <Card sx={{ 
                borderRadius: 3,
                border: `2px solid ${integration.status === 'connected' ? '#27ae60' : '#e74c3c'}20`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: '0.2s'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2, width: 40, height: 40 }}>
                        <Email />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {integration.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" textTransform="capitalize">
                          {integration.platform}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={integration.status}
                      color={integration.status === 'connected' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Subscribers
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="#1976d2">
                      {integration.subscriberCount.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary">
                    Last synced: {new Date(integration.lastSync).toLocaleString()}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Refresh />}
                      sx={{ mr: 1 }}
                    >
                      Sync Now
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Edit />}
                      color="primary"
                    >
                      Configure
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Create Page Dialog */}
      <Dialog 
        open={createPageDialogOpen} 
        onClose={() => setCreatePageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{ mr: 1 }} />
            Create New Opt-in Page
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Page Name"
              placeholder="e.g., Twitter Growth Masterclass"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Ebook Title"
              placeholder="e.g., The Ultimate Twitter Growth Guide"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="Describe what visitors will learn from your ebook"
              sx={{ mb: 3 }}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Email Integration</InputLabel>
              <Select defaultValue="">
                <MenuItem value="mailchimp">Mailchimp - Twitter Growth List</MenuItem>
                <MenuItem value="convertkit">ConvertKit - Content Automation</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch />}
              label="Enable A/B Testing"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePage}>
            Create Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}