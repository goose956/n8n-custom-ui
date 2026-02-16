import { useState, useEffect, useCallback, useMemo } from'react';
import { API_BASE_URL, API } from'./config/api';
import { CssBaseline, ThemeProvider, createTheme, Box, Typography, Button, Avatar, Tooltip, Chip, Popover, CircularProgress, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Badge, Drawer, useMediaQuery } from'@mui/material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from'react-router-dom';
import SettingsPage from'./components/SettingsPage';
import { WorkflowsPage } from'./components/WorkflowsPage';
import { ProjectsPage } from'./components/ProjectsPage';
import { TemplatesPage } from'./components/TemplatesPage';
import { PagesPage } from'./components/PagesPage';
import AnalyticsPage from'./components/AnalyticsPage';
import { WorkflowBuilderPage } from'./components/WorkflowBuilderPage';
import { AppsPage } from'./components/AppsPage';
import { ResearchPage } from'./components/ResearchPage';
import { ProgrammerAgentPage } from'./components/ProgrammerAgentPage';
import { SocialMonitorPage } from'./components/SocialMonitorPage';
import { AppPreviewPage } from'./components/AppPreviewPage';
import { BlogPage } from'./components/BlogPage';
import { DashboardPage } from'./components/DashboardPage';
import { FunnelBuilderPage } from'./components/FunnelBuilderPage';
import { GlobalSearch } from'./components/shared/GlobalSearch';
import {
 Dashboard as DashboardIcon,
 Settings as SettingsIcon,
 AccountTree as WorkflowIcon,
 ViewQuilt as TemplateIcon,
 Article as PagesIcon,
 BarChart as AnalyticsIcon,
 Bolt as BoltIcon,
 Build as BuildIcon,
 Widgets as AppsIcon,
 Circle as CircleIcon,
 Refresh as RefreshIcon,
 TravelExplore as ResearchIcon,
 SmartToy as ProgrammerIcon,
 Forum as SocialIcon,
 Visibility as PreviewIcon,
 Construction as AppBuilderIcon,
 AccountTree as FunnelIcon,
 ExpandMore as ExpandMoreIcon,
 AutoFixHigh as AutomationsIcon,
 RssFeed as BlogIcon,
 Search as SearchIcon,
 DarkMode as DarkModeIcon,
 LightMode as LightModeIcon,
 Notifications as NotificationsIcon,
 Menu as MenuIcon,
 Close as CloseIcon,
 Home as HomeIcon,
} from'@mui/icons-material';

