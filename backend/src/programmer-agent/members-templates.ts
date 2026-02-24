/**
 * Static page templates for members area pages that are identical across all SaaS apps.
 * Only the app name, app ID, and primary color are injected.
 * Design matches the main frontend: gradient accents, hover animations,
 * floating decorative shapes, polished shadows, and rich typography.
 * This saves ~15,000+ AI tokens per members area generation.
 */

interface TemplateParams {
 appName: string;
 appId: number;
 primaryColor: string;
 copy?: Record<string, any>;
}

/** Escape single quotes for safe interpolation inside JS string literals */
function esc(s: string): string { return s.replace(/'/g, "\\'"); }

function darken(hex: string, pct: number): string {
 const num = parseInt(hex.replace('#',''), 16);
 const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * pct));
 const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
 const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
 return`#${((r << 16) | (g << 8) | b).toString(16).padStart(6,'0')}`;
}

// ============================================================================
// SHARED DESIGN TOKENS — injected into every template as runtime constants
// ============================================================================

function sharedBlock(primary: string, sec: string): string {
 return `
const COLORS = {
 primary: '${primary}',
 secondary: '${sec}',
 tint: '${primary}15',
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
 background: 'linear-gradient(135deg, ${primary} 0%, ${sec} 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '${primary}40' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, ${primary} 0%, ${sec} 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px ${primary}40',
 '&:hover': { boxShadow: '0 6px 20px ${primary}60', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};
`;
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

export function dashboardTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const dHeroSub = c.heroSubtitle || `Here's what's happening with your ${p.appName} account today.`;
 const dStats = c.stats || [
  { label: 'Total Views', value: '2,847', change: '+12%' },
  { label: 'Active Users', value: '184', change: '+8%' },
  { label: 'Engagement', value: '94%', change: '+3%' },
  { label: 'Rating', value: '4.9', change: 'Top 5%' },
 ];
 const dAct = c.activity || [
  { title: 'New member joined', desc: 'Sarah K. signed up for Pro plan' },
  { title: 'Achievement unlocked', desc: 'Completed onboarding milestone' },
  { title: 'Content published', desc: 'New resource added to library' },
  { title: 'Feedback received', desc: '5-star review from Alex M.' },
 ];
 const dSteps = c.gettingStarted || ['Create your account', 'Complete your profile', 'Explore features', 'Invite team members'];
 return `import { useState } from 'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Avatar, Button,
 Chip, Divider, LinearProgress, List, ListItem, ListItemAvatar,
 ListItemText,
} from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import People from '@mui/icons-material/People';
import Star from '@mui/icons-material/Star';
import Schedule from '@mui/icons-material/Schedule';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Bolt from '@mui/icons-material/Bolt';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Visibility from '@mui/icons-material/Visibility';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';

${SB}

export function MembersDashboardPage() {
 const stats = [
  { label: '${esc(dStats[0].label)}', value: '${esc(dStats[0].value)}', change: '${esc(dStats[0].change)}', icon: <Visibility />, color: COLORS.primary },
  { label: '${esc(dStats[1].label)}', value: '${esc(dStats[1].value)}', change: '${esc(dStats[1].change)}', icon: <People />, color: COLORS.blue },
  { label: '${esc(dStats[2].label)}', value: '${esc(dStats[2].value)}', change: '${esc(dStats[2].change)}', icon: <TrendingUp />, color: COLORS.success },
  { label: '${esc(dStats[3].label)}', value: '${esc(dStats[3].value)}', change: '${esc(dStats[3].change)}', icon: <Star />, color: COLORS.warning },
 ];

 const recentActivity = [
  { title: '${esc(dAct[0].title)}', desc: '${esc(dAct[0].desc)}', time: '2 min ago', color: COLORS.success, icon: <People /> },
  { title: '${esc(dAct[1].title)}', desc: '${esc(dAct[1].desc)}', time: '1 hour ago', color: COLORS.warning, icon: <EmojiEvents /> },
  { title: '${esc(dAct[2].title)}', desc: '${esc(dAct[2].desc)}', time: '3 hours ago', color: COLORS.primary, icon: <Bolt /> },
  { title: '${esc(dAct[3].title)}', desc: '${esc(dAct[3].desc)}', time: '5 hours ago', color: COLORS.blue, icon: <Star /> },
 ];

 const quickLinks = [
  { label: 'View Profile', desc: 'Update your info', icon: <People /> },
  { label: 'Settings', desc: 'Preferences', icon: <Schedule /> },
  { label: 'Contact Us', desc: 'Get in touch', icon: <Bolt /> },
 ];

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(200, -60, -40)} />
    <Box sx={floatingCircle(120, 20, 120, 0.05)} />
    <Box sx={floatingCircle(80, -20, 300, 0.06)} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
     <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.5 }}>Welcome back</Typography>
     <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500 }}>${dHeroSub}</Typography>
    </Box>
   </Paper>

   <Grid container spacing={2.5} sx={{ mb: 4 }}>
    {stats.map((s, i) => (
     <Grid item xs={12} sm={6} md={3} key={i}>
      <Card sx={cardSx}>
       <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
         <Avatar sx={{ width: 44, height: 44, bgcolor: s.color + '15', color: s.color }}>{s.icon}</Avatar>
         <Chip label={s.change} size="small" sx={{ bgcolor: COLORS.success + '15', color: COLORS.success, fontWeight: 600, fontSize: '0.75rem' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.25 }}>{s.value}</Typography>
        <Typography sx={statLabelSx}>{s.label}</Typography>
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>

   <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
     <Paper sx={sectionSx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
       <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Recent Activity</Typography>
       <Chip label="Live" size="small" icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: COLORS.success + ' !important' }} />}
        sx={{ bgcolor: COLORS.success + '15', color: COLORS.success, fontWeight: 600 }} />
      </Box>
      <List disablePadding>
       {recentActivity.map((a, i) => (
        <ListItem key={i} sx={{ px: 0, py: 1.5, borderBottom: i < recentActivity.length - 1 ? '1px solid ' + COLORS.border : 'none' }}>
         <ListItemAvatar>
          <Avatar sx={{ bgcolor: a.color + '15', color: a.color, width: 40, height: 40 }}>{a.icon}</Avatar>
         </ListItemAvatar>
         <ListItemText primary={<Typography variant="body2" fontWeight={600}>{a.title}</Typography>} secondary={a.desc} />
         <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{a.time}</Typography>
        </ListItem>
       ))}
      </List>
     </Paper>
    </Grid>

    <Grid item xs={12} md={4}>
     <Paper sx={sectionSx}>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 2 }}>Quick Links</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
       {quickLinks.map((q, i) => (
        <Card key={i} sx={{ ...cardSx, cursor: 'pointer', '&:hover': { ...cardSx['&:hover'], bgcolor: COLORS.tint } }}>
         <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: COLORS.tint, color: COLORS.primary, width: 40, height: 40 }}>{q.icon}</Avatar>
          <Box sx={{ flex: 1 }}>
           <Typography variant="body2" fontWeight={700}>{q.label}</Typography>
           <Typography variant="caption" color="text.secondary">{q.desc}</Typography>
          </Box>
          <ArrowForward sx={{ color: 'text.disabled', fontSize: 18 }} />
         </CardContent>
        </Card>
       ))}
      </Box>
     </Paper>

     <Paper sx={{ ...sectionSx, mt: 3, background: 'linear-gradient(135deg, ${p.primaryColor}08 0%, ${sec}08 100%)' }}>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 1 }}>Getting Started</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Complete your setup</Typography>
      <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: COLORS.border,
       '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, ${p.primaryColor}, ${sec})' } }} />
      <Typography variant="caption" color="text.secondary">3 of 4 steps completed</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
       {[{ done: true, label: '${esc(dSteps[0])}' }, { done: true, label: '${esc(dSteps[1])}' }, { done: true, label: '${esc(dSteps[2])}' }, { done: false, label: '${esc(dSteps[3])}' }].map((s, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         <CheckCircle sx={{ fontSize: 18, color: s.done ? COLORS.success : 'text.disabled' }} />
         <Typography variant="body2" sx={{ color: s.done ? 'text.secondary' : 'text.primary', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</Typography>
        </Box>
       ))}
      </Box>
     </Paper>
    </Grid>
   </Grid>
  </Box>
 );
}`;
}

// ============================================================================
// PROFILE PAGE
// ============================================================================

export function profileTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const pBio = c.bio || `Active ${p.appName} user since 2025.`;
 return `import { useState } from 'react';
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

${SB}

export function MembersProfilePage() {
 const [editing, setEditing] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
 const [profile, setProfile] = useState({
  firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1 555-0123',
  bio: '${esc(pBio)}', joinDate: '2025-06-15', plan: 'Pro',
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
}`;
}

// ============================================================================
// SETTINGS PAGE
// ============================================================================

export function settingsTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const sHeroSub = c.heroSubtitle || `Manage your ${p.appName} account preferences`;
 return `import { useState } from 'react';
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

${SB}

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
     <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>${sHeroSub}</Typography>
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
}`;
}

// ============================================================================
// ADMIN PAGE (Analytics + Contact Submissions)
// ============================================================================

