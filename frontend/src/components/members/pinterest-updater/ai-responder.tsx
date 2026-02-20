import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Badge, Chip, Paper, Tabs, Tab, IconButton, Button, Snackbar, Skeleton } from '@mui/material';
import { WbIncandescent, Settings, Timeline, ArrowUpward, ArrowDownward, Person, Refresh, Edit, CheckCircle, Error, Warning, Message } from '@mui/icons-material';

interface InteractionLog {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

interface SettingsState {
  tone: 'friendly' | 'professional' | 'casual';
  style: 'brief' | 'detailed';
}

export function MembersAiResponderPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>({ tone: 'friendly', style: 'brief' });
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsResponse = await fetch('/api/ai-responder/settings');
        const logsResponse = await fetch('/api/ai-responder/logs');
        
        const settingsData: SettingsState = await settingsResponse.json();
        const logsData: InteractionLog[] = await logsResponse.json();

        setSettings(settingsData);
        setLogs(logsData);
        setLoading(false);
      } catch (e) {
        setError('Failed to load AI Responder settings');
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 4, p: 3, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
        <Typography variant="h4" color="#fff"><Message /> AI Response Configurator</Typography>
        <Typography color="#e0e0e0">Customize how Pinterest Updater will engage with your audience.</Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6"><WbIncandescent /> Tone</Typography>
              {loading ? <Skeleton variant="text" /> : <Chip label={settings.tone} color="primary" icon={<CheckCircle />} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6"><Settings /> Style</Typography>
              {loading ? <Skeleton variant="text" /> : <Chip label={settings.style} color="primary" icon={<CheckCircle />} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ':hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6"><Timeline /> Interactions</Typography>
              {loading ? <Skeleton variant="text" /> : <Typography variant="h5">{logs.length}</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', p: 3 }}>
        <Typography variant="h6"><Timeline /> Recent Interactions</Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : logs.length > 0 ? (
          logs.map(log => (
            <Box key={log.id} sx={{ mb: 2, p: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16 }}>
              <Typography><Person /> User Message</Typography>
              <Typography variant="body2" color="textSecondary">{log.message}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography><Message /> AI Response</Typography>
              <Typography variant="body2" color="textSecondary">{log.response}</Typography>
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Chip
                  label={log.status.toUpperCase()}
                  color={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'warning'}
                  icon={log.status === 'success' ? <CheckCircle /> : log.status === 'error' ? <Error /> : <Warning />}
                />
                <Typography variant="caption" sx={{ ml: 2 }}>{new Date(log.timestamp).toLocaleString()}</Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Message sx={{ fontSize: 64, color: '#e0e0e0' }} />
            <Typography color="textSecondary">No interactions yet! Start engaging your audience with AI-driven responses.</Typography>
            <Button variant="contained" sx={{ mt: 2 }} color="primary" startIcon={<Refresh />}>Refresh Data</Button>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={error}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <Refresh fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}