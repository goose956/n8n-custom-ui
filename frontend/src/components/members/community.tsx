import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Button, CircularProgress, Snackbar, TextField } from '@mui/material';
import { API } from '../config/api';
import { CommunityPost } from '../../types/membersArea';
import { Send } from '@mui/icons-material';

interface CommunityState {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
  creatingPost: boolean;
  postContent: string;
}

const mockData: CommunityPost[] = [
  { id: '1', author: 'user1', content: 'This script worked great!', timestamp: new Date(), likes: 12 },
  { id: '2', author: 'user2', content: 'How can I improve this?', timestamp: new Date(), likes: 5 },
];

export function MembersCommunityPage() {
  const [state, setState] = useState<CommunityState>({
    posts: [],
    loading: true,
    error: null,
    creatingPost: false,
    postContent: '',
  });

  const fetchPosts = useCallback(async () => {
    try {
      // Simulating a fetch API call with a timeout
      setTimeout(() => setState(prev => ({ ...prev, posts: mockData, loading: false })), 1000);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: 'Failed to fetch community posts', loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, postContent: e.target.value }));
  };

  const handlePostSubmit = async () => {
    setState(prev => ({ ...prev, creatingPost: true }));
    try {
      // Simulate posting to server
      setTimeout(() => {
        const newPost: CommunityPost = {
          id: (state.posts.length + 1).toString(),
          author: 'currentUser',
          content: state.postContent,
          timestamp: new Date(),
          likes: 0,
        };
        setState(prev => ({
          ...prev,
          posts: [newPost, ...prev.posts],
          creatingPost: false,
          postContent: ''
        }));
      }, 500);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: 'Failed to create post', creatingPost: false }));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#1976d2' }}>Community</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          value={state.postContent}
          onChange={handlePostChange}
          placeholder="Share something with the community..."
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ ml: 2 }}
          disabled={state.creatingPost || state.postContent.trim() === ''}
          onClick={handlePostSubmit}
        >
          {state.creatingPost ? <CircularProgress size={24} /> : <Send />}
        </Button>
      </Box>
      {state.loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {state.posts.length > 0 ? (
            state.posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>{post.author.charAt(0).toUpperCase()}</Avatar>
                      <Typography variant="subtitle2">{post.author}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>{post.content}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {post.timestamp.toLocaleDateString()} - {post.likes} likes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography>No posts yet. Start the conversation!</Typography>
          )}
        </Grid>
      )}
      <Snackbar
        open={!!state.error}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, error: null }))}
        message={state.error}
      />
    </Box>
  );
}