export function adminTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const aHeroSub = c.heroSubtitle || 'Manage users, analytics, and messages';
 return `import { useEffect, useState, useCallback } from 'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
 Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
 Avatar, Skeleton, LinearProgress, Alert, Snackbar, IconButton,
 Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
 Tooltip,
} from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Visibility from '@mui/icons-material/Visibility';
import Refresh from '@mui/icons-material/Refresh';
import Email from '@mui/icons-material/Email';
import MarkEmailRead from '@mui/icons-material/MarkEmailRead';
import Delete from '@mui/icons-material/Delete';
import MoreVert from '@mui/icons-material/MoreVert';
import Inbox from '@mui/icons-material/Inbox';
import FiberNew from '@mui/icons-material/FiberNew';
import Analytics from '@mui/icons-material/Analytics';
import PersonOff from '@mui/icons-material/PersonOff';
import PersonAdd from '@mui/icons-material/PersonAdd';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import GroupAdd from '@mui/icons-material/GroupAdd';

const API = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

${SB}

interface AppStats { app_id: number; name: string; active_subscriptions: number; total_subscriptions: number; total_revenue: number; created_at: string; }
interface AnalyticsData { app_id: number; total_page_views: number; unique_visitors: number; page_stats: Record<string, number>; views_by_date: Record<string, number>; recent_views: any[]; }
interface ContactSubmission { id: number; app_id?: number; name: string; email: string; subject: string; message: string; status: 'new' | 'read' | 'replied' | 'archived'; created_at: string; }
interface AppMember { id: number; app_id: number; name: string; email: string; plan_name: string; plan_price: number; status: string; created_at: string; subscription_id?: number; }

export function MembersAdminPage() {
 const [tab, setTab] = useState(0);
 const [loading, setLoading] = useState(true);
 const [stats, setStats] = useState<AppStats | null>(null);
 const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
 const [contacts, setContacts] = useState<ContactSubmission[]>([]);
 const [members, setMembers] = useState<AppMember[]>([]);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
 const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; id: number | null }>({ el: null, id: null });
 const [memberMenu, setMemberMenu] = useState<{ el: HTMLElement | null; member: AppMember | null }>({ el: null, member: null });
 const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; member: AppMember | null }>({ open: false, member: null });

 const fetchAll = useCallback(async () => {
  setLoading(true);
  try {
   const [sRes, aRes, cRes, mRes] = await Promise.all([
    fetch(API + '/api/apps/${p.appId}/stats').then(r => r.json()).catch(() => null),
    fetch(API + '/api/analytics/app/${p.appId}').then(r => r.json()).catch(() => null),
    fetch(API + '/api/contact?app_id=${p.appId}').then(r => r.json()).catch(() => []),
    fetch(API + '/api/apps/${p.appId}/members').then(r => r.json()).catch(() => ({ data: [] })),
   ]);
   if (sRes) setStats(sRes);
   if (aRes) setAnalytics(aRes);
   setContacts(Array.isArray(cRes) ? cRes : Array.isArray(cRes?.data) ? cRes.data : []);
   setMembers(Array.isArray(mRes?.data) ? mRes.data : Array.isArray(mRes) ? mRes : []);
  } catch (e) {
   setSnackbar({ open: true, message: 'Failed to load some data', severity: 'error' });
  } finally { setLoading(false); }
 }, []);

 useEffect(() => { fetchAll(); }, [fetchAll]);

 /* ── Contact actions ── */
 const updateStatus = async (id: number, status: string) => {
  try {
   await fetch(API + '/api/contact/' + id + '/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
   setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
   setSnackbar({ open: true, message: 'Marked as ' + status, severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }); }
  setMenuAnchor({ el: null, id: null });
 };

 const deleteContact = async (id: number) => {
  try {
   await fetch(API + '/api/contact/' + id, { method: 'DELETE' });
   setContacts(prev => prev.filter(c => c.id !== id));
   setSnackbar({ open: true, message: 'Submission deleted', severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }); }
  setMenuAnchor({ el: null, id: null });
 };

 /* ── Member actions ── */
 const toggleMemberStatus = async (member: AppMember) => {
  const newStatus = member.status === 'disabled' ? 'active' : 'disabled';
  try {
   await fetch(API + '/api/apps/${p.appId}/members/' + member.id, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
   });
   setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
   setSnackbar({ open: true, message: newStatus === 'disabled' ? 'User disabled' : 'User re-enabled', severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' }); }
  setMemberMenu({ el: null, member: null });
 };

 const confirmDeleteMember = async () => {
  if (!deleteDialog.member) return;
  try {
   await fetch(API + '/api/apps/${p.appId}/members/' + deleteDialog.member.id, { method: 'DELETE' });
   setMembers(prev => prev.filter(m => m.id !== deleteDialog.member!.id));
   setSnackbar({ open: true, message: 'User removed', severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' }); }
  setDeleteDialog({ open: false, member: null });
  setMemberMenu({ el: null, member: null });
 };

 const chipColor = (s: string) => s === 'new' ? 'error' : s === 'read' ? 'info' : s === 'replied' ? 'success' : 'default';

 const memberStatusChip = (status: string) => {
  if (status === 'active' || status === 'free') return { label: status === 'free' ? 'Free' : 'Active', color: COLORS.success, bg: COLORS.success + '15' };
  if (status === 'disabled') return { label: 'Disabled', color: COLORS.error, bg: COLORS.error + '15' };
  if (status === 'cancelled') return { label: 'Cancelled', color: COLORS.warning, bg: COLORS.warning + '15' };
  if (status === 'past_due') return { label: 'Past Due', color: COLORS.warning, bg: COLORS.warning + '15' };
  return { label: status, color: COLORS.purple, bg: COLORS.purple + '15' };
 };

 if (loading) {
  return (
   <Box>
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4, mb: 4 }} />
    <Grid container spacing={2.5}>
     {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={130} sx={{ borderRadius: 4 }} /></Grid>)}
    </Grid>
    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4, mt: 4 }} />
   </Box>
  );
 }

 const newC = contacts.filter(c => c.status === 'new').length;
 const activeMembers = members.filter(m => m.status !== 'disabled' && m.status !== 'cancelled').length;

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(220, -70, -50)} />
    <Box sx={floatingCircle(140, 30, 140, 0.05)} />
    <Box sx={floatingCircle(90, -30, 350, 0.06)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1 }}>
       <Dashboard /> ${p.appName} Admin
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>${aHeroSub}</Typography>
     </Box>
     <Button variant="contained" startIcon={<Refresh />} onClick={fetchAll}
      sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
      Refresh
     </Button>
    </Box>
   </Paper>

   <Grid container spacing={2.5} sx={{ mb: 4 }}>
    {[
     { label: 'Members', value: members.length, icon: <People />, color: COLORS.primary, sub: activeMembers + ' active' },
     { label: 'Page Views', value: analytics?.total_page_views ?? 0, icon: <Visibility />, color: COLORS.blue, sub: (analytics?.unique_visitors ?? 0) + ' unique' },
     { label: 'Revenue', value: '$' + (stats?.total_revenue ?? 0).toLocaleString(), icon: <AttachMoney />, color: COLORS.success },
     { label: 'Messages', value: contacts.length, icon: <Email />, color: newC > 0 ? COLORS.warning : COLORS.purple, sub: newC > 0 ? newC + ' new' : 'All read' },
    ].map((s, i) => (
     <Grid item xs={12} sm={6} md={3} key={i}>
      <Card sx={cardSx}>
       <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
         <Avatar sx={{ width: 44, height: 44, bgcolor: s.color + '15', color: s.color }}>{s.icon}</Avatar>
         {s.sub && <Chip label={s.sub} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: s.color + '10', color: s.color }} />}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.25 }}>{s.value}</Typography>
        <Typography sx={statLabelSx}>{s.label}</Typography>
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>

   <Paper sx={{ ...sectionSx, p: 0 }}>
    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid ' + COLORS.border }}>
     <Tab icon={<People />} label={'Users (' + members.length + ')'} iconPosition="start" sx={{ fontWeight: 600, textTransform: 'none' }} />
     <Tab icon={<Analytics />} label="Analytics" iconPosition="start" sx={{ fontWeight: 600, textTransform: 'none' }} />
     <Tab icon={<Email />} label={'Messages (' + contacts.length + ')'} iconPosition="start" sx={{ fontWeight: 600, textTransform: 'none' }} />
    </Tabs>

    <Box sx={{ p: 3 }}>
     {/* ── Users tab ── */}
     {tab === 0 && (
      <Box>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Registered Members</Typography>
        <Chip icon={<GroupAdd />} label={activeMembers + ' active / ' + members.length + ' total'} size="small"
         sx={{ fontWeight: 600, bgcolor: COLORS.primary + '10', color: COLORS.primary }} />
       </Box>
       {members.length > 0 ? (
        <Table size="small">
         <TableHead>
          <TableRow>
           {['Name', 'Email', 'Plan', 'Status', 'Signed Up', ''].map((h, i) => (
            <TableCell key={i} align={i === 5 ? 'center' : 'left'}
             sx={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</TableCell>
           ))}
          </TableRow>
         </TableHead>
         <TableBody>
          {members.map((m, idx) => {
           const sc = memberStatusChip(m.status);
           return (
            <TableRow key={m.id} sx={{ transition: 'all 0.15s', '&:hover': { bgcolor: COLORS.tint }, bgcolor: m.status === 'disabled' ? COLORS.error + '04' : undefined }}>
             <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
               <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.primary + '15', color: COLORS.primary, fontSize: 14, fontWeight: 700 }}>
                {m.name?.charAt(0)?.toUpperCase() || '?'}
               </Avatar>
               <Typography variant="body2" fontWeight={600} sx={{ textDecoration: m.status === 'disabled' ? 'line-through' : 'none', opacity: m.status === 'disabled' ? 0.6 : 1 }}>
                {m.name}
               </Typography>
              </Box>
             </TableCell>
             <TableCell><Typography variant="body2" color="text.secondary">{m.email}</Typography></TableCell>
             <TableCell>
              <Chip size="small" label={m.plan_name + (m.plan_price > 0 ? ' ($' + m.plan_price + ')' : '')}
               sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: m.plan_price > 0 ? COLORS.blue + '12' : COLORS.border, color: m.plan_price > 0 ? COLORS.blue : 'text.secondary' }} />
             </TableCell>
             <TableCell>
              <Chip size="small" label={sc.label} sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.color }} />
             </TableCell>
             <TableCell><Typography variant="body2" color="text.secondary">{new Date(m.created_at).toLocaleDateString()}</Typography></TableCell>
             <TableCell align="center">
              <IconButton size="small" onClick={e => setMemberMenu({ el: e.currentTarget, member: m })} sx={{ '&:hover': { bgcolor: COLORS.tint } }}>
               <MoreVert />
              </IconButton>
             </TableCell>
            </TableRow>
           );
          })}
         </TableBody>
        </Table>
       ) : (
        <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed ' + COLORS.border, borderRadius: 3 }}>
         <PersonAdd sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
         <Typography fontWeight={600} color="text.secondary">No registered members yet</Typography>
         <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Users who sign up via the register page will appear here</Typography>
        </Box>
       )}

       {/* Member action menu */}
       <Menu anchorEl={memberMenu.el} open={Boolean(memberMenu.el)} onClose={() => setMemberMenu({ el: null, member: null })}>
        {memberMenu.member?.status === 'disabled' ? (
         <MenuItem onClick={() => memberMenu.member && toggleMemberStatus(memberMenu.member)}>
          <CheckCircle sx={{ mr: 1.5, fontSize: 18, color: COLORS.success }} /> Re-enable User
         </MenuItem>
        ) : (
         <MenuItem onClick={() => memberMenu.member && toggleMemberStatus(memberMenu.member)}>
          <Block sx={{ mr: 1.5, fontSize: 18, color: COLORS.warning }} /> Disable User
         </MenuItem>
        )}
        <MenuItem onClick={() => { setDeleteDialog({ open: true, member: memberMenu.member }); }} sx={{ color: COLORS.error }}>
         <Delete sx={{ mr: 1.5, fontSize: 18 }} /> Delete User
        </MenuItem>
       </Menu>
      </Box>
     )}

     {/* ── Analytics tab ── */}
     {tab === 1 && (
      <Box>
       <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 2 }}>Page Performance</Typography>
       {analytics?.page_stats && Object.keys(analytics.page_stats).length > 0 ? (
        <Table size="small">
         <TableHead>
          <TableRow>
           <TableCell sx={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Page</TableCell>
           <TableCell align="right" sx={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Views</TableCell>
           <TableCell align="right" sx={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Share</TableCell>
          </TableRow>
         </TableHead>
         <TableBody>
          {Object.entries(analytics.page_stats).map(([page, views]) => {
           const total = analytics.total_page_views || 1;
           const pct = Math.round(((views as number) / total) * 100);
           return (
            <TableRow key={page} sx={{ transition: 'all 0.15s', '&:hover': { bgcolor: COLORS.tint } }}>
             <TableCell><Typography variant="body2" fontWeight={600}>{page}</Typography></TableCell>
             <TableCell align="right"><Typography variant="body2" fontWeight={700}>{(views as number).toLocaleString()}</Typography></TableCell>
             <TableCell align="right">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
               <LinearProgress variant="determinate" value={pct} sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: COLORS.border,
                '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, ${p.primaryColor}, ${sec})' } }} />
               <Typography variant="body2" fontWeight={600} sx={{ minWidth: 32 }}>{pct}%</Typography>
              </Box>
             </TableCell>
            </TableRow>
           );
          })}
         </TableBody>
        </Table>
       ) : (
        <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed ' + COLORS.border, borderRadius: 3 }}>
         <TrendingUp sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
         <Typography fontWeight={600} color="text.secondary">No analytics data yet</Typography>
         <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Data will appear as users visit your pages</Typography>
        </Box>
       )}
      </Box>
     )}

     {/* ── Messages tab ── */}
     {tab === 2 && (
      <Box>
       {contacts.length > 0 ? (
        <Table size="small">
         <TableHead>
          <TableRow>
           {['Name','Email','Subject','Status','Date',''].map((h, i) => (
            <TableCell key={i} align={i === 5 ? 'center' : 'left'}
             sx={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</TableCell>
           ))}
          </TableRow>
         </TableHead>
         <TableBody>
          {contacts.map(c => (
           <TableRow key={c.id} sx={{ transition: 'all 0.15s', '&:hover': { bgcolor: COLORS.tint }, bgcolor: c.status === 'new' ? COLORS.warning + '06' : undefined }}>
            <TableCell>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {c.status === 'new' && <FiberNew sx={{ color: COLORS.warning, fontSize: 18 }} />}
              <Typography variant="body2" fontWeight={c.status === 'new' ? 700 : 500}>{c.name}</Typography>
             </Box>
            </TableCell>
            <TableCell><Typography variant="body2" color="text.secondary">{c.email}</Typography></TableCell>
            <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</Typography></TableCell>
            <TableCell><Chip size="small" label={c.status} color={chipColor(c.status) as any} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
            <TableCell><Typography variant="body2" color="text.secondary">{new Date(c.created_at).toLocaleDateString()}</Typography></TableCell>
            <TableCell align="center">
             <IconButton size="small" onClick={e => setMenuAnchor({ el: e.currentTarget, id: c.id })} sx={{ '&:hover': { bgcolor: COLORS.tint } }}><MoreVert /></IconButton>
            </TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       ) : (
        <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed ' + COLORS.border, borderRadius: 3 }}>
         <Inbox sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
         <Typography fontWeight={600} color="text.secondary">No contact submissions yet</Typography>
         <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Messages from your contact form will appear here</Typography>
        </Box>
       )}

       <Menu anchorEl={menuAnchor.el} open={Boolean(menuAnchor.el)} onClose={() => setMenuAnchor({ el: null, id: null })}>
        <MenuItem onClick={() => menuAnchor.id && updateStatus(menuAnchor.id, 'read')}><MarkEmailRead sx={{ mr: 1.5, fontSize: 18, color: COLORS.blue }} /> Mark as Read</MenuItem>
        <MenuItem onClick={() => menuAnchor.id && updateStatus(menuAnchor.id, 'replied')}><Email sx={{ mr: 1.5, fontSize: 18, color: COLORS.success }} /> Mark as Replied</MenuItem>
        <MenuItem onClick={() => menuAnchor.id && updateStatus(menuAnchor.id, 'archived')}><Inbox sx={{ mr: 1.5, fontSize: 18, color: COLORS.purple }} /> Archive</MenuItem>
        <MenuItem onClick={() => menuAnchor.id && deleteContact(menuAnchor.id)} sx={{ color: COLORS.error }}><Delete sx={{ mr: 1.5, fontSize: 18 }} /> Delete</MenuItem>
       </Menu>
      </Box>
     )}
    </Box>
   </Paper>

   {/* Delete member confirmation dialog */}
   <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, member: null })}>
    <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
    <DialogContent>
     <DialogContentText>
      Are you sure you want to permanently delete <strong>{deleteDialog.member?.name}</strong> ({deleteDialog.member?.email})?
      This will revoke their access and remove their subscription. This action cannot be undone.
     </DialogContentText>
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setDeleteDialog({ open: false, member: null })}>Cancel</Button>
     <Button onClick={confirmDeleteMember} color="error" variant="contained" sx={{ fontWeight: 600 }}>Delete</Button>
    </DialogActions>
   </Dialog>

   <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
    <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
   </Snackbar>
  </Box>
 );
}`;
}

