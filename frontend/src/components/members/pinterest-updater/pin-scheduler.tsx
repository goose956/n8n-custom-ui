import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, Chip, Avatar, Badge, LinearProgress, Tooltip, Divider, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Skeleton, Snackbar } from '@mui/material';
import { Schedule, CalendarToday, Add, Edit, Delete, ArrowUpward, ArrowDownward, Close } from '@mui/icons-material';

interface ScheduledPin {
  id: string;
  title: string;
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'cancelled';
}

export function MembersPinSchedulerPage() {
  const [scheduledPins, setScheduledPins] = useState<ScheduledPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinTime, setNewPinTime] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchScheduledPins = useCallback(async () => {
    try {
      const response = await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''}/api/scheduled-pins`);
      const data = await response.json();
      setScheduledPins(data);
    } catch (err) {
      setError('Failed to load scheduled pins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPins();
  }, [fetchScheduledPins]);

  const nextScheduledPin = useMemo(
    () => scheduledPins.find(pin => pin.status === 'scheduled'),
    [scheduledPins]
  );

  const handleAddNewPin = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveNewPin = () => {
    // For simplicity, we're just adding a new pin to the state without a real API call
    const newPin: ScheduledPin = {
      id: `${scheduledPins.length + 1}`,
      title: newPinTitle,
      scheduledTime: newPinTime,
      status: 'scheduled',
    };
    setScheduledPins([...scheduledPins, newPin]);
    setNewPinTitle('');
    setNewPinTime('');
    setOpenDialog(false);
    setSnackbarOpen(true);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ padding: 4 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ marginY: 3 }} />
        <Skeleton variant="text" width="80%" height={80} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ padding: 4, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarToday /> Pin Scheduler
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNewPin} sx={{ borderRadius: 10, background: '#1976d2', '&:hover': { background: '#145a86' } }}>
          Schedule New Pin
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ marginTop: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent sx={{ textAlign: 'center', padding: 4 }}>
              <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <ArrowUpward sx={{ color: '#27ae60' }} /> Scheduled Pins
              </Typography>
              <Typography variant="h3" sx={{ color: '#1976d2' }}>
                {scheduledPins.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent sx={{ textAlign: 'center', padding: 4 }}>
              <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <ArrowUpward sx={{ color: '#27ae60' }} /> Next Scheduled Pin
              </Typography>
              <Typography variant="body1" sx={{ color: '#1976d2' }}>
                {nextScheduledPin ? formatTime(nextScheduledPin.scheduledTime) : 'No upcoming pin'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ marginTop: 4, padding: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        {scheduledPins.length > 0 ? (
          scheduledPins.map(pin => (
            <Box key={pin.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Schedule />
                <Typography variant="body1">{pin.title}</Typography>
                <Chip label={pin.status} color={pin.status === 'scheduled' ? 'info' : pin.status === 'posted' ? 'success' : 'error'} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton color="primary" onClick={() => { /* edit logic */ }}>
                  <Edit />
                </IconButton>
                <IconButton color="secondary" onClick={() => { /* delete logic */ }}>
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', padding: 6 }}>
            <Schedule sx={{ fontSize: 64, color: 'rgba(0,0,0,0.3)' }} />
            <Typography variant="h6" sx={{ margin: 2 }}>No scheduled pins yet!</Typography>
            <Button variant="contained" onClick={handleAddNewPin} sx={{ borderRadius: 10, background: '#1976d2', '&:hover': { background: '#145a86' } }}>
              Create Your First Pin
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Schedule New Pin</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Pin Title"
            fullWidth
            variant="outlined"
            value={newPinTitle}
            onChange={(e) => setNewPinTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Scheduled Time"
            type="datetime-local"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={newPinTime}
            onChange={(e) => setNewPinTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveNewPin} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message="New pin scheduled successfully!"
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        }
      />

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          message={error}
          action={
            <IconButton size="small" color="inherit" onClick={() => setError(null)}>
              <Close fontSize="small" />
            </IconButton>
          }
        />
      )}
    </Box>
  );
}