import { useState } from'react';
import {
 Box, Typography, Paper, Grid, Card, CardContent, Avatar, Button, TextField,
 Chip, Divider, List, ListItem, ListItemAvatar, ListItemText, IconButton,
 Tabs, Tab, Snackbar, Alert, Tooltip, InputAdornment,
} from'@mui/material';
import Group from'@mui/icons-material/Group';
import PersonAdd from'@mui/icons-material/PersonAdd';
import Share from'@mui/icons-material/Share';
import Star from'@mui/icons-material/Star';
import ContentCopy from'@mui/icons-material/ContentCopy';
import Send from'@mui/icons-material/Send';
import CheckCircle from'@mui/icons-material/CheckCircle';
import Public from'@mui/icons-material/Public';
import Lock from'@mui/icons-material/Lock';
import Edit from'@mui/icons-material/Edit';

interface Collaborator {
 name: string;
 email: string;
 role: string;
 avatar: string;
 status:'active' |'pending';
}

interface SharedScript {
 title: string;
 sharedWith: number;
 lastEdited: string;
 isPublic: boolean;
}

const COLLABORATORS: Collaborator[] = [
 { name:'Alice Johnson', email:'alice@example.com', role:'Editor', avatar:'A', status:'active' },
 { name:'Bob Smith', email:'bob@example.com', role:'Viewer', avatar:'B', status:'active' },
 { name:'Carol Davis', email:'carol@example.com', role:'Editor', avatar:'C', status:'pending' },
];

const SHARED_SCRIPTS: SharedScript[] = [
 { title:'Morning Routine Script v2', sharedWith: 3, lastEdited:'2026-02-14', isPublic: false },
 { title:'Product Launch Hook', sharedWith: 5, lastEdited:'2026-02-13', isPublic: true },
 { title:'Story Time Template', sharedWith: 2, lastEdited:'2026-02-10', isPublic: false },
];

export function MembersCollaborationPage() {
 const [tab, setTab] = useState(0);
 const [inviteEmail, setInviteEmail] = useState('');
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message:'' });

 const handleInvite = () => {
 if (!inviteEmail.trim()) return;
 setSnackbar({ open: true, message:`Invitation sent to ${inviteEmail}` });
 setInviteEmail('');
 };

 const handleCopyLink = () => {
 setSnackbar({ open: true, message:'Collaboration link copied to clipboard!' });
 };

 return (
 <Box sx={{ maxWidth: 1000, mx:'auto' }}>
 <Paper sx={{ p: 4, mb: 3, borderRadius: 3, background:'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', color:'#fff', textAlign:'center' }}>
 <Group sx={{ fontSize: 48, mb: 1 }} />
 <Typography variant="h4" fontWeight={700}>Collaboration Hub</Typography>
 <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>Work together on scripts, share templates, and grow as a team</Typography>
 </Paper>

 <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
 <Tab label="Team Members" icon={<Group />} iconPosition="start" />
 <Tab label="Shared Scripts" icon={<Share />} iconPosition="start" />
 </Tabs>

 {tab === 0 && (
 <Grid container spacing={3}>
 <Grid item xs={12} md={7}>
 <Paper sx={{ p: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display:'flex', alignItems:'center', gap: 1 }}>
 <Group sx={{ color:'#1976d2' }} /> Team Members ({COLLABORATORS.length})
 </Typography>
 <Divider sx={{ mb: 2 }} />
 <List>
 {COLLABORATORS.map(c => (
 <ListItem key={c.email} sx={{ borderRadius: 2, mb: 1, bgcolor:'grey.50' }}
 secondaryAction={
 <Box sx={{ display:'flex', gap: 1, alignItems:'center' }}>
 <Chip label={c.role} size="small" variant="outlined" />
 <Chip label={c.status} size="small" color={c.status ==='active' ?'success' :'warning'}
 icon={c.status ==='active' ? <CheckCircle /> : undefined} />
 </Box>
 }>
 <ListItemAvatar>
 <Avatar sx={{ bgcolor:'#1976d2' }}>{c.avatar}</Avatar>
 </ListItemAvatar>
 <ListItemText primary={c.name} secondary={c.email} />
 </ListItem>
 ))}
 </List>
 </Paper>
 </Grid>

 <Grid item xs={12} md={5}>
 <Paper sx={{ p: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display:'flex', alignItems:'center', gap: 1 }}>
 <PersonAdd sx={{ color:'#1976d2' }} /> Invite Team Member
 </Typography>
 <Divider sx={{ mb: 2 }} />
 <TextField fullWidth label="Email address" size="small" value={inviteEmail}
 onChange={e => setInviteEmail(e.target.value)} sx={{ mb: 2 }}
 InputProps={{ startAdornment: <InputAdornment position="start"><Send /></InputAdornment> }} />
 <Button variant="contained" fullWidth startIcon={<PersonAdd />} onClick={handleInvite}
 sx={{ mb: 2, bgcolor:'#1976d2' }}>Send Invite</Button>
 <Divider sx={{ my: 2 }} />
 <Button variant="outlined" fullWidth startIcon={<ContentCopy />} onClick={handleCopyLink}>
 Copy Invite Link
 </Button>
 </Paper>

 <Card sx={{ mt: 3, borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
 <CardContent>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 1, display:'flex', alignItems:'center', gap: 1 }}>
 <Star sx={{ color:'#f9a825' }} /> Team Stats
 </Typography>
 <Divider sx={{ mb: 2 }} />
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Typography variant="body2" color="text.secondary">Total Members</Typography>
 <Typography variant="body2" fontWeight={600}>{COLLABORATORS.length}</Typography>
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Typography variant="body2" color="text.secondary">Scripts Shared</Typography>
 <Typography variant="body2" fontWeight={600}>{SHARED_SCRIPTS.length}</Typography>
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between' }}>
 <Typography variant="body2" color="text.secondary">Active Now</Typography>
 <Typography variant="body2" fontWeight={600}>{COLLABORATORS.filter(c => c.status ==='active').length}</Typography>
 </Box>
 </CardContent>
 </Card>
 </Grid>
 </Grid>
 )}

 {tab === 1 && (
 <Grid container spacing={3}>
 {SHARED_SCRIPTS.map((script, i) => (
 <Grid item xs={12} sm={6} md={4} key={i}>
 <Card sx={{ borderRadius: 3, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', transition:'0.2s','&:hover': { transform:'translateY(-2px)', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' } }}>
 <CardContent>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Chip label={script.isPublic ?'Public' :'Private'} size="small"
 icon={script.isPublic ? <Public /> : <Lock />}
 color={script.isPublic ?'primary' :'default'} variant="outlined" />
 <Tooltip title="Edit"><IconButton size="small"><Edit /></IconButton></Tooltip>
 </Box>
 <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>{script.title}</Typography>
 <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
 Shared with {script.sharedWith} people
 </Typography>
 <Typography variant="caption" color="text.disabled">Last edited: {script.lastEdited}</Typography>
 </CardContent>
 </Card>
 </Grid>
 ))}
 </Grid>
 )}

 <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
 <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
 </Snackbar>
 </Box>
 );
}
