import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Paper, TextField, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Alert, Stack, Select, MenuItem, FormControl, InputLabel, FormControlLabel,
  Tooltip, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, SmartToy as BotIcon,
  ContentCopy as CopyIcon, Code as CodeIcon, Chat as ChatIcon,
  Settings as SettingsIcon, People as PeopleIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

const API_AGENTS = `${API_BASE_URL}/api/chat-agents`;
const API_KB = `${API_BASE_URL}/api/knowledge-base`;

interface ChatAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  welcomeMessage: string;
  knowledgeBaseId?: string;
  brandColor: string;
  textColor: string;
  position: string;
  allowedDomains: string[];
  guardrails: string;
  model: string;
  maxTokens: number;
  temperature: number;
  maxMessagesPerMinute: number;
  requireEmail: boolean;
  enabled: boolean;
  totalConversations: number;
  totalMessages: number;
  createdAt: string;
}

interface KBSummary {
  id: string;
  name: string;
  totalChunks: number;
  totalTokens: number;
}

export function ChatAgentsPage() {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [kbs, setKbs] = useState<KBSummary[]>([]);
  const [selected, setSelected] = useState<ChatAgent | null>(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [snippet, setSnippet] = useState('');

  const [testMessage, setTestMessage] = useState('');
  const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const testConvoId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const r = await fetch(API_AGENTS);
      const data = await r.json();
      if (data.success) setAgents(data.agents);
    } catch (e: any) { setError(e.message); }
  }, []);

  const fetchKbs = useCallback(async () => {
    try {
      const r = await fetch(API_KB);
      const data = await r.json();
      if (data.success) setKbs(data.knowledgeBases);
    } catch (e: any) { /* ignore */ }
  }, []);

  useEffect(() => { fetchAgents(); fetchKbs(); }, [fetchAgents, fetchKbs]);

  const selectAgent = async (id: string) => {
    try {
      const r = await fetch(`${API_AGENTS}/${id}`);
      const data = await r.json();
      if (data.success) {
        setSelected(data.agent);
        // Fetch embed snippet
        const sr = await fetch(`${API_AGENTS}/${id}/embed`);
        const sd = await sr.json();
        if (sd.success) setSnippet(sd.snippet);
      }
    } catch (e: any) { setError(e.message); }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const r = await fetch(API_AGENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await r.json();
      if (data.success) {
        setCreateOpen(false);
        setNewName('');
        fetchAgents();
        selectAgent(data.agent.id);
      }
    } catch (e: any) { setError(e.message); }
  };

  const handleUpdate = async (updates: Partial<ChatAgent>) => {
    if (!selected) return;
    try {
      const r = await fetch(`${API_AGENTS}/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await r.json();
      if (data.success) {
        setSelected(data.agent);
        fetchAgents();
      }
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this chat agent?')) return;
    await fetch(`${API_AGENTS}/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    fetchAgents();
  };

  const handleTestSend = async () => {
    if (!selected || !testMessage.trim() || testLoading) return;
    const msg = testMessage;
    setTestMessage('');
    setTestMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setTestLoading(true);

    try {
      const r = await fetch(`${API_AGENTS}/public/${selected.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationId: testConvoId.current }),
      });

      const reader = r.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let fullText = '';
      setTestMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.substring(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'meta' && parsed.conversationId) {
              testConvoId.current = parsed.conversationId;
            } else if (parsed.type === 'token' && parsed.token) {
              fullText += parsed.token;
              setTestMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: fullText };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setTestMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    }
    setTestLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Chat Agents</Typography>
          <Typography variant="body2" color="text.secondary">
            Build AI chat agents powered by your knowledge base — deploy on any website
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Agent
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: Agent List */}
        <Paper sx={{ width: 300, flexShrink: 0, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Your Agents</Typography>
          {agents.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No agents yet. Create one to get started.
            </Typography>
          )}
          <List dense>
            {agents.map((a) => (
              <ListItem
                key={a.id}
                button
                selected={selected?.id === a.id}
                onClick={() => selectAgent(a.id)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon>
                  <BotIcon fontSize="small" sx={{ color: a.brandColor }} />
                </ListItemIcon>
                <ListItemText
                  primary={a.name}
                  secondary={`${a.totalConversations} chats · ${a.totalMessages} msgs`}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => handleDelete(a.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Right: Agent Detail */}
        <Box sx={{ flex: 1 }}>
          {!selected ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <BotIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Select or create a chat agent</Typography>
            </Paper>
          ) : (
            <Stack spacing={0}>
              <Paper sx={{ px: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                  <Tab icon={<SettingsIcon />} label="Configure" iconPosition="start" />
                  <Tab icon={<ChatIcon />} label="Test Chat" iconPosition="start" />
                  <Tab icon={<CodeIcon />} label="Deploy" iconPosition="start" />
                  <Tab icon={<PeopleIcon />} label="Conversations" iconPosition="start" />
                </Tabs>
              </Paper>

              {/* Tab 0: Configure */}
              {tab === 0 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Agent Settings</Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Name" fullWidth size="small"
                        value={selected.name}
                        onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                        onBlur={() => handleUpdate({ name: selected.name })}
                      />
                      <TextField
                        label="Welcome Message" fullWidth size="small"
                        value={selected.welcomeMessage}
                        onChange={(e) => setSelected({ ...selected, welcomeMessage: e.target.value })}
                        onBlur={() => handleUpdate({ welcomeMessage: selected.welcomeMessage })}
                      />
                      <TextField
                        label="System Prompt (Persona)" fullWidth multiline rows={5} size="small"
                        helperText="Define who this agent is, how it should behave, and what it knows."
                        value={selected.systemPrompt}
                        onChange={(e) => setSelected({ ...selected, systemPrompt: e.target.value })}
                        onBlur={() => handleUpdate({ systemPrompt: selected.systemPrompt })}
                      />
                      <TextField
                        label="Guardrails" fullWidth multiline rows={3} size="small"
                        helperText="Rules the agent must follow (e.g., 'Never discuss competitor pricing', 'Only answer about our products')"
                        value={selected.guardrails}
                        onChange={(e) => setSelected({ ...selected, guardrails: e.target.value })}
                        onBlur={() => handleUpdate({ guardrails: selected.guardrails })}
                      />
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Knowledge Base</Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Linked Knowledge Base</InputLabel>
                      <Select
                        value={selected.knowledgeBaseId || ''}
                        label="Linked Knowledge Base"
                        onChange={(e) => {
                          const val = e.target.value || undefined;
                          setSelected({ ...selected, knowledgeBaseId: val });
                          handleUpdate({ knowledgeBaseId: val } as any);
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {kbs.map((kb) => (
                          <MenuItem key={kb.id} value={kb.id}>
                            {kb.name} ({kb.totalChunks} chunks)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {!kbs.length && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        No knowledge bases yet. Create one in the Knowledge Base page first.
                      </Typography>
                    )}
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Appearance</Typography>
                    <Stack spacing={2} direction="row" flexWrap="wrap">
                      <TextField
                        label="Brand Color" size="small" type="color" sx={{ width: 120 }}
                        value={selected.brandColor}
                        onChange={(e) => setSelected({ ...selected, brandColor: e.target.value })}
                        onBlur={() => handleUpdate({ brandColor: selected.brandColor })}
                      />
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Position</InputLabel>
                        <Select
                          value={selected.position}
                          label="Position"
                          onChange={(e) => {
                            setSelected({ ...selected, position: e.target.value });
                            handleUpdate({ position: e.target.value });
                          }}
                        >
                          <MenuItem value="bottom-right">Bottom Right</MenuItem>
                          <MenuItem value="bottom-left">Bottom Left</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Model & Limits</Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Model" size="small" fullWidth
                        helperText="OpenRouter format: openai/gpt-4o-mini or anthropic/claude-3.5-sonnet"
                        value={selected.model}
                        onChange={(e) => setSelected({ ...selected, model: e.target.value })}
                        onBlur={() => handleUpdate({ model: selected.model })}
                      />
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="Max Tokens" size="small" type="number" sx={{ width: 120 }}
                          value={selected.maxTokens}
                          onChange={(e) => setSelected({ ...selected, maxTokens: parseInt(e.target.value) || 1024 })}
                          onBlur={() => handleUpdate({ maxTokens: selected.maxTokens })}
                        />
                        <TextField
                          label="Temperature" size="small" type="number" sx={{ width: 120 }}
                          inputProps={{ step: 0.1, min: 0, max: 2 }}
                          value={selected.temperature}
                          onChange={(e) => setSelected({ ...selected, temperature: parseFloat(e.target.value) || 0.7 })}
                          onBlur={() => handleUpdate({ temperature: selected.temperature })}
                        />
                        <TextField
                          label="Rate Limit /min" size="small" type="number" sx={{ width: 130 }}
                          value={selected.maxMessagesPerMinute}
                          onChange={(e) => setSelected({ ...selected, maxMessagesPerMinute: parseInt(e.target.value) || 20 })}
                          onBlur={() => handleUpdate({ maxMessagesPerMinute: selected.maxMessagesPerMinute })}
                        />
                      </Stack>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selected.requireEmail}
                            onChange={(e) => {
                              setSelected({ ...selected, requireEmail: e.target.checked });
                              handleUpdate({ requireEmail: e.target.checked });
                            }}
                          />
                        }
                        label="Require email before chatting (lead capture)"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selected.enabled}
                            onChange={(e) => {
                              setSelected({ ...selected, enabled: e.target.checked });
                              handleUpdate({ enabled: e.target.checked });
                            }}
                          />
                        }
                        label="Agent enabled"
                      />
                    </Stack>
                  </Paper>
                </Stack>
              )}

              {/* Tab 1: Test Chat */}
              {tab === 1 && (
                <Paper sx={{ mt: 2, display: 'flex', flexDirection: 'column', height: 500 }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2">
                      Live Chat Preview — {selected.name}
                    </Typography>
                    <Button size="small" onClick={() => { setTestMessages([]); testConvoId.current = null; }}>
                      Clear
                    </Button>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {testMessages.length === 0 && selected.welcomeMessage && (
                      <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 2, maxWidth: '80%', fontSize: 14 }}>
                        {selected.welcomeMessage}
                      </Box>
                    )}
                    {testMessages.map((m, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          maxWidth: '80%',
                          fontSize: 14,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          ...(m.role === 'user'
                            ? { bgcolor: selected.brandColor, color: '#fff', alignSelf: 'flex-end' }
                            : { bgcolor: 'grey.100', alignSelf: 'flex-start' }),
                        }}
                      >
                        {m.content || (testLoading && i === testMessages.length - 1 ? '...' : '')}
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                  <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth size="small" placeholder="Type a message..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleTestSend())}
                    />
                    <Button variant="contained" onClick={handleTestSend} disabled={testLoading}>Send</Button>
                  </Box>
                </Paper>
              )}

              {/* Tab 2: Deploy */}
              {tab === 2 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Embed Snippet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth multiline rows={3} value={snippet}
                        InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 13 } }}
                      />
                      <Tooltip title="Copy to clipboard">
                        <IconButton
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => { navigator.clipboard.writeText(snippet); }}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Allowed Domains</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Restrict which domains can use this agent. Leave empty to allow all.
                    </Typography>
                    <TextField
                      fullWidth size="small"
                      placeholder="example.com, app.example.com (comma-separated)"
                      value={(selected.allowedDomains || []).join(', ')}
                      onChange={(e) => setSelected({ ...selected, allowedDomains: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      onBlur={() => handleUpdate({ allowedDomains: selected.allowedDomains })}
                    />
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Agent ID</Typography>
                    <Chip label={selected.id} variant="outlined" onClick={() => navigator.clipboard.writeText(selected.id)} icon={<CopyIcon />} />
                  </Paper>
                </Stack>
              )}

              {/* Tab 3: Conversations */}
              {tab === 3 && (
                <Paper sx={{ mt: 2, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Recent Conversations ({selected.totalConversations})
                  </Typography>
                  <ConversationList agentId={selected.id} />
                </Paper>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Chat Agent</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Agent Name" sx={{ mt: 1 }}
            placeholder="e.g., Support Bot, Sales Assistant"
            value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Conversation List sub-component ──────────────────────────
function ConversationList({ agentId }: { agentId: string }) {
  const [convos, setConvos] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_AGENTS}/${agentId}/conversations`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setConvos(data.conversations); });
  }, [agentId]);

  const loadFull = async (convId: string) => {
    const r = await fetch(`${API_AGENTS}/${agentId}/conversations/${convId}`);
    const data = await r.json();
    if (data.success) setSelectedConvo(data.conversation);
  };

  if (selectedConvo) {
    return (
      <Stack spacing={1}>
        <Button size="small" onClick={() => setSelectedConvo(null)}>Back to list</Button>
        <Typography variant="caption" color="text.secondary">
          {selectedConvo.visitorEmail || 'Anonymous'} · {new Date(selectedConvo.createdAt).toLocaleString()} · {selectedConvo.messages.length} messages
        </Typography>
        {selectedConvo.messages.map((m: any, i: number) => (
          <Box
            key={i}
            sx={{
              p: 1.5, borderRadius: 2, maxWidth: '85%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              ...(m.role === 'user'
                ? { bgcolor: 'primary.main', color: '#fff', alignSelf: 'flex-end' }
                : { bgcolor: 'grey.100', alignSelf: 'flex-start' }),
            }}
          >
            {m.content}
          </Box>
        ))}
      </Stack>
    );
  }

  if (convos.length === 0) {
    return <Typography variant="body2" color="text.secondary">No conversations yet. Test the agent or deploy to start collecting chats.</Typography>;
  }

  return (
    <List dense>
      {convos.map((c) => (
        <ListItem key={c.id} button onClick={() => loadFull(c.id)} sx={{ borderRadius: 1 }}>
          <ListItemIcon><ChatIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary={c.visitorEmail || 'Anonymous visitor'}
            secondary={`${new Date(c.createdAt).toLocaleString()} · ${c.messages?.length || 0} messages`}
          />
        </ListItem>
      ))}
    </List>
  );
}
