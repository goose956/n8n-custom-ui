import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton, 
  Avatar, 
  Chip, 
  Button, 
  Skeleton, 
  Badge, 
  LinearProgress, 
  Tooltip 
} from '@mui/material';
import {
  TrendingUp,
  Edit,
  Delete,
  Add,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Star,
  Visibility,
  Drafts,
  PlaylistAddCheck,
  Timeline
} from '@mui/icons-material';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

interface YouTubeScript {
  id: string;
  title: string;
  draftContent: string;
  optimizationData: OptimizationData;
}

interface OptimizationData {
  keywords: string[];
  readabilityScore: number;
}

export function MembersYoutubeScriptsPage() {
  const [scripts, setScripts] = useState<YouTubeScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/youtube-scripts`)
      .then(response => response.json())
      .then(data => {
        setScripts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        borderRadius: 16,
        boxShadow: 2,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4
      }}>
        <Typography variant="h4" sx={{ color: '#ffffff' }}> 
          <Drafts /> YouTube Scripts Dashboard
        </Typography>
        <Button variant="contained" color="primary"
          startIcon={<Add />} sx={{ borderRadius: 10 }}>
          Create New Script
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            boxShadow: 3,
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardHeader
              avatar={<Star color="primary" />}
              title="Scripts Generated"
              subheader="Total scripts created using AI"
            />
            <CardContent>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                <ArrowUpward /> 128
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            boxShadow: 3,
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardHeader
              avatar={<PlaylistAddCheck color="primary" />}
              title="Optimized Scripts"
              subheader="Scripts ready for upload"
            />
            <CardContent>
              <Typography variant="h4" sx={{ color: '#27ae60' }}>
                <ArrowUpward /> 89
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            boxShadow: 3,
            '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
          }}>
            <CardHeader
              avatar={<Visibility color="secondary" />}
              title="Views Analyzed"
              subheader="Total views from scripts"
            />
            <CardContent>
              <Typography variant="h4" sx={{ color: '#e74c3c' }}>
                <ArrowDownward /> 2451
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Script List/Table */}
        <Grid item xs={12}>
          <Box sx={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: 3
          }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ mr: 1 }} /> Manage Your AI-Generated Scripts
            </Typography>
            {loading ? (
              <Box>
                <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={100} />
              </Box>
            ) : scripts.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ height: '200px' }}>
                <Drafts sx={{ fontSize: 64, color: '#e0e0e0' }} />
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  You haven't created any youtube scripts yet.
                </Typography>
                <Button variant="contained" color="primary"
                  startIcon={<Add />} sx={{ borderRadius: 10 }}>
                  Create Your First Script
                </Button>
              </Box>
            ) : (
              scripts.map(script => (
                <Card key={script.id} sx={{
                  mb: 2,
                  '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                }}>
                  <CardHeader
                    avatar={<Avatar>{script.title.charAt(0)}</Avatar>}
                    action={
                      <Box>
                        <Tooltip title="Edit Script">
                          <IconButton>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Script">
                          <IconButton>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    title={script.title}
                    subheader={`Keywords: ${script.optimizationData.keywords.join(', ')}`}
                  />
                  <CardContent>
                    <Typography>{script.draftContent.substring(0, 100)}...</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`Readability: ${script.optimizationData.readabilityScore}`}
                        color={script.optimizationData.readabilityScore > 70 ? "success" : "warning"} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}