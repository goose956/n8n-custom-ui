import { useState } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Paper, Divider, Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SmartToy as SkillsIcon,
  Schedule as WorkflowsIcon,
  Description as DocsIcon,
  VpnKey as KeysIcon,
  AdminPanelSettings as AdminIcon,
  Email as ContactIcon,
  Hub as LogoIcon,
} from '@mui/icons-material';
import { MemberDashboardPage } from './MemberDashboardPage';
import { MemberSkillConsolePage } from './MemberSkillConsolePage';
import { MemberFilesPage } from './MemberFilesPage';
import { MemberApiKeysPage } from './MemberApiKeysPage';
import { MembersAdminPage } from './members/linkedin-automater/admin';
import { MemberContactPage } from './MemberContactPage';

// ── Types ─────────────────────────────────────────────────────────────

type MemberPage = 'dashboard' | 'skills' | 'workflows' | 'documents' | 'keys' | 'admin' | 'contact';

interface PageDef {
  id: MemberPage;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PAGES: PageDef[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <DashboardIcon />, description: 'Overview & stats' },
  { id: 'skills',     label: 'AI Skills',  icon: <SkillsIcon />,    description: 'Browse and run AI skills' },
  { id: 'workflows',  label: 'Workflows',  icon: <WorkflowsIcon />, description: 'Scheduled automations' },
  { id: 'documents',  label: 'Documents',  icon: <DocsIcon />,      description: 'Save & manage files' },
  { id: 'keys',       label: 'API Keys',   icon: <KeysIcon />,      description: 'Manage service keys' },
  { id: 'admin',      label: 'Admin',      icon: <AdminIcon />,     description: 'Members & messages' },
  { id: 'contact',    label: 'Contact',    icon: <ContactIcon />,   description: 'Get in touch' },
];

// ── Component ─────────────────────────────────────────────────────────

export function MembersAreaLayout() {
  const [activePage, setActivePage] = useState<MemberPage>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <MemberDashboardPage />;
      case 'skills':     return <MemberSkillConsolePage />;
      case 'workflows':  return <Box sx={{ p: 3 }}><Typography>Workflows page — rendered from template</Typography></Box>;
      case 'documents':  return <MemberFilesPage />;
      case 'keys':       return <MemberApiKeysPage />;
      case 'admin':      return <MembersAdminPage />;
      case 'contact':    return <MemberContactPage />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* ═══ SIDEBAR ═══ */}
      <Paper sx={{
        width: 220, borderRight: 1, borderColor: 'divider',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderRadius: 0,
      }}>
        {/* Brand / header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            <LogoIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontSize: 13, lineHeight: 1.2 }}>Members Area</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>AI Workspace</Typography>
          </Box>
        </Box>
        <Divider />

        {/* Nav items */}
        <List sx={{ flex: 1, px: 1, py: 1.5 }}>
          {PAGES.map(page => (
            <ListItemButton
              key={page.id}
              selected={activePage === page.id}
              onClick={() => setActivePage(page.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: activePage === page.id ? '#fff' : 'primary.main' }}>
                {page.icon}
              </ListItemIcon>
              <ListItemText
                primary={page.label}
                secondary={page.description}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 10, noWrap: true }}
              />
            </ListItemButton>
          ))}
        </List>

        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            Powered by AI Skills Engine
          </Typography>
        </Box>
      </Paper>

      {/* ═══ MAIN CONTENT ═══ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderPage()}
      </Box>
    </Box>
  );
}
