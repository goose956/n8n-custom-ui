import { Box, Typography, Paper, Avatar } from'@mui/material';

export function StatCard({ label, value, icon, color, bgColor }: {
 label: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string;
}) {
 return (
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid rgba(0,0,0,0.06)', transition:'all 0.2s','&:hover': { transform:'translateY(-2px)', boxShadow:'0 8px 25px rgba(0,0,0,0.08)' } }}>
 <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <Box>
 <Typography variant="body2" sx={{ color:'#999', fontSize:'0.75rem', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.5px', mb: 0.5 }}>
 {label}
 </Typography>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', fontSize:'1.5rem' }}>
 {typeof value ==='number' ? value.toLocaleString() : value}
 </Typography>
 </Box>
 <Avatar sx={{ width: 44, height: 44, bgcolor: bgColor, color }}>{icon}</Avatar>
 </Box>
 </Paper>
 );
}
