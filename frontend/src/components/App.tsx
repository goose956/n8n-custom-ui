import { useState, useEffect, useCallback, useMemo } from'react';
import { Box, Typography, Button, Avatar, Tooltip, Chip, Popover, CircularProgress, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Badge, Drawer, useMediaQuery } from'@mui/material';
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
import { UpsellEditorPage } from'./components/UpsellEditorPage';
import { TikTokScraperPage } from'./components/TikTokScraperPage';
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
 CardGiftcard as UpsellIcon,
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
 VideoLibrary as VideoLibraryIcon,
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
 { label:'TikTok Scraper', path:'/tiktok-scraper', icon: <VideoLibraryIcon sx={{ fontSize: 18 }} /> },
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
 { label:'Upsell Editor', path:'/upsell-editor', icon: <UpsellIcon sx={{ fontSize: 18 }} /> },
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
 const [healthData, setHealthData] = useState<HealthData | null>(null);
 const [loading, setLoading] = useState(true);
 const isMobile = useMediaQuery('(max-width:768px)');
 const [drawerOpen, setDrawerOpen] = useState(false);

 const fetchHealthData = useCallback(async () => {
 try {
 const response = await fetch(`${API_BASE_URL}/api/health`);
 const data = await response.json();
 setHealthData(data);
 } catch (error) {
 console.error('Failed to fetch health data:', error);
 setHealthData({
 overall:'degraded',
 services: []
 });
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchHealthData();
 const interval = setInterval(fetchHealthData, 30000);
 return () => clearInterval(interval);
 }, [fetchHealthData]);

 const onlineServices = useMemo(() => 
 healthData?.services?.filter(s => s.status === 'online')?.length || 0
 , [healthData]);

 const totalServices = healthData?.services?.length || 0;

 const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
 automations: false,
 appBuilder: false,
 });

 const toggleSection = (section: string) => {
 setExpandedSections(prev => ({
 ...prev,
 [section]: !prev[section]
 }));
 };

 const renderNavItem = (item: NavItem) => (
 <Button
 key={item.path}
 component={Link}
 to={item.path}
 variant={location.pathname === item.path ? 'contained' : 'text'}
 sx={{
 width:'100%',
 justifyContent:'flex-start',
 color: location.pathname === item.path ? 'white' : '#e0e0e0',
 backgroundColor: location.pathname === item.path ? '#667eea' : 'transparent',
 mb: 0.5,
 '&:hover': {
 backgroundColor: location.pathname === item.path ? '#5a6fd6' : 'rgba(255,255,255,0.1)',
 },
 }}
 onClick={() => isMobile && setDrawerOpen(false)}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 {item.icon}
 <Typography variant="body2" sx={{ textTransform:'none' }}>
 {item.label}
 </Typography>
 </Box>
 </Button>
 );

 const renderSection = (title: string, items: NavItem[], sectionKey: string) => (
 <Box sx={{ mb: 2 }}>
 <Button
 onClick={() => toggleSection(sectionKey)}
 sx={{
 width:'100%',
 justifyContent:'space-between',
 color:'#e0e0e0',
 backgroundColor:'transparent',
 mb: 1,
 '&:hover': { backgroundColor:'rgba(255,255,255,0.1)' },
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 {sectionKey === 'automations' ? <AutomationsIcon sx={{ fontSize: 18 }} /> : <AppBuilderIcon sx={{ fontSize: 18 }} />}
 <Typography variant="body2" sx={{ textTransform:'none' }}>
 {title}
 </Typography>
 </Box>
 <ExpandMoreIcon 
 sx={{ 
 fontSize: 18,
 transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)',
 transition:'transform 0.2s'
 }}
 />
 </Button>
 {expandedSections[sectionKey] && (
 <Box sx={{ ml: 1 }}>
 {items.map(renderNavItem)}
 </Box>
 )}
 </Box>
 );

 const drawerContent = (
 <Box sx={{ 
 width: isMobile ? 280 : 240, 
 height:'100%', 
 bgcolor:'#1a1a2e', 
 color:'white',
 display:'flex',
 flexDirection:'column'
 }}>
 <Box sx={{ p: 2, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
 Workflow Automation
 </Typography>
 {!loading && healthData && (
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <CircleIcon 
 sx={{ 
 fontSize: 8, 
 color: healthData.overall === 'online' ? '#27ae60' : 
 healthData.overall === 'degraded' ? '#f39c12' : '#e74c3c'
 }}
 />
 <Typography variant="caption" sx={{ color:'#888' }}>
 {onlineServices}/{totalServices} services online
 </Typography>
 <Tooltip title="Refresh status">
 <IconButton 
 size="small" 
 onClick={fetchHealthData}
 sx={{ color:'#888', ml:'auto' }}
 >
 <RefreshIcon sx={{ fontSize: 14 }} />
 </IconButton>
 </Tooltip>
 </Box>
 )}
 </Box>

 <Box sx={{ p: 2, flexGrow: 1, overflowY:'auto' }}>
 <Box sx={{ mb: 3 }}>
 {navItems.map(renderNavItem)}
 </Box>

 {renderSection('Automations', automationsItems, 'automations')}
 {renderSection('App Builder', appBuilderItems, 'appBuilder')}
 </Box>
 </Box>
 );

 return (
 <Box sx={{ display:'flex', height:'100vh' }}>
 {isMobile ? (
 <Drawer
 open={drawerOpen}
 onClose={() => setDrawerOpen(false)}
 variant="temporary"
 sx={{
 '& .MuiDrawer-paper': {
 bgcolor:'#1a1a2e',
 borderRight:'none'
 }
 }}
 >
 {drawerContent}
 </Drawer>
 ) : (
 <Box sx={{ 
 width: 240, 
 flexShrink: 0,
 bgcolor:'#1a1a2e',
 borderRight:'1px solid rgba(255,255,255,0.1)'
 }}>
 {drawerContent}
 </Box>
 )}

 <Box sx={{ flexGrow: 1, display:'flex', flexDirection:'column' }}>
 <Box sx={{
 height: 64,
 bgcolor:'white',
 borderBottom:'1px solid #e0e0e0',
 display:'flex',
 alignItems:'center',
 px: 3,
 gap: 2
 }}>
 {isMobile && (
 <IconButton 
 onClick={() => setDrawerOpen(true)}
 sx={{ mr: 1 }}
 >
 <MenuIcon />
 </IconButton>
 )}
 
 <GlobalSearch />
 
 <Box sx={{ flexGrow: 1 }} />
 
 <Tooltip title="Notifications">
 <IconButton>
 <Badge badgeContent={3} color="primary">
 <NotificationsIcon />
 </Badge>
 </IconButton>
 </Tooltip>
 
 <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
 <IconButton onClick={toggleDarkMode}>
 {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
 </IconButton>
 </Tooltip>
 
 <Avatar sx={{ width: 32, height: 32, bgcolor:'#667eea', fontSize:'0.875rem' }}>
 U
 </Avatar>
 </Box>

 <Routes>
 <Route path="/" element={<DashboardPage />} />
 <Route path="/projects" element={<ProjectsPage />} />
 <Route path="/workflows" element={<WorkflowsPage />} />
 <Route path="/builder" element={<WorkflowBuilderPage />} />
 <Route path="/templates" element={<TemplatesPage />} />
 <Route path="/pages" element={<PagesPage />} />
 <Route path="/analytics" element={<AnalyticsPage />} />
 <Route path="/settings" element={<SettingsPage />} />
 <Route path="/apps" element={<AppsPage />} />
 <Route path="/research" element={<ResearchPage />} />
 <Route path="/programmer" element={<ProgrammerAgentPage />} />
 <Route path="/social" element={<SocialMonitorPage />} />
 <Route path="/preview" element={<AppPreviewPage />} />
 <Route path="/blog" element={<BlogPage />} />
 <Route path="/funnels" element={<FunnelBuilderPage />} />
 <Route path="/upsell-editor" element={<UpsellEditorPage />} />
 <Route path="/tiktok-scraper" element={<TikTokScraperPage />} />
 </Routes>
 </Box>
 </Box>
 );
}

export default function App() {
 const [darkMode, setDarkMode] = useState(() => {
 const saved = localStorage.getItem('darkMode');
 return saved ? JSON.parse(saved) : false;
 });

 const toggleDarkMode = useCallback(() => {
 setDarkMode((prev: boolean) => {
 const newMode = !prev;
 localStorage.setItem('darkMode', JSON.stringify(newMode));
 return newMode;
 });
 }, []);

 const theme = useMemo(() => darkMode ? darkTheme : lightTheme, [darkMode]);

 return (
 <ThemeProvider theme={theme}>
 <CssBaseline />
 <Router>
 <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
 </Router>
 </ThemeProvider>
 );
}