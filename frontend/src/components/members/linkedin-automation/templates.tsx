import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  Button,
  Skeleton,
  Chip,
  Avatar,
  Badge,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Message,
  Search,
} from '@mui/icons-material';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  performanceMetrics: {
    usageCount: number;
    responseRate: number;
  };
}

export function MembersTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const API_BASE =
    window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : '';

  useEffect(() => {
    fetch(`${API_BASE}/api/templates`)
      .then((response) => response.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((error) => {
        setError('Failed to load message templates.');
        setLoading(false);
      });
  }, [API_BASE]);

  const handleRefresh = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/templates`)
      .then((response) => response.json())
      .then((data) => setTemplates(data))
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={1}
        sx={{
          padding: 3,
          marginBottom: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4">
          <Message /> Message Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 10 }}
          startIcon={<Add />}
        >
          Create New Template
        </Button>
      </Paper>

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(4)).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton variant="rectangular" height={140} />
              </Grid>
            ))
          : templates.map((template) => (
              <Grid item xs={12} sm={6} md={3} key={template.id}>
                <Card
                  sx={{
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    borderRadius: 16,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: '#1976d2' }}>
                        <Message />
                      </Avatar>
                    }
                    action={
                      <Tooltip title="Edit Template">
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    }
                    title={template.title}
                    subheader={`Used ${template.performanceMetrics.usageCount} times`}
                  />
                  <CardContent>
                    <Typography variant="body2" color="textSecondary">
                      Response Rate:{' '}
                      <Chip
                        label={`${template.performanceMetrics.responseRate}%`}
                        color={
                          template.performanceMetrics.responseRate > 50
                            ? 'success'
                            : 'error'
                        }
                        icon={
                          template.performanceMetrics.responseRate > 50 ? (
                            <ArrowUpward />
                          ) : (
                            <ArrowDownward />
                          )
                        }
                      />
                    </Typography>
                  </CardContent>
                  <Divider />
                  <Box sx={{ padding: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<Refresh />}
                      onClick={handleRefresh}
                    >
                      Refresh
                    </Button>
                    <IconButton color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
      </Grid>

      {error && (
        <Box sx={{ textAlign: 'center', marginTop: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
        </Box>
      )}

      {!loading && templates.length === 0 && (
        <Box sx={{ textAlign: 'center', marginTop: 6 }}>
          <Message color="disabled" sx={{ fontSize: 64 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Templates Available
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 10 }}
            startIcon={<Add />}
          >
            Create Your First Template
          </Button>
        </Box>
      )}
    </Box>
  );
}