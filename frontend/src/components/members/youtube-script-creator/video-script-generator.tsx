import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
 Box, Typography, Paper, Button, TextField, IconButton, Alert, Grid,
 CircularProgress, Tooltip, Skeleton, Card, CardContent, Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const APP_ID = 15;

// Definitions provided in the code block above

export function MembersVideoScriptGeneratorPage() {
  const [statLoading, setStatLoading] = useState(true);
  const [stats, setStats] = useState<{ scriptsGenerated: number; seoOptimizations: number; audienceCaptured: number; } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(API_BASE + '/api/stats/video-script-generator');
        const result = await response.json();
        setStats(result);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ p: 3, bgcolor: '#fafbfc' }}>
      <Box sx={{ mb: 4, p: 3, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: '#fff' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon fontSize="large" />
          Enhance Your YouTube Scripts with AI
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Leverage AI to create engaging and SEO-optimized YouTube video scripts that captivate your audience.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statLoading ? (
          Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3 }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={100} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          stats && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      <ArticleIcon color="primary" />
                      Scripts Generated
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 2 }}>{stats.scriptsGenerated}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      <TextSnippetIcon color="secondary" />
                      SEO Optimizations
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 2 }}>{stats.seoOptimizations}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                      <TrendingUpIcon style={{ color: '#27ae60' }} />
                      Audience Captured
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 2 }}>{stats.audienceCaptured}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )
        )}
      </Grid>

      <SkillWidget placeholder="Describe your YouTube script needs..." title="AI-Powered Script Generation" />
    </Box>
  );
}