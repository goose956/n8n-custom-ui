import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, CardActions, Button, Avatar, Chip, IconButton, Tooltip, Badge, Divider, LinearProgress, Paper, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import { VideoLibrary, Image, TrendingUp, ArrowUpward, ArrowDownward, Edit, Delete, Visibility, Info, AddCircle, CheckCircle, Warning } from '@mui/icons-material';

interface VideoThumbnail {
  id: string;
  templateId: string;
  editingCapabilities: string;
  performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  views: number;
  clickThroughRate: number;
}

const apiBase = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersVideoThumbnailsPage() {
  const [thumbnails, setThumbnails] = useState<VideoThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/video-thumbnails`)
      .then(response => response.json())
      .then(data => {
        setThumbnails(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load thumbnails');
        setLoading(false);
      });
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 2, borderRadius: 16, mb: 3, display: 'flex', alignItems: 'center' }}>
        <VideoLibrary sx={{ fontSize: 40, color: '#fff', mr: 2 }} />
        <Typography variant="h6" sx={{ color: '#fff' }}>Video Thumbnails Management</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }, overflow: 'visible' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Thumbnails Created</Typography>
              <Typography variant="h5" component="div" color="primary"><TrendingUp sx={{ mr: 1 }} />{thumbnails.length}</Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: thumbnails.length > 0 ? 'green' : 'red' }}>
                {thumbnails.length > 0 ? <ArrowUpward sx={{ mr: 0.5 }} /> : <ArrowDownward sx={{ mr: 0.5 }} />}
                {thumbnails.length > 0 ? 'Increasing usage' : 'No creation activity'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Average Click-Through Rate</Typography>
              <Typography variant="h5" component="div" color="primary"><Image sx={{ mr: 1 }} />{calculateAverageCTR(thumbnails)}%</Typography>
              <LinearProgress variant="determinate" value={calculateAverageCTR(thumbnails)} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}><Image sx={{ mr: 1 }} />Thumbnail Templates</Typography>
          <Tooltip title="Add new thumbnail">
            <IconButton color="primary" onClick={() => setDialogOpen(true)}>
              <AddCircle />
            </IconButton>
          </Tooltip>
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 3 }} />
        ) : error ? (
          <Box sx={{ textAlign: 'center', color: 'red', py: 5 }}>
            <Warning sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">{error}</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {thumbnails.map(thumbnail => (
              <Grid key={thumbnail.id} item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom><Image sx={{ mr: 1 }} />Template #{thumbnail.templateId}</Typography>
                    <Avatar sx={{ width: '100%', height: 150, mb: 2, background: `url(${thumbnail.editingCapabilities})`, backgroundSize: 'cover', borderRadius: 3 }} variant="square" />
                    <Chip label={`Views: ${thumbnail.performanceMetrics.views}`} icon={<Visibility />} sx={{ mr: 1 }} />
                    <Chip label={`CTR: ${thumbnail.performanceMetrics.clickThroughRate}%`} icon={<TrendingUp />} />
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary" onClick={() => setSnackbarOpen(true)} startIcon={<Edit />}>Edit</Button>
                    <Button size="small" color="secondary" startIcon={<Delete />}>Delete</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle><AddCircle sx={{ mr: 1 }} />New Thumbnail</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Use this tool to create and manage custom YouTube video thumbnails.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancel</Button>
          <Button onClick={handleDialogClose} color="primary" startIcon={<CheckCircle />}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message="Feature coming soon!"
      />
    </Box>
  );

  function calculateAverageCTR(thumbnails: VideoThumbnail[]): number {
    if (!thumbnails.length) return 0;
    const totalCTR = thumbnails.reduce((sum, thumbnail) => sum + thumbnail.performanceMetrics.clickThroughRate, 0);
    return (totalCTR / thumbnails.length).toFixed(1);
  }
}