import { useState, useRef, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import DOMPurify from 'dompurify';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Badge,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  PlayArrow as PlayIcon,
  Build as BuildIcon,
  AutoFixHigh as AutoFixIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountTree as WorkflowTreeIcon,
  Webhook as WebhookIcon,
  Api as ApiIcon,
  Psychology as AiIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  workflow?: any;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  nodeName?: string;
  message: string;
  fix?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    nodeCount: number;
    connectionCount: number;
    triggerCount: number;
    knownNodeTypes: number;
    unknownNodeTypes: string[];
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
}

interface NodeDef {
  type: string;
  displayName: string;
  group: string;
  description: string;
  commonParams: string[];
}

const API_BASE = API.n8nBuilder;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const severityIcon = (severity: string) => {
  switch (severity) {
    case 'error':
      return <ErrorIcon sx={{ color: '#e74c3c', fontSize: 18 }} />;
    case 'warning':
      return <WarningIcon sx={{ color: '#f39c12', fontSize: 18 }} />;
    case 'info':
      return <InfoIcon sx={{ color: '#3498db', fontSize: 18 }} />;
    default:
      return null;
  }
};

const groupIcon = (group: string) => {
  switch (group) {
    case 'trigger':
      return <WebhookIcon sx={{ fontSize: 18 }} />;
    case 'action':
      return <ApiIcon sx={{ fontSize: 18 }} />;
    case 'flow':
      return <WorkflowTreeIcon sx={{ fontSize: 18 }} />;
    case 'transform':
      return <CodeIcon sx={{ fontSize: 18 }} />;
    case 'ai':
      return <AiIcon sx={{ fontSize: 18 }} />;
    case 'output':
      return <PlayIcon sx={{ fontSize: 18 }} />;
    default:
      return <CategoryIcon sx={{ fontSize: 18 }} />;
  }
};

