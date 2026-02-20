import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Skeleton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Save, Edit, Delete, Visibility, ArrowUpward, ArrowDownward, ModelTraining, FileCopyOutlined } from '@mui/icons-material';

interface Template {
  id: string;
  content: string;
  industry: string;
}

interface FetchState {
  loading: boolean;
  error?: string;
  data: Template[];
}

export function MembersLibraryPage() {
  const [templates, setTemplates] = useState<FetchState>({ loading: true, data: [] });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isDialogOpen, setDialogOpen] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
    try {
      const response = await fetch(`${API_BASE}/api/templates`);
      const data = await response.json();
      setTemplates({ loading: false, data });
    } catch (error) {
      setTemplates({ loading: false, error: 'Failed to load templates' });
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = (templateId: string) => {
    setSnackbarMessage(`Template ${templateId} saved successfully!`);
    setDialogOpen(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setSnackbarMessage(`Template ${templateId} deleted.`);
  };

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <ModelTraining sx={{ mr: 2 }} />
          Template Library
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {templates.loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 16 }}>
                <CardContent>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="rectangular" height={80} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : templates.error ? (
          <Box sx={{ textAlign: 'center', color: '#e74c3c', mt: 5 }}>
            <Typography variant="h6" gutterBottom>
              <FileCopyOutlined sx={{ fontSize: 64, color: '#e74c3c' }} />
              Oops! We couldn't load the templates.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, borderColor: '#e74c3c', color: '#e74c3c' }}
              onClick={fetchTemplates}
            >
              Retry
            </Button>
          </Box>
        ) : templates.data.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: '#9b59b6', mt: 5 }}>
            <Typography variant="h6" gutterBottom>
              <FileCopyOutlined sx={{ fontSize: 64, color: '#9b59b6' }} />
              You haven't created any linkedin powerhouse templates yet.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => setDialogOpen(true)}
            >
              Create New Template
            </Button>
          </Box>
        ) : (
          templates.data.map(template => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                sx={{
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  borderRadius: 16,
                  '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <FileCopyOutlined sx={{ mr: 1 }} />
                    {template.industry} Template
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {template.content}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#155b9d' } }}
                      onClick={() => setDialogOpen(true)}
                    >
                      <Edit sx={{ mr: 1 }} />
                      Customize
                    </Button>
                    <Box>
                      <Tooltip title="Save Template">
                        <IconButton color="primary" onClick={() => handleSaveTemplate(template.id)}>
                          <Save />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Template">
                        <IconButton color="error" onClick={() => handleDeleteTemplate(template.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
      >
        <Alert onClose={() => setSnackbarMessage('')} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Customize Template
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Content for template customization form goes here */}
          <Typography variant="body2">Template customization form will be here...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#1976d2' }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveTemplate('')}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}