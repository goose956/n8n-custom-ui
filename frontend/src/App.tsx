import { CssBaseline, ThemeProvider, createTheme, Box, Typography, Button, Avatar, Tooltip, Chip } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SettingsPage from './components/SettingsPage';
import { WorkflowsPage } from './components/WorkflowsPage';
import { ProjectsPage } from './components/ProjectsPage';
import { TemplatesPage } from './components/TemplatesPage';
import { PagesPage } from './components/PagesPage';
import AnalyticsPage from './components/AnalyticsPage';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  AccountTree as WorkflowIcon,
  ViewQuilt as TemplateIcon,
  Article as PagesIcon,
  BarChart as AnalyticsIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8f9ef5',
      dark: '#5a6fd6',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#fafbfc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#666',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none' as const,
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#888',
            fontSize: '0.8rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fafbfc',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f5f5f5',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Projects', path: '/projects', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { label: 'Workflows', path: '/workflows', icon: <WorkflowIcon sx={{ fontSize: 18 }} /> },
  { label: 'Templates', path: '/templates', icon: <TemplateIcon sx={{ fontSize: 18 }} /> },
  { label: 'Pages', path: '/pages', icon: <PagesIcon sx={{ fontSize: 18 }} /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon sx={{ fontSize: 18 }} /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon sx={{ fontSize: 18 }} /> },
];

function Navigation() {
  const location = useLocation();

  return (
    <Box
      sx={{
        bgcolor: '#1a1a2e',
        color: 'white',
        px: 3,
        py: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Logo */}
      <Box
        component={Link}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          color: 'white',
          mr: 4,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BoltIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
          n8n Surface
        </Typography>
      </Box>

      {/* Nav Items */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/projects' && location.pathname === '/');
          return (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              startIcon={item.icon}
              sx={{
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                bgcolor: isActive ? 'rgba(102,126,234,0.2)' : 'transparent',
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.06)',
                  color: 'white',
                },
                '&::after': isActive ? {
                  content: '""',
                  position: 'absolute',
                  bottom: -1,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                } : {},
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>

      {/* Right side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip
          label="Beta"
          size="small"
          sx={{
            bgcolor: 'rgba(102,126,234,0.2)',
            color: '#a0b0ff',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22,
            border: '1px solid rgba(102,126,234,0.3)',
          }}
        />
        <Tooltip title="Profile">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(102,126,234,0.3)',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.15)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
            }}
          >
            R
          </Avatar>
        </Tooltip>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
          <Navigation />
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/pages" element={<PagesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/" element={<ProjectsPage />} />
          </Routes>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App;