const groupColor = (group: string) => {
  switch (group) {
    case 'trigger':
      return '#27ae60';
    case 'action':
      return '#3498db';
    case 'flow':
      return '#9b59b6';
    case 'transform':
      return '#e67e22';
    case 'ai':
      return '#e91e63';
    case 'output':
      return '#00bcd4';
    default:
      return '#95a5a6';
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorkflowBuilderPage() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**Welcome to the n8n Workflow Builder!** 🔧

I'm your specialized assistant for creating n8n workflow JSON files. I can help you:

• **Build workflows** — describe what you need and I'll generate the complete JSON
• **Validate workflows** — paste your workflow JSON and I'll check for issues  
• **Explain nodes** — ask about any n8n node type and how to use it
• **Improve workflows** — I can suggest optimizations and best practices

**Quick start:** Try a template from the sidebar, or just tell me what workflow you need!

*Example: "Create a webhook that receives form data, validates the email field, and saves it to Google Sheets"*`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiProvider, setApiProvider] = useState('openai');
  const [apiModel, setApiModel] = useState('gpt-4');

  // Workflow state
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Right panel tab
  const [rightTab, setRightTab] = useState(0); // 0 = Workflow JSON, 1 = Validation, 2 = Node Reference

  // Node reference
  const [nodes, setNodes] = useState<NodeDef[]>([]);
  const [nodeSearch, setNodeSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['trigger']));

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch nodes and templates on mount
  useEffect(() => {
    fetch(`${API_BASE}/nodes`)
      .then((r) => r.json())
      .then((data) => setNodes(data.nodes || []))
      .catch(() => {});

    fetch(`${API_BASE}/templates`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  // ─── Chat ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== 'system' && m.id !== 'welcome')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          apiProvider,
          model: apiModel,
          conversationHistory: history,
          currentWorkflow,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Here is your workflow.',
          timestamp: new Date(),
          workflow: data.workflow || undefined,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Auto-load workflow if one was generated
        if (data.workflow) {
          setCurrentWorkflow(data.workflow);
          setRightTab(0);
          // Auto-validate
          validateWorkflow(data.workflow);
        }
      } else {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `**Error:** ${data.error || 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Connection error:** Could not reach the backend. Make sure the server is running on port 3000.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, apiProvider, apiModel, currentWorkflow, messages]);

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateWorkflow = useCallback(async (wf?: any) => {
    const workflow = wf || currentWorkflow;
    if (!workflow) return;

    try {
      const res = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (!wf) setRightTab(1);
    } catch {
      setSnackbar({ open: true, message: 'Failed to validate workflow', severity: 'error' });
    }
  }, [currentWorkflow]);

  // ─── Template loading ─────────────────────────────────────────────────────

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const res = await fetch(`${API_BASE}/templates/${templateId}`);
      const data = await res.json();
      if (data.success && data.workflow) {
        setCurrentWorkflow(data.workflow);
        setRightTab(0);
        validateWorkflow(data.workflow);

        const sysMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          content: `✅ Loaded template **"${data.workflow.name}"** with ${data.workflow.nodes.length} nodes. You can see the JSON in the right panel.\n\nFeel free to ask me to modify it!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to load template', severity: 'error' });
    }
  }, []);

  // ─── Import / Export ──────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importJson);
      setCurrentWorkflow(parsed);
      setImportDialogOpen(false);
      setImportJson('');
      validateWorkflow(parsed);
      setSnackbar({ open: true, message: 'Workflow imported successfully', severity: 'success' });

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `📥 Imported workflow **"${parsed.name || 'Untitled'}"** with ${parsed.nodes?.length || 0} nodes. I can help you understand, validate, or improve it.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch {
      setSnackbar({ open: true, message: 'Invalid JSON — could not parse', severity: 'error' });
    }
  }, [importJson]);

  const handleExport = useCallback(() => {
    if (!currentWorkflow) return;
    const jsonStr = JSON.stringify(currentWorkflow, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentWorkflow.name || 'workflow').replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Workflow downloaded', severity: 'success' });
  }, [currentWorkflow]);

  const handleCopyJson = useCallback(() => {
    if (!currentWorkflow) return;
    navigator.clipboard.writeText(JSON.stringify(currentWorkflow, null, 2));
    setSnackbar({ open: true, message: 'JSON copied to clipboard', severity: 'success' });
  }, [currentWorkflow]);

  // ─── Reset conversation ─────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation cleared. What workflow would you like to build?`,
        timestamp: new Date(),
      },
    ]);
    setCurrentWorkflow(null);
    setValidationResult(null);
  }, []);

  // ─── Node reference groups ────────────────────────────────────────────────

  const filteredNodes = nodeSearch
    ? nodes.filter(
        (n) =>
          n.displayName.toLowerCase().includes(nodeSearch.toLowerCase()) ||
          n.type.toLowerCase().includes(nodeSearch.toLowerCase()) ||
          n.description.toLowerCase().includes(nodeSearch.toLowerCase()),
      )
    : nodes;

  const nodeGroups = filteredNodes.reduce<Record<string, NodeDef[]>>((acc, node) => {
    if (!acc[node.group]) acc[node.group] = [];
    acc[node.group].push(node);
    return acc;
  }, {});

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // ─── Render chat message ──────────────────────────────────────────────────

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';

    // Simple markdown-ish rendering
    const formatContent = (text: string) => {
      // Split by code blocks
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, i) => {
        if (part.startsWith('```')) {
          const codeContent = part.replace(/```(?:json)?\s*/g, '').replace(/```$/g, '');
          return (
            <Box
              key={i}
              sx={{
                mt: 1,
                mb: 1,
                p: 1.5,
                bgcolor: '#1a1a2e',
                borderRadius: 2,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '0.78rem',
                color: '#a0e8af',
                overflow: 'auto',
                maxHeight: 300,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid rgba(102,126,234,0.2)',
              }}
            >
              {codeContent}
            </Box>
          );
        }
        // Bold
        let formatted = part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        formatted = formatted.replace(/^[•\-\*]\s+/gm, '● ');
        // Italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted.replace(/\n/g, '<br/>')) }}
          />
        );
      });
    };

    return (
      <Box
        key={msg.id}
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 2,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: isUser ? 'rgba(102,126,234,0.15)' : 'rgba(118,75,162,0.15)',
            mt: 0.5,
          }}
        >
          {isUser ? (
            <PersonIcon sx={{ fontSize: 18, color: '#667eea' }} />
          ) : (
            <BotIcon sx={{ fontSize: 18, color: '#764ba2' }} />
          )}
        </Box>
        <Box
          sx={{
            maxWidth: '80%',
            p: 1.5,
            borderRadius: '12px',
            bgcolor: isUser ? 'rgba(102,126,234,0.08)' : '#fff',
            border: `1px solid ${isUser ? 'rgba(102,126,234,0.15)' : 'rgba(0,0,0,0.06)'}`,
            fontSize: '0.88rem',
            lineHeight: 1.6,
            color: '#1a1a2e',
          }}
        >
          {formatContent(msg.content)}
          {msg.workflow && (
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CodeIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  setCurrentWorkflow(msg.workflow);
                  setRightTab(0);
                  validateWorkflow(msg.workflow);
                }}
                sx={{ fontSize: '0.75rem', borderRadius: 2, textTransform: 'none' }}
              >
                View JSON
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CopyIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(msg.workflow, null, 2));
                  setSnackbar({ open: true, message: 'Copied!', severity: 'success' });
                }}
                sx={{ fontSize: '0.75rem', borderRadius: 2, textTransform: 'none' }}
              >
                Copy
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* ─── Left Sidebar: Templates & Quick Actions ───────────────────────── */}
      <Box
        sx={{
          width: 260,
          bgcolor: '#fff',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', color: '#1a1a2e', mb: 0.5 }}>
            ⚡ Starter Templates
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
            Click to load a template workflow
          </Typography>
        </Box>

        {/* Template list */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
          {templates.map((tpl) => (
            <Paper
              key={tpl.id}
              onClick={() => loadTemplate(tpl.id)}
              sx={{
                p: 1.5,
                mb: 1,
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'none',
                borderRadius: 2,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: '#667eea',
                  bgcolor: 'rgba(102,126,234,0.04)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', mb: 0.3 }}>
                {tpl.name}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.4 }}>
                {tpl.description}
              </Typography>
              <Chip
                label={`${tpl.nodeCount} nodes`}
                size="small"
                sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', bgcolor: 'rgba(102,126,234,0.08)', color: '#667eea', fontWeight: 700 }}
              />
            </Paper>
          ))}
        </Box>

        <Divider />

        {/* Quick actions */}
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<ImportIcon sx={{ fontSize: 16 }} />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ mb: 1, fontSize: '0.78rem', borderRadius: 2, justifyContent: 'flex-start', textTransform: 'none', color: '#555', borderColor: 'rgba(0,0,0,0.12)' }}
          >
            Import Workflow JSON
          </Button>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={handleReset}
            sx={{ fontSize: '0.78rem', borderRadius: 2, justifyContent: 'flex-start', textTransform: 'none', color: '#555', borderColor: 'rgba(0,0,0,0.12)' }}
          >
            Clear Conversation
          </Button>
        </Box>
      </Box>

      {/* ─── Center: Chat Area ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat header */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BuildIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>
                n8n Workflow Builder
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                AI-powered workflow creation & validation
              </Typography>
            </Box>
          </Box>

          {/* Provider selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '0.78rem' }}>Provider</InputLabel>
              <Select
                value={apiProvider}
                label="Provider"
                onChange={(e) => setApiProvider(e.target.value)}
                sx={{ fontSize: '0.82rem', borderRadius: 2, height: 36 }}
              >
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="openrouter">OpenRouter</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: '0.78rem' }}>Model</InputLabel>
              <Select
                value={apiModel}
                label="Model"
                onChange={(e) => setApiModel(e.target.value)}
                sx={{ fontSize: '0.82rem', borderRadius: 2, height: 36 }}
              >
                {apiProvider === 'openai' ? (
                  [
                    <MenuItem key="gpt-4" value="gpt-4">GPT-4</MenuItem>,
                    <MenuItem key="gpt-4o" value="gpt-4o">GPT-4o</MenuItem>,
                    <MenuItem key="gpt-4o-mini" value="gpt-4o-mini">GPT-4o Mini</MenuItem>,
                    <MenuItem key="gpt-3.5-turbo" value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>,
                  ]
                ) : (
                  [
                    <MenuItem key="openai/gpt-4o" value="openai/gpt-4o">GPT-4o</MenuItem>,
                    <MenuItem key="anthropic/claude-3.5-sonnet" value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</MenuItem>,
                    <MenuItem key="google/gemini-pro" value="google/gemini-pro">Gemini Pro</MenuItem>,
                  ]
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            bgcolor: '#fafbfc',
          }}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(118,75,162,0.15)',
                }}
              >
                <BotIcon sx={{ fontSize: 18, color: '#764ba2' }} />
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: '#764ba2' }} />
                <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>Building workflow...</Typography>
              </Box>
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#fff',
          }}
        >
          {/* Quick suggestion chips */}
          {messages.length <= 1 && (
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap' }}>
              {[
                'Create a webhook that sends a Slack notification',
                'Build an AI chatbot with memory',
                'Schedule a daily email report from an API',
                'Form submission → Google Sheets',
                'What node should I use for conditional logic?',
              ].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  size="small"
                  onClick={() => setInputValue(suggestion)}
                  sx={{
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    bgcolor: 'rgba(102,126,234,0.06)',
                    color: '#667eea',
                    border: '1px solid rgba(102,126,234,0.15)',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'rgba(102,126,234,0.12)',
                    },
                  }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Describe the workflow you need, or paste JSON to validate..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: '0.88rem',
                  bgcolor: '#fafbfc',
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                background: inputValue.trim()
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(0,0,0,0.06)',
                color: inputValue.trim() ? 'white' : '#ccc',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4092 100%)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(0,0,0,0.06)',
                  color: '#ccc',
                },
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ─── Right Panel: JSON / Validation / Node Reference ───────────────── */}
      <Box
        sx={{
          width: 420,
          bgcolor: '#fff',
          borderLeft: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={rightTab}
          onChange={(_, v) => setRightTab(v)}
          sx={{
            minHeight: 42,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': { minHeight: 42, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none' },
            '& .Mui-selected': { color: '#667eea' },
            '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #667eea, #764ba2)' },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CodeIcon sx={{ fontSize: 16 }} />
                Workflow JSON
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Badge
                  badgeContent={validationResult?.issues?.filter((i) => i.severity === 'error').length || 0}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                >
                  <AutoFixIcon sx={{ fontSize: 16 }} />
                </Badge>
                Validation
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CategoryIcon sx={{ fontSize: 16 }} />
                Nodes
              </Box>
            }
          />
        </Tabs>

        {/* Tab 0: Workflow JSON */}
        {rightTab === 0 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {currentWorkflow ? (
              <>
                {/* Toolbar */}
                <Box sx={{ p: 1, display: 'flex', gap: 0.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Tooltip title="Copy JSON">
                    <IconButton size="small" onClick={handleCopyJson}>
                      <CopyIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download JSON">
                    <IconButton size="small" onClick={handleExport}>
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Validate">
                    <IconButton size="small" onClick={() => validateWorkflow()}>
                      <AutoFixIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={`${currentWorkflow.nodes?.length || 0} nodes`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea' }}
                  />
                  {validationResult && (
                    <Chip
                      icon={validationResult.valid ? <CheckIcon sx={{ fontSize: 14 }} /> : <ErrorIcon sx={{ fontSize: 14 }} />}
                      label={validationResult.valid ? 'Valid' : `${validationResult.issues.filter((i) => i.severity === 'error').length} errors`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: validationResult.valid ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
                        color: validationResult.valid ? '#27ae60' : '#e74c3c',
                      }}
                    />
                  )}
                </Box>

                {/* JSON viewer */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '0.76rem',
                    color: '#2c3e50',
                    bgcolor: '#fafbfc',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                >
                  {JSON.stringify(currentWorkflow, null, 2)}
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
                <Box>
                  <WorkflowTreeIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
                  <Typography sx={{ fontSize: '0.88rem', color: '#999', fontWeight: 600 }}>
                    No workflow loaded
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#bbb', mt: 0.5 }}>
                    Ask the AI to create one, load a template, or import JSON
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 1: Validation */}
        {rightTab === 1 && (
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {validationResult ? (
              <>
                {/* Summary */}
                <Alert
                  severity={validationResult.valid ? 'success' : 'error'}
                  sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}
                >
                  {validationResult.valid
                    ? 'Workflow is valid and ready to import into n8n!'
                    : `Found ${validationResult.issues.filter((i) => i.severity === 'error').length} error(s) that need fixing`}
                </Alert>

                {/* Stats */}
                <Paper sx={{ p: 1.5, mb: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stats
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {[
                      { label: 'Nodes', value: validationResult.stats.nodeCount },
                      { label: 'Connections', value: validationResult.stats.connectionCount },
                      { label: 'Triggers', value: validationResult.stats.triggerCount },
                      { label: 'Known Types', value: validationResult.stats.knownNodeTypes },
                    ].map((s) => (
                      <Box key={s.label} sx={{ textAlign: 'center', p: 0.5 }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#667eea' }}>
                          {s.value}
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>{s.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Issues list */}
                {validationResult.issues.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Issues ({validationResult.issues.length})
                    </Typography>
                    {validationResult.issues.map((issue, i) => (
                      <Paper
                        key={i}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          boxShadow: 'none',
                          border: '1px solid rgba(0,0,0,0.06)',
                          borderRadius: 2,
                          borderLeft: `3px solid ${issue.severity === 'error' ? '#e74c3c' : issue.severity === 'warning' ? '#f39c12' : '#3498db'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          {severityIcon(issue.severity)}
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e' }}>
                              {issue.message}
                            </Typography>
                            {issue.nodeName && (
                              <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.3 }}>
                                Node: {issue.nodeName}
                              </Typography>
                            )}
                            {issue.fix && (
                              <Typography sx={{ fontSize: '0.72rem', color: '#667eea', mt: 0.3, fontStyle: 'italic' }}>
                                💡 {issue.fix}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                {validationResult.issues.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckIcon sx={{ fontSize: 40, color: '#27ae60', mb: 1 }} />
                    <Typography sx={{ fontSize: '0.85rem', color: '#27ae60', fontWeight: 700 }}>
                      No issues found!
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AutoFixIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
                <Typography sx={{ fontSize: '0.88rem', color: '#999', fontWeight: 600 }}>
                  No validation results yet
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#bbb', mt: 0.5 }}>
                  Load or create a workflow, then validate it
                </Typography>
                {currentWorkflow && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => validateWorkflow()}
                    startIcon={<AutoFixIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '0.8rem',
                    }}
                  >
                    Validate Now
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Node Reference */}
        {rightTab === 2 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search nodes..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#bbb', mr: 0.5 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem', height: 36 },
                }}
              />
            </Box>

            {/* Node groups */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {Object.entries(nodeGroups).map(([group, groupNodes]) => (
                <Box key={group}>
                  <ListItemButton
                    onClick={() => toggleGroup(group)}
                    sx={{ py: 0.8, px: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: groupColor(group) }}>
                      {groupIcon(group)}
                    </ListItemIcon>
                    <ListItemText
                      primary={group.charAt(0).toUpperCase() + group.slice(1)}
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e' }}
                    />
                    <Chip
                      label={groupNodes.length}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', mr: 1 }}
                    />
                    {expandedGroups.has(group) ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  </ListItemButton>
                  <Collapse in={expandedGroups.has(group)}>
                    <List dense disablePadding>
                      {groupNodes.map((node) => (
                        <ListItem
                          key={node.type}
                          sx={{
                            py: 0.5,
                            px: 2,
                            pl: 4,
                            borderBottom: '1px solid rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(102,126,234,0.04)' },
                          }}
                          onClick={() => {
                            setInputValue(`Tell me about the ${node.displayName} node (${node.type}) and show me an example of how to use it in a workflow`);
                          }}
                        >
                          <ListItemText
                            primary={node.displayName}
                            secondary={node.description}
                            primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.68rem', color: '#999' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
            </Box>

            <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#bbb' }}>
                {nodes.length} node types available • Click any node to ask about it
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* ─── Import Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
          Import Workflow JSON
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.82rem', color: '#888', mb: 2 }}>
            Paste your n8n workflow JSON below. You can export this from n8n via the workflow menu → "Download".
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={16}
            placeholder='{ "name": "My Workflow", "nodes": [...], "connections": {...} }'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            sx={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!importJson.trim()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
