import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider,
  Chip, Snackbar, Alert, Skeleton, IconButton, Tooltip, Card, CardContent,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Edit from '@mui/icons-material/Edit';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import Badge from '@mui/icons-material/Badge';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CheckCircle from '@mui/icons-material/CheckCircle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

export function MembersProfilePage() {
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [profile, setProfile] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+1 555-0123',
    bio: 'Active tik tok script user since 2025.',
    joinDate: '2025-06-15',
    plan: 'Pro',
  });
  const [draft, setDraft] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setEditing(false);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Hero header */}
      <Paper sx={{
        p: 4, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)' }}>
              {profile.firstName[0]}{profile.lastName[0]}
            </Avatar>
            <IconButton size="small" sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
              <PhotoCamera sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>{profile.firstName} {profile.lastName}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip icon={<CheckCircle />} label={profile.plan + ' Plan'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              <Chip icon={<CalendarToday />} label={'Joined ' + new Date(profile.joinDate).toLocaleDateString()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
            </Box>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {!editing ? (
              <Button variant="contained" startIcon={<Edit />} onClick={() => setEditing(true)}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>Save</Button>
                <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Details cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge sx={{ color: '#1976d2' }} /> Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" value={editing ? draft.firstName : profile.firstName}
                  onChange={e => setDraft({ ...draft, firstName: e.target.value })} disabled={!editing} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" value={editing ? draft.lastName : profile.lastName}
                  onChange={e => setDraft({ ...draft, lastName: e.target.value })} disabled={!editing} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" value={editing ? draft.email : profile.email}
                  onChange={e => setDraft({ ...draft, email: e.target.value })} disabled={!editing} size="small"
                  InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={editing ? draft.phone : profile.phone}
                  onChange={e => setDraft({ ...draft, phone: e.target.value })} disabled={!editing} size="small"
                  InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Bio" value={editing ? draft.bio : profile.bio}
                  onChange={e => setDraft({ ...draft, bio: e.target.value })} disabled={!editing} multiline rows={3} size="small" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircle sx={{ color: '#1976d2' }} /> Account Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Plan</Typography>
                  <Chip label={profile.plan} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Status</Typography>
                  <Chip label="Active" size="small" color="success" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Member Since</Typography>
                  <Typography variant="body2" fontWeight={500}>{new Date(profile.joinDate).toLocaleDateString()}</Typography>
                </Box>
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