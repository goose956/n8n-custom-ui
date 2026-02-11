import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '@mui/material';
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage your SaaS applications and create new projects.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          + New Project
        </Button>
      </Box>

      {apps.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No projects yet. Create one to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Slug</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {app.primary_color && (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: app.primary_color,
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                          }}
                        />
                      )}
                      {app.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={app.slug} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{app.description || '—'}</TableCell>
                  <TableCell>{formatDate(app.created_at)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDialog(app)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteClick(app)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingApp ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
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
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                Primary Color
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    backgroundColor: formData.primary_color,
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                />
                <TextField
                  label="Hex Color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#1976d2"
                  size="small"
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveApp}
            variant="contained"
            color="primary"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : (editingApp ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{appToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
