===FILE: frontend/src/components/members/profile.tsx===  
import { Box, Typography, TextField, Button, Snackbar, Card, CardContent, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { UserProfile } from '../../../types/membersArea';
import { API } from '../../../config/api';

export function MembersProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/user/profile`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleSave = async () => {
    if (profile) {
      try {
        const res = await fetch(`${API}/user/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        if (!res.ok) throw new Error('Failed to update profile');
        setSnackbarOpen(true);
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  if (loading) return <CircularProgress color="primary" />;
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!profile) return <Typography>No profile data available</Typography>;

  return (
    <Box sx={{ padding: 2, backgroundColor: '#fafbfc' }}>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Profile Information
      </Typography>
      <Card sx={{ borderRadius: 16, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 3 }}>
        <CardContent>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
          <TextField
            label="Bio"
            variant="outlined"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <TextField
            label="Linked TikTok Account"
            variant="outlined"
            fullWidth
            margin="normal"
            value={profile.linkedTikTokAccount}
            onChange={(e) => setProfile({ ...profile, linkedTikTokAccount: e.target.value })}
          />
          <Button variant="contained" color="primary" onClick={handleSave} sx={{ marginTop: 2 }}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        TikTok Activity History
      </Typography>
      <List>
        {profile.activityHistory.map((activity) => (
          <ListItem key={activity.videoId}>
            <ListItemText 
              primary={`Action: ${activity.action}`} 
              secondary={`Video ID: ${activity.videoId}`} 
            />
          </ListItem>
        ))}
      </List>
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleSnackbarClose} 
        message="Profile updated successfully" 
      />
    </Box>
  );
}
```  
===END_FILE===