import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Button, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SettingsPage from './components/SettingsPage';
import { WorkflowsPage } from './components/WorkflowsPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function Navigation() {
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Box component="span" sx={{ fontWeight: 'bold', mr: 3, fontSize: '1.25rem' }}>
            n8n Custom UI
          </Box>
        </Box>
        <Button
          color="inherit"
          component={Link}
          to="/settings"
          variant={location.pathname === '/settings' ? 'outlined' : 'text'}
        >
          Settings
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/workflows"
          variant={location.pathname === '/workflows' ? 'outlined' : 'text'}
          sx={{ ml: 2 }}
        >
          Workflows
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navigation />
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/" element={<SettingsPage />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
