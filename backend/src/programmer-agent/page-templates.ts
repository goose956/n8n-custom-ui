/**
 * Static page templates for members area pages that are essentially identical
 * across all SaaS apps. Only the app name, primary color, and app ID are
 * interpolated — no AI tokens wasted on boilerplate.
 *
 * Pages that use templates:  profile, settings, admin
 * Pages that still use AI:   dashboard (domain-specific), custom
 */

interface TemplateVars {
  appName: string;
  appId: number;
  primaryColor: string;
  secondaryColor: string;
}

function hex(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

// ─── Profile Page ───────────────────────────────────────────────────────────

export function profileTemplate(v: TemplateVars): string {
  const p = hex(v.primaryColor);
  const s = hex(v.secondaryColor);
  return `import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider,
  Chip, Skeleton, IconButton, Snackbar, Alert, Card, CardContent,
  LinearProgress, Tooltip,
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
import Star from '@mui/icons-material/Star';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  plan: string;
  joinedDate: string;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com',
  phone: '+1 555-0123', bio: 'Passionate ${v.appName} user since day one.',
  avatar: '', plan: 'Pro', joinedDate: '2025-06-15',
};

export function MembersProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    setProfile(draft);
    setEditing(false);
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

  const completionPct = [profile.firstName, profile.email, profile.phone, profile.bio].filter(Boolean).length * 25;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={3}>
          {[1,2,3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Hero header */}
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, ${p} 0%, ${s} 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 96, height: 96, fontSize: 40, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)' }}>
              {profile.firstName[0]}{profile.lastName[0]}
            </Avatar>
            <IconButton sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: 'rgba(255,255,255,0.9)', width: 32, height: 32, '&:hover': { bgcolor: '#fff' } }}>
              <PhotoCamera sx={{ fontSize: 16, color: '${p}' }} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{profile.firstName} {profile.lastName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip icon={<Star sx={{ color: '#FFD700 !important' }} />} label={profile.plan + ' Member'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
              <Chip icon={<CalendarToday sx={{ color: '#fff !important', fontSize: 14 }} />} label={'Joined ' + new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
            </Box>
          </Box>
          {!editing && (
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDraft(profile); setEditing(true); }}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600 }}>
              Edit Profile
            </Button>
          )}
        </Box>
      </Paper>

      {/* Profile completion */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircle sx={{ color: completionPct === 100 ? '#4caf50' : '${p}' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Profile Completion — {completionPct}%</Typography>
            <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: completionPct === 100 ? '#4caf50' : '${p}', borderRadius: 4 } }} />
          </Box>
        </CardContent>
      </Card>

      {/* Info cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountCircle sx={{ color: '${p}' }} /> Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {editing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="First Name" value={draft.firstName} onChange={e => setDraft({ ...draft, firstName: e.target.value })} fullWidth size="small" />
                  <TextField label="Last Name" value={draft.lastName} onChange={e => setDraft({ ...draft, lastName: e.target.value })} fullWidth size="small" />
                  <TextField label="Bio" value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} fullWidth multiline rows={3} size="small" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge sx={{ color: '#888', fontSize: 20 }} />
                    <Typography variant="body1"><strong>Name:</strong> {profile.firstName} {profile.lastName}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 3.5 }}>{profile.bio || 'No bio yet'}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Email sx={{ color: '${p}' }} /> Contact Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {editing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} fullWidth size="small" type="email" />
                  <TextField label="Phone" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} fullWidth size="small" />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ color: '#888', fontSize: 20 }} />
                    <Typography variant="body1">{profile.email}</Typography>
                    <Chip label="Verified" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: 11 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: '#888', fontSize: 20 }} />
                    <Typography variant="body1">{profile.phone || 'Not set'}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save / Cancel bar */}
      {editing && (
        <Paper sx={{ mt: 3, p: 2, borderRadius: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ textTransform: 'none', bgcolor: '${p}', '&:hover': { bgcolor: '${s}' } }}>Save Changes</Button>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
`;
}

// ─── Settings Page ──────────────────────────────────────────────────────────

export function settingsTemplate(v: TemplateVars): string {
  const p = hex(v.primaryColor);
  const s = hex(v.secondaryColor);
  return `import { useState } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Switch, FormControlLabel,
  Divider, Button, Select, MenuItem, FormControl, InputLabel, Grid,
  Snackbar, Alert, Chip, Tooltip,
} from '@mui/material';
import Settings from '@mui/icons-material/Settings';
import Notifications from '@mui/icons-material/Notifications';
import Lock from '@mui/icons-material/Lock';
import Palette from '@mui/icons-material/Palette';
import Language from '@mui/icons-material/Language';
import Save from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DarkMode from '@mui/icons-material/DarkMode';
import Email from '@mui/icons-material/Email';
import Shield from '@mui/icons-material/Shield';
import DeleteForever from '@mui/icons-material/DeleteForever';

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  profileVisibility: 'public' | 'private' | 'members';
  darkMode: boolean;
  language: string;
  twoFactor: boolean;
  loginAlerts: boolean;
}

const INITIAL: SettingsState = {
  emailNotifications: true, pushNotifications: true, marketingEmails: false,
  weeklyDigest: true, profileVisibility: 'public', darkMode: false,
  language: 'en', twoFactor: false, loginAlerts: true,
};

export function MembersSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(INITIAL);
  const [dirty, setDirty] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const update = <K extends keyof SettingsState>(key: K, val: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    setDirty(false);
    setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
  };

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon} {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, ${p} 0%, ${s} 100%)', color: '#fff' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings /> Account Settings
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>Manage your ${v.appName} preferences, notifications, and security</Typography>
      </Paper>

      <Section icon={<Notifications sx={{ color: '${p}' }} />} title="Notifications">
        <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={e => update('emailNotifications', e.target.checked)} sx={{ '& .Mui-checked': { color: '${p}' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '${p}' } }} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Email Notifications</Typography><Typography variant="body2" color="text.secondary">Receive updates about your ${v.appName} activity</Typography></Box>} sx={{ mb: 1, alignItems: 'flex-start' }} />
        <FormControlLabel control={<Switch checked={settings.pushNotifications} onChange={e => update('pushNotifications', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Push Notifications</Typography><Typography variant="body2" color="text.secondary">Get instant alerts in your browser</Typography></Box>} sx={{ mb: 1, alignItems: 'flex-start' }} />
        <FormControlLabel control={<Switch checked={settings.weeklyDigest} onChange={e => update('weeklyDigest', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Weekly Digest</Typography><Typography variant="body2" color="text.secondary">Summary of your ${v.appName} activity each week</Typography></Box>} sx={{ mb: 1, alignItems: 'flex-start' }} />
        <FormControlLabel control={<Switch checked={settings.marketingEmails} onChange={e => update('marketingEmails', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Marketing Emails</Typography><Typography variant="body2" color="text.secondary">Tips, features, and offers from ${v.appName}</Typography></Box>} sx={{ alignItems: 'flex-start' }} />
      </Section>

      <Section icon={<Lock sx={{ color: '${p}' }} />} title="Privacy & Security">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Profile Visibility</InputLabel>
              <Select value={settings.profileVisibility} label="Profile Visibility" onChange={e => update('profileVisibility', e.target.value as any)}>
                <MenuItem value="public"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Visibility fontSize="small" /> Public</Box></MenuItem>
                <MenuItem value="members"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Shield fontSize="small" /> Members Only</Box></MenuItem>
                <MenuItem value="private"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VisibilityOff fontSize="small" /> Private</Box></MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <FormControlLabel control={<Switch checked={settings.twoFactor} onChange={e => update('twoFactor', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Two-Factor Authentication</Typography><Typography variant="body2" color="text.secondary">Add an extra layer of security</Typography></Box>} sx={{ mb: 1, alignItems: 'flex-start' }} />
        <FormControlLabel control={<Switch checked={settings.loginAlerts} onChange={e => update('loginAlerts', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Login Alerts</Typography><Typography variant="body2" color="text.secondary">Get notified when your account is accessed from a new device</Typography></Box>} sx={{ alignItems: 'flex-start' }} />
      </Section>

      <Section icon={<Palette sx={{ color: '${p}' }} />} title="Appearance">
        <FormControlLabel control={<Switch checked={settings.darkMode} onChange={e => update('darkMode', e.target.checked)} />}
          label={<Box><Typography variant="body1" fontWeight={600}>Dark Mode</Typography><Typography variant="body2" color="text.secondary">Easier on the eyes at night</Typography></Box>} sx={{ mb: 2, alignItems: 'flex-start' }} />
        <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
          <InputLabel>Language</InputLabel>
          <Select value={settings.language} label="Language" onChange={e => update('language', e.target.value)} startAdornment={<Language sx={{ mr: 1, color: '#888' }} />}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
          </Select>
        </FormControl>
      </Section>

      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #ffcdd2' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#d32f2f' }}>
            <DeleteForever sx={{ color: '#d32f2f' }} /> Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Once you delete your account, all your ${v.appName} data will be permanently removed.</Typography>
          <Button variant="outlined" color="error" size="small" sx={{ textTransform: 'none' }}>Delete Account</Button>
        </CardContent>
      </Card>

      {dirty && (
        <Paper sx={{ position: 'sticky', bottom: 16, p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <Chip label="Unsaved changes" color="warning" size="small" />
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ textTransform: 'none', bgcolor: '${p}', '&:hover': { bgcolor: '${s}' } }}>Save Settings</Button>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
`;
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export function adminTemplate(v: TemplateVars): string {
  const p = hex(v.primaryColor);
  const s = hex(v.secondaryColor);
  return `import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Grid, Chip, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
  CircularProgress, Divider, Avatar, Tooltip, IconButton, Skeleton, LinearProgress,
  Snackbar, Alert,
} from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AttachMoney from '@mui/icons-material/AttachMoney';
import BugReport from '@mui/icons-material/BugReport';
import Api from '@mui/icons-material/Api';
import Refresh from '@mui/icons-material/Refresh';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import Error from '@mui/icons-material/Error';
import Visibility from '@mui/icons-material/Visibility';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Speed from '@mui/icons-material/Speed';
import Storage from '@mui/icons-material/Storage';

const API_BASE = 'http://localhost:3000';

interface AppStats { app_id: number; name: string; active_subscriptions: number; total_subscriptions: number; total_revenue: number; created_at: string; }
interface AppAnalytics { app_id: number; total_page_views: number; unique_visitors: number; page_stats: Record<string,number>; views_by_date: Record<string,number>; recent_views: any[]; }
interface Visitor { visitor_id: string; first_visit: string; last_visit: string; page_views: number; pages: string[]; }
interface ErrorLog { id: number; source: string; severity: string; message: string; timestamp: string; resolved: boolean; }
interface ApiUsageSummary { totalCalls: number; successRate: number; totalTokens: number; totalCost: number; avgDuration: number; byProvider: Record<string,number>; byModule: Record<string,number>; }

export function MembersAdminPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [errorSummary, setErrorSummary] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsageSummary | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, visitorsRes, errorsRes, apiRes] = await Promise.all([
        fetch(API_BASE + '/api/apps/${v.appId}/stats').then(r => r.json()),
        fetch(API_BASE + '/api/analytics/app/${v.appId}').then(r => r.json()),
        fetch(API_BASE + '/api/analytics/app/${v.appId}/visitors').then(r => r.json()),
        fetch(API_BASE + '/api/analytics/errors?resolved=false').then(r => r.json()),
        fetch(API_BASE + '/api/analytics/api-usage').then(r => r.json()),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);
      setVisitors(Array.isArray(visitorsRes) ? visitorsRes : []);
      if (errorsRes && typeof errorsRes === 'object') {
        setErrors(Array.isArray(errorsRes.errors) ? errorsRes.errors : Array.isArray(errorsRes) ? errorsRes : []);
        setErrorSummary(errorsRes.summary || null);
      }
      if (apiRes && typeof apiRes === 'object') {
        setApiUsage(apiRes.summary || apiRes);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setSnackbar({ open: true, message: 'Failed to load some data. Check the backend.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resolveError = async (id: number) => {
    try {
      await fetch(API_BASE + '/api/analytics/errors/' + id + '/resolve', { method: 'POST' });
      setErrors(prev => prev.filter(e => e.id !== id));
      setSnackbar({ open: true, message: 'Error resolved.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to resolve error.', severity: 'error' });
    }
  };

  const severity = (s: string) => {
    const m: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      critical: { color: '#d32f2f', bg: '#ffebee', icon: <Error sx={{ fontSize: 14 }} /> },
      error: { color: '#e65100', bg: '#fff3e0', icon: <Warning sx={{ fontSize: 14 }} /> },
      warning: { color: '#f57f17', bg: '#fffde7', icon: <Warning sx={{ fontSize: 14 }} /> },
    };
    return m[s] || m.warning;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={2}>
          {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ mt: 3, borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, ${p} 0%, ${s} 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Dashboard /> Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>${v.appName} — Real-time monitoring & management</Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />} onClick={fetchAll}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none' }}>Refresh</Button>
      </Paper>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Page Views', value: analytics?.total_page_views ?? 0, icon: <Visibility />, color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Unique Visitors', value: analytics?.unique_visitors ?? 0, icon: <People />, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Revenue', value: '$' + (stats?.total_revenue ?? 0).toLocaleString(), icon: <AttachMoney />, color: '#e65100', bg: '#fff3e0' },
          { label: 'Subscriptions', value: stats?.active_subscriptions ?? 0, icon: <TrendingUp />, color: '#6a1b9a', bg: '#f3e5f5' },
        ].map((kpi, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color, width: 52, height: 52 }}>{kpi.icon}</Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{kpi.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #eee', '& .Mui-selected': { color: '${p}' }, '& .MuiTabs-indicator': { backgroundColor: '${p}' } }}>
          <Tab label="Visitors" icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Error Logs" icon={<BugReport sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="API Usage" icon={<Api sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Visitors tab */}
          {tab === 0 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Visitor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Page Views</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>First Visit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Visit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pages</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.length === 0 ? (
                  <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}><People sx={{ fontSize: 48, color: '#ccc', mb: 1 }} /><Typography color="text.secondary">No visitor data yet</Typography></TableCell></TableRow>
                ) : visitors.slice(0, 20).map((vis, i) => (
                  <TableRow key={vis.visitor_id || i} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{vis.visitor_id?.slice(0, 12) || 'anonymous'}...</Typography></TableCell>
                    <TableCell><Chip size="small" label={vis.page_views} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{vis.first_visit ? new Date(vis.first_visit).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{vis.last_visit ? new Date(vis.last_visit).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell>{(vis.pages || []).slice(0, 3).map((pg: string, j: number) => <Chip key={j} label={pg} size="small" sx={{ mr: 0.5, fontSize: 11 }} />)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Errors tab */}
          {tab === 1 && (
            <Box>
              {errorSummary && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: 'Total', value: errorSummary.total || 0, color: '#1565c0' },
                    { label: 'Critical', value: errorSummary.critical || 0, color: '#d32f2f' },
                    { label: 'Unresolved', value: errorSummary.unresolved || 0, color: '#e65100' },
                  ].map((s, i) => (
                    <Grid item xs={4} key={i}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: s.color + '10', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                        <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.length === 0 ? (
                    <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}><CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} /><Typography color="text.secondary">No unresolved errors</Typography></TableCell></TableRow>
                  ) : errors.map((err, i) => {
                    const sv = severity(err.severity);
                    return (
                      <TableRow key={err.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <TableCell><Chip size="small" icon={sv.icon} label={err.severity} sx={{ bgcolor: sv.bg, color: sv.color, fontWeight: 600, fontSize: 11 }} /></TableCell>
                        <TableCell><Typography variant="body2">{err.source}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.message}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{err.timestamp ? new Date(err.timestamp).toLocaleString() : '—'}</Typography></TableCell>
                        <TableCell><Tooltip title="Mark as resolved"><IconButton size="small" onClick={() => resolveError(err.id)} sx={{ color: '#4caf50' }}><CheckCircle fontSize="small" /></IconButton></Tooltip></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* API Usage tab */}
          {tab === 2 && (
            <Box>
              {apiUsage ? (
                <Grid container spacing={2}>
                  {[
                    { label: 'Total Calls', value: apiUsage.totalCalls?.toLocaleString() || '0', icon: <Api />, color: '${p}' },
                    { label: 'Success Rate', value: (apiUsage.successRate || 0).toFixed(1) + '%', icon: <CheckCircle />, color: '#4caf50' },
                    { label: 'Avg Duration', value: (apiUsage.avgDuration || 0).toFixed(0) + 'ms', icon: <Speed />, color: '#ff9800' },
                    { label: 'Total Cost', value: '$' + (apiUsage.totalCost || 0).toFixed(2), icon: <AttachMoney />, color: '#e65100' },
                  ].map((m, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
                        <Box sx={{ color: m.color, mb: 0.5 }}>{m.icon}</Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{m.value}</Typography>
                        <Typography variant="body2" color="text.secondary">{m.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}><Storage sx={{ fontSize: 48, color: '#ccc' }} /><Typography color="text.secondary">No API usage data available</Typography></Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
`;
}

// ─── Template registry ──────────────────────────────────────────────────────

const TEMPLATE_MAP: Record<string, (v: TemplateVars) => string> = {
  profile: profileTemplate,
  settings: settingsTemplate,
  admin: adminTemplate,
};

/** Check if a page type has a static template (no AI needed) */
export function hasTemplate(pageType: string): boolean {
  return pageType in TEMPLATE_MAP;
}

/** Get the rendered template for a page type. Returns null if no template exists. */
export function getPageTemplate(
  pageType: string,
  vars: TemplateVars,
): { path: string; content: string } | null {
  const fn = TEMPLATE_MAP[pageType];
  if (!fn) return null;
  return {
    path: `frontend/src/components/members/${pageType}.tsx`,
    content: fn(vars),
  };
}
