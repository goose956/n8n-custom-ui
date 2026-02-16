```typescript
import { useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Dashboard, Person, Settings, Analytics, Create, Screenshare, ListAlt, MonetizationOn } from '@mui/icons-material';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function MembersLayout() {
    const location = useLocation();
    const [navItems] = useState([
        { name: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { name: 'Profile', icon: <Person />, path: '/profile' },
        { name: 'Settings', icon: <Settings />, path: '/settings' },
        { name: 'Analytics', icon: <Analytics />, path: '/analytics' },
        { name: 'Script Generator', icon: <Create />, path: '/script-generator' },
        { name: 'Video Analysis', icon: <Screenshare />, path: '/video-analysis' },
        { name: 'Billing', icon: <MonetizationOn />, path: '/billing' },
        { name: 'Admin Panel', icon: <ListAlt />, path: '/admin' },
    ]);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fafbfc' }}>
            <Box sx={{ width: 240, bgcolor: '#1a1a2e', padding: 2 }}>
                <Typography variant="h5" sx={{ color: '#fff', marginBottom: 2 }}>Members Area</Typography>
                <Divider sx={{ bgcolor: '#333' }} />
                {navItems.map(item => (
                    <Link to={item.path} key={item.name} style={{ textDecoration: 'none', color: location.pathname === item.path ? '#1976d2' : '#ffffff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', padding: 1, borderRadius: 2, '&:hover': { backgroundColor: '#333' } }}>
                            {item.icon}
                            <Typography sx={{ marginLeft: 1 }}>{item.name}</Typography>
                        </Box>
                    </Link>
                ))}
            </Box>
            <Box sx={{ flexGrow: 1, padding: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
}
```