const lightTheme = createTheme({
 palette: {
 mode:'light',
 primary: {
 main:'#667eea',
 light:'#8f9ef5',
 dark:'#5a6fd6',
 },
 secondary: {
 main:'#764ba2',
 },
 background: {
 default:'#fafbfc',
 paper:'#ffffff',
 },
 text: {
 primary:'#1a1a2e',
 secondary:'#666',
 },
 },
 typography: {
 fontFamily:'"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
 h4: { fontWeight: 800, letterSpacing:'-0.01em' },
 h5: { fontWeight: 700 },
 h6: { fontWeight: 700 },
 subtitle1: { fontWeight: 600 },
 subtitle2: { fontWeight: 700 },
 button: { textTransform:'none' as const, fontWeight: 600 },
 },
 shape: {
 borderRadius: 12,
 },
 components: {
 MuiButton: {
 styleOverrides: {
 root: {
 borderRadius: 10,
 textTransform:'none' as const,
 fontWeight: 600,
 },
 contained: {
 boxShadow:'none',
'&:hover': { boxShadow:'0 4px 12px rgba(102,126,234,0.3)' },
 },
 },
 },
 MuiPaper: {
 styleOverrides: {
 root: {
 borderRadius: 16,
 boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
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
 color:'#888',
 fontSize:'0.8rem',
 textTransform:'uppercase' as const,
 letterSpacing:'0.05em',
 borderBottom:'1px solid #f0f0f0',
 backgroundColor:'#fafbfc',
 },
 },
 },
 },
 MuiTableCell: {
 styleOverrides: {
 root: {
 borderBottom:'1px solid #f5f5f5',
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

const darkTheme = createTheme({
 palette: {
 mode:'dark',
 primary: {
 main:'#667eea',
 light:'#8f9ef5',
 dark:'#5a6fd6',
 },
 secondary: {
 main:'#764ba2',
 },
 background: {
 default:'#0f0f1a',
 paper:'#1a1a2e',
 },
 text: {
 primary:'#e0e0e0',
 secondary:'#aaa',
 },
 },
 typography: {
 fontFamily:'"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
 h4: { fontWeight: 800, letterSpacing:'-0.01em' },
 h5: { fontWeight: 700 },
 h6: { fontWeight: 700 },
 subtitle1: { fontWeight: 600 },
 subtitle2: { fontWeight: 700 },
 button: { textTransform:'none' as const, fontWeight: 600 },
 },
 shape: {
 borderRadius: 12,
 },
 components: {
 MuiButton: {
 styleOverrides: {
 root: {
 borderRadius: 10,
 textTransform:'none' as const,
 fontWeight: 600,
 },
 contained: {
 boxShadow:'none',
'&:hover': { boxShadow:'0 4px 12px rgba(102,126,234,0.3)' },
 },
 },
 },
 MuiPaper: {
 styleOverrides: {
 root: {
 borderRadius: 16,
 boxShadow:'0 2px 12px rgba(0,0,0,0.2)',
 backgroundImage:'none',
 },
 },
 },
 MuiDialog: {
 styleOverrides: {
 paper: {
 borderRadius: 20,
 backgroundImage:'none',
 },
 },
 },
 MuiTableHead: {
 styleOverrides: {
 root: {
'& .MuiTableCell-head': {
 fontWeight: 700,
 color:'#aaa',
 fontSize:'0.8rem',
 textTransform:'uppercase' as const,
 letterSpacing:'0.05em',
 borderBottom:'1px solid rgba(255,255,255,0.08)',
 backgroundColor:'#1a1a2e',
 },
 },
 },
 },
 MuiTableCell: {
 styleOverrides: {
 root: {
 borderBottom:'1px solid rgba(255,255,255,0.06)',
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
 { label:'Dashboard', path:'/', icon: <HomeIcon sx={{ fontSize: 18 }} /> },
 { label:'Projects', path:'/projects', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
 { label:'App Planner', path:'/apps', icon: <AppsIcon sx={{ fontSize: 18 }} /> },
 { label:'Research', path:'/research', icon: <ResearchIcon sx={{ fontSize: 18 }} /> },
 { label:'Social', path:'/social', icon: <SocialIcon sx={{ fontSize: 18 }} /> },
 { label:'Analytics', path:'/analytics', icon: <AnalyticsIcon sx={{ fontSize: 18 }} /> },
 { label:'Settings', path:'/settings', icon: <SettingsIcon sx={{ fontSize: 18 }} /> },
];

const automationsItems: NavItem[] = [
 { label:'Workflows', path:'/workflows', icon: <WorkflowIcon sx={{ fontSize: 18 }} /> },
 { label:'Builder', path:'/builder', icon: <BuildIcon sx={{ fontSize: 18 }} /> },
];

const appBuilderItems: NavItem[] = [
 { label:'Pages', path:'/pages', icon: <PagesIcon sx={{ fontSize: 18 }} /> },
 { label:'Templates', path:'/templates', icon: <TemplateIcon sx={{ fontSize: 18 }} /> },
 { label:'Blog', path:'/blog', icon: <BlogIcon sx={{ fontSize: 18 }} /> },
 { label:'Membership Creator', path:'/programmer', icon: <ProgrammerIcon sx={{ fontSize: 18 }} /> },
 { label:'Funnels', path:'/funnels', icon: <FunnelIcon sx={{ fontSize: 18 }} /> },
 { label:'Preview', path:'/preview', icon: <PreviewIcon sx={{ fontSize: 18 }} /> },
];

interface ServiceStatus {
 name: string;
 url: string;
 status:'online' |'offline' |'degraded';
 responseTime?: number;
 error?: string;
}

interface HealthData {
 overall: string;
 services: ServiceStatus[];
}

interface NavigationProps {
 darkMode: boolean;
 toggleDarkMode: () => void;
}

function Navigation({ darkMode, toggleDarkMode }: NavigationProps) {
 const location = useLocation();
 const isMobile = useMediaQuery('(max-width:960px)');

 // --- Mobile Drawer State ---
 const [drawerOpen, setDrawerOpen] = useState(false);

 // --- Notification Center State ---
 const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
 const [notifications] = useState([
 { id: 1, text:'Dashboard loaded successfully', time:'Just now', read: false },
 { id: 2, text:'Health check: All services online', time:'15s ago', read: true },
 ]);

 // --- App Builder Menu State ---
 const [appBuilderAnchor, setAppBuilderAnchor] = useState<HTMLElement | null>(null);
 const appBuilderOpen = Boolean(appBuilderAnchor);
 const isAppBuilderActive = appBuilderItems.some(
 (item) => location.pathname === item.path
 );
 const activeAppBuilderLabel = appBuilderItems.find(
 (item) => location.pathname === item.path
 )?.label;

 // --- Automations Menu State ---
 const [automationsAnchor, setAutomationsAnchor] = useState<HTMLElement | null>(null);
 const automationsOpen = Boolean(automationsAnchor);
 const isAutomationsActive = automationsItems.some(
 (item) => location.pathname === item.path
 );
 const activeAutomationsLabel = automationsItems.find(
 (item) => location.pathname === item.path
 )?.label;

 // --- Health Monitor State ---
 const [health, setHealth] = useState<HealthData | null>(null);
 const [healthLoading, setHealthLoading] = useState(false);
 const [healthAnchor, setHealthAnchor] = useState<HTMLElement | null>(null);
 const [restartingService, setRestartingService] = useState<string | null>(null);

 const fetchHealth = useCallback(async () => {
 try {
 const res = await fetch(`${API.health}/status`, { signal: AbortSignal.timeout(6000) });
 const data = await res.json();
 setHealth(data);
 } catch {
 // Backend itself is down
 setHealth({
 overall:'degraded',
 services: [
 { name:'backend', url: API_BASE_URL, status:'offline', error:'Connection refused' },
 { name:'frontend', url:'http://localhost:5173', status:'online' },
 { name:'n8n', url:'http://localhost:5678', status:'offline', error:'Cannot check -- backend is down' },
 ],
 });
 }
 }, []);

 // Poll every 15 seconds
 useEffect(() => {
 fetchHealth();
 const interval = setInterval(fetchHealth, 15000);
 return () => clearInterval(interval);
 }, [fetchHealth]);

 const restartService = useCallback(async (service: string) => {
 setRestartingService(service);
 try {
 await fetch(`${API.health}/restart/${service}`, { method:'POST' });
 // Wait a bit then re-check
 setTimeout(fetchHealth, 4000);
 } catch { /* ignore */ }
 setTimeout(() => setRestartingService(null), 5000);
 }, [fetchHealth]);

 const onlineCount = health?.services?.filter((s) => s.status ==='online').length ?? 0;
 const totalCount = health?.services?.length ?? 3;
 const overallColor = !health ?'#888' : onlineCount === totalCount ?'#4caf50' : onlineCount === 0 ?'#f44336' :'#ff9800';

 return (
 <>
 <Box
 sx={{
 bgcolor:'#1a1a2e',
 color:'white',
 px: { xs: 1.5, md: 3 },
 py: 0,
 display:'flex',
 alignItems:'center',
 justifyContent:'space-between',
 position:'sticky',
 top: 0,
 zIndex: 1100,
 boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
 }}
 >
 {/* Mobile hamburger */}
 {isMobile && (
 <IconButton onClick={() => setDrawerOpen(true)} sx={{ color:'white', mr: 1 }}>
 <MenuIcon />
 </IconButton>
 )}

 {/* Logo */}
 <Box
 component={Link}
 to="/"
 sx={{
 display:'flex',
 alignItems:'center',
 gap: 1,
 textDecoration:'none',
 color:'white',
 mr: 4,
 py: 1.5,
 }}
 >
 <Box
 sx={{
 width: 32,
 height: 32,
 borderRadius: 2,
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 display:'flex',
 alignItems:'center',
 justifyContent:'center',
 }}
 >
 <BoltIcon sx={{ fontSize: 20, color:'white' }} />
 </Box>
 <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize:'1.1rem', letterSpacing:'-0.01em' }}>
 n8n Surface
 </Typography>
 </Box>

 {/* Nav Items - hidden on mobile */}
 <Box sx={{ display: { xs:'none', md:'flex' }, alignItems:'center', gap: 0.5, flex: 1 }}>
 {navItems.slice(0, 4).map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <Button
 key={item.path}
 component={Link}
 to={item.path}
 startIcon={item.icon}
 sx={{
 color: isActive ?'white' :'rgba(255,255,255,0.55)',
 bgcolor: isActive ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 px: 2,
 py: 1,
 fontSize:'0.85rem',
 fontWeight: isActive ? 700 : 500,
 position:'relative',
 transition:'all 0.2s ease',
'&:hover': {
 bgcolor: isActive ?'rgba(102,126,234,0.25)' :'rgba(255,255,255,0.06)',
 color:'white',
 },
'&::after': isActive ? {
 content:'""',
 position:'absolute',
 bottom: -1,
 left:'20%',
 right:'20%',
 height: 2,
 borderRadius: 1,
 background:'linear-gradient(90deg, #667eea, #764ba2)',
 } : {},
 }}
 >
 {item.label}
 </Button>
 );
 })}

 {/* Automations dropdown */}
 <Button
 startIcon={<AutomationsIcon sx={{ fontSize: 18 }} />}
 endIcon={<ExpandMoreIcon sx={{ fontSize: 16, transition:'transform 0.2s', transform: automationsOpen ?'rotate(180deg)' :'none' }} />}
 onClick={(e) => setAutomationsAnchor(e.currentTarget)}
 sx={{
 color: isAutomationsActive ?'white' :'rgba(255,255,255,0.55)',
 bgcolor: isAutomationsActive ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 px: 2,
 py: 1,
 fontSize:'0.85rem',
 fontWeight: isAutomationsActive ? 700 : 500,
 position:'relative',
 transition:'all 0.2s ease',
'&:hover': {
 bgcolor: isAutomationsActive ?'rgba(102,126,234,0.25)' :'rgba(255,255,255,0.06)',
 color:'white',
 },
'&::after': isAutomationsActive ? {
 content:'""',
 position:'absolute',
 bottom: -1,
 left:'20%',
 right:'20%',
 height: 2,
 borderRadius: 1,
 background:'linear-gradient(90deg, #667eea, #764ba2)',
 } : {},
 }}
 >
 {activeAutomationsLabel ?`Automations - ${activeAutomationsLabel}` :'Automations'}
 </Button>
 <Menu
 anchorEl={automationsAnchor}
 open={automationsOpen}
 onClose={() => setAutomationsAnchor(null)}
 anchorOrigin={{ vertical:'bottom', horizontal:'left' }}
 transformOrigin={{ vertical:'top', horizontal:'left' }}
 slotProps={{
 paper: {
 sx: {
 mt: 1,
 borderRadius: 3,
 minWidth: 220,
 bgcolor:'#1e1e36',
 border:'1px solid rgba(255,255,255,0.08)',
 boxShadow:'0 12px 40px rgba(0,0,0,0.4)',
'& .MuiMenuItem-root': {
 borderRadius: 1.5,
 mx: 0.5,
 my: 0.25,
 transition:'all 0.15s',
 },
 },
 },
 }}
 >
 <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
 <Typography sx={{ fontSize:'0.7rem', fontWeight: 700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
 Automations
 </Typography>
 </Box>
 {automationsItems.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <MenuItem
 key={item.path}
 component={Link}
 to={item.path}
 onClick={() => setAutomationsAnchor(null)}
 sx={{
 color: isActive ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: isActive ?'rgba(102,126,234,0.2)' :'transparent',
'&:hover': {
 bgcolor: isActive ?'rgba(102,126,234,0.3)' :'rgba(255,255,255,0.06)',
 color:'#fff',
 },
 py: 1.2,
 }}
 >
 <ListItemIcon sx={{ color: isActive ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 {item.icon}
 </ListItemIcon>
 <ListItemText
 primary={item.label}
 primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: isActive ? 700 : 500 }}
 />
 </MenuItem>
 );
 })}
 </Menu>

 {/* App Builder dropdown */}
 <Button
 startIcon={<AppBuilderIcon sx={{ fontSize: 18 }} />}
 endIcon={<ExpandMoreIcon sx={{ fontSize: 16, transition:'transform 0.2s', transform: appBuilderOpen ?'rotate(180deg)' :'none' }} />}
 onClick={(e) => setAppBuilderAnchor(e.currentTarget)}
 sx={{
 color: isAppBuilderActive ?'white' :'rgba(255,255,255,0.55)',
 bgcolor: isAppBuilderActive ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 px: 2,
 py: 1,
 fontSize:'0.85rem',
 fontWeight: isAppBuilderActive ? 700 : 500,
 position:'relative',
 transition:'all 0.2s ease',
'&:hover': {
 bgcolor: isAppBuilderActive ?'rgba(102,126,234,0.25)' :'rgba(255,255,255,0.06)',
 color:'white',
 },
'&::after': isAppBuilderActive ? {
 content:'""',
 position:'absolute',
 bottom: -1,
 left:'20%',
 right:'20%',
 height: 2,
 borderRadius: 1,
 background:'linear-gradient(90deg, #667eea, #764ba2)',
 } : {},
 }}
 >
 {activeAppBuilderLabel ?`App Builder - ${activeAppBuilderLabel}` :'App Builder'}
 </Button>
 <Menu
 anchorEl={appBuilderAnchor}
 open={appBuilderOpen}
 onClose={() => setAppBuilderAnchor(null)}
 anchorOrigin={{ vertical:'bottom', horizontal:'left' }}
 transformOrigin={{ vertical:'top', horizontal:'left' }}
 slotProps={{
 paper: {
 sx: {
 mt: 1,
 borderRadius: 3,
 minWidth: 220,
 bgcolor:'#1e1e36',
 border:'1px solid rgba(255,255,255,0.08)',
 boxShadow:'0 12px 40px rgba(0,0,0,0.4)',
'& .MuiMenuItem-root': {
 borderRadius: 1.5,
 mx: 0.5,
 my: 0.25,
 transition:'all 0.15s',
 },
 },
 },
 }}
 >
 <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
 <Typography sx={{ fontSize:'0.7rem', fontWeight: 700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
 App Builder
 </Typography>
 </Box>
 {appBuilderItems.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <MenuItem
 key={item.path}
 component={Link}
 to={item.path}
 onClick={() => setAppBuilderAnchor(null)}
 sx={{
 color: isActive ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: isActive ?'rgba(102,126,234,0.2)' :'transparent',
'&:hover': {
 bgcolor: isActive ?'rgba(102,126,234,0.3)' :'rgba(255,255,255,0.06)',
 color:'#fff',
 },
 py: 1.2,
 }}
 >
 <ListItemIcon sx={{ color: isActive ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 {item.icon}
 </ListItemIcon>
 <ListItemText
 primary={item.label}
 primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: isActive ? 700 : 500 }}
 />
 </MenuItem>
 );
 })}
 </Menu>

 {navItems.slice(4).map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <Button
 key={item.path}
 component={Link}
 to={item.path}
 startIcon={item.icon}
 sx={{
 color: isActive ?'white' :'rgba(255,255,255,0.55)',
 bgcolor: isActive ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 px: 2,
 py: 1,
 fontSize:'0.85rem',
 fontWeight: isActive ? 700 : 500,
 position:'relative',
 transition:'all 0.2s ease',
'&:hover': {
 bgcolor: isActive ?'rgba(102,126,234,0.25)' :'rgba(255,255,255,0.06)',
 color:'white',
 },
'&::after': isActive ? {
 content:'""',
 position:'absolute',
 bottom: -1,
 left:'20%',
 right:'20%',
 height: 2,
 borderRadius: 1,
 background:'linear-gradient(90deg, #667eea, #764ba2)',
 } : {},
 }}
 >
 {item.label}
 </Button>
 );
 })}
 </Box>

 {/* Right side */}
 <Box sx={{ display:'flex', alignItems:'center', gap: { xs: 0.5, md: 1.5 } }}>
 {/* Search hint */}
 <Tooltip title="Quick search (Ctrl+K)">
 <Chip
 icon={<SearchIcon sx={{ fontSize:'14px !important', color:'rgba(255,255,255,0.5) !important' }} />}
 label={isMobile ?'' :'Cmd+K'}
 size="small"
 onClick={() => {
 window.dispatchEvent(new KeyboardEvent('keydown', { key:'k', ctrlKey: true }));
 }}
 sx={{
 cursor:'pointer',
 bgcolor:'rgba(255,255,255,0.06)',
 color:'rgba(255,255,255,0.5)',
 fontWeight: 600,
 fontSize:'0.7rem',
 height: 24,
 border:'1px solid rgba(255,255,255,0.1)',
'&:hover': { bgcolor:'rgba(255,255,255,0.12)' },
 display: { xs:'none', sm:'flex' },
 }}
 />
 </Tooltip>

 {/* Dark Mode Toggle */}
 <Tooltip title={darkMode ?'Switch to light mode' :'Switch to dark mode'}>
 <IconButton onClick={toggleDarkMode} sx={{ color:'rgba(255,255,255,0.7)','&:hover': { color:'white' } }}>
 {darkMode ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
 </IconButton>
 </Tooltip>

 {/* Notification Center */}
 <Tooltip title="Notifications">
 <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color:'rgba(255,255,255,0.7)','&:hover': { color:'white' } }}>
 <Badge badgeContent={notifications.filter(n => !n.read).length} color="error" sx={{'& .MuiBadge-badge': { fontSize:'0.6rem', minWidth: 16, height: 16 } }}>
 <NotificationsIcon sx={{ fontSize: 20 }} />
 </Badge>
 </IconButton>
 </Tooltip>

 {/* Notification Popover */}
 <Popover
 open={Boolean(notifAnchor)}
 anchorEl={notifAnchor}
 onClose={() => setNotifAnchor(null)}
 anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
 transformOrigin={{ vertical:'top', horizontal:'right' }}
 slotProps={{ paper: { sx: { mt: 1, borderRadius: 3, width: 320, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' } } }}
 >
 <Box sx={{ p: 2 }}>
 <Typography sx={{ fontSize:'0.85rem', fontWeight: 800, mb: 1.5 }}>Notifications</Typography>
 {notifications.length === 0 ? (
 <Typography sx={{ fontSize:'0.8rem', color:'#999', textAlign:'center', py: 3 }}>
 No notifications yet
 </Typography>
 ) : (
 notifications.map(n => (
 <Box key={n.id} sx={{ p: 1.5, mb: 0.5, borderRadius: 2, bgcolor: n.read ?'transparent' :'rgba(102,126,234,0.06)', border:'1px solid', borderColor: n.read ?'transparent' :'rgba(102,126,234,0.12)' }}>
 <Typography sx={{ fontSize:'0.8rem', fontWeight: n.read ? 400 : 600 }}>{n.text}</Typography>
 <Typography sx={{ fontSize:'0.65rem', color:'#999', mt: 0.3 }}>{n.time}</Typography>
 </Box>
 ))
 )}
 </Box>
 </Popover>
 {/* Health Indicator */}
 <Tooltip title={`Services: ${onlineCount}/${totalCount} online -- click for details`}>
 <Chip
 icon={<CircleIcon sx={{ fontSize:'10px !important', color:`${overallColor} !important` }} />}
 label={`${onlineCount}/${totalCount}`}
 size="small"
 onClick={(e) => setHealthAnchor(e.currentTarget)}
 sx={{
 cursor:'pointer',
 bgcolor:'rgba(255,255,255,0.08)',
 color:'rgba(255,255,255,0.8)',
 fontWeight: 700,
 fontSize:'0.7rem',
 height: 24,
 border:`1px solid ${overallColor}40`,
'&:hover': { bgcolor:'rgba(255,255,255,0.14)' },
 }}
 />
 </Tooltip>

 {/* Health Popover */}
 <Popover
 open={Boolean(healthAnchor)}
 anchorEl={healthAnchor}
 onClose={() => setHealthAnchor(null)}
 anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
 transformOrigin={{ vertical:'top', horizontal:'right' }}
 slotProps={{ paper: { sx: { mt: 1, borderRadius: 3, width: 320, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' } } }}
 >
 <Box sx={{ p: 2 }}>
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: 1.5 }}>
 <Typography sx={{ fontSize:'0.85rem', fontWeight: 800, color:'#1a1a2e' }}>Service Health</Typography>
 <IconButton size="small" onClick={() => { setHealthLoading(true); fetchHealth().finally(() => setHealthLoading(false)); }}>
 {healthLoading ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
 </IconButton>
 </Box>
 {health?.services?.map((svc) => (
 <Box
 key={svc.name}
 sx={{
 display:'flex',
 alignItems:'center',
 justifyContent:'space-between',
 p: 1,
 mb: 0.5,
 borderRadius: 2,
 bgcolor: svc.status ==='online' ?'rgba(76,175,80,0.06)' :'rgba(244,67,54,0.06)',
 border:`1px solid ${svc.status ==='online' ?'rgba(76,175,80,0.15)' :'rgba(244,67,54,0.15)'}`,
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <CircleIcon sx={{ fontSize: 10, color: svc.status ==='online' ?'#4caf50' :'#f44336' }} />
 <Box>
 <Typography sx={{ fontSize:'0.78rem', fontWeight: 700, color:'#1a1a2e', textTransform:'capitalize' }}>
 {svc.name}
 </Typography>
 <Typography sx={{ fontSize:'0.65rem', color:'#999' }}>
 {svc.status ==='online' ?`${svc.responseTime}ms` : svc.error ||'Offline'}
 </Typography>
 </Box>
 </Box>
 {svc.status ==='offline' && (
 <Button
 size="small"
 disabled={restartingService === svc.name}
 onClick={() => restartService(svc.name)}
 sx={{ fontSize:'0.68rem', minWidth:'auto', px: 1, borderRadius: 1.5, textTransform:'none', fontWeight: 700, color:'#667eea' }}
 >
 {restartingService === svc.name ?'Restarting...' :'Restart'}
 </Button>
 )}
 </Box>
 ))}
 <Typography sx={{ fontSize:'0.65rem', color:'#bbb', mt: 1.5, textAlign:'center' }}>
 Auto-checks every 15s * Use pm2 for auto-restart
 </Typography>
 </Box>
 </Popover>

 <Chip
 label="Beta"
 size="small"
 sx={{
 bgcolor:'rgba(102,126,234,0.2)',
 color:'#a0b0ff',
 fontWeight: 700,
 fontSize:'0.7rem',
 height: 22,
 border:'1px solid rgba(102,126,234,0.3)',
 }}
 />
 <Tooltip title="Profile">
 <Avatar
 sx={{
 width: 32,
 height: 32,
 bgcolor:'rgba(102,126,234,0.3)',
 color:'white',
 fontSize:'0.8rem',
 fontWeight: 700,
 cursor:'pointer',
 border:'2px solid rgba(255,255,255,0.15)',
'&:hover': { borderColor:'rgba(255,255,255,0.4)' },
 }}
 >
 R
 </Avatar>
 </Tooltip>
 </Box>
 </Box>

 {/* Mobile Drawer */}
 <Drawer
 anchor="left"
 open={drawerOpen}
 onClose={() => setDrawerOpen(false)}
 PaperProps={{
 sx: {
 width: 280,
 bgcolor:'#1a1a2e',
 color:'white',
 borderRight:'1px solid rgba(255,255,255,0.08)',
 },
 }}
 >
 <Box sx={{ p: 2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box
 sx={{
 width: 28,
 height: 28,
 borderRadius: 1.5,
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 display:'flex',
 alignItems:'center',
 justifyContent:'center',
 }}
 >
 <BoltIcon sx={{ fontSize: 16, color:'white' }} />
 </Box>
 <Typography sx={{ fontWeight: 800, fontSize:'1rem' }}>n8n Surface</Typography>
 </Box>
 <IconButton onClick={() => setDrawerOpen(false)} sx={{ color:'rgba(255,255,255,0.6)' }}>
 <CloseIcon sx={{ fontSize: 20 }} />
 </IconButton>
 </Box>

 <Box sx={{ px: 1 }}>
 {/* Dashboard link */}
 <MenuItem
 component={Link}
 to="/"
 onClick={() => setDrawerOpen(false)}
 sx={{
 color: location.pathname ==='/' ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: location.pathname ==='/' ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 mb: 0.5,
'&:hover': { bgcolor:'rgba(255,255,255,0.06)' },
 }}
 >
 <ListItemIcon sx={{ color: location.pathname ==='/' ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 <HomeIcon sx={{ fontSize: 18 }} />
 </ListItemIcon>
 <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: location.pathname ==='/' ? 700 : 500 }} />
 </MenuItem>

 {/* Main nav items */}
 {navItems.map(item => (
 <MenuItem
 key={item.path}
 component={Link}
 to={item.path}
 onClick={() => setDrawerOpen(false)}
 sx={{
 color: location.pathname === item.path ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: location.pathname === item.path ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 mb: 0.5,
'&:hover': { bgcolor:'rgba(255,255,255,0.06)' },
 }}
 >
 <ListItemIcon sx={{ color: location.pathname === item.path ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 {item.icon}
 </ListItemIcon>
 <ListItemText primary={item.label} primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: location.pathname === item.path ? 700 : 500 }} />
 </MenuItem>
 ))}

 {/* Automations section */}
 <Typography sx={{ fontSize:'0.65rem', fontWeight: 700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', mt: 2, mb: 1, px: 2 }}>
 Automations
 </Typography>
 {automationsItems.map(item => (
 <MenuItem
 key={item.path}
 component={Link}
 to={item.path}
 onClick={() => setDrawerOpen(false)}
 sx={{
 color: location.pathname === item.path ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: location.pathname === item.path ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 mb: 0.5,
'&:hover': { bgcolor:'rgba(255,255,255,0.06)' },
 }}
 >
 <ListItemIcon sx={{ color: location.pathname === item.path ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 {item.icon}
 </ListItemIcon>
 <ListItemText primary={item.label} primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: location.pathname === item.path ? 700 : 500 }} />
 </MenuItem>
 ))}

 {/* App Builder section */}
 <Typography sx={{ fontSize:'0.65rem', fontWeight: 700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', mt: 2, mb: 1, px: 2 }}>
 App Builder
 </Typography>
 {appBuilderItems.map(item => (
 <MenuItem
 key={item.path}
 component={Link}
 to={item.path}
 onClick={() => setDrawerOpen(false)}
 sx={{
 color: location.pathname === item.path ?'#fff' :'rgba(255,255,255,0.7)',
 bgcolor: location.pathname === item.path ?'rgba(102,126,234,0.2)' :'transparent',
 borderRadius: 2,
 mb: 0.5,
'&:hover': { bgcolor:'rgba(255,255,255,0.06)' },
 }}
 >
 <ListItemIcon sx={{ color: location.pathname === item.path ?'#667eea' :'rgba(255,255,255,0.45)', minWidth: 36 }}>
 {item.icon}
 </ListItemIcon>
 <ListItemText primary={item.label} primaryTypographyProps={{ fontSize:'0.85rem', fontWeight: location.pathname === item.path ? 700 : 500 }} />
 </MenuItem>
 ))}
 </Box>
 </Drawer>
 </>
 );
}

function App() {
 const [darkMode, setDarkMode] = useState(() => {
 const saved = localStorage.getItem('n8n-surface-dark-mode');
 return saved ==='true';
 });

 const toggleDarkMode = useCallback(() => {
 setDarkMode(prev => {
 const next = !prev;
 localStorage.setItem('n8n-surface-dark-mode', String(next));
 return next;
 });
 }, []);

 const theme = useMemo(() => darkMode ? darkTheme : lightTheme, [darkMode]);

 return (
 <Router>
 <ThemeProvider theme={theme}>
 <CssBaseline />
 <Box sx={{ minHeight:'100vh', bgcolor: theme.palette.background.default }}>
 <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
 <GlobalSearch />
 <Routes>
 <Route path="/" element={<DashboardPage />} />
 <Route path="/projects" element={<ProjectsPage />} />
 <Route path="/settings" element={<SettingsPage />} />
 <Route path="/workflows" element={<WorkflowsPage />} />
 <Route path="/templates" element={<TemplatesPage />} />
 <Route path="/pages" element={<PagesPage />} />
 <Route path="/apps" element={<AppsPage />} />
 <Route path="/research" element={<ResearchPage />} />
 <Route path="/programmer" element={<ProgrammerAgentPage />} />
 <Route path="/builder" element={<WorkflowBuilderPage />} />
 <Route path="/social" element={<SocialMonitorPage />} />
 <Route path="/preview" element={<AppPreviewPage />} />
 <Route path="/blog" element={<BlogPage />} />
 <Route path="/funnels" element={<FunnelBuilderPage />} />
 <Route path="/analytics" element={<AnalyticsPage />} />
 </Routes>
 </Box>
 </ThemeProvider>
 </Router>
 );
}

export default App;
