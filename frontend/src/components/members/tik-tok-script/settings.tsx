import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Switch, FormControlLabel,
  Button, Divider, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert, Chip, Card, CardContent,
} from '@mui/material';
import Settings from '@mui/icons-material/Settings';
import Notifications from '@mui/icons-material/Notifications';
import Lock from '@mui/icons-material/Lock';
import Palette from '@mui/icons-material/Palette';
import Language from '@mui/icons-material/Language';
import Save from '@mui/icons-material/Save';
import Security from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import DarkMode from '@mui/icons-material/DarkMode';
import DeleteForever from '@mui/icons-material/DeleteForever';

export function MembersSettingsPage() {
  const [snackbar, setSnackbar] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true,
    theme: 'light',
    language: 'en',
    profileVisibility: 'public',
    twoFactor: false,
    loginAlerts: true,
    dataSharing: false,
  });

  const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));
  const handleSave = () => setSnackbar(true);

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>{icon} {title}</Typography>
      <Divider sx={{ mb: 2 }} />{children}
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
        color: '#fff',
      }}>
        <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings /> Settings
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Manage your tik tok script account preferences</Typography>
      </Paper>

      <Section icon={<Notifications sx={{ color: '#1976d2' }} />} title="Notifications">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={e => update('emailNotifications', e.target.checked)} />} label="Email notifications" />
          <FormControlLabel control={<Switch checked={settings.pushNotifications} onChange={e => update('pushNotifications', e.target.checked)} />} label="Push notifications" />
          <FormControlLabel control={<Switch checked={settings.weeklyDigest} onChange={e => update('weeklyDigest', e.target.checked)} />} label="Weekly digest email" />
          <FormControlLabel control={<Switch checked={settings.marketingEmails} onChange={e => update('marketingEmails', e.target.checked)} />} label="Marketing & product updates" />
        </Box>
      </Section>

      <Section icon={<Palette sx={{ color: '#1976d2' }} />} title="Appearance">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel><DarkMode sx={{ fontSize: 16, mr: 0.5 }} /> Theme</InputLabel>
              <Select value={settings.theme} label="Theme" onChange={e => update('theme', e.target.value)}>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel><Language sx={{ fontSize: 16, mr: 0.5 }} /> Language</InputLabel>
              <Select value={settings.language} label="Language" onChange={e => update('language', e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Section>

      <Section icon={<Security sx={{ color: '#1976d2' }} />} title="Privacy & Security">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel control={<Switch checked={settings.twoFactor} onChange={e => update('twoFactor', e.target.checked)} />} label="Two-factor authentication" />
          <FormControlLabel control={<Switch checked={settings.loginAlerts} onChange={e => update('loginAlerts', e.target.checked)} />} label="Login alerts" />
          <FormControlLabel control={<Switch checked={settings.dataSharing} onChange={e => update('dataSharing', e.target.checked)} />} label="Data sharing with third parties" />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Visibility sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">Profile visibility:</Typography>
            <Chip label={settings.profileVisibility} size="small" color={settings.profileVisibility === 'public' ? 'success' : 'default'}
              onClick={() => update('profileVisibility', settings.profileVisibility === 'public' ? 'private' : 'public')} />
          </Box>
        </Box>
      </Section>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outlined" color="error" startIcon={<DeleteForever />}>Delete Account</Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#0050ac' } }}>
          Save Changes
        </Button>
      </Box>

      <Snackbar open={snackbar} autoHideDuration={4000} onClose={() => setSnackbar(false)}>
        <Alert severity="success" onClose={() => setSnackbar(false)}>Settings saved successfully!</Alert>
      </Snackbar>
    </Box>
  );
}