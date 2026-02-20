import { useState } from 'react';
import {
 Box, Typography, Paper, TextField, Button, Snackbar, Alert,
 CircularProgress, Grid, Avatar, Card, CardContent,
} from '@mui/material';
import Email from '@mui/icons-material/Email';
import Send from '@mui/icons-material/Send';
import CheckCircle from '@mui/icons-material/CheckCircle';
import AccessTime from '@mui/icons-material/AccessTime';
import Chat from '@mui/icons-material/Chat';
import SupportAgent from '@mui/icons-material/SupportAgent';

const API = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';


const COLORS = {
 primary: '#1976d2',
 secondary: '#0050ac',
 tint: '#1976d215',
 bg: '#fafbfc',
 border: 'rgba(0,0,0,0.06)',
 shadow: '0 2px 12px rgba(0,0,0,0.04)',
 shadowHover: '0 8px 25px rgba(0,0,0,0.08)',
 success: '#4caf50',
 warning: '#ff9800',
 error: '#e74c3c',
 blue: '#2196f3',
 purple: '#9b59b6',
};

const heroSx = {
 p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative' as const, overflow: 'hidden',
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '#1976d240' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px #1976d240',
 '&:hover': { boxShadow: '0 6px 20px #1976d260', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};


export function MembersContactPage() {
 const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
 const [sending, setSending] = useState(false);
 const [sent, setSent] = useState(false);
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.name || !form.email || !form.message) {
   setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
   return;
  }
  setSending(true);
  try {
   const res = await fetch(API + '/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, app_id: 12 }),
   });
   if (!res.ok) throw new Error('Failed');
   setSent(true);
   setForm({ name: '', email: '', subject: '', message: '' });
   setSnackbar({ open: true, message: 'Message sent successfully!', severity: 'success' });
  } catch {
   setSnackbar({ open: true, message: 'Failed to send message. Please try again.', severity: 'error' });
  } finally { setSending(false); }
 };

 const infoCards = [
  { icon: <Chat />, title: 'Email Support', desc: 'Available 24/7 for all inquiries.', color: COLORS.primary },
  { icon: <AccessTime />, title: 'Live Chat', desc: 'Chat with us daily from 9 AM to 5 PM.', color: COLORS.blue },
  { icon: <SupportAgent />, title: 'Knowledge Base', desc: 'Explore guides and FAQs anytime.', color: COLORS.success },
 ];

 return (
  <Box sx={{ maxWidth: 800, mx: 'auto' }}>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(200, -60, -40)} />
    <Box sx={floatingCircle(120, 20, 120, 0.05)} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
     <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Email /> Contact Us
     </Typography>
     <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>We're here to help you maximize your Pinterest experience!</Typography>
    </Box>
   </Paper>

   <Grid container spacing={2} sx={{ mb: 4 }}>
    {infoCards.map((c, i) => (
     <Grid item xs={12} sm={4} key={i}>
      <Card sx={cardSx}>
       <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: c.color + '15', color: c.color, mx: 'auto', mb: 1.5 }}>{c.icon}</Avatar>
        <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
        <Typography variant="caption" color="text.secondary">{c.desc}</Typography>
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>

   {sent ? (
    <Paper sx={{ ...sectionSx, textAlign: 'center', py: 6 }}>
     <Avatar sx={{ width: 72, height: 72, bgcolor: COLORS.success + '15', color: COLORS.success, mx: 'auto', mb: 2 }}>
      <CheckCircle sx={{ fontSize: 40 }} />
     </Avatar>
     <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Message Sent!</Typography>
     <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>Thank you for reaching out. We'll get back to you as soon as possible.</Typography>
     <Button variant="contained" onClick={() => setSent(false)} sx={gradientBtnSx}>Send Another Message</Button>
    </Paper>
   ) : (
    <Paper sx={sectionSx}>
     <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.5 }}>Send a Message</Typography>
     <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Fill in the form below and we'll respond within 24 hours</Typography>
     <form onSubmit={handleSubmit}>
      <Grid container spacing={2.5}>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth required label="Your Name" value={form.name}
         onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
       </Grid>
       <Grid item xs={12} sm={6}>
        <TextField fullWidth required label="Email Address" type="email" value={form.email}
         onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <TextField fullWidth label="Subject" value={form.subject}
         onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <TextField fullWidth required label="Message" multiline rows={5} value={form.message}
         onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
       </Grid>
       <Grid item xs={12}>
        <Button type="submit" variant="contained" size="large" disabled={sending}
         startIcon={sending ? <CircularProgress size={20} /> : <Send />}
         sx={{ ...gradientBtnSx, px: 4, py: 1.2 }}>
         {sending ? 'Sending...' : 'Send Message'}
        </Button>
       </Grid>
      </Grid>
     </form>
    </Paper>
   )}

   <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
    <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
   </Snackbar>
  </Box>
 );
}