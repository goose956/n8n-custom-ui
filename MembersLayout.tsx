import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Person, Settings, Announcement, ContactMail, Campaign, BarChart, WiFi, Insight } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Profile', icon: <Person />, path: '/profile' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
  { label: 'Admin', icon: <Announcement />, path: '/admin' },
  { label: 'Contact', icon: <ContactMail />, path: '/contact' },
  { label: 'Campaigns', icon: <Campaign />, path: '/campaigns' },
  { label: 'Analytics', icon: <BarChart />, path: '/analytics' },
  { label: 'Integrations', icon: <WiFi />, path: '/integrations' },
];

export function MembersLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', background: '#fafbfc', height: '100vh' }}>
      <Box sx={{ width: 240, bgcolor: '#1a1a2e', color: 'white' }}>
        <Typography variant="h5" sx={{ padding: 2 }}>
          LinkedIn Automation
        </Typography>
        <List>
          {navigationItems.map((item) => (
            <ListItem button component={Link} to={item.path} key={item.label} selected={location.pathname === item.path}>
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ sx: { color: 'white' }}} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Main content will be rendered here */}
      </Box>
    </Box>
  );
}