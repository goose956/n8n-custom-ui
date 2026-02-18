import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, IconButton, Chip, Avatar, Badge, Skeleton, Divider, Tooltip } from '@mui/material';
import { Add, ArrowUpward, ArrowDownward, Edit, Delete, TrendingUp, Timeline, Campaign, BarChart, MoreVert, SentimentSatisfied } from '@mui/icons-material';

interface CampaignStat {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  totalMessagesSent: number;
  engagementRate: number;
}

export function MembersCampaignsPage() {
  const [campaignStats, setCampaignStats] = useState<CampaignStat[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/campaigns`)
      .then(res => res.json())
      .then(data => {
        setCampaignStats(data);
        setLoading(false);
      })
      .catch(() => {
        setCampaignStats([]);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: '16px' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: '#fff', mb: 1 }}>
          <Campaign sx={{ mr: 1 }} />
          Campaigns Dashboard
        </Typography>
        <Typography sx={{ color: '#fff' }}>
          Manage your LinkedIn outreach campaigns effectively using AI-driven personalization.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {loading && Array.from(new Array(3)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}

        {!loading && campaignStats && campaignStats.map(stat => (
          <Grid item xs={12} sm={6} md={4} key={stat.id}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline sx={{ mr: 1 }} />
                    {stat.title}
                  </Typography>
                  <Tooltip title="Edit Campaign">
                    <IconButton>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Status: <Chip label={stat.status} color={stat.status === 'active' ? 'success' : (stat.status === 'paused' ? 'warning' : 'default')} /></Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total Messages Sent: {stat.totalMessagesSent}
                </Typography>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: stat.engagementRate >= 50 ? '#27ae60' : '#e74c3c' }}>
                  Engagement: {stat.engagementRate}%
                  {stat.engagementRate >= 50 ? <ArrowUpward sx={{ ml: 1 }} /> : <ArrowDownward sx={{ ml: 1 }} />}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && campaignStats && campaignStats.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <SentimentSatisfied sx={{ fontSize: 64, color: '#ccc' }} />
          <Typography sx={{ mt: 2 }}>You haven't created any LinkedIn automation campaigns yet.</Typography>
          <Button variant="contained" sx={{ mt: 2, borderRadius: 10 }} startIcon={<Add />} color="primary">
            Create New Campaign
          </Button>
        </Box>
      )}
    </Box>
  );
}