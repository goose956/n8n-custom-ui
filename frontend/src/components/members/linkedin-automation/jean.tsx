import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { API } from '../../../config/api';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  linkedinUrl: string;
  status: 'pending' | 'contacted' | 'responded' | 'converted';
  lastContact: string;
  responseRate: number;
  avatar?: string;
  location?: string;
  phone?: string;
  notes: string;
}

interface Stats {
  totalContacts: number;
  activeContacts: number;
  responseRate: number;
  conversions: number;
}

export function Jean() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    activeContacts: 0,
    responseRate: 0,
    conversions: 0
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, statsRes] = await Promise.all([
        fetch(`${API.linkedinScraper}/contacts`),
        fetch(`${API.linkedinScraper}/stats`)
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Mock data for development
      setContacts([
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          company: 'Tech Innovations Inc',
          position: 'Marketing Director',
          linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
          status: 'responded',
          lastContact: '2024-01-15',
          responseRate: 85,
          location: 'San Francisco, CA',
          phone: '+1 (555) 123-4567',
          notes: 'Interested in automation solutions'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'mchen@startup.com',
          company: 'Growth Startup',
          position: 'CEO',
          linkedinUrl: 'https://linkedin.com/in/michaelchen',
          status: 'pending',
          lastContact: '2024-01-10',
          responseRate: 0,
          location: 'New York, NY',
          notes: 'Follow up needed'
        }
      ]);
      setStats({
        totalContacts: 247,
        activeContacts: 89,
        responseRate: 34.2,
        conversions: 12
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact(contact);
    setOpenDialog(true);
  };

  const handleSaveContact = async () => {
    try {
      const response = await fetch(`${API.linkedinScraper}/contacts/${selectedContact?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContact)
      });

      if (response.ok) {
        setContacts(prev => 
          prev.map(c => c.id === selectedContact?.id ? { ...c, ...editingContact } as Contact : c)
        );
        setSnackbar({ open: true, message: 'Contact updated successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update contact', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating contact', severity: 'error' });
    }
    setOpenDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'success';
      case 'responded': return 'info';
      case 'contacted': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <CheckCircleIcon fontSize="small" />;
      case 'responded': return <MessageIcon fontSize="small" />;
      case 'contacted': return <SendIcon fontSize="small" />;
      default: return <ScheduleIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          borderRadius: 3,
          p: 4,
          mb: 3,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Jean's Contact Manager
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Manage your LinkedIn contacts and track engagement
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Total Contacts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                  {loading ? <Skeleton width={60} /> : stats.totalContacts.toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#e3f2fd', color: '#1976d2' }}>
                <PersonIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Active Contacts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                  {loading ? <Skeleton width={60} /> : stats.activeContacts}
                </Typography>
              </Box>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#e8f5e8', color: '#27ae60' }}>
                <TrendingUpIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  <MessageIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Response Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                  {loading ? <Skeleton width={60} /> : `${stats.responseRate}%`}
                </Typography>
              </Box>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#fff3e0', color: '#f39c12' }}>
                <MessageIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  <StarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Conversions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
                  {loading ? <Skeleton width={60} /> : stats.conversions}
                </Typography>
              </Box>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#fce4ec', color: '#e91e63' }}>
                <StarIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Contacts Table */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Contact Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              sx={{ borderRadius: 10 }}
            >
              Add Contact
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contact</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Contact</TableCell>
                <TableCell>Response Rate</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton height={40} /></TableCell>
                    <TableCell><Skeleton height={40} /></TableCell>
                    <TableCell><Skeleton height={40} /></TableCell>
                    <TableCell><Skeleton height={40} /></TableCell>
                    <TableCell><Skeleton height={40} /></TableCell>
                    <TableCell><Skeleton height={40} /></TableCell>
                  </TableRow>
                ))
              ) : (
                contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                      '&:hover': { backgroundColor: 'rgba(25,118,210,0.04)' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#1976d2' }}>
                          {contact.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {contact.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {contact.position}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                        <Typography variant="body2">{contact.company}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(contact.status)}
                        label={contact.status}
                        color={getStatusColor(contact.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(contact.lastContact).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={contact.responseRate}
                          sx={{ width: 60, mr: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {contact.responseRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Contact">
                        <IconButton
                          size="small"
                          onClick={() => handleEditContact(contact)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View LinkedIn Profile">
                        <IconButton
                          size="small"
                          onClick={() => window.open(contact.linkedinUrl, '_blank')}
                        >
                          <LinkedInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Contact Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1, color: '#1976d2' }} />
            Edit Contact
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editingContact.name || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, name: e.target.value }))}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: '#666' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editingContact.email || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, email: e.target.value }))}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: '#666' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={editingContact.company || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, company: e.target.value }))}
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: '#666' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={editingContact.position || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, position: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editingContact.notes || ''}
                onChange={(e) => setEditingContact(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveContact}
            variant="contained"
            sx={{ borderRadius: 10 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}