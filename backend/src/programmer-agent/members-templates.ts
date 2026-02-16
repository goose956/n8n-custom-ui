/**
 * Static page templates for members area pages that are identical across all SaaS apps.
 * Only the app name, app ID, and primary color are injected.
 * This saves ~10,000 AI tokens per members area generation.
 */

interface TemplateParams {
 appName: string;
 appId: number;
 primaryColor: string;
}

function darken(hex: string, pct: number): string {
 const num = parseInt(hex.replace('#',''), 16);
 const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * pct));
 const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
 const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
 return`#${((r << 16) | (g << 8) | b).toString(16).padStart(6,'0')}`;
}

// --- Profile Page ------------------------------------------------------------

export function profileTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 return`import { useState } from'react';
import {
 Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider,
 Chip, Snackbar, Alert, Skeleton, IconButton, Tooltip, Card, CardContent,
} from'@mui/material';
import AccountCircle from'@mui/icons-material/AccountCircle';
import Edit from'@mui/icons-material/Edit';
import Save from'@mui/icons-material/Save';
import Cancel from'@mui/icons-material/Cancel';
import Email from'@mui/icons-material/Email';
import Phone from'@mui/icons-material/Phone';
import Badge from'@mui/icons-material/Badge';
import CalendarToday from'@mui/icons-material/CalendarToday';
import CheckCircle from'@mui/icons-material/CheckCircle';
import PhotoCamera from'@mui/icons-material/PhotoCamera';

export function MembersProfilePage() {
 const [editing, setEditing] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity:'success' |'error' }>({ open: false, message:'', severity:'success' });
 const [profile, setProfile] = useState({
 firstName:'Jane',
 lastName:'Doe',
 email:'jane@example.com',
 phone:'+1 555-0123',
 bio:'Active ${p.appName} user since 2025.',
 joinDate:'2025-06-15',
 plan:'Pro',
 });
 const [draft, setDraft] = useState({ ...profile });

 const handleSave = () => {
 setProfile({ ...draft });
 setEditing(false);
 setSnackbar({ open: true, message:'Profile updated successfully!', severity:'success' });
 };

 const handleCancel = () => {
 setDraft({ ...profile });
 setEditing(false);
 };

 return (
 <Box sx={{ maxWidth: 900, mx:'auto' }}>
 {/* Hero header */}
 <Paper sx={{
 p: 4, mb: 3, borderRadius: 3,
 background:'linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)',
 color:'#fff', position:'relative', overflow:'hidden',
 }}>
 <Box sx={{ position:'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
 <Box sx={{ display:'flex', alignItems:'center', gap: 3 }}>
 <Box sx={{ position:'relative' }}>
 <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor:'rgba(255,255,255,0.2)', border:'3px solid rgba(255,255,255,0.5)' }}>
 {profile.firstName[0]}{profile.lastName[0]}
 </Avatar>
 <IconButton size="small" sx={{ position:'absolute', bottom: 0, right: 0, bgcolor:'rgba(255,255,255,0.9)','&:hover': { bgcolor:'#fff' } }}>
 <PhotoCamera sx={{ fontSize: 16 }} />
 </IconButton>
 </Box>
 <Box>
 <Typography variant="h4" fontWeight={700}>{profile.firstName} {profile.lastName}</Typography>
 <Box sx={{ display:'flex', gap: 1, mt: 1 }}>
 <Chip icon={<CheckCircle />} label={profile.plan +' Plan'} size="small" sx={{ bgcolor:'rgba(255,255,255,0.2)', color:'#fff' }} />
 <Chip icon={<CalendarToday />} label={'Joined' + new Date(profile.joinDate).toLocaleDateString()} size="small" sx={{ bgcolor:'rgba(255,255,255,0.2)', color:'#fff' }} />
 </Box>
 </Box>
 <Box sx={{ ml:'auto' }}>
 {!editing ? (
 <Button variant="contained" startIcon={<Edit />} onClick={() => setEditing(true)}
 sx={{ bgcolor:'rgba(255,255,255,0.2)','&:hover': { bgcolor:'rgba(255,255,255,0.3)' } }}>
 Edit Profile
 </Button>
 ) : (
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ bgcolor:'#4caf50','&:hover': { bgcolor:'#388e3c' } }}>Save</Button>
 <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ color:'#fff', borderColor:'rgba(255,255,255,0.5)' }}>Cancel</Button>
 </Box>
 )}
 </Box>
 </Box>
 </Paper>

 {/* Details cards */}
 <Grid container spacing={3}>
 <Grid item xs={12} md={8}>
 <Paper sx={{ p: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display:'flex', alignItems:'center', gap: 1 }}>
 <Badge sx={{ color:'${p.primaryColor}' }} /> Personal Information
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
 InputProps={{ startAdornment: <Email sx={{ mr: 1, color:'text.secondary', fontSize: 20 }} /> }} />
 </Grid>
 <Grid item xs={12} sm={6}>
 <TextField fullWidth label="Phone" value={editing ? draft.phone : profile.phone}
 onChange={e => setDraft({ ...draft, phone: e.target.value })} disabled={!editing} size="small"
 InputProps={{ startAdornment: <Phone sx={{ mr: 1, color:'text.secondary', fontSize: 20 }} /> }} />
 </Grid>
 <Grid item xs={12}>
 <TextField fullWidth label="Bio" value={editing ? draft.bio : profile.bio}
 onChange={e => setDraft({ ...draft, bio: e.target.value })} disabled={!editing} multiline rows={3} size="small" />
 </Grid>
 </Grid>
 </Paper>
 </Grid>

 <Grid item xs={12} md={4}>
 <Card sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', height:'100%' }}>
 <CardContent>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display:'flex', alignItems:'center', gap: 1 }}>
 <AccountCircle sx={{ color:'${p.primaryColor}' }} /> Account Summary
 </Typography>
 <Divider sx={{ mb: 2 }} />
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography color="text.secondary" variant="body2">Plan</Typography>
 <Chip label={profile.plan} size="small" color="primary" />
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography color="text.secondary" variant="body2">Status</Typography>
 <Chip label="Active" size="small" color="success" />
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
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
}`;
}

