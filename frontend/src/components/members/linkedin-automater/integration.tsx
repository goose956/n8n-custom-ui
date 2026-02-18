import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Avatar,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  LinkedIn,
  CheckCircle,
  Warning,
  Error,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Help,
  Settings,
  Info,
  Link,
} from '@mui/icons-material';

interface IntegrationStatus {
  isConnected: boolean;
  lastChecked: Date;
  issues: string[];
}

export function MembersIntegrationPage() {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchIntegrationStatus = async () => {
      const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
      try {
        const response = await fetch(`${API_BASE}/api/linkedin/integration-status`);
        const data: IntegrationStatus = await response.json();
        setIntegrationStatus(data);
      } catch (error) {
        console.error('Error fetching integration status:', error);
        setIntegrationStatus({
          isConnected: false,
          lastChecked: new Date(),
          issues: ['Unable to fetch status - please try again later.'],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrationStatus();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setIntegrationStatus(null);
    fetchIntegrationStatus();
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', py: 4, mb: 3, borderRadius: 16 }}>
        <Typography variant="h4" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LinkedIn /> Integration Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff' }}>
          Manage your LinkedIn connection and troubleshoot any issues with our platform integration.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              borderRadius: 16,
              transition: '0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info /> Integration Status
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : integrationStatus?.isConnected ? (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  <Typography variant="body1">Connected</Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Error color="error" />
                  <Typography variant="body1">Not Connected</Typography>
                </Box>
              )}
            </CardContent>
            <CardContent sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', pt: 2 }}>
              <Button variant="outlined" color="primary" size="small" startIcon={<Refresh />} onClick={handleRefresh}>
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              borderRadius: 16,
              transition: '0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning /> Last Checked
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {integrationStatus?.lastChecked.toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              borderRadius: 16,
              transition: '0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings /> Current Issues
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : integrationStatus?.issues.length ? (
                <Box>
                  {integrationStatus.issues.map((issue, index) => (
                    <Chip
                      key={index}
                      label={issue}
                      color="error"
                      sx={{ mt: 1, mr: 1 }}
                      icon={<Error />}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  No current issues
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
        {loading ? (
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading integration details...
          </Typography>
        ) : (
          !integrationStatus?.isConnected && (
            <Box>
              <Avatar sx={{ bgcolor: '#1a1a2e', mx: 'auto', mb: 2 }}>
                <Help sx={{ fontSize: 48, color: '#fff' }} />
              </Avatar>
              <Typography variant="h6" sx={{ mb: 2 }}>
                You haven't set up your LinkedIn automater integration yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Link />}
              >
                Connect your LinkedIn account
              </Button>
            </Box>
          )
        )}
      </Box>
    </Box>
  );
}