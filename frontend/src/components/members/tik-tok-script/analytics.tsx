import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, IconButton, Chip, Avatar, Badge, LinearProgress, Skeleton } from '@mui/material';
import { TrendingUp, ArrowUpward, ArrowDownward, BarChart, PieChart, Timeline, Refresh, LinkedIn, Search, Person, Work, School, LocationOn } from '@mui/icons-material';
import { TextField, Button } from '@mui/material';

interface LinkedInProfile {
  fullName: string;
  headline: string;
  location: string;
  company: string;
  university: string;
  profileUrl: string;
  connectionCount?: number;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
}

interface ScrapeRequest {
  profileUrl: string;
}

export default function Analytics() {
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [profileData, setProfileData] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

  const handleScrape = async () => {
    if (!profileUrl.trim()) {
      setError('Please enter a LinkedIn profile URL');
      return;
    }

    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      const response = await fetch(`${API_BASE}/api/linkedin-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileUrl: profileUrl.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to scrape profile');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileCard = () => {
    if (!profileData) return null;

    return (
      <Grid item xs={12}>
        <Paper sx={{ padding: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#0077b5', marginRight: 2, width: 56, height: 56 }}>
              <Person />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {profileData.fullName}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mb: 0.5 }}>
                {profileData.headline}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {profileData.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ fontSize: 16, color: '#666', mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {profileData.location}
                    </Typography>
                  </Box>
                )}
                {profileData.connectionCount && (
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {profileData.connectionCount} connections
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {profileData.company && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Work sx={{ color: '#1976d2', mr: 1 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666' }}>Current Company</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {profileData.company}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            {profileData.university && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <School sx={{ color: '#1976d2', mr: 1 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666' }}>Education</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {profileData.university}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          {profileData.about && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>About</Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#555' }}>
                {profileData.about}
              </Typography>
            </Box>
          )}

          {profileData.experience && profileData.experience.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Experience</Typography>
              {profileData.experience.map((exp, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {exp.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {exp.company} • {exp.duration}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: 4 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 4, borderRadius: 3, color: '#fff', mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <LinkedIn sx={{ marginRight: 1 }} /> LinkedIn Profile Scraper
        </Typography>
        <Typography variant="body1">Extract detailed information from LinkedIn profiles using Apify integration</Typography>
      </Box>

      {/* Scraper Form */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ padding: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Search sx={{ marginRight: 1 }} /> Profile URL Input
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>LinkedIn Profile URL</Typography>
                <Box
                  component="input"
                  value={profileUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username/"
                  disabled={loading}
                  sx={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: 2,
                    fontSize: '14px',
                    '&:focus': {
                      outline: 'none',
                      borderColor: '#667eea'
                    },
                    '&:disabled': {
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed'
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'end' }}>
                <Box
                  component="button"
                  onClick={handleScrape}
                  disabled={loading || !profileUrl.trim()}
                  sx={{
                    padding: '12px 24px',
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 2,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: loading ? 'none' : 'translateY(-1px)'
                    }
                  }}
                >
                  {loading ? 'Scraping...' : 'Scrape Profile'}
                </Box>
              </Box>
            </Box>

            {error && (
              <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#c62828' }}>
                  {error}
                </Typography>
              </Box>
            )}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    border: '2px solid #e0e0e0',
                    borderTop: '2px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Extracting profile data from LinkedIn...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Results */}
        {renderProfileCard()}
      </Grid>
    </Box>
  );
}