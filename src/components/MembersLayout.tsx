import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Person, Settings, AdminPanelSettings, ContactSupport, Campaign, Template, Analytics } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

export function MembersLayout() {
  const location = useLocation();
  const pages = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/profile', label: 'Profile', icon: <Person /> },
    { path: '/settings', label: 'Settings', icon: <Settings /> },
    { path: '/admin', label: 'Admin', icon: <AdminPanelSettings /> },
    { path: '/contact', label: 'Contact Support', icon: <ContactSupport /> },
    { path: '/campaigns', label: 'Campaigns', icon: <Campaign /> },
    { path: '/templates', label: 'Templates', icon: <Template /> },
    { path: '/analytics', label: 'Analytics', icon: <Analytics /> },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fafbfc' }}>
      <Box sx={{ width: '240px', bgcolor: '#1a1a2e', color: 'white', padding: 2 }}>
        <Typography variant="h6" sx={{ marginBottom: 2 }}>Members Area</Typography>
        <List>
          {pages.map((page) => (
            <ListItem button component={Link} to={page.path} key={page.label} selected={location.pathname === page.path}>
              <ListItemIcon sx={{ color: 'white' }}>{page.icon}</ListItemIcon>
              <ListItemText primary={page.label} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        {/* Main content will be rendered here based on the selected route */}
      </Box>
    </Box>
  );
}