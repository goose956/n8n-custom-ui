import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress,
  Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  PlayArrow as RunIcon,
  Delete as ClearIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { API } from '../config/api';
import { SkillOutputRenderer } from './SkillOutputRenderer';

// ── Types ─────────────────────────────────────────────────────────────

interface RunResult {
  id: string;
  status: 'success' | 'error';
  output: string;
  logs: string[];
  toolCalls: Array<{ toolName: string; input: any; output: any; duration: number }>;
  duration: number;
  error?: string;
}

interface ProgressStep {
  type: string;
  message: string;
  elapsed?: number;
  phase?: string;
  tool?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export function AgentChatPanel() {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [outputTab, setOutputTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const activityEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll activity feed
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressSteps]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const runChat = useCallback(async () => {
    const msg = input.trim();
    if (!msg || running) return;

    setRunning(true);
    setResult(null);
    setProgressSteps([]);
    setOutputTab(0);
    setCopied(false);

    try {
      const resp = await fetch(`${API.skills}/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text();
        setResult({
          id: '', status: 'error', output: '', logs: [], toolCalls: [],
          duration: 0, error: text || 'Request failed',
        });
        setRunning(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processEvents = (text: string, isFinal: boolean) => {
        buffer += text;
        const lines = buffer.split('\n');
        buffer = isFinal ? '' : (lines.pop() || '');

        let eventType = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6);
          } else if (line.trim() === '') {
            if (eventType && dataStr) {
              try {
                const payload = JSON.parse(dataStr);
                if (eventType === 'progress') {
                  setProgressSteps(prev => [...prev, payload]);
                } else if (eventType === 'done') {
                  if (payload.result) {
                    setResult(payload.result);
                  }
                } else if (eventType === 'error') {
                  setResult({
                    id: '', status: 'error', output: '', logs: [], toolCalls: [],
                    duration: 0, error: payload.message || 'Failed',
                  });
                }
              } catch { /* ignore */ }
            }
            eventType = '';
            dataStr = '';
          }
        }

        if (isFinal && eventType && dataStr) {
          try {
            const payload = JSON.parse(dataStr);
            if (eventType === 'done' && payload.result) {
              setResult(payload.result);
            } else if (eventType === 'error') {
              setResult({
                id: '', status: 'error', output: '', logs: [], toolCalls: [],
                duration: 0, error: payload.message || 'Failed',
              });
            }
          } catch { /* ignore */ }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) { processEvents('', true); break; }
        processEvents(decoder.decode(value, { stream: true }), false);
      }
    } catch (err: any) {
      setResult({
        id: '', status: 'error', output: '', logs: [], toolCalls: [],
        duration: 0, error: err.message || 'Request failed',
      });
    } finally {
      setRunning(false);
    }
  }, [input, running]);

  const clearAll = () => {
    if (running) return;
    setInput('');
    setResult(null);
    setProgressSteps([]);
    setCopied(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runChat();
    }
  };

  const copyOutput = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ═══ INPUT BAR ═══ */}
      <Paper sx={{
        px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-end',
        borderBottom: 1, borderColor: 'divider', flexShrink: 0,
      }}>
        <BotIcon sx={{ color: 'primary.main', fontSize: 22, mb: 0.5 }} />
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={3}
          size="small"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Describe what you want... e.g. "Research AI trends and write an article with an image, save as PDF"'
          disabled={running}
          sx={{
            '& .MuiOutlinedInput-root': { fontSize: 13 },
            '& textarea': { lineHeight: 1.5 },
          }}
        />
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={runChat}
          disabled={running || !input.trim()}
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
          sx={{ fontWeight: 700, minWidth: 100, height: 38, flexShrink: 0 }}
        >
          {running ? 'Running...' : 'Run'}
        </Button>
        <Tooltip title="Clear">
          <span>
            <IconButton size="small" onClick={clearAll} disabled={running}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {/* ═══ EMPTY STATE ═══ */}
      {!result && !running && progressSteps.length === 0 && (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 460 }}>
            <BotIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
              Agent Chat
            </Typography>
            <Typography color="text.disabled" sx={{ fontSize: 13, lineHeight: 1.6, mb: 2 }}>
              Describe any task — the AI planner will determine which skills and tools to use automatically.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                'Research AI trends and write me a 1000 word article',
                'Find 5 competitors of Stripe and summarise what they do',
                'Write an article about remote work with an image and save as PDF',
              ].map((ex, i) => (
                <Typography
                  key={i}
                  onClick={() => { setInput(ex); inputRef.current?.focus(); }}
                  sx={{
                    fontSize: 12, color: 'primary.main', cursor: 'pointer',
                    px: 1.5, py: 0.5, borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    fontStyle: 'italic',
                  }}
                >
                  "{ex}"
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ═══ TWO PANELS: Activity (left) + Output (right) ═══ */}
      {(running || result || progressSteps.length > 0) && (
        <Box sx={{ flex: 1, display: 'flex', gap: 1.5, overflow: 'hidden', p: 1.5 }}>

          {/* ── LEFT: Activity feed ── */}
          <Paper sx={{
            flex: '0 0 300px', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', bgcolor: '#1a1a2e',
          }}>
            <Box sx={{
              px: 1.5, py: 1, borderBottom: '1px solid #333',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              {running && <CircularProgress size={14} sx={{ color: '#569cd6' }} />}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#9cdcfe', fontFamily: 'monospace' }}>
                Activity
              </Typography>
              {progressSteps.length > 0 && (
                <Typography sx={{ fontSize: 10, color: '#666', ml: 'auto' }}>
                  {progressSteps.length} events
                </Typography>
              )}
            </Box>
            <Box sx={{
              flex: 1, overflow: 'auto', px: 1.5, py: 1,
              display: 'flex', flexDirection: 'column', gap: 0.4,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: 2 },
            }}>
              {progressSteps.length === 0 && running && (
                <Typography sx={{ color: '#808080', fontSize: 11, fontFamily: 'monospace' }}>
                  Connecting...
                </Typography>
              )}
              {progressSteps.map((step, i) => {
                const isLatest = i === progressSteps.length - 1;
                const icon = step.type === 'phase' ? '📋'
                  : step.type === 'tool-start' ? '🔧'
                  : step.type === 'tool-done' ? '✅'
                  : step.type === 'step' ? '▸'
                  : step.type === 'error' ? '❌'
                  : step.type === 'done' ? '🏁'
                  : 'ℹ️';
                return (
                  <Box key={i} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 0.75,
                    opacity: isLatest && running ? 1 : 0.75, py: 0.15,
                  }}>
                    <Typography sx={{ fontSize: 11, lineHeight: 1.4, flexShrink: 0 }}>{icon}</Typography>
                    <Typography sx={{
                      fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, flex: 1,
                      color: step.type === 'phase' ? '#dcdcaa'
                        : step.type === 'tool-start' ? '#569cd6'
                        : step.type === 'tool-done' ? '#b5cea8'
                        : step.type === 'error' ? '#f48771'
                        : step.type === 'done' ? '#4ec9b0'
                        : '#d4d4d4',
                      fontWeight: step.type === 'phase' ? 700 : 400,
                    }}>
                      {step.message}
                    </Typography>
                    {step.elapsed != null && (
                      <Typography sx={{ fontSize: 9, color: '#555', flexShrink: 0, whiteSpace: 'nowrap', lineHeight: 1.6 }}>
                        {(step.elapsed / 1000).toFixed(1)}s
                      </Typography>
                    )}
                  </Box>
                );
              })}
              <div ref={activityEndRef} />
            </Box>
          </Paper>

          {/* ── RIGHT: Output panel with tabs ── */}
          <Paper sx={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Status bar + copy */}
            <Box sx={{
              px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
              borderBottom: 1, borderColor: 'divider', flexShrink: 0,
            }}>
              {result ? (
                <>
                  {result.status === 'success'
                    ? <SuccessIcon color="success" sx={{ fontSize: 16 }} />
                    : <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                  }
                  <Typography variant="caption" color="text.secondary">
                    {(result.duration / 1000).toFixed(1)}s · {result.toolCalls?.length || 0} tool calls
                  </Typography>
                </>
              ) : running ? (
                <>
                  <CircularProgress size={14} sx={{ color: '#569cd6' }} />
                  <Typography variant="caption" color="text.secondary">Working...</Typography>
                </>
              ) : null}

              {result?.output && (
                <Tooltip title={copied ? 'Copied!' : 'Copy output'}>
                  <IconButton size="small" onClick={copyOutput} sx={{ ml: 'auto' }}>
                    {copied
                      ? <SuccessIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      : <CopyIcon sx={{ fontSize: 16 }} />
                    }
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tabs
                value={outputTab}
                onChange={(_, v) => setOutputTab(v)}
                sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, textTransform: 'none' } }}
              >
                <Tab label="Output" />
                <Tab label="Logs" />
                <Tab label={`Tool Calls${result?.toolCalls?.length ? ` (${result.toolCalls.length})` : ''}`} />
              </Tabs>
            </Box>

            {/* Tab content */}
            <Box sx={{
              flex: 1, overflow: 'auto', p: 1.5,
              fontFamily: 'monospace', fontSize: 12, bgcolor: '#1e1e1e', color: '#d4d4d4',
            }}>
              {/* OUTPUT tab */}
              {outputTab === 0 && (
                <>
                  {!result && running && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'center' }}>
                      <CircularProgress size={16} sx={{ color: '#569cd6' }} />
                      <Typography sx={{ color: '#808080', fontSize: 12, fontFamily: 'monospace' }}>
                        Waiting for result...
                      </Typography>
                    </Box>
                  )}
                  {result?.error && (
                    <Box sx={{ p: 1, mb: 1, bgcolor: '#3b1111', borderRadius: 1, color: '#f48771' }}>
                      Error: {result.error}
                    </Box>
                  )}
                  {result?.output && (
                    <SkillOutputRenderer content={result.output} />
                  )}
                </>
              )}

              {/* LOGS tab */}
              {outputTab === 1 && (
                <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#b5cea8' }}>
                  {result ? ((result.logs || []).join('\n') || '(no logs)') : running ? 'Running...' : '(no logs)'}
                </Box>
              )}

              {/* TOOL CALLS tab */}
              {outputTab === 2 && (
                <Box>
                  {!result?.toolCalls?.length ? (
                    <Typography sx={{ color: '#808080', fontFamily: 'inherit' }}>
                      {running ? 'Running...' : '(no tool calls)'}
                    </Typography>
                  ) : (
                    result.toolCalls.map((tc, i) => (
                      <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: '#252526', borderRadius: 1, border: '1px solid #333' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#dcdcaa', mb: 0.5 }}>
                          🔧 {tc.toolName}
                          <Typography component="span" sx={{ color: '#808080', fontSize: 11, ml: 1 }}>
                            {tc.duration}ms
                          </Typography>
                        </Typography>
                        <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 0.5 }}>Input:</Typography>
                        <Box component="pre" sx={{ fontSize: 11, m: 0, mt: 0.5, color: '#ce9178', overflowX: 'auto' }}>
                          {JSON.stringify(tc.input, null, 2)}
                        </Box>
                        <Typography sx={{ color: '#569cd6', fontSize: 11, mt: 1 }}>Output:</Typography>
                        <Box component="pre" sx={{
                          fontSize: 11, m: 0, mt: 0.5, color: '#b5cea8',
                          overflowX: 'auto', maxHeight: 200, overflow: 'auto',
                        }}>
                          {JSON.stringify(tc.output, null, 2)?.slice(0, 3000)}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
