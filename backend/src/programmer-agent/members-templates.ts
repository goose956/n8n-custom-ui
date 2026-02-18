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
// TEMPLATE REGISTRY
// ============================================================================

/** Page types that use static templates instead of AI generation */
export const TEMPLATE_PAGE_TYPES = ['dashboard','profile','settings','admin','contact'] as const;

/** Get the static template for a page type, or null if it requires AI generation */
export function getPageTemplate(pageType: string, params: TemplateParams): string | null {
 switch (pageType) {
 case 'dashboard': return dashboardTemplate(params);
 case 'profile': return profileTemplate(params);
 case 'settings': return settingsTemplate(params);
 case 'admin': return adminTemplate(params);
 case 'contact': return contactFormTemplate(params);
 default: return null;
 }
}
