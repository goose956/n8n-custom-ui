import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, IconButton, Avatar, Skeleton, Tooltip, Badge } from '@mui/material';
import { ArrowUpward, Edit, Delete, Refresh, LibraryBooks, AddCircle } from '@mui/icons-material';

export interface ScriptLibraryEntry {
  id: string;
  title: string;
  niche: string;
  performanceMetrics: {
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    createdAt: Date;
  };
}

const mockScriptLibraryData: ScriptLibraryEntry[] = [
  {
    id: '1',
    title: 'Fitness Guru Tips',
    niche: 'Fitness',
    performanceMetrics: {
      views: 1500,
      likes: 300,
      comments: 45,
      engagementRate: 0.85,
      createdAt: new Date(),
    },
  },
  {
    id: '2',
    title: 'Vegan Lifestyle Secrets',
    niche: 'Vegan',
    performanceMetrics: {
      views: 2000,
      likes: 500,
      comments: 120,
      engagementRate: 0.9,
      createdAt: new Date(),
    },
  },
];

export function MembersScriptLibraryPage() {
  const [scripts, setScripts] = useState<ScriptLibraryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate an API call
    setTimeout(() => {
      setScripts(mockScriptLibraryData);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', padding: 3, borderRadius: 3, color: 'white', marginBottom: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooks /> Your Script Library
        </Typography>
        <Typography>Your collection of TikTok scripts, categorized by niche and performance</Typography>
      </Box>

      <Grid container spacing={2}>
        {loading ? (
          Array.from(new Array(2)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : scripts.length ? (
          scripts.map((script) => (
            <Grid item xs={12} sm={6} md={4} key={script.id}>
              <Card
                sx={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  borderRadius: 3,
                  transition: '0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LibraryBooks /> {script.title}
                  </Typography>
                  <Chip label={script.niche} color="primary" sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#00796b', width: 48, height: 48 }}>{script.performanceMetrics.views}</Avatar>
                    <Tooltip title="Comments">
                      <Chip label={`${script.performanceMetrics.comments} Comments`} color="info" />
                    </Tooltip>
                    <Badge color="secondary" badgeContent={parseInt((script.performanceMetrics.engagementRate * 100).toFixed(0), 10)}>
                      <Chip icon={<ArrowUpward />} label={`Engagement`} color="success" />
                    </Badge>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Tooltip title="Edit Script">
                      <IconButton color="primary">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Script">
                      <IconButton color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Regenerate Script">
                      <IconButton color="secondary">
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <LibraryBooks sx={{ fontSize: 64, color: '#e0e0e0' }} />
            <Typography variant="h6" sx={{ color: '#9e9e9e', mt: 1 }}>
              You haven't created any TikTok scripts yet.
            </Typography>
            <Tooltip title="Add a New Script">
              <IconButton color="primary" sx={{ mt: 2 }}>
                <AddCircle />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Grid>
    </Box>
  );
}