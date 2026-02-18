import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton, Avatar, Badge, Chip, Tooltip, Button, Paper, Divider, Skeleton } from '@mui/material';
import { Edit, Delete, Add, ArrowUpward, ArrowDownward, Star, Email, Save, Visibility } from '@mui/icons-material';

// Inline type definitions
interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  usageCount: number;
  createdAt: string;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersMessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/message-templates`);
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load message templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const renderContent = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {Array.from(new Array(4)).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" width="100%" height={140} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
          <Email sx={{ fontSize: 64, color: 'grey.500' }} />
          <Typography variant="h6" sx={{ mb: 3 }}>{error}</Typography>
          <Button variant="contained" sx={{ bgcolor: '#1976d2', borderRadius: 10 }}>Try Again</Button>
        </Box>
      );
    }

    if (templates.length === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
          <Email sx={{ fontSize: 64, color: 'grey.500' }} />
          <Typography variant="h6" sx={{ mb: 3 }}>No message templates found for Linkedin automater.</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: '#1976d2', borderRadius: 10 }}>Create New Template</Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={3} key={template.id}>
            <Card sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Badge badgeContent={template.usageCount} color="primary">
                  <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}><Star /></Avatar>
                </Badge>
                <Typography variant="h6" sx={{ mt: 2 }}>{template.title}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Created at: {new Date(template.createdAt).toLocaleDateString()}</Typography>
                <Divider />
                <Box sx={{ mt: 2 }}>
                  <Chip icon={<Visibility />} label="Views" variant="outlined" sx={{ mr: 1 }} />
                  <Tooltip title="Edit">
                    <IconButton sx={{ color: '#1976d2' }}><Edit /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton sx={{ color: '#e74c3c' }}><Delete /></IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Paper sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          <Email sx={{ mr: 1, color: '#1976d2' }} /> Message Templates
        </Typography>
        <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: '#1976d2', borderRadius: 10 }}>New Template</Button>
      </Box>
      {renderContent()}
    </Paper>
  );
}