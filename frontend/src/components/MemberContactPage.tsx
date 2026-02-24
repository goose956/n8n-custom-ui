import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Alert,
  Snackbar, MenuItem, Avatar,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  CheckCircle as SentIcon,
} from '@mui/icons-material';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SUBJECTS = [
  'General Inquiry',
  'Bug Report',
  'Feature Request',
  'Billing',
  'Other',
];

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: FormState = { name: '', email: '', subject: 'General Inquiry', message: '' };

export function MemberContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
          app_id: 'members-area',
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSent(true);
      setForm(INITIAL_FORM);
    } catch (err: any) {
      setError('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  }, [form]);

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Avatar sx={{ mx: 'auto', mb: 1.5, width: 56, height: 56, bgcolor: '#667eea18', color: '#667eea' }}>
            <EmailIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Contact Us</Typography>
          <Typography variant="body2" color="text.secondary">
            Have a question, bug report, or feature request? Send us a message.
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Name" required fullWidth size="small"
                value={form.name} onChange={handleChange('name')}
                disabled={sending}
              />
              <TextField
                label="Email" required fullWidth size="small" type="email"
                value={form.email} onChange={handleChange('email')}
                disabled={sending}
              />
            </Box>
            <TextField
              label="Subject" select fullWidth size="small"
              value={form.subject} onChange={handleChange('subject')}
              disabled={sending}
            >
              {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField
              label="Message" required fullWidth multiline rows={5}
              value={form.message} onChange={handleChange('message')}
              disabled={sending}
              placeholder="Describe your question or issue..."
            />
            <Button
              variant="contained" size="large" disableElevation
              onClick={handleSubmit} disabled={sending}
              startIcon={sending ? <CircularProgress size={18} /> : <SendIcon />}
              sx={{
                py: 1.3, fontWeight: 700, fontSize: 15,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={sent} autoHideDuration={5000} onClose={() => setSent(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSent(false)} severity="success" variant="filled" icon={<SentIcon />}>
          Message sent successfully! We'll get back to you soon.
        </Alert>
      </Snackbar>
    </Box>
  );
}
