import React, { useState, useEffect } from 'react';
import { API } from '../config/api';
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Toolbar,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  Bolt as ZapIcon,
  Security as ShieldIcon,
  TrendingUp as TrendingUpIcon,
  Check as CheckIcon,
  Article as ArticleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  SmartToy as SmartToyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Build as BuildIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import axios from 'axios';
import PageTracker from '../utils/pageTracker';

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
  content_json?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const PagesPage: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; page: Page | null }>({
    open: false,
    page: null,
  });
  const [editTitle, setEditTitle] = useState<string>('');
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [contentPage, setContentPage] = useState<Page | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorTabIndex, setEditorTabIndex] = useState(0);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatApiProvider, setChatApiProvider] = useState<string>('openai');
  const [availableApis, setAvailableApis] = useState<string[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4');

  // Load apps on mount
  useEffect(() => {
    loadApps();
    loadAvailableApis();
  }, []);

  // Helper function to check if content is valid JSON
  const isValidJson = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  // Apply AI suggestion to editor and update preview live
  const handleApplySuggestion = (content: string) => {
    if (isValidJson(content)) {
      setEditorContent(JSON.stringify(JSON.parse(content), null, 2));
      setSuccess('Preview updated with AI suggestion');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('AI response is not valid JSON format');
      setTimeout(() => setError(null), 3000);
    }
  };

  // State for chat panel toggle on preview
  const [chatPanelOpen, setChatPanelOpen] = useState(true);

  // Backend Agent state
  const [agentMode, setAgentMode] = useState<'design' | 'backend'>('design');
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [backendTasks, setBackendTasks] = useState<any[]>([]);
  const [agentProgress, setAgentProgress] = useState({ completed: 0, total: 0 });

  // Track page view when editing/previewing a page
  useEffect(() => {
    if (contentEditorOpen && contentPage && selectedProjectId) {
      const tracker = new PageTracker();
      tracker.trackPageView(
        parseInt(selectedProjectId),
        contentPage.title,
        `pages/${contentPage.id}/preview`
      );
    }
  }, [contentEditorOpen, contentPage, selectedProjectId]);

  // Load pages when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadPages();
    } else {
      setPages([]);
    }
  }, [selectedProjectId]);

  // Backend Agent: analyze page tasks
  const analyzePageTasks = async () => {
    if (!contentPage || !selectedProjectId) return;
    try {
      const res = await axios.get(`${API.pageAgent}/analyze/${selectedProjectId}/${contentPage.id}`);
      if (res.data.success) {
        setBackendTasks(res.data.tasks || []);
        setAgentProgress({ completed: res.data.completedCount || 0, total: res.data.totalCount || 0 });
      }
    } catch (err) {
      console.error('Failed to analyze page:', err);
    }
  };

  // Backend Agent: send chat message
  const handleSendAgentMessage = async (directMessage?: string) => {
    const msgText = directMessage || agentInput;
    if (!msgText.trim() || !contentPage || !selectedProjectId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText,
      timestamp: new Date(),
    };
    setAgentMessages(prev => [...prev, userMsg]);
    setAgentInput('');
    setAgentLoading(true);

    try {
      const res = await axios.post(`${API.pageAgent}/chat`, {
        appId: parseInt(selectedProjectId),
        pageId: contentPage.id,
        message: msgText,
        apiProvider: chatApiProvider,
        model: chatApiProvider === 'openai' ? openaiModel : undefined,
      });

      if (res.data.success) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date(),
        };
        setAgentMessages(prev => [...prev, assistantMsg]);
        if (res.data.tasks) {
          setBackendTasks(res.data.tasks);
          const done = res.data.tasks.filter((t: any) => t.status === 'done').length;
          setAgentProgress({ completed: done, total: res.data.tasks.length });
        }
      }
    } catch (err) {
      console.error('Agent chat error:', err);
      setError('Failed to contact backend agent.');
    } finally {
      setAgentLoading(false);
    }
  };

  // Backend Agent: implement a single task
  const handleImplementTask = async (taskId: string) => {
    if (!contentPage || !selectedProjectId) return;
    setAgentLoading(true);
    try {
      const res = await axios.post(`${API.pageAgent}/implement/${selectedProjectId}/${contentPage.id}/${taskId}`);
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `${res.data.success ? '✅' : '⚠️'} ${res.data.message}`,
        timestamp: new Date(),
      };
      setAgentMessages(prev => [...prev, msg]);
      await analyzePageTasks();
    } catch (err) {
      console.error('Implement task error:', err);
    } finally {
      setAgentLoading(false);
    }
  };

  // Auto-analyze when switching to backend agent mode
  useEffect(() => {
    if (agentMode === 'backend' && contentPage && selectedProjectId) {
      analyzePageTasks();
    }
  }, [agentMode, contentPage?.id]);

  const loadAvailableApis = async () => {
    try {
      const response = await axios.get(API.apiKeys);
      if (response.data.success) {
        const apiNames = response.data.keys.map((k: any) => k.name).filter((name: string) => 
          ['openai', 'openrouter', 'make', 'zapier'].includes(name)
        );
        setAvailableApis(apiNames);
        if (apiNames.length > 0) {
          setChatApiProvider(apiNames[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !chatApiProvider) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post(API.chat, {
        message: chatInput,
        apiProvider: chatApiProvider,
        model: chatApiProvider === 'openai' ? openaiModel : undefined,
        pageContent: editorContent,
        pageTitle: contentPage?.title || '',
        pageType: contentPage?.page_type || '',
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(response.data.message || 'Chat failed');
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setError('Failed to send message. Check your API configuration.');
    } finally {
      setChatLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      console.log('Loading apps...');
      setAppLoading(true);
      const response = await axios.get(API.apps);
      const appsList = response.data?.data || response.data || [];
      console.log('Apps loaded:', appsList);
      setApps(appsList);
      setError(null);
    } catch (err) {
      console.error('Failed to load apps:', err);
      setError('Failed to load projects');
    } finally {
      setAppLoading(false);
    }
  };

  const loadPages = async () => {
    if (!selectedProjectId) return;
    try {
      console.log('Loading pages for project:', selectedProjectId);
      setLoading(true);
      const response = await axios.get(`${API.pages}?app_id=${selectedProjectId}`);
      const pagesList = response.data?.data || response.data || [];
      console.log('Pages loaded:', pagesList);
      setPages(pagesList);
      setError(null);
    } catch (err) {
      console.error('Failed to load pages:', err);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId: number) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API.pages}/${pageId}`);
      setSuccess('Page deleted successfully');
      loadPages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete page:', err);
      setError('Failed to delete page');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (page: Page) => {
    setEditTitle(page.title);
    setEditDialog({ open: true, page });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, page: null });
    setEditTitle('');
  };

  const handleSavePageTitle = async () => {
    if (!editDialog.page || !editTitle.trim()) return;

    try {
      setLoading(true);
      await axios.patch(`${API.pages}/${editDialog.page.id}`, {
        title: editTitle,
      });
      setSuccess('Page updated successfully');
      handleCloseEditDialog();
      loadPages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update page:', err);
      setError('Failed to update page');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContentEditor = (page: Page) => {
    setContentPage(page);
    setEditorContent(JSON.stringify(page.content_json || {}, null, 2));
    setContentEditorOpen(true);
    setEditorTabIndex(0);
  };

  const handleCloseContentEditor = () => {
    setContentEditorOpen(false);
    setContentPage(null);
    setEditorContent('');
    setEditorTabIndex(0);
    setChatMessages([]);
    setChatInput('');
    setChatLoading(false);
  };

  const handleSaveContent = async () => {
    if (!contentPage) return;

    try {
      setLoading(true);
      let contentJson = {};
      try {
        contentJson = JSON.parse(editorContent);
      } catch (e) {
        setError('Invalid JSON format');
        return;
      }

      await axios.patch(`${API.pages}/${contentPage.id}`, {
        content_json: contentJson,
      });
      setSuccess('Page content updated successfully');
      handleCloseContentEditor();
      loadPages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update page content:', err);
      setError('Failed to update page content');
    } finally {
      setLoading(false);
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editorContent.substring(0, start);
    const after = editorContent.substring(end);
    const newContent = before + text + after;
    setEditorContent(newContent);

    // Move cursor after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  // Render page content as visual preview
  const renderPagePreview = (content: string) => {
    try {
      const data = JSON.parse(content);

      const getIcon = (iconName: string) => {
        const iconProps = { sx: { fontSize: 32, color: '#1976d2' } };
        switch (iconName?.toLowerCase()) {
          case 'zap':
            return <ZapIcon {...iconProps} />;
          case 'shield':
            return <ShieldIcon {...iconProps} />;
          case 'trending-up':
          case 'trending_up':
            return <TrendingUpIcon {...iconProps} />;
          default:
            return null;
        }
      };

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* HERO SECTION */}
          {data.hero && (
            <Box
              sx={{
                background: data.hero.backgroundImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                p: 4,
                mb: 3,
                borderRadius: 1,
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {data.hero.headline}
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.95 }}>
                {data.hero.subheading}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" sx={{ bgcolor: '#fff', color: '#667eea', fontWeight: 'bold' }}>
                  {data.hero.primaryCta || 'Get Started'}
                </Button>
                <Button variant="outlined" sx={{ borderColor: '#fff', color: '#fff' }}>
                  {data.hero.secondaryCta || 'Learn More'}
                </Button>
              </Box>
            </Box>
          )}

          {/* HOOK SECTION */}
          {data.hook && (
            <Box sx={{ textAlign: 'center', my: 3, py: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: '#1565c0',
                  fontSize: '24px',
                  borderBottom: '3px solid #1976d2',
                  pb: 2,
                  display: 'inline-block',
                }}
              >
                {data.hook}
              </Typography>
            </Box>
          )}

          {/* FEATURES/SECTIONS - 3 Column Grid */}
          {Array.isArray(data.sections) && data.sections.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, my: 3 }}>
              {data.sections.map((section: any, idx: number) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                    border: '1px solid #e0e0e0',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  {section.icon && (
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      {getIcon(section.icon)}
                    </Box>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.7 }}>
                    {section.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}

          {/* TESTIMONIALS */}
          {Array.isArray(data.testimonials) && data.testimonials.length > 0 && (
            <Box sx={{ my: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3, color: '#333' }}>
                Loved by Teams Worldwide
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                {data.testimonials.map((testimonial: any, idx: number) => (
                  <Paper key={idx} sx={{ p: 2.5, backgroundColor: '#f9f9f9', borderLeft: '4px solid #1976d2' }}>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: '#555', lineHeight: 1.7 }}>
                      "{testimonial.quote}"
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ fontSize: '24px' }}>{testimonial.avatar}</Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
                          {testimonial.author}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                          {testimonial.title}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* PRICING */}
          {data.pricing && (
            <Box sx={{ my: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1, color: '#333' }}>
                {data.pricing.title}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mb: 3 }}>
                {data.pricing.subtitle}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                {data.pricing.plans?.map((plan: any, idx: number) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2.5,
                      backgroundColor: plan.badge ? '#e3f2fd' : '#fff',
                      border: plan.badge ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#1976d2',
                          color: '#fff',
                          px: 2,
                          py: 0.5,
                          borderRadius: 10,
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {plan.badge}
                      </Box>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                      {plan.name}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        {plan.price}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        {plan.period}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      {plan.features?.map((feature: string, fIdx: number) => (
                        <Box key={fIdx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                          <CheckIcon sx={{ fontSize: 18, color: '#4caf50', mt: 0.25 }} />
                          <Typography variant="body2" sx={{ color: '#555' }}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button variant={plan.badge ? 'contained' : 'outlined'} fullWidth sx={{ mt: 2 }}>
                      Choose Plan
                    </Button>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* FINAL CTA */}
          {data.cta && (
            <Box sx={{ p: 3, backgroundColor: '#1976d2', color: '#fff', borderRadius: 1, textAlign: 'center', mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {data.cta}
              </Typography>
              <Button variant="contained" sx={{ backgroundColor: '#fff', color: '#1976d2', fontWeight: 'bold' }}>
                {data.ctaButton || 'Get Started'}
              </Button>
            </Box>
          )}

          {/* FALLBACK - Generic content rendering */}
          {!data.hero && !data.hook && !data.sections && !data.pricing && (
            <>
              {/* Title */}
              {data.title && (
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                    {data.title}
                  </Typography>
                </Box>
              )}

              {/* Heading */}
              {data.heading && (
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                  {data.heading}
                </Typography>
              )}

              {/* Description */}
              {data.description && (
                <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.6, mb: 2 }}>
                  {data.description}
                </Typography>
              )}

              {/* Message */}
              {data.message && (
                <Paper sx={{ p: 2, backgroundColor: '#f0f4ff', borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
                    {data.message}
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      );
    } catch (error) {
      return (
        <Typography variant="body2" sx={{ color: '#d32f2f' }}>
          Invalid JSON - cannot preview
        </Typography>
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ color: '#1a1a2e', mb: 0.5 }}>
          Pages
        </Typography>
        <Typography variant="body1" sx={{ color: '#888', lineHeight: 1.7 }}>
          View and manage all pages across your projects.
        </Typography>
      </Box>

      {/* Alerts */}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Project Selector */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
        <FormControl fullWidth>
          <InputLabel id="project-select-label">Select Project</InputLabel>
          <Select
            labelId="project-select-label"
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            label="Select Project"
            disabled={appLoading}
          >
            <MenuItem value="">-- Choose a project --</MenuItem>
            {appLoading && (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
              </MenuItem>
            )}
            {!appLoading && apps.map((app) => (
              <MenuItem key={`app-${app.id}`} value={String(app.id)}>
                {app.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Pages Table */}
      {selectedProjectId && (
        <Paper elevation={0} sx={{ mb: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.1rem' }}>
              Pages {loading && <CircularProgress size={18} sx={{ ml: 1.5 }} />}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPages}
              disabled={loading}
              sx={{ borderColor: '#e0e0e0', color: '#666', '&:hover': { borderColor: '#667eea', color: '#667eea', bgcolor: '#f8f8ff' } }}
            >
              Refresh
            </Button>
          </Box>

          {pages.length === 0 && !loading && (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <ArticleIcon sx={{ fontSize: 48, color: '#ddd', mb: 1.5 }} />
              <Typography variant="body1" sx={{ color: '#999', mb: 0.5 }}>No pages found</Typography>
              <Typography variant="body2" sx={{ color: '#bbb' }}>Pages will appear here once templates are applied</Typography>
            </Box>
          )}

          {pages.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id} sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>{page.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={page.page_type}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {page.created_at ? new Date(page.created_at).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Content">
                          <IconButton size="small" onClick={() => handleOpenContentEditor(page)} disabled={loading} sx={{ color: '#667eea', '&:hover': { bgcolor: '#f0f0ff' } }}>
                            <CodeIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Title">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(page)} disabled={loading} sx={{ color: '#888', '&:hover': { bgcolor: '#f5f5f5' } }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeletePage(page.id)} disabled={loading} sx={{ color: '#e74c3c', '&:hover': { bgcolor: '#fef0ef' } }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>Edit Page Title</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#888' }}>
            Page Type: <Chip label={editDialog.page?.page_type} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea', ml: 0.5 }} />
          </Typography>
          <TextField
            fullWidth
            label="Page Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Enter page title"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseEditDialog} sx={{ color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePageTitle} disabled={loading || !editTitle.trim()} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content Editor Dialog — Preview + Chat side-by-side */}
      <Dialog
        open={contentEditorOpen}
        onClose={handleCloseContentEditor}
        maxWidth={false}
        fullWidth
        PaperProps={{ sx: { maxHeight: '95vh', height: '90vh', width: '95vw', maxWidth: '1400px', m: 1 } }}
      >
        {/* Top bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.05rem' }}>
                {contentPage?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={contentPage?.page_type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#eef0ff', color: '#667eea' }} />
                <Typography variant="caption" sx={{ color: '#aaa' }}>Live Preview + AI Chat</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Tab toggle: Preview & Chat vs JSON Editor */}
            <Tabs
              value={editorTabIndex}
              onChange={(_e, newValue) => setEditorTabIndex(newValue)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', color: '#888', py: 0.5, px: 2 },
                '& .Mui-selected': { color: '#667eea !important' },
                '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 3, borderRadius: '3px 3px 0 0' },
              }}
            >
              <Tab icon={<VisibilityIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Preview & Chat" />
              <Tab icon={<CodeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="JSON Editor" />
            </Tabs>
            <IconButton size="small" onClick={handleCloseContentEditor} sx={{ color: '#888', ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />

        {/* ── Tab 0: Preview + Chat side-by-side ── */}
        {editorTabIndex === 0 && (
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100% - 120px)' }}>
            {/* Left: Page Preview */}
            <Box sx={{ flex: chatPanelOpen ? '1 1 60%' : '1 1 100%', bgcolor: '#e8eaed', display: 'flex', justifyContent: 'center', overflow: 'auto', p: 2, transition: 'flex 0.3s' }}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '900px',
                  bgcolor: '#fff',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content',
                  minHeight: '500px',
                }}
              >
                {/* Browser chrome */}
                <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1.25, borderBottom: '1px solid #d0d0d0', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Box sx={{ display: 'flex', gap: 0.6 }}>
                    <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                    <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                    <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#27c93f' }} />
                  </Box>
                  <Box sx={{ flex: 1, p: 0.6, bgcolor: '#fff', borderRadius: '6px', border: '1px solid #ddd', ml: 1 }}>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
                      https://your-app.com/{contentPage?.page_type || ''}
                    </Typography>
                  </Box>
                  {!chatPanelOpen && (
                    <Tooltip title="Open AI Chat">
                      <IconButton size="small" onClick={() => setChatPanelOpen(true)} sx={{ color: '#667eea' }}>
                        <SmartToyIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {/* Rendered preview */}
                <Box sx={{ p: 3, overflow: 'auto', bgcolor: '#fff', flexGrow: 1 }}>
                  {renderPagePreview(editorContent)}
                </Box>
              </Box>
            </Box>

            {/* Right: Chat Panel */}
            {chatPanelOpen && (
              <Box
                sx={{
                  flex: '0 0 380px',
                  minWidth: 340,
                  maxWidth: 420,
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '1px solid #e0e0e0',
                  bgcolor: '#fafbfc',
                }}
              >
                {/* Agent mode toggle header */}
                <Box sx={{ px: 1, py: 0.75, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tabs
                    value={agentMode === 'design' ? 0 : 1}
                    onChange={(_e, v) => setAgentMode(v === 0 ? 'design' : 'backend')}
                    sx={{
                      minHeight: 34,
                      '& .MuiTab-root': { minHeight: 34, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', py: 0.25, px: 1.5, minWidth: 0 },
                      '& .Mui-selected': { color: agentMode === 'design' ? '#667eea !important' : '#e67e22 !important' },
                      '& .MuiTabs-indicator': { background: agentMode === 'design' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)', height: 3, borderRadius: '3px 3px 0 0' },
                    }}
                  >
                    <Tab icon={<SmartToyIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Design" />
                    <Tab icon={<BuildIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Backend" />
                  </Tabs>
                  <IconButton size="small" onClick={() => setChatPanelOpen(false)} sx={{ color: '#bbb' }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                {/* ═══ DESIGN AGENT PANEL ═══ */}
                {agentMode === 'design' && (
                  <>
                    {/* API Provider selector */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel id="api-provider-label">Provider</InputLabel>
                        <Select
                          labelId="api-provider-label"
                          value={chatApiProvider}
                          onChange={(e) => setChatApiProvider(e.target.value)}
                          label="Provider"
                          disabled={availableApis.length === 0 || chatLoading}
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {availableApis.map((api) => (
                            <MenuItem key={api} value={api}>
                              {api.charAt(0).toUpperCase() + api.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {chatApiProvider === 'openai' && (
                        <FormControl size="small" sx={{ flex: 1 }}>
                          <InputLabel id="model-label">Model</InputLabel>
                          <Select
                            labelId="model-label"
                            value={openaiModel}
                            onChange={(e) => setOpenaiModel(e.target.value)}
                            label="Model"
                            disabled={chatLoading}
                            sx={{ fontSize: '0.85rem' }}
                          >
                            <MenuItem value="gpt-4">GPT-4</MenuItem>
                            <MenuItem value="gpt-4-turbo-preview">GPT-4 Turbo</MenuItem>
                            <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>

                    {availableApis.length === 0 && (
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Alert severity="warning" sx={{ fontSize: '0.75rem', py: 0 }}>
                          No API keys configured. Go to Settings to add keys.
                        </Alert>
                      </Box>
                    )}

                    {/* Design chat messages */}
                    <Box
                      sx={{
                        flex: 1,
                        overflow: 'auto',
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                      }}
                    >
                      {chatMessages.length === 0 ? (
                        <Box sx={{ m: 'auto', textAlign: 'center', py: 4 }}>
                          <SmartToyIcon sx={{ fontSize: 40, color: '#ddd', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>Chat about this page</Typography>
                          <Typography variant="caption" sx={{ color: '#bbb', lineHeight: 1.5 }}>
                            Ask the AI to change headlines, add sections, update pricing, or restyle the page. Changes appear in the preview instantly.
                          </Typography>
                        </Box>
                      ) : (
                        chatMessages.map((msg) => {
                          const isJson = msg.role === 'assistant' && isValidJson(msg.content);
                          return (
                            <Box
                              key={msg.id}
                              sx={{
                                p: 1.5,
                                backgroundColor: msg.role === 'user' ? '#e8f0fe' : '#fff',
                                border: msg.role === 'user' ? '1px solid #d0ddf7' : '1px solid #e8e8e8',
                                borderRadius: 2,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {msg.role === 'assistant' && <AutoFixHighIcon sx={{ fontSize: 14, color: '#667eea' }} />}
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role === 'user' ? '#5a7bbf' : '#667eea' }}>
                                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                  </Typography>
                                </Box>
                                {isJson && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AutoFixHighIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => handleApplySuggestion(msg.content)}
                                    sx={{
                                      fontSize: '0.7rem',
                                      py: 0.25,
                                      px: 1.5,
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
                                    }}
                                  >
                                    Apply to Preview
                                  </Button>
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.82rem', lineHeight: 1.6, color: '#333' }}>
                                {isJson ? 'New page content ready — click "Apply to Preview" to see changes.' : msg.content}
                              </Typography>
                            </Box>
                          );
                        })
                      )}
                      {chatLoading && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: '#f5f0ff', borderRadius: 2, border: '1px solid #e8dff5' }}>
                          <CircularProgress size={16} sx={{ color: '#667eea' }} />
                          <Typography variant="caption" sx={{ color: '#764ba2', fontWeight: 600 }}>Generating changes...</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Design chat input */}
                    <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder='e.g. "Change the headline to..."'
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendChatMessage();
                            }
                          }}
                          disabled={chatLoading || availableApis.length === 0}
                          multiline
                          maxRows={3}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' } }}
                        />
                        <IconButton
                          onClick={handleSendChatMessage}
                          disabled={chatLoading || !chatInput.trim() || availableApis.length === 0}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            borderRadius: 2,
                            width: 40,
                            height: 40,
                            '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
                            '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                          }}
                        >
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}

                {/* ═══ BACKEND AGENT PANEL ═══ */}
                {agentMode === 'backend' && (
                  <>
                    {/* Progress bar */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.75rem' }}>Backend Readiness</Typography>
                        <Chip
                          label={`${agentProgress.completed}/${agentProgress.total}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: agentProgress.completed === agentProgress.total && agentProgress.total > 0 ? '#e8f5e9' : '#fff3e0',
                            color: agentProgress.completed === agentProgress.total && agentProgress.total > 0 ? '#2e7d32' : '#e65100',
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={agentProgress.total > 0 ? (agentProgress.completed / agentProgress.total) * 100 : 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': { background: 'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)', borderRadius: 3 },
                        }}
                      />
                    </Box>

                    {/* Task list */}
                    {backendTasks.length > 0 && (
                      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f0f0f0', maxHeight: 200, overflow: 'auto', '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: 3 } }}>
                        {backendTasks.map((task: any) => (
                          <Box
                            key={task.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.75,
                              borderBottom: '1px solid #f8f8f8',
                              '&:last-child': { borderBottom: 'none' },
                            }}
                          >
                            {task.status === 'done' ? (
                              <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            ) : (
                              <PendingIcon sx={{ fontSize: 16, color: '#e0e0e0' }} />
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: task.status === 'done' ? '#999' : '#1a1a2e', fontSize: '0.72rem', display: 'block', lineHeight: 1.3, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                {task.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#bbb', fontSize: '0.65rem' }}>
                                {task.category} · {task.priority}
                              </Typography>
                            </Box>
                            {task.status !== 'done' && task.implementation && (
                              <Tooltip title="Auto-implement this task">
                                <IconButton
                                  size="small"
                                  onClick={() => handleImplementTask(task.id)}
                                  disabled={agentLoading}
                                  sx={{ color: '#e67e22', '&:hover': { bgcolor: '#fff3e0' } }}
                                >
                                  <PlayArrowIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Agent chat messages */}
                    <Box
                      sx={{
                        flex: 1,
                        overflow: 'auto',
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                      }}
                    >
                      {agentMessages.length === 0 ? (
                        <Box sx={{ m: 'auto', textAlign: 'center', py: 3 }}>
                          <BuildIcon sx={{ fontSize: 36, color: '#e0e0e0', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#999', mb: 0.5, fontSize: '0.85rem' }}>Backend Agent</Typography>
                          <Typography variant="caption" sx={{ color: '#bbb', lineHeight: 1.5, display: 'block', mb: 1.5 }}>
                            Ask what backend work this page needs, or implement tasks to make the page fully functional.
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendAgentMessage('What backend tasks does this page need?')}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: '#e67e22', color: '#e67e22', '&:hover': { bgcolor: '#fff8f0', borderColor: '#d35400' } }}
                            >
                              🔍 Analyze this page
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSendAgentMessage('Implement all auto tasks')}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: '#e67e22', color: '#e67e22', '&:hover': { bgcolor: '#fff8f0', borderColor: '#d35400' } }}
                            >
                              ⚡ Implement all auto-tasks
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        agentMessages.map((msg) => (
                          <Box
                            key={msg.id}
                            sx={{
                              p: 1.5,
                              backgroundColor: msg.role === 'user' ? '#fef3e8' : '#fff',
                              border: msg.role === 'user' ? '1px solid #f5d5b0' : '1px solid #e8e8e8',
                              borderRadius: 2,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              {msg.role === 'assistant' && <BuildIcon sx={{ fontSize: 14, color: '#e67e22' }} />}
                              <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role === 'user' ? '#bf6c1a' : '#e67e22' }}>
                                {msg.role === 'user' ? 'You' : 'Backend Agent'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', lineHeight: 1.6, color: '#333' }}>
                              {msg.content}
                            </Typography>
                          </Box>
                        ))
                      )}
                      {agentLoading && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #f5d5b0' }}>
                          <CircularProgress size={16} sx={{ color: '#e67e22' }} />
                          <Typography variant="caption" sx={{ color: '#d35400', fontWeight: 600 }}>Working...</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Agent chat input */}
                    <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder='e.g. "What needs done?" or "Implement all"'
                          value={agentInput}
                          onChange={(e) => setAgentInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendAgentMessage();
                            }
                          }}
                          disabled={agentLoading}
                          multiline
                          maxRows={3}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' } }}
                        />
                        <IconButton
                          onClick={() => handleSendAgentMessage()}
                          disabled={agentLoading || !agentInput.trim()}
                          sx={{
                            background: 'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)',
                            color: '#fff',
                            borderRadius: 2,
                            width: 40,
                            height: 40,
                            '&:hover': { background: 'linear-gradient(135deg, #d35400 0%, #c0392b 100%)' },
                            '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                          }}
                        >
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── Tab 1: JSON Editor ── */}
        {editorTabIndex === 1 && (
          <DialogContent sx={{ pt: 2, overflow: 'auto', flex: 1 }}>
            <Toolbar
              variant="dense"
              sx={{ display: 'flex', gap: 0.5, mb: 2, backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, flexWrap: 'wrap' }}
            >
              <Typography variant="body2" sx={{ width: '100%', mb: 1, fontWeight: 'bold' }}>Quick Formats:</Typography>
              <IconButton size="small" onClick={() => insertTextAtCursor('**bold text**')} title="Bold"><FormatBoldIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => insertTextAtCursor('*italic text*')} title="Italic"><FormatItalicIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => insertTextAtCursor('~~strikethrough~~')} title="Strikethrough"><FormatUnderlinedIcon fontSize="small" /></IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small" onClick={() => insertTextAtCursor('- List item\n')} title="Bullet List"><FormatListBulletedIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => insertTextAtCursor('1. Numbered item\n')} title="Numbered List"><FormatListNumberedIcon fontSize="small" /></IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small" onClick={() => insertTextAtCursor('```\ncode block\n```')} title="Code Block"><CodeIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => insertTextAtCursor('[link text](url)')} title="Link"><LinkIcon fontSize="small" /></IconButton>
            </Toolbar>
            <TextField
              id="content-editor"
              fullWidth
              multiline
              rows={28}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Enter JSON content here..."
              sx={{
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: '#f9f9f9',
                '& .MuiOutlinedInput-root': { fontFamily: 'monospace' },
              }}
            />
          </DialogContent>
        )}

        {/* Bottom actions */}
        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#bbb' }}>
            {editorTabIndex === 0 ? 'Chat with AI to modify the page, then save.' : 'Edit raw JSON directly.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCloseContentEditor} sx={{ color: '#888' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveContent}
              disabled={loading}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}
            >
              Save Content
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PagesPage;
