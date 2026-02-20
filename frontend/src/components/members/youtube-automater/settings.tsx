import { useState } from 'react';
import {
 Box, Typography, Paper, Grid, Switch,
 Button, Divider, Select, MenuItem, FormControl, InputLabel,
 Snackbar, Alert, Chip, Avatar,
} from '@mui/material';
import Settings from '@mui/icons-material/Settings';
import Palette from '@mui/icons-material/Palette';
import Save from '@mui/icons-material/Save';
import DeleteForever from '@mui/icons-material/DeleteForever';
import Shield from '@mui/icons-material/Shield';
import NotificationsActive from '@mui/icons-material/NotificationsActive';


const COLORS = {
 primary: '#1976d2',
 secondary: '#0050ac',
 tint: '#1976d215',
 bg: '#fafbfc',
 border: 'rgba(0,0,0,0.06)',
 shadow: '0 2px 12px rgba(0,0,0,0.04)',
 shadowHover: '0 8px 25px rgba(0,0,0,0.08)',
 success: '#4caf50',
 warning: '#ff9800',
 error: '#e74c3c',
 blue: '#2196f3',
 purple: '#9b59b6',
};

const heroSx = {
 p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative' as const, overflow: 'hidden',
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '#1976d240' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px #1976d240',
 '&:hover': { boxShadow: '0 6px 20px #1976d260', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};


export function MembersSettingsPage() {
 const [snackbar, setSnackbar] = useState(false);
 const [settings, setSettings] = useState({
  emailNotifications: true, pushNotifications: false, marketingEmails: false, weeklyDigest: true,
  theme: 'light', language: 'en', profileVisibility: 'public', twoFactor: false, loginAlerts: true, dataSharing: false,
 });
 const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));
 const handleSave = () => setSnackbar(true);

 const Section = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
  <Paper sx={sectionSx}>
   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
    <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.tint, color: COLORS.primary }}>{icon}</Avatar>
    <Box>
     <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>{title}</Typography>
     {subtitle && <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{subtitle}</Typography>}
    </Box>
   </Box>
   <Divider sx={{ my: 2 }} />
   {children}
  </Paper>
 );

 const SettingRow = ({ label, sub, control }: { label: string; sub?: string; control: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 1, borderRadius: 2,
   transition: 'all 0.15s', '&:hover': { bgcolor: COLORS.tint } }}>
   <Box>
    <Typography variant="body2" fontWeight={600}>{label}</Typography>
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
   </Box>
   {control}
  </Box>
 );

 return (
  <Box sx={{ maxWidth: 840, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -50, -30)} />
    <Box sx={floatingCircle(100, 10, 100, 0.05)} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
     <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Settings /> Settings
     </Typography>
     <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Manage your preferences, notifications, and integrations effortlessly.</Typography>
    </Box>
   </Paper>

   <Section icon={<NotificationsActive />} title="Notifications" subtitle="Choose how you want to be notified">
    <SettingRow label="Email notifications" sub="Get notified about important updates" control={<Switch checked={settings.emailNotifications} onChange={e => update('emailNotifications', e.target.checked)} />} />
    <SettingRow label="Push notifications" sub="Browser push notifications" control={<Switch checked={settings.pushNotifications} onChange={e => update('pushNotifications', e.target.checked)} />} />
    <SettingRow label="Weekly digest" sub="Summary of activity each week" control={<Switch checked={settings.weeklyDigest} onChange={e => update('weeklyDigest', e.target.checked)} />} />
    <SettingRow label="Marketing emails" sub="Product updates and offers" control={<Switch checked={settings.marketingEmails} onChange={e => update('marketingEmails', e.target.checked)} />} />
   </Section>

   <Section icon={<Palette />} title="Appearance" subtitle="Customise how the app looks">
    <Grid container spacing={2.5}>
     <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
       <InputLabel>Theme</InputLabel>
       <Select value={settings.theme} label="Theme" onChange={e => update('theme', e.target.value)}>
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
        <MenuItem value="system">System</MenuItem>
       </Select>
      </FormControl>
     </Grid>
     <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
       <InputLabel>Language</InputLabel>
       <Select value={settings.language} label="Language" onChange={e => update('language', e.target.value)}>
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="es">Espanol</MenuItem>
        <MenuItem value="fr">Francais</MenuItem>
        <MenuItem value="de">Deutsch</MenuItem>
       </Select>
      </FormControl>
     </Grid>
    </Grid>
   </Section>

   <Section icon={<Shield />} title="Privacy & Security" subtitle="Control your account security">
    <SettingRow label="Two-factor authentication" sub="Add an extra layer of security" control={<Switch checked={settings.twoFactor} onChange={e => update('twoFactor', e.target.checked)} />} />
    <SettingRow label="Login alerts" sub="Get notified of new sign-ins" control={<Switch checked={settings.loginAlerts} onChange={e => update('loginAlerts', e.target.checked)} />} />
    <SettingRow label="Data sharing" sub="Share anonymised usage data" control={<Switch checked={settings.dataSharing} onChange={e => update('dataSharing', e.target.checked)} />} />
    <SettingRow label="Profile visibility" sub="Who can see your profile" control={
     <Chip label={settings.profileVisibility} size="small"
      sx={{ cursor: 'pointer', fontWeight: 600, bgcolor: settings.profileVisibility === 'public' ? COLORS.success + '15' : 'grey.200', color: settings.profileVisibility === 'public' ? COLORS.success : 'text.secondary' }}
      onClick={() => update('profileVisibility', settings.profileVisibility === 'public' ? 'private' : 'public')} />
    } />
   </Section>

   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
    <Button variant="outlined" color="error" startIcon={<DeleteForever />}
     sx={{ fontWeight: 600, borderColor: COLORS.error + '40', color: COLORS.error, '&:hover': { bgcolor: COLORS.error + '08', borderColor: COLORS.error } }}>
     Delete Account
    </Button>
    <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={gradientBtnSx}>Save Changes</Button>
   </Box>

   <Snackbar open={snackbar} autoHideDuration={4000} onClose={() => setSnackbar(false)}>
    <Alert severity="success" onClose={() => setSnackbar(false)}>Settings saved successfully!</Alert>
   </Snackbar>
  </Box>
 );
}