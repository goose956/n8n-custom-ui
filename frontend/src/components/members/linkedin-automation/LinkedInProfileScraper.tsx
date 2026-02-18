import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Snackbar, Alert, Grid, Paper, Skeleton, Divider, Avatar, IconButton, Dialog, TextField } from '@mui/material';
import { Person as PersonIcon, Search as SearchIcon, ArrowUpward, ArrowDownward, Refresh as RefreshIcon } from '@mui/icons-material';
import { API } from '../../config/api';

interface LinkedInProfile {
  name: string;
  headline: string;
  company: string;
  location: string;
  connectionCount: number;
}

export function LinkedInProfileScraper() {
  const [loading, setLoading] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API.apps}/linkedin-scrape-profiles`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const data: LinkedInProfile[] = await res.json();
      setProfiles(data);
      setSnackbarMessage('Profiles fetched successfully!');
      setSnackbarSeverity('success');
    } catch (error) {
      setSnackbarMessage('Failed to fetch profiles. Please try again later.');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <Box sx={{ padding: 3, background: '#fafbfc', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          LinkedIn Profile Scraper <PersonIcon sx={{ ml: 1 }} />
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 10, ':hover': { backgroundColor: '#1560c3' } }}
          onClick={handleDialogOpen}
        >
          Scrape New Profiles <SearchIcon sx={{ ml: 1 }} />
        </Button>
      </Box>
      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))
        ) : (
          profiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} key={profile.name}>
              <Paper
                sx={{
                  p: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  borderRadius: 16,
                  '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>{profile.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#1a1a2e' }}>{profile.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>{profile.headline}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ color: '#1976d2' }}>Company: {profile.company}</Typography>
                <Typography variant="body2" sx={{ color: '#1976d2', mb: 1 }}>Location: {profile.location}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#27ae60' }}>
                    <ArrowUpward fontSize="small" /> {profile.connectionCount}+ connections
                  </Typography>
                  <IconButton color="primary" onClick={fetchProfiles}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <Box sx={{ padding: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Enter LinkedIn Search Query</Typography>
          <TextField
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            fullWidth
            placeholder="Search LinkedIn profiles..."
            sx={{ mb: 2, backgroundColor: '#fafbfc', borderRadius: 2 }}
          />
          <Button
            onClick={() => { handleDialogClose(); fetchProfiles(); }}
            variant="contained"
            color="primary"
            sx={{ mt: 2, borderRadius: 10, ':hover': { backgroundColor: '#1560c3' } }}
            fullWidth
          >
            Search <SearchIcon sx={{ ml: 1 }} />
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}