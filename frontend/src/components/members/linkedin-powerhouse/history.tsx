import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent,
  IconButton, Avatar, Chip, Badge, Skeleton, Button, Tooltip, Divider
} from '@mui/material';
import {
  Message as MessageIcon, TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon, Search as SearchIcon, Visibility as VisibilityIcon,
  Edit as EditIcon, Delete as DeleteIcon, Error as ErrorIcon
} from '@mui/icons-material';

interface MessageHistory {
  id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  responseTime: string;
  engagementLevel: number;
}

export function MembersHistoryPage() {
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchMessages = async () => {
    try {
      const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
      const response = await fetch(`${API_BASE}/api/messages`);
      const data: MessageHistory[] = await response.json();
      setMessages(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <Skeleton variant="rectangular" height={400} />;
    }
    if (error) {
      return (
        <Box textAlign="center">
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong while fetching your message history.
          </Typography>
          <Button variant="contained" color="primary" onClick={fetchMessages} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        </Box>
      );
    }
    if (messages.length === 0) {
      return (
        <Box textAlign="center">
          <MessageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You haven't sent any messages with LinkedIn powerhouse yet.
          </Typography>
          <Button variant="contained" color="primary" startIcon={<SearchIcon />}>
            Discover Contacts
          </Button>
        </Box>
      );
    }
    return (
      <Grid container spacing={2}>
        {messages.map((message) => (
          <Grid item xs={12} key={message.id}>
            <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle1">
                      <Chip
                        icon={message.status === 'read' ? <TrendingUpIcon /> : <MessageIcon />}
                        label={message.status}
                        color={message.status === 'read' ? 'success' : 'default'}
                        sx={{ mb: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Engagement Level: {message.engagementLevel}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View">
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1">
                  {message.content}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Response Time: {message.responseTime}
                  </Typography>
                  <Badge badgeContent={message.engagementLevel > 50 ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}>
                    <Typography variant="caption">
                      Engagement
                    </Typography>
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 4, px: 2 }}>
      <Paper sx={{ p: 3, mb: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}>
        <Typography variant="h6" color="text.primary" component="div" gutterBottom>
          <MessageIcon sx={{ verticalAlign: 'bottom', mr: 1 }} />
          Message History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review all your past LinkedIn powerhouse messages, including delivery statuses and engagement levels.
        </Typography>
      </Paper>
      {renderContent()}
    </Box>
  );
}