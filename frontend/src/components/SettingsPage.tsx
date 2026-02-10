import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Alert,
  Stack,
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import axios from 'axios';

interface Settings {
  n8nUrl: string;
  n8nApiKey: string;
}

interface ApiKey {
  name: string;
  createdAt: string;
  lastUsed?: string;
}

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:3000/api/settings';
const API_KEYS_BASE_URL = 'http://localhost:3000/api/api-keys';

function SettingsPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    n8nUrl: '',
    n8nApiKey: '',
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  
  // API Key form state
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', value: '' });
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  // Workflow trigger dialog state
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowInputData, setWorkflowInputData] = useState('{}');

  useEffect(() => {
    loadSettings();
    loadApiKeys();
  }, []);

  useEffect(() => {
    if (currentTab === 2) {
      loadWorkflows();
    }
  }, [currentTab]);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/load`);
      if (response.data) {
        setSettings((prev) => ({
          ...prev,
          n8nUrl: response.data.n8nUrl || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await axios.get(API_KEYS_BASE_URL);
      if (response.data.success) {
        setApiKeys(response.data.keys);
      }
    } catch (error) {
      console.error('Failed to load API keys', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!settings.n8nUrl || !settings.n8nApiKey) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/save`, settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setSettings((prev) => ({
          ...prev,
          n8nApiKey: '', // Clear the API key from UI
        }));
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/test-connection`);
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyForm.name || !apiKeyForm.value) {
      setMessage({ type: 'error', text: 'Please fill in all API key fields' });
      return;
    }

    setApiKeyLoading(true);
    try {
      const response = await axios.post(API_KEYS_BASE_URL, {
        name: apiKeyForm.name,
        value: apiKeyForm.value,
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setApiKeyForm({ name: '', value: '' });
        setApiKeyDialog(false);
        loadApiKeys();
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async (name: string) => {
    if (!window.confirm(`Delete API key "${name}"?`)) return;

    try {
      const response = await axios.delete(`${API_KEYS_BASE_URL}/${name}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        loadApiKeys();
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    }
  };

  const loadWorkflows = async () => {
    try {
      setWorkflowsLoading(true);
      setMessage(null);
      const response = await axios.get('http://localhost:3000/api/workflows');
      if (response.data.success) {
        setWorkflows(response.data.workflows || []);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to load workflows' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const handleTriggerClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setWorkflowInputData('{}');
    setTriggerDialog(true);
  };

  const handleTriggerWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      setTriggeringId(selectedWorkflow.id);
      let data = {};
      try {
        data = JSON.parse(workflowInputData);
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON data' });
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/api/workflows/${selectedWorkflow.id}/trigger`,
        { data }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: `Workflow triggered! Execution ID: ${response.data.executionId}` });
        setTriggerDialog(false);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to trigger workflow' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
              <Tab label="n8n Connection" />
              <Tab label="Global API Keys" />
              <Tab label="Workflows" />
            </Tabs>
          </Box>

          <Box sx={{ p: 4 }}>
            {message && (
              <Alert severity={message.type} sx={{ marginBottom: 2 }} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            {/* Tab 1: n8n Settings */}
            {currentTab === 0 && (
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  n8n Connection Settings
                </Typography>

                <TextField
                  fullWidth
                  label="n8n Instance URL"
                  name="n8nUrl"
                  value={settings.n8nUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-instance.app.n8n.cloud"
                  variant="outlined"
                  type="url"
                />

                <TextField
                  fullWidth
                  label="n8n API Key"
                  name="n8nApiKey"
                  value={settings.n8nApiKey}
                  onChange={handleInputChange}
                  placeholder="Enter your API key"
                  variant="outlined"
                  type="password"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleSaveSettings}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={handleTestConnection}
                    disabled={testLoading}
                  >
                    {testLoading ? 'Testing...' : 'Test Connection'}
                  </Button>
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', pt: 2 }}>
                  Your API key is encrypted and never exposed. It's securely stored on the backend.
                </Typography>
              </Stack>
            )}

            {/* Tab 2: API Keys */}
            {currentTab === 1 && (
              <>
                <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                  Global API Keys
                </Typography>

                <Typography variant="body2" sx={{ marginBottom: 3, color: 'text.secondary' }}>
                  Store API keys that can be used across your workflows. All keys are encrypted and secure.
                </Typography>

                <Box sx={{ marginBottom: 3 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setApiKeyDialog(true)}
                  >
                    Add New API Key
                  </Button>
                </Box>

                {apiKeys.length === 0 ? (
                  <Typography color="textSecondary" sx={{ py: 2 }}>
                    No API keys saved yet. Click "Add New API Key" to get started.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Created</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {apiKeys.map((key) => (
                          <TableRow key={key.name} hover>
                            <TableCell>{key.name}</TableCell>
                            <TableCell align="right">
                              {new Date(key.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteApiKey(key.name)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* Tab 3: Workflows */}
            {currentTab === 2 && (
              <>
                <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                  Workflows
                </Typography>

                <Box sx={{ marginBottom: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={loadWorkflows}
                    disabled={workflowsLoading}
                  >
                    {workflowsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </Box>

                {workflows.length === 0 ? (
                  <Typography color="textSecondary" sx={{ py: 2 }}>
                    No workflows found. Create one in n8n to see it here.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
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
                            <TableCell align="right">
                              {new Date(workflow.createdAt).toLocaleDateString()}
                            </TableCell>
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
              </>
            )}
          </Box>
        </Paper>

        {/* Add API Key Dialog */}
        <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New API Key</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="API Key Name"
                placeholder="e.g., Stripe API, OpenAI API"
                value={apiKeyForm.name}
                onChange={(e) => setApiKeyForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                fullWidth
                label="API Key Value"
                type="password"
                placeholder="Paste your API key here"
                value={apiKeyForm.value}
                onChange={(e) => setApiKeyForm((prev) => ({ ...prev, value: e.target.value }))}
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveApiKey}
              variant="contained"
              color="primary"
              disabled={apiKeyLoading}
            >
              {apiKeyLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Trigger Workflow Dialog */}
        <Dialog open={triggerDialog} onClose={() => setTriggerDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Trigger Workflow: {selectedWorkflow?.name}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Input Data (JSON)"
              value={workflowInputData}
              onChange={(e) => setWorkflowInputData(e.target.value)}
              placeholder='{"key": "value"}'
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTriggerDialog(false)}>Cancel</Button>
            <Button
              onClick={handleTriggerWorkflow}
              variant="contained"
              color="success"
              disabled={triggeringId === selectedWorkflow?.id}
            >
              Trigger
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default SettingsPage;
