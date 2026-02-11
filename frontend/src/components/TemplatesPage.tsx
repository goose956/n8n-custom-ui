import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Rating,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Checkbox,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Home as HomeIcon,
  ThumbUp as ThumbUpIcon,
  Group as GroupIcon,
  ShoppingCart as ShoppingCartIcon,
  AdminPanelSettings as AdminIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Template {
  id: string;
  type: 'index' | 'thanks' | 'members' | 'checkout' | 'admin';
  title: string;
  description: string;
  iconType: 'home' | 'thumbup' | 'group' | 'cart' | 'admin';
  features: string[];
  rating: number;
  category: string;
}

interface App {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Page {
  id: number;
  app_id: number;
  page_type: string;
  title: string;
}

const templates: Template[] = [
  {
    id: '1',
    type: 'index',
    title: 'Home Page',
    description: 'Professional landing page to showcase your product or service',
    iconType: 'home',
    features: ['Hero section', 'Feature highlights', 'Call-to-action buttons', 'Responsive layout'],
    rating: 4.8,
    category: 'Marketing',
  },
  {
    id: '2',
    type: 'thanks',
    title: 'Thank You Page',
    description: 'Confirmation page shown after successful user actions or signups',
    iconType: 'thumbup',
    features: ['Success message', 'Confirmation details', 'Navigation links', 'Email notification'],
    rating: 4.9,
    category: 'Conversion',
  },
  {
    id: '3',
    type: 'members',
    title: 'Members Area',
    description: 'Exclusive dashboard and content area for authenticated members',
    iconType: 'group',
    features: ['User dashboard', 'Subscription info', 'Content access', 'Profile management'],
    rating: 4.7,
    category: 'Authentication',
  },
  {
    id: '4',
    type: 'checkout',
    title: 'Checkout/Upgrade',
    description: 'Smooth payment and upgrade flows to maximize conversions',
    iconType: 'cart',
    features: ['Plan comparison', 'Payment form', 'Security badges', 'Money-back guarantee'],
    rating: 4.6,
    category: 'Payments',
  },
  {
    id: '5',
    type: 'admin',
    title: 'Admin Dashboard',
    description: 'Powerful admin interface for managing your platform',
    iconType: 'admin',
    features: ['Analytics dashboard', 'User management', 'Revenue tracking', 'System monitoring'],
    rating: 4.5,
    category: 'Management',
  },
];

interface PreviewDialogState {
  open: boolean;
  template: Template | null;
}

interface ConfirmDialogState {
  open: boolean;
  selectedProject: App | null;
  selectedTemplates: Template[];
  existingPages: Page[];
}

const getTemplateIcon = (iconType: string): React.ReactNode => {
  const iconProps = { fontSize: 40 };
  switch (iconType) {
    case 'home':
      return <HomeIcon sx={{ ...iconProps, color: '#3498db' }} />;
    case 'thumbup':
      return <ThumbUpIcon sx={{ ...iconProps, color: '#27ae60' }} />;
    case 'group':
      return <GroupIcon sx={{ ...iconProps, color: '#9b59b6' }} />;
    case 'cart':
      return <ShoppingCartIcon sx={{ ...iconProps, color: '#e74c3c' }} />;
    case 'admin':
      return <AdminIcon sx={{ ...iconProps, color: '#34495e' }} />;
    default:
      return <HomeIcon sx={{ ...iconProps }} />;
  }
};

const PreviewContent: React.FC<{ template: Template }> = ({ template }) => {
  switch (template.type) {
    case 'index':
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
            Welcome to Our Platform
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            Build amazing applications with our intuitive interface. Get started in minutes, not days.
          </Typography>
          <Button variant="contained" sx={{ mb: 2, mr: 1 }}>
            Get Started
          </Button>
          <Button variant="outlined">Learn More</Button>
          <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Fast</Typography>
              <Typography variant="body2">Lightning quick</Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Secure</Typography>
              <Typography variant="body2">Bank-grade security</Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Simple</Typography>
              <Typography variant="body2">Easy to use</Typography>
            </Paper>
          </Box>
        </Box>
      );
    case 'thanks':
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: '#27ae60' }} />
          </Box>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
            Thank You!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            Your submission has been received. We'll be in touch shortly.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
            Confirmation email sent to: user@example.com
          </Typography>
          <Button variant="contained" sx={{ mr: 1 }}>
            Back Home
          </Button>
          <Button variant="outlined">View Dashboard</Button>
        </Box>
      );
    case 'members':
      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Welcome Back, Member!
            </Typography>
            <Avatar sx={{ bgcolor: '#9b59b6' }}>JD</Avatar>
          </Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Your Plan
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Premium
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Subscription Expires
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  March 15, 2026
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <List>
            <ListItem>
              <ListItemIcon>
                <StarIcon sx={{ color: '#f39c12' }} />
              </ListItemIcon>
              <ListItemText
                primary="Exclusive Content"
                secondary="Access all premium resources and tutorials"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon sx={{ color: '#27ae60' }} />
              </ListItemIcon>
              <ListItemText primary="Priority Support" secondary="Get answers from our expert team" />
            </ListItem>
          </List>
        </Box>
      );
    case 'checkout':
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
            Upgrade Your Plan
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Current Plan
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Free
                </Typography>
                <Chip label="$0/month" color="default" />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#e8f5e9', border: '2px solid #27ae60' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#27ae60' }}>
                  Pro Plan
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  All features included
                </Typography>
                <Chip label="$29/month" color="success" />
              </Paper>
            </Grid>
          </Grid>
          <TextField fullWidth label="Card Number" placeholder="1234 5678 9012 3456" sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="MM/YY" placeholder="12/25" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CVC" placeholder="123" />
            </Grid>
          </Grid>
          <Button variant="contained" fullWidth size="large" sx={{ backgroundColor: '#e74c3c' }}>
            Upgrade Now - $29/month
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: '#666' }}>
            Secure payment processing. Cancel anytime.
          </Typography>
        </Box>
      );
    case 'admin':
      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">1,234</Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Users
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#27ae60' }}>
                $12.5K
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Revenue
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#e74c3c' }}>
                24
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Issues
              </Typography>
            </Paper>
          </Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="New subscription from John Doe"
                  secondary="2 hours ago"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="System alert: CPU usage at 75%"
                  secondary="1 hour ago"
                  primaryTypographyProps={{ variant: 'body2', sx: { color: '#e74c3c' } }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Backup completed successfully"
                  secondary="30 minutes ago"
                  primaryTypographyProps={{ variant: 'body2', sx: { color: '#27ae60' } }}
                />
              </ListItem>
            </List>
          </Paper>
        </Box>
      );
    default:
      return null;
  }
};

export const TemplatesPage: React.FC = () => {
  const [previewDialog, setPreviewDialog] = useState<PreviewDialogState>({ open: false, template: null });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<{ [key: string]: boolean }>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    selectedProject: null,
    selectedTemplates: [],
    existingPages: [],
  });

  // Load apps on component mount
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      console.log('Loading apps from http://localhost:3000/api/apps');
      setAppLoading(true);
      const response = await axios.get('http://localhost:3000/api/apps');
      console.log('Response from API:', response.data);
      const appsList = response.data?.data || response.data || [];
      console.log('Apps loaded successfully:', appsList);
      console.log('Apps count:', appsList.length);
      setApps(appsList);
      setError(null);
    } catch (err) {
      console.error('Failed to load apps:', err);
      setError('Failed to load projects. Please check the backend is running.');
    } finally {
      setAppLoading(false);
    }
  };

  const handleOpenPreview = (template: Template) => {
    setPreviewDialog({ open: true, template });
  };

  const handleClosePreview = () => {
    setPreviewDialog({ open: false, template: null });
  };

  const handleTemplateSelect = (templateId: string) => {
    try {
      setSelectedTemplateIds((prev) => {
        const updated = {
          ...prev,
          [templateId]: !prev[templateId],
        };
        console.log('Template selection updated:', templateId, updated[templateId]);
        return updated;
      });
    } catch (err) {
      console.error('Error selecting template:', err);
    }
  };

  const getSelectedTemplateCount = () => {
    return Object.values(selectedTemplateIds).filter(Boolean).length;
  };

  const handleSaveToProject = async () => {
    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    const selectedCount = getSelectedTemplateCount();
    if (selectedCount === 0) {
      setError('Please select at least one template');
      return;
    }

    try {
      setLoading(true);
      const projectId = parseInt(selectedProjectId, 10);
      const project = apps.find((a) => a.id === projectId);
      if (!project) {
        setError('Selected project not found');
        return;
      }

      // Get existing pages for this project
      const existingResponse = await axios.get(`http://localhost:3000/api/pages?app_id=${projectId}`);
      const existingPages = existingResponse.data?.data || existingResponse.data || [];

      // Get selected template objects
      const selectedTemplates = templates.filter((t) => selectedTemplateIds[t.id]);

      // Show confirmation dialog with warnings
      setConfirmDialog({
        open: true,
        selectedProject: project,
        selectedTemplates,
        existingPages,
      });

      setError(null);
    } catch (err) {
      console.error('Failed to check existing pages:', err);
      setError('Failed to check existing pages');
    } finally {
      setLoading(false);
    }
  };

  const getOverwriteWarnings = (): string[] => {
    const warnings: string[] = [];
    const existingPageTypes = new Set(confirmDialog.existingPages.map((p) => p.page_type));

    confirmDialog.selectedTemplates.forEach((template) => {
      if (existingPageTypes.has(template.type)) {
        const existingPage = confirmDialog.existingPages.find((p) => p.page_type === template.type);
        warnings.push(`"${template.title}" will overwrite existing page "${existingPage?.title}"`);
      }
    });

    return warnings;
  };

  const handleConfirmSave = async () => {
    if (!confirmDialog.selectedProject) return;

    try {
      setLoading(true);

      // Create pages for each selected template
      for (const template of confirmDialog.selectedTemplates) {
        await axios.post('http://localhost:3000/api/pages', {
          app_id: confirmDialog.selectedProject.id,
          page_type: template.type,
          title: template.title,
          content_json: {
            description: template.description,
            features: template.features,
          },
        });
      }

      setSuccess(
        `Successfully added ${confirmDialog.selectedTemplates.length} template(s) to "${confirmDialog.selectedProject.name}"`
      );
      setSelectedTemplateIds({});
      setSelectedProjectId('');
      setConfirmDialog({ open: false, selectedProject: null, selectedTemplates: [], existingPages: [] });

      // Clear success message after 4 seconds
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to save templates:', err);
      setError('Failed to save templates to project');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({ open: false, selectedProject: null, selectedTemplates: [], existingPages: [] });
  };

  const overwriteWarnings = getOverwriteWarnings();
  const selectedCount = getSelectedTemplateCount();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Page Templates
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
          Choose from professionally designed templates for your SaaS application. Customize them to match your brand.
        </Typography>
      </Box>

      {/* Success/Error Alerts */}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Selection Bar */}
      {selectedCount > 0 && apps && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: '#e3f2fd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {selectedCount} template(s) selected
          </Typography>

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="project-select-label">Select project</InputLabel>
            <Select
              labelId="project-select-label"
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => {
                console.log('Project selected:', e.target.value);
                setSelectedProjectId(e.target.value);
              }}
              label="Select project"
              disabled={appLoading || apps.length === 0}
            >
              {appLoading && (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                </MenuItem>
              )}
              {!appLoading && apps.length === 0 && (
                <MenuItem disabled>No projects available</MenuItem>
              )}
              {!appLoading && apps.length > 0 && apps.map((app) => (
                <MenuItem key={`app-${app.id}`} value={String(app.id)}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                console.log('Clearing selections');
                setSelectedTemplateIds({});
                setSelectedProjectId('');
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveToProject}
              disabled={loading || !selectedProjectId}
            >
              Save to Project
            </Button>
          </Box>
        </Paper>
      )}

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                border: selectedTemplateIds[template.id] ? '2px solid #2196f3' : '1px solid #e0e0e0',
                backgroundColor: selectedTemplateIds[template.id] ? '#f0f7ff' : 'white',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                },
              }}
            >
              {/* Card Header with Icon and Checkbox */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>{getTemplateIcon(template.iconType)}</Box>
                  <Chip label={template.category} size="small" variant="outlined" />
                </Box>
                <Checkbox
                  checked={!!selectedTemplateIds[template.id]}
                  onChange={() => handleTemplateSelect(template.id)}
                />
              </Box>

              {/* Card Content */}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {template.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  {template.description}
                </Typography>

                {/* Features List */}
                <Box sx={{ mb: 2 }}>
                  {template.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#27ae60', mr: 1 }} />
                      <Typography variant="caption">{feature}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={Math.round(template.rating * 2) / 2} readOnly size="small" />
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    {template.rating}
                  </Typography>
                </Box>
              </CardContent>

              {/* Card Actions */}
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => handleOpenPreview(template)}
                >
                  Preview
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          {previewDialog.template?.title} - Live Preview
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {previewDialog.template && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
              }}
            >
              <PreviewContent template={previewDialog.template} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button variant="contained">
            <DownloadIcon sx={{ mr: 1 }} />
            Download Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog with Overwrite Warnings */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Confirm Save to Project
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              Ready to add {confirmDialog.selectedTemplates.length} template(s) to{' '}
              <strong>"{confirmDialog.selectedProject?.name}"</strong>.
            </Typography>

            {overwriteWarnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  <WarningIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                  The following pages will be overwritten:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {overwriteWarnings.map((warning, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      • {warning}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Templates to be added:
            </Typography>
            <List dense>
              {confirmDialog.selectedTemplates.map((template) => (
                <ListItem key={template.id}>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: '#27ae60' }} />
                  </ListItemIcon>
                  <ListItemText primary={template.title} secondary={template.description} />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseConfirm} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleConfirmSave} disabled={loading}>
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TemplatesPage;
