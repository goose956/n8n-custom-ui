import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton, Alert, Grid,
  CircularProgress, Tooltip, Divider, LinearProgress, Card, CardContent, Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArticleIcon from '@mui/icons-material/Article';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = 15;

/* ── Skill Widget helpers (auto-injected) ─────────────────── */
// [SkillWidget helpers here] - Already provided above, not to be redefined

export function MembersArticleAndImageCreatorPage() {
  const [articleSize, setArticleSize] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const handleDownload = () => {
    // Handle download logic
  };

  return (
    <Box sx={{ px: 3, py: 4 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16, p: 3, mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#fafbfc', mb: 1 }}>
          <ArticleIcon sx={{ mr: 1 }} /> Article & Image Creator
        </Typography>
        <Typography variant="body1" sx={{ color: '#e0e0e0' }}>
          Create compelling articles and design stunning images tailored for your YouTube scripts. 
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
            <CardContent>
              <Typography variant="h6">
                <PhotoCameraIcon sx={{ mr: 1, color: '#1976d2' }} /> Images Created
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ color: '#27ae60', fontWeight: 600 }}>120</Typography>
                <Chip
                  icon={<ArrowUpwardIcon />}
                  label="+12%"
                  sx={{ ml: 1, color: '#27ae60', fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
            <CardContent>
              <Typography variant="h6">
                <ArticleIcon sx={{ mr: 1, color: '#1976d2' }} /> Articles Created
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ color: '#e74c3c', fontWeight: 600 }}>50</Typography>
                <Chip
                  icon={<ArrowDownwardIcon />}
                  label="-8%"
                  sx={{ ml: 1, color: '#e74c3c', fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
            <CardContent>
              <Typography variant="h6">
                <CheckCircleIcon sx={{ mr: 1, color: '#1976d2' }} /> Successful Creations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ color: '#00bcd4', fontWeight: 600 }}>85%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <SmartToyIcon sx={{ mr: 1, color: '#1976d2' }} /> Customize Your Article
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Article Size (words)"
            type="number"
            fullWidth
            value={articleSize}
            onChange={(e) => setArticleSize(Number(e.target.value))}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudDownloadIcon />}
          onClick={handleDownload}
          sx={{
            background: 'linear-gradient(135deg, #1976d2, #0050ac)',
            borderRadius: 10,
            '&:hover': {
              background: 'linear-gradient(135deg, #0050ac, #1976d2)',
            },
          }}
        >
          Download Your Creation
        </Button>
      </Paper>

      {isLoading ? (
        <CircularProgress color="primary" />
      ) : (
        <SkillWidget placeholder="Describe the YouTube script you need..." title="AI Article & Image Assistant" />
      )}

      {dataError && <Alert severity="error" sx={{ mt: 3 }}>{dataError}</Alert>}
    </Box>
  );
}