// --- Settings Page -----------------------------------------------------------

export function settingsTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 return`import { useState } from'react';
import {
 Box, Typography, Paper, Grid, Switch, FormControlLabel,
 Button, Divider, Select, MenuItem, FormControl, InputLabel,
 Snackbar, Alert, Chip, Card, CardContent,
} from'@mui/material';
import Settings from'@mui/icons-material/Settings';
import Notifications from'@mui/icons-material/Notifications';
import Lock from'@mui/icons-material/Lock';
import Palette from'@mui/icons-material/Palette';
import Language from'@mui/icons-material/Language';
import Save from'@mui/icons-material/Save';
import Security from'@mui/icons-material/Security';
import Visibility from'@mui/icons-material/Visibility';
import DarkMode from'@mui/icons-material/DarkMode';
import DeleteForever from'@mui/icons-material/DeleteForever';

export function MembersSettingsPage() {
 const [snackbar, setSnackbar] = useState(false);
 const [settings, setSettings] = useState({
 emailNotifications: true,
 pushNotifications: false,
 marketingEmails: false,
 weeklyDigest: true,
 theme:'light',
 language:'en',
 profileVisibility:'public',
 twoFactor: false,
 loginAlerts: true,
 dataSharing: false,
 });

 const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));
 const handleSave = () => setSnackbar(true);

 const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
 <Paper sx={{ p: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 1, display:'flex', alignItems:'center', gap: 1 }}>{icon} {title}</Typography>
 <Divider sx={{ mb: 2 }} />{children}
 </Paper>
 );

 return (
 <Box sx={{ maxWidth: 800, mx:'auto' }}>
 <Paper sx={{
 p: 3, mb: 3, borderRadius: 3,
 background:'linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)',
 color:'#fff',
 }}>
 <Typography variant="h4" fontWeight={700} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Settings /> Settings
 </Typography>
 <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Manage your ${p.appName} account preferences</Typography>
 </Paper>

 <Section icon={<Notifications sx={{ color:'${p.primaryColor}' }} />} title="Notifications">
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={e => update('emailNotifications', e.target.checked)} />} label="Email notifications" />
 <FormControlLabel control={<Switch checked={settings.pushNotifications} onChange={e => update('pushNotifications', e.target.checked)} />} label="Push notifications" />
 <FormControlLabel control={<Switch checked={settings.weeklyDigest} onChange={e => update('weeklyDigest', e.target.checked)} />} label="Weekly digest email" />
 <FormControlLabel control={<Switch checked={settings.marketingEmails} onChange={e => update('marketingEmails', e.target.checked)} />} label="Marketing & product updates" />
 </Box>
 </Section>

 <Section icon={<Palette sx={{ color:'${p.primaryColor}' }} />} title="Appearance">
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

 <Section icon={<Security sx={{ color:'${p.primaryColor}' }} />} title="Privacy & Security">
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 <FormControlLabel control={<Switch checked={settings.twoFactor} onChange={e => update('twoFactor', e.target.checked)} />} label="Two-factor authentication" />
 <FormControlLabel control={<Switch checked={settings.loginAlerts} onChange={e => update('loginAlerts', e.target.checked)} />} label="Login alerts" />
 <FormControlLabel control={<Switch checked={settings.dataSharing} onChange={e => update('dataSharing', e.target.checked)} />} label="Data sharing with third parties" />
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mt: 1 }}>
 <Visibility sx={{ color:'text.secondary', fontSize: 20 }} />
 <Typography variant="body2" color="text.secondary">Profile visibility:</Typography>
 <Chip label={settings.profileVisibility} size="small" color={settings.profileVisibility ==='public' ?'success' :'default'}
 onClick={() => update('profileVisibility', settings.profileVisibility ==='public' ?'private' :'public')} />
 </Box>
 </Box>
 </Section>

 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Button variant="outlined" color="error" startIcon={<DeleteForever />}>Delete Account</Button>
 <Button variant="contained" startIcon={<Save />} onClick={handleSave}
 sx={{ bgcolor:'${p.primaryColor}','&:hover': { bgcolor:'${sec}' } }}>
 Save Changes
 </Button>
 </Box>

 <Snackbar open={snackbar} autoHideDuration={4000} onClose={() => setSnackbar(false)}>
 <Alert severity="success" onClose={() => setSnackbar(false)}>Settings saved successfully!</Alert>
 </Snackbar>
 </Box>
 );
}`;
}

