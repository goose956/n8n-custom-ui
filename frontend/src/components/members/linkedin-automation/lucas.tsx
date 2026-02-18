import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Skeleton,
  Snackbar,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Person,
  TrendingUp,
  Analytics,
  Campaign,
  Message,
  Settings,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Warning,
  Error,
  Star,
  Timeline,
  BarChart,
  Speed,
  ArrowUpward,
  ArrowDownward,
  FilterList,
  Search,
  Dashboard
} from '@mui/icons-material';
import { API } from '../../../config/api';

interface LucasData {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  value: number;
  trend: 'up' | 'down' | 'neutral';
  createdAt: string;
  updatedAt: string;
}

interface LucasStats {
  total: number;
  active: number;
  pending: number;
  growth: number;
}

export function Lucas() {
  const [data, setData] = useState<LucasData[]>([]);
  const [stats, setStats] = useState<LucasStats>({
    total: 0,
    active: 0,
    pending: 0,
    growth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LucasData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API.linkedinScraper}/lucas`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data || []);
      setStats(result.stats || { total: 0, active: 0, pending: 0, growth: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setOpenDialog(true);
  };

  const handleEdit = (item: LucasData) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API.linkedinScraper}/lucas/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete item');
      setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleSave = async (formData: Partial<LucasData>) => {
    try {
      const url = selectedItem 
        ? `${API.linkedinScraper}/lucas/${selectedItem.id}`
        : `${API.linkedinScraper}/lucas`;
      
      const response = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save item');
      
      setSnackbar({ 
        open: true, 
        message: selectedItem ? 'Item updated successfully' : 'Item created successfully', 
        severity: 'success' 
      });
      handleCloseDialog();
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save item', severity: 'error' });
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'pending': return <Warning />;
      case 'inactive': return <Error />;
      default: return <CheckCircle />;
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Error sx={{ fontSize: 64, color: '#e74c3c', mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load Lucas data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<Refresh />}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
            borderRadius: 2
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Dashboard sx={{ fontSize: 32, color: '#1976d2' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              Lucas Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                borderRadius: 2,
                px: 3
              }}
            >
              Add New
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Manage and monitor Lucas automation activities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Total Items
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.8rem' }}>
                  {loading ? <Skeleton width={80} /> : stats.total.toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                <BarChart />
              </Avatar>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Active
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.8rem' }}>
                  {loading ? <Skeleton width={60} /> : stats.active.toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                <CheckCircle />
              </Avatar>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Pending
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.8rem' }}>
                  {loading ? <Skeleton width={60} /> : stats.pending.toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                <Warning />
              </Avatar>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Growth
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: '1.8rem' }}>
                    {loading ? <Skeleton width={60} /> : `${stats.growth}%`}
                  </Typography>
                  {!loading && (
                    <>
                      {stats.growth >= 0 ? (
                        <ArrowUpward sx={{ color: '#4caf50', fontSize: 20 }} />
                      ) : (
                        <ArrowDownward sx={{ color: '#f44336', fontSize: 20 }} />
                      )}
                    </>
                  )}
                </Box>
              </Box>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }}>
                <TrendingUp />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Search sx={{ color: '#999' }} />
          <TextField
            placeholder="Search items..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton>
            <FilterList />
          </IconButton>
        </Box>
      </Paper>

      {/* Data Table/Cards */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 3
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline />
            Items Overview
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Box>
        ) : filteredData.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Analytics sx={{ fontSize: 64, color: '#999', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first item'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                borderRadius: 2
              }}
            >
              Add New Item
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            {filteredData.map((item, index) => (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  mb: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            icon={getStatusIcon(item.status)}
                            label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            color={getStatusColor(item.status) as any}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            Value: {item.value.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Updated: {new Date(item.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(item)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(item.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((item.value / 1000) * 100, 100)}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
                        borderRadius: 3
                      }
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedItem ? <Edit /> : <Add />}
            {selectedItem ? 'Edit Item' : 'Add New Item'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            defaultValue={selectedItem?.name || ''}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Value"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={selectedItem?.value || ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleSave({ name: 'Sample Item', value: 100 })}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
              borderRadius: 2
            }}
          >
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}