import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, IconButton, Skeleton, Button, Divider, Paper } from '@mui/material';
import { Sync, ArrowUpward, ArrowDownward, CheckCircle, Error, Refresh, Link, Person, Settings } from '@mui/icons-material';

interface Integration {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  syncFrequency: string;
  lastSync: string;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/integrations`)
      .then((response) => response.json())
      .then((data: Integration[]) => {
        setIntegrations(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Sync sx={{ mr: 1 }} /> Managing Integrations
        </Typography>
        <Skeleton variant="rectangular" width="100%" height={200} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Sync sx={{ mr: 1 }} /> Manage Integrations
      </Typography>

      {integrations && integrations.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 5 }}>
          <Link sx={{ fontSize: 64, color: 'grey.400' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>No Integrations Found</Typography>
          <Button variant="contained" sx={{ mt: 2 }}>Add Integration</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {integrations?.map((integration) => (
            <Grid item xs={12} sm={6} md={4} key={integration.id}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: integration.status === 'active' ? 'green' : 'red', mr: 2 }}>{integration.name[0]}</Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        {integration.name} {integration.status === 'active' ? <CheckCircle sx={{ color: 'green', ml: 1 }} /> : <Error sx={{ color: 'red', ml: 1 }} />}
                      </Typography>
                      <Chip label={integration.status === 'active' ? 'Active' : 'Inactive'} sx={{ bgcolor: integration.status === 'active' ? 'green.200' : 'red.200' }} />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2">
                    Sync Frequency: <strong>{integration.syncFrequency}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Last Synced: <strong>{integration.lastSync}</strong>
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="outlined" startIcon={<Settings />}>Configure</Button>
                    <IconButton size="large" color="primary">
                      <Refresh />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}