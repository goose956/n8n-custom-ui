import { useState, useEffect } from'react';
import { API } from'../config/api';
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
 Alert,
 Box,
 Typography,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 TextField,
 Stack,
 Chip,
 Avatar,
 Tooltip,
 IconButton,
} from'@mui/material';
import {
 Refresh as RefreshIcon,
 PlayArrow as PlayArrowIcon,
 Edit as EditIcon,
 OpenInNew as OpenInNewIcon,
 CheckCircle as CheckCircleIcon,
 Warning as WarningIcon,
 AccountTree as WorkflowIcon,
} from'@mui/icons-material';
import axios from'axios';
import { nodeSchemas } from'./nodeSchemas';

function getNodeParameterSchema(nodeType: string) {
 const schemas = nodeSchemas as any;
 return schemas[nodeType]?.parameters || [];
}

interface Workflow {
 id: string;
 name: string;
 active: boolean;
 createdAt: string;
 updatedAt: string;
 validation?: {
 isValid: boolean;
 issues: Array<{
 type:'missing_field' |'missing_api_key' |'warning';
 message: string;
 field?: string;
 apiKeyName?: string;
 }>;
 };
}

export function WorkflowsPage() {
 const [workflows, setWorkflows] = useState<Workflow[]>([]);
 const [workflowsLoading, setWorkflowsLoading] = useState(false);
 const [message, setMessage] = useState<{ type:'success' |'error'; text: string } | null>(null);

 // Workflow trigger dialog state
 const [triggerDialog, setTriggerDialog] = useState(false);
 const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
 const [workflowInputData, setWorkflowInputData] = useState('{}');
 const [triggeringId, setTriggeringId] = useState<string | null>(null);

 // Workflow validation dialog state
 const [validationDialog, setValidationDialog] = useState(false);
 const [selectedWorkflowForValidation, setSelectedWorkflowForValidation] = useState<Workflow | null>(null);

 // Workflow edit dialog state
 const [editDialog, setEditDialog] = useState(false);
 const [selectedWorkflowForEdit, setSelectedWorkflowForEdit] = useState<Workflow | null>(null);
 const [workflowEditFields, setWorkflowEditFields] = useState<Record<string, any>>({});
 const [editLoading, setEditLoading] = useState(false);

 useEffect(() => {
 loadWorkflows();
 }, []);

 const loadWorkflows = async () => {
 try {
 setWorkflowsLoading(true);
 setMessage(null);
 const response = await axios.get(`${API.workflows}/validation`);
 if (response.data.success) {
 setWorkflows(response.data.workflows || []);
 } else {
 setMessage({ type:'error', text: response.data.message ||'Failed to load workflows' });
 }
 } catch (err) {
 setMessage({ type:'error', text: err instanceof Error ? err.message :'An error occurred' });
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
 setMessage({ type:'error', text:'Invalid JSON data' });
 return;
 }

 const response = await axios.post(
`${API.workflows}/${selectedWorkflow.id}/trigger`,
 { data }
 );

 if (response.data.success) {
 setMessage({ type:'success', text:`Workflow triggered! Execution ID: ${response.data.executionId}` });
 setTriggerDialog(false);
 } else {
 setMessage({ type:'error', text: response.data.message ||'Failed to trigger workflow' });
 }
 } catch (err) {
 setMessage({ type:'error', text: err instanceof Error ? err.message :'An error occurred' });
 } finally {
 setTriggeringId(null);
 }
 };

 const handleEditWorkflow = async (workflow: Workflow) => {
 let fullWorkflow = workflow;
 try {
 const wfRes = await axios.get(API.workflows);
 if (wfRes.data && wfRes.data.workflows) {
 const found = wfRes.data.workflows.find((w: any) => w.id === workflow.id);
 if (found) fullWorkflow = found;
 }
 } catch {}
 setSelectedWorkflowForEdit(fullWorkflow);
 try {
 const response = await axios.get(`${API.workflows}/config/${workflow.id}`);
 if (response.data.config && response.data.config.fields) {
 const fieldsMap: Record<string, any> = {};
 for (const field of response.data.config.fields) {
 fieldsMap[`${field.nodeId}_${field.fieldName}`] = field.value;
 }
 setWorkflowEditFields(fieldsMap);
 } else {
 setWorkflowEditFields({});
 }
 } catch {
 setWorkflowEditFields({});
 }
 setEditDialog(true);
 };

 const handleSaveWorkflowConfig = async () => {
 if (!selectedWorkflowForEdit) return;

 try {
 setEditLoading(true);
 const fields = Object.entries(workflowEditFields).map(([key, value]) => {
 const underscoreIdx = key.indexOf('_');
 let nodeId = key;
 let fieldName ='';
 if (underscoreIdx !== -1) {
 nodeId = key.substring(0, underscoreIdx);
 fieldName = key.substring(underscoreIdx + 1);
 }
 return {
 nodeId,
 fieldName,
 value,
 nodeType:'HTTPRequest',
 };
 });

 const response = await axios.put(
`${API.workflows}/config/${selectedWorkflowForEdit.id}`,
 {
 workflowName: selectedWorkflowForEdit.name,
 fields,
 }
 );

 if (response.data.success) {
 setMessage({ type:'success', text:'Workflow configuration saved successfully' });
 setEditDialog(false);
 await loadWorkflows();
 const updated = workflows.find(wf => wf.id === selectedWorkflowForEdit.id);
 if (updated) setSelectedWorkflowForEdit(updated);
 } else {
 setMessage({ type:'error', text:'Failed to save workflow configuration' });
 }
 } catch (err) {
 setMessage({ type:'error', text: err instanceof Error ? err.message :'An error occurred' });
 } finally {
 setEditLoading(false);
 }
 };

 return (
 <Container maxWidth="lg" sx={{ py: 5 }}>
 {/* Page Header */}
 <Box sx={{ mb: 5 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb: 1 }}>
 <Box>
 <Typography variant="h4" sx={{ color:'#1a1a2e', mb: 0.5 }}>
 Workflows
 </Typography>
 <Typography variant="body1" sx={{ color:'#888', lineHeight: 1.7 }}>
 View, manage, and trigger your n8n workflows without leaving Surface. Monitor execution status, toggle workflows on and off, and quickly test automations -- all synced live with your n8n instance.
 </Typography>
 </Box>
 <Button
 variant="outlined"
 startIcon={<RefreshIcon />}
 onClick={loadWorkflows}
 disabled={workflowsLoading}
 sx={{ borderColor:'#e0e0e0', color:'#666','&:hover': { borderColor:'#667eea', color:'#667eea', bgcolor:'#f8f8ff' } }}
 >
 {workflowsLoading ?'Loading...' :'Refresh'}
 </Button>
 </Box>
 </Box>

 {message && (
 <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
 {message.text}
 </Alert>
 )}

 {workflows.length === 0 ? (
 <Paper elevation={0} sx={{ p: 6, textAlign:'center', border:'2px dashed #e0e0e0' }}>
 <WorkflowIcon sx={{ fontSize: 56, color:'#ddd', mb: 2 }} />
 <Typography variant="h6" sx={{ color:'#999', mb: 1 }}>
 No workflows found
 </Typography>
 <Typography variant="body2" sx={{ color:'#bbb', mb: 3, maxWidth: 400, mx:'auto' }}>
 Create a workflow in your n8n instance to see it here. Workflows will appear automatically once connected.
 </Typography>
 <Button
 variant="contained"
 onClick={() => window.open('http://localhost:5678','_blank')}
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 Open n8n
 </Button>
 </Paper>
 ) : (
 <Paper elevation={0} sx={{ border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }}>
 <TableContainer>
 <Table>
 <TableHead>
 <TableRow>
 <TableCell>Workflow</TableCell>
 <TableCell align="center">Status</TableCell>
 <TableCell align="center">Validation</TableCell>
 <TableCell align="right">Created</TableCell>
 <TableCell align="center">Actions</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {workflows.map((workflow) => (
 <TableRow
 key={workflow.id}
 sx={{
 transition:'background 0.15s',
'&:hover': { bgcolor:'#fafbfc' },
 }}
 >
 <TableCell>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <Avatar sx={{ width: 34, height: 34, bgcolor:'#eef0ff', color:'#667eea' }}>
 <WorkflowIcon sx={{ fontSize: 18 }} />
 </Avatar>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>
 {workflow.name}
 </Typography>
 </Box>
 </TableCell>
 <TableCell align="center">
 <Chip
 icon={workflow.active ? <CheckCircleIcon sx={{ fontSize:'14px !important' }} /> : undefined}
 label={workflow.active ?'Active' :'Inactive'}
 size="small"
 sx={{
 height: 24,
 fontSize:'0.75rem',
 fontWeight: 600,
 bgcolor: workflow.active ?'#e8f5e9' :'#f5f5f5',
 color: workflow.active ?'#27ae60' :'#999',
'& .MuiChip-icon': { color:'#27ae60' },
 }}
 />
 </TableCell>
 <TableCell align="center">
 {workflow.validation && workflow.validation.isValid ? (
 <Chip
 icon={<CheckCircleIcon sx={{ fontSize:'14px !important' }} />}
 label="OK"
 size="small"
 sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#e8f5e9', color:'#27ae60','& .MuiChip-icon': { color:'#27ae60' } }}
 />
 ) : (
 <Chip
 icon={<WarningIcon sx={{ fontSize:'14px !important' }} />}
 label={`${workflow.validation?.issues.length || 0} Issues`}
 size="small"
 clickable
 onClick={() => {
 setSelectedWorkflowForValidation(workflow);
 setValidationDialog(true);
 }}
 sx={{ height: 24, fontSize:'0.75rem', fontWeight: 600, bgcolor:'#fff8e1', color:'#f39c12','& .MuiChip-icon': { color:'#f39c12' } }}
 />
 )}
 </TableCell>
 <TableCell align="right">
 <Typography variant="body2" sx={{ color:'#aaa' }}>
 {new Date(workflow.createdAt).toLocaleDateString()}
 </Typography>
 </TableCell>
 <TableCell align="center">
 <Stack direction="row" spacing={0.5} justifyContent="center">
 <Tooltip title="Edit Configuration">
 <IconButton size="small" onClick={() => handleEditWorkflow(workflow)} sx={{ color:'#667eea','&:hover': { bgcolor:'#f0f0ff' } }}>
 <EditIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 <Tooltip title="Trigger Workflow">
 <span>
 <IconButton
 size="small"
 onClick={() => handleTriggerClick(workflow)}
 disabled={triggeringId === workflow.id || !workflow.active}
 sx={{ color:'#27ae60','&:hover': { bgcolor:'#e8f5e9' },'&.Mui-disabled': { color:'#ccc' } }}
 >
 <PlayArrowIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </span>
 </Tooltip>
 <Tooltip title="Open in n8n">
 <IconButton
 size="small"
 onClick={() => window.open(`http://localhost:5678/workflow/${workflow.id}`,'_blank')}
 sx={{ color:'#888','&:hover': { bgcolor:'#f5f5f5' } }}
 >
 <OpenInNewIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 </Stack>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Paper>
 )}

 {/* Trigger Workflow Dialog */}
 <Dialog open={triggerDialog} onClose={() => setTriggerDialog(false)} maxWidth="sm" fullWidth>
 <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>
 Trigger Workflow
 </DialogTitle>
 <DialogContent sx={{ pt: 2 }}>
 <Typography variant="body2" sx={{ color:'#888', mb: 2 }}>
 Sending data to <strong>{selectedWorkflow?.name}</strong>
 </Typography>
 <TextField
 fullWidth
 multiline
 rows={6}
 label="Input Data (JSON)"
 value={workflowInputData}
 onChange={(e) => setWorkflowInputData(e.target.value)}
 placeholder='{"key": "value"}'
 variant="outlined"
 sx={{ fontFamily:'monospace' }}
 />
 </DialogContent>
 <DialogActions sx={{ p: 2.5 }}>
 <Button onClick={() => setTriggerDialog(false)} sx={{ color:'#888' }}>Cancel</Button>
 <Button
 onClick={handleTriggerWorkflow}
 variant="contained"
 disabled={triggeringId === selectedWorkflow?.id}
 sx={{
 background:'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
'&:hover': { background:'linear-gradient(135deg, #219a52 0%, #27ae60 100%)' },
 }}
 >
 Trigger
 </Button>
 </DialogActions>
 </Dialog>

 {/* Validation Issues Dialog */}
 <Dialog open={validationDialog} onClose={() => setValidationDialog(false)} maxWidth="sm" fullWidth>
 <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>
 Workflow Issues
 </DialogTitle>
 <DialogContent sx={{ pt: 2 }}>
 <Typography variant="body2" sx={{ color:'#888', mb: 2 }}>
 Issues found in <strong>{selectedWorkflowForValidation?.name}</strong>
 </Typography>
 {selectedWorkflowForValidation?.validation && selectedWorkflowForValidation.validation.issues.length > 0 ? (
 <Stack spacing={2}>
 {selectedWorkflowForValidation.validation.issues.map((issue, idx) => (
 <Alert
 key={idx}
 severity={issue.type ==='missing_api_key' ?'error' : issue.type ==='missing_field' ?'warning' :'info'}
 >
 <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
 {issue.type ==='missing_api_key' &&'Missing API Key'}
 {issue.type ==='missing_field' &&'Missing Field'}
 {issue.type ==='warning' &&'Warning'}
 </Typography>
 <Typography variant="body2">{issue.message}</Typography>
 {issue.apiKeyName && (
 <Typography variant="caption" sx={{ display:'block', mt: 1, opacity: 0.8 }}>
 <strong>Required API Key:</strong> Add "{issue.apiKeyName}" in Settings
 </Typography>
 )}
 {issue.field && (
 <Typography variant="caption" sx={{ display:'block', mt: 1, opacity: 0.8 }}>
 <strong>Field:</strong> {issue.field}
 </Typography>
 )}
 </Alert>
 ))}
 </Stack>
 ) : (
 <Typography variant="body2" sx={{ color:'#999' }}>No issues found.</Typography>
 )}
 </DialogContent>
 <DialogActions sx={{ p: 2.5 }}>
 <Button
 onClick={() => {
 setValidationDialog(false);
 if (selectedWorkflowForValidation?.id) {
 window.open(`http://localhost:5678/workflow/${selectedWorkflowForValidation.id}`,'_blank');
 }
 }}
 variant="contained"
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 Open in n8n
 </Button>
 <Button onClick={() => setValidationDialog(false)} sx={{ color:'#888' }}>Close</Button>
 </DialogActions>
 </Dialog>

 {/* Edit Workflow Fields Dialog */}
 <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
 <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3 }}>
 Configure Workflow
 </DialogTitle>
 <DialogContent sx={{ pt: 2 }}>
 <Typography variant="body2" sx={{ color:'#888', mb: 2 }}>
 Editing <strong>{selectedWorkflowForEdit?.name}</strong>
 </Typography>
 {(() => {
 const issueFields = (selectedWorkflowForEdit?.validation?.issues || [])
 .filter((issue) => issue.type ==='missing_field' || issue.type ==='missing_api_key')
 .map((issue) => ({
 key: issue.field ?`${selectedWorkflowForEdit!.id}_${issue.field}` : issue.apiKeyName ?`apiKey_${issue.apiKeyName}` :'',
 label: issue.field || issue.apiKeyName ||'Value',
 type: issue.type,
 message: issue.message,
 description:'',
 apiKeyName: issue.apiKeyName,
 isFromIssue: true,
 }));

 const configFields = Object.keys(workflowEditFields || {})
 .filter((key) => !issueFields.some((f) => f.key === key))
 .map((key) => {
 let label = key.split('_').slice(1).join('_');
 let description ='';
 let type ='text';
 if (selectedWorkflowForEdit && key.includes('_')) {
 const underscoreIdx = key.indexOf('_');
 const nodeId = key.substring(0, underscoreIdx);
 const fieldName = key.substring(underscoreIdx + 1);
 const node = (selectedWorkflowForEdit as any).nodes?.find((n: any) => n.id === nodeId);
 if (node) {
 const paramSchema = getNodeParameterSchema(node.type).find((p: any) => p.name === fieldName);
 if (paramSchema) {
 label = paramSchema.label;
 description = paramSchema.description;
 type = paramSchema.type ==='string[]' ?'text' : paramSchema.type;
 }
 }
 }
 return {
 key,
 label,
 description,
 type,
 message:'',
 apiKeyName: undefined,
 isFromIssue: false,
 };
 });

 const allFields = [...issueFields, ...configFields];

 if (allFields.length === 0) {
 return <Alert severity="info">This workflow has no missing fields. You can add additional configurations below.</Alert>;
 }

 return (
 <Stack spacing={2}>
 <Typography variant="subtitle2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>
 Edit Configuration
 </Typography>
 {allFields.map((field, idx) => (
 <TextField
 key={field.key || idx}
 fullWidth
 label={field.label}
 placeholder={(field as any).description ||`Enter value`}
 type={field.type ==='missing_api_key' ?'password' :'text'}
 value={workflowEditFields[field.key] ||''}
 onChange={(e) => {
 setWorkflowEditFields((prev) => ({
 ...prev,
 [field.key]: e.target.value,
 }));
 }}
 />
 ))}
 </Stack>
 );
 })()}
 </DialogContent>
 <DialogActions sx={{ p: 2.5 }}>
 <Button onClick={() => setEditDialog(false)} sx={{ color:'#888' }}>Cancel</Button>
 <Button
 onClick={handleSaveWorkflowConfig}
 variant="contained"
 disabled={editLoading}
 sx={{
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 {editLoading ?'Saving...' :'Save'}
 </Button>
 </DialogActions>
 </Dialog>
 </Container>
 );
}
