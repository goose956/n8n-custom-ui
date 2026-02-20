import { useState, useEffect } from'react';
import { API } from'../config/api';
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
 Chip,
 IconButton,
 Tooltip,
 Avatar,
} from'@mui/material';
import LinkIcon from'@mui/icons-material/Link';
import VpnKeyIcon from'@mui/icons-material/VpnKey';
import ExtensionIcon from'@mui/icons-material/Extension';
import CheckCircleIcon from'@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from'@mui/icons-material/DeleteOutline';
import AddIcon from'@mui/icons-material/Add';
import SecurityIcon from'@mui/icons-material/Security';
import PaymentIcon from'@mui/icons-material/Payment';
import axios from'axios';
import { StripePage } from'./StripePage';

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
 claude: string;
 brave: string;
 make: string;
 zapier: string;
 apify: string;
 stripe: string;
}

const SETTINGS_API = API.settings;
const API_KEYS_API = API.apiKeys;

function SettingsPage() {
 const [currentTab, setCurrentTab] = useState(0);
 const [settings, setSettings] = useState<Settings>({
 n8nUrl:'',
 n8nApiKey:'',
 });
 const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState<{ type:'success' |'error'; text: string } | null>(null);
 const [testLoading, setTestLoading] = useState(false);
 
 // API Key form state
 const [apiKeyDialog, setApiKeyDialog] = useState(false);
 const [apiKeyForm, setApiKeyForm] = useState({ name:'', value:'' });
 const [apiKeyLoading, setApiKeyLoading] = useState(false);

 // Integration keys state
 const [integrationKeys, setIntegrationKeys] = useState<IntegrationKeys>({
 openai:'',
 openrouter:'',
 claude:'',
 brave:'',
 make:'',
 zapier:'',
 apify:'',
 stripe:'',
 });
 const [integrationKeysLoading, setIntegrationKeysLoading] = useState<{ [key: string]: boolean }>({
 openai: false,
 openrouter: false,
 claude: false,
 brave: false,
 make: false,
 zapier: false,
 apify: false,
 stripe: false,
 });
 const [integrationKeysTestLoading, setIntegrationKeysTestLoading] = useState<{ [key: string]: boolean }>({
 openai: false,
 openrouter: false,
 claude: false,
 brave: false,
 make: false,
 zapier: false,
 apify: false,
 stripe: false,
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
 const response = await axios.get(API_KEYS_API);
 if (response.data.success) {
 const keys = response.data.keys;
 const integrations: IntegrationKeys = {
 openai:'',
 openrouter:'',
 claude:'',
 brave:'',
 make:'',
 zapier:'',
 apify:'',
 stripe:'',
 };
 
 keys.forEach((key: ApiKey) => {
 if (key.name ==='openai' || key.name ==='openrouter' || key.name ==='claude' || key.name ==='brave' || key.name ==='make' || key.name ==='zapier' || key.name ==='apify' || key.name ==='stripe') {
 integrations[key.name as keyof IntegrationKeys] ='--------'; // Show masked placeholder
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
 const response = await axios.get(`${SETTINGS_API}/load`);
 if (response.data) {
 setSettings((prev) => ({
 ...prev,
 n8nUrl: response.data.n8nUrl ||'',
 }));
 }
 } catch (error) {
 console.error('Failed to load settings', error);
 }
 };

 const loadApiKeys = async () => {
 try {
 const response = await axios.get(API_KEYS_API);
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
 setMessage({ type:'error', text:'Please fill in all fields' });
 return;
 }

 setLoading(true);
 try {
 const response = await axios.post(`${SETTINGS_API}/save`, settings);
 if (response.data.success) {
 setMessage({ type:'success', text: response.data.message });
 setSettings((prev) => ({
 ...prev,
 n8nApiKey:'', // Clear the API key from UI
 }));
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:'Failed to save settings' });
 } finally {
 setLoading(false);
 }
 };

 const handleTestConnection = async () => {
 setTestLoading(true);
 try {
 const response = await axios.get(`${SETTINGS_API}/test-connection`);
 if (response.data.success) {
 setMessage({ type:'success', text: response.data.message });
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:'Failed to test connection' });
 } finally {
 setTestLoading(false);
 }
 };

 const handleSaveApiKey = async () => {
 if (!apiKeyForm.name || !apiKeyForm.value) {
 setMessage({ type:'error', text:'Please fill in all API key fields' });
 return;
 }

 setApiKeyLoading(true);
 try {
 const response = await axios.post(API_KEYS_API, {
 name: apiKeyForm.name,
 value: apiKeyForm.value,
 });
 if (response.data.success) {
 setMessage({ type:'success', text: response.data.message });
 setApiKeyForm({ name:'', value:'' });
 setApiKeyDialog(false);
 loadApiKeys();
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:'Failed to save API key' });
 } finally {
 setApiKeyLoading(false);
 }
 };

 const handleDeleteApiKey = async (name: string) => {
 if (!window.confirm(`Delete API key "${name}"?`)) return;

 try {
 const response = await axios.delete(`${API_KEYS_API}/${name}`);
 if (response.data.success) {
 setMessage({ type:'success', text: response.data.message });
 loadApiKeys();
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:'Failed to delete API key' });
 }
 };

 const handleSaveIntegrationKey = async (keyName: keyof IntegrationKeys) => {
 const value = integrationKeys[keyName];
 
 if (!value || value ==='--------' || value.startsWith('--------')) {
 setMessage({ type:'error', text:'Please enter a valid API key (clear the field first if updating)' });
 return;
 }

 setIntegrationKeysLoading((prev) => ({ ...prev, [keyName]: true }));
 try {
 const response = await axios.post(API_KEYS_API, {
 name: keyName,
 value: value,
 });
 if (response.data.success) {
 setMessage({ type:'success', text:`${keyName.toUpperCase()} API key saved successfully` });
 setIntegrationKeys((prev) => ({ ...prev, [keyName]:'--------' }));
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:`Failed to save ${keyName} API key` });
 } finally {
 setIntegrationKeysLoading((prev) => ({ ...prev, [keyName]: false }));
 }
 };

 const handleDeleteIntegrationKey = async (keyName: keyof IntegrationKeys) => {
 if (!window.confirm(`Delete ${keyName.toUpperCase()} API key?`)) return;

 try {
 const response = await axios.delete(`${API_KEYS_API}/${keyName}`);
 if (response.data.success) {
 setMessage({ type:'success', text:`${keyName.toUpperCase()} API key deleted` });
 setIntegrationKeys((prev) => ({ ...prev, [keyName]:'' }));
 loadIntegrationKeys();
 } else {
 setMessage({ type:'error', text: response.data.message });
 }
 } catch (error) {
 setMessage({ type:'error', text:`Failed to delete ${keyName} API key` });
 }
 };

 const handleTestIntegrationKey = async (keyName: keyof IntegrationKeys) => {
 setIntegrationKeysTestLoading((prev) => ({ ...prev, [keyName]: true }));
 try {
 const response = await axios.post(`${SETTINGS_API}/test-integration`, {
 service: keyName,
 });
 if (response.data.success) {
 let messageText =`${keyName.toUpperCase()} API key is valid!`;
 
 // Handle OpenAI models
 if (keyName ==='openai' && response.data.models && response.data.models.length > 0) {
 setAvailableOpenAIModels(response.data.models);
 messageText +=` Found ${response.data.models.length} available models.`;
 }
 
 setMessage({ type:'success', text: messageText });
 } else {
 setMessage({ type:'error', text:`${keyName.toUpperCase()} test failed: ${response.data.message}` });
 }
 } catch (error) {
 setMessage({ type:'error', text:`Failed to test ${keyName} API key` });
 } finally {
 setIntegrationKeysTestLoading((prev) => ({ ...prev, [keyName]: false }));
 }
 };



 return (
 <Container maxWidth="lg" sx={{ py: 5 }}>
 {/* Page Header */}
 <Box sx={{ mb: 5 }}>
 <Typography variant="h4" sx={{ color:'#1a1a2e', mb: 0.5 }}>
 Settings
 </Typography>
 <Typography variant="body1" sx={{ color:'#888', lineHeight: 1.7 }}>
 Configure your n8n connection, manage API keys, and set up third-party integrations. Connect Stripe for payments, set up Brave Search and Claude API keys, and customise how Surface works for you.
 </Typography>
 </Box>

 {message && (
 <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
 {message.text}
 </Alert>
 )}

 {/* Tabs Navigation */}
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', mb: 3, overflow:'hidden' }}>
 <Tabs
 value={currentTab}
 onChange={(_, newValue) => setCurrentTab(newValue)}
 sx={{
 px: 2,
'& .MuiTab-root': { fontWeight: 600, fontSize:'0.875rem', textTransform:'none', minHeight: 52, color:'#888' },
'& .Mui-selected': { color:'#667eea !important' },
'& .MuiTabs-indicator': { background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: 3, borderRadius:'3px 3px 0 0' },
 }}
 >
 <Tab icon={<LinkIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="n8n Connection" />
 <Tab icon={<VpnKeyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Global API Keys" />
 <Tab icon={<ExtensionIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Integration Keys" />
 <Tab icon={<PaymentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Stripe" />
 </Tabs>
 </Paper>

 {/* Tab 1: n8n Settings */}
 {currentTab === 0 && (
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', p: 4 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, mb: 3 }}>
 <Avatar sx={{ width: 40, height: 40, bgcolor:'#eef0ff', color:'#667eea' }}>
 <LinkIcon sx={{ fontSize: 20 }} />
 </Avatar>
 <Box>
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'1.1rem' }}>
 n8n Connection Settings
 </Typography>
 <Typography variant="body2" sx={{ color:'#999' }}>
 Connect to your n8n instance to manage workflows
 </Typography>
 </Box>
 </Box>

 <Stack spacing={3}>
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

 <Box sx={{ display:'flex', gap: 2 }}>
 <Button
 variant="contained"
 onClick={handleSaveSettings}
 disabled={loading}
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 px: 4,
 }}
 >
 {loading ?'Saving...' :'Save Settings'}
 </Button>
 <Button
 variant="outlined"
 onClick={handleTestConnection}
 disabled={testLoading}
 sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea', bgcolor:'#f8f8ff' }, px: 4 }}
 >
 {testLoading ?'Testing...' :'Test Connection'}
 </Button>
 </Box>

 <Box sx={{ display:'flex', alignItems:'center', gap: 1, pt: 1 }}>
 <SecurityIcon sx={{ fontSize: 16, color:'#aaa' }} />
 <Typography variant="caption" sx={{ color:'#aaa' }}>
 Your API key is encrypted and never exposed. It's securely stored on the backend.
 </Typography>
 </Box>
 </Stack>
 </Paper>
 )}

 {/* Tab 2: API Keys */}
 {currentTab === 1 && (
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', p: 4 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb: 3 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <Avatar sx={{ width: 40, height: 40, bgcolor:'#eef0ff', color:'#667eea' }}>
 <VpnKeyIcon sx={{ fontSize: 20 }} />
 </Avatar>
 <Box>
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'1.1rem' }}>
 Global API Keys
 </Typography>
 <Typography variant="body2" sx={{ color:'#999' }}>
 Store API keys that can be used across your workflows. All keys are encrypted.
 </Typography>
 </Box>
 </Box>
 <Button
 variant="contained"
 startIcon={<AddIcon />}
 onClick={() => setApiKeyDialog(true)}
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 Add Key
 </Button>
 </Box>

 {apiKeys.length === 0 ? (
 <Box sx={{ p: 5, textAlign:'center', border:'2px dashed #e0e0e0', borderRadius: 3 }}>
 <VpnKeyIcon sx={{ fontSize: 48, color:'#ddd', mb: 1.5 }} />
 <Typography variant="body1" sx={{ color:'#999', mb: 0.5 }}>No API keys saved yet</Typography>
 <Typography variant="body2" sx={{ color:'#bbb' }}>Click "Add Key" to get started</Typography>
 </Box>
 ) : (
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }}>
 <TableContainer>
 <Table>
 <TableHead>
 <TableRow>
 <TableCell>Name</TableCell>
 <TableCell align="right">Created</TableCell>
 <TableCell align="center">Actions</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {apiKeys.map((key) => (
 <TableRow key={key.name} sx={{'&:hover': { bgcolor:'#fafbfc' } }}>
 <TableCell>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <VpnKeyIcon sx={{ fontSize: 16, color:'#667eea' }} />
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{key.name}</Typography>
 </Box>
 </TableCell>
 <TableCell align="right">
 <Typography variant="body2" sx={{ color:'#aaa' }}>
 {new Date(key.createdAt).toLocaleDateString()}
 </Typography>
 </TableCell>
 <TableCell align="center">
 <Tooltip title="Delete">
 <IconButton size="small" onClick={() => handleDeleteApiKey(key.name)} sx={{ color:'#e74c3c','&:hover': { bgcolor:'#fef0ef' } }}>
 <DeleteOutlineIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Paper>
 )}
 </Paper>
 )}

 {/* Tab 3: Integration Keys */}
 {currentTab === 2 && (
 <Stack spacing={3}>
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', p: 4 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, mb: 3 }}>
 <Avatar sx={{ width: 40, height: 40, bgcolor:'#eef0ff', color:'#667eea' }}>
 <ExtensionIcon sx={{ fontSize: 20 }} />
 </Avatar>
 <Box>
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'1.1rem' }}>
 Third-Party Integrations
 </Typography>
 <Typography variant="body2" sx={{ color:'#999' }}>
 Store API keys for AI and automation services. All keys are encrypted.
 </Typography>
 </Box>
 </Box>

 <Stack spacing={2.5}>
 {/* OpenAI */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>OpenAI</Typography>
 {integrationKeys.openai && integrationKeys.openai !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="sk-..." value={integrationKeys.openai} onFocus={() => { if (integrationKeys.openai === '--------') setIntegrationKeys((prev) => ({ ...prev, openai: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, openai: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('openai')} disabled={integrationKeysLoading.openai || !integrationKeys.openai} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.openai ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.openai ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('openai')} disabled={integrationKeysTestLoading.openai} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.openai ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('openai')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 {integrationKeys.openai ==='--------' && (
 <FormControl fullWidth size="small">
 <InputLabel>Model</InputLabel>
 <Select value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} label="Model">
 {availableOpenAIModels.length > 0 ? (
 availableOpenAIModels.map((model) => (<MenuItem key={model} value={model}>{model}</MenuItem>))
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

 {/* OpenRouter */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>OpenRouter</Typography>
 {integrationKeys.openrouter && integrationKeys.openrouter !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="sk-or-..." value={integrationKeys.openrouter} onFocus={() => { if (integrationKeys.openrouter === '--------') setIntegrationKeys((prev) => ({ ...prev, openrouter: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, openrouter: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('openrouter')} disabled={integrationKeysLoading.openrouter || !integrationKeys.openrouter} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.openrouter ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.openrouter ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('openrouter')} disabled={integrationKeysTestLoading.openrouter} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.openrouter ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('openrouter')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Claude (Anthropic) */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Claude (Anthropic)</Typography>
 {integrationKeys.claude && integrationKeys.claude !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="sk-ant-..." value={integrationKeys.claude} onFocus={() => { if (integrationKeys.claude === '--------') setIntegrationKeys((prev) => ({ ...prev, claude: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, claude: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('claude')} disabled={integrationKeysLoading.claude || !integrationKeys.claude} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.claude ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.claude ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('claude')} disabled={integrationKeysTestLoading.claude} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.claude ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('claude')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Brave Search */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Brave Search</Typography>
 {integrationKeys.brave && integrationKeys.brave !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="BSA..." value={integrationKeys.brave} onFocus={() => { if (integrationKeys.brave === '--------') setIntegrationKeys((prev) => ({ ...prev, brave: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, brave: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('brave')} disabled={integrationKeysLoading.brave || !integrationKeys.brave} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.brave ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.brave ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('brave')} disabled={integrationKeysTestLoading.brave} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.brave ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('brave')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Make.com */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Make.com</Typography>
 {integrationKeys.make && integrationKeys.make !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="Your Make.com API key" value={integrationKeys.make} onFocus={() => { if (integrationKeys.make === '--------') setIntegrationKeys((prev) => ({ ...prev, make: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, make: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('make')} disabled={integrationKeysLoading.make || !integrationKeys.make} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.make ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.make ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('make')} disabled={integrationKeysTestLoading.make} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.make ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('make')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Apify */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Apify</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>Web scraping, data extraction & automation platform</Typography>
 </Box>
 {integrationKeys.apify && integrationKeys.apify !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Token" type="password" placeholder="apify_api_..." value={integrationKeys.apify} onFocus={() => { if (integrationKeys.apify === '--------') setIntegrationKeys((prev) => ({ ...prev, apify: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, apify: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('apify')} disabled={integrationKeysLoading.apify || !integrationKeys.apify} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.apify ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.apify ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('apify')} disabled={integrationKeysTestLoading.apify} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.apify ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('apify')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Zapier */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Zapier</Typography>
 {integrationKeys.zapier && integrationKeys.zapier !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="API Key" type="password" placeholder="Your Zapier API key" value={integrationKeys.zapier} onFocus={() => { if (integrationKeys.zapier === '--------') setIntegrationKeys((prev) => ({ ...prev, zapier: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, zapier: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('zapier')} disabled={integrationKeysLoading.zapier || !integrationKeys.zapier} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.zapier ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.zapier ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('zapier')} disabled={integrationKeysTestLoading.zapier} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.zapier ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('zapier')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>

 {/* Stripe */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)','&:hover': { borderColor:'rgba(102,126,234,0.2)' }, transition:'border-color 0.2s' }}>
 <Stack spacing={2}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Stripe</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>Payment processing for your apps -- accepts cards, subscriptions & more</Typography>
 </Box>
 {integrationKeys.stripe && integrationKeys.stripe !=='' && (
 <Chip icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />} label="Configured" size="small" sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }} />
 )}
 </Box>
 <TextField fullWidth label="Secret Key" type="password" placeholder="sk_live_... or sk_test_..." value={integrationKeys.stripe} onFocus={() => { if (integrationKeys.stripe === '--------') setIntegrationKeys((prev) => ({ ...prev, stripe: '' })); }} onChange={(e) => setIntegrationKeys((prev) => ({ ...prev, stripe: e.target.value }))} variant="outlined" size="small" />
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button variant="contained" onClick={() => handleSaveIntegrationKey('stripe')} disabled={integrationKeysLoading.stripe || !integrationKeys.stripe} size="small" sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)','&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' } }}>
 {integrationKeysLoading.stripe ?'Saving...' :'Save'}
 </Button>
 {integrationKeys.stripe ==='--------' && (
 <>
 <Button variant="outlined" onClick={() => handleTestIntegrationKey('stripe')} disabled={integrationKeysTestLoading.stripe} size="small" sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea' } }}>
 {integrationKeysTestLoading.stripe ?'Testing...' :'Test'}
 </Button>
 <Button variant="outlined" onClick={() => handleDeleteIntegrationKey('stripe')} size="small" sx={{ borderColor:'#e0e0e0', color:'#e74c3c','&:hover': { borderColor:'#e74c3c', bgcolor:'#fef0ef' } }}>
 Delete
 </Button>
 </>
 )}
 </Box>
 </Stack>
 </Paper>
 </Stack>
 </Paper>
 </Stack>
 )}

 {/* Tab 4: Stripe */}
 {currentTab === 3 && (
 <StripePage />
 )}

 {/* Add API Key Dialog */}
 <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
 <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>Add New API Key</DialogTitle>
 <DialogContent sx={{ pt: 2 }}>
 <Stack spacing={2.5} sx={{ mt: 1 }}>
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
 <DialogActions sx={{ p: 2.5 }}>
 <Button onClick={() => setApiKeyDialog(false)} sx={{ color:'#888' }}>Cancel</Button>
 <Button
 onClick={handleSaveApiKey}
 variant="contained"
 disabled={apiKeyLoading}
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 {apiKeyLoading ?'Saving...' :'Save'}
 </Button>
 </DialogActions>
 </Dialog>
 </Container>
 );
}

export default SettingsPage;
