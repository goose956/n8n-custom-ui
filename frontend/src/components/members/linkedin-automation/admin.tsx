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
import MoreVert from '@mui/icons-material/MoreVert';
import Analytics from '@mui/icons-material/Analytics';
import Error from '@mui/icons-material/Error';
import Delete from '@mui/icons-material/Delete'; 

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

const heroSx = {
  p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative' as const, overflow: 'hidden',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  // Updated to use gradient from design system
  color: '#fff',
};

const cardSx = {
  borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  transition: 'all 0.25s ease',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', borderColor: '#667eea40' },
};

interface AppStats {
  app_id: number; name: string; active_subscriptions: number; total_subscriptions: number; total_revenue: number; created_at: Date;
}
interface AnalyticsData {
  app_id: number; total_page_views: number; unique_visitors: number; page_stats: Record<string, number>; views_by_date: Record<string, number>; recent_views: any[];
}
interface ContactSubmission {
  id: number; app_id?: number; name: string; email: string; message: string; status: 'new' | 'read' | 'replied' | 'archived'; created_at: string;
}
interface AppMember {
  id: number; app_id: number; name: string; email: string; plan_name: string; plan_price: number; status: string; created_at: string; subscription_id?: number;
}

export function MembersAdminPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [members, setMembers] = useState<AppMember[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [, sRes, aRes, cRes, mRes] = await Promise.all([
        fetch(API_BASE + '/api/apps/10/stats')
          .then(r => r.json())
          .then(data => setStats(data))
          .catch(() => setSnackbar({ open: true, message: 'Failed to load app stats.', severity: 'error' })),
        fetch(API_BASE + '/api/analytics/app/10')
          .then(r => r.json())
          .then(data => setAnalytics(data))
          .catch(() => setSnackbar({ open: true, message: 'Failed to load analytics data.', severity: 'error' })),
        fetch(API_BASE + '/api/contact?app_id=10')
          .then(r => r.json())
          .then(data => setContacts(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []))
          .catch(() => setSnackbar({ open: true, message: 'Failed to load contact submissions.', severity: 'error' })),
        fetch(API_BASE + '/api/apps/10/members')
          .then(r => r.json())
          .then(data => setMembers(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
          .catch(() => setSnackbar({ open: true, message: 'Failed to load app members.', severity: 'error' })),
      ]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(API_BASE + '/api/contact/' + id + '/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
      });
      setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
      setSnackbar({ open: true, message: 'Marked as ' + status, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const deleteContact = async (id: number) => {
    try {
      await fetch(API_BASE + '/api/contact/' + id, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
      setSnackbar({ open: true, message: 'Submission deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  if (loading) return <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4, mt: 4 }} />;

  return (
    <Box>
      <Paper sx={heroSx}>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Admin Dashboard</Typography>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchAll}>Refresh</Button>
        </Box>
      </Paper>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={`Contacts (${contacts.length})`} />
      </Tabs>

      {tab === 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map(contact => (
              <TableRow key={contact.id}>
                <TableCell>{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.message}</TableCell>
                <TableCell>{contact.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => updateStatus(contact.id, 'read')}><Email /></IconButton>
                  <IconButton onClick={() => deleteContact(contact.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}