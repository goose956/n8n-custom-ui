import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Chip, Paper, IconButton, Divider, LinearProgress, Tooltip, Skeleton, Button } from '@mui/material';
import { People, Forum, Group, Comment, TrendingUp, ArrowUpward, ArrowDownward, Refresh, Message, AddCircleOutline, GroupAdd } from '@mui/icons-material';
import { ContactForm } from './ContactForm';

// Define inline interfaces
interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: UserProfile;
  createdAt: Date;
  comments: number;
}

interface UserProfile {
  id: string;
  username: string;
  profilePictureUrl?: string;
  totalGeneratedScripts: number;
  successRate: number;
}

// Mock Data
const mockForums: ForumPost[] = [
  {
    id: '1',
    title: 'Best Practices for TikTok Scripts',
    content: 'Share your tips for creating engaging scripts.',
    author: {
      id: 'user1',
      username: 'scriptmaster',
      profilePictureUrl: '',
      totalGeneratedScripts: 120,
      successRate: 95,
    },
    createdAt: new Date(),
    comments: 24,
  },
  // More mock data...
];

export function MembersCommunityPage() {
  const [loading, setLoading] = useState(true);
  const [forums, setForums] = useState<ForumPost[]>([]);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setForums(mockForums);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <Box sx={{ padding: 3, bgcolor: '#fafbfc' }}>
      <Paper elevation={1} sx={{ padding: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
        <Typography variant="h4" sx={{ color: 'white', display: 'flex', alignItems: 'center', mb: 2 }}>
          <GroupAdd sx={{ mr: 1 }} /> Welcome to the TikTok Script Community
        </Typography>
        <Typography sx={{ color: '#fafbfc' }}>
          Collaborate and share your script development tips and tricks to enhance your TikTok journey.
        </Typography>
      </Paper>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1 }} /> Active Members
              </Typography>
              {loading ? <Skeleton height={60} /> : 
              <Typography variant="h4" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                1,024 <TrendingUp sx={{ ml: 1, color: '#27ae60' }} />
              </Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <Forum sx={{ mr: 1 }} /> Forums
              </Typography>
              {loading ? <Skeleton height={60} /> : 
              <Typography variant="h4" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                321 <ArrowUpward sx={{ ml: 1, color: '#27ae60' }} />
              </Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <Comment sx={{ mr: 1 }} /> Discussions
              </Typography>
              {loading ? <Skeleton height={60} /> : 
              <Typography variant="h4" sx={{ color: '#e74c3c', display: 'flex', alignItems: 'center' }}>
                876 <ArrowDownward sx={{ ml: 1, color: '#e74c3c' }} />
              </Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <Message sx={{ mr: 1 }} /> Messages
              </Typography>
              {loading ? <Skeleton height={60} /> : 
              <Typography variant="h4" sx={{ color: '#9b59b6', display: 'flex', alignItems: 'center' }}>
                540 <ArrowDownward sx={{ ml: 1, color: '#f39c12' }} />
              </Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ padding: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Group sx={{ mr: 1 }} /> Recent Discussions
        </Typography>
        {loading ? (
          Array.from(new Array(3)).map((_, index) => (
            <Skeleton key={index} height={80} sx={{ mb: 2 }} />
          ))
        ) : (
          forums.map((forum) => (
            <Card key={forum.id} sx={{ mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Typography variant="h6">{forum.title}</Typography>
                <Typography variant="body2" color="text.secondary">{forum.content}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Avatar src={forum.author.profilePictureUrl} alt={forum.author.username} sx={{ mr: 2, width: 32, height: 32 }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>{forum.author.username}</Typography>
                  <Chip icon={<Comment />} label={`${forum.comments} Comments`} variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          ))
        )}
        {forums.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Group sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">You haven't created any discussion yet</Typography>
            <Button variant="contained" startIcon={<AddCircleOutline />} sx={{ mt: 2 }}>
              Start a Discussion
            </Button>
          </Box>
        )}
      </Paper>
<ContactForm />
    </Box>
  );
}