// ============================================================================
// CONTACT FORM PAGE
// ============================================================================

export function contactFormTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const cHeroSub = c.heroSubtitle || "Have a question or feedback? We'd love to hear from you.";
 const cCards = c.infoCards || [
  { title: 'Live Chat', desc: 'Available 9am-5pm' },
  { title: 'Response Time', desc: 'Within 24 hours' },
  { title: 'Support', desc: 'Dedicated team' },
 ];
 return `import { useState } from 'react';
import {
 Box, Typography, Paper, TextField, Button, Snackbar, Alert,
 CircularProgress, Grid, Avatar, Card, CardContent,
} from '@mui/material';
import Email from '@mui/icons-material/Email';
import Send from '@mui/icons-material/Send';
import CheckCircle from '@mui/icons-material/CheckCircle';
import AccessTime from '@mui/icons-material/AccessTime';
import Chat from '@mui/icons-material/Chat';
import SupportAgent from '@mui/icons-material/SupportAgent';

const API = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

${SB}

export function MembersContactPage() {
 const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
 const [sending, setSending] = useState(false);
 const [sent, setSent] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.name || !form.email || !form.message) {
   setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
   return;
  }
  setSending(true);
  try {
   const res = await fetch(API + '/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, app_id: ${p.appId} }),
   });
   if (!res.ok) throw new Error('Failed');
   setSent(true);
   setForm({ name: '', email: '', subject: '', message: '' });
   setSnackbar({ open: true, message: 'Message sent successfully!', severity: 'success' });
  } catch {
   setSnackbar({ open: true, message: 'Failed to send message. Please try again.', severity: 'error' });
  } finally { setSending(false); }
 };

 const infoCards = [
  { icon: <Chat />, title: '${esc(cCards[0].title)}', desc: '${esc(cCards[0].desc)}', color: COLORS.primary },
  { icon: <AccessTime />, title: '${esc(cCards[1].title)}', desc: '${esc(cCards[1].desc)}', color: COLORS.blue },
  { icon: <SupportAgent />, title: '${esc(cCards[2].title)}', desc: '${esc(cCards[2].desc)}', color: COLORS.success },
 ];

 return (
  <Box sx={{ maxWidth: 800, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(200, -60, -40)} />
    <Box sx={floatingCircle(120, 20, 120, 0.05)} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
     <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Email /> Contact Us
     </Typography>
     <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>${cHeroSub}</Typography>
    </Box>
   </Paper>

   <Grid container spacing={2} sx={{ mb: 4 }}>
    {infoCards.map((c, i) => (
     <Grid item xs={12} sm={4} key={i}>
      <Card sx={cardSx}>
       <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: c.color + '15', color: c.color, mx: 'auto', mb: 1.5 }}>{c.icon}</Avatar>
        <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
        <Typography variant="caption" color="text.secondary">{c.desc}</Typography>
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>

   {sent ? (
    <Paper sx={{ ...sectionSx, textAlign: 'center', py: 6 }}>
     <Avatar sx={{ width: 72, height: 72, bgcolor: COLORS.success + '15', color: COLORS.success, mx: 'auto', mb: 2 }}>
      <CheckCircle sx={{ fontSize: 40 }} />
     </Avatar>
     <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Message Sent!</Typography>
     <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>Thank you for reaching out. We'll get back to you as soon as possible.</Typography>
     <Button variant="contained" onClick={() => setSent(false)} sx={gradientBtnSx}>Send Another Message</Button>
    </Paper>
   ) : (
    <Paper sx={sectionSx}>
     <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.5 }}>Send a Message</Typography>
     <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Fill in the form below and we'll respond within 24 hours</Typography>
     <form onSubmit={handleSubmit}>
      <Grid container spacing={2.5}>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth required label="Your Name" value={form.name}
         onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
       </Grid>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth required label="Email Address" type="email" value={form.email}
         onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <TextField fullWidth label="Subject" value={form.subject}
         onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <TextField fullWidth required label="Message" multiline rows={5} value={form.message}
         onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <Button type="submit" variant="contained" size="large" disabled={sending}
         startIcon={sending ? <CircularProgress size={20} /> : <Send />}
         sx={{ ...gradientBtnSx, px: 4, py: 1.2 }}>
         {sending ? 'Sending...' : 'Send Message'}
        </Button>
       </Grid>
      </Grid>
     </form>
    </Paper>
   )}

   <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
    <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
   </Snackbar>
  </Box>
 );
}`;
}

// ============================================================================
// AI SKILLS PAGE  (Chat-first layout — input at top, tabbed skills below)
// ============================================================================

