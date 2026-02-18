import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  Avatar, 
  Skeleton, 
  Alert, 
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  Search as SearchIcon,
  Numbers as NumbersIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { API } from '../../../config/api';

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  company: string;
  profileUrl: string;
  imageUrl?: string;
  connections?: string;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
}

interface ScrapingResult {
  profiles: LinkedInProfile[];
  totalFound: number;
  status: 'success' | 'error' | 'partial';
  message?: string;
}

export function Richardgoldie() {
  const [searchUrl, setSearchUrl] = useState('');
  const [recordCount, setRecordCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleScrape = async () => {
    if (!searchUrl.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${API.linkedinScraper}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: searchUrl,
          maxResults: recordCount
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to scrape: ${response.statusText}`);
      }

      const data: ScrapingResult = await response.json();
      setResults(data);
      setSnackbarMessage(`Successfully scraped ${data.profiles.length} profiles`);
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape LinkedIn profiles';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results?.profiles.length) return;
    
    const csv = [
      ['Name', 'Headline', 'Company', 'Location', 'Profile URL'].join(','),
      ...results.profiles.map(profile => [
        profile.name,
        profile.headline,
        profile.company,
        profile.location,
        profile.profileUrl
      ].map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          }}
        >
          <LinkedInIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            color: '#1a1a2e', 
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          LinkedIn Profile Scraper
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', maxWidth: 600, mx: 'auto' }}>
          Extract LinkedIn profiles from search results and company pages. Enter a LinkedIn URL and specify how many records you want to scrape.
        </Typography>
      </Box>

      {/* Search Form */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          border: '1px solid rgba(0,0,0,0.06)', 
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextField
            label="LinkedIn URL"
            placeholder="https://www.linkedin.com/search/results/people/?keywords=developer"
            value={searchUrl}
            onChange={(e) => setSearchUrl(e.target.value)}
            sx={{ flex: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: '#666' }} />
            }}
            error={!!error && !searchUrl.trim()}
            helperText={error && !searchUrl.trim() ? 'LinkedIn URL is required' : ''}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Records</InputLabel>
            <Select
              value={recordCount}
              onChange={(e) => setRecordCount(Number(e.target.value))}
              label="Records"
              startAdornment={<NumbersIcon sx={{ mr: 1, color: '#667eea' }} />}
            >
              <MenuItem value={5}>5 records</MenuItem>
              <MenuItem value={10}>10 records</MenuItem>
              <MenuItem value={25}>25 records</MenuItem>
              <MenuItem value={50}>50 records</MenuItem>
              <MenuItem value={100}>100 records</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleScrape}
            disabled={loading}
            sx={{
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
            startIcon={loading ? <RefreshIcon className="spin" /> : <SearchIcon />}
          >
            {loading ? 'Scraping...' : 'Scrape Profiles'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Loading State */}
      {loading && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LinkedInIcon sx={{ mr: 1, color: '#667eea' }} />
            <Typography variant="h6">Scraping LinkedIn Profiles...</Typography>
          </Box>
          <LinearProgress sx={{ mb: 2 }} />
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="40%" height={18} />
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Results */}
      {results && results.profiles.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: '#667eea' }} />
                <Typography variant="h6">Scraped Profiles</Typography>
                <Chip 
                  label={`${results.profiles.length} found`} 
                  sx={{ ml: 2, background: '#e8f5e8', color: '#2e7d32' }}
                />
              </Box>
              <Button
                variant="outlined"
                onClick={handleDownload}
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2 }}
              >
                Download CSV
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafbfc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Profile</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Headline</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.profiles.map((profile, index) => (
                  <TableRow 
                    key={profile.id || index}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafbfc' },
                      '&:hover': { backgroundColor: '#f0f7ff' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={profile.imageUrl}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {profile.name || 'N/A'}
                          </Typography>
                          {profile.connections && (
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {profile.connections} connections
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {profile.headline || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                        <Typography variant="body2">
                          {profile.company || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                        <Typography variant="body2">
                          {profile.location || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<LinkedInIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Empty State */}
      {results && results.profiles.length === 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            border: '1px solid rgba(0,0,0,0.06)', 
            borderRadius: 3 
          }}
        >
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              mx: 'auto', 
              mb: 2, 
              backgroundColor: '#f5f5f5',
              color: '#999'
            }}
          >
            <PersonIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ mb: 1, color: '#666' }}>
            No Profiles Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
            Try adjusting your search URL or increasing the record count.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleScrape}
            startIcon={<RefreshIcon />}
            sx={{ borderRadius: 2 }}
          >
            Try Again
          </Button>
        </Paper>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={error ? 'error' : 'success'} 
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}