// --- Admin Page (Analytics + Contact Submissions) ----------------------------

export function adminTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 return`import { useEffect, useState, useCallback } from'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
 Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
 Avatar, Skeleton, LinearProgress, Alert, Snackbar, IconButton,
 Tooltip, Menu, MenuItem,
} from'@mui/material';
import Dashboard from'@mui/icons-material/Dashboard';
import People from'@mui/icons-material/People';
import TrendingUp from'@mui/icons-material/TrendingUp';
import AttachMoney from'@mui/icons-material/AttachMoney';
import Visibility from'@mui/icons-material/Visibility';
import Refresh from'@mui/icons-material/Refresh';
import Email from'@mui/icons-material/Email';
import MarkEmailRead from'@mui/icons-material/MarkEmailRead';
import Delete from'@mui/icons-material/Delete';
import MoreVert from'@mui/icons-material/MoreVert';
import Inbox from'@mui/icons-material/Inbox';
import FiberNew from'@mui/icons-material/FiberNew';

const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';

interface AppStats { app_id: number; name: string; active_subscriptions: number; total_subscriptions: number; total_revenue: number; created_at: string; }
interface Analytics { app_id: number; total_page_views: number; unique_visitors: number; page_stats: Record<string, number>; views_by_date: Record<string, number>; recent_views: any[]; }
interface ContactSubmission { id: number; app_id?: number; name: string; email: string; subject: string; message: string; status: 'new' | 'read' | 'replied' | 'archived'; created_at: string; }

export function MembersAdminPage() {
 const [tab, setTab] = useState(0);
 const [loading, setLoading] = useState(true);
 const [stats, setStats] = useState<AppStats | null>(null);
 const [analytics, setAnalytics] = useState<Analytics | null>(null);
 const [contacts, setContacts] = useState<ContactSubmission[]>([]);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity:'success' |'error' }>({ open: false, message:'', severity:'success' });
 const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; id: number | null }>({ el: null, id: null });

 const fetchAll = useCallback(async () => {
 setLoading(true);
 try {
 const [statsRes, analyticsRes, contactRes] = await Promise.all([
 fetch(\`\${API_BASE}/api/apps/${p.appId}/stats\`).then(r => r.json()).catch(() => null),
 fetch(\`\${API_BASE}/api/analytics/app/${p.appId}\`).then(r => r.json()).catch(() => null),
 fetch(\`\${API_BASE}/api/contact?app_id=${p.appId}\`).then(r => r.json()).catch(() => ({ data: [] })),
 ]);
 if (statsRes) setStats(statsRes);
 if (analyticsRes) setAnalytics(analyticsRes);
 setContacts(Array.isArray(contactRes?.data) ? contactRes.data : []);
 } catch (e) {
 setSnackbar({ open: true, message:'Failed to load some data', severity:'error' });
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => { fetchAll(); }, [fetchAll]);

 const updateContactStatus = async (id: number, status: string) => {
 try {
 await fetch(\`\${API_BASE}/api/contact/\${id}/status\`, {
 method:'POST', headers: {'Content-Type':'application/json' }, body: JSON.stringify({ status }),
 });
 setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
 setSnackbar({ open: true, message:\`Marked as \${status}\`, severity:'success' });
 } catch { setSnackbar({ open: true, message:'Failed to update status', severity:'error' }); }
 setMenuAnchor({ el: null, id: null });
 };

 const deleteContact = async (id: number) => {
 try {
 await fetch(\`\${API_BASE}/api/contact/\${id}\`, { method:'DELETE' });
 setContacts(prev => prev.filter(c => c.id !== id));
 setSnackbar({ open: true, message:'Submission deleted', severity:'success' });
 } catch { setSnackbar({ open: true, message:'Failed to delete', severity:'error' }); }
 setMenuAnchor({ el: null, id: null });
 };

 const statusColor = (s: string) => s ==='new' ?'error' : s ==='read' ?'info' : s ==='replied' ?'success' :'default';

 const StatCard = ({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) => (
 <Card sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', position:'relative', overflow:'hidden' }}>
 <Box sx={{ position:'absolute', top: 0, left: 0, width: 4, height:'100%', bgcolor: color }} />
 <CardContent sx={{ pl: 3 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
 <Box>
 <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
 <Typography variant="h4" fontWeight={700}>{value}</Typography>
 {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
 </Box>
 <Avatar sx={{ bgcolor: color +'20', color }}>{icon}</Avatar>
 </Box>
 </CardContent>
 </Card>
 );

 if (loading) {
 return (
 <Box sx={{ p: 2 }}>
 <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
 <Grid container spacing={2}>
 {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
 </Grid>
 <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mt: 3 }} />
 </Box>
 );
 }

 const newContacts = contacts.filter(c => c.status ==='new').length;

 return (
 <Box>
 {/* Header */}
 <Paper sx={{
 p: 3, mb: 3, borderRadius: 3,
 background:'linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)',
 color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center',
 }}>
 <Box>
 <Typography variant="h4" fontWeight={700} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Dashboard /> ${p.appName} Admin
 </Typography>
 <Typography variant="body2" sx={{ opacity: 0.85 }}>Analytics & contact form submissions</Typography>
 </Box>
 <Button variant="contained" startIcon={<Refresh />} onClick={fetchAll}
 sx={{ bgcolor:'rgba(255,255,255,0.2)','&:hover': { bgcolor:'rgba(255,255,255,0.3)' } }}>
 Refresh
 </Button>
 </Paper>

 {/* KPI Cards */}
 <Grid container spacing={2} sx={{ mb: 3 }}>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<People />} label="Active Users" value={stats?.active_subscriptions ?? 0} color="${p.primaryColor}" sub={\`\${stats?.total_subscriptions ?? 0} total\`} />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<Visibility />} label="Page Views" value={analytics?.total_page_views ?? 0} color="#2196f3" sub={\`\${analytics?.unique_visitors ?? 0} unique visitors\`} />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<AttachMoney />} label="Revenue" value={'$' + (stats?.total_revenue ?? 0).toLocaleString()} color="#4caf50" />
 </Grid>
 <Grid item xs={12} sm={6} md={3}>
 <StatCard icon={<Email />} label="Contact Messages" value={contacts.length} color={newContacts > 0 ?'#ff9800' :'#9c27b0'} sub={newContacts > 0 ? \`\${newContacts} new\` :'All read'} />
 </Grid>
 </Grid>

 {/* Tabs */}
 <Paper sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom:'1px solid rgba(0,0,0,0.06)', px: 2 }}>
 <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
 <Tab icon={<Email />} label={\`Contact (\${contacts.length})\`} iconPosition="start" />
 </Tabs>

 <Box sx={{ p: 3 }}>
 {/* Analytics Tab */}
 {tab === 0 && (
 <Box>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Page Performance</Typography>
 {analytics?.page_stats && Object.keys(analytics.page_stats).length > 0 ? (
 <Table size="small">
 <TableHead><TableRow sx={{ bgcolor:'grey.50' }}>
 <TableCell><Typography fontWeight={600}>Page</Typography></TableCell>
 <TableCell align="right"><Typography fontWeight={600}>Views</Typography></TableCell>
 <TableCell align="right"><Typography fontWeight={600}>Share</Typography></TableCell>
 </TableRow></TableHead>
 <TableBody>
 {Object.entries(analytics.page_stats).map(([page, views]) => {
 const total = analytics.total_page_views || 1;
 const pct = Math.round(((views as number) / total) * 100);
 return (
 <TableRow key={page} sx={{'&:nth-of-type(even)': { bgcolor:'grey.50' } }}>
 <TableCell>{page}</TableCell>
 <TableCell align="right"><Typography fontWeight={500}>{(views as number).toLocaleString()}</Typography></TableCell>
 <TableCell align="right">
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap: 1 }}>
 <LinearProgress variant="determinate" value={pct} sx={{ width: 60, height: 6, borderRadius: 3 }} />
 <Typography variant="body2">{pct}%</Typography>
 </Box>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <TrendingUp sx={{ fontSize: 48, color:'text.disabled' }} />
 <Typography color="text.secondary">No analytics data yet</Typography>
 </Box>
 )}
 </Box>
 )}

 {/* Contact Submissions Tab */}
 {tab === 1 && (
 <Box>
 {contacts.length > 0 ? (
 <Table size="small">
 <TableHead><TableRow sx={{ bgcolor:'grey.50' }}>
 <TableCell><Typography fontWeight={600}>Name</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Email</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Subject</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Status</Typography></TableCell>
 <TableCell><Typography fontWeight={600}>Date</Typography></TableCell>
 <TableCell align="center"><Typography fontWeight={600}>Actions</Typography></TableCell>
 </TableRow></TableHead>
 <TableBody>
 {contacts.map(c => (
 <TableRow key={c.id} sx={{'&:nth-of-type(even)': { bgcolor:'grey.50' }, bgcolor: c.status ==='new' ?'rgba(255,152,0,0.04)' : undefined }}>
 <TableCell>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 {c.status ==='new' && <FiberNew sx={{ color:'#ff9800', fontSize: 18 }} />}
 <Typography variant="body2" fontWeight={c.status ==='new' ? 600 : 400}>{c.name}</Typography>
 </Box>
 </TableCell>
 <TableCell><Typography variant="body2">{c.email}</Typography></TableCell>
 <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.subject}</Typography></TableCell>
 <TableCell><Chip size="small" label={c.status} color={statusColor(c.status) as any} /></TableCell>
 <TableCell><Typography variant="body2">{new Date(c.created_at).toLocaleDateString()}</Typography></TableCell>
 <TableCell align="center">
 <IconButton size="small" onClick={e => setMenuAnchor({ el: e.currentTarget, id: c.id })}><MoreVert /></IconButton>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 ) : (
 <Box sx={{ textAlign:'center', py: 4 }}>
 <Inbox sx={{ fontSize: 48, color:'text.disabled' }} />
 <Typography color="text.secondary">No contact submissions yet</Typography>
 <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Messages from your contact form will appear here</Typography>
 </Box>
 )}

 {/* Status action menu */}
 <Menu anchorEl={menuAnchor.el} open={Boolean(menuAnchor.el)} onClose={() => setMenuAnchor({ el: null, id: null })}>
 <MenuItem onClick={() => menuAnchor.id && updateContactStatus(menuAnchor.id,'read')}><MarkEmailRead sx={{ mr: 1, fontSize: 18 }} /> Mark as Read</MenuItem>
 <MenuItem onClick={() => menuAnchor.id && updateContactStatus(menuAnchor.id,'replied')}><Email sx={{ mr: 1, fontSize: 18 }} /> Mark as Replied</MenuItem>
 <MenuItem onClick={() => menuAnchor.id && updateContactStatus(menuAnchor.id,'archived')}><Inbox sx={{ mr: 1, fontSize: 18 }} /> Archive</MenuItem>
 <MenuItem onClick={() => menuAnchor.id && deleteContact(menuAnchor.id)} sx={{ color:'error.main' }}><Delete sx={{ mr: 1, fontSize: 18 }} /> Delete</MenuItem>
 </Menu>
 </Box>
 )}
 </Box>
 </Paper>

 <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
 <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
 </Snackbar>
 </Box>
 );
}`;
}

