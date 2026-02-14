```tsx
import { Box, Typography, Switch, FormControlLabel, Button, Snackbar, Alert, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import { NotificationSettings, PrivacySettings } from '../../../types/membersArea';
import { API } from '../../../config/api';

export function MembersSettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: false,
    pushNotifications: false,
    privacySettings: {
      profileVisibility: 'private',
      dataSharing: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/user/settings`);
      const data = await res.json();
      setNotificationSettings(data);
    } catch (err) {
      setError('Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChangeNotificationSetting = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleChangePrivacySetting = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setNotificationSettings((prev) => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, [name]: checked },
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await fetch(`${API}/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });
      setSnackbarMessage('Settings saved successfully!');
    } catch {
      setSnackbarMessage('Failed to save settings.');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fafbfc', borderRadius: 12, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>Account Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Notifications</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.emailNotifications}
                onChange={handleChangeNotificationSetting}
                name="emailNotifications"
                color="primary"
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.pushNotifications}
                onChange={handleChangeNotificationSetting}
                name="pushNotifications"
                color="primary"
              />
            }
            label="Push Notifications"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Privacy Settings</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.privacySettings.profileVisibility === 'public'}
                onChange={handleChangePrivacySetting}
                name="profileVisibility"
                color="primary"
              />
            }
            label="Public Profile"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.privacySettings.dataSharing}
                onChange={handleChangePrivacySetting}
                name="dataSharing"
                color="primary"
              />
            }
            label="Data Sharing"
          />
        </Grid>
        <Grid item xs={12} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={handleSaveSettings} sx={{ backgroundColor: '#1976d2' }}>
            Save Settings
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
```