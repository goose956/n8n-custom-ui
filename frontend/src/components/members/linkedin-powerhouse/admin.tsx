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

const API = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';


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
    fetch(API + '/api/apps/14/stats').then(r => r.json()).catch(() => null),
    fetch(API + '/api/analytics/app/14').then(r => r.json()).catch(() => null),
    fetch(API + '/api/contact?app_id=14').then(r => r.json()).catch(() => []),
    fetch(API + '/api/apps/14/members').then(r => r.json()).catch(() => ({ data: [] })),
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
   await fetch(API + '/api/apps/14/members/' + member.id, {
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
   await fetch(API + '/api/apps/14/members/' + deleteDialog.member.id, { method: 'DELETE' });
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
       <Dashboard />  linkedin powerhouse Admin
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Manage users and track overall performance metrics across your team.</Typography>
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
                '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, #1976d2, #0050ac)' } }} />
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
}