export function skillsTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const heroSub = c.heroSubtitle || `AI-powered skills tailored for ${esc(p.appName)}.`;
 return `import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
 Box, Typography, Paper, Button, TextField, Chip, IconButton, Alert, Grid,
 CircularProgress, Tabs, Tab, Divider, Tooltip, Card, CardContent, CardActionArea,
 InputAdornment, LinearProgress,
} from '@mui/material';
import SmartToy from '@mui/icons-material/SmartToy';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Build from '@mui/icons-material/Build';
import Search from '@mui/icons-material/Search';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutline from '@mui/icons-material/Error';
import Input from '@mui/icons-material/Input';
import Memory from '@mui/icons-material/Memory';
import Output from '@mui/icons-material/Output';
import Category from '@mui/icons-material/Category';
import Delete from '@mui/icons-material/Delete';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Send from '@mui/icons-material/Send';
import Close from '@mui/icons-material/Close';
import Download from '@mui/icons-material/Download';
import AttachFile from '@mui/icons-material/AttachFile';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${p.appId};
${SB}

/* ── Types ────────────────────────────────────────────── */
interface ToolDef { id: string; name: string; description: string; parameters: any[]; }
interface SkillParam { name: string; type: string; description: string; required: boolean; }
type SkillCategory = 'inputs' | 'processing' | 'outputs' | 'other';
interface SkillDef { id: string; name: string; description: string; prompt: string; tools: string[]; inputs: SkillParam[]; credentials: string[]; enabled: boolean; category: SkillCategory; tags: string[]; }
interface RunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }
interface ProgressStep { type: string; message: string; elapsed?: number; }

/* ── Category config ──────────────────────────────────── */
const CAT_META: Record<SkillCategory, { label: string; icon: any; color: string }> = {
 inputs:     { label: 'Inputs',     icon: <Input fontSize="small" />,   color: '#4caf50' },
 processing: { label: 'Processing', icon: <Memory fontSize="small" />,  color: '#ff9800' },
 outputs:    { label: 'Outputs',    icon: <Output fontSize="small" />,  color: '#2196f3' },
 other:      { label: 'Other',      icon: <Category fontSize="small" />,color: '#9e9e9e' },
};
const CAT_ORDER: SkillCategory[] = ['inputs', 'processing', 'outputs', 'other'];

/* ── SSE parser helper ────────────────────────────────── */
function parseSSE(
 buffer: string,
 isFinal: boolean,
 onProgress: (s: ProgressStep) => void,
 onDone: (r: RunResult) => void,
 onError: (msg: string) => void,
): string {
 const lines = buffer.split('\\n');
 const rest = isFinal ? '' : (lines.pop() || '');
 let evType = '', evData = '';
 for (const line of lines) {
  if (line.startsWith('event: ')) evType = line.slice(7).trim();
  else if (line.startsWith('data: ')) evData = line.slice(6);
  else if (line.trim() === '' && evType && evData) {
   try {
    const p = JSON.parse(evData);
    if (evType === 'progress') onProgress(p);
    else if (evType === 'done' && p.result) onDone(p.result);
    else if (evType === 'error') onError(p.message || 'Run failed');
   } catch {}
   evType = ''; evData = '';
  }
 }
 if (isFinal && evType && evData) {
  try {
   const p = JSON.parse(evData);
   if (evType === 'done' && p.result) onDone(p.result);
   else if (evType === 'error') onError(p.message || 'Run failed');
  } catch {}
 }
 return rest;
}

/* ── Render markdown output with clickable links / images ── */
function RichOutput({ text }: { text: string }) {
 if (!text) return null;

 /* Helper: convert inline markdown (**bold**, *italic*, \`code\`) to React nodes */
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Regex handles **bold**, *italic*, \`code\`, and [link](url) inline
  const re = /(\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|\`([^\`]+)\`|\\[([^\\]]+)\\]\\(([^)]+)\\))/g;
  let last = 0, m, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);          // **bold**
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);             // *italic*
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>); // \`code\`
   else if (m[5]) { // [text](url)
    const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6];
    out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '${esc(p.primaryColor)}' }}>{m[5]}</a>);
   }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }

 const lines = text.split('\\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const trimmed = line.trim();
    // Image line: ![alt](url)
    const imgM = trimmed.match(/^!\\[([^\\]]*)\\]\\(([^)]+)\\)$/);
    if (imgM) {
     const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2];
     return <Box key={i} sx={{ my: 1, textAlign: 'center' }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>;
    }
    // Standalone download link: [text](url) — entire line is one link
    const linkM = trimmed.match(/^\\[([^\\]]+)\\]\\(([^)]+)\\)$/);
    if (linkM) {
     const href = linkM[2].startsWith('/') ? API_BASE + linkM[2] : linkM[2];
     return (
      <Box key={i} sx={{ my: 0.5 }}>
       <Button variant="outlined" size="small" startIcon={<Download />} href={href} target="_blank" rel="noopener" sx={{ textTransform: 'none' }}>
        {linkM[1]}
       </Button>
      </Box>
     );
    }
    // Headings
    if (trimmed.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.3, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^####\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^###\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ mt: 1.5, mb: 0.5, fontSize: 15, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^##\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^#\\s*/, ''))}</Typography>;
    // HR
    if (/^[-*_]{3,}$/.test(trimmed)) return <Divider key={i} sx={{ my: 1 }} />;
    // Unordered list items (- or *)
    const ulM = trimmed.match(/^[-*]\\s+(.+)/);
    if (ulM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>•</span><span>{inlineFormat(ulM[1])}</span></Typography>;
    // Ordered list items (1. 2. etc)
    const olM = trimmed.match(/^(\\d+)\\.\\s+(.+)/);
    if (olM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>{olM[1]}.</span><span>{inlineFormat(olM[2])}</span></Typography>;
    // Empty
    if (!trimmed) return <Box key={i} sx={{ height: 8 }} />;
    // Normal text — run inline formatting
    return <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inlineFormat(trimmed)}</Typography>;
   })}
  </Box>
 );
}

/* ════════════════════════════════════════════════════════ */

export function MembersSkillsPage() {
 /* ── State ── */
 const [skills, setSkills] = useState<SkillDef[]>([]);
 const [tools, setTools] = useState<ToolDef[]>([]);
 const [selectedId, setSelectedId] = useState('');

 // Skill read-only detail
 const [sName, setSName] = useState('');
 const [sDesc, setSDesc] = useState('');
 const [sTools, setSTools] = useState<string[]>([]);
 const [sInputs, setSInputs] = useState<SkillParam[]>([]);

 // Skills browse
 const [catTab, setCatTab] = useState(0);
 const [search, setSearch] = useState('');

 // Skill run state
 const [runInputs, setRunInputs] = useState<Record<string,string>>({});
 const [runInstructions, setRunInstructions] = useState('');
 const [running, setRunning] = useState(false);
 const [runResult, setRunResult] = useState<RunResult | null>(null);
 const [outputTab, setOutputTab] = useState(0);
 const [progress, setProgress] = useState<ProgressStep[]>([]);

 // Chat state
 const [chatInput, setChatInput] = useState('');
 const [chatRunning, setChatRunning] = useState(false);
 const [chatResult, setChatResult] = useState<RunResult | null>(null);
 const [chatProgress, setChatProgress] = useState<ProgressStep[]>([]);
 const [chatOutputTab, setChatOutputTab] = useState(0);
 const [chatCopied, setChatCopied] = useState(false);
 const chatInputRef = useRef<HTMLInputElement>(null);
 const chatFileRef = useRef<HTMLInputElement>(null);
 const [chatFiles, setChatFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);

 const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files; if (!files) return;
  const newFiles: Array<{ name: string; content: string; type: string }> = [];
  const textExts = ['txt','md','csv','json','xml','html','htm','js','ts','jsx','tsx','css','py','yaml','yml','toml','ini','cfg','log','sql','sh','bat','env','gitignore'];
  for (let i = 0; i < files.length; i++) {
   const f = files[i];
   const ext = f.name.split('.').pop()?.toLowerCase() || '';
   const isText = f.type.startsWith('text/') || textExts.includes(ext) || f.type === 'application/json' || f.type === 'application/xml';
   try {
    if (isText) {
     const text = await f.text();
     newFiles.push({ name: f.name, content: text.slice(0, 50000), type: 'text' });
    } else {
     const buf = await f.arrayBuffer();
     const b64 = btoa(String.fromCharCode(...new Uint8Array(buf).slice(0, 30000)));
     newFiles.push({ name: f.name, content: b64, type: 'base64' });
    }
   } catch {}
  }
  setChatFiles(prev => [...prev, ...newFiles]);
  if (chatFileRef.current) chatFileRef.current.value = '';
 };

 // UI
 const [error, setError] = useState('');

 /* ── Load ── */
 const loadData = useCallback(async () => {
  try {
   const [sR, tR] = await Promise.all([
    fetch(API_BASE + '/api/skills?app_id=' + APP_ID).then(r => r.json()),
    fetch(API_BASE + '/api/skills/tools?app_id=' + APP_ID).then(r => r.json()),
   ]);
   setSkills(sR.skills || []);
   setTools(tR.tools || []);
  } catch (e: any) { setError('Failed to load: ' + e.message); }
 }, []);
 useEffect(() => { loadData(); }, [loadData]);
 useEffect(() => { chatInputRef.current?.focus(); }, []);

 /* ── Filters ── */
 const grouped = useMemo(() => {
  const g: Record<SkillCategory, SkillDef[]> = { inputs:[], processing:[], outputs:[], other:[] };
  const q = search.toLowerCase().trim();
  for (const s of skills) {
   if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) continue;
   const c = (s.category && s.category in g) ? s.category : 'other';
   g[c].push(s);
  }
  return g;
 }, [skills, search]);

 const activeCat = CAT_ORDER[catTab] || 'inputs';
 const activeSkills = grouped[activeCat];

 const filteredTools = useMemo(() => {
  const q = search.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
 }, [tools, search]);

 /* ── Select skill ── */
 const selectSkill = (s: SkillDef) => {
  setSelectedId(s.id);
  setSName(s.name); setSDesc(s.description); setSTools([...s.tools]); setSInputs([...s.inputs]);
  setRunResult(null); setRunInputs({}); setRunInstructions(''); setProgress([]); setError('');
 };

 /* ── Run skill (SSE) ── */
 const runSkill = async () => {
  if (!selectedId) return;
  setRunning(true); setRunResult(null); setProgress([]); setOutputTab(0); setError('');
  try {
   const resp = await fetch(API_BASE + '/api/skills/' + selectedId + '/run-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: runInputs, instructions: runInstructions || undefined, app_id: APP_ID }),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Stream failed'); setRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, s => setProgress(p => [...p, s]), r => setRunResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setProgress(p => [...p, s]), r => setRunResult(r), setError);
   }
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 /* ── Chat (SSE) ── */
 const runChat = async () => {
  const msg = chatInput.trim();
  if (!msg || chatRunning) return;
  setChatRunning(true); setChatResult(null); setChatProgress([]); setChatOutputTab(0); setChatCopied(false);
  try {
   const payload: any = { message: msg, app_id: APP_ID };
   if (chatFiles.length > 0) payload.attachments = chatFiles;
   const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Chat failed'); setChatRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, s => setChatProgress(p => [...p, s]), r => setChatResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setChatProgress(p => [...p, s]), r => setChatResult(r), setError);
   }
   setChatInput(''); setChatFiles([]);
  } catch (e: any) { setError(e.message); }
  finally { setChatRunning(false); }
 };

 /* ── Activity renderer ── */
 const ActivitySteps = ({ steps, isRunning }: { steps: ProgressStep[]; isRunning: boolean }) => {
  if (steps.length === 0 && !isRunning) return null;
  return (
   <Box sx={{ px: 2, py: 1, bgcolor: '#1a1a2e', borderRadius: 1, mb: 1, maxHeight: 160, overflow: 'auto',
    '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 } }}>
    {isRunning && steps.length === 0 && <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>Connecting...</Typography>}
    {steps.map((step, i) => {
     const icon = step.type === 'phase' ? '📋' : step.type === 'tool-start' ? '🔧' : step.type === 'tool-done' ? '✅' : step.type === 'error' ? '❌' : step.type === 'done' ? '🏁' : '▸';
     return (
      <Box key={i} sx={{ display: 'flex', gap: 0.75, py: 0.1, alignItems: 'flex-start' }}>
       <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>{icon}</Typography>
       <Typography sx={{ fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, flex: 1,
        color: step.type === 'phase' ? '#dcdcaa' : step.type === 'tool-start' ? '#569cd6' : step.type === 'tool-done' ? '#b5cea8' : step.type === 'error' ? '#f48771' : '#d4d4d4',
        fontWeight: step.type === 'phase' ? 700 : 400 }}>{step.message}</Typography>
       {step.elapsed != null && <Typography sx={{ fontSize: 9, color: '#555', flexShrink: 0 }}>{(step.elapsed / 1000).toFixed(1)}s</Typography>}
      </Box>
     );
    })}
   </Box>
  );
 };

 /* ── Output renderer (no tabs) ── */
 const OutputTabs = ({ result, isRunning }: { result: RunResult | null; isRunning: boolean; tab?: number; setTab?: (v: number) => void; copied?: boolean; onCopy?: () => void }) => (
  <Box>
   {!result && !isRunning && <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 3 }}>Waiting for result...</Typography>}
   {isRunning && !result && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
     <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing...</Typography>
    </Box>
   )}
   {result && (
    <Box>
     {result.error && <Alert severity="error" sx={{ mb: 1 }}>{result.error}</Alert>}
     {result.status && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
       {result.status === 'success' ? <CheckCircle color="success" sx={{ fontSize: 14 }} /> : <ErrorOutline color="error" sx={{ fontSize: 14 }} />}
       <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{(result.duration / 1000).toFixed(1)}s</Typography>
      </Box>
     )}
     <RichOutput text={result.output || ''} />
    </Box>
   )}
  </Box>
 );

 /* ══════════════ RENDER ══════════════ */

 /* Which result to show in the bottom output panel */
 const activeResult = runResult || chatResult;
 const activeRunning = running || chatRunning;
 const activeProgress = running ? progress : chatProgress;
 const activeTab = running || runResult ? outputTab : chatOutputTab;
 const setActiveTab = running || runResult ? setOutputTab : setChatOutputTab;

 return (
  <>
  <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1200, mx: 'auto' }}>
   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* ═══ TOP ROW: Chat Input (left) + Activity Commentary (right) ═══ */}
   <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={12} md={6}>
     <Paper sx={{ height: '100%', overflow: 'hidden', background: 'linear-gradient(135deg, ${esc(p.primaryColor)}12, ${esc(sec)}08)', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
       <SmartToy sx={{ color: '${esc(p.primaryColor)}', fontSize: 28 }} />
       <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>${esc(p.appName)} AI Assistant</Typography>
        <Typography variant="caption" color="text.secondary">${heroSub}</Typography>
       </Box>
       {chatResult && (
        <Tooltip title="Clear"><IconButton size="small" onClick={() => { setChatResult(null); setChatProgress([]); setChatInput(''); setChatFiles([]); }}><Delete sx={{ fontSize: 18 }} /></IconButton></Tooltip>
       )}
      </Box>
      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
       <input ref={chatFileRef} type="file" hidden multiple accept=".txt,.md,.csv,.json,.xml,.html,.pdf,.doc,.docx,.xls,.xlsx,.py,.js,.ts,.yaml,.yml,.sql,.log,.ini,.cfg,.env" onChange={handleFileAttach} />
       <Tooltip title="Attach document"><IconButton size="small" onClick={() => chatFileRef.current?.click()} disabled={chatRunning}
        sx={{ bgcolor: chatFiles.length > 0 ? '${esc(p.primaryColor)}20' : 'transparent', color: chatFiles.length > 0 ? '${esc(p.primaryColor)}' : 'text.secondary' }}><AttachFile sx={{ fontSize: 20 }} /></IconButton></Tooltip>
       <TextField inputRef={chatInputRef} size="small" fullWidth placeholder={chatFiles.length > 0 ? 'Describe what to do with the attached file(s)...' : 'Ask the AI anything — research, create content, generate documents...'}
        value={chatInput} onChange={e => setChatInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runChat(); } }}
        sx={{ '& .MuiOutlinedInput-root': { fontSize: 14, bgcolor: 'background.paper' } }} />
       <Button variant="contained" size="small" startIcon={chatRunning ? <CircularProgress size={16} color="inherit" /> : <Send />}
        onClick={runChat} disabled={chatRunning || !chatInput.trim()} sx={{ ...gradientBtnSx, minWidth: 100, height: 40 }}>
        {chatRunning ? 'Thinking...' : 'Send'}
       </Button>
      </Box>
      {chatFiles.length > 0 && (
       <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {chatFiles.map((f, i) => <Chip key={i} label={f.name} size="small" onDelete={() => setChatFiles(prev => prev.filter((_, j) => j !== i))}
         icon={<AttachFile sx={{ fontSize: 14 }} />} sx={{ fontSize: 11, height: 24, bgcolor: '${esc(p.primaryColor)}10' }} />)}
       </Box>
      )}
      {chatRunning && <LinearProgress sx={{ height: 2 }} />}
     </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
     <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 120 }}>
      <Box sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
       <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Activity</Typography>
       {activeRunning && <CircularProgress size={12} />}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 2 } }}>
       {activeProgress.length === 0 && !activeRunning ? (
        <Typography color="text.disabled" variant="body2" sx={{ p: 2, textAlign: 'center' }}>Activity will appear here</Typography>
       ) : (
        <ActivitySteps steps={activeProgress} isRunning={activeRunning} />
       )}
      </Box>
     </Paper>
    </Grid>
   </Grid>

   {/* ═══ SKILLS BOX (fixed height, scrollable) ═══ */}
   <Paper variant="outlined" sx={{ mb: 2, display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'hidden' }}>
    <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
     <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Skills</Typography>
     <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
      InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
      sx={{ width: 200, '& .MuiOutlinedInput-root': { fontSize: 13, height: 32 } }} />
     {tools.length > 0 && (
      <Tooltip title={tools.map(t => t.name).join(', ')}>
       <Chip icon={<Build sx={{ fontSize: 14 }} />} label={tools.length + ' tool' + (tools.length !== 1 ? 's' : '') + ' available'} size="small" variant="outlined" />
      </Tooltip>
     )}
    </Box>
    <Tabs value={catTab} onChange={(_, v) => setCatTab(v)}
     sx={{ px: 2, minHeight: 36, flexShrink: 0, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: 13, fontWeight: 600, py: 0 } }}>
     {CAT_ORDER.map((cat, i) => {
      const meta = CAT_META[cat];
      const count = grouped[cat].length;
      return <Tab key={cat} icon={meta.icon} iconPosition="start" label={meta.label + (count ? ' (' + count + ')' : '')}
       sx={{ color: meta.color, '&.Mui-selected': { color: meta.color } }} />;
     })}
    </Tabs>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {activeSkills.length === 0 && (
      <Typography color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>{search ? 'No matching skills in this category' : 'No skills in this category yet'}</Typography>
     )}
     <Grid container spacing={1.5}>
      {activeSkills.map(s => (
       <Grid item xs={12} sm={6} md={4} key={s.id}>
        <Card variant="outlined" sx={{ height: '100%', border: selectedId === s.id ? '2px solid ${esc(p.primaryColor)}' : undefined, transition: 'border 0.15s' }}>
         <CardActionArea onClick={() => selectSkill(s)} sx={{ height: '100%' }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
           <Typography sx={{ fontWeight: 600, fontSize: 13.5, mb: 0.3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.name}</Typography>
           <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{s.description}</Typography>
           <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {s.tools.slice(0, 3).map(t => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: 10 }} />)}
            {s.tools.length > 3 && <Chip label={'+' + (s.tools.length - 3)} size="small" sx={{ height: 18, fontSize: 10 }} />}
           </Box>
          </CardContent>
         </CardActionArea>
        </Card>
       </Grid>
      ))}
     </Grid>
    </Box>
   </Paper>

   {/* ═══ SELECTED SKILL RUN BAR (inline, below skills) ═══ */}
   {selectedId && (
    <Paper variant="outlined" sx={{ mb: 2 }}>
     <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
      <Chip label="SKILL" size="small" color="primary" sx={{ fontWeight: 700 }} />
      <Typography sx={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{sName}</Typography>
      {sTools.length > 0 && sTools.slice(0, 3).map(t => <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 22, fontSize: 10 }} />)}
      <Tooltip title="Close"><IconButton size="small" onClick={() => setSelectedId('')}><Close sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     </Box>
     <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', bgcolor: '#fafafa' }}>
      {sInputs.map(inp => (
       <TextField key={inp.name} size="small" label={inp.name} value={runInputs[inp.name] || ''} sx={{ width: 180 }}
        onChange={e => setRunInputs(prev => ({ ...prev, [inp.name]: e.target.value }))} placeholder={inp.description} />
      ))}
      <TextField size="small" label="Instructions (optional)" value={runInstructions} onChange={e => setRunInstructions(e.target.value)}
       placeholder='e.g. "write 1000 words and save as PDF"' sx={{ flex: 1, minWidth: 200 }} />
      <Button variant="contained" color="success" size="small" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
       onClick={runSkill} disabled={running} sx={{ fontWeight: 700, height: 36 }}>
       {running ? 'Running...' : 'Run'}
      </Button>
     </Box>
     {running && <LinearProgress sx={{ height: 2 }} />}
    </Paper>
   )}

   {/* ═══ OUTPUT PANEL (below content, fixed height, scrollable) ═══ */}
   <Paper variant="outlined" sx={{
    height: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden',
   }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Output</Typography>
     {activeRunning && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {!activeResult && !activeRunning ? (
      <Typography color="text.disabled" sx={{ p: 3, textAlign: 'center' }}>Output will appear here when you send a chat message or run a skill.</Typography>
     ) : (
      <Box sx={{ p: 1.5 }}>
       <OutputTabs result={activeResult} isRunning={activeRunning} tab={activeTab} setTab={setActiveTab} />
      </Box>
     )}
    </Box>
   </Paper>

  </Box>
  </>
 );
}`;
}

