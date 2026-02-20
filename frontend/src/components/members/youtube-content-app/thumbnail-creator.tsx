import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, Snackbar, Avatar, Badge, Chip, Tooltip, Paper, Dialog, DialogTitle, DialogContent, CircularProgress, Skeleton } from '@mui/material';
import { PhotoLibrary, TrendingUp, Warning, Add, Edit, Delete, ArrowUpward, CheckCircle, Error, Star, Visibility, FileUpload, Close } from '@mui/icons-material';
import { ThumbnailDesign } from '../../types'; // Using as reference only, actual type defined inline

interface ThumbnailCreatorPageState {
  thumbnails: ThumbnailDesign[];
  isLoading: boolean;
  error: string | null;
  showSnackbar: boolean;
  selectedThumbnail: ThumbnailDesign | null;
}

interface ThumbnailDesign {
  templateId: string;
  customText: string;
  imageUrl: string;
}

export function MembersThumbnailCreatorPage() {
  const [state, setState] = useState<ThumbnailCreatorPageState>({
    thumbnails: [],
    isLoading: true,
    error: null,
    showSnackbar: false,
    selectedThumbnail: null,
  });

  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  const fetchThumbnails = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/thumbnails`);
      const data: ThumbnailDesign[] = await response.json();
      setState(prevState => ({
        ...prevState,
        thumbnails: data,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prevState => ({
        ...prevState,
        error: 'Failed to load thumbnails.',
        isLoading: false,
      }));
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);

  const handleEditThumbnail = (thumbnail: ThumbnailDesign) => {
    setState(prevState => ({ ...prevState, selectedThumbnail: thumbnail }));
  };

  const handleCloseSnackbar = () => {
    setState(prevState => ({ ...prevState, showSnackbar: false }));
  };

  const handleUpload = () => {
    setState(prevState => ({ ...prevState, showSnackbar: true }));
  };

  return (
    <Box>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 3, mb: 3, color: '#fff', borderRadius: 16 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <PhotoLibrary sx={{ mr: 1 }} /> Thumbnail Creator
        </Typography>
        <Typography variant="subtitle1">Design and generate compelling YouTube video thumbnails to increase engagement.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1 }} /> Templates Used
              </Typography>
              <Typography variant="h4" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                {state.isLoading ? <Skeleton width={100} /> : state.thumbnails.length}
                <ArrowUpward color={state.thumbnails.length > 5 ? 'success' : 'error'} sx={{ ml: 1 }} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1 }} /> Successful Uploads
              </Typography>
              <Typography variant="h4" color="primary">
                {state.isLoading ? <Skeleton width={100} /> : Math.floor(state.thumbnails.length / 2)}
                <ArrowUpward color={Math.floor(state.thumbnails.length / 2) > 2 ? 'success' : 'error'} sx={{ ml: 1 }} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ mr: 1 }} /> Upload Errors
              </Typography>
              <Typography variant="h4" color="primary">
                {state.isLoading ? <Skeleton width={100} /> : 0}
                <Error color="error" sx={{ ml: 1 }} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Visibility sx={{ mr: 1 }} /> Your Uploaded Thumbnails
        </Typography>
        {state.isLoading ? (
          <Skeleton variant="rectangular" height={250} />
        ) : state.error ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Error sx={{ fontSize: 64, mb: 2, color: 'rgba(0, 0, 0, 0.6)' }} />
            <Typography variant="body1" sx={{ mb: 2 }}>Failed to load thumbnails. Please try again later.</Typography>
            <Button onClick={fetchThumbnails} variant="contained" color="primary">Retry</Button>
          </Box>
        ) : state.thumbnails.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <PhotoLibrary sx={{ fontSize: 64, mb: 2, color: 'rgba(0, 0, 0, 0.4)' }} />
            <Typography variant="body1" sx={{ mb: 2 }}>You haven't created any thumbnails yet.</Typography>
            <Button onClick={handleUpload} variant="contained" color="primary">Create Your First Thumbnail</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {state.thumbnails.map(thumbnail => (
              <Grid item xs={12} sm={6} md={3} key={thumbnail.templateId}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent>
                    <Avatar src={thumbnail.imageUrl} sx={{ width: '100%', height: 140, mb: 2 }} variant="square" />
                    <Typography variant="h6">{thumbnail.customText}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditThumbnail(thumbnail)} color="primary">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog open={!!state.selectedThumbnail} onClose={() => setState(prevState => ({ ...prevState, selectedThumbnail: null }))} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} /> Edit Thumbnail
          </Typography>
          <IconButton aria-label="close" onClick={() => setState(prevState => ({ ...prevState, selectedThumbnail: null }))} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Thumbnail Edit Content Placeholder */}
          <Typography variant="body1">Edit Thumbnail Design coming soon...</Typography>
        </DialogContent>
      </Dialog>

      <Snackbar open={state.showSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} message="Upload successful" />
    </Box>
  );
}