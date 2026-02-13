import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, Box, Typography, InputBase, List, ListItemButton,
  ListItemIcon, ListItemText, Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as ProjectsIcon,
  Widgets as AppsIcon,
  TravelExplore as ResearchIcon,
  AccountTree as WorkflowIcon,
  Build as BuilderIcon,
  Article as PagesIcon,
  ViewQuilt as TemplateIcon,
  RssFeed as BlogIcon,
  SmartToy as ProgrammerIcon,
  Visibility as PreviewIcon,
  Forum as SocialIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  // Main pages
  { label: 'Dashboard', path: '/', icon: <ProjectsIcon />, category: 'Navigation', keywords: ['home', 'overview', 'dashboard'] },
  { label: 'Projects', path: '/projects', icon: <ProjectsIcon />, category: 'Navigation', keywords: ['apps', 'create', 'manage'] },
  { label: 'App Planner', path: '/apps', icon: <AppsIcon />, category: 'Navigation', keywords: ['plan', 'ideas', 'planner'] },
  { label: 'Research', path: '/research', icon: <ResearchIcon />, category: 'Navigation', keywords: ['search', 'ai', 'query', 'analyze'] },
  { label: 'Social Monitor', path: '/social', icon: <SocialIcon />, category: 'Navigation', keywords: ['reddit', 'monitor', 'posts', 'keywords'] },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon />, category: 'Navigation', keywords: ['stats', 'charts', 'views', 'errors', 'api usage'] },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon />, category: 'Navigation', keywords: ['config', 'api keys', 'n8n', 'stripe'] },

  // Automations
  { label: 'Workflows', path: '/workflows', icon: <WorkflowIcon />, category: 'Automations', keywords: ['n8n', 'automate', 'trigger'] },
  { label: 'Workflow Builder', path: '/builder', icon: <BuilderIcon />, category: 'Automations', keywords: ['build', 'ai', 'chat', 'create workflow'] },

  // App Builder
  { label: 'Pages', path: '/pages', icon: <PagesIcon />, category: 'App Builder', keywords: ['edit', 'content', 'page agent'] },
  { label: 'Templates', path: '/templates', icon: <TemplateIcon />, category: 'App Builder', keywords: ['template', 'gallery', 'marketplace'] },
  { label: 'Blog Engine', path: '/blog', icon: <BlogIcon />, category: 'App Builder', keywords: ['blog', 'ai', 'seo', 'content', 'publish'] },
  { label: 'AI Programmer', path: '/programmer', icon: <ProgrammerIcon />, category: 'App Builder', keywords: ['code', 'generate', 'members', 'build'] },
  { label: 'Preview', path: '/preview', icon: <PreviewIcon />, category: 'App Builder', keywords: ['preview', 'view', 'render'] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q) ||
               item.category.toLowerCase().includes(q) ||
               item.keywords.some(k => k.includes(q));
      })
    : SEARCH_ITEMS;

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path);
    }
  };

  // Group by category
  const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  let flatIdx = 0;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          position: 'fixed',
          top: '15%',
          m: 0,
          boxShadow: '0 16px 70px rgba(0,0,0,0.25)',
        },
      }}
      BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' } }}
    >
      {/* Search input */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <SearchIcon sx={{ color: '#999', mr: 1.5, fontSize: 22 }} />
        <InputBase
          inputRef={inputRef}
          placeholder="Search pages, tools, actions..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{ fontSize: '1rem', fontWeight: 500 }}
        />
        <Chip
          label="ESC"
          size="small"
          onClick={() => setOpen(false)}
          sx={{
            height: 22, fontWeight: 700, fontSize: '0.65rem',
            bgcolor: 'rgba(0,0,0,0.06)', color: '#999',
            cursor: 'pointer',
          }}
        />
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: 380, overflow: 'auto', py: 1 }}>
        {filtered.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No results for "{query}"</Typography>
          </Box>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <Box key={category}>
              <Typography sx={{ px: 2.5, pt: 1.5, pb: 0.5, fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {category}
              </Typography>
              <List disablePadding>
                {items.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <ListItemButton
                      key={item.path}
                      selected={idx === selectedIndex}
                      onClick={() => handleSelect(item.path)}
                      sx={{
                        mx: 1, borderRadius: 2, py: 1, mb: 0.25,
                        '&.Mui-selected': { bgcolor: 'rgba(102,126,234,0.08)' },
                        '&.Mui-selected:hover': { bgcolor: 'rgba(102,126,234,0.12)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: idx === selectedIndex ? '#667eea' : '#888' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: idx === selectedIndex ? 700 : 500 }}
                      />
                      {idx === selectedIndex && (
                        <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                          Enter ↵
                        </Typography>
                      )}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 1, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
          ↑↓ Navigate
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
          ↵ Open
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
          Esc Close
        </Typography>
      </Box>
    </Dialog>
  );
}
