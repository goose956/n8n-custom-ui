import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, CircularProgress,
  Button, Chip, Divider, Fade,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  AutoFixHigh as AIIcon,
  Close as CloseIcon,
  ContentCopy as LoadIcon,
  DeleteSweep as ClearIcon,
  Build as ToolIcon,
  Description as SkillIcon,
} from '@mui/icons-material';
import { API } from '../config/api';

// ── Types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  skill?: any;
  tool?: any;
}

interface SkillBuilderChatProps {
  onClose: () => void;
  onLoad: (data: { skill?: any; tool?: any }) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export function SkillBuilderChat({ onClose, onLoad }: SkillBuilderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm the Skill Builder. I'll help you create **Tools** (executable code) and **Skills** (AI prompts that use tools).\n\nTell me what you want to build, for example:\n- \"Research any topic using web search\"\n- \"Monitor an email inbox and summarise new messages\"\n- \"Scrape a website and extract data\"\n- \"Generate a daily report from an API\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      // Send only role+content (strip generated objects)
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content !== messages[0]?.content))
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(`${API.skills}/builder/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await resp.json();

      if (data.success) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.reply,
          skill: data.skill || undefined,
          tool: data.tool || undefined,
        };
        setMessages([...newMessages, assistantMsg]);
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: `Error: ${data.reply || 'Something went wrong. Check your API key in Settings.'}`,
        }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Connection error: ${err.message}. Is the backend running?`,
      }]);
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. What would you like to build?",
    }]);
  };

  // Strip tool-json and skill-json blocks from displayed text
  const formatContent = (content: string) => {
    return content
      .replace(/```tool-json[\s\S]*?```/g, '')
      .replace(/```skill-json[\s\S]*?```/g, '')
      .trim();
  };

  return (
    <Fade in>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 440,
          height: 580,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'primary.200',
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1, bgcolor: 'primary.main', color: 'primary.contrastText',
        }}>
          <AIIcon sx={{ fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }}>
            Skill Builder
          </Typography>
          <IconButton size="small" onClick={clearChat} sx={{ color: 'inherit' }}>
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box ref={scrollRef} sx={{
          flex: 1, overflow: 'auto', p: 1.5,
          display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          {messages.map((msg, idx) => (
            <Box key={idx}>
              {/* Message bubble */}
              <Box sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: msg.role === 'user' ? 'secondary.100' : 'primary.100',
                  flexShrink: 0, mt: 0.25,
                }}>
                  {msg.role === 'user'
                    ? <UserIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    : <BotIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                </Box>
                <Paper variant="outlined" sx={{
                  px: 1.5, py: 1, maxWidth: '85%',
                  bgcolor: msg.role === 'user' ? 'secondary.50' : 'grey.50',
                  borderColor: msg.role === 'user' ? 'secondary.200' : 'grey.300',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                }}>
                  <Typography variant="body2" sx={{
                    fontSize: '0.82rem', lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {formatContent(msg.content)}
                  </Typography>
                </Paper>
              </Box>

              {/* Generated tool card */}
              {msg.tool && (
                <Box sx={{ ml: 4.5, mt: 1 }}>
                  <Paper variant="outlined" sx={{
                    p: 1.5, bgcolor: 'secondary.50', borderColor: 'secondary.300', borderRadius: 1.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip size="small" icon={<ToolIcon sx={{ fontSize: 14 }} />} label="Tool"
                        color="secondary" sx={{ fontSize: '0.72rem', height: 22, fontWeight: 700 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{msg.tool.name}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      {msg.tool.description}
                    </Typography>
                    {msg.tool.parameters?.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {msg.tool.parameters.map((p: any, i: number) => (
                          <Chip key={i} size="small" variant="outlined" label={`${p.name}: ${p.type}`}
                            sx={{ fontSize: '0.7rem', height: 20 }} />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Generated skill card */}
              {msg.skill && (
                <Box sx={{ ml: 4.5, mt: 1 }}>
                  <Paper variant="outlined" sx={{
                    p: 1.5, bgcolor: 'success.50', borderColor: 'success.300', borderRadius: 1.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip size="small" icon={<SkillIcon sx={{ fontSize: 14 }} />} label="Skill"
                        color="success" sx={{ fontSize: '0.72rem', height: 22, fontWeight: 700 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{msg.skill.name}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      {msg.skill.description}
                    </Typography>
                    {msg.skill.tools?.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                        {msg.skill.tools.map((t: string, i: number) => (
                          <Chip key={i} size="small" variant="outlined" label={`🔧 ${t}`}
                            sx={{ fontSize: '0.7rem', height: 20 }} />
                        ))}
                      </Box>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<LoadIcon sx={{ fontSize: 14 }} />}
                      onClick={() => onLoad({ skill: msg.skill, tool: msg.tool })}
                      sx={{ textTransform: 'none', fontWeight: 700, mt: 0.5 }}
                    >
                      Save & Load into Workshop
                    </Button>
                  </Paper>
                </Box>
              )}
            </Box>
          ))}

          {/* Typing indicator */}
          {sending && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'primary.100', flexShrink: 0,
              }}>
                <BotIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              </Box>
              <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderRadius: '12px 12px 12px 2px' }}>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <CircularProgress size={12} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, alignItems: 'flex-end' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            size="small"
            placeholder="Describe what you want to build..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 2 } }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            sx={{
              bgcolor: 'primary.main', color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
              width: 36, height: 36,
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Paper>
    </Fade>
  );
}
