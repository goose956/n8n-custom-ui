import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Avatar, Button, Tooltip, IconButton, Skeleton, CircularProgress } from '@mui/material';
import { Archive, TrendingUp, TrendingDown, Refresh, CheckCircle, Error, Visibility, ArrowUpward, ArrowDownward, MailOutline } from '@mui/icons-material';

type OutboxMessage = {
  id: string;
  recipient: string;
  status: 'delivered' | 'opened' | 'replied' | 'pending';
  sentAt: Date;
};

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function MembersOutboxPage() {
  const [messages, setMessages] = useState<OutboxMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/outbox/messages`)
      .then(response => response.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const messageCounts = useMemo(() => {
    const countByStatus: { [key: string]: number } = { delivered: 0, opened: 0, replied: 0, pending: 0 };
    messages.forEach(message => countByStatus[message.status]++);
    return countByStatus;
  }, [messages]);

  return (
    <Box sx={{ bgcolor: '#fafbfc', px: 4, py: 3 }}>
      <Box sx={{ mb: 4, p: 3, borderRadius: 16, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: 'white' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Archive sx={{ mr: 1 }} /> Outbox Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#f39c12', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
              <CardContent>
                <Typography variant="h5">{messageCounts.delivered}</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}><CheckCircle sx={{ mr: 1 }} /> Delivered</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1abc9c', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
              <CardContent>
                <Typography variant="h5">{messageCounts.opened}</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}><Visibility sx={{ mr: 1 }} /> Opened</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2ecc71', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
              <CardContent>
                <Typography variant="h5">{messageCounts.replied}</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}><MailOutline sx={{ mr: 1 }} /> Replied</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center', mt: 1 }} color="inherit"><ArrowUpward fontSize="small" sx={{ mr: 1 }} /> +15%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e74c3c', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
              <CardContent>
                <Typography variant="h5">{messageCounts.pending}</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}><Error sx={{ mr: 1 }} /> Pending</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center', mt: 1 }} color="inherit"><ArrowDownward fontSize="small" sx={{ mr: 1 }} /> -5%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <Archive sx={{ mr: 1 }} /> Sent Messages
        </Typography>
        <Tooltip title="Refresh">
          <IconButton sx={{ color: '#1976d2' }} onClick={() => setLoading(true)}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, p: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress size={50} />
          </Box>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <Box key={message.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mb: 1, bgcolor: message.status === 'opened' ? 'rgba(100,255,100,0.1)' : 'white', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2 }}>{message.recipient[0]}</Avatar>
                <Typography>{message.recipient}</Typography>
              </Box>
              <Typography>{formatDate(message.sentAt)}</Typography>
              <Chip
                label={message.status}
                color={message.status === 'replied' ? 'success' : message.status === 'delivered' ? 'default' : message.status === 'opened' ? 'primary' : 'warning'}
                icon={message.status === 'replied' ? <CheckCircle /> : message.status === 'delivered' ? <MailOutline /> : message.status === 'opened' ? <Visibility /> : <Error />}
              />
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', pt: 5, pb: 5 }}>
            <MailOutline sx={{ fontSize: 64, color: 'rgba(0,0,0,0.2)' }} />
            <Typography variant="subtitle1" gutterBottom>You haven't sent any messages yet.</Typography>
            <Button variant="contained" sx={{ mt: 2, bgcolor: '#1976d2', ':hover': { bgcolor: '#155a9c' } }}>Compose New Message</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}