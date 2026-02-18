import { useEffect, useState, useCallback } from 'react';
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

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

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
    fetch(`${API_BASE}/api/apps/10/stats`).then(r => r.json()).catch(() => null),
    fetch(`${API_BASE}/api/analytics/app/10`).then(r => r.json()).catch(() => null),
    fetch(`${API_BASE}/api/contact_submissions?app_id=10`).then(r => r.json()).catch(() => []),
    fetch(`${API_BASE}/api/apps/10/members`).then(r => r.json()).catch(() => ({ data: [] })),
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
   await fetch(`${API_BASE}/api/contact_submissions/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
   setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
   setSnackbar({ open: true, message: 'Marked as ' + status, severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }); }
  setMenuAnchor({ el: null, id: null });
 };

 const deleteContact = async (id: number) => {
  try {
   await fetch(`${API_BASE}/api/contact_submissions/${id}`, { method: 'DELETE' });
   setContacts(prev => prev.filter(c => c.id !== id));
   setSnackbar({ open: true, message: 'Submission deleted', severity: 'success' });
  } catch { setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }); }
  setMenuAnchor({ el: null, id: null });
 };

 /* ── Member actions ── */
 const toggleMemberStatus = async (member: AppMember) => {
  const newStatus = member.status === 'disabled' ? 'active' : 'disabled';
  try {
   await fetch(`${API_BASE}/api/apps/10/members/${member.id}`, {
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
   await fetch(`${API_BASE}/api/apps/10/members/${deleteDialog.member.id}`, { method: 'DELETE' });
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
       <Dashboard /> Linkedin automater Admin
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Access administrative tools to oversee user activity and campaign performance.</Typography>
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
    <Box sx={{ p: 3 }} hidden={tab !== 2}>
     <Table>
      <TableHead>
       <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Subject</TableCell>
        <TableCell>Message</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Date</TableCell>
        <TableCell align="right">Actions</TableCell>
       </TableRow>
      </TableHead>
      <TableBody>
       {contacts.map((contact) => (
        <TableRow key={contact.id}>
         <TableCell>{contact.name}</TableCell>
         <TableCell>{contact.email}</TableCell>
         <TableCell>{contact.subject || "-"}</TableCell>
         <TableCell>{contact.message}</TableCell>
         <TableCell>
          <Chip label={contact.status} color={chipColor(contact.status)} size="small" />
         </TableCell>
         <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
         <TableCell align="right">
          <IconButton onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: contact.id })}><MoreVert /></IconButton>
          <Menu anchorEl={menuAnchor.el} open={Boolean(menuAnchor.el && menuAnchor.id === contact.id)} onClose={() => setMenuAnchor({ el: null, id: null })}>
           {contact.status !== 'replied' && <MenuItem onClick={() => updateStatus(contact.id, 'replied')}><MarkEmailRead fontSize="small" sx={{ mr: 1 }} /> Mark as Replied</MenuItem>}
           {contact.status !== 'archived' && <MenuItem onClick={() => updateStatus(contact.id, 'archived')}><Inbox fontSize="small" sx={{ mr: 1 }} /> Archive</MenuItem>}
           <MenuItem onClick={() => deleteContact(contact.id)}><Delete fontSize="small" sx={{ mr: 1 }} /> Delete</MenuItem>
          </Menu>
         </TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    </Box>
   </Paper>

   <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
     {snackbar.message}
    </Alert>
   </Snackbar>

   {/* Member management dialogs and menus go here */}

  </Box>
 );
}