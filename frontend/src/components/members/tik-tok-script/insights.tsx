import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, IconButton, Chip, Table, TableBody, TableCell, TableHead, TableRow, Paper, Skeleton, LinearProgress, Badge, Tooltip, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import BarChart from '@mui/icons-material/BarChart';
import Visibility from '@mui/icons-material/Visibility';
import Timeline from '@mui/icons-material/Timeline';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import Info from '@mui/icons-material/Info';
import CheckCircle from '@mui/icons-material/CheckCircle';

export interface ScriptStats {
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

const mockScriptStats: ScriptStats[] = [
  { title: 'Best Morning Routine', views: 1200, likes: 300, comments: 45, shares: 67 },
  { title: 'Cooking Hack', views: 900, likes: 150, comments: 20, shares: 33 },
];

export function MembersInsightsPage() {
  const [scriptData, setScriptData] = useState<ScriptStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Simulating API call for demo; in a real app, replace with fetch() call
    setTimeout(() => {
      setScriptData(mockScriptStats);
      setLoading(false);
    }, 2000);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setOpenSnackbar(true);
    setTimeout(() => {
      setScriptData(mockScriptStats);
      setLoading(false);
    }, 2000);
  };

  return (
    <Box>
      <Box
        sx={{
          pt: 3,
          pb: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          <BarChart sx={{ mr: 1 }} />
          Insights Dashboard
        </Typography>
        <Typography variant="subtitle1">
          Discover the performance of your TikTok scripts and uncover new trends.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mt: -5, px: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
            <CardContent>
              <Typography variant="h5">
                <Visibility sx={{ mr: 1 }} />
                Total Views
              </Typography>
              <Typography variant="h4" sx={{ color: '#27ae60' }}>
                {loading ? <Skeleton width={70} height={40} /> : '2,100'}
                <ArrowUpward sx={{ fontSize: 20, ml: 1, color: '#27ae60' }} />
              </Typography>
              <LinearProgress variant="determinate" value={65} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
            <CardContent>
              <Typography variant="h5">
                <TrendingUp sx={{ mr: 1 }} />
                Likes
              </Typography>
              <Typography variant="h4" sx={{ color: '#e74c3c' }}>
                {loading ? <Skeleton width={70} height={40} /> : '1,200'}
                <ArrowDownward sx={{ fontSize: 20, ml: 1, color: '#e74c3c' }} />
              </Typography>
              <LinearProgress variant="determinate" value={45} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
            <CardContent>
              <Typography variant="h5">
                <Timeline sx={{ mr: 1 }} />
                Total Comments
              </Typography>
              <Typography variant="h4" sx={{ color: '#00bcd4' }}>
                {loading ? <Skeleton width={70} height={40} /> : '350'}
                <ArrowUpward sx={{ fontSize: 20, ml: 1, color: '#27ae60' }} />
              </Typography>
              <LinearProgress variant="determinate" value={75} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <Search sx={{ mr: 1 }} />
          Script Performance
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={118} />
        ) : (
          <Paper sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Script Title</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Likes</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Shares</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scriptData && scriptData.length > 0 ? (
                  scriptData.map((script) => (
                    <TableRow key={script.title}>
                      <TableCell>
                        <Badge badgeContent={script.views > 1000 ? 'Hot' : undefined} color="primary">
                          {script.title}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Chip label={script.views} variant="outlined" color="default" />
                      </TableCell>
                      <TableCell>
                        <Chip label={script.likes} variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip label={script.comments} variant="outlined" color="secondary" />
                      </TableCell>
                      <TableCell>
                        <Chip label={script.shares} variant="outlined" color="success" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Refresh Data">
                          <IconButton color="primary" onClick={handleRefresh}>
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="textSecondary">
                        <Info sx={{ fontSize: 64, mb: 1 }} />
                        You haven't created any TikTok script-related content yet.
                      </Typography>
                      <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
                        Create Your First Script
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Create New Script</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To get started with TikTok Script, create your first script by entering key details about your video.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => setDialogOpen(false)} color="primary" variant="contained">
            Get Started
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message="Data refreshed successfully"
        action={
          <Button color="inherit" size="small" onClick={() => setOpenSnackbar(false)}>
            <CheckCircle />
          </Button>
        }
      />
    </Box>
  );
}