// ============================================================================
// WORKFLOWS PAGE
// ============================================================================

export function workflowsTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const heroSub = c.heroSubtitle || `Create scheduled workflows that run your AI prompts on a timer — daily, weekly, or event-driven.`;
 return `import { useEffect, useState, useCallback, useRef } from 'react';
import {
 Box, Typography, Paper, Chip, CircularProgress, Alert, Button, IconButton,
 Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
 Tooltip, Card, CardContent, Switch, Snackbar, LinearProgress, Table,
 TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import Schedule from '@mui/icons-material/Schedule';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Refresh from '@mui/icons-material/Refresh';
import Today from '@mui/icons-material/Today';
import DateRange from '@mui/icons-material/DateRange';
import Visibility from '@mui/icons-material/Visibility';
import Send from '@mui/icons-material/Send';
import CloudUpload from '@mui/icons-material/CloudUpload';
import TableChart from '@mui/icons-material/TableChart';
import Close from '@mui/icons-material/Close';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorOutline from '@mui/icons-material/Error';
import Download from '@mui/icons-material/Download';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${p.appId};
${SB}

/* ── Types ── */
type WfSchedule = 'daily' | 'weekly' | 'monitor';
interface ScheduledWorkflow {
 id: string; name: string; description: string; prompt: string;
 schedule: WfSchedule; enabled: boolean;
 runTime?: string; dayOfWeek?: number;
 dataSource?: { fileName: string; columns: string[]; rowCount: number };
 lastRun?: string; lastStatus?: 'success' | 'error'; createdAt: string;
 processedRows?: number; totalRows?: number;
}
interface RunResult { id: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: any[]; duration: number; error?: string; }
interface ProgressStep { type: string; message: string; elapsed?: number; }

/* ── SSE parser ── */
function parseSSE(
 buffer: string, isFinal: boolean,
 onProgress: (s: ProgressStep) => void, onDone: (r: RunResult) => void, onError: (msg: string) => void,
): string {
 const lines = buffer.split('\\n');
 const rest = isFinal ? '' : (lines.pop() || '');
 let evType = '', evData = '';
 for (const line of lines) {
  if (line.startsWith('event: ')) evType = line.slice(7).trim();
  else if (line.startsWith('data: ')) evData = line.slice(6);
  else if (line.trim() === '' && evType && evData) {
   try {
    const p = JSON.parse(evData);
    if (evType === 'progress') onProgress(p);
    else if (evType === 'done' && p.result) onDone(p.result);
    else if (evType === 'error') onError(p.message || 'Run failed');
   } catch {}
   evType = ''; evData = '';
  }
 }
 if (isFinal && evType && evData) {
  try {
   const p = JSON.parse(evData);
   if (evType === 'done' && p.result) onDone(p.result);
   else if (evType === 'error') onError(p.message || 'Run failed');
  } catch {}
 }
 return rest;
}

/* ── RichOutput (markdown renderer) ── */
function RichOutput({ text }: { text: string }) {
 if (!text) return null;
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|\`([^\`]+)\`|\\[([^\\]]+)\\]\\(([^)]+)\\))/g;
  let last = 0, m: any, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>);
   else if (m[5]) { const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6]; out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '${esc(p.primaryColor)}' }}>{m[5]}</a>); }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }
 const lines = text.split('\\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const t = line.trim();
    const imgM = t.match(/^!\\[([^\\]]*)\\]\\(([^)]+)\\)$/);
    if (imgM) { const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2]; return <Box key={i} sx={{ my: 1 }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>; }
    if (t.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }} dangerouslySetInnerHTML={{ __html: inlineFormat(t.slice(5)).map(n => typeof n === 'string' ? n : '').join('') || t.slice(5) }} />;
    if (t.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>{t.slice(4)}</Typography>;
    if (t.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>{t.slice(3)}</Typography>;
    if (t.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>{t.slice(2)}</Typography>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <Typography key={i} sx={{ pl: 2, fontSize: '0.92rem', lineHeight: 1.7 }}>{String.fromCharCode(8226)} {inlineFormat(t.slice(2))}</Typography>;
    if (/^\\d+\\.\\s/.test(t)) { const c = t.replace(/^\\d+\\.\\s*/, ''); return <Typography key={i} sx={{ pl: 2, fontSize: '0.92rem', lineHeight: 1.7 }}>{t.match(/^\\d+/)?.[0]}. {inlineFormat(c)}</Typography>; }
    if (t === '---' || t === '***') return <Box key={i} sx={{ borderBottom: '1px solid #e0e0e0', my: 1.5 }} />;
    if (t === '') return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} sx={{ fontSize: '0.92rem', lineHeight: 1.8 }}>{inlineFormat(t)}</Typography>;
   })}
  </Box>
 );
}

/* ── Activity steps renderer ── */
function ActivitySteps({ steps, isRunning }: { steps: ProgressStep[]; isRunning: boolean }) {
 if (steps.length === 0 && !isRunning) return null;
 return (
  <Box sx={{ px: 2, py: 1, bgcolor: '#1a1a2e', borderRadius: 1, maxHeight: 160, overflow: 'auto',
   '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 } }}>
   {isRunning && steps.length === 0 && <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>Connecting...</Typography>}
   {steps.map((step, i) => {
    const icon = step.type === 'phase' ? '📋' : step.type === 'tool-start' ? '🔧' : step.type === 'tool-done' ? '✅' : step.type === 'error' ? '❌' : step.type === 'done' ? '🏁' : '▸';
    return (
     <Box key={i} sx={{ display: 'flex', gap: 0.75, py: 0.1 }}>
      <Typography sx={{ fontSize: 11 }}>{icon}</Typography>
      <Typography sx={{ fontSize: 11, fontFamily: 'monospace', flex: 1,
       color: step.type === 'phase' ? '#dcdcaa' : step.type === 'tool-start' ? '#569cd6' : step.type === 'tool-done' ? '#b5cea8' : step.type === 'error' ? '#f48771' : '#d4d4d4',
       fontWeight: step.type === 'phase' ? 700 : 400 }}>{step.message}</Typography>
      {step.elapsed != null && <Typography sx={{ fontSize: 9, color: '#555' }}>{(step.elapsed / 1000).toFixed(1)}s</Typography>}
     </Box>
    );
   })}
  </Box>
 );
}

/* ── Column colours ── */
const COL_COLORS: Record<WfSchedule, { bg: string; border: string; label: string; desc: string; icon: any }> = {
 daily:   { bg: '#e3f2fd', border: '#1976d2', label: 'Daily',   desc: 'Runs once a day', icon: <Today sx={{ fontSize: 20 }} /> },
 weekly:  { bg: '#f3e5f5', border: '#7b1fa2', label: 'Weekly',  desc: 'Runs once a week', icon: <DateRange sx={{ fontSize: 20 }} /> },
 monitor: { bg: '#e8f5e9', border: '#388e3c', label: 'Monitor', desc: 'Triggered by events', icon: <Visibility sx={{ fontSize: 20 }} /> },
};

/* ── Excel parser (CSV / basic xlsx via text) ── */
function parseCSV(text: string): { columns: string[]; rows: string[][] } {
 const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
 if (lines.length === 0) return { columns: [], rows: [] };
 const sep = lines[0].includes('\\t') ? '\\t' : ',';
 const columns = lines[0].split(sep).map(c => c.replace(/^"|"$/g, '').trim());
 const rows = lines.slice(1).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim()));
 return { columns, rows };
}

export function MembersWorkflowsPage() {
 /* ── State ── */
 const [workflows, setWorkflows] = useState<ScheduledWorkflow[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [snack, setSnack] = useState('');

 /* Dialog state */
 const [addOpen, setAddOpen] = useState(false);
 const [editWf, setEditWf] = useState<ScheduledWorkflow | null>(null);
 const [form, setForm] = useState({ name: '', description: '', prompt: '', schedule: 'daily' as WfSchedule, runTime: '09:00', dayOfWeek: 1 });
 const [csvData, setCsvData] = useState<{ columns: string[]; rows: string[][] } | null>(null);
 const [csvFileName, setCsvFileName] = useState('');
 const fileRef = useRef<HTMLInputElement>(null);

 /* Run state */
 const [runningId, setRunningId] = useState<string | null>(null);
 const [runProgress, setRunProgress] = useState<ProgressStep[]>([]);
 const [runResult, setRunResult] = useState<RunResult | null>(null);
 const [runRowIdx, setRunRowIdx] = useState(0);
 const [runTotalRows, setRunTotalRows] = useState(0);

 /* ── Load ── */
 const load = useCallback(async () => {
  setLoading(true);
  try {
   const res = await fetch(API_BASE + '/api/scheduled-workflows?app_id=' + APP_ID).then(r => r.json());
   setWorkflows(res.workflows || []);
  } catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, []);
 useEffect(() => { load(); }, [load]);

 /* ── File upload ── */
 const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  setCsvFileName(file.name);
  const reader = new FileReader();
  reader.onload = (ev) => {
   const text = ev.target?.result as string;
   if (text) setCsvData(parseCSV(text));
  };
  reader.readAsText(file);
  if (fileRef.current) fileRef.current.value = '';
 };

 const clearFile = () => { setCsvData(null); setCsvFileName(''); };

 /* ── Dialog helpers ── */
 const openAdd = (schedule: WfSchedule) => {
  setForm({ name: '', description: '', prompt: '', schedule, runTime: '09:00', dayOfWeek: schedule === 'weekly' ? 1 : 1 });
  setCsvData(null); setCsvFileName(''); setEditWf(null); setAddOpen(true);
 };
 const openEdit = (wf: ScheduledWorkflow) => {
  setForm({ name: wf.name, description: wf.description, prompt: wf.prompt, schedule: wf.schedule, runTime: wf.runTime || '09:00', dayOfWeek: wf.dayOfWeek ?? 1 });
  if (wf.dataSource) { setCsvFileName(wf.dataSource.fileName); setCsvData({ columns: wf.dataSource.columns, rows: [] }); }
  else { setCsvData(null); setCsvFileName(''); }
  setEditWf(wf); setAddOpen(true);
 };

 /* ── Save workflow ── */
 const save = async () => {
  if (!form.name.trim() || !form.prompt.trim()) return;
  const body: any = { ...form, app_id: APP_ID };
  if (csvData && csvData.columns.length > 0) {
   body.dataSource = { fileName: csvFileName, columns: csvData.columns, rowCount: csvData.rows.length, rows: csvData.rows };
  }
  // Only include dayOfWeek for weekly schedules
  if (form.schedule !== 'weekly') delete body.dayOfWeek;
  try {
   if (editWf) {
    await fetch(API_BASE + '/api/scheduled-workflows/' + editWf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSnack('Workflow updated');
   } else {
    await fetch(API_BASE + '/api/scheduled-workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSnack('Workflow created');
   }
   setAddOpen(false); load();
  } catch (e: any) { setError(e.message); }
 };

 /* ── Toggle & Delete ── */
 const toggle = async (wf: ScheduledWorkflow) => {
  try {
   await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !wf.enabled }) });
   setSnack(wf.enabled ? 'Paused' : 'Enabled'); load();
  } catch (e: any) { setError(e.message); }
 };
 const del = async (id: string) => {
  try { await fetch(API_BASE + '/api/scheduled-workflows/' + id, { method: 'DELETE' }); setSnack('Deleted'); load(); }
  catch (e: any) { setError(e.message); }
 };

 /* ── Run workflow (streams via chat endpoint, processes rows if data source) ── */
 const runWorkflow = async (wf: ScheduledWorkflow) => {
  setRunningId(wf.id); setRunResult(null); setRunProgress([]); setRunRowIdx(0);
  const hasData = wf.dataSource && wf.dataSource.rowCount > 0;

  try {
   // Fetch the full workflow data including rows
   const wfRes = await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id).then(r => r.json());
   const rows = wfRes.workflow?.dataSource?.rows || [];
   const totalRows = hasData ? rows.length : 1;
   setRunTotalRows(totalRows);

   for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    setRunRowIdx(rowIdx + 1);
    let prompt = wf.prompt;
    // If there is row data, substitute column placeholders
    if (hasData && rows[rowIdx]) {
     const cols = wf.dataSource?.columns || [];
     cols.forEach((col: string, ci: number) => {
      const val = rows[rowIdx]?.[ci] || '';
      prompt = prompt.replace(new RegExp('\\\\{' + col.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\\$&') + '\\\\}', 'gi'), val);
      prompt = prompt.replace(new RegExp('\\\\{\\\\{' + col.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\\$&') + '\\\\}\\\\}', 'gi'), val);
     });
    }

    setRunProgress(p => [...p, { type: 'phase', message: hasData ? 'Row ' + (rowIdx + 1) + '/' + totalRows + ': ' + prompt.slice(0, 80) + '...' : 'Running: ' + prompt.slice(0, 100) }]);

    const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
     method: 'POST', headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ message: prompt, app_id: APP_ID }),
    });
    if (!resp.ok || !resp.body) { setRunProgress(p => [...p, { type: 'error', message: 'Request failed for row ' + (rowIdx + 1) }]); continue; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let rowResult: RunResult | null = null;
    while (true) {
     const { done, value } = await reader.read();
     if (done) { parseSSE(buf, true, s => setRunProgress(p => [...p, s]), r => { rowResult = r; setRunResult(r); }, msg => setRunProgress(p => [...p, { type: 'error', message: msg }])); break; }
     buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, s => setRunProgress(p => [...p, s]), r => { rowResult = r; setRunResult(r); }, msg => setRunProgress(p => [...p, { type: 'error', message: msg }]));
    }
    if (rowResult) setRunProgress(p => [...p, { type: 'done', message: 'Row ' + (rowIdx + 1) + ' complete (' + ((rowResult as RunResult).duration / 1000).toFixed(1) + 's)' }]);
   }

   // Update workflow status
   await fetch(API_BASE + '/api/scheduled-workflows/' + wf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastRun: new Date().toISOString(), lastStatus: 'success', processedRows: totalRows, totalRows }) });
   load();
  } catch (e: any) { setError(e.message); }
  finally { setRunningId(null); }
 };

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 const bySchedule = (s: WfSchedule) => workflows.filter(w => w.schedule === s);

 return (
  <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <Schedule /> ${esc(p.appName)} Workflows
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>${heroSub}</Typography>
     </Box>
     <Box sx={{ display: 'flex', gap: 1 }}>
      <Chip label={workflows.length + ' workflows'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
      <Chip label={workflows.filter(w => w.enabled).length + ' active'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
      <Tooltip title="Refresh"><IconButton onClick={load} sx={{ color: '#fff' }}><Refresh /></IconButton></Tooltip>
     </Box>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* ── Running panel ── */}
   {runningId && (
    <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <CircularProgress size={18} />
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Running workflow — row {runRowIdx} of {runTotalRows}</Typography>
     </Box>
     {runTotalRows > 1 && <LinearProgress variant="determinate" value={(runRowIdx / runTotalRows) * 100} sx={{ mb: 1, borderRadius: 1 }} />}
     <ActivitySteps steps={runProgress} isRunning={!!runningId} />
    </Paper>
   )}

   {/* ── Last result ── */}
   {!runningId && runResult && (
    <Paper variant="outlined" sx={{ mb: 2, p: 2, maxHeight: 300, overflow: 'auto' }}>
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {runResult.status === 'success' ? <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : <ErrorOutline sx={{ color: '#f44336', fontSize: 18 }} />}
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Last run — {(runResult.duration / 1000).toFixed(1)}s</Typography>
      <Box sx={{ flex: 1 }} />
      <IconButton size="small" onClick={() => setRunResult(null)}><Close sx={{ fontSize: 16 }} /></IconButton>
     </Box>
     {runResult.error && <Alert severity="error" sx={{ mb: 1 }}>{runResult.error}</Alert>}
     <RichOutput text={runResult.output || ''} />
    </Paper>
   )}

   {/* ── 3 Schedule columns ── */}
   <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {(['daily', 'weekly', 'monitor'] as WfSchedule[]).map(schedule => {
     const col = COL_COLORS[schedule];
     const items = bySchedule(schedule);
     return (
      <Paper key={schedule} variant="outlined" sx={{ flex: 1, minWidth: 280, borderColor: col.border, borderWidth: 2, borderRadius: 2, overflow: 'hidden' }}>
       <Box sx={{ bgcolor: col.bg, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid ' + col.border }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         {col.icon}
         <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: col.border }}>{col.label}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{col.desc}</Typography>
         </Box>
         <Chip label={items.length} size="small" sx={{ fontWeight: 700, bgcolor: col.border, color: '#fff', height: 22 }} />
        </Box>
        <Tooltip title={'Add ' + col.label + ' workflow'}>
         <IconButton size="small" sx={{ color: col.border }} onClick={() => openAdd(schedule)}><Add /></IconButton>
        </Tooltip>
       </Box>
       <Box sx={{ p: 1.5, minHeight: 120, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.length === 0 ? (
         <Box sx={{ textAlign: 'center', py: 3, color: 'text.disabled' }}>
          <Schedule sx={{ fontSize: 32, mb: 0.5 }} />
          <Typography variant="body2">No {col.label.toLowerCase()} workflows yet</Typography>
          <Button size="small" startIcon={<Add />} onClick={() => openAdd(schedule)} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
           Create Workflow
          </Button>
         </Box>
        ) : items.map(wf => (
         <Card key={wf.id} variant="outlined" sx={{ borderRadius: 1.5, borderColor: wf.enabled ? col.border + '60' : '#e0e0e0', bgcolor: wf.enabled ? '#fff' : '#fafafa' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }} noWrap>{wf.name}</Typography>
            <Switch size="small" checked={wf.enabled} onChange={() => toggle(wf)} />
           </Box>
           {wf.description && <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{wf.description}</Typography>}
           <Typography variant="body2" sx={{ fontSize: 11, fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 0.5, mb: 0.5, maxHeight: 40, overflow: 'hidden' }}>
            {wf.prompt.slice(0, 120)}{wf.prompt.length > 120 ? '...' : ''}
           </Typography>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
            {wf.schedule !== 'monitor' && wf.runTime && (
             <Chip icon={<Schedule sx={{ fontSize: 12 }} />} label={wf.schedule === 'weekly' ? (['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wf.dayOfWeek ?? 1]) + ' @ ' + wf.runTime : wf.runTime} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
            )}
            {wf.dataSource && <Chip icon={<TableChart sx={{ fontSize: 12 }} />} label={wf.dataSource.fileName + ' (' + wf.dataSource.rowCount + ' rows)'} size="small" sx={{ fontSize: 10, height: 20 }} />}
            {wf.lastRun && <Typography variant="caption" color="text.disabled">Last: {new Date(wf.lastRun).toLocaleString()}</Typography>}
            {wf.lastStatus && <Chip label={wf.lastStatus} size="small" color={wf.lastStatus === 'success' ? 'success' : 'error'} sx={{ height: 18, fontSize: 10 }} />}
           </Box>
           <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Run now"><IconButton size="small" onClick={() => runWorkflow(wf)} disabled={!!runningId}><PlayArrow sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(wf)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(wf.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
           </Box>
          </CardContent>
         </Card>
        ))}
       </Box>
      </Paper>
     );
    })}
   </Box>

   {/* ── Create/Edit dialog ── */}
   <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
    <DialogTitle>{editWf ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
     <TextField label="Workflow Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" placeholder="e.g. Daily Blog Article" />
     <TextField label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" />
     <TextField label="Schedule" select value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value as WfSchedule }))} fullWidth size="small">
      <MenuItem value="daily">Daily — Runs once per day</MenuItem>
      <MenuItem value="weekly">Weekly — Runs once per week</MenuItem>
      <MenuItem value="monitor">Monitor — Triggered by events</MenuItem>
     </TextField>

     {form.schedule !== 'monitor' && (
      <Box sx={{ display: 'flex', gap: 2 }}>
       <TextField label="Run Time" type="time" value={form.runTime} onChange={e => setForm(f => ({ ...f, runTime: e.target.value }))} size="small" sx={{ width: 160 }}
        InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
       {form.schedule === 'weekly' && (
        <TextField label="Day of Week" select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} size="small" sx={{ width: 180 }}>
         <MenuItem value={1}>Monday</MenuItem>
         <MenuItem value={2}>Tuesday</MenuItem>
         <MenuItem value={3}>Wednesday</MenuItem>
         <MenuItem value={4}>Thursday</MenuItem>
         <MenuItem value={5}>Friday</MenuItem>
         <MenuItem value={6}>Saturday</MenuItem>
         <MenuItem value={0}>Sunday</MenuItem>
        </TextField>
       )}
      </Box>
     )}

     <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Prompt</Typography>
     <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
      Write your AI prompt. If you import data below, use {'{'}<strong>ColumnName</strong>{'}'} placeholders to inject row values — the workflow will process each row.
     </Typography>
     <TextField label="AI Prompt" value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} fullWidth multiline rows={5} size="small"
      placeholder="Write a 500-word SEO blog article about {Topic} targeting the keyword {Keyword}. Include an engaging introduction and 3 subheadings." />

     <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Data Source (optional)</Typography>
     <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
      Upload a CSV or Excel file. Each row becomes a separate run — column headers become placeholders you can use in the prompt above.
     </Typography>
     <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" hidden onChange={handleFile} />
      <Button size="small" variant="outlined" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()} sx={{ textTransform: 'none' }}>
       {csvFileName || 'Upload CSV / Excel'}
      </Button>
      {csvFileName && <IconButton size="small" onClick={clearFile}><Close sx={{ fontSize: 16 }} /></IconButton>}
     </Box>

     {csvData && csvData.columns.length > 0 && (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
       <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Columns:</Typography>
        {csvData.columns.map(c => <Chip key={c} label={'{' + c + '}'} size="small" sx={{ fontFamily: 'monospace', fontSize: 11, height: 22 }} />)}
       </Box>
       {csvData.rows.length > 0 && (
        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
         <Table size="small">
          <TableHead>
           <TableRow>{csvData.columns.map(c => <TableCell key={c} sx={{ fontWeight: 700, fontSize: 11, py: 0.5 }}>{c}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
           {csvData.rows.slice(0, 5).map((row, ri) => (
            <TableRow key={ri}>{row.map((cell, ci) => <TableCell key={ci} sx={{ fontSize: 11, py: 0.3 }}>{cell}</TableCell>)}</TableRow>
           ))}
           {csvData.rows.length > 5 && <TableRow><TableCell colSpan={csvData.columns.length} sx={{ fontSize: 11, color: 'text.disabled', textAlign: 'center' }}>...and {csvData.rows.length - 5} more rows</TableCell></TableRow>}
          </TableBody>
         </Table>
        </Box>
       )}
       <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{csvData.rows.length} rows will be processed</Typography>
      </Paper>
     )}
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setAddOpen(false)}>Cancel</Button>
     <Button variant="contained" onClick={save} disabled={!form.name.trim() || !form.prompt.trim()}>{editWf ? 'Update' : 'Create'}</Button>
    </DialogActions>
   </Dialog>

   <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
  </Box>
 );
}`;
}

