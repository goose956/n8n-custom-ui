import { useState } from 'react';
import {
 Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider,
 Chip, Snackbar, Alert, IconButton, Card, CardContent,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Edit from '@mui/icons-material/Edit';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import Badge from '@mui/icons-material/Badge';
import CalendarToday from '@mui/icons-material/CalendarToday';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import WorkspacePremium from '@mui/icons-material/WorkspacePremium';
import VerifiedUser from '@mui/icons-material/VerifiedUser';


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


export function MembersProfilePage() {
 const [editing, setEditing] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
 const [profile, setProfile] = useState({
  firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1 555-0123',
  bio: 'Welcome to YouTube Automations, your all-in-one hub for maximizing your YouTube channel\'s potential through AI-driven tools and features.', joinDate: '2025-06-15', plan: 'Pro',
 });
 const [draft, setDraft] = useState({ ...profile });

 const handleSave = () => { setProfile({ ...draft }); setEditing(false); setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' }); };
 const handleCancel = () => { setDraft({ ...profile }); setEditing(false); };

 return (
  <Box sx={{ maxWidth: 960, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(220, -70, -50)} />
    <Box sx={floatingCircle(140, 30, 140, 0.05)} />
    <Box sx={floatingCircle(90, -30, 350, 0.06)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
     <Box sx={{ position: 'relative' }}>
      <Avatar sx={{ width: 100, height: 100, fontSize: 36, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', fontWeight: 700 }}>
       {profile.firstName[0]}{profile.lastName[0]}
      </Avatar>
      <IconButton size="small" sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' }, width: 28, height: 28 }}>
       <PhotoCamera sx={{ fontSize: 14 }} />
      </IconButton>
     </Box>
     <Box sx={{ flex: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>{profile.firstName} {profile.lastName}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
       <Chip icon={<WorkspacePremium sx={{ color: '#fff !important' }} />} label={profile.plan + ' Plan'} size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, backdropFilter: 'blur(4px)' }} />
       <Chip icon={<CalendarToday sx={{ color: '#fff !important' }} />} label={'Joined ' + new Date(profile.joinDate).toLocaleDateString()} size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }} />
      </Box>
     </Box>
     <Box>
      {!editing ? (
       <Button variant="contained" startIcon={<Edit />} onClick={() => setEditing(true)}
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
        Edit Profile
       </Button>
      ) : (
       <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}
         sx={{ bgcolor: COLORS.success, fontWeight: 600, '&:hover': { bgcolor: '#388e3c' } }}>Save</Button>
        <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel}
         sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Cancel</Button>
       </Box>
      )}
     </Box>
    </Box>
   </Paper>

   <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
     <Paper sx={sectionSx}>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
       <Badge sx={{ color: COLORS.primary }} /> Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Manage your personal details</Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={2.5}>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth label="First Name" value={editing ? draft.firstName : profile.firstName}
         onChange={e => setDraft({ ...draft, firstName: e.target.value })} disabled={!editing} />
       </Grid>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Last Name" value={editing ? draft.lastName : profile.lastName}
         onChange={e => setDraft({ ...draft, lastName: e.target.value })} disabled={!editing} />
       </Grid>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Email" value={editing ? draft.email : profile.email}
         onChange={e => setDraft({ ...draft, email: e.target.value })} disabled={!editing}
         InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
       </Grid>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Phone" value={editing ? draft.phone : profile.phone}
         onChange={e => setDraft({ ...draft, phone: e.target.value })} disabled={!editing}
         InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
       </Grid>
       <Grid item xs={12}>
        <TextField fullWidth label="Bio" value={editing ? draft.bio : profile.bio}
         onChange={e => setDraft({ ...draft, bio: e.target.value })} disabled={!editing} multiline rows={3} />
       </Grid>
      </Grid>
     </Paper>
    </Grid>

    <Grid item xs={12} md={4}>
     <Card sx={{ ...cardSx, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
       <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AccountCircle sx={{ color: COLORS.primary }} /> Account
       </Typography>
       <Divider sx={{ mb: 2.5 }} />
       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {[
         { label: 'Plan', value: <Chip label={profile.plan} size="small" sx={{ ...gradientBtnSx, height: 24, fontSize: '0.75rem' }} /> },
         { label: 'Status', value: <Chip icon={<VerifiedUser sx={{ fontSize: '14px !important', color: COLORS.success + ' !important' }} />} label="Active" size="small" sx={{ bgcolor: COLORS.success + '15', color: COLORS.success, fontWeight: 600 }} /> },
         { label: 'Member Since', value: <Typography variant="body2" fontWeight={600}>{new Date(profile.joinDate).toLocaleDateString()}</Typography> },
        ].map((row, i) => (
         <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={statLabelSx}>{row.label}</Typography>
          {row.value}
         </Box>
        ))}
       </Box>
      </CardContent>
     </Card>
    </Grid>
   </Grid>

   <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
    <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
   </Snackbar>
  </Box>
 );
}