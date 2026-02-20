import { useState } from 'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Avatar, Button,
 Chip, Divider, LinearProgress, List, ListItem, ListItemAvatar,
 ListItemText,
} from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import People from '@mui/icons-material/People';
import Star from '@mui/icons-material/Star';
import Schedule from '@mui/icons-material/Schedule';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Bolt from '@mui/icons-material/Bolt';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Visibility from '@mui/icons-material/Visibility';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';


const COLORS = {
 primary: '#1976d2',
 secondary: '#0050ac',
 tint: '#1976d215',
 bg: '#fafbfc',
 border: 'rgba(0,0,0,0.06)',
 shadow: '0 2px 12px rgba(0,0,0,0.04)',
 shadowHover: '0 8px 25px rgba(0,0,0,0.08)',
 success: '#4caf50',
 warning: '#ff9800',
 error: '#e74c3c',
 blue: '#2196f3',
 purple: '#9b59b6',
};

const heroSx = {
 p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, position: 'relative' as const, overflow: 'hidden',
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff',
};

const floatingCircle = (size: number, top: number, right: number, opacity = 0.08) => ({
 position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
 background: 'rgba(255,255,255,' + opacity + ')', top, right,
});

const cardSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow,
 transition: 'all 0.25s ease',
 '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover, borderColor: '#1976d240' },
};

const sectionSx = {
 borderRadius: 4, border: '1px solid ' + COLORS.border, boxShadow: COLORS.shadow, p: 3, mb: 3,
};

const gradientBtnSx = {
 background: 'linear-gradient(135deg, #1976d2 0%, #0050ac 100%)',
 color: '#fff', fontWeight: 600, textTransform: 'none' as const,
 boxShadow: '0 4px 15px #1976d240',
 '&:hover': { boxShadow: '0 6px 20px #1976d260', transform: 'translateY(-1px)' },
 transition: 'all 0.2s ease',
};

const statLabelSx = {
 fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, color: 'text.secondary',
};


export function MembersDashboardPage() {
 const stats = [
  { label: 'Total Subscribers', value: '12,000', change: '+5%', icon: <Visibility />, color: COLORS.primary },
  { label: 'Monthly Views', value: '150,000', change: '+10%', icon: <People />, color: COLORS.blue },
  { label: 'Partnership Emails Sent', value: '50', change: '+20%', icon: <TrendingUp />, color: COLORS.success },
  { label: 'Video Transcriptions Completed', value: '75', change: 'Top 15%', icon: <Star />, color: COLORS.warning },
 ];

 const recentActivity = [
  { title: 'Created New Video Script', desc: 'Your AI-generated script for the upcoming video is ready!', time: '2 min ago', color: COLORS.success, icon: <People /> },
  { title: 'Sent Partnership Emails', desc: 'You reached out to 5 YouTube creators for potential collaborations.', time: '1 hour ago', color: COLORS.warning, icon: <EmojiEvents /> },
  { title: 'Thumbnail Designed', desc: 'Your custom thumbnail for the latest video has been created.', time: '3 hours ago', color: COLORS.primary, icon: <Bolt /> },
  { title: 'Transcribed Video', desc: 'The transcription for your last video is now available.', time: '5 hours ago', color: COLORS.blue, icon: <Star /> },
 ];

 const quickLinks = [
  { label: 'View Profile', desc: 'Update your info', icon: <People /> },
  { label: 'Settings', desc: 'Preferences', icon: <Schedule /> },
  { label: 'Contact Us', desc: 'Get in touch', icon: <Bolt /> },
 ];

 return (
  <Box>
   <Paper sx={heroSx}>
    <Box sx={floatingCircle(200, -60, -40)} />
    <Box sx={floatingCircle(120, 20, 120, 0.05)} />
    <Box sx={floatingCircle(80, -20, 300, 0.06)} />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
     <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.5 }}>Welcome back</Typography>
     <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500 }}>Track your YouTube growth and automate your content creation seamlessly.</Typography>
    </Box>
   </Paper>

   <Grid container spacing={2.5} sx={{ mb: 4 }}>
    {stats.map((s, i) => (
     <Grid item xs={12} sm={6} md={3} key={i}>
      <Card sx={cardSx}>
       <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
         <Avatar sx={{ width: 44, height: 44, bgcolor: s.color + '15', color: s.color }}>{s.icon}</Avatar>
         <Chip label={s.change} size="small" sx={{ bgcolor: COLORS.success + '15', color: COLORS.success, fontWeight: 600, fontSize: '0.75rem' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 0.25 }}>{s.value}</Typography>
        <Typography sx={statLabelSx}>{s.label}</Typography>
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>

   <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
     <Paper sx={sectionSx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
       <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Recent Activity</Typography>
       <Chip label="Live" size="small" icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: COLORS.success + ' !important' }} />}
        sx={{ bgcolor: COLORS.success + '15', color: COLORS.success, fontWeight: 600 }} />
      </Box>
      <List disablePadding>
       {recentActivity.map((a, i) => (
        <ListItem key={i} sx={{ px: 0, py: 1.5, borderBottom: i < recentActivity.length - 1 ? '1px solid ' + COLORS.border : 'none' }}>
         <ListItemAvatar>
          <Avatar sx={{ bgcolor: a.color + '15', color: a.color, width: 40, height: 40 }}>{a.icon}</Avatar>
         </ListItemAvatar>
         <ListItemText primary={<Typography variant="body2" fontWeight={600}>{a.title}</Typography>} secondary={a.desc} />
         <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{a.time}</Typography>
        </ListItem>
       ))}
      </List>
     </Paper>
    </Grid>

    <Grid item xs={12} md={4}>
     <Paper sx={sectionSx}>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 2 }}>Quick Links</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
       {quickLinks.map((q, i) => (
        <Card key={i} sx={{ ...cardSx, cursor: 'pointer', '&:hover': { ...cardSx['&:hover'], bgcolor: COLORS.tint } }}>
         <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: COLORS.tint, color: COLORS.primary, width: 40, height: 40 }}>{q.icon}</Avatar>
          <Box sx={{ flex: 1 }}>
           <Typography variant="body2" fontWeight={700}>{q.label}</Typography>
           <Typography variant="caption" color="text.secondary">{q.desc}</Typography>
          </Box>
          <ArrowForward sx={{ color: 'text.disabled', fontSize: 18 }} />
         </CardContent>
        </Card>
       ))}
      </Box>
     </Paper>

     <Paper sx={{ ...sectionSx, mt: 3, background: 'linear-gradient(135deg, #1976d208 0%, #0050ac08 100%)' }}>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 1 }}>Getting Started</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Complete your setup</Typography>
      <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: COLORS.border,
       '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #1976d2, #0050ac)' } }} />
      <Typography variant="caption" color="text.secondary">3 of 4 steps completed</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
       {[{ done: true, label: 'Connect your YouTube account' }, { done: true, label: 'Generate AI scripts for new videos' }, { done: true, label: 'Scrape emails for potential partners' }, { done: false, label: 'Track views and subscriber growth' }].map((s, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         <CheckCircle sx={{ fontSize: 18, color: s.done ? COLORS.success : 'text.disabled' }} />
         <Typography variant="body2" sx={{ color: s.done ? 'text.secondary' : 'text.primary', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</Typography>
        </Box>
       ))}
      </Box>
     </Paper>
    </Grid>
   </Grid>
  </Box>
 );
}