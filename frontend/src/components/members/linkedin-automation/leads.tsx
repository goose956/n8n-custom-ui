import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Skeleton, Snackbar, Badge, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Tooltip
} from '@mui/material';
import {
  People, ArrowUpward, ArrowDownward, Refresh, Edit, Delete, CheckCircle, Warning,
  Analytics, Visibility, MoreVert, AddCircle, NavigateNext, ContactMail, Info,
} from '@mui/icons-material';

import { API } from '../../config/api';
const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

interface Lead {
  leadId: string;
  profileName: string;
  engagementStatus: 'new' | 'contacted' | 'responded';
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  respondedLeads: number;
}

export function MembersLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const fetchLeadsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/leads`);
      const data: Lead[] = await response.json();
      setLeads(data);
      setLeadStats({
        totalLeads: data.length,
        newLeads: data.filter(lead => lead.engagementStatus === 'new').length,
        contactedLeads: data.filter(lead => lead.engagementStatus === 'contacted').length,
        respondedLeads: data.filter(lead => lead.engagementStatus === 'responded').length,
      });
    } catch (e) {
      setError('Failed to load leads data');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

const handleScrapeLeads = useCallback(async () => {
  try {
    setError(null);
    setLoading(true);
    const response = await fetch(`${API.pageAgent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': window.localStorage.getItem('apifyApiKey') || ''
      },
      body: JSON.stringify({
        actorId: 'linkedin-profile-scraper',
        runInput: {}
      })
    });
    const scrapeResult = await response.json();
    if (!response.ok) throw new Error(scrapeResult.error || 'Failed to scrape leads');
    fetchLeadsData();
  } catch (e) {
    setError('Failed to scrape LinkedIn leads');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
}, [fetchLeadsData]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#fafbfc' }}>
      <Box sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16 }}>
        <Typography variant="h5" color="#fff" sx={{ fontWeight: 'bold', mb: 1 }}>
          <People sx={{ mr: 1 }} /> Manage Your LinkedIn Leads
        </Typography>
        <Typography variant="body1" color="#e0e0e0">
          Track and organize your potential connections efficiently.
        </Typography>
      </Box>
<Button variant="contained" sx={{ mt: 2, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} startIcon={<Refresh />} onClick={handleScrapeLeads}>
  Scrape LinkedIn Leads
</Button>

      {loading ? (
        <Grid container spacing={2} alignItems="center">
          {[0, 1, 2, 3].map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 16 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)', borderRadius: 16 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6">{leadStats?.totalLeads || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Leads</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)', borderRadius: 16 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#66bb6a', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6">{leadStats?.newLeads || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">New Leads</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)', borderRadius: 16 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                  <Visibility />
                </Avatar>
                <Box>
                  <Typography variant="h6">{leadStats?.contactedLeads || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Contacted Leads</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)', borderRadius: 16 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                  <ContactMail />
                </Avatar>
                <Box>
                  <Typography variant="h6">{leadStats?.respondedLeads || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Responded Leads</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <Analytics sx={{ mr: 1 }} /> Lead Details
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lead Name</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ height: 150 }}>
                      <Box sx={{ mt: 5, textAlign: 'center' }}>
                        <Info sx={{ fontSize: 64, color: '#ccc' }} />
                        <Typography variant="h6" color="textSecondary">
                          No Leads Found
                        </Typography>
                        <Button variant="contained" color="primary" sx={{ mt: 2 }} startIcon={<AddCircle />}>
                          Add New Lead
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {leads.map((lead) => (
                  <TableRow key={lead.leadId} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell>{lead.profileName}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={lead.engagementStatus}
                        color={
                          lead.engagementStatus === 'responded'
                            ? 'success'
                            : lead.engagementStatus === 'contacted'
                            ? 'warning'
                            : 'default'
                        }
                        icon={lead.engagementStatus === 'responded' ? <CheckCircle /> : <Warning />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton color="primary">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="secondary">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More">
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={error}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}