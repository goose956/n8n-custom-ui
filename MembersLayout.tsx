import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Person, Settings, AdminPanelSettings, ContactMail, ContentPaste, Queue, Reply, ShowChart, Automation } from '@mui/icons-material';
import { useLocation, Link } from 'react-router-dom';
import { FC } from 'react';

export const MembersLayout: FC = () => {
    const location = useLocation();
    const pages = [
        { path: "/dashboard", label: "Dashboard", icon: <Dashboard /> },
        { path: "/profile", label: "Profile", icon: <Person /> },
        { path: "/settings", label: "Settings", icon: <Settings /> },
        { path: "/admin", label: "Admin Panel", icon: <AdminPanelSettings /> },
        { path: "/contact", label: "Contact Support", icon: <ContactMail /> },
        { path: "/content-scraper", label: "Content Scraper", icon: <ContentPaste /> },
        { path: "/tweet-queue", label: "Tweet Queue", icon: <Queue /> },
        { path: "/auto-replies", label: "Auto Replies", icon: <Reply /> },
        { path: "/analytics", label: "Analytics", icon: <ShowChart /> },
        { path: "/automation-rules", label: "Automation Rules", icon: <Automation /> },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: '#fafbfc', height: '100vh' }}>
            <Box sx={{ width: '250px', bgcolor: '#1a1a2e', color: '#fff', padding: 2 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Twitter Automation</Typography>
                <List>
                    {pages.map(({ path, label, icon }) => (
                        <ListItem button component={Link} to={path} key={path} sx={{
                            bgcolor: location.pathname === path ? '#1976d2' : 'inherit',
                            color: location.pathname === path ? '#fff' : '#b0bec5',
                            '&:hover': {
                                backgroundColor: location.pathname === path ? '#1976d2' : '#364547',
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'inherit' }}>{icon}</ListItemIcon>
                            <ListItemText primary={label} />
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Box sx={{ flexGrow: 1, padding: 3 }}>
                {/* Main content area would be here */}
            </Box>
        </Box>
    );
};