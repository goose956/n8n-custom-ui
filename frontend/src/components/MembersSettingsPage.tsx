import React from'react';
import { Box, Button, Typography, TextField, Snackbar, Grid, Paper } from'@mui/material';
import { useState, useEffect } from'react';
import { User } from'../../types/members';
import { API } from'../../config/api';

export function MembersSettingsPage() {
 const [user, setUser] = useState<User | null>(null);
 const [notificationPreference, setNotificationPreference] = useState<boolean>(true);
 const [password, setPassword] = useState<string>('');
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);

 useEffect(() => {
 const fetchUserData = async () => {
 try {
 setLoading(true);
 const res = await fetch(`${API}/user/current`);
 const data = await res.json();
 setUser(data);
 } catch (err) {
 setError('Failed to fetch user data');
 } finally {
 setLoading(false);
 }
 };

 fetchUserData();
 }, []);

 const handleNotificationChange = () => {
 setNotificationPreference(prev => !prev);
 };

 const handlePasswordChange = async () => {
 try {
 const res = await fetch(`${API}/user/update-password`, {
 method:'POST',
 headers: {
'Content-Type':'application/json',
 },
 body: JSON.stringify({ password }),
 });
 if (res.ok) {
 setSuccessMessage('Password updated successfully');
 setPassword('');
 } else {
 setError('Failed to update password');
 }
 } catch {
 setError('An error occurred while updating the password');
 }
 };

 const handleCloseSnackbar = () => {
 setSuccessMessage(null);
 setError(null);
 };

 if (loading) {
 return <Typography>Loading...</Typography>;
 }

 if (error) {
 return <Typography color="error">{error}</Typography>;
 }

 return (
 <Box sx={{ padding: 3 }}>
 <Typography variant="h4" sx={{ marginBottom: 2 }}>Account Settings</Typography>
 <Paper elevation={0} sx={{ padding: 3, borderRadius: 2, boxShadow:'none', border:'1px solid rgba(0,0,0,0.06)' }}>
 <Grid container spacing={2}>
 <Grid item xs={12}>
 <Typography variant="h6">User Information</Typography>
 <Typography variant="body1">Username: {user?.username}</Typography>
 <Typography variant="body1">Email: {user?.email}</Typography>
 </Grid>
 <Grid item xs={12}>
 <Typography variant="h6">Notification Preferences</Typography>
 <Button variant="outlined" onClick={handleNotificationChange}>
 {notificationPreference ?'Disable Notifications' :'Enable Notifications'}
 </Button>
 </Grid>
 <Grid item xs={12}>
 <TextField
 fullWidth
 label="New Password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 variant="outlined"
 />
 </Grid>
 <Grid item xs={12}>
 <Button variant="contained" color="primary" onClick={handlePasswordChange}>
 Change Password
 </Button>
 </Grid>
 </Grid>
 </Paper>
 <Snackbar
 open={!!successMessage || !!error}
 autoHideDuration={6000}
 onClose={handleCloseSnackbar}
 message={successMessage || error ||''}
 />
 <Button variant="contained" color="secondary" sx={{ marginTop: 2 }}>
 Buy It Now
 </Button>
 </Box>
 );
}