// ============================================================================
// DOCUMENTS PAGE
// ============================================================================

export function documentsTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const heroSub = c.heroSubtitle || `Manage files and outputs created by ${esc(p.appName)} skills.`;
 return `import { useEffect, useState, useCallback, useRef } from 'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button,
 Chip, CircularProgress, Alert, TextField, InputAdornment, IconButton,
 Tooltip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions as DActions,
} from '@mui/material';
import Folder from '@mui/icons-material/Folder';
import Image from '@mui/icons-material/Image';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Code from '@mui/icons-material/Code';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import ViewList from '@mui/icons-material/ViewList';
import ViewModule from '@mui/icons-material/ViewModule';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${p.appId};
${SB}

interface FileEntry { name: string; category: string; path: string; size: number; modified: string; url: string; }

const fmtSize = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB';
const catIcon = (c: string) => c === 'images' ? <Image color="success" /> : c === 'pdfs' ? <PictureAsPdf color="error" /> : c === 'html' ? <Code color="info" /> : <InsertDriveFile color="action" />;

export function MembersDocumentsPage() {
 const [files, setFiles] = useState<FileEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('all');
 const [view, setView] = useState<'grid'|'list'>('grid');
 const [uploading, setUploading] = useState(false);
 const [delTarget, setDelTarget] = useState<FileEntry | null>(null);
 const fileRef = useRef<HTMLInputElement>(null);

 const load = useCallback(async () => {
  setLoading(true);
  try {
   const params = new URLSearchParams();
   params.set('app_id', String(APP_ID));
   if (category !== 'all') params.set('category', category);
   const res = await fetch(API_BASE + '/api/skills/files?' + params.toString()).then(r => r.json());
   setFiles(res.files || []);
  } catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, [category]);

 useEffect(() => { load(); }, [load]);

 const filtered = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

 const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  setUploading(true); setError(''); setSuccess('');
  try {
   const form = new FormData(); form.append('file', file);
   if (category !== 'all') form.append('category', category);
   form.append('app_id', String(APP_ID));
   const res = await fetch(API_BASE + '/api/skills/files/upload', { method: 'POST', body: form }).then(r => r.json());
   if (!res.success) throw new Error(res.message);
   setSuccess('Uploaded: ' + file.name); load();
  } catch (e: any) { setError(e.message); }
  finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
 };

 const del = async (f: FileEntry) => {
  setDelTarget(null);
  try {
   const res = await fetch(API_BASE + '/api/skills/files/' + f.category + '/' + encodeURIComponent(f.name) + '?app_id=' + APP_ID, { method: 'DELETE' }).then(r => r.json());
   if (!res.success) throw new Error(res.message);
   setSuccess('Deleted: ' + f.name); load();
  } catch (e: any) { setError(e.message); }
 };

 const dlUrl = (f: FileEntry) => API_BASE + f.url;

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <Folder /> ${esc(p.appName)} Documents
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>${heroSub}</Typography>
     </Box>
     <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.html,.doc,.docx,.txt,.csv,.md,.json,.xml" onChange={upload} />
      <Button variant="contained" startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
       onClick={() => fileRef.current?.click()} disabled={uploading}
       sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Upload</Button>
     </Box>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
   {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

   <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
     InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 220 }} />
    <Tabs value={category} onChange={(_, v) => setCategory(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none', minWidth: 60 } }}>
     <Tab label="All" value="all" /><Tab label="Images" value="images" /><Tab label="PDFs" value="pdfs" /><Tab label="HTML" value="html" /><Tab label="Files" value="files" />
    </Tabs>
    <Box sx={{ flex: 1 }} />
    <IconButton onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? <ViewList /> : <ViewModule />}</IconButton>
    <Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip>
   </Box>

   {filtered.length === 0 ? (
    <Box sx={{ textAlign: 'center', py: 6 }}>
     <Folder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
     <Typography variant="h6" color="text.secondary">No documents yet</Typography>
     <Typography color="text.disabled" sx={{ mb: 2 }}>Upload documents or run skills to generate files.</Typography>
     <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()}>Upload first file</Button>
    </Box>
   ) : (
    <Grid container spacing={2}>
     {filtered.map(f => (
      <Grid item xs={12} sm={6} md={view === 'grid' ? 3 : 12} key={f.path}>
       <Card sx={cardSx}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
         {catIcon(f.category)}
         <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={f.name}><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }} noWrap>{f.name}</Typography></Tooltip>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
           <Chip label={f.category} size="small" sx={{ fontSize: 10, height: 20 }} />
           <Chip label={fmtSize(f.size)} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
          </Box>
         </Box>
         <Tooltip title="Download"><IconButton size="small" component="a" href={dlUrl(f)} download={f.name} target="_blank"><Download /></IconButton></Tooltip>
         <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDelTarget(f)}><Delete /></IconButton></Tooltip>
        </CardContent>
       </Card>
      </Grid>
     ))}
    </Grid>
   )}

   <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
    <Typography variant="caption" color="text.disabled">{filtered.length} files</Typography>
    <Typography variant="caption" color="text.disabled">Total: {fmtSize(filtered.reduce((s, f) => s + f.size, 0))}</Typography>
   </Box>

   <Dialog open={!!delTarget} onClose={() => setDelTarget(null)}>
    <DialogTitle>Delete File</DialogTitle>
    <DialogContent><Typography>Delete <strong>{delTarget?.name}</strong>?</Typography></DialogContent>
    <DActions><Button onClick={() => setDelTarget(null)}>Cancel</Button><Button color="error" variant="contained" onClick={() => delTarget && del(delTarget)}>Delete</Button></DActions>
   </Dialog>
  </Box>
 );
}`;
}

