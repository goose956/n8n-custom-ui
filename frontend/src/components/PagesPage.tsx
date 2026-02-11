import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import axios from 'axios';

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

  // Apply AI suggestion to editor
  const handleApplySuggestion = (content: string) => {
    if (isValidJson(content)) {
      setEditorContent(JSON.stringify(JSON.parse(content), null, 2));
      setSuccess('Page updated with AI suggestion');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('AI response is not valid JSON format');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Load pages when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadPages();
    } else {
      setPages([]);
    }
  }, [selectedProjectId]);

  const loadAvailableApis = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/api-keys');
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
      const response = await axios.post('http://localhost:3000/api/chat', {
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
      const response = await axios.get('http://localhost:3000/api/apps');
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
      const response = await axios.get(`http://localhost:3000/api/pages?app_id=${selectedProjectId}`);
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
      await axios.delete(`http://localhost:3000/api/pages/${pageId}`);
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
      await axios.patch(`http://localhost:3000/api/pages/${editDialog.page.id}`, {
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

      await axios.patch(`http://localhost:3000/api/pages/${contentPage.id}`, {
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Pages Manager
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
          View and manage all pages across your projects.
        </Typography>
      </Box>

      {/* Alerts */}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Project Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
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
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Pages {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPages}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {pages.length === 0 && !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#999' }}>
                No pages found for this project
              </Typography>
            </Box>
          )}

          {pages.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Updated</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id} hover>
                      <TableCell>{page.title}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            backgroundColor: '#e3f2fd',
                            borderRadius: 1,
                            color: '#1976d2',
                            fontWeight: 500,
                          }}
                        >
                          {page.page_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {page.created_at ? new Date(page.created_at).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<CodeIcon />}
                          onClick={() => handleOpenContentEditor(page)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                          variant="outlined"
                        >
                          Content
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(page)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeletePage(page.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
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
        <DialogTitle>Edit Page Title</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Page Type: <strong>{editDialog.page?.page_type}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Page Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Enter page title"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePageTitle} disabled={loading || !editTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content Editor Dialog */}
      <Dialog open={contentEditorOpen} onClose={handleCloseContentEditor} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <Box>
            <Typography variant="h6">Edit Page Content</Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              {contentPage?.title} ({contentPage?.page_type})
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseContentEditor}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />

        {/* Editor Tabs */}
        <Tabs value={editorTabIndex} onChange={(_e, newValue) => setEditorTabIndex(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="JSON Editor" />
          <Tab label="Preview" />
          <Tab label="Chat Assistant" />
        </Tabs>

        <DialogContent sx={{ pt: 2, display: editorTabIndex === 0 ? 'block' : 'none', maxHeight: '70vh', overflow: 'auto' }}>
          {/* Formatting Toolbar */}
          <Toolbar
            variant="dense"
            sx={{
              display: 'flex',
              gap: 0.5,
              mb: 2,
              backgroundColor: '#f5f5f5',
              p: 1,
              borderRadius: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" sx={{ width: '100%', mb: 1, fontWeight: 'bold' }}>
              Quick Formats:
            </Typography>
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('**bold text**')}
              title="Bold"
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('*italic text*')}
              title="Italic"
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('~~strikethrough~~')}
              title="Strikethrough"
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('- List item\n')}
              title="Bullet List"
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('1. Numbered item\n')}
              title="Numbered List"
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('```\ncode block\n```')}
              title="Code Block"
            >
              <CodeIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => insertTextAtCursor('[link text](url)')}
              title="Link"
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Toolbar>

          {/* JSON Editor */}
          <TextField
            id="content-editor"
            fullWidth
            multiline
            rows={24}
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="Enter JSON content here..."
            sx={{
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: '#f9f9f9',
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
              },
            }}
          />
        </DialogContent>

        {/* Preview Tab */}
        {editorTabIndex === 1 && (
          <DialogContent sx={{ p: 1, bgcolor: '#e0e0e0', display: 'flex', justifyContent: 'center', maxHeight: '70vh', overflow: 'auto' }}>
            {/* Browser Frame */}
            <Box
              sx={{
                width: '100%',
                maxWidth: '800px',
                bgcolor: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                m: 1.5,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
              }}
            >
              {/* Browser Header */}
              <Box
                sx={{
                  bgcolor: '#f5f5f5',
                  p: 1.5,
                  borderBottom: '1px solid #d0d0d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      bgcolor: '#ff5f56',
                    }}
                  />
                  <Box
                    sx={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      bgcolor: '#ffbd2e',
                    }}
                  />
                  <Box
                    sx={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      bgcolor: '#27c93f',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 0.75,
                    bgcolor: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    ml: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    {contentPage?.title || 'Page Preview'}
                  </Typography>
                </Box>
              </Box>

              {/* Page Content */}
              <Box
                sx={{
                  p: 3,
                  overflow: 'auto',
                  backgroundColor: '#fff',
                  flexGrow: 1,
                  minHeight: '400px',
                  maxHeight: 'calc(70vh - 100px)',
                  '&::-webkit-scrollbar': {
                    width: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: '#888',
                    borderRadius: '4px',
                    '&:hover': {
                      bgcolor: '#555',
                    },
                  },
                }}
              >
                {renderPagePreview(editorContent)}
              </Box>
            </Box>
          </DialogContent>
        )}

        {/* Chat Assistant Tab */}
        {editorTabIndex === 2 && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="api-provider-label">API Provider</InputLabel>
                <Select
                  labelId="api-provider-label"
                  id="api-provider-select"
                  value={chatApiProvider}
                  onChange={(e) => setChatApiProvider(e.target.value)}
                  label="API Provider"
                  disabled={availableApis.length === 0 || chatLoading}
                >
                  {availableApis.map((api) => (
                    <MenuItem key={api} value={api}>
                      {api.charAt(0).toUpperCase() + api.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {chatApiProvider === 'openai' && (
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="model-label">Model</InputLabel>
                  <Select
                    labelId="model-label"
                    id="model-select"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    label="Model"
                    disabled={chatLoading}
                  >
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-4-turbo-preview">GPT-4 Turbo</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  </Select>
                </FormControl>
              )}

              {availableApis.length === 0 && (
                <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                  No API keys configured. Go to Settings to add API keys.
                </Typography>
              )}
            </Box>

            {/* Chat Messages */}
            <Paper
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                mb: 2,
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {chatMessages.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#999', m: 'auto' }}>
                  Start a conversation about your page content...
                </Typography>
              ) : (
                chatMessages.map((msg) => {
                  const isJson = msg.role === 'assistant' && isValidJson(msg.content);
                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                        borderLeft: `4px solid ${msg.role === 'user' ? '#1976d2' : '#666'}`,
                        borderRadius: 0.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
                          {msg.role === 'user' ? 'You' : 'Assistant'}
                        </Typography>
                        {isJson && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleApplySuggestion(msg.content)}
                            sx={{ ml: 1 }}
                          >
                            Apply to Editor
                          </Button>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {isJson ? JSON.stringify(JSON.parse(msg.content), null, 2) : msg.content}
                      </Typography>
                    </Box>
                  );
                })
              )}
              {chatLoading && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Waiting for response...
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Chat Input */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about your page content..."
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
              />
              <Button
                variant="contained"
                onClick={handleSendChatMessage}
                disabled={chatLoading || !chatInput.trim() || availableApis.length === 0}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Send
              </Button>
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseContentEditor}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveContent} disabled={loading}>
            Save Content
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PagesPage;
