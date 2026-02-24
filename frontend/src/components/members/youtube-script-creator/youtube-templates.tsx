import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, Skeleton, Avatar, IconButton } from '@mui/material';
import { TrendingUp, InsertDriveFile, Image, Subtitles, ErrorOutline, Download } from '@mui/icons-material';
import { CheckCircle, Refresh, FileDownload } from '@mui/icons-material';

interface YouTubeTemplate {
  id: string;
  type: 'script' | 'thumbnail' | 'transcription';
  title: string;
  preview: string;
}

export function MembersYoutubeTemplatesPage() {
  const [templates, setTemplates] = useState<YouTubeTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/youtube-templates`);
        const data: YouTubeTemplate[] = await response.json();
        setTemplates(data);
      } catch (err) {
        setError('Failed to load templates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from(Array(6)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 16 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <ErrorOutline color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <Image color="disabled" sx={{ fontSize: 64 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          You haven't created any YouTube script templates yet.
        </Typography>
        <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} startIcon={<InsertDriveFile />}>
          Create a New Template
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        YouTube Templates <TrendingUp sx={{ ml: 1, color: 'primary.main' }} />
      </Typography>
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ px: 3, py: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  {template.title} <Chip label={template.type} color="primary" variant="outlined" size="small" sx={{ ml: 1 }} />
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Avatar src={template.preview} sx={{ width: '100%', height: 140, borderRadius: 3 }} variant="square" />
                </Box>
                <Button variant="contained" color="primary" fullWidth sx={{ borderRadius: 10 }} startIcon={<FileDownload />}>
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}