// --- Contact Form Page -------------------------------------------------------

export function contactFormTemplate(p: TemplateParams): string {
 const sec = darken(p.primaryColor, 0.15);
 return`import { useState } from'react';
import {
 Box, Typography, Paper, TextField, Button, Snackbar, Alert,
 CircularProgress, Grid,
} from'@mui/material';
import Email from'@mui/icons-material/Email';
import Send from'@mui/icons-material/Send';
import CheckCircle from'@mui/icons-material/CheckCircle';

const API_BASE = window.location.origin.includes('localhost') ?'http://localhost:3000' :'';

export function MembersContactPage() {
 const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
 const [sending, setSending] = useState(false);
 const [sent, setSent] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity:'success' |'error' }>({ open: false, message:'', severity:'success' });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name || !form.email || !form.message) {
 setSnackbar({ open: true, message:'Please fill in all required fields', severity:'error' });
 return;
 }
 setSending(true);
 try {
 const res = await fetch(\`\${API_BASE}/api/contact\`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ ...form, app_id: ${p.appId} }),
 });
 if (!res.ok) throw new Error('Failed');
 setSent(true);
 setForm({ name:'', email:'', subject:'', message:'' });
 setSnackbar({ open: true, message:'Message sent successfully!', severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to send message. Please try again.', severity:'error' });
 } finally {
 setSending(false);
 }
 };

 return (
 <Box sx={{ maxWidth: 700, mx:'auto' }}>
 <Paper sx={{
 p: 3, mb: 3, borderRadius: 3,
 background:'linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)',
 color:'#fff',
 }}>
 <Typography variant="h4" fontWeight={700} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Email /> Contact Us
 </Typography>
 <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Have a question or feedback? We'd love to hear from you.</Typography>
 </Paper>

 {sent ? (
 <Paper sx={{ p: 4, borderRadius: 3, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <CheckCircle sx={{ fontSize: 64, color:'#4caf50', mb: 2 }} />
 <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Message Sent!</Typography>
 <Typography color="text.secondary" sx={{ mb: 3 }}>Thank you for reaching out. We'll get back to you as soon as possible.</Typography>
 <Button variant="contained" onClick={() => setSent(false)}
 sx={{ bgcolor:'${p.primaryColor}','&:hover': { bgcolor:'${sec}' } }}>
 Send Another Message
 </Button>
 </Paper>
 ) : (
 <Paper sx={{ p: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <form onSubmit={handleSubmit}>
 <Grid container spacing={2}>
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
 sx={{ bgcolor:'${p.primaryColor}','&:hover': { bgcolor:'${sec}' }, px: 4 }}>
 {sending ?'Sending...' :'Send Message'}
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

// --- Template registry -------------------------------------------------------

/** Page types that use static templates instead of AI generation */
export const TEMPLATE_PAGE_TYPES = ['profile','settings','admin','contact'] as const;

/** Get the static template for a page type, or null if it requires AI generation */
export function getPageTemplate(pageType: string, params: TemplateParams): string | null {
 switch (pageType) {
 case'profile': return profileTemplate(params);
 case'settings': return settingsTemplate(params);
 case'admin': return adminTemplate(params);
 case'contact': return contactFormTemplate(params);
 default: return null;
 }
}