// ============================================================================
// API KEYS PAGE
// ============================================================================

export function apiKeysTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 const c = p.copy || {};
 const heroSub = c.heroSubtitle || `Manage API keys for ${esc(p.appName)} integrations and services.`;
 return `import { useEffect, useState, useCallback } from 'react';
import {
 Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
 Button, Chip, CircularProgress, Alert, TextField, Dialog, DialogTitle,
 DialogContent, DialogActions, IconButton, Tooltip, Avatar, Snackbar,
} from '@mui/material';
import VpnKey from '@mui/icons-material/VpnKey';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Refresh from '@mui/icons-material/Refresh';
import CheckCircle from '@mui/icons-material/CheckCircle';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${p.appId};
${SB}

interface ApiKey { name: string; value: string; createdAt?: string; }
const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Brave', 'Apify', 'Resend', 'Perplexity'];

/* Which API keys are needed by which tools */
const REQUIRED_KEYS: { key: string; label: string; tools: string[]; description: string }[] = [
 { key: 'openai', label: 'OpenAI', tools: ['generate-image', 'text-to-speech', 'transcribe-audio'], description: 'AI chat, DALL-E images, text-to-speech, audio transcription' },
 { key: 'brave', label: 'Brave Search', tools: ['brave-search'], description: 'Web search for research and content skills' },
 { key: 'apify', label: 'Apify', tools: ['apify-scraper'], description: 'Web scraping to read full page content' },
 { key: 'resend', label: 'Resend', tools: ['send-email'], description: 'Send emails from skills' },
];

export function MembersApiKeysPage() {
 const [keys, setKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [addOpen, setAddOpen] = useState(false);
 const [newName, setNewName] = useState('');
 const [newValue, setNewValue] = useState('');
 const [saving, setSaving] = useState(false);
 const [showValues, setShowValues] = useState<Record<string, boolean>>({});
 const [snack, setSnack] = useState('');

 const load = useCallback(async () => {
  setLoading(true);
  try { const res = await fetch(API_BASE + '/api/api-keys').then(r => r.json()); setKeys(res.keys || []); }
  catch (e: any) { setError(e.message); }
  finally { setLoading(false); }
 }, []);

 useEffect(() => { load(); }, [load]);

 const addKey = async () => {
  if (!newName.trim() || !newValue.trim()) return;
  setSaving(true);
  try {
   await fetch(API_BASE + '/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), value: newValue.trim() }) });
   setSnack('Key added: ' + newName); setNewName(''); setNewValue(''); setAddOpen(false); load();
  } catch (e: any) { setError(e.message); }
  finally { setSaving(false); }
 };

 const delKey = async (name: string) => {
  try { await fetch(API_BASE + '/api/api-keys/' + encodeURIComponent(name), { method: 'DELETE' }); setSnack('Deleted: ' + name); load(); }
  catch (e: any) { setError(e.message); }
 };

 const mask = (v: string) => v.slice(0, 4) + '••••••••' + v.slice(-4);

 if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(180, -60, -40)} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
       <VpnKey /> ${esc(p.appName)} API Keys
      </Typography>
      <Typography sx={{ opacity: 0.85, mt: 0.5 }}>${heroSub}</Typography>
     </Box>
     <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}
      sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>Add Key</Button>
    </Box>
   </Paper>

   {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

   {/* Required Keys Status */}
   <Paper sx={{ ...sectionSx, mb: 2 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
     <VpnKey sx={{ fontSize: 18 }} /> Required API Keys for Your Tools
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
     {REQUIRED_KEYS.map(rk => {
      const configured = keys.some(k => k.name.toLowerCase() === rk.key.toLowerCase() && k.value);
      return (
       <Box key={rk.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: configured ? '#e8f5e9' : '#fff3e0', flexWrap: 'wrap' }}>
        <CheckCircle sx={{ fontSize: 18, color: configured ? '#4caf50' : '#bbb' }} />
        <Typography sx={{ fontWeight: 700, fontSize: 13, minWidth: 100 }}>{rk.label}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontSize: 12 }}>{rk.description}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
         {rk.tools.map(t => <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: 10 }} />)}
        </Box>
        {configured ? (
         <Chip label="Configured" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, height: 22, fontSize: 11 }} />
        ) : (
         <Button size="small" variant="outlined" color="warning" sx={{ fontWeight: 600, fontSize: 11, height: 24, textTransform: 'none' }}
          onClick={() => { setNewName(rk.label); setAddOpen(true); }}>
          Add Key
         </Button>
        )}
       </Box>
      );
     })}
    </Box>
   </Paper>

   <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
    {PROVIDERS.map(p => (
     <Chip key={p} label={'+ ' + p} clickable onClick={() => { setNewName(p); setAddOpen(true); }} sx={{ fontWeight: 600 }} />
    ))}
   </Box>

   <Paper sx={{ ...sectionSx, p: 0 }}>
    <Table>
     <TableHead>
      <TableRow sx={{ bgcolor: COLORS.bg }}>
       <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
       <TableCell sx={{ fontWeight: 700 }}>Key</TableCell>
       <TableCell sx={{ fontWeight: 700 }}>Added</TableCell>
       <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {keys.length === 0 ? (
       <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
        <VpnKey sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No API keys yet</Typography>
        <Button size="small" onClick={() => setAddOpen(true)} sx={{ mt: 1 }}>Add your first key</Button>
       </TableCell></TableRow>
      ) : keys.map(k => (
       <TableRow key={k.name} hover>
        <TableCell>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.tint, color: COLORS.primary, fontSize: '0.8rem' }}><VpnKey sx={{ fontSize: 16 }} /></Avatar>
          <Typography sx={{ fontWeight: 600 }}>{k.name}</Typography>
         </Box>
        </TableCell>
        <TableCell>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{showValues[k.name] ? k.value : mask(k.value)}</Typography>
          <IconButton size="small" onClick={() => setShowValues(prev => ({ ...prev, [k.name]: !prev[k.name] }))}>{showValues[k.name] ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton>
         </Box>
        </TableCell>
        <TableCell>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</TableCell>
        <TableCell align="right">
         <Tooltip title="Delete"><IconButton color="error" onClick={() => delKey(k.name)}><Delete /></IconButton></Tooltip>
        </TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </Paper>

   <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
    <DialogTitle>Add API Key</DialogTitle>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
     <TextField label="Provider Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth size="small" />
     <TextField label="API Key Value" value={newValue} onChange={e => setNewValue(e.target.value)} fullWidth size="small" type="password" />
    </DialogContent>
    <DialogActions>
     <Button onClick={() => setAddOpen(false)}>Cancel</Button>
     <Button variant="contained" onClick={addKey} disabled={saving || !newName.trim() || !newValue.trim()} sx={gradientBtnSx}>
      {saving ? <CircularProgress size={16} /> : 'Save Key'}
     </Button>
    </DialogActions>
   </Dialog>

   <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
  </Box>
 );
}`;
}

// ============================================================================
// SKILL SHORTCODE PAGE TEMPLATE (static — replaces AI generation for [skill-shortcode] pages)
// ============================================================================

/**
 * A complete static page template for pages with [skill-shortcode].
 * Renders a hero section + chat input + results — no AI generation needed.
 * The chat decides what skill to run (like the skills page), so this works
 * for any function (blog poster, video scripts, research, etc.).
 */
export function skillShortcodeTemplate(
 p: TemplateParams,
 pageId: string,
 pageName: string,
 pageDescription: string,
): string {
 const sec = darken(p.primaryColor, 0.15);
 const SB = sharedBlock(p.primaryColor, sec);
 // Strip [skill-shortcode] / [skills-shortcode] from displayed description
 const cleanDesc = (pageDescription || '').replace(/\[skills?[\s-]*shortcode\]/gi, '').trim()
   || `AI-powered tools for ${esc(p.appName)}.`;
 // Convert page.id to PascalCase for the component export name
 const pascal = pageId.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

 return `import { useState, useEffect, useRef } from 'react';
import {
 Box, Typography, Paper, Button, TextField, IconButton, Alert,
 CircularProgress, Tooltip, Divider, LinearProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${p.appId};
${SB}

/* ── SSE helpers ──────────────────────────────────────── */
interface SkillRunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }

function parseSSE(
 buffer: string,
 isFinal: boolean,
 onDone: (r: SkillRunResult) => void,
 onError: (msg: string) => void,
): string {
 const lines = buffer.split('\\n');
 const rest = isFinal ? '' : (lines.pop() || '');
 let evType = '', evData = '';
 for (const line of lines) {
  if (line.startsWith('event: ')) evType = line.slice(7).trim();
  else if (line.startsWith('data: ')) evData = line.slice(6);
  else if (line.trim() === '' && evType && evData) {
   try {
    const p = JSON.parse(evData);
    if (evType === 'done' && p.result) onDone(p.result);
    else if (evType === 'error') onError(p.message || 'Run failed');
   } catch {}
   evType = ''; evData = '';
  }
 }
 if (isFinal && evType && evData) {
  try {
   const p = JSON.parse(evData);
   if (evType === 'done' && p.result) onDone(p.result);
   else if (evType === 'error') onError(p.message || 'Run failed');
  } catch {}
 }
 return rest;
}

/* ── Rich output renderer ─────────────────────────────── */
function RichOutput({ text }: { text: string }) {
 if (!text) return null;
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|\\\`([^\\\`]+)\\\`|\\[([^\\]]+)\\]\\(([^)]+)\\))/g;
  let last = 0, m: any, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>);
   else if (m[5]) {
    const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6];
    out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '${esc(p.primaryColor)}' }}>{m[5]}</a>);
   }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }
 const lines = text.split('\\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const trimmed = line.trim();
    const imgM = trimmed.match(/^!\\[([^\\]]*)\\]\\(([^)]+)\\)$/);
    if (imgM) {
     const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2];
     return <Box key={i} sx={{ my: 1, textAlign: 'center' }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>;
    }
    const linkM = trimmed.match(/^\\[([^\\]]+)\\]\\(([^)]+)\\)$/);
    if (linkM) {
     const href = linkM[2].startsWith('/') ? API_BASE + linkM[2] : linkM[2];
     return <Box key={i} sx={{ my: 0.5 }}><Button variant="outlined" size="small" href={href} target="_blank" rel="noopener" sx={{ textTransform: 'none' }}>{linkM[1]}</Button></Box>;
    }
    if (trimmed.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.3, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^####\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^###\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ mt: 1.5, mb: 0.5, fontSize: 15, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^##\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^#\\s*/, ''))}</Typography>;
    if (/^[-*_]{3,}$/.test(trimmed)) return <Divider key={i} sx={{ my: 1 }} />;
    const ulM = trimmed.match(/^[-*]\\s+(.+)/);
    if (ulM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>•</span><span>{inlineFormat(ulM[1])}</span></Typography>;
    const olM = trimmed.match(/^(\\d+)\\.\\s+(.+)/);
    if (olM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>{olM[1]}.</span><span>{inlineFormat(olM[2])}</span></Typography>;
    if (!trimmed) return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inlineFormat(trimmed)}</Typography>;
   })}
  </Box>
 );
}

/* ── Page component ───────────────────────────────────── */
export function Members${pascal}Page() {
 const [input, setInput] = useState('');
 const [running, setRunning] = useState(false);
 const [result, setResult] = useState<SkillRunResult | null>(null);
 const [error, setError] = useState('');
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => { inputRef.current?.focus(); }, []);

 const run = async () => {
  const msg = input.trim();
  if (!msg || running) return;
  setRunning(true); setResult(null); setError('');
  try {
   const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, app_id: APP_ID }),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Request failed'); setRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, r => setResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, r => setResult(r), setError);
   }
   setInput('');
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 return (
  <Box>
   {/* Hero */}
   <Paper sx={heroSx}>
    <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
    <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: 20, right: 120 }} />
    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
     <AutoAwesomeIcon sx={{ fontSize: 36, opacity: 0.9 }} />
     <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.5 }}>${esc(pageName)}</Typography>
      <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 520 }}>${cleanDesc}</Typography>
     </Box>
    </Box>
   </Paper>

   {/* Chat Input */}
   <Paper sx={{ mb: 2, overflow: 'hidden', background: 'linear-gradient(135deg, ${esc(p.primaryColor)}12, ${esc(sec)}08)', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
     <SmartToyIcon sx={{ color: '${esc(p.primaryColor)}', fontSize: 28 }} />
     <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>${esc(pageName)} AI</Typography>
     </Box>
     {result && (
      <Tooltip title="Clear"><IconButton size="small" onClick={() => { setResult(null); setInput(''); }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     )}
    </Box>
    <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
     <TextField inputRef={inputRef} size="small" fullWidth placeholder="Describe what you need..."
      value={input} onChange={e => setInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
      sx={{ '& .MuiOutlinedInput-root': { fontSize: 14, bgcolor: 'background.paper' } }} />
     <Button variant="contained" size="small" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
      onClick={run} disabled={running || !input.trim()}
      sx={{ background: 'linear-gradient(135deg, ${esc(p.primaryColor)}, ${esc(sec)})', minWidth: 100, height: 40, fontWeight: 700, '&:hover': { background: 'linear-gradient(135deg, ${esc(sec)}, ${esc(p.primaryColor)})' } }}>
      {running ? 'Thinking...' : 'Send'}
     </Button>
    </Box>
    {running && <LinearProgress sx={{ height: 2 }} />}
   </Paper>

   {/* Results */}
   <Paper variant="outlined" sx={{ minHeight: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 4 }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Results</Typography>
     {running && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}
     {!result && !running && !error && (
      <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 6 }}>Results will appear here...</Typography>
     )}
     {running && !result && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, justifyContent: 'center' }}>
       <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing your request...</Typography>
      </Box>
     )}
     {result && (
      <Box>
       {result.error && <Alert severity="error" sx={{ mb: 1 }}>{result.error}</Alert>}
       {result.status && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
         {result.status === 'success' ? <CheckCircleIcon color="success" sx={{ fontSize: 14 }} /> : <ErrorIcon color="error" sx={{ fontSize: 14 }} />}
         <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{(result.duration / 1000).toFixed(1)}s</Typography>
        </Box>
       )}
       <RichOutput text={result.output || ''} />
      </Box>
     )}
    </Box>
   </Paper>
  </Box>
 );
}
`;
}


