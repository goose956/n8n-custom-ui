import { useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, useMediaQuery, IconButton, Drawer } from '@mui/material';
import { AdminPanelSettings, Article, ContactSupport, Dashboard, Schedule } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation, Outlet } from 'react-router-dom';

const SIDEBAR_WIDTH = 260;
const PRIMARY = '#3498db';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/skills', label: 'AI Skills', icon: <Article /> },
    { path: '/workflows', label: 'Workflows', icon: <Schedule /> },
    { path: '/documents', label: 'Documents', icon: <Article /> },
    { path: '/api-keys', label: 'API Keys', icon: <Article /> },
    { path: '/admin', label: 'Admin', icon: <AdminPanelSettings /> },
    { path: '/contact', label: 'Contact', icon: <ContactSupport /> },
];

function SidebarContent({ currentPath }: { currentPath: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#111827', color: '#e5e7eb' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: PRIMARY, width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
          {'L'}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          LinkedIn Powerhouse
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={currentPath === item.path}
            sx={{
              mx: 1, borderRadius: 1.5, mb: 0.5,
              color: currentPath === item.path ? '#fff' : '#9ca3af',
              bgcolor: currentPath === item.path ? PRIMARY : 'transparent',
              '&:hover': { bgcolor: currentPath === item.path ? PRIMARY : 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export function MembersLayout() {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = <SidebarContent currentPath={location.pathname} />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {isMobile ? (
        <>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300 }}>
            <MenuIcon />
          </IconButton>
          <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}>
            {sidebar}
          </Drawer>
        </>
      ) : (
        <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
          {sidebar}
        </Box>
      )}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
