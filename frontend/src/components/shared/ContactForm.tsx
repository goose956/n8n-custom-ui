import React from 'react';
import { Box, Typography, TextField, Button, Snackbar, Alert } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { API } from '../../config/api';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const { handleSubmit, control, reset } = useForm<ContactFormData>();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = React.useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const res = await fetch(API.appPlanner, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setSnackbarMessage('Message sent successfully!');
      setSnackbarSeverity('success');
      reset();
    } catch (error) {
      setSnackbarMessage('Failed to send message. Please try again later.');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: 'none',
      }}
    >
      <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
        Contact Us
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 500 }}>
        <Controller
          name="name"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              variant="outlined"
              fullWidth
              sx={{ mb: 2, backgroundColor: '#fafbfc', borderRadius: 2 }}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              variant="outlined"
              fullWidth
              sx={{ mb: 2, backgroundColor: '#fafbfc', borderRadius: 2 }}
            />
          )}
        />
        <Controller
          name="message"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="Message"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              sx={{ mb: 2, backgroundColor: '#fafbfc', borderRadius: 2 }}
            />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            py: 1.5,
            borderRadius: 3,
            ':hover': { backgroundColor: '#1560c3' },
          }}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}