// ============================================================================
// SKILL WIDGET BLOCK (for [skill-shortcode] in custom pages — LEGACY, kept for reference)
// ============================================================================

/**
 * Returns a self-contained code block defining parseSSE, RichOutput, ActivitySteps,
 * and SkillWidget — ready to be inlined into any AI-generated custom page.
 * The AI just needs to render <SkillWidget /> wherever the user placed [skill-shortcode].
 */
export function skillWidgetBlock(primaryColor: string, appId: number): string {
 const sec = darken(primaryColor, 0.15);
 return `import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
 Box, Typography, Paper, Button, TextField, IconButton, Alert, Grid,
 CircularProgress, Tooltip, Divider, LinearProgress, Card, CardContent, Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = ${appId};

/* ── Skill Widget helpers (auto-injected) ─────────────────── */
interface SkillProgressStep { type: string; message: string; elapsed?: number; }
interface SkillRunResult { id: string; skillId?: string; status: 'success' | 'error'; output: string; logs: string[]; toolCalls: { toolName: string; input: any; output: any; duration: number }[]; duration: number; error?: string; }

function parseSSE(
 buffer: string,
 isFinal: boolean,
 onProgress: (s: SkillProgressStep) => void,
 onDone: (r: SkillRunResult) => void,
 onError: (msg: string) => void,
): string {
 const lines = buffer.split('\\n');
 const rest = isFinal ? '' : (lines.pop() || '');
 let evType = '', evData = '';
 for (const line of lines) {
  if (line.startsWith('event: ')) evType = line.slice(7).trim();
  else if (line.startsWith('data: ')) evData = line.slice(6);
  else if (line.trim() === '' && evType && evData) {
   try {
    const p = JSON.parse(evData);
    if (evType === 'progress') onProgress(p);
    else if (evType === 'done' && p.result) onDone(p.result);
    else if (evType === 'error') onError(p.message || 'Run failed');
   } catch {}
   evType = ''; evData = '';
  }
 }
 if (isFinal && evType && evData) {
  try {
   const p = JSON.parse(evData);
   if (evType === 'done' && p.result) onDone(p.result);
   else if (evType === 'error') onError(p.message || 'Run failed');
  } catch {}
 }
 return rest;
}

function RichOutput({ text }: { text: string }) {
 if (!text) return null;
 function inlineFormat(str: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|\\\`([^\\\`]+)\\\`|\\[([^\\]]+)\\]\\(([^)]+)\\))/g;
  let last = 0, m: any, idx = 0;
  while ((m = re.exec(str)) !== null) {
   if (m.index > last) out.push(<span key={idx++}>{str.slice(last, m.index)}</span>);
   if (m[2]) out.push(<strong key={idx++}>{m[2]}</strong>);
   else if (m[3]) out.push(<em key={idx++}>{m[3]}</em>);
   else if (m[4]) out.push(<code key={idx++} style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{m[4]}</code>);
   else if (m[5]) {
    const href = m[6].startsWith('/') ? API_BASE + m[6] : m[6];
    out.push(<a key={idx++} href={href} target="_blank" rel="noopener" style={{ color: '${esc(primaryColor)}' }}>{m[5]}</a>);
   }
   last = m.index + m[0].length;
  }
  if (last < str.length) out.push(<span key={idx++}>{str.slice(last)}</span>);
  return out.length ? out : [<span key={0}>{str}</span>];
 }
 const lines = text.split('\\n');
 return (
  <Box>
   {lines.map((line, i) => {
    const trimmed = line.trim();
    const imgM = trimmed.match(/^!\\[([^\\]]*)\\]\\(([^)]+)\\)$/);
    if (imgM) {
     const src = imgM[2].startsWith('/') ? API_BASE + imgM[2] : imgM[2];
     return <Box key={i} sx={{ my: 1, textAlign: 'center' }}><img src={src} alt={imgM[1]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }} /></Box>;
    }
    const linkM = trimmed.match(/^\\[([^\\]]+)\\]\\(([^)]+)\\)$/);
    if (linkM) {
     const href = linkM[2].startsWith('/') ? API_BASE + linkM[2] : linkM[2];
     return <Box key={i} sx={{ my: 0.5 }}><Button variant="outlined" size="small" href={href} target="_blank" rel="noopener" sx={{ textTransform: 'none' }}>{linkM[1]}</Button></Box>;
    }
    if (trimmed.startsWith('#### ')) return <Typography key={i} variant="subtitle2" sx={{ mt: 1, mb: 0.3, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^####\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('### ')) return <Typography key={i} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^###\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('## ')) return <Typography key={i} variant="h6" sx={{ mt: 1.5, mb: 0.5, fontSize: 15, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^##\\s*/, ''))}</Typography>;
    if (trimmed.startsWith('# ')) return <Typography key={i} variant="h5" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{inlineFormat(trimmed.replace(/^#\\s*/, ''))}</Typography>;
    if (/^[-*_]{3,}$/.test(trimmed)) return <Divider key={i} sx={{ my: 1 }} />;
    const ulM = trimmed.match(/^[-*]\\s+(.+)/);
    if (ulM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>•</span><span>{inlineFormat(ulM[1])}</span></Typography>;
    const olM = trimmed.match(/^(\\d+)\\.\\s+(.+)/);
    if (olM) return <Typography key={i} component="div" variant="body2" sx={{ pl: 2, lineHeight: 1.7, display: 'flex', gap: 0.5 }}><span>{olM[1]}.</span><span>{inlineFormat(olM[2])}</span></Typography>;
    if (!trimmed) return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inlineFormat(trimmed)}</Typography>;
   })}
  </Box>
 );
}

function SkillWidget({ placeholder = 'Ask the AI anything...', title = 'AI Assistant' }: { placeholder?: string; title?: string }) {
 const [input, setInput] = useState('');
 const [running, setRunning] = useState(false);
 const [result, setResult] = useState<SkillRunResult | null>(null);
 const [error, setError] = useState('');
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => { inputRef.current?.focus(); }, []);

 const run = async () => {
  const msg = input.trim();
  if (!msg || running) return;
  setRunning(true); setResult(null); setError('');
  try {
   const resp = await fetch(API_BASE + '/api/skills/chat-stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, app_id: APP_ID }),
   });
   if (!resp.ok || !resp.body) { setError(await resp.text() || 'Request failed'); setRunning(false); return; }
   const reader = resp.body.getReader();
   const decoder = new TextDecoder();
   let buf = '';
   while (true) {
    const { done, value } = await reader.read();
    if (done) { parseSSE(buf, true, () => {}, r => setResult(r), setError); break; }
    buf = parseSSE(buf + decoder.decode(value, { stream: true }), false, () => {}, r => setResult(r), setError);
   }
   setInput('');
  } catch (e: any) { setError(e.message); }
  finally { setRunning(false); }
 };

 return (
  <Box>
   {/* Chat Input */}
   <Paper sx={{ mb: 2, overflow: 'hidden', background: 'linear-gradient(135deg, ${esc(primaryColor)}12, ${esc(sec)}08)', border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
     <SmartToyIcon sx={{ color: '${esc(primaryColor)}', fontSize: 28 }} />
     <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
     </Box>
     {result && (
      <Tooltip title="Clear"><IconButton size="small" onClick={() => { setResult(null); setInput(''); }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
     )}
    </Box>
    <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
     <TextField inputRef={inputRef} size="small" fullWidth placeholder={placeholder}
      value={input} onChange={e => setInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
      sx={{ '& .MuiOutlinedInput-root': { fontSize: 14, bgcolor: 'background.paper' } }} />
     <Button variant="contained" size="small" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
      onClick={run} disabled={running || !input.trim()}
      sx={{ background: 'linear-gradient(135deg, ${esc(primaryColor)}, ${esc(sec)})', minWidth: 100, height: 40, fontWeight: 700, '&:hover': { background: 'linear-gradient(135deg, ${esc(sec)}, ${esc(primaryColor)})' } }}>
      {running ? 'Thinking...' : 'Send'}
     </Button>
    </Box>
    {running && <LinearProgress sx={{ height: 2 }} />}
   </Paper>

   {/* Results Output */}
   <Paper variant="outlined" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Box sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, bgcolor: '#fafafa' }}>
     <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Results</Typography>
     {running && <CircularProgress size={14} />}
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } }}>
     {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}
     {!result && !running && !error && (
      <Typography color="text.disabled" variant="body2" sx={{ textAlign: 'center', mt: 3 }}>Results will appear here...</Typography>
     )}
     {running && !result && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
       <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Processing...</Typography>
      </Box>
     )}
     {result && (
      <Box>
       {result.error && <Alert severity="error" sx={{ mb: 1 }}>{result.error}</Alert>}
       {result.status && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
         {result.status === 'success' ? <CheckCircleIcon color="success" sx={{ fontSize: 14 }} /> : <ErrorIcon color="error" sx={{ fontSize: 14 }} />}
         <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{(result.duration / 1000).toFixed(1)}s</Typography>
        </Box>
       )}
       <RichOutput text={result.output || ''} />
      </Box>
     )}
    </Box>
   </Paper>
  </Box>
 );
}
/* ── End Skill Widget ─────────────────────────────────────── */`;
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/** Page types that use static templates instead of AI generation */
export const TEMPLATE_PAGE_TYPES = ['dashboard','skills','workflows','documents','api-keys','admin','contact'] as const;

/** Get the static template for a page type, or null if it requires AI generation */
export function getPageTemplate(pageType: string, params: TemplateParams): string | null {
 switch (pageType) {
 case 'dashboard': return dashboardTemplate(params);
 case 'skills': return skillsTemplate(params);
 case 'workflows': return workflowsTemplate(params);
 case 'documents': return documentsTemplate(params);
 case 'api-keys': return apiKeysTemplate(params);
 case 'admin': return adminTemplate(params);
 case 'contact': return contactFormTemplate(params);
 default: return null;
 }
}
