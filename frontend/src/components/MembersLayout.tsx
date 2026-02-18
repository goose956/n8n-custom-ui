import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Dashboard, Settings, Person, Campaign, Analytics, Message, ContactMail, Code } from '@mui/icons-material';
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

// Define routes for the members area
const routes = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/profile', label: 'Profile Management', icon: <Person /> },
    { path: '/settings', label: 'Account Settings', icon: <Settings /> },
    { path: '/campaigns', label: 'Manage Campaigns', icon: <Campaign /> },
    { path: '/analytics', label: 'Campaign Analytics', icon: <Analytics /> },
    { path: '/templates', label: 'Message Templates', icon: <Message /> },
    { path: '/contact', label: 'Contact Us', icon: <ContactMail /> },
    { path: '/goldie', label: 'Goldie', icon: <Code /> },
];

export function MembersLayout() {
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(true); // State to manage sidebar visibility

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fafbfc' }}>
            <Drawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                sx={{ width: 240, flexShrink: 0, '& .MuiDrawer-paper': { width: 240, bgcolor: '#1a1a2e' } }}
            >
                <Box sx={{ padding: 2, bgcolor: '#1976d2', color: '#ffffff', textAlign: 'center' }}>
                    <Typography variant="h6">LinkedIn Automation</Typography>
                </Box>
                <List>
                    {routes.map((route) => (
                        <ListItem
                            button
                            component={Link}
                            to={route.path}
                            key={route.label}
                            selected={location.pathname === route.path}
                            sx={{ color: location.pathname === route.path ? '#1976d2' : 'white' }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>{route.icon}</ListItemIcon>
                            <ListItemText primary={route.label} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* Main content will be rendered here */}
            </Box>
        </Box>
    );
}