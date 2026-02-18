import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Avatar, IconButton, Paper, Skeleton, Badge, Tooltip, Divider, Button } from '@mui/material';
import { TrendingUp, TrendingDown, BarChart, ArrowUpward, ArrowDownward, Refresh, GetApp, Assessment } from '@mui/icons-material';
import { API } from '../../config/api';

interface UserAnalytics {
  userId: string;
  openRate: number;
  responseRate: number;
  engagementMetrics: Array<{
    date: string;
    messagesSent: number;
    responsesReceived: number;
  }>;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

const Analytics: React.FC = () => {
  const [scrapeResults, setScrapeResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const response = await fetch(API.analytics, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'linkedinProfileScrape' })
      });
      if (!response.ok) throw new Error('Failed to scrape data');
      const data = await response.json();
      setScrapeResults(JSON.stringify(data, null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setScrapeResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ mr: 1 }} /> LinkedIn Profile Scraper
        </Typography>
        <Button variant="contained" startIcon={<Refresh />} onClick={handleScrape} disabled={loading} sx={{ borderRadius: 10 }}>
          {loading ? 'Scraping...' : 'Start Scraper'}
        </Button>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        {scrapeResults && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Scraper Results:</Typography>
            <Box sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, background: '#fafbfc' }}>
              {scrapeResults}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Analytics;