import React, { useState, FormEvent } from 'react';
import { Box, Typography, Grid, TextField, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { API } from '../../config/api';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API.apps}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        throw new Error('Failed to submit the contact form');
      }
      setSuccess('Your message has been sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fafbfc', borderRadius: 2, marginTop: 5 }}>
      <Typography variant="h4" sx={{ marginBottom: 2, color: '#1976d2' }}>Contact Us</Typography>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="message"
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)' }}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Send Message'}
            </Button>
          </Grid>
        </Grid>
      </form>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        {error ? (
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : (
          success && (
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              {success}
            </Alert>
          )
        )}
      </Snackbar>
    </Box>
  );
}