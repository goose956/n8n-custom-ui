import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
  AvatarGroup,
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
  Stack,
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
  RocketLaunch as RocketIcon,
  Speed as SpeedIcon,
  Brush as BrushIcon,

  ArrowForward as ArrowForwardIcon,
  Bolt as BoltIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Template {
  id: string;
  type: 'index' | 'thanks' | 'members' | 'checkout' | 'admin';
  title: string;
  description: string;
  longDescription: string;
  iconType: 'home' | 'thumbup' | 'group' | 'cart' | 'admin';
  features: string[];
  rating: number;
  reviews: number;
  category: string;
  image: string;
  gradient: string;
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

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Founder & CEO',
    company: 'LaunchPad SaaS',
    avatar: 'https://i.pravatar.cc/80?img=47',
    quote:
      'These templates saved us weeks of development time. We launched our SaaS product in just 3 days instead of the 2 months we originally planned. The attention to detail is remarkable.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Head of Product',
    company: 'ScaleUp Inc.',
    avatar: 'https://i.pravatar.cc/80?img=68',
    quote:
      'The checkout and members area templates are incredibly well-designed. Our conversion rate increased by 34% after switching to these templates. Highly recommend for any SaaS builder.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Full-Stack Developer',
    company: 'DevStudio',
    avatar: 'https://i.pravatar.cc/80?img=45',
    quote:
      'As a developer, I appreciate the clean code structure and how easy these templates are to customise. The admin dashboard template alone would have taken me weeks to build from scratch.',
    rating: 4,
  },
  {
    name: 'David Park',
    role: 'CTO',
    company: 'CloudMetrics',
    avatar: 'https://i.pravatar.cc/80?img=60',
    quote:
      'We use these templates across all our client projects. The consistent design language and built-in responsive layouts make our delivery process so much faster and more reliable.',
    rating: 5,
  },
];

