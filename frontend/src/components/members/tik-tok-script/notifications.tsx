import React, { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemAvatar, ListItemText,
  Avatar, IconButton, Chip, Divider, Tabs, Tab, Badge, Button,
  Switch, FormControlLabel, Snackbar, Alert, Tooltip,
} from '@mui/material';
import Notifications from '@mui/icons-material/Notifications';
import NotificationsActive from '@mui/icons-material/NotificationsActive';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Info from '@mui/icons-material/Info';
import Warning from '@mui/icons-material/Warning';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Delete from '@mui/icons-material/Delete';
import DoneAll from '@mui/icons-material/DoneAll';
import Settings from '@mui/icons-material/Settings';
import Email from '@mui/icons-material/Email';
import Campaign from '@mui/icons-material/Campaign';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'update';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'success', title: 'Script Published!', message: 'Your "Morning Routine" script has been published successfully.', date: '2026-02-15', read: false },
  { id: '2', type: 'info', title: 'New Template Available', message: 'A new trending template "Viral Hook v3" is now available in the library.', date: '2026-02-14', read: false },
  { id: '3', type: 'warning', title: 'Usage Limit', message: 'You have used 80% of your monthly script quota.', date: '2026-02-13', read: false },
  { id: '4', type: 'update', title: 'Team Invite Accepted', message: 'Bob Smith has accepted your collaboration invite.', date: '2026-02-12', read: true },
  { id: '5', type: 'success', title: 'Plan Upgraded', message: 'Your subscription has been upgraded to Pro. Enjoy unlimited scripts!', date: '2026-02-10', read: true },
  { id: '6', type: 'info', title: 'Weekly Report Ready', message: 'Your weekly analytics report is ready to view in the Insights dashboard.', date: '2026-02-09', read: true },
];

const iconMap = {
  success: <CheckCircle sx={{ color: '#4caf50' }} />,
  info: <Info sx={{ color: '#2196f3' }} />,
  warning: <Warning sx={{ color: '#ff9800' }} />,
  update: <TrendingUp sx={{ color: '#9c27b0' }} />,
};

const colorMap = {
  success: '#e8f5e9',
  info: '#e3f2fd',
  warning: '#fff3e0',
  update: '#f3e5f5',
};

export function MembersNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [prefs, setPrefs] = useState({ email: true, push: true, marketing: false });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = tab === 0 ? notifications : tab === 1 ? notifications.filter(n => !n.read) : notifications.filter(n => n.read);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setSnackbar({ open: true, message: 'All notifications marked as read' });
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: '#fff', textAlign: 'center' }}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications sx={{ fontSize: 48, mb: 1 }} />
        </Badge>
        <Typography variant="h4" fontWeight={700}>Notifications</Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Stay up to date with your scripts, team, and account</Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} icon={<Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}><span /></Badge>} iconPosition="end" />
          <Tab label="Read" />
        </Tabs>
        {unreadCount > 0 && (
          <Button size="small" startIcon={<DoneAll />} onClick={markAllRead}>Mark All Read</Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <List disablePadding>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsActive sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No notifications</Typography>
              <Typography variant="body2" color="text.disabled">You're all caught up!</Typography>
            </Box>
          ) : filtered.map((n, i) => (
            <React.Fragment key={n.id}>
              {i > 0 && <Divider />}
              <ListItem
                sx={{ py: 2, bgcolor: n.read ? 'transparent' : colorMap[n.type], cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                onClick={() => toggleRead(n.id)}
                secondaryAction={
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}>
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                }>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent' }}>{iconMap[n.type]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={n.read ? 400 : 600}>{n.title}</Typography>
                    {!n.read && <Chip label="New" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />}
                  </Box>}
                  secondary={<><Typography variant="body2" color="text.secondary">{n.message}</Typography>
                    <Typography variant="caption" color="text.disabled">{n.date}</Typography></>}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Notification Preferences */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings sx={{ color: '#1976d2' }} /> Notification Preferences
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel control={<Switch checked={prefs.email} onChange={e => setPrefs({ ...prefs, email: e.target.checked })} />}
          label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Email sx={{ fontSize: 20 }} /> Email Notifications</Box>} />
        <FormControlLabel control={<Switch checked={prefs.push} onChange={e => setPrefs({ ...prefs, push: e.target.checked })} />}
          label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><NotificationsActive sx={{ fontSize: 20 }} /> Push Notifications</Box>} />
        <FormControlLabel control={<Switch checked={prefs.marketing} onChange={e => setPrefs({ ...prefs, marketing: e.target.checked })} />}
          label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Campaign sx={{ fontSize: 20 }} /> Marketing & Updates</Box>} />
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
