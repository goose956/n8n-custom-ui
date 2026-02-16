import React, { useState, useEffect, useCallback } from'react';
import { Box, Typography, Grid, Card, CardContent, IconButton, Paper, Divider, Chip, Skeleton, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from'@mui/material';
import { TrendingUp, CreditCard, MonetizationOn, ArrowUpward, ArrowDownward, CalendarToday, Sync, Edit, Delete, AttachMoney, CheckCircle, Warning, Error, Add } from'@mui/icons-material';

interface BillingInfo {
 subscriptionId: string;
 plan: string;
 status:'active' |'inactive' |'cancelled';
 renewalDate: string;
 lastPayment: string;
 paymentMethod:'credit_card' |'paypal';
}

export function MembersBillingPage() {
 const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [openDialog, setOpenDialog] = useState(false);
 const [openSnackbar, setOpenSnackbar] = useState(false);
 
 useEffect(() => {
 fetch(`${API_BASE}/api/billing`)
 .then(res => res.json())
 .then(data => {
 setBillingInfo(data);
 setLoading(false);
 })
 .catch(err => {
 setError('Failed to load billing information');
 setLoading(false);
 });
 }, []);

 const handleDialogOpen = useCallback(() => {
 setOpenDialog(true);
 }, []);

 const handleDialogClose = useCallback(() => {
 setOpenDialog(false);
 }, []);

 const handleSnackbarClose = useCallback(() => {
 setOpenSnackbar(false);
 }, []);

 const handleUpgradePlan = useCallback(() => {
 // Assume upgrade logic here
 setOpenDialog(false);
 setOpenSnackbar(true);
 }, []);

 return (
 <Box sx={{ width:'100%', padding: 4 }}>
 <Typography variant="h4" sx={{ marginBottom: 3, color:'#5147ad' }}>Billing Management <AttachMoney /></Typography>
 <Paper sx={{ padding: 3, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <Typography variant="h6" sx={{ color:'#1976d2' }}>Subscription Details <CreditCard /></Typography>
 <IconButton color="primary" onClick={handleDialogOpen}>
 <Edit />
 </IconButton>
 </Box>
 <Divider sx={{ marginY: 2 }} />
 {loading ? (
 <Skeleton variant="rectangular" height={150} />
 ) : error ? (
 <Typography color="error" variant="body1">{error}</Typography>
 ) : billingInfo ? (
 <Grid container spacing={4}>
 <Grid item xs={12} sm={6} md={4}>
 <Card variant="outlined" sx={{ boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition:'0.2s','&:hover': { transform:'translateY(-2px)' } }}>
 <CardContent>
 <Typography variant="h5" sx={{ color:'#1976d2' }}>Plan <MonetizationOn /></Typography>
 <Typography variant="h6">{billingInfo.plan}</Typography>
 <Chip label={billingInfo.status.toUpperCase()} color={billingInfo.status ==='active' ?'success' : billingInfo.status ==='inactive' ?'warning' :'error'} sx={{ marginTop: 1 }} />
 </CardContent>
 </Card>
 </Grid>
 <Grid item xs={12} sm={6} md={4}>
 <Card variant="outlined" sx={{ boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition:'0.2s','&:hover': { transform:'translateY(-2px)' } }}>
 <CardContent>
 <Typography variant="h5" sx={{ color:'#1976d2' }}>Renewal Date <CalendarToday /></Typography>
 <Typography variant="h6">{billingInfo.renewalDate}</Typography>
 </CardContent>
 </Card>
 </Grid>
 <Grid item xs={12} sm={6} md={4}>
 <Card variant="outlined" sx={{ boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, transition:'0.2s','&:hover': { transform:'translateY(-2px)' } }}>
 <CardContent>
 <Typography variant="h5" sx={{ color:'#1976d2' }}>Last Payment <Sync /></Typography>
 <Typography variant="h6">{billingInfo.lastPayment}</Typography>
 <Chip label={billingInfo.paymentMethod.toUpperCase()} sx={{ marginTop: 1 }} />
 </CardContent>
 </Card>
 </Grid>
 </Grid>
 ) : (
 <Box sx={{ textAlign:'center', marginY: 5 }}>
 <Error fontSize="large" sx={{ color:'rgba(0,0,0,0.2)', fontSize: 64 }} />
 <Typography variant="h6">You haven't set up your billing details yet</Typography>
 <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleDialogOpen} sx={{ marginTop: 2 }}>Set Up Billing</Button>
 </Box>
 )}
 </Paper>
 
 <Dialog open={openDialog} onClose={handleDialogClose}>
 <DialogTitle>Upgrade Plan <ArrowUpward sx={{ color:'green' }} /></DialogTitle>
 <DialogContent>
 <Typography variant="body1">Select a new plan to upgrade your script generation capabilities.</Typography>
 </DialogContent>
 <DialogActions>
 <Button onClick={handleDialogClose} color="secondary">Cancel</Button>
 <Button onClick={handleUpgradePlan} color="primary" startIcon={<CheckCircle />}>Upgrade</Button>
 </DialogActions>
 </Dialog>

 <Snackbar
 open={openSnackbar}
 autoHideDuration={6000}
 onClose={handleSnackbarClose}
 message="Plan upgraded successfully!"
 action={
 <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
 <Close fontSize="small" />
 </IconButton>
 }
 />
 </Box>
 );
}