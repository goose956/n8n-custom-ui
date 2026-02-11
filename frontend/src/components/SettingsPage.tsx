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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

interface IntegrationKeys {
  openai: string;
  openrouter: string;
  make: string;
  zapier: string;
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // API Key form state
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', value: '' });
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  // Integration keys state
  const [integrationKeys, setIntegrationKeys] = useState<IntegrationKeys>({
    openai: '',
    openrouter: '',
    make: '',
    zapier: '',
  });
  const [integrationKeysLoading, setIntegrationKeysLoading] = useState<{ [key: string]: boolean }>({
    openai: false,
    openrouter: false,
    make: false,
    zapier: false,
  });
  const [integrationKeysTestLoading, setIntegrationKeysTestLoading] = useState<{ [key: string]: boolean }>({
    openai: false,
    openrouter: false,
    make: false,
    zapier: false,
  });
  
  // OpenAI specific state
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4');
  const [availableOpenAIModels, setAvailableOpenAIModels] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    loadApiKeys();
    loadIntegrationKeys();
  }, []);

  const loadIntegrationKeys = async () => {
    try {
      const response = await axios.get(API_KEYS_BASE_URL);
      if (response.data.success) {
        const keys = response.data.keys;
        const integrations: IntegrationKeys = {
          openai: '',
          openrouter: '',
          make: '',
          zapier: '',
        };
        
        keys.forEach((key: ApiKey) => {
          if (key.name === 'openai' || key.name === 'openrouter' || key.name === 'make' || key.name === 'zapier') {
            integrations[key.name as keyof IntegrationKeys] = '••••••••'; // Show masked placeholder
          }
        });
        
        setIntegrationKeys(integrations);
      }
    } catch (error) {
      console.error('Failed to load integration keys', error);
    }
  };

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

  const handleSaveIntegrationKey = async (keyName: keyof IntegrationKeys) => {
    const value = integrationKeys[keyName];
    
    if (!value || value === '••••••••') {
      setMessage({ type: 'error', text: 'Please enter a valid API key' });
      return;
    }

    setIntegrationKeysLoading((prev) => ({ ...prev, [keyName]: true }));
    try {
      const response = await axios.post(API_KEYS_BASE_URL, {
        name: keyName,
        value: value,
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: `${keyName.toUpperCase()} API key saved successfully` });
        setIntegrationKeys((prev) => ({ ...prev, [keyName]: '••••••••' }));
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save ${keyName} API key` });
    } finally {
      setIntegrationKeysLoading((prev) => ({ ...prev, [keyName]: false }));
    }
  };

  const handleDeleteIntegrationKey = async (keyName: keyof IntegrationKeys) => {
    if (!window.confirm(`Delete ${keyName.toUpperCase()} API key?`)) return;

    try {
      const response = await axios.delete(`${API_KEYS_BASE_URL}/${keyName}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: `${keyName.toUpperCase()} API key deleted` });
        setIntegrationKeys((prev) => ({ ...prev, [keyName]: '' }));
        loadIntegrationKeys();
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to delete ${keyName} API key` });
    }
  };

  const handleTestIntegrationKey = async (keyName: keyof IntegrationKeys) => {
    setIntegrationKeysTestLoading((prev) => ({ ...prev, [keyName]: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/test-integration`, {
        service: keyName,
      });
      if (response.data.success) {
        let messageText = `${keyName.toUpperCase()} API key is valid!`;
        
        // Handle OpenAI models
        if (keyName === 'openai' && response.data.models && response.data.models.length > 0) {
          setAvailableOpenAIModels(response.data.models);
          messageText += ` Found ${response.data.models.length} available models.`;
        }
        
        setMessage({ type: 'success', text: messageText });
      } else {
        setMessage({ type: 'error', text: `${keyName.toUpperCase()} test failed: ${response.data.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to test ${keyName} API key` });
    } finally {
      setIntegrationKeysTestLoading((prev) => ({ ...prev, [keyName]: false }));
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
              <Tab label="Integration Keys" />
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

            {/* Tab 2: Integration Keys */}
            {currentTab === 2 && (
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Third-Party Integration Keys
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Store API keys for AI and automation integrations. All keys are encrypted and securely stored.
                </Typography>

                {/* OpenAI API Key */}
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        OpenAI API Key
                      </Typography>
                      {integrationKeys.openai && integrationKeys.openai !== '' && (
                        <Typography variant="caption" sx={{ color: 'success.main' }}>
                          ✓ Configured
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      placeholder="sk-..."
                      value={integrationKeys.openai}
                      onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, openai: e.target.value }))}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSaveIntegrationKey('openai')}
                        disabled={integrationKeysLoading.openai || !integrationKeys.openai}
                        size="small"
                      >
                        {integrationKeysLoading.openai ? 'Saving...' : 'Save'}
                      </Button>
                      {integrationKeys.openai === '••••••••' && (
                        <>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => handleTestIntegrationKey('openai')}
                            disabled={integrationKeysTestLoading.openai}
                            size="small"
                          >
                            {integrationKeysTestLoading.openai ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteIntegrationKey('openai')}
                            size="small"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                    
                    {integrationKeys.openai === '••••••••' && (availableOpenAIModels.length > 0 || true) && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Model</InputLabel>
                        <Select
                          value={openaiModel}
                          onChange={(e) => setOpenaiModel(e.target.value)}
                          label="Model"
                        >
                          {availableOpenAIModels.length > 0 ? (
                            availableOpenAIModels.map((model) => (
                              <MenuItem key={model} value={model}>
                                {model}
                              </MenuItem>
                            ))
                          ) : (
                            <>
                              <MenuItem value="gpt-4">gpt-4</MenuItem>
                              <MenuItem value="gpt-4-turbo">gpt-4-turbo</MenuItem>
                              <MenuItem value="gpt-4-turbo-preview">gpt-4-turbo-preview</MenuItem>
                              <MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
                            </>
                          )}
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                </Paper>

                {/* OpenRouter API Key */}
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        OpenRouter API Key
                      </Typography>
                      {integrationKeys.openrouter && integrationKeys.openrouter !== '' && (
                        <Typography variant="caption" sx={{ color: 'success.main' }}>
                          ✓ Configured
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      placeholder="sk-or-..."
                      value={integrationKeys.openrouter}
                      onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, openrouter: e.target.value }))}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSaveIntegrationKey('openrouter')}
                        disabled={integrationKeysLoading.openrouter || !integrationKeys.openrouter}
                        size="small"
                      >
                        {integrationKeysLoading.openrouter ? 'Saving...' : 'Save'}
                      </Button>
                      {integrationKeys.openrouter === '••••••••' && (
                        <>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => handleTestIntegrationKey('openrouter')}
                            disabled={integrationKeysTestLoading.openrouter}
                            size="small"
                          >
                            {integrationKeysTestLoading.openrouter ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteIntegrationKey('openrouter')}
                            size="small"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  </Stack>
                </Paper>

                {/* Make.com API Key */}
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Make.com API Key
                      </Typography>
                      {integrationKeys.make && integrationKeys.make !== '' && (
                        <Typography variant="caption" sx={{ color: 'success.main' }}>
                          ✓ Configured
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      placeholder="Your Make.com API key"
                      value={integrationKeys.make}
                      onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, make: e.target.value }))}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSaveIntegrationKey('make')}
                        disabled={integrationKeysLoading.make || !integrationKeys.make}
                        size="small"
                      >
                        {integrationKeysLoading.make ? 'Saving...' : 'Save'}
                      </Button>
                      {integrationKeys.make === '••••••••' && (
                        <>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => handleTestIntegrationKey('make')}
                            disabled={integrationKeysTestLoading.make}
                            size="small"
                          >
                            {integrationKeysTestLoading.make ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteIntegrationKey('make')}
                            size="small"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  </Stack>
                </Paper>

                {/* Zapier API Key */}
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Zapier API Key
                      </Typography>
                      {integrationKeys.zapier && integrationKeys.zapier !== '' && (
                        <Typography variant="caption" sx={{ color: 'success.main' }}>
                          ✓ Configured
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      placeholder="Your Zapier API key"
                      value={integrationKeys.zapier}
                      onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, zapier: e.target.value }))}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSaveIntegrationKey('zapier')}
                        disabled={integrationKeysLoading.zapier || !integrationKeys.zapier}
                        size="small"
                      >
                        {integrationKeysLoading.zapier ? 'Saving...' : 'Save'}
                      </Button>
                      {integrationKeys.zapier === '••••••••' && (
                        <>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => handleTestIntegrationKey('zapier')}
                            disabled={integrationKeysTestLoading.zapier}
                            size="small"
                          >
                            {integrationKeysTestLoading.zapier ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteIntegrationKey('zapier')}
                            size="small"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
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


      </Box>
    </Container>
  );
}

export default SettingsPage;
