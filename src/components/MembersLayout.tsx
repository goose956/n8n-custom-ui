import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from'@mui/material';
import { Dashboard, AccountCircle, Settings, BarChart, MonetizationOn, LibraryBooks, Forum, AdminPanelSettings } from'@mui/icons-material';
import { useState } from'react';
import { useLocation, Link } from'react-router-dom';

const pages = [
 { name:'Dashboard', icon: <Dashboard />, path:'/dashboard' },
 { name:'Profile', icon: <AccountCircle />, path:'/profile' },
 { name:'Settings', icon: <Settings />, path:'/settings' },
 { name:'Script Library', icon: <LibraryBooks />, path:'/script-library' },
 { name:'Analytics', icon: <BarChart />, path:'/analytics' },
 { name:'Community', icon: <Forum />, path:'/community' },
 { name:'Billing', icon: <MonetizationOn />, path:'/billing' },
 { name:'Admin', icon: <AdminPanelSettings />, path:'/admin' },
];

export function MembersLayout({ children }: { children: React.ReactNode }) {
 const location = useLocation();
 const [drawerOpen, setDrawerOpen] = useState(true);

 return (
 <Box sx={{ display:'flex', backgroundColor:'#fafbfc', height:'100vh' }}>
 <Drawer
 variant="permanent"
 sx={{
 width: 240,
 flexShrink: 0,
'& .MuiDrawer-paper': {
 width: 240,
 backgroundColor:'#1a1a2e',
 color:'#fff',
 },
 }}
 >
 <Toolbar>
 <Typography variant="h6">Members Area</Typography>
 </Toolbar>
 <List>
 {pages.map(({ name, icon, path }) => (
 <ListItem button component={Link} to={path} key={name} selected={location.pathname === path}>
 <ListItemIcon sx={{ color: location.pathname === path ?'#1976d2' :'#fff' }}>
 {icon}
 </ListItemIcon>
 <ListItemText primary={name} sx={{ color: location.pathname === path ?'#1976d2' :'#fff' }} />
 </ListItem>
 ))}
 </List>
 </Drawer>
 <Box
 component="main"
 sx={{ flexGrow: 1, bgcolor:'#fafbfc', p: 3 }}
 >
 <Toolbar />
 {children}
 </Box>
 </Box>
 );
}