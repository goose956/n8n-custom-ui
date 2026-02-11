import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface App {
  id: number;
  name: string;
  slug: string;
  description?: string;
  primary_color?: string;
  created_at: string;
  updated_at: string;
}

interface CreateAppDto {
  name: string;
  slug: string;
  description?: string;
  primary_color?: string;
}

export function ProjectsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [appToDelete, setAppToDelete] = useState<App | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateAppDto>({
    name: '',
    slug: '',
    description: '',
    primary_color: '#1976d2',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3000/api/apps');
      if (response.data.success) {
        setApps(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (app?: App) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        name: app.name,
        slug: app.slug,
        description: app.description || '',
        primary_color: app.primary_color || '#1976d2',
      });
    } else {
      setEditingApp(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        primary_color: '#1976d2',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingApp(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      primary_color: '#1976d2',
    });
  };

  const handleSaveApp = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      setSuccess(null);

      if (editingApp) {
        // Update app
        const response = await axios.put(
          `http://localhost:3000/api/apps/${editingApp.id}`,
          formData
        );
        if (response.data.success) {
          setSuccess('Project updated successfully');
          await loadApps();
          handleCloseDialog();
        } else {
          setError(response.data.message || 'Failed to update project');
        }
      } else {
        // Create new app
        const response = await axios.post('http://localhost:3000/api/apps', formData);
        if (response.data.success) {
          setSuccess('Project created successfully');
          await loadApps();
          handleCloseDialog();
        } else {
          setError(response.data.message || 'Failed to create project');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (app: App) => {
    setAppToDelete(app);
    setDeleteConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.delete(`http://localhost:3000/api/apps/${appToDelete.id}`);
      if (response.data.success) {
        setSuccess('Project deleted successfully');
        await loadApps();
        setDeleteConfirmDialog(false);
        setAppToDelete(null);
      } else {
        setError(response.data.message || 'Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#1a1a2e', mb: 0.5 }}>
              Projects
            </Typography>
            <Typography variant="body1" sx={{ color: '#888', lineHeight: 1.7 }}>
              Create and manage your SaaS applications. Each project can have its own pages, workflows, and settings.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3,
              py: 1.2,
              fontSize: '0.9rem',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
            }}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {apps.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '2px dashed #e0e0e0' }}>
          <FolderIcon sx={{ fontSize: 56, color: '#ddd', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#999', mb: 1 }}>
            No projects yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#bbb', mb: 3 }}>
            Create your first project to start building your SaaS application.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
            }}
          >
            Create First Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {apps.map((app) => (
            <Grid item xs={12} sm={6} md={4} key={app.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                    borderColor: 'transparent',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: app.primary_color || '#667eea',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(app)} sx={{ color: '#aaa', '&:hover': { color: '#667eea', bgcolor: '#f0f0ff' } }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteClick(app)} sx={{ color: '#aaa', '&:hover': { color: '#e74c3c', bgcolor: '#fff0f0' } }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5, lineHeight: 1.3 }}>
                  {app.name}
                </Typography>
                <Chip
                  label={app.slug}
                  size="small"
                  sx={{
                    mb: 1.5,
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    bgcolor: '#f0f0ff',
                    color: '#667eea',
                    fontFamily: 'monospace',
                  }}
                />
                <Typography variant="body2" sx={{ color: '#999', mb: 2, lineHeight: 1.5, minHeight: 40 }}>
                  {app.description || 'No description provided'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CalendarIcon sx={{ fontSize: 14, color: '#ccc' }} />
                  <Typography variant="caption" sx={{ color: '#bbb' }}>
                    Created {formatDate(app.created_at)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>
          {editingApp ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Project Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Awesome App"
            />
            <TextField
              label="Slug (URL-safe)"
              fullWidth
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
              }
              placeholder="e.g., my-awesome-app"
              helperText="Lowercase letters, numbers, and hyphens only"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of your project"
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#555' }}>
                Brand Colour
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    backgroundColor: formData.primary_color,
                    borderRadius: 2,
                    border: '2px solid #eee',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <TextField
                  label="Hex Colour"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#667eea"
                  size="small"
                  sx={{ width: 140 }}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            onClick={handleSaveApp}
            variant="contained"
            disabled={formLoading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
            }}
          >
            {formLoading ? <CircularProgress size={24} /> : (editingApp ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pt: 3 }}>Delete Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Are you sure you want to delete <strong>{appToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteConfirmDialog(false)} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
