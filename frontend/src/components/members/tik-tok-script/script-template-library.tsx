import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Snackbar } from '@mui/material';
import { API } from '../../config/api';
import { ScriptTemplate } from '../../types/membersArea';

export function MembersScriptTemplateLibraryPage() {
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API}/script-templates`);
        if (!res.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        setError(err.message);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Script Template Library
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 3 }}>
        Browse and select from a variety of script templates categorized by niche. Templates include annotations for successful TikTok video structure.
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      ) : templates.length === 0 ? (
        <Typography variant="body1">
          No templates available.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#1976d2', marginBottom: 1 }}>
                    {template.title}
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 2 }}>
                    Niche: {template.niche}
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 2 }}>
                    Description: {template.description}
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 2 }}>
                    Annotations:
                  </Typography>
                  <ul>
                    {template.annotations.map((annotation, index) => (
                      <li key={index}>
                        <Typography variant="body2">{annotation}</Typography>
                      </li>
                    ))}
                  </ul>
                  <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }} fullWidth>
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="An error occurred while fetching templates."
      />
    </Box>
  );
}