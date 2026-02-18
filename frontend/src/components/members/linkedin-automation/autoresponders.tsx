import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  IconButton, 
  Skeleton, 
  Avatar, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Snackbar
} from '@mui/material';
import { 
  AutoFixHigh, 
  TrendingUp, 
  ArrowUpward, 
  ArrowDownward, 
  Add, 
  Edit, 
  Delete, 
  Send, 
  MoreVert, 
  Close 
} from '@mui/icons-material';

interface Autoresponder {
  id: string;
  name: string;
  triggerKeywords: string[];
  responseTemplate: string;
}

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

export function MembersAutorespondersPage() {
  const [autoresponders, setAutoresponders] = useState<Autoresponder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [formState, setFormState] = useState<Autoresponder>({ id: '', name: '', triggerKeywords: [], responseTemplate: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/autoresponders`)
      .then((res) => res.json())
      .then((data: Autoresponder[]) => {
        setAutoresponders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Simulate Save API Call
    setSnackbarOpen(true);
    handleDialogClose();
  };

  return (
    <Box sx={{ width: '100%', padding: 4 }}>
      <Box sx={{ mb: 4, px: 3, py: 2, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
        <Typography variant="h5" gutterBottom color="white" sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoFixHigh sx={{ mr: 1 }} /> Manage Autoresponders
        </Typography>
        <Typography variant="body1" color="white">
          Setup AI-driven responses to handle incoming LinkedIn messages responsively.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1 }} /> Active Autoresponders
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4">10</Typography>
                <ArrowUpward sx={{ color: 'green', ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1 }} /> Total Responses Sent
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4">150</Typography>
                <ArrowDownward sx={{ color: 'red', ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Additional Stat Cards as needed */}
      </Grid>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', background: '#fafbfc' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', background: '#fafbfc' }}>Trigger Keywords</TableCell>
              <TableCell sx={{ fontWeight: 'bold', background: '#fafbfc' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                </TableRow>
              ))
            ) : (
              autoresponders.map((autoresponder) => (
                <TableRow key={autoresponder.id} hover>
                  <TableCell>{autoresponder.name}</TableCell>
                  <TableCell>
                    {autoresponder.triggerKeywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <IconButton sx={{ color: '#1976d2' }} onClick={() => console.log('Edit')}>
                      <Edit />
                    </IconButton>
                    <IconButton sx={{ color: 'red' }} onClick={() => console.log('Delete')}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Button 
        variant="contained" 
        color="primary" 
        sx={{ color: 'white', bgcolor: '#1976d2', '&:hover': { bgcolor: '#155a9d' } }} 
        startIcon={<Add />} 
        onClick={handleDialogOpen}
      >
        Add Autoresponder
      </Button>
      
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Add New Autoresponder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            name="name"
            fullWidth
            variant="outlined"
            value={formState.name}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Trigger Keywords (comma separated)"
            name="triggerKeywords"
            fullWidth
            variant="outlined"
            value={formState.triggerKeywords.join(', ')}
            onChange={(e) => setFormState({ ...formState, triggerKeywords: e.target.value.split(',').map(s => s.trim()) })}
          />
          <TextField
            margin="dense"
            label="Response Template"
            name="responseTemplate"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formState.responseTemplate}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message="Autoresponder saved"
        action={
          <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
}