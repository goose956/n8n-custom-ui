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
  Alert,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import axios from 'axios';
import { nodeSchemas } from './nodeSchemas';

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
      type: 'missing_field' | 'missing_api_key' | 'warning';
      message: string;
      field?: string;
      apiKeyName?: string;
    }>;
  };
}

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const response = await axios.get('http://localhost:3000/api/workflows/validation');
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

  const handleEditWorkflow = async (workflow: Workflow) => {
    let fullWorkflow = workflow;
    try {
      const wfRes = await axios.get(`http://localhost:3000/api/workflows`);
      if (wfRes.data && wfRes.data.workflows) {
        const found = wfRes.data.workflows.find((w: any) => w.id === workflow.id);
        if (found) fullWorkflow = found;
      }
    } catch {}
    setSelectedWorkflowForEdit(fullWorkflow);
    try {
      const response = await axios.get(`http://localhost:3000/api/workflows/config/${workflow.id}`);
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
        let fieldName = '';
        if (underscoreIdx !== -1) {
          nodeId = key.substring(0, underscoreIdx);
          fieldName = key.substring(underscoreIdx + 1);
        }
        return {
          nodeId,
          fieldName,
          value,
          nodeType: 'HTTPRequest',
        };
      });

      const response = await axios.put(
        `http://localhost:3000/api/workflows/config/${selectedWorkflowForEdit.id}`,
        {
          workflowName: selectedWorkflowForEdit.name,
          fields,
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Workflow configuration saved successfully' });
        setEditDialog(false);
        await loadWorkflows();
        const updated = workflows.find(wf => wf.id === selectedWorkflowForEdit.id);
        if (updated) setSelectedWorkflowForEdit(updated);
      } else {
        setMessage({ type: 'error', text: 'Failed to save workflow configuration' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Workflows
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage and test your n8n workflows.
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

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
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No workflows found. Create one in n8n to see it here.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Validation</strong></TableCell>
                <TableCell align="right"><strong>Created</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow
                  key={workflow.id}
                  hover
                  sx={{
                    backgroundColor: workflow.validation && !workflow.validation.isValid ? '#fff3cd' : 'inherit',
                  }}
                >
                  <TableCell>{workflow.name}</TableCell>
                  <TableCell align="center">
                    <span style={{ color: workflow.active ? 'green' : 'gray' }}>
                      {workflow.active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    {workflow.validation && workflow.validation.isValid ? (
                      <span style={{ color: 'green' }}>✓ OK</span>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        sx={{ color: 'orange', textTransform: 'none' }}
                        onClick={() => {
                          setSelectedWorkflowForValidation(workflow);
                          setValidationDialog(true);
                        }}
                      >
                        ⚠ {workflow.validation?.issues.length || 0} Issues
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleTriggerClick(workflow)}
                        disabled={triggeringId === workflow.id || !workflow.active}
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
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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

      {/* Validation Issues Dialog */}
      <Dialog open={validationDialog} onClose={() => setValidationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Workflow Issues: {selectedWorkflowForValidation?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedWorkflowForValidation?.validation && selectedWorkflowForValidation.validation.issues.length > 0 ? (
            <Stack spacing={2}>
              {selectedWorkflowForValidation.validation.issues.map((issue, idx) => (
                <Alert
                  key={idx}
                  severity={issue.type === 'missing_api_key' ? 'error' : issue.type === 'missing_field' ? 'warning' : 'info'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {issue.type === 'missing_api_key' && '🔑 Missing API Key'}
                    {issue.type === 'missing_field' && '📝 Missing Field'}
                    {issue.type === 'warning' && '⚠️ Warning'}
                  </Typography>
                  <Typography variant="body2">{issue.message}</Typography>
                  {issue.apiKeyName && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'inherit', opacity: 0.8 }}>
                      <strong>Required API Key:</strong> Add "{issue.apiKeyName}" in the API Keys section
                    </Typography>
                  )}
                  {issue.field && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'inherit', opacity: 0.8 }}>
                      <strong>Field:</strong> {issue.field}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Typography color="textSecondary">No issues found. This workflow is properly configured.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setValidationDialog(false);
              if (selectedWorkflowForValidation?.id) {
                window.open(`http://localhost:5678/workflow/${selectedWorkflowForValidation.id}`, '_blank');
              }
            }}
            variant="contained"
            color="primary"
          >
            Open in n8n
          </Button>
          <Button onClick={() => setValidationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Workflow Fields Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Workflow: {selectedWorkflowForEdit?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {(() => {
            const issueFields = (selectedWorkflowForEdit?.validation?.issues || [])
              .filter((issue) => issue.type === 'missing_field' || issue.type === 'missing_api_key')
              .map((issue) => ({
                key: issue.field ? `${selectedWorkflowForEdit!.id}_${issue.field}` : issue.apiKeyName ? `apiKey_${issue.apiKeyName}` : '',
                label: issue.field || issue.apiKeyName || 'Value',
                type: issue.type,
                message: issue.message,
                description: '',
                apiKeyName: issue.apiKeyName,
                isFromIssue: true,
              }));

            const configFields = Object.keys(workflowEditFields || {})
              .filter((key) => !issueFields.some((f) => f.key === key))
              .map((key) => {
                let label = key.split('_').slice(1).join('_');
                let description = '';
                let type = 'text';
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
                      type = paramSchema.type === 'string[]' ? 'text' : paramSchema.type;
                    }
                  }
                }
                return {
                  key,
                  label,
                  description,
                  type,
                  message: '',
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
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Edit Configuration:
                </Typography>
                {allFields.map((field, idx) => (
                  <TextField
                    key={field.key || idx}
                    fullWidth
                    label={field.label}
                    placeholder={(field as any).description || `Enter value`}
                    type={field.type === 'missing_api_key' ? 'password' : 'text'}
                    value={workflowEditFields[field.key] || ''}
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
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveWorkflowConfig}
            variant="contained"
            color="primary"
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
