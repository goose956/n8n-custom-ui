import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, Typography, Button, IconButton, Chip, Avatar, Paper, Divider, Skeleton, Tooltip } from '@mui/material';
import { Download, Search, CloudDownload, TextSnippet, ArrowUpward, ArrowDownward, FileDownload, Refresh, FilterList, MoreVert } from '@mui/icons-material';

interface Transcription {
  videoId: string;
  text: string;
  subtitlesFormat: string;
  downloadable: boolean;
  downloadOptions: Array<{ format: string }>;
}

export function MembersTranscriptionsPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
    fetch(`${API_BASE}/api/transcriptions`)
      .then(response => response.json())
      .then(data => {
        setTranscriptions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16, padding: 3, mb: 3, color: '#fff' }}>
        <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextSnippet sx={{ mr: 1 }} /> Manage YouTube Transcriptions
        </Typography>
        <Typography>
          Utilize AI to transcribe your YouTube videos, providing searchable text and subtitles. Download options are available in various formats.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Download sx={{ mr: 1 }} /> Total Transcriptions
            </Typography>
            <Typography variant="h4" color="primary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {transcriptions.length}
              <ArrowUpward sx={{ color: 'green', ml: 1 }} />
            </Typography>
          </Card>
        </Grid>
        {/* Additional Stat Cards... */}
      </Grid>

      {/* Paper Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Search sx={{ mr: 1 }} /> Transcriptions Archive
          </Typography>
          <Button variant="contained" color="primary" sx={{ borderRadius: 10 }}>
            <CloudDownload sx={{ mr: 1 }} /> Export All
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Skeleton variant="rectangular" height={400} animation="wave" />
        ) : transcriptions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CloudDownload sx={{ fontSize: 64, color: 'rgba(0, 0, 0, 0.2)' }} />
            <Typography variant="h6" sx={{ color: 'rgba(0, 0, 0, 0.6)', mt: 2 }}>
              You haven't created any YouTube transcriptions yet.
            </Typography>
            <Button variant="outlined" startIcon={<FileDownload />} sx={{ mt: 3 }}>
              Create a Transcription
            </Button>
          </Box>
        ) : (
          <Box>
            {transcriptions.map((transcription, index) => (
              <Box key={transcription.videoId} sx={{ mb: 2, bgcolor: index % 2 === 0 ? '#f9f9f9' : '#fff', p: 2, borderRadius: 3 }}>
                <Grid container alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="body1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <TextSnippet sx={{ mr: 1 }} /> Video ID: {transcription.videoId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Format: {transcription.subtitlesFormat}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                    {transcription.downloadOptions.map((option) => (
                      <Chip key={option.format} label={`.${option.format}`} icon={<FileDownload />} sx={{ mr: 1, mb: 1 }} />
                    ))}
                    <IconButton aria-label="refresh">
                      <Refresh />
                    </IconButton>
                    <IconButton aria-label="more options">
                      <MoreVert />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}