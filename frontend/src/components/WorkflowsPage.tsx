import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [inputData, setInputData] = useState('{}');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3000/api/workflows');
      if (response.data.success) {
        setWorkflows(response.data.workflows || []);
      } else {
        setError(response.data.message || 'Failed to load workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setInputData('{}');
    setOpenDialog(true);
  };

  const handleTriggerWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      setTriggeringId(selectedWorkflow.id);
      let data = {};
      try {
        data = JSON.parse(inputData);
      } catch {
        setError('Invalid JSON data');
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/api/workflows/${selectedWorkflow.id}/trigger`,
        { data }
      );

      if (response.data.success) {
        setError(null);
        alert(`Workflow triggered successfully! Execution ID: ${response.data.executionId}`);
        setOpenDialog(false);
      } else {
        setError(response.data.message || 'Failed to trigger workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setTriggeringId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Workflows
        </Typography>
        <Button variant="contained" color="primary" onClick={loadWorkflows}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {workflows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">No workflows found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Name</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id} hover>
                  <TableCell>{workflow.name}</TableCell>
                  <TableCell align="center">
                    <span style={{ color: workflow.active ? 'green' : 'gray' }}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell align="right">{new Date(workflow.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleTriggerClick(workflow)}
                      disabled={triggeringId === workflow.id || !workflow.active}
                      sx={{ mr: 1 }}
                    >
                      {triggeringId === workflow.id ? 'Triggering...' : 'Trigger'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => window.open(`http://localhost:5678/workflow/${workflow.id}`, '_blank')}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trigger Workflow: {selectedWorkflow?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Input Data (JSON)"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder='{"key": "value"}'
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleTriggerWorkflow} variant="contained" color="success">
            Trigger
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
