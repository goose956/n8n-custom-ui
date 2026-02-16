import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, Rating,
  IconButton, Tabs, Tab,
} from '@mui/material';
import Explore from '@mui/icons-material/Explore';
import Search from '@mui/icons-material/Search';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import Category from '@mui/icons-material/Category';
import AutoAwesome from '@mui/icons-material/AutoAwesome';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  uses: number;
  author: string;
  tags: string[];
  isFavorite: boolean;
}

const MOCK_TEMPLATES: Template[] = [
  { id: '1', title: 'Viral Hook Opener', description: 'Start your video with a hook that grabs attention in the first 3 seconds.', category: 'Hooks', rating: 4.8, uses: 12400, author: 'ScriptPro', tags: ['viral', 'hook', 'intro'], isFavorite: false },
  { id: '2', title: 'Product Review Script', description: 'A structured template for authentic product reviews that convert.', category: 'Reviews', rating: 4.5, uses: 8900, author: 'ContentKing', tags: ['review', 'product', 'affiliate'], isFavorite: true },
  { id: '3', title: 'Story Time Format', description: 'Tell compelling stories that keep viewers watching until the end.', category: 'Storytelling', rating: 4.7, uses: 15200, author: 'NarrateIt', tags: ['story', 'engagement', 'retention'], isFavorite: false },
  { id: '4', title: 'Tutorial Walkthrough', description: 'Step-by-step tutorial format perfect for educational content.', category: 'Education', rating: 4.3, uses: 6700, author: 'TeachTok', tags: ['tutorial', 'how-to', 'education'], isFavorite: false },
  { id: '5', title: 'Trending Sound Script', description: 'Adapt your content to trending sounds for maximum reach.', category: 'Trending', rating: 4.6, uses: 21000, author: 'TrendMaster', tags: ['trending', 'sound', 'viral'], isFavorite: true },
  { id: '6', title: 'Day in My Life', description: 'DITL format that builds personal connection with your audience.', category: 'Lifestyle', rating: 4.4, uses: 9300, author: 'LifeVlog', tags: ['lifestyle', 'vlog', 'personal'], isFavorite: false },
];

const CATEGORIES = ['All', 'Hooks', 'Reviews', 'Storytelling', 'Education', 'Trending', 'Lifestyle'];

export function MembersExploreTemplatesPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);

  const selectedCat = CATEGORIES[tab];
  const filtered = templates.filter(t => {
    const matchCat = selectedCat === 'All' || t.category === selectedCat;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const toggleFav = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color: '#fff', textAlign: 'center' }}>
        <Explore sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h4" fontWeight={700}>Explore Templates</Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Browse proven TikTok script templates to jumpstart your content</Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          fullWidth placeholder="Search templates..." size="small" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ maxWidth: 400 }}
        />
        <Chip icon={<AutoAwesome />} label={`${filtered.length} templates`} color="primary" variant="outlined" />
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
        {CATEGORIES.map((cat, i) => (
          <Tab key={cat} label={cat} icon={i === 0 ? <Category /> : undefined} iconPosition="start" />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        {filtered.map(t => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip label={t.category} size="small" color="primary" variant="outlined" />
                  <IconButton size="small" onClick={() => toggleFav(t.id)}>
                    {t.isFavorite ? <Favorite sx={{ color: '#e74c3c' }} /> : <FavoriteBorder />}
                  </IconButton>
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>{t.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t.description}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={t.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">{t.rating}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {t.tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: 11 }} />)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">{t.uses.toLocaleString()} uses</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>by {t.author}</Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button variant="contained" size="small" fullWidth startIcon={<ContentCopy />} sx={{ bgcolor: '#1976d2' }}>
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Search sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No templates found</Typography>
              <Typography variant="body2" color="text.disabled">Try adjusting your search or category filter</Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
