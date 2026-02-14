import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Snackbar, Card, CardContent, LinearProgress } from '@mui/material';
import { SupportAgent } from '@mui/icons-material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ContactForm } from '../shared/ContactForm';

const API = '/api'; // Assuming the API path, adjust as necessary

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function MembersSupportPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const res = await fetch(`${API}/faqs`);
        const data = await res.json();
        setFaqs(data);
      } catch (err: unknown) {
        setError('Failed to load FAQs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleContactSupport = () => {
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ padding: 2, backgroundColor: 'bg' }}>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary' }}>
        Support
      </Typography>
      <ContactForm />
      {loading && <LinearProgress />}
      {error && (
        <Alert severity="error" onClose={handleSnackbarClose}>
          {error}
        </Alert>
      )}
      {!loading && !error && faqs.length === 0 && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No FAQs available at the moment.
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {faqs.map((faq) => (
          <Grid item xs={12} md={6} key={faq.id}>
            <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="h6">{faq.question}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {faq.answer}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        hello
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SupportAgent />}
        onClick={handleContactSupport}
        sx={{ mt: 3 }}
      >
        Contact Support
      </Button>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success">
          Your request has been submitted to support!
        </Alert>
      </Snackbar>
    </Box>
  );
}