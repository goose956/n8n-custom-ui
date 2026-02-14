import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Snackbar, TextField, Typography } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { UserProfile } from '../../../types/membersArea';
import { API } from '../../../config/api';
import { ContactForm } from './ContactForm';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function MembersProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/user/profile`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    // Save profile logic here
    setSnackbarMessage('Profile updated successfully');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '16px' }}>
      <Card sx={{ borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px' }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Profile Information</Typography>
          <TextField
            fullWidth
            label="Username"
            value={profile?.username || ''}
            onChange={(e) => setProfile({ ...profile!, username: e.target.value })}
            sx={{ mb: 2 }}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Email"
            value={profile?.email || ''}
            onChange={(e) => setProfile({ ...profile!, email: e.target.value })}
            sx={{ mb: 2 }}
            variant="outlined"
            type="email"
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <ContactForm />
    </Box>
  );
}