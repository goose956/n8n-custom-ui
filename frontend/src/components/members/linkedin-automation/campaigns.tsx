import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add, Campaign } from '@mui/icons-material';
import { API } from '../../config/api';

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

  const handleScrape = () => {
    // Implement scraping logic here
  };

  return (
    <Box>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', color: '#fff' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Campaign sx={{ mr: 1 }} />
          LinkedIn Profile Scraper
        </Typography>
        <Typography>
          Use our AI-powered LinkedIn Profile Scraper to gather profile insights effortlessly.
        </Typography>
      </Box>

      <Box sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} startIcon={<Add />} onClick={handleScrape}>
          Start Scraping
        </Button>
      </Box>
    </Box>
  );
}