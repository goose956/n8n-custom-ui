import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Paper, IconButton, Tooltip,
  Card, CardContent, CardActions, Button, Chip, Avatar, Skeleton, Snackbar
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { Edit, Delete, Add, ArrowUpward, Visibility, Search, Error, CheckCircle } from '@mui/icons-material';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  createdDate: Date;
}

export function MembersBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  const fetchBlogPost = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/blog-posts/${id}`);
      const data = await response.json();
      setBlogPost(data);
    } catch {
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, [id, API_BASE]);

  useEffect(() => {
    fetchBlogPost();
  }, [fetchBlogPost]);

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Skeleton variant="rectangular" height={40} width="80%" />
        <Skeleton variant="text" sx={{ my: 2, width: '60%' }} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  if (!blogPost) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Error sx={{ fontSize: 64, color: 'grey.500' }} />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Error loading blog post content
        </Typography>
        <Button variant="contained" color="primary" onClick={fetchBlogPost} startIcon={<Search />}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <Visibility sx={{ mr: 1 }} /> {blogPost.title}
        </Typography>
        <Typography sx={{ color: '#fff' }}>
          {new Date(blogPost.createdDate).toLocaleDateString()} by {blogPost.author}
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 2 }}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16 }}>
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {blogPost.content}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle sx={{ mr: 1 }} /> Actions
            </Typography>
            <Button variant="outlined" color="primary" sx={{ mb: 1, width: '100%' }} startIcon={<Edit />}>
              Edit Post
            </Button>
            <Button variant="outlined" color="secondary" sx={{ mb: 1, width: '100%' }} startIcon={<Delete />}>
              Delete Post
            </Button>
            <Button variant="contained" color="primary" sx={{ width: '100%' }} startIcon={<Add />}>
              Create New Post
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={openSnackbar}
        onClose={handleSnackbarClose}
        message="Failed to load blog post. Please try again later."
        autoHideDuration={6000}
      />
    </Box>
  );
}