const templates: Template[] = [
  {
    id: '1',
    type: 'index',
    title: 'Home Page',
    description: 'Professional landing page to showcase your product or service',
    longDescription:
      'A beautifully crafted landing page template designed to captivate visitors from the first scroll. Includes a striking hero section with animated gradients, feature showcases with iconography, social proof elements, and strategically placed call-to-action buttons that drive conversions.',
    iconType: 'home',
    features: ['Hero section with CTA', 'Feature highlights grid', 'Social proof & logos', 'Responsive layout'],
    rating: 4.8,
    reviews: 2847,
    category: 'Marketing',
    image: 'https://picsum.photos/seed/homepage-saas/600/340',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: '2',
    type: 'thanks',
    title: 'Thank You Page',
    description: 'Confirmation page shown after successful user actions or signups',
    longDescription:
      'Turn post-conversion moments into engagement opportunities. This thank you page template features clear confirmation messaging, next-step guidance, email verification prompts, and optional upsell sections — keeping users engaged right after they commit.',
    iconType: 'thumbup',
    features: ['Animated success state', 'Smart next steps', 'Email confirmation', 'Upsell section'],
    rating: 4.9,
    reviews: 1523,
    category: 'Conversion',
    image: 'https://picsum.photos/seed/thankyou-saas/600/340',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  {
    id: '3',
    type: 'members',
    title: 'Members Area',
    description: 'Exclusive dashboard and content area for authenticated members',
    longDescription:
      'Give your users a premium experience with this members-only dashboard. Includes personalised greeting, subscription status, content library access, activity feed, and profile management — everything needed for a world-class membership experience.',
    iconType: 'group',
    features: ['Personalised dashboard', 'Subscription management', 'Content library', 'Profile & settings'],
    rating: 4.7,
    reviews: 1891,
    category: 'Authentication',
    image: 'https://picsum.photos/seed/members-saas/600/340',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    id: '4',
    type: 'checkout',
    title: 'Checkout & Upgrade',
    description: 'Smooth payment and upgrade flows to maximise conversions',
    longDescription:
      'Maximise revenue with a frictionless checkout experience. This template includes side-by-side plan comparison, trust badges, secure payment form with live validation, money-back guarantee messaging, and optimised mobile layout for on-the-go purchases.',
    iconType: 'cart',
    features: ['Plan comparison table', 'Secure payment form', 'Trust & security badges', '30-day guarantee'],
    rating: 4.6,
    reviews: 2134,
    category: 'Payments',
    image: 'https://picsum.photos/seed/checkout-saas/600/340',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: '5',
    type: 'admin',
    title: 'Admin Dashboard',
    description: 'Powerful admin interface for managing your platform',
    longDescription:
      'Take full control of your platform with this feature-rich admin dashboard. Real-time analytics charts, user management tables, revenue tracking widgets, system health monitoring, and activity logs — all the tools you need to run a successful SaaS business.',
    iconType: 'admin',
    features: ['Real-time analytics', 'User management', 'Revenue tracking', 'System monitoring'],
    rating: 4.5,
    reviews: 1678,
    category: 'Management',
    image: 'https://picsum.photos/seed/admin-saas/600/340',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
    <Box sx={{ backgroundColor: '#fafbfc', minHeight: '100vh' }}>
      {/* ===== HERO SECTION ===== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          color: 'white',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          px: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ color: '#ffd700 !important' }} />}
              label="Production-Ready Templates"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                px: 1,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              Launch Your SaaS
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                In Record Time
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 5,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 400,
                lineHeight: 1.7,
                fontSize: { xs: '1rem', md: '1.2rem' },
                maxWidth: 640,
                mx: 'auto',
              }}
            >
              Stop building from scratch. Our professionally designed page templates let you
              go from idea to live product in hours, not months. Every template is fully customisable,
              responsive, and optimised for conversions.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 6 }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={() => {
                  document.getElementById('templates-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Templates
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                View Demo
              </Button>
            </Stack>

            {/* Social Proof Avatars */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 36, height: 36, border: '2px solid #302b63' } }}>
                <Avatar src="https://i.pravatar.cc/40?img=1" />
                <Avatar src="https://i.pravatar.cc/40?img=2" />
                <Avatar src="https://i.pravatar.cc/40?img=3" />
                <Avatar src="https://i.pravatar.cc/40?img=4" />
                <Avatar src="https://i.pravatar.cc/40?img=5" />
              </AvatarGroup>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  Trusted by 2,400+ builders
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} sx={{ fontSize: 14, color: '#ffd700' }} />
                  ))}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', ml: 0.5 }}>
                    4.9/5 average rating
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ===== STATS BAR ===== */}
      <Container maxWidth="lg" sx={{ mt: -5, mb: 6, position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          }}
        >
          <Grid container>
            {[
              { value: '5', label: 'Page Templates', icon: <BrushIcon sx={{ fontSize: 28, color: '#667eea' }} /> },
              { value: '10K+', label: 'Apps Launched', icon: <RocketIcon sx={{ fontSize: 28, color: '#27ae60' }} /> },
              { value: '99.9%', label: 'Uptime SLA', icon: <SpeedIcon sx={{ fontSize: 28, color: '#f39c12' }} /> },
              { value: '< 2min', label: 'Setup Time', icon: <BoltIcon sx={{ fontSize: 28, color: '#e74c3c' }} /> },
            ].map((stat, idx) => (
              <Grid
                item
                xs={6}
                md={3}
                key={idx}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRight: idx < 3 ? { md: '1px solid #f0f0f0' } : 'none',
                  borderBottom: idx < 2 ? { xs: '1px solid #f0f0f0', md: 'none' } : 'none',
                }}
              >
                <Box sx={{ mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Success/Error Alerts */}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* ===== SELECTION BAR ===== */}
        {selectedCount > 0 && apps && (
          <Paper
            elevation={4}
            sx={{
              p: 2.5,
              mb: 4,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
              borderRadius: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              border: '1px solid rgba(33, 150, 243, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36 }}>
                <CheckCircleIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                {selectedCount} template{selectedCount > 1 ? 's' : ''} selected
              </Typography>
            </Box>

            <FormControl sx={{ minWidth: 240 }} size="small">
              <InputLabel id="project-select-label">Assign to project</InputLabel>
              <Select
                labelId="project-select-label"
                id="project-select"
                value={selectedProjectId}
                onChange={(e) => {
                  console.log('Project selected:', e.target.value);
                  setSelectedProjectId(e.target.value);
                }}
                label="Assign to project"
                disabled={appLoading || apps.length === 0}
                sx={{ backgroundColor: 'white', borderRadius: 2 }}
              >
                {appLoading && (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                  </MenuItem>
                )}
                {!appLoading && apps.length === 0 && <MenuItem disabled>No projects available</MenuItem>}
                {!appLoading &&
                  apps.length > 0 &&
                  apps.map((app) => (
                    <MenuItem key={`app-${app.id}`} value={String(app.id)}>
                      {app.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedTemplateIds({});
                  setSelectedProjectId('');
                }}
                sx={{ borderRadius: 2 }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveToProject}
                disabled={loading || !selectedProjectId}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #219a52 0%, #27ae60 100%)' },
                }}
              >
                Save to Project
              </Button>
            </Box>
          </Paper>
        )}

        {/* ===== SECTION HEADER ===== */}
        <Box id="templates-grid" sx={{ textAlign: 'center', mb: 5, scrollMarginTop: '80px' }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#1a1a2e', mb: 1.5, letterSpacing: '-0.01em' }}
          >
            Choose Your Perfect Template
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: '#666', maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}
          >
            Each template is built with best practices in UX design, conversion optimisation,
            and responsive layouts. Select the pages you need and deploy them to any project.
          </Typography>
        </Box>

        {/* ===== TEMPLATES GRID ===== */}
        <Grid container spacing={4}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: selectedTemplateIds[template.id]
                    ? '2px solid #667eea'
                    : '1px solid rgba(0,0,0,0.06)',
                  backgroundColor: selectedTemplateIds[template.id] ? '#f5f3ff' : 'white',
                  boxShadow: selectedTemplateIds[template.id]
                    ? '0 8px 30px rgba(102, 126, 234, 0.2)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                  },
                }}
              >
                {/* Card Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={template.image}
                    alt={template.title}
                    sx={{
                      objectFit: 'cover',
                      filter: 'brightness(0.95)',
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.style.background = template.gradient;
                        parent.style.height = '180px';
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                      }
                    }}
                  />
                  {/* Overlay gradient */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Category chip on image */}
                  <Chip
                    label={template.category}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      letterSpacing: '0.03em',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  {/* Checkbox on image */}
                  <Checkbox
                    checked={!!selectedTemplateIds[template.id]}
                    onChange={() => handleTemplateSelect(template.id)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      color: 'rgba(255,255,255,0.8)',
                      '&.Mui-checked': { color: '#667eea' },
                      bgcolor: 'rgba(0,0,0,0.2)',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.35)' },
                    }}
                  />
                  {/* Template icon */}
                  <Avatar
                    sx={{
                      position: 'absolute',
                      bottom: -20,
                      left: 20,
                      width: 44,
                      height: 44,
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '3px solid white',
                    }}
                  >
                    {getTemplateIcon(template.iconType)}
                  </Avatar>
                </Box>

                {/* Card Content */}
                <CardContent sx={{ flexGrow: 1, pt: 4, px: 2.5, pb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a2e', fontSize: '1.05rem' }}>
                    {template.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: '#777', lineHeight: 1.6 }}>
                    {template.description}
                  </Typography>

                  {/* Features */}
                  <Box sx={{ mb: 2 }}>
                    {template.features.map((feature, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 0.75,
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 15, color: '#27ae60', mr: 0.75, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#555' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 'auto' }}>
                    <Rating value={Math.round(template.rating * 2) / 2} readOnly size="small" />
                    <Typography variant="caption" sx={{ color: '#999', fontWeight: 600 }}>
                      {template.rating}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#bbb' }}>
                      ({template.reviews.toLocaleString()} reviews)
                    </Typography>
                  </Box>
                </CardContent>

                {/* Card Actions */}
                <CardActions sx={{ px: 2.5, pb: 2, pt: 0.5, gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => handleOpenPreview(template)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#667eea',
                    }}
                  >
                    Live Preview
                  </Button>
                  <Button
                    size="small"
                    variant={selectedTemplateIds[template.id] ? 'contained' : 'outlined'}
                    onClick={() => handleTemplateSelect(template.id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      ml: 'auto',
                      ...(selectedTemplateIds[template.id]
                        ? {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
                          }
                        : {
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': { borderColor: '#5a6fd6', backgroundColor: '#f5f3ff' },
                          }),
                    }}
                  >
                    {selectedTemplateIds[template.id] ? 'Selected ✓' : 'Select'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ===== TESTIMONIALS SECTION ===== */}
        <Box sx={{ mt: 10, mb: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              label="What Our Users Say"
              sx={{
                mb: 2,
                bgcolor: '#f5f3ff',
                color: '#667eea',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            />
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#1a1a2e', mb: 1.5, letterSpacing: '-0.01em' }}
            >
              Loved by Builders Worldwide
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}>
              Join thousands of entrepreneurs, developers, and agencies who ship faster
              with our templates.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {testimonials.map((testimonial, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                      borderColor: 'transparent',
                    },
                  }}
                >
                  {/* Stars */}
                  <Box sx={{ mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} sx={{ fontSize: 18, color: '#ffd700' }} />
                    ))}
                  </Box>

                  {/* Quote */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#444',
                      lineHeight: 1.75,
                      mb: 3,
                      fontSize: '0.92rem',
                      fontStyle: 'italic',
                      position: 'relative',
                    }}
                  >
                    "{testimonial.quote}"
                  </Typography>

                  {/* Author */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      sx={{ width: 44, height: 44, border: '2px solid #f0f0f0' }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {testimonial.role} · {testimonial.company}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ===== BOTTOM CTA ===== */}
        <Box
          sx={{
            mt: 8,
            mb: 4,
            p: { xs: 4, md: 6 },
            borderRadius: 5,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(102,126,234,0.3), transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, mb: 2, position: 'relative', fontSize: { xs: '1.5rem', md: '2.2rem' } }}
          >
            Ready to Build Something Amazing?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              mb: 4,
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.7,
              position: 'relative',
            }}
          >
            Select your templates above, assign them to a project, and start customising.
            Your next great product is just a few clicks away.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<RocketIcon />}
            onClick={() => {
              document.getElementById('templates-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.05rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              position: 'relative',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Get Started Now
          </Button>
        </Box>
      </Container>

      {/* ===== PREVIEW DIALOG ===== */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {previewDialog.template && getTemplateIcon(previewDialog.template.iconType)}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {previewDialog.template?.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Live Preview
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh', overflow: 'auto', px: 3 }}>
          {previewDialog.template && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#555', mb: 3, lineHeight: 1.7 }}>
                {previewDialog.template.longDescription}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#fafbfc',
                  border: '1px solid #e8e8e8',
                  borderRadius: 3,
                }}
              >
                <PreviewContent template={previewDialog.template} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClosePreview} sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
            }}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== CONFIRMATION DIALOG ===== */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 3 }}>Confirm Save to Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              Ready to add {confirmDialog.selectedTemplates.length} template(s) to{' '}
              <strong>"{confirmDialog.selectedProject?.name}"</strong>.
            </Typography>

            {overwriteWarnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
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

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseConfirm} disabled={loading} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmSave}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesPage;
