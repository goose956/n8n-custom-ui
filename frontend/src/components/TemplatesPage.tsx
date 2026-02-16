import React, { useState, useEffect } from'react';
import { API } from'../config/api';
import {
 Container,
 Grid,
 Card,
 CardContent,
 CardMedia,
 CardActions,
 Button,
 Typography,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 Box,
 Chip,
 Rating,
 Paper,
 Avatar,
 AvatarGroup,
 List,
 ListItem,
 ListItemIcon,
 ListItemText,
 TextField,
 Checkbox,
 Alert,
 CircularProgress,
 MenuItem,
 Select,
 FormControl,
 InputLabel,
 Stack,
} from'@mui/material';
import {
 Home as HomeIcon,
 ThumbUp as ThumbUpIcon,
 Group as GroupIcon,
 ShoppingCart as ShoppingCartIcon,
 AdminPanelSettings as AdminIcon,
 Preview as PreviewIcon,
 Download as DownloadIcon,
 CheckCircle as CheckCircleIcon,
 Star as StarIcon,
 Warning as WarningIcon,
 RocketLaunch as RocketIcon,
 Speed as SpeedIcon,
 ArrowForward as ArrowForwardIcon,
 Bolt as BoltIcon,
 Lock as LockIcon,
 PlayArrow as PlayArrowIcon,
 TrendingUp as TrendingUpIcon,
 People as PeopleIcon,
 AttachMoney as AttachMoneyIcon,
 BarChart as BarChartIcon,
 Notifications as NotificationsIcon,
 Email as EmailIcon,
 Support as SupportIcon,
 Verified as VerifiedIcon,
 Settings as SettingsIcon,
 CloudDone as CloudDoneIcon,
 Dashboard as DashboardIcon,
 EmojiEvents as EmojiEventsIcon,
 Circle as CircleIcon,
 School as SchoolIcon,
 CreditCard as CreditCardIcon,
 Shield as ShieldIcon,
 MonetizationOn as PricingIcon,
 Info as AboutIcon,
 QuestionAnswer as FaqIcon,
 ContactMail as ContactIcon,
 Phone as PhoneIcon,
 LocationOn as LocationIcon,
 ExpandMore as ExpandMoreIcon,
} from'@mui/icons-material';
import { LinearProgress, Divider, IconButton, Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Tabs, Tab } from'@mui/material';
import { RssFeed as BlogIcon, ViewQuilt as TemplateIcon } from'@mui/icons-material';
import axios from'axios';
import { BlogPage } from'./BlogPage';

interface Template {
 id: string;
 type:'index' |'thanks' |'members' |'checkout' |'admin' |'pricing' |'about' |'faq' |'contact';
 title: string;
 description: string;
 longDescription: string;
 iconType:'home' |'thumbup' |'group' |'cart' |'admin' |'pricing' |'about' |'faq' |'contact';
 features: string[];
 rating: number;
 reviews: number;
 category: string;
 image: string;
 gradient: string;
}

interface App {
 id: number;
 name: string;
 slug: string;
 description?: string;
}

interface Page {
 id: number;
 app_id: number;
 page_type: string;
 title: string;
}

interface Testimonial {
 name: string;
 role: string;
 company: string;
 avatar: string;
 quote: string;
 rating: number;
}

const testimonials: Testimonial[] = [
 {
 name:'Sarah Chen',
 role:'Founder & CEO',
 company:'LaunchPad SaaS',
 avatar:'https://i.pravatar.cc/80?img=47',
 quote:
'These templates saved us weeks of development time. We launched our SaaS product in just 3 days instead of the 2 months we originally planned. The attention to detail is remarkable.',
 rating: 5,
 },
 {
 name:'Marcus Johnson',
 role:'Head of Product',
 company:'ScaleUp Inc.',
 avatar:'https://i.pravatar.cc/80?img=68',
 quote:
'The checkout and members area templates are incredibly well-designed. Our conversion rate increased by 34% after switching to these templates. Highly recommend for any SaaS builder.',
 rating: 5,
 },
 {
 name:'Emily Rodriguez',
 role:'Full-Stack Developer',
 company:'DevStudio',
 avatar:'https://i.pravatar.cc/80?img=45',
 quote:
'As a developer, I appreciate the clean code structure and how easy these templates are to customise. The admin dashboard template alone would have taken me weeks to build from scratch.',
 rating: 4,
 },
 {
 name:'David Park',
 role:'CTO',
 company:'CloudMetrics',
 avatar:'https://i.pravatar.cc/80?img=60',
 quote:
'We use these templates across all our client projects. The consistent design language and built-in responsive layouts make our delivery process so much faster and more reliable.',
 rating: 5,
 },
];

const templates: Template[] = [
 {
 id:'1',
 type:'index',
 title:'Home Page',
 description:'Professional landing page to showcase your product or service',
 longDescription:
'A beautifully crafted landing page template designed to captivate visitors from the first scroll. Includes a striking hero section with animated gradients, feature showcases with iconography, social proof elements, and strategically placed call-to-action buttons that drive conversions.',
 iconType:'home',
 features: ['Hero section with CTA','Feature highlights grid','Social proof & logos','Responsive layout'],
 rating: 4.8,
 reviews: 2847,
 category:'Marketing',
 image:'https://picsum.photos/seed/homepage-saas/600/340',
 gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 },
 {
 id:'2',
 type:'thanks',
 title:'Thank You Page',
 description:'Confirmation page shown after successful user actions or signups',
 longDescription:
'Turn post-conversion moments into engagement opportunities. This thank you page template features clear confirmation messaging, next-step guidance, email verification prompts, and optional upsell sections -- keeping users engaged right after they commit.',
 iconType:'thumbup',
 features: ['Animated success state','Smart next steps','Email confirmation','Upsell section'],
 rating: 4.9,
 reviews: 1523,
 category:'Conversion',
 image:'https://picsum.photos/seed/thankyou-saas/600/340',
 gradient:'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
 },
 {
 id:'3',
 type:'members',
 title:'Members Area',
 description:'Exclusive dashboard and content area for authenticated members',
 longDescription:
'Give your users a premium experience with this members-only dashboard. Includes personalised greeting, subscription status, content library access, activity feed, and profile management -- everything needed for a world-class membership experience.',
 iconType:'group',
 features: ['Personalised dashboard','Subscription management','Content library','Profile & settings'],
 rating: 4.7,
 reviews: 1891,
 category:'Authentication',
 image:'https://picsum.photos/seed/members-saas/600/340',
 gradient:'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
 },
 {
 id:'4',
 type:'checkout',
 title:'Checkout & Upgrade',
 description:'Smooth payment and upgrade flows to maximise conversions',
 longDescription:
'Maximise revenue with a frictionless checkout experience. This template includes side-by-side plan comparison, trust badges, secure payment form with live validation, money-back guarantee messaging, and optimised mobile layout for on-the-go purchases.',
 iconType:'cart',
 features: ['Plan comparison table','Secure payment form','Trust & security badges','30-day guarantee'],
 rating: 4.6,
 reviews: 2134,
 category:'Payments',
 image:'https://picsum.photos/seed/checkout-saas/600/340',
 gradient:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
 },
 {
 id:'5',
 type:'admin',
 title:'Admin Dashboard',
 description:'Powerful admin interface for managing your platform',
 longDescription:
'Take full control of your platform with this feature-rich admin dashboard. Real-time analytics charts, user management tables, revenue tracking widgets, system health monitoring, and activity logs -- all the tools you need to run a successful SaaS business.',
 iconType:'admin',
 features: ['Real-time analytics','User management','Revenue tracking','System monitoring'],
 rating: 4.5,
 reviews: 1678,
 category:'Management',
 image:'https://picsum.photos/seed/admin-saas/600/340',
 gradient:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
 },
 {
 id:'6',
 type:'pricing',
 title:'Pricing Page',
 description:'Clear pricing tiers with feature comparison to drive conversions',
 longDescription:
'A dedicated pricing page designed to convert visitors into customers. Features side-by-side plan comparison, feature matrix, toggle between monthly/annual billing, FAQ section, trust badges, and a money-back guarantee -- everything needed to remove purchase hesitation.',
 iconType:'pricing',
 features: ['Plan comparison cards','Feature matrix table','Monthly/annual toggle','FAQ & guarantees'],
 rating: 4.8,
 reviews: 1956,
 category:'Conversion',
 image:'https://picsum.photos/seed/pricing-saas/600/340',
 gradient:'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
 },
 {
 id:'7',
 type:'about',
 title:'About Us',
 description:'Tell your story, introduce your team, and build trust',
 longDescription:
'Build credibility and connection with this beautifully crafted About Us page. Includes a compelling company story section, team member profiles with photos and roles, company timeline/milestones, core values showcase, and a call-to-action to get in touch.',
 iconType:'about',
 features: ['Company story hero','Team member grid','Mission & values','Timeline milestones'],
 rating: 4.7,
 reviews: 1234,
 category:'Brand',
 image:'https://picsum.photos/seed/aboutus-saas/600/340',
 gradient:'linear-gradient(135deg, #667eea 0%, #43e97b 100%)',
 },
 {
 id:'8',
 type:'faq',
 title:'FAQ Page',
 description:'Answer common questions and reduce support tickets',
 longDescription:
'Reduce support load and build confidence with a well-organized FAQ page. Features categorized accordion-style questions and answers, a search prompt, contact CTA for unanswered questions, and a clean layout that makes finding answers effortless.',
 iconType:'faq',
 features: ['Categorized sections','Accordion layout','Search guidance','Contact fallback CTA'],
 rating: 4.6,
 reviews: 987,
 category:'Support',
 image:'https://picsum.photos/seed/faq-saas/600/340',
 gradient:'linear-gradient(135deg, #a18cd1 0%, #5fc3e4 100%)',
 },
 {
 id:'9',
 type:'contact',
 title:'Contact Page',
 description:'Professional contact form with multiple ways to reach you',
 longDescription:
'Make it easy for visitors, leads, and customers to get in touch. This contact page includes a clean contact form with subject categories, office location with map placeholder, email/phone/social links, business hours, and an optional live chat prompt.',
 iconType:'contact',
 features: ['Contact form','Office location','Email & phone','Business hours'],
 rating: 4.5,
 reviews: 1102,
 category:'Communication',
 image:'https://picsum.photos/seed/contact-saas/600/340',
 gradient:'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
 },
];

interface PreviewDialogState {
 open: boolean;
 template: Template | null;
}

interface ConfirmDialogState {
 open: boolean;
 selectedProject: App | null;
 selectedTemplates: Template[];
 existingPages: Page[];
}

const getTemplateIcon = (iconType: string): React.ReactNode => {
 const iconProps = { fontSize: 40 };
 switch (iconType) {
 case'home':
 return <HomeIcon sx={{ ...iconProps, color:'#3498db' }} />;
 case'thumbup':
 return <ThumbUpIcon sx={{ ...iconProps, color:'#27ae60' }} />;
 case'group':
 return <GroupIcon sx={{ ...iconProps, color:'#9b59b6' }} />;
 case'cart':
 return <ShoppingCartIcon sx={{ ...iconProps, color:'#e74c3c' }} />;
 case'admin':
 return <AdminIcon sx={{ ...iconProps, color:'#34495e' }} />;
 case'pricing':
 return <PricingIcon sx={{ ...iconProps, color:'#f39c12' }} />;
 case'about':
 return <AboutIcon sx={{ ...iconProps, color:'#3498db' }} />;
 case'faq':
 return <FaqIcon sx={{ ...iconProps, color:'#8e44ad' }} />;
 case'contact':
 return <ContactIcon sx={{ ...iconProps, color:'#e74c3c' }} />;
 default:
 return <HomeIcon sx={{ ...iconProps }} />;
 }
};

const PreviewContent: React.FC<{ template: Template }> = ({ template }) => {
 switch (template.type) {
 case'index':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* -- Navigation Bar -- */}
 <Box
 sx={{
 display:'flex',
 justifyContent:'space-between',
 alignItems:'center',
 px: 3,
 py: 1.5,
 borderBottom:'1px solid #f0f0f0',
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 24, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>
 Acme SaaS
 </Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 3, alignItems:'center' }}>
 {['Features','Pricing','About','Blog'].map((item) => (
 <Typography key={item} variant="body2" sx={{ color:'#666', cursor:'pointer', fontWeight: 500,'&:hover': { color:'#667eea' } }}>
 {item}
 </Typography>
 ))}
 <Button variant="contained" size="small" sx={{ borderRadius: 2, background:'linear-gradient(135deg, #667eea, #764ba2)', textTransform:'none', fontWeight: 600 }}>
 Get Started
 </Button>
 </Box>
 </Box>

 {/* -- Hero Section -- */}
 <Box
 sx={{
 background:'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
 color:'white',
 py: 8,
 px: 4,
 textAlign:'center',
 position:'relative',
 overflow:'hidden',
'&::before': {
 content:'""',
 position:'absolute',
 top:'-30%',
 right:'-10%',
 width: 300,
 height: 300,
 borderRadius:'50%',
 background:'radial-gradient(circle, rgba(102,126,234,0.4), transparent 70%)',
 },
 }}
 >
 <Chip label="Now in Public Beta" sx={{ mb: 3, bgcolor:'rgba(255,255,255,0.12)', color:'white', fontWeight: 600, border:'1px solid rgba(255,255,255,0.15)' }} />
 <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2, fontSize: { xs:'1.8rem', sm:'2.4rem' } }}>
 Build, Ship & Scale<br />
 <Box component="span" sx={{ background:'linear-gradient(90deg, #667eea, #f093fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 Your Dream Product
 </Box>
 </Typography>
 <Typography variant="body1" sx={{ color:'rgba(255,255,255,0.7)', mb: 4, maxWidth: 540, mx:'auto', lineHeight: 1.7 }}>
 The all-in-one platform that helps startups and solopreneurs launch production-ready SaaS applications in record time. No complex infrastructure needed.
 </Typography>
 <Box sx={{ display:'flex', gap: 2, justifyContent:'center', flexWrap:'wrap' }}>
 <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ borderRadius: 3, px: 4, py: 1.5, background:'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700, textTransform:'none', fontSize:'1rem', boxShadow:'0 8px 30px rgba(102,126,234,0.4)' }}>
 Start Building Free
 </Button>
 <Button variant="outlined" size="large" startIcon={<PlayArrowIcon />} sx={{ borderRadius: 3, px: 4, py: 1.5, color:'white', borderColor:'rgba(255,255,255,0.3)', textTransform:'none', fontWeight: 600, fontSize:'1rem' }}>
 Watch Demo
 </Button>
 </Box>
 <Box sx={{ mt: 4, display:'flex', justifyContent:'center', alignItems:'center', gap: 2, flexWrap:'wrap' }}>
 <AvatarGroup max={4} sx={{'& .MuiAvatar-root': { width: 28, height: 28, border:'2px solid #302b63', fontSize:'0.7rem' } }}>
 <Avatar src="https://i.pravatar.cc/30?img=10" />
 <Avatar src="https://i.pravatar.cc/30?img=11" />
 <Avatar src="https://i.pravatar.cc/30?img=12" />
 <Avatar src="https://i.pravatar.cc/30?img=13" />
 </AvatarGroup>
 <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.6)' }}>2,400+ builders already onboard</Typography>
 </Box>
 </Box>

 {/* -- Trusted By -- */}
 <Box sx={{ py: 4, px: 3, textAlign:'center', bgcolor:'#fafbfc', borderTop:'1px solid #f0f0f0' }}>
 <Typography variant="overline" sx={{ color:'#aaa', letterSpacing: 2, fontWeight: 600 }}>Trusted by teams at</Typography>
 <Box sx={{ display:'flex', justifyContent:'center', gap: 5, mt: 2, flexWrap:'wrap', alignItems:'center', opacity: 0.45 }}>
 {['Stripe','Vercel','Notion','Linear','Figma'].map((brand) => (
 <Typography key={brand} variant="h6" sx={{ fontWeight: 800, color:'#333', fontSize:'1.1rem' }}>{brand}</Typography>
 ))}
 </Box>
 </Box>

 {/* -- Feature Cards -- */}
 <Box sx={{ py: 6, px: 3 }}>
 <Typography variant="h5" sx={{ textAlign:'center', fontWeight: 800, mb: 1, color:'#1a1a2e' }}>Everything You Need to Launch</Typography>
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 5, maxWidth: 500, mx:'auto' }}>
 From authentication to analytics, every feature is built-in so you can focus on what makes your product unique.
 </Typography>
 <Grid container spacing={2.5}>
 {[
 { icon: <BoltIcon />, title:'Lightning Fast', desc:'Sub-100ms response times with global edge caching and optimised queries.', color:'#667eea', bg:'#eef0ff' },
 { icon: <LockIcon />, title:'Enterprise Security', desc:'SOC 2 compliant with end-to-end encryption and role-based access controls.', color:'#27ae60', bg:'#e8f5e9' },
 { icon: <TrendingUpIcon />, title:'Built-in Analytics', desc:'Real-time dashboards tracking MRR, churn, LTV and user engagement metrics.', color:'#f39c12', bg:'#fff8e1' },
 { icon: <PeopleIcon />, title:'Team Collaboration', desc:'Invite unlimited team members with granular permissions and activity logs.', color:'#e74c3c', bg:'#fce4ec' },
 { icon: <SpeedIcon />, title:'Auto-Scaling', desc:'Seamlessly handles 10 to 10 million users without any configuration changes.', color:'#9b59b6', bg:'#f3e5f5' },
 { icon: <SupportIcon />, title:'24/7 Support', desc:'Dedicated support team with <2 hour response times and onboarding assistance.', color:'#00bcd4', bg:'#e0f7fa' },
 ].map((feature, i) => (
 <Grid item xs={12} sm={6} key={i}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #f0f0f0', height:'100%', transition:'all 0.25s','&:hover': { boxShadow:'0 8px 24px rgba(0,0,0,0.06)', borderColor:'transparent' } }}>
 <Avatar sx={{ bgcolor: feature.bg, color: feature.color, mb: 2, width: 44, height: 44 }}>
 {feature.icon}
 </Avatar>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 0.5 }}>{feature.title}</Typography>
 <Typography variant="body2" sx={{ color:'#777', lineHeight: 1.6 }}>{feature.desc}</Typography>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* -- Social Proof Stats -- */}
 <Box sx={{ py: 5, px: 3, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'white' }}>
 <Grid container spacing={3} textAlign="center">
 {[
 { value:'10K+', label:'Active Users' },
 { value:'99.9%', label:'Uptime SLA' },
 { value:'4.9*', label:'Average Rating' },
 { value:'$2.4M', label:'Revenue Generated' },
 ].map((s, i) => (
 <Grid item xs={6} sm={3} key={i}>
 <Typography variant="h4" sx={{ fontWeight: 800 }}>{s.value}</Typography>
 <Typography variant="body2" sx={{ opacity: 0.8 }}>{s.label}</Typography>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* -- CTA Footer -- */}
 <Box sx={{ py: 6, textAlign:'center', px: 3 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color:'#1a1a2e' }}>Ready to Get Started?</Typography>
 <Typography variant="body1" sx={{ color:'#888', mb: 4, maxWidth: 460, mx:'auto' }}>
 Join thousands of founders who launched their SaaS with our platform. Free tier available -- no credit card required.
 </Typography>
 <Button variant="contained" size="large" sx={{ borderRadius: 3, px: 5, py: 1.5, background:'linear-gradient(135deg, #667eea, #764ba2)', textTransform:'none', fontWeight: 700, fontSize:'1rem' }}>
 Create Your Free Account
 </Button>
 </Box>
 </Box>
 );

 case'thanks':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* -- Minimal Nav -- */}
 <Box sx={{ display:'flex', justifyContent:'center', py: 2, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 22, color:'#27ae60' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 </Box>

 {/* -- Success Hero -- */}
 <Box sx={{ textAlign:'center', pt: 6, pb: 5, px: 3, background:'linear-gradient(180deg, #e8f5e9 0%, #ffffff 100%)' }}>
 <Box sx={{
 width: 80, height: 80, borderRadius:'50%', mx:'auto', mb: 3,
 background:'linear-gradient(135deg, #27ae60, #2ecc71)',
 display:'flex', alignItems:'center', justifyContent:'center',
 boxShadow:'0 12px 40px rgba(39, 174, 96, 0.3)',
 animation:'none',
 }}>
 <CheckCircleIcon sx={{ fontSize: 44, color:'white' }} />
 </Box>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>
 You're All Set! 
 </Typography>
 <Typography variant="body1" sx={{ color:'#666', maxWidth: 500, mx:'auto', lineHeight: 1.7 }}>
 Thank you for signing up. Your account has been created successfully and you're ready to start building amazing things.
 </Typography>
 </Box>

 {/* -- Confirmation Details -- */}
 <Box sx={{ px: 3, pb: 4, maxWidth: 520, mx:'auto' }}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #e8e8e8', mb: 3, bgcolor:'#fafbfc' }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 2 }}>Order Confirmation</Typography>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Typography variant="body2" sx={{ color:'#888' }}>Plan</Typography>
 <Typography variant="body2" sx={{ fontWeight: 600 }}>Professional</Typography>
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Typography variant="body2" sx={{ color:'#888' }}>Billing</Typography>
 <Typography variant="body2" sx={{ fontWeight: 600 }}>Monthly</Typography>
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', mb: 1 }}>
 <Typography variant="body2" sx={{ color:'#888' }}>Amount</Typography>
 <Typography variant="body2" sx={{ fontWeight: 700, color:'#27ae60' }}>$29.00/mo</Typography>
 </Box>
 <Divider sx={{ my: 2 }} />
 <Box sx={{ display:'flex', justifyContent:'space-between' }}>
 <Typography variant="body2" sx={{ color:'#888' }}>Confirmation #</Typography>
 <Typography variant="body2" sx={{ fontWeight: 600, fontFamily:'monospace' }}>ACM-2026-8847</Typography>
 </Box>
 </Paper>

 {/* -- Email Notification -- */}
 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #e3f2fd', bgcolor:'#f5f9ff', display:'flex', alignItems:'center', gap: 2, mb: 3 }}>
 <Avatar sx={{ bgcolor:'#e3f2fd', color:'#1976d2', width: 40, height: 40 }}>
 <EmailIcon sx={{ fontSize: 20 }} />
 </Avatar>
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>Confirmation email sent</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>Check your inbox at j.smith@example.com</Typography>
 </Box>
 </Paper>

 {/* -- Next Steps -- */}
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>What's Next?</Typography>
 <Stack spacing={1.5} sx={{ mb: 4 }}>
 {[
 { step:'1', title:'Complete your profile', desc:'Add your company details and logo', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
 { step:'2', title:'Create your first project', desc:'Use a template or start from scratch', icon: <RocketIcon sx={{ fontSize: 18 }} /> },
 { step:'3', title:'Invite your team', desc:'Collaborate with up to 10 team members', icon: <GroupIcon sx={{ fontSize: 18 }} /> },
 ].map((item) => (
 <Paper key={item.step} elevation={0} sx={{ p: 2, borderRadius: 2.5, border:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap: 2, transition:'all 0.2s','&:hover': { borderColor:'#667eea', bgcolor:'#fafafe' } }}>
 <Avatar sx={{ bgcolor:'#eef0ff', color:'#667eea', width: 36, height: 36, fontSize:'0.85rem', fontWeight: 700 }}>
 {item.icon}
 </Avatar>
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{item.title}</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{item.desc}</Typography>
 </Box>
 </Paper>
 ))}
 </Stack>

 <Stack direction="row" spacing={2} justifyContent="center">
 <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ borderRadius: 3, px: 4, background:'linear-gradient(135deg, #667eea, #764ba2)', textTransform:'none', fontWeight: 700, flex: 1 }}>
 Go to Dashboard
 </Button>
 <Button variant="outlined" size="large" sx={{ borderRadius: 3, px: 3, textTransform:'none', fontWeight: 600, borderColor:'#ddd', color:'#666' }}>
 Back to Home
 </Button>
 </Stack>
 </Box>
 </Box>
 );

 case'members':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* -- Members Nav -- */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0', bgcolor:'white' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 22, color:'#9b59b6' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Tooltip title="Notifications">
 <IconButton size="small">
 <Badge badgeContent={3} color="error" sx={{'& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
 <NotificationsIcon sx={{ fontSize: 20, color:'#666' }} />
 </Badge>
 </IconButton>
 </Tooltip>
 <Tooltip title="Settings">
 <IconButton size="small"><SettingsIcon sx={{ fontSize: 20, color:'#666' }} /></IconButton>
 </Tooltip>
 <Avatar src="https://i.pravatar.cc/36?img=32" sx={{ width: 34, height: 34, border:'2px solid #e0e0e0' }} />
 </Box>
 </Box>

 {/* -- Welcome Banner -- */}
 <Box sx={{ background:'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', color:'white', px: 3, py: 4, position:'relative', overflow:'hidden' }}>
 <Box sx={{ position:'relative', zIndex: 1 }}>
 <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Welcome back, Jessica </Typography>
 <Typography variant="body2" sx={{ opacity: 0.85 }}>You have 3 new lessons available and your streak is on fire -- 14 days!</Typography>
 </Box>
 </Box>

 {/* -- Quick Stats -- */}
 <Box sx={{ px: 3, mt: -2, position:'relative', zIndex: 2 }}>
 <Grid container spacing={2}>
 {[
 { label:'Current Plan', value:'Premium', sub:'Renews Mar 15, 2026', icon: <EmojiEventsIcon sx={{ color:'#f39c12' }} />, color:'#fff8e1' },
 { label:'Courses Completed', value:'12 / 24', sub:'50% complete', icon: <SchoolIcon sx={{ color:'#667eea' }} />, color:'#eef0ff' },
 { label:'Streak', value:'14 Days', sub:'Personal best!', icon: <BoltIcon sx={{ color:'#e74c3c' }} />, color:'#fce4ec' },
 ].map((stat, i) => (
 <Grid item xs={12} sm={4} key={i}>
 <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, display:'flex', alignItems:'center', gap: 2 }}>
 <Avatar sx={{ bgcolor: stat.color, width: 44, height: 44 }}>{stat.icon}</Avatar>
 <Box>
 <Typography variant="caption" sx={{ color:'#999', fontWeight: 500 }}>{stat.label}</Typography>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e', lineHeight: 1.2 }}>{stat.value}</Typography>
 <Typography variant="caption" sx={{ color:'#aaa' }}>{stat.sub}</Typography>
 </Box>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* -- Content Library -- */}
 <Box sx={{ px: 3, py: 4 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 2.5 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Continue Learning</Typography>
 <Button size="small" sx={{ textTransform:'none', fontWeight: 600, color:'#667eea' }}>View All {'>'}</Button>
 </Box>
 <Stack spacing={2}>
 {[
 { title:'Building Your First Workflow', progress: 75, lessons:'6/8 lessons', image:'https://picsum.photos/seed/course1/80/80', tag:'In Progress' },
 { title:'Advanced Automation Patterns', progress: 30, lessons:'3/10 lessons', image:'https://picsum.photos/seed/course2/80/80', tag:'In Progress' },
 { title:'Scaling to 10K Users', progress: 0, lessons:'0/12 lessons', image:'https://picsum.photos/seed/course3/80/80', tag:'New' },
 ].map((course, i) => (
 <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, border:'1px solid #f0f0f0', display:'flex', gap: 2, alignItems:'center', transition:'all 0.2s','&:hover': { boxShadow:'0 4px 16px rgba(0,0,0,0.06)', borderColor:'transparent' } }}>
 <Box
 component="img"
 src={course.image}
 alt={course.title}
 sx={{ width: 64, height: 64, borderRadius: 2, objectFit:'cover', flexShrink: 0 }}
 onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
 e.currentTarget.style.display ='none';
 }}
 />
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.5 }}>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{course.title}</Typography>
 <Chip label={course.tag} size="small" sx={{ height: 20, fontSize:'0.65rem', fontWeight: 700, bgcolor: course.tag ==='New' ?'#e3f2fd' :'#f3e5f5', color: course.tag ==='New' ?'#1976d2' :'#9b59b6' }} />
 </Box>
 <Typography variant="caption" sx={{ color:'#999' }}>{course.lessons}</Typography>
 <LinearProgress variant="determinate" value={course.progress} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor:'#f0f0f0','& .MuiLinearProgress-bar': { borderRadius: 3, background:'linear-gradient(90deg, #667eea, #764ba2)' } }} />
 </Box>
 <Button size="small" variant="outlined" sx={{ borderRadius: 2, textTransform:'none', fontWeight: 600, minWidth:'auto', px: 2, borderColor:'#e0e0e0', color:'#667eea' }}>
 {course.progress > 0 ?'Resume' :'Start'}
 </Button>
 </Paper>
 ))}
 </Stack>
 </Box>

 {/* -- Quick Actions -- */}
 <Box sx={{ px: 3, pb: 3, display:'flex', gap: 1.5, flexWrap:'wrap' }}>
 {[
 { label:'My Profile', icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
 { label:'Billing', icon: <CreditCardIcon sx={{ fontSize: 16 }} /> },
 { label:'Support', icon: <SupportIcon sx={{ fontSize: 16 }} /> },
 { label:'Community', icon: <GroupIcon sx={{ fontSize: 16 }} /> },
 ].map((a, i) => (
 <Chip key={i} icon={a.icon} label={a.label} variant="outlined" clickable sx={{ borderColor:'#e8e8e8', fontWeight: 500,'&:hover': { borderColor:'#667eea', bgcolor:'#fafafe' } }} />
 ))}
 </Box>
 </Box>
 );

 case'checkout':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* -- Checkout Nav -- */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 22, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <LockIcon sx={{ fontSize: 14, color:'#27ae60' }} />
 <Typography variant="caption" sx={{ color:'#27ae60', fontWeight: 600 }}>Secure Checkout</Typography>
 </Box>
 </Box>

 <Box sx={{ px: 3, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', color:'#1a1a2e', mb: 1 }}>Choose Your Plan</Typography>
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 4 }}>All plans include a 14-day free trial. No credit card required to start.</Typography>

 {/* -- Pricing Cards -- */}
 <Grid container spacing={2.5} sx={{ mb: 4 }}>
 {[
 {
 name:'Starter',
 price:'$0',
 period:'/month',
 desc:'Perfect for individuals getting started',
 features: ['1 Project','1,000 API calls/mo','Community support','Basic analytics'],
 cta:'Current Plan',
 popular: false,
 gradient:'',
 disabled: true,
 },
 {
 name:'Professional',
 price:'$29',
 period:'/month',
 desc:'For growing teams and startups',
 features: ['Unlimited projects','100K API calls/mo','Priority support','Advanced analytics','Custom domains','Team collaboration'],
 cta:'Upgrade Now',
 popular: true,
 gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 disabled: false,
 },
 {
 name:'Enterprise',
 price:'$99',
 period:'/month',
 desc:'For large organisations needing scale',
 features: ['Everything in Pro','Unlimited API calls','Dedicated support','SLA guarantee','SSO & SAML','Custom integrations'],
 cta:'Contact Sales',
 popular: false,
 gradient:'',
 disabled: false,
 },
 ].map((plan, i) => (
 <Grid item xs={12} sm={4} key={i}>
 <Paper
 elevation={plan.popular ? 8 : 0}
 sx={{
 p: 3, borderRadius: 3, height:'100%', position:'relative',
 border: plan.popular ?'2px solid #667eea' :'1px solid #e8e8e8',
 bgcolor: plan.popular ?'#fafafe' :'white',
 transition:'all 0.2s',
'&:hover': { boxShadow:'0 8px 30px rgba(0,0,0,0.08)' },
 }}
 >
 {plan.popular && (
 <Chip label="Most Popular" size="small" sx={{ position:'absolute', top: -12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', fontWeight: 700, fontSize:'0.7rem' }} />
 )}
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#667eea', mb: 1, textTransform:'uppercase', fontSize:'0.75rem', letterSpacing: 1 }}>{plan.name}</Typography>
 <Box sx={{ display:'flex', alignItems:'baseline', mb: 1 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e' }}>{plan.price}</Typography>
 <Typography variant="body2" sx={{ color:'#999', ml: 0.5 }}>{plan.period}</Typography>
 </Box>
 <Typography variant="caption" sx={{ color:'#999', display:'block', mb: 2 }}>{plan.desc}</Typography>
 <Divider sx={{ mb: 2 }} />
 <Stack spacing={1} sx={{ mb: 3 }}>
 {plan.features.map((f, fi) => (
 <Box key={fi} sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <CheckCircleIcon sx={{ fontSize: 16, color:'#27ae60' }} />
 <Typography variant="body2" sx={{ color:'#555', fontSize:'0.82rem' }}>{f}</Typography>
 </Box>
 ))}
 </Stack>
 <Button
 variant={plan.popular ?'contained' :'outlined'}
 fullWidth
 disabled={plan.disabled}
 sx={{
 borderRadius: 2.5, py: 1.2, textTransform:'none', fontWeight: 700, fontSize:'0.9rem',
 ...(plan.popular ? { background: plan.gradient, boxShadow:'0 4px 16px rgba(102,126,234,0.3)','&:hover': { background:'linear-gradient(135deg, #5a6fd6, #6a3f96)' } } : { borderColor:'#ddd', color:'#666' }),
 }}
 >
 {plan.cta}
 </Button>
 </Paper>
 </Grid>
 ))}
 </Grid>

 {/* -- Payment Form -- */}
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #e8e8e8', maxWidth: 480, mx:'auto', mb: 3 }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, color:'#1a1a2e' }}>Payment Details</Typography>
 <TextField fullWidth label="Cardholder Name" placeholder="Jessica Smith" size="small" sx={{ mb: 2,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 <TextField fullWidth label="Card Number" placeholder="4242 4242 4242 4242" size="small" sx={{ mb: 2,'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 InputProps={{ endAdornment: <CreditCardIcon sx={{ color:'#ccc' }} /> }}
 />
 <Grid container spacing={2} sx={{ mb: 3 }}>
 <Grid item xs={6}>
 <TextField fullWidth label="Expiry" placeholder="MM / YY" size="small" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 </Grid>
 <Grid item xs={6}>
 <TextField fullWidth label="CVC" placeholder="123" size="small" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 InputProps={{ endAdornment: <LockIcon sx={{ color:'#ccc', fontSize: 18 }} /> }}
 />
 </Grid>
 </Grid>
 <Button variant="contained" fullWidth size="large" sx={{ borderRadius: 3, py: 1.5, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textTransform:'none', fontWeight: 700, fontSize:'1rem', boxShadow:'0 6px 24px rgba(102,126,234,0.35)' }}>
 Start 14-Day Free Trial
 </Button>
 </Paper>

 {/* -- Trust Badges -- */}
 <Box sx={{ display:'flex', justifyContent:'center', gap: 3, flexWrap:'wrap', mb: 2 }}>
 {[
 { icon: <ShieldIcon sx={{ fontSize: 16 }} />, label:'256-bit SSL' },
 { icon: <VerifiedIcon sx={{ fontSize: 16 }} />, label:'SOC 2 Certified' },
 { icon: <LockIcon sx={{ fontSize: 16 }} />, label:'PCI Compliant' },
 ].map((badge, i) => (
 <Box key={i} sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
 <Box sx={{ color:'#aaa' }}>{badge.icon}</Box>
 <Typography variant="caption" sx={{ color:'#aaa', fontWeight: 500 }}>{badge.label}</Typography>
 </Box>
 ))}
 </Box>
 <Typography variant="caption" sx={{ display:'block', textAlign:'center', color:'#bbb' }}>
 30-day money-back guarantee - Cancel anytime - No hidden fees
 </Typography>
 </Box>
 </Box>
 );

 case'admin':
 return (
 <Box sx={{ overflow:'hidden', bgcolor:'#f5f6fa' }}>
 {/* -- Admin Top Bar -- */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, bgcolor:'#1a1a2e', color:'white' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <DashboardIcon sx={{ fontSize: 22, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Admin Panel</Typography>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Tooltip title="Notifications">
 <IconButton size="small">
 <Badge badgeContent={7} color="error" sx={{'& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
 <NotificationsIcon sx={{ fontSize: 20, color:'rgba(255,255,255,0.7)' }} />
 </Badge>
 </IconButton>
 </Tooltip>
 <Avatar src="https://i.pravatar.cc/32?img=15" sx={{ width: 30, height: 30, border:'2px solid rgba(255,255,255,0.2)' }} />
 </Box>
 </Box>

 <Box sx={{ p: 3 }}>
 {/* -- Date & Title -- */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 3 }}>
 <Box>
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Dashboard Overview</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>Last updated: Feb 11, 2026 at 09:42 AM</Typography>
 </Box>
 <Button variant="outlined" size="small" sx={{ borderRadius: 2, textTransform:'none', fontWeight: 600, borderColor:'#ddd', color:'#666' }}>
 Download Report
 </Button>
 </Box>

 {/* -- KPI Cards -- */}
 <Grid container spacing={2} sx={{ mb: 3 }}>
 {[
 { label:'Total Revenue', value:'$48,295', change:'+12.5%', up: true, icon: <AttachMoneyIcon />, color:'#27ae60', bg:'#e8f5e9' },
 { label:'Active Users', value:'3,847', change:'+8.2%', up: true, icon: <PeopleIcon />, color:'#667eea', bg:'#eef0ff' },
 { label:'New Signups', value:'284', change:'+23.1%', up: true, icon: <TrendingUpIcon />, color:'#f39c12', bg:'#fff8e1' },
 { label:'Churn Rate', value:'2.4%', change:'-0.3%', up: false, icon: <BarChartIcon />, color:'#e74c3c', bg:'#fce4ec' },
 ].map((kpi, i) => (
 <Grid item xs={6} sm={3} key={i}>
 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee', bgcolor:'white' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb: 1.5 }}>
 <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color, width: 38, height: 38 }}>{kpi.icon}</Avatar>
 <Chip label={kpi.change} size="small" sx={{ height: 22, fontSize:'0.7rem', fontWeight: 700, bgcolor: kpi.up ?'#e8f5e9' :'#fce4ec', color: kpi.up ?'#27ae60' :'#e74c3c' }} />
 </Box>
 <Typography variant="h6" sx={{ fontWeight: 800, color:'#1a1a2e', lineHeight: 1.2 }}>{kpi.value}</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{kpi.label}</Typography>
 </Paper>
 </Grid>
 ))}
 </Grid>

 {/* -- Revenue Chart Placeholder -- */}
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee', bgcolor:'white', mb: 3 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 2 }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Revenue Overview</Typography>
 <Box sx={{ display:'flex', gap: 1 }}>
 {['7D','30D','90D','1Y'].map((period) => (
 <Chip key={period} label={period} size="small" clickable sx={{ height: 26, fontSize:'0.7rem', fontWeight: 600, bgcolor: period ==='30D' ?'#667eea' :'#f5f5f5', color: period ==='30D' ?'white' :'#888' }} />
 ))}
 </Box>
 </Box>
 {/* Simulated chart bars */}
 <Box sx={{ display:'flex', alignItems:'flex-end', gap: 1, height: 120, px: 1 }}>
 {[45, 62, 58, 75, 88, 72, 95, 80, 68, 92, 78, 85].map((h, i) => (
 <Box key={i} sx={{ flex: 1, height:`${h}%`, borderRadius:'4px 4px 0 0', background: i === 6 ?'linear-gradient(180deg, #667eea, #764ba2)' :'linear-gradient(180deg, #e8eaf6, #c5cae9)', transition:'all 0.2s','&:hover': { background:'linear-gradient(180deg, #667eea, #764ba2)', transform:'scaleY(1.05)' } }} />
 ))}
 </Box>
 <Box sx={{ display:'flex', justifyContent:'space-between', mt: 1, px: 0.5 }}>
 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
 <Typography key={m} variant="caption" sx={{ color:'#ccc', fontSize:'0.6rem', flex: 1, textAlign:'center' }}>{m}</Typography>
 ))}
 </Box>
 </Paper>

 {/* -- Recent Users Table -- */}
 <Paper elevation={0} sx={{ borderRadius: 3, border:'1px solid #eee', bgcolor:'white', overflow:'hidden', mb: 3 }}>
 <Box sx={{ px: 3, py: 2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Recent Users</Typography>
 <Button size="small" sx={{ textTransform:'none', fontWeight: 600, color:'#667eea' }}>View All {'>'}</Button>
 </Box>
 <TableContainer>
 <Table size="small">
 <TableHead>
 <TableRow sx={{ bgcolor:'#fafbfc' }}>
 <TableCell sx={{ fontWeight: 600, color:'#888', borderBottom:'1px solid #f0f0f0' }}>User</TableCell>
 <TableCell sx={{ fontWeight: 600, color:'#888', borderBottom:'1px solid #f0f0f0' }}>Plan</TableCell>
 <TableCell sx={{ fontWeight: 600, color:'#888', borderBottom:'1px solid #f0f0f0' }}>Status</TableCell>
 <TableCell sx={{ fontWeight: 600, color:'#888', borderBottom:'1px solid #f0f0f0' }}>MRR</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {[
 { name:'Sarah Chen', email:'s.chen@startup.io', plan:'Enterprise', status:'Active', mrr:'$99', avatar:'https://i.pravatar.cc/28?img=47' },
 { name:'Marcus Johnson', email:'m.johnson@scale.co', plan:'Professional', status:'Active', mrr:'$29', avatar:'https://i.pravatar.cc/28?img=68' },
 { name:'Emily Rodriguez', email:'e.rod@dev.studio', plan:'Professional', status:'Trial', mrr:'$0', avatar:'https://i.pravatar.cc/28?img=45' },
 { name:'David Park', email:'d.park@cloud.io', plan:'Starter', status:'Churned', mrr:'$0', avatar:'https://i.pravatar.cc/28?img=60' },
 ].map((user, i) => (
 <TableRow key={i} sx={{'&:hover': { bgcolor:'#fafbfc' },'& td': { borderBottom:'1px solid #f5f5f5' } }}>
 <TableCell>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <Avatar src={user.avatar} sx={{ width: 28, height: 28 }} />
 <Box>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e', lineHeight: 1.2 }}>{user.name}</Typography>
 <Typography variant="caption" sx={{ color:'#bbb' }}>{user.email}</Typography>
 </Box>
 </Box>
 </TableCell>
 <TableCell><Typography variant="body2" sx={{ color:'#555' }}>{user.plan}</Typography></TableCell>
 <TableCell>
 <Chip
 label={user.status}
 size="small"
 sx={{
 height: 22, fontSize:'0.7rem', fontWeight: 600,
 bgcolor: user.status ==='Active' ?'#e8f5e9' : user.status ==='Trial' ?'#e3f2fd' :'#fce4ec',
 color: user.status ==='Active' ?'#27ae60' : user.status ==='Trial' ?'#1976d2' :'#e74c3c',
 }}
 />
 </TableCell>
 <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{user.mrr}</Typography></TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Paper>

 {/* -- System Health -- */}
 <Grid container spacing={2}>
 <Grid item xs={12} sm={6}>
 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee', bgcolor:'white' }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>System Health</Typography>
 {[
 { label:'API Server', status:'Operational', color:'#27ae60' },
 { label:'Database', status:'Operational', color:'#27ae60' },
 { label:'CDN', status:'Operational', color:'#27ae60' },
 { label:'Email Service', status:'Degraded', color:'#f39c12' },
 ].map((sys, i) => (
 <Box key={i} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1.5 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <CircleIcon sx={{ fontSize: 8, color: sys.color }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{sys.label}</Typography>
 </Box>
 <Typography variant="caption" sx={{ color: sys.color, fontWeight: 600 }}>{sys.status}</Typography>
 </Box>
 ))}
 </Paper>
 </Grid>
 <Grid item xs={12} sm={6}>
 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee', bgcolor:'white' }}>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>Recent Activity</Typography>
 <Stack spacing={1.5}>
 {[
 { text:'New enterprise signup: Acme Corp', time:'2 min ago', color:'#27ae60', icon: <VerifiedIcon sx={{ fontSize: 14 }} /> },
 { text:'Payment received: $99.00', time:'15 min ago', color:'#667eea', icon: <AttachMoneyIcon sx={{ fontSize: 14 }} /> },
 { text:'Support ticket #482 resolved', time:'1 hr ago', color:'#f39c12', icon: <SupportIcon sx={{ fontSize: 14 }} /> },
 { text:'Database backup completed', time:'3 hrs ago', color:'#27ae60', icon: <CloudDoneIcon sx={{ fontSize: 14 }} /> },
 ].map((activity, i) => (
 <Box key={i} sx={{ display:'flex', alignItems:'flex-start', gap: 1.5 }}>
 <Avatar sx={{ width: 28, height: 28, bgcolor:`${activity.color}15`, color: activity.color }}>{activity.icon}</Avatar>
 <Box>
 <Typography variant="body2" sx={{ color:'#444', fontSize:'0.82rem', lineHeight: 1.3 }}>{activity.text}</Typography>
 <Typography variant="caption" sx={{ color:'#bbb' }}>{activity.time}</Typography>
 </Box>
 </Box>
 ))}
 </Stack>
 </Paper>
 </Grid>
 </Grid>
 </Box>
 </Box>
 );

 case'pricing':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* Nav */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 24, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 3, alignItems:'center' }}>
 {['Features','Pricing','About','Contact'].map((item) => (
 <Typography key={item} variant="body2" sx={{ color: item ==='Pricing' ?'#667eea' :'#666', fontWeight: item ==='Pricing' ? 700 : 500, cursor:'pointer' }}>
 {item}
 </Typography>
 ))}
 </Box>
 </Box>

 {/* Hero */}
 <Box sx={{ textAlign:'center', pt: 6, pb: 4, px: 3 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>Simple, Transparent Pricing</Typography>
 <Typography variant="body1" sx={{ color:'#888', maxWidth: 500, mx:'auto', mb: 3 }}>
 Start free, scale as you grow. No hidden fees, no surprises. Cancel anytime.
 </Typography>
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', gap: 1.5, mb: 4 }}>
 <Typography variant="body2" sx={{ color:'#888', fontWeight: 600 }}>Monthly</Typography>
 <Box sx={{ width: 44, height: 24, borderRadius: 12, bgcolor:'#667eea', position:'relative', cursor:'pointer' }}>
 <Box sx={{ width: 20, height: 20, borderRadius:'50%', bgcolor:'#fff', position:'absolute', top: 2, right: 2, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
 </Box>
 <Typography variant="body2" sx={{ color:'#667eea', fontWeight: 700 }}>Annual <Chip label="Save 20%" size="small" sx={{ ml: 0.5, height: 20, fontSize:'0.65rem', fontWeight: 700, bgcolor:'#e8f5e9', color:'#27ae60' }} /></Typography>
 </Box>
 </Box>

 {/* Plans */}
 <Box sx={{ px: 3, pb: 4 }}>
 <Grid container spacing={2.5} justifyContent="center">
 {[
 { name:'Starter', price:'$0', period:'/mo', desc:'Perfect for side projects and MVPs', features: ['1 project','1,000 page views/mo','Community support','Basic analytics','SSL included'], cta:'Get Started Free', popular: false },
 { name:'Professional', price:'$29', period:'/mo', desc:'For growing businesses and teams', features: ['10 projects','100,000 page views/mo','Priority support','Advanced analytics','Custom domains','Team collaboration','API access'], cta:'Start Free Trial', popular: true },
 { name:'Enterprise', price:'$99', period:'/mo', desc:'For large-scale production apps', features: ['Unlimited projects','Unlimited page views','Dedicated support','Custom analytics','SLA guarantee','SSO & SAML','Audit logs','Custom integrations'], cta:'Contact Sales', popular: false },
 ].map((plan, i) => (
 <Grid item xs={12} sm={4} key={i}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: plan.popular ?'2px solid #667eea' :'1px solid #eee', position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
 {plan.popular && (
 <Chip label="Most Popular" size="small" sx={{ position:'absolute', top: -12, left:'50%', transform:'translateX(-50%)', bgcolor:'#667eea', color:'#fff', fontWeight: 700, fontSize:'0.7rem' }} />
 )}
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 0.5 }}>{plan.name}</Typography>
 <Typography variant="body2" sx={{ color:'#888', mb: 2, minHeight: 40 }}>{plan.desc}</Typography>
 <Box sx={{ mb: 2 }}>
 <Typography variant="h3" component="span" sx={{ fontWeight: 800, color:'#1a1a2e' }}>{plan.price}</Typography>
 <Typography component="span" sx={{ color:'#999' }}>{plan.period}</Typography>
 </Box>
 <Divider sx={{ mb: 2 }} />
 <Box sx={{ flex: 1, mb: 2 }}>
 {plan.features.map((f, fi) => (
 <Box key={fi} sx={{ display:'flex', gap: 1, mb: 0.75, alignItems:'center' }}>
 <CheckCircleIcon sx={{ fontSize: 16, color:'#27ae60' }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{f}</Typography>
 </Box>
 ))}
 </Box>
 <Button variant={plan.popular ?'contained' :'outlined'} fullWidth sx={{ fontWeight: 700, borderRadius: 2, textTransform:'none', ...(plan.popular ? { background:'linear-gradient(135deg, #667eea, #764ba2)' } : { borderColor:'#ddd', color:'#555' }) }}>
 {plan.cta}
 </Button>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* Feature Comparison */}
 <Box sx={{ px: 3, pb: 4 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, textAlign:'center', mb: 3, color:'#1a1a2e' }}>Compare Plans</Typography>
 <TableContainer component={Paper} elevation={0} sx={{ border:'1px solid #eee', borderRadius: 3 }}>
 <Table size="small">
 <TableHead>
 <TableRow sx={{ bgcolor:'#fafbfc' }}>
 <TableCell sx={{ fontWeight: 700, color:'#1a1a2e' }}>Feature</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color:'#888' }}>Starter</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color:'#667eea' }}>Professional</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color:'#888' }}>Enterprise</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {[
 { feature:'Projects', starter:'1', pro:'10', enterprise:'Unlimited' },
 { feature:'Team members', starter:'1', pro:'5', enterprise:'Unlimited' },
 { feature:'Custom domains', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'API access', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'Priority support', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'SSO / SAML', starter:'--', pro:'--', enterprise:'[OK]' },
 ].map((row, i) => (
 <TableRow key={i} sx={{'& td': { borderBottom:'1px solid #f5f5f5' } }}>
 <TableCell sx={{ color:'#555', fontWeight: 500 }}>{row.feature}</TableCell>
 <TableCell align="center" sx={{ color: row.starter ==='[OK]' ?'#27ae60' : row.starter ==='--' ?'#ccc' :'#555', fontWeight: 600 }}>{row.starter}</TableCell>
 <TableCell align="center" sx={{ color: row.pro ==='[OK]' ?'#27ae60' : row.pro ==='--' ?'#ccc' :'#667eea', fontWeight: 600 }}>{row.pro}</TableCell>
 <TableCell align="center" sx={{ color: row.enterprise ==='[OK]' ?'#27ae60' : row.enterprise ==='--' ?'#ccc' :'#555', fontWeight: 600 }}>{row.enterprise}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Box>

 {/* Trust */}
 <Box sx={{ px: 3, pb: 4, textAlign:'center' }}>
 <Box sx={{ display:'flex', justifyContent:'center', gap: 4, flexWrap:'wrap' }}>
 {[' 256-bit SSL',' No credit card required',' Cancel anytime','$ 30-day money-back'].map((badge, i) => (
 <Typography key={i} variant="body2" sx={{ color:'#888', fontWeight: 600, fontSize:'0.82rem' }}>{badge}</Typography>
 ))}
 </Box>
 </Box>
 </Box>
 );

 case'about':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* Nav */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 24, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 3, alignItems:'center' }}>
 {['Features','Pricing','About','Contact'].map((item) => (
 <Typography key={item} variant="body2" sx={{ color: item ==='About' ?'#667eea' :'#666', fontWeight: item ==='About' ? 700 : 500, cursor:'pointer' }}>
 {item}
 </Typography>
 ))}
 </Box>
 </Box>

 {/* Hero */}
 <Box sx={{ background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'#fff', py: 6, px: 4, textAlign:'center' }}>
 <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>Our Mission</Typography>
 <Typography sx={{ fontSize:'1.05rem', opacity: 0.9, maxWidth: 560, mx:'auto', lineHeight: 1.7 }}>
 We believe every entrepreneur deserves the tools to build and launch
 a world-class SaaS product -- without needing a team of ten engineers.
 </Typography>
 </Box>

 {/* Story */}
 <Box sx={{ px: 4, py: 5 }}>
 <Grid container spacing={4} alignItems="center">
 <Grid item xs={12} sm={6}>
 <Typography variant="overline" sx={{ color:'#667eea', fontWeight: 700, letterSpacing: 1.5 }}>Our Story</Typography>
 <Typography variant="h5" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 2, mt: 1 }}>Born from Frustration, Built with Love</Typography>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.8, mb: 2 }}>
 In 2024, our founders spent months wiring together authentication, billing, dashboards, and landing pages just to test a simple idea. They thought: there has to be a better way.
 </Typography>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.8 }}>
 That frustration became Acme SaaS -- a platform that gives solo founders and small teams everything they need to launch, manage, and scale a SaaS product in days, not months.
 </Typography>
 </Grid>
 <Grid item xs={12} sm={6}>
 <Paper elevation={0} sx={{ height: 200, borderRadius: 3, background:'linear-gradient(135deg, #eef0ff 0%, #f3e5f5 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Typography sx={{ fontSize:'3rem' }}></Typography>
 </Paper>
 </Grid>
 </Grid>
 </Box>

 {/* Values */}
 <Box sx={{ px: 4, py: 4, bgcolor:'#fafbfc' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 1, color:'#1a1a2e' }}>Our Values</Typography>
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 4 }}>The principles that guide everything we build</Typography>
 <Grid container spacing={2.5}>
 {[
 { emoji:'', title:'Speed First', desc:'We ship fast and iterate faster. An imperfect launch beats a perfect plan.' },
 { emoji:'', title:'Transparency', desc:'Open pricing, honest roadmaps, and genuine communication with our users.' },
 { emoji:'', title:'Simplicity', desc:'Complex problems deserve simple solutions. We fight feature bloat relentlessly.' },
 { emoji:'', title:'Empowerment', desc:'We build tools that multiply what a small team can accomplish.' },
 ].map((v, i) => (
 <Grid item xs={12} sm={6} key={i}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee', height:'100%' }}>
 <Typography sx={{ fontSize:'1.5rem', mb: 1 }}>{v.emoji}</Typography>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 0.5 }}>{v.title}</Typography>
 <Typography variant="body2" sx={{ color:'#777', lineHeight: 1.6 }}>{v.desc}</Typography>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* Team */}
 <Box sx={{ px: 4, py: 5 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 1, color:'#1a1a2e' }}>Meet the Team</Typography>
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 4 }}>The people behind the product</Typography>
 <Grid container spacing={3} justifyContent="center">
 {[
 { name:'Alex Turner', role:'Co-Founder & CEO', avatar:'https://i.pravatar.cc/80?img=33' },
 { name:'Priya Sharma', role:'Co-Founder & CTO', avatar:'https://i.pravatar.cc/80?img=32' },
 { name:'Jordan Lee', role:'Head of Design', avatar:'https://i.pravatar.cc/80?img=12' },
 { name:'Sam Nguyen', role:'Lead Engineer', avatar:'https://i.pravatar.cc/80?img=59' },
 ].map((member, i) => (
 <Grid item xs={6} sm={3} key={i}>
 <Box sx={{ textAlign:'center' }}>
 <Avatar src={member.avatar} sx={{ width: 72, height: 72, mx:'auto', mb: 1.5, border:'3px solid #eef0ff' }} />
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e' }}>{member.name}</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>{member.role}</Typography>
 </Box>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* Timeline */}
 <Box sx={{ px: 4, py: 4, bgcolor:'#fafbfc' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, textAlign:'center', mb: 3, color:'#1a1a2e' }}>Our Journey</Typography>
 {[
 { year:'2024', event:'Founded -- first prototype built in 2 weeks' },
 { year:'2024', event:'Public beta launch -- 500 users in first month' },
 { year:'2025', event:'Reached 5,000 active users & $100K ARR' },
 { year:'2026', event:'Enterprise launch -- SOC 2 certification' },
 ].map((item, i) => (
 <Box key={i} sx={{ display:'flex', gap: 2, mb: 2, alignItems:'center' }}>
 <Chip label={item.year} size="small" sx={{ fontWeight: 700, bgcolor:'#667eea', color:'#fff', minWidth: 50 }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{item.event}</Typography>
 </Box>
 ))}
 </Box>

 {/* CTA */}
 <Box sx={{ py: 5, textAlign:'center', px: 3 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color:'#1a1a2e' }}>Want to Join Us?</Typography>
 <Typography variant="body2" sx={{ color:'#888', mb: 3 }}>We're always looking for talented people to help shape the future of SaaS.</Typography>
 <Button variant="contained" sx={{ borderRadius: 3, px: 4, background:'linear-gradient(135deg, #667eea, #764ba2)', textTransform:'none', fontWeight: 700 }}>
 View Open Positions
 </Button>
 </Box>
 </Box>
 );

 case'faq':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* Nav */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 24, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 3, alignItems:'center' }}>
 {['Features','Pricing','FAQ','Contact'].map((item) => (
 <Typography key={item} variant="body2" sx={{ color: item ==='FAQ' ?'#667eea' :'#666', fontWeight: item ==='FAQ' ? 700 : 500, cursor:'pointer' }}>
 {item}
 </Typography>
 ))}
 </Box>
 </Box>

 {/* Hero */}
 <Box sx={{ textAlign:'center', pt: 6, pb: 4, px: 3 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>Frequently Asked Questions</Typography>
 <Typography variant="body1" sx={{ color:'#888', maxWidth: 500, mx:'auto' }}>
 Everything you need to know about Acme SaaS. Can't find your answer? Contact us.
 </Typography>
 </Box>

 {/* FAQ Categories */}
 {[
 {
 category:'Getting Started',
 questions: [
 { q:'How do I create my first project?', a:'After signing up, click "New Project" on your dashboard. Choose a template, give it a name, and you\'re ready to start building in under 60 seconds.' },
 { q:'Do I need coding experience?', a:'Not at all! Our visual editor and AI assistant handle the heavy lifting. However, developers can access the full code for advanced customisations.' },
 { q:'Can I import an existing website?', a:'Yes -- use our import tool to bring in content from any URL. We\'ll parse the structure and map it to our template system automatically.' },
 ],
 },
 {
 category:'Billing & Plans',
 questions: [
 { q:'Is there a free plan?', a:'Yes! Our Starter plan is free forever with 1 project and 1,000 page views per month. No credit card required to get started.' },
 { q:'Can I change plans at any time?', a:'Absolutely. Upgrade, downgrade, or cancel anytime. Plan changes take effect immediately and we prorate the billing automatically.' },
 { q:'Do you offer refunds?', a:'We offer a 30-day money-back guarantee, no questions asked. If you\'re not satisfied, just contact support for a full refund.' },
 ],
 },
 {
 category:'Technical',
 questions: [
 { q:'What tech stack do you use?', a:'React 18 + TypeScript on the frontend, NestJS on the backend, with n8n for workflow automation. Everything runs on serverless infrastructure.' },
 { q:'Can I use my own domain?', a:'Yes -- Professional and Enterprise plans support custom domains. Just point your DNS and we handle SSL certificates automatically.' },
 ],
 },
 ].map((section, si) => (
 <Box key={si} sx={{ px: 3, mb: 4 }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#667eea', mb: 2, pl: 1 }}>{section.category}</Typography>
 {section.questions.map((faq, qi) => (
 <Paper key={qi} elevation={0} sx={{ mb: 1.5, border:'1px solid #eee', borderRadius: 2, overflow:'hidden' }}>
 <Box sx={{ p: 2, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer','&:hover': { bgcolor:'#fafbfc' } }}>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{faq.q}</Typography>
 <ExpandMoreIcon sx={{ fontSize: 20, color:'#999' }} />
 </Box>
 <Box sx={{ px: 2, pb: 2 }}>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.7 }}>{faq.a}</Typography>
 </Box>
 </Paper>
 ))}
 </Box>
 ))}

 {/* Still have questions */}
 <Box sx={{ mx: 3, mb: 4, p: 3, borderRadius: 3, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'#fff', textAlign:'center' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Still have questions?</Typography>
 <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>Our support team is here to help. Average response time: under 2 hours.</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color:'#667eea', fontWeight: 700, textTransform:'none', borderRadius: 2 }}>
 Contact Support
 </Button>
 </Box>
 </Box>
 );

 case'contact':
 return (
 <Box sx={{ overflow:'hidden' }}>
 {/* Nav */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #f0f0f0' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <BoltIcon sx={{ fontSize: 24, color:'#667eea' }} />
 <Typography variant="subtitle1" sx={{ fontWeight: 800, color:'#1a1a2e' }}>Acme SaaS</Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 3, alignItems:'center' }}>
 {['Features','Pricing','About','Contact'].map((item) => (
 <Typography key={item} variant="body2" sx={{ color: item ==='Contact' ?'#667eea' :'#666', fontWeight: item ==='Contact' ? 700 : 500, cursor:'pointer' }}>
 {item}
 </Typography>
 ))}
 </Box>
 </Box>

 {/* Hero */}
 <Box sx={{ textAlign:'center', pt: 6, pb: 4, px: 3 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>Get in Touch</Typography>
 <Typography variant="body1" sx={{ color:'#888', maxWidth: 500, mx:'auto' }}>
 Have a question, feedback, or just want to say hello? We'd love to hear from you.
 </Typography>
 </Box>

 <Box sx={{ px: 3, pb: 5 }}>
 <Grid container spacing={4}>
 {/* Contact Form */}
 <Grid item xs={12} sm={7}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>Send us a Message</Typography>
 <Grid container spacing={2}>
 <Grid item xs={6}>
 <TextField fullWidth size="small" label="First Name" variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 </Grid>
 <Grid item xs={6}>
 <TextField fullWidth size="small" label="Last Name" variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 </Grid>
 <Grid item xs={12}>
 <TextField fullWidth size="small" label="Email Address" variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 </Grid>
 <Grid item xs={12}>
 <FormControl fullWidth size="small">
 <InputLabel>Subject</InputLabel>
 <Select label="Subject" defaultValue="" sx={{ borderRadius: 2 }}>
 <MenuItem value="general">General Inquiry</MenuItem>
 <MenuItem value="support">Technical Support</MenuItem>
 <MenuItem value="billing">Billing Question</MenuItem>
 <MenuItem value="partnership">Partnership</MenuItem>
 <MenuItem value="enterprise">Enterprise Sales</MenuItem>
 </Select>
 </FormControl>
 </Grid>
 <Grid item xs={12}>
 <TextField fullWidth multiline rows={4} label="Message" variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 </Grid>
 <Grid item xs={12}>
 <Button variant="contained" fullWidth sx={{ background:'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700, textTransform:'none', borderRadius: 2, py: 1.2 }}>
 Send Message
 </Button>
 </Grid>
 </Grid>
 </Paper>
 </Grid>

 {/* Contact Info */}
 <Grid item xs={12} sm={5}>
 <Stack spacing={2.5}>
 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee' }}>
 <Box sx={{ display:'flex', gap: 2, alignItems:'flex-start' }}>
 <Avatar sx={{ bgcolor:'#eef0ff', color:'#667eea', width: 40, height: 40 }}><EmailIcon /></Avatar>
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Email</Typography>
 <Typography variant="body2" sx={{ color:'#667eea' }}>hello@acmesaas.com</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>We reply within 2 hours</Typography>
 </Box>
 </Box>
 </Paper>

 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee' }}>
 <Box sx={{ display:'flex', gap: 2, alignItems:'flex-start' }}>
 <Avatar sx={{ bgcolor:'#e8f5e9', color:'#27ae60', width: 40, height: 40 }}><PhoneIcon /></Avatar>
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Phone</Typography>
 <Typography variant="body2" sx={{ color:'#555' }}>+1 (555) 123-4567</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>Mon-Fri, 9 AM - 6 PM EST</Typography>
 </Box>
 </Box>
 </Paper>

 <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee' }}>
 <Box sx={{ display:'flex', gap: 2, alignItems:'flex-start' }}>
 <Avatar sx={{ bgcolor:'#fce4ec', color:'#e74c3c', width: 40, height: 40 }}><LocationIcon /></Avatar>
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e' }}>Office</Typography>
 <Typography variant="body2" sx={{ color:'#555' }}>123 Innovation Drive</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>San Francisco, CA 94105</Typography>
 </Box>
 </Box>
 </Paper>

 {/* Map placeholder */}
 <Paper elevation={0} sx={{ height: 120, borderRadius: 3, border:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#f5f5f5' }}>
 <Box sx={{ textAlign:'center' }}>
 <LocationIcon sx={{ fontSize: 28, color:'#ccc' }} />
 <Typography variant="caption" sx={{ display:'block', color:'#bbb' }}>Map placeholder</Typography>
 </Box>
 </Paper>
 </Stack>
 </Grid>
 </Grid>
 </Box>
 </Box>
 );

 default:
 return null;
 }
};

export const TemplatesPage: React.FC = () => {
 const [previewDialog, setPreviewDialog] = useState<PreviewDialogState>({ open: false, template: null });
 const [selectedTemplateIds, setSelectedTemplateIds] = useState<{ [key: string]: boolean }>({});
 const [selectedProjectId, setSelectedProjectId] = useState<string>('');
 const [apps, setApps] = useState<App[]>([]);
 const [loading, setLoading] = useState(false);
 const [appLoading, setAppLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState<string | null>(null);
 const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
 open: false,
 selectedProject: null,
 selectedTemplates: [],
 existingPages: [],
 });

 // Load apps on component mount
 useEffect(() => {
 loadApps();
 }, []);

 const loadApps = async () => {
 try {
 console.log('Loading apps from', API.apps);
 setAppLoading(true);
 const response = await axios.get(API.apps);
 console.log('Response from API:', response.data);
 const appsList = response.data?.data || response.data || [];
 console.log('Apps loaded successfully:', appsList);
 console.log('Apps count:', appsList.length);
 setApps(appsList);
 setError(null);
 } catch (err) {
 console.error('Failed to load apps:', err);
 setError('Failed to load projects. Please check the backend is running.');
 } finally {
 setAppLoading(false);
 }
 };

 const handleOpenPreview = (template: Template) => {
 setPreviewDialog({ open: true, template });
 };

 const handleClosePreview = () => {
 setPreviewDialog({ open: false, template: null });
 };

 const handleTemplateSelect = (templateId: string) => {
 try {
 setSelectedTemplateIds((prev) => {
 const updated = {
 ...prev,
 [templateId]: !prev[templateId],
 };
 console.log('Template selection updated:', templateId, updated[templateId]);
 return updated;
 });
 } catch (err) {
 console.error('Error selecting template:', err);
 }
 };

 const getSelectedTemplateCount = () => {
 return Object.values(selectedTemplateIds).filter(Boolean).length;
 };

 const handleSaveToProject = async () => {
 if (!selectedProjectId) {
 setError('Please select a project');
 return;
 }

 const selectedCount = getSelectedTemplateCount();
 if (selectedCount === 0) {
 setError('Please select at least one template');
 return;
 }

 try {
 setLoading(true);
 const projectId = parseInt(selectedProjectId, 10);
 const project = apps.find((a) => a.id === projectId);
 if (!project) {
 setError('Selected project not found');
 return;
 }

 // Get existing pages for this project
 const existingResponse = await axios.get(`${API.pages}?app_id=${projectId}`);
 const existingPages = existingResponse.data?.data || existingResponse.data || [];

 // Get selected template objects
 const selectedTemplates = templates.filter((t) => selectedTemplateIds[t.id]);

 // Show confirmation dialog with warnings
 setConfirmDialog({
 open: true,
 selectedProject: project,
 selectedTemplates,
 existingPages,
 });

 setError(null);
 } catch (err) {
 console.error('Failed to check existing pages:', err);
 setError('Failed to check existing pages');
 } finally {
 setLoading(false);
 }
 };

 const getOverwriteWarnings = (): string[] => {
 const warnings: string[] = [];
 const existingPageTypes = new Set(confirmDialog.existingPages.map((p) => p.page_type));

 confirmDialog.selectedTemplates.forEach((template) => {
 if (existingPageTypes.has(template.type)) {
 const existingPage = confirmDialog.existingPages.find((p) => p.page_type === template.type);
 warnings.push(`"${template.title}" will overwrite existing page "${existingPage?.title}"`);
 }
 });

 return warnings;
 };

 const getTemplateContentJson = (type: string, template: Template): Record<string, any> => {
 switch (type) {
 case'index':
 return {
 page_type:'index',
 description: template.description,
 features: template.features,
 nav: {
 brand:'Acme SaaS',
 links: ['Features','Pricing','About','Blog'],
 cta:'Get Started',
 },
 hero: {
 badge:' Now in Public Beta',
 headline:'Build, Ship & Scale Your Dream Product',
 subheading:'The all-in-one platform that helps startups and solopreneurs launch production-ready SaaS applications in record time. No complex infrastructure needed.',
 cta_primary: { text:'Start Building Free', url:'/signup' },
 cta_secondary: { text:'Watch Demo', url:'/demo' },
 social_proof:'2,400+ builders already onboard',
 },
 trusted_by: ['Stripe','Vercel','Notion','Linear','Figma'],
 features_section: {
 headline:'Everything You Need to Launch',
 subheading:'From authentication to analytics, every feature is built-in so you can focus on what makes your product unique.',
 items: [
 { icon:'bolt', title:'Lightning Fast', description:'Sub-100ms response times with global edge caching and optimised queries.', color:'#667eea' },
 { icon:'lock', title:'Enterprise Security', description:'SOC 2 compliant with end-to-end encryption and role-based access controls.', color:'#27ae60' },
 { icon:'trending_up', title:'Built-in Analytics', description:'Real-time dashboards tracking MRR, churn, LTV and user engagement metrics.', color:'#f39c12' },
 { icon:'people', title:'Team Collaboration', description:'Invite unlimited team members with granular permissions and activity logs.', color:'#e74c3c' },
 { icon:'speed', title:'Auto-Scaling', description:'Seamlessly handles 10 to 10 million users without any configuration changes.', color:'#9b59b6' },
 { icon:'support', title:'24/7 Support', description:'Dedicated support team with <2 hour response times and onboarding assistance.', color:'#00bcd4' },
 ],
 },
 stats: [
 { value:'10K+', label:'Active Users' },
 { value:'99.9%', label:'Uptime SLA' },
 { value:'4.9*', label:'Average Rating' },
 { value:'$2.4M', label:'Revenue Generated' },
 ],
 cta_footer: {
 headline:'Ready to Get Started?',
 subheading:'Join thousands of founders who launched their SaaS with our platform. Free tier available -- no credit card required.',
 button_text:'Create Your Free Account',
 },
 };

 case'thanks':
 return {
 page_type:'thanks',
 description: template.description,
 features: template.features,
 hero: {
 headline: "You're All Set! ",
 subheading:'Thank you for signing up. Your account has been created successfully and you\'re ready to start building amazing things.',
 },
 order_confirmation: {
 plan:'Professional',
 billing:'Monthly',
 amount:'$29.00/mo',
 confirmation_number:'ACM-2026-8847',
 },
 email_notification: {
 message:'Confirmation email sent',
 detail:'Check your inbox at j.smith@example.com',
 },
 next_steps: [
 { step:'1', title:'Complete your profile', description:'Add your company details and logo' },
 { step:'2', title:'Create your first project', description:'Use a template or start from scratch' },
 { step:'3', title:'Invite your team', description:'Collaborate with up to 10 team members' },
 ],
 cta_primary: { text:'Go to Dashboard', url:'/dashboard' },
 cta_secondary: { text:'Back to Home', url:'/' },
 };

 case'members':
 return {
 page_type:'members',
 description: template.description,
 features: template.features,
 welcome: {
 headline:'Welcome back, Jessica ',
 subheading:'You have 3 new lessons available and your streak is on fire -- 14 days!',
 },
 stats: [
 { label:'Current Plan', value:'Premium', sub:'Renews Mar 15, 2026' },
 { label:'Courses Completed', value:'12 / 24', sub:'50% complete' },
 { label:'Streak', value:'14 Days', sub:'Personal best!' },
 ],
 courses: [
 { title:'Building Your First Workflow', progress: 75, lessons:'6/8 lessons', tag:'In Progress' },
 { title:'Advanced Automation Patterns', progress: 30, lessons:'3/10 lessons', tag:'In Progress' },
 { title:'Scaling to 10K Users', progress: 0, lessons:'0/12 lessons', tag:'New' },
 ],
 quick_actions: ['My Profile','Billing','Support','Community'],
 };

 case'checkout':
 return {
 page_type:'checkout',
 description: template.description,
 features: template.features,
 headline:'Choose Your Plan',
 subheading:'All plans include a 14-day free trial. No credit card required to start.',
 plans: [
 {
 name:'Starter',
 price:'$0',
 period:'/month',
 description:'Perfect for individuals getting started',
 features: ['1 Project','1,000 API calls/mo','Community support','Basic analytics'],
 cta:'Current Plan',
 popular: false,
 disabled: true,
 },
 {
 name:'Professional',
 price:'$29',
 period:'/month',
 description:'For growing teams and startups',
 features: ['Unlimited projects','100K API calls/mo','Priority support','Advanced analytics','Custom domains','Team collaboration'],
 cta:'Upgrade Now',
 popular: true,
 disabled: false,
 },
 {
 name:'Enterprise',
 price:'$99',
 period:'/month',
 description:'For large organisations needing scale',
 features: ['Everything in Pro','Unlimited API calls','Dedicated support','SLA guarantee','SSO & SAML','Custom integrations'],
 cta:'Contact Sales',
 popular: false,
 disabled: false,
 },
 ],
 payment_form: {
 fields: ['Cardholder Name','Card Number','Expiry','CVC'],
 submit_text:'Start 14-Day Free Trial',
 },
 trust_badges: ['256-bit SSL','SOC 2 Certified','PCI Compliant'],
 guarantee:'30-day money-back guarantee - Cancel anytime - No hidden fees',
 };

 case'admin':
 return {
 page_type:'admin',
 description: template.description,
 features: template.features,
 dashboard_title:'Dashboard Overview',
 kpis: [
 { label:'Total Revenue', value:'$48,295', change:'+12.5%', up: true },
 { label:'Active Users', value:'3,847', change:'+8.2%', up: true },
 { label:'New Signups', value:'284', change:'+23.1%', up: true },
 { label:'Churn Rate', value:'2.4%', change:'-0.3%', up: false },
 ],
 revenue_chart: {
 title:'Revenue Overview',
 periods: ['7D','30D','90D','1Y'],
 default_period:'30D',
 data: [45, 62, 58, 75, 88, 72, 95, 80, 68, 92, 78, 85],
 months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
 },
 recent_users: [
 { name:'Sarah Chen', email:'s.chen@startup.io', plan:'Enterprise', status:'Active', mrr:'$99' },
 { name:'Marcus Johnson', email:'m.johnson@scale.co', plan:'Professional', status:'Active', mrr:'$29' },
 { name:'Emily Rodriguez', email:'e.rod@dev.studio', plan:'Professional', status:'Trial', mrr:'$0' },
 { name:'David Park', email:'d.park@cloud.io', plan:'Starter', status:'Churned', mrr:'$0' },
 ],
 system_health: [
 { label:'API Server', status:'Operational' },
 { label:'Database', status:'Operational' },
 { label:'CDN', status:'Operational' },
 { label:'Email Service', status:'Degraded' },
 ],
 recent_activity: [
 { text:'New enterprise signup: Acme Corp', time:'2 min ago' },
 { text:'Payment received: $99.00', time:'15 min ago' },
 { text:'Support ticket #482 resolved', time:'1 hr ago' },
 { text:'Database backup completed', time:'3 hrs ago' },
 ],
 };

 case'pricing':
 return {
 page_type:'pricing',
 description: template.description,
 features: template.features,
 hero: {
 headline:'Simple, Transparent Pricing',
 subheading:'Start free, scale as you grow. No hidden fees, no surprises. Cancel anytime.',
 },
 billing_toggle: { options: ['Monthly','Annual'], discount:'Save 20%' },
 plans: [
 {
 name:'Starter',
 price_monthly:'$0',
 price_annual:'$0',
 period:'/mo',
 description:'Perfect for side projects and MVPs',
 features: ['1 project','1,000 page views/mo','Community support','Basic analytics','SSL included'],
 cta:'Get Started Free',
 popular: false,
 },
 {
 name:'Professional',
 price_monthly:'$29',
 price_annual:'$23',
 period:'/mo',
 description:'For growing businesses and teams',
 features: ['10 projects','100,000 page views/mo','Priority support','Advanced analytics','Custom domains','Team collaboration','API access'],
 cta:'Start Free Trial',
 popular: true,
 },
 {
 name:'Enterprise',
 price_monthly:'$99',
 price_annual:'$79',
 period:'/mo',
 description:'For large-scale production apps',
 features: ['Unlimited projects','Unlimited page views','Dedicated support','Custom analytics','SLA guarantee','SSO & SAML','Audit logs','Custom integrations'],
 cta:'Contact Sales',
 popular: false,
 },
 ],
 comparison: {
 title:'Compare Plans',
 rows: [
 { feature:'Projects', starter:'1', pro:'10', enterprise:'Unlimited' },
 { feature:'Team members', starter:'1', pro:'5', enterprise:'Unlimited' },
 { feature:'Custom domains', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'API access', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'Priority support', starter:'--', pro:'[OK]', enterprise:'[OK]' },
 { feature:'SSO / SAML', starter:'--', pro:'--', enterprise:'[OK]' },
 ],
 },
 trust_badges: [' 256-bit SSL',' No credit card required',' Cancel anytime','$ 30-day money-back'],
 };

 case'about':
 return {
 page_type:'about',
 description: template.description,
 features: template.features,
 hero: {
 headline:'Our Mission',
 subheading:'We believe every entrepreneur deserves the tools to build and launch a world-class SaaS product -- without needing a team of ten engineers.',
 },
 story: {
 overline:'Our Story',
 headline:'Born from Frustration, Built with Love',
 paragraphs: [
'In 2024, our founders spent months wiring together authentication, billing, dashboards, and landing pages just to test a simple idea. They thought: there has to be a better way.',
'That frustration became Acme SaaS -- a platform that gives solo founders and small teams everything they need to launch, manage, and scale a SaaS product in days, not months.',
 ],
 },
 values: [
 { emoji:'', title:'Speed First', description:'We ship fast and iterate faster. An imperfect launch beats a perfect plan.' },
 { emoji:'', title:'Transparency', description:'Open pricing, honest roadmaps, and genuine communication with our users.' },
 { emoji:'', title:'Simplicity', description:'Complex problems deserve simple solutions. We fight feature bloat relentlessly.' },
 { emoji:'', title:'Empowerment', description:'We build tools that multiply what a small team can accomplish.' },
 ],
 team: [
 { name:'Alex Turner', role:'Co-Founder & CEO', avatar:'https://i.pravatar.cc/80?img=33' },
 { name:'Priya Sharma', role:'Co-Founder & CTO', avatar:'https://i.pravatar.cc/80?img=32' },
 { name:'Jordan Lee', role:'Head of Design', avatar:'https://i.pravatar.cc/80?img=12' },
 { name:'Sam Nguyen', role:'Lead Engineer', avatar:'https://i.pravatar.cc/80?img=59' },
 ],
 timeline: [
 { year:'2024', event:'Founded -- first prototype built in 2 weeks' },
 { year:'2024', event:'Public beta launch -- 500 users in first month' },
 { year:'2025', event:'Reached 5,000 active users & $100K ARR' },
 { year:'2026', event:'Enterprise launch -- SOC 2 certification' },
 ],
 cta: {
 headline:'Want to Join Us?',
 subheading: "We're always looking for talented people to help shape the future of SaaS.",
 button_text:'View Open Positions',
 },
 };

 case'faq':
 return {
 page_type:'faq',
 description: template.description,
 features: template.features,
 hero: {
 headline:'Frequently Asked Questions',
 subheading: "Everything you need to know about Acme SaaS. Can't find your answer? Contact us.",
 },
 categories: [
 {
 title:'Getting Started',
 questions: [
 { question:'How do I create my first project?', answer: "After signing up, click'New Project' on your dashboard. Choose a template, give it a name, and you're ready to start building in under 60 seconds." },
 { question:'Do I need coding experience?', answer:'Not at all! Our visual editor and AI assistant handle the heavy lifting. However, developers can access the full code for advanced customisations.' },
 { question:'Can I import an existing website?', answer: "Yes -- use our import tool to bring in content from any URL. We'll parse the structure and map it to our template system automatically." },
 ],
 },
 {
 title:'Billing & Plans',
 questions: [
 { question:'Is there a free plan?', answer:'Yes! Our Starter plan is free forever with 1 project and 1,000 page views per month. No credit card required to get started.' },
 { question:'Can I change plans at any time?', answer:'Absolutely. Upgrade, downgrade, or cancel anytime. Plan changes take effect immediately and we prorate the billing automatically.' },
 { question:'Do you offer refunds?', answer: "We offer a 30-day money-back guarantee, no questions asked. If you're not satisfied, just contact support for a full refund." },
 ],
 },
 {
 title:'Technical',
 questions: [
 { question:'What tech stack do you use?', answer:'React 18 + TypeScript on the frontend, NestJS on the backend, with n8n for workflow automation. Everything runs on serverless infrastructure.' },
 { question:'Can I use my own domain?', answer:'Yes -- Professional and Enterprise plans support custom domains. Just point your DNS and we handle SSL certificates automatically.' },
 ],
 },
 ],
 support_cta: {
 headline:'Still have questions?',
 subheading:'Our support team is here to help. Average response time: under 2 hours.',
 button_text:'Contact Support',
 },
 };

 case'contact':
 return {
 page_type:'contact',
 description: template.description,
 features: template.features,
 hero: {
 headline:'Get in Touch',
 subheading: "Have a question, feedback, or just want to say hello? We'd love to hear from you.",
 },
 form: {
 title:'Send us a Message',
 fields: [
 { name:'first_name', label:'First Name', type:'text', half: true },
 { name:'last_name', label:'Last Name', type:'text', half: true },
 { name:'email', label:'Email Address', type:'email' },
 { name:'subject', label:'Subject', type:'select', options: ['General Inquiry','Technical Support','Billing Question','Partnership','Enterprise Sales'] },
 { name:'message', label:'Message', type:'textarea', rows: 4 },
 ],
 submit_text:'Send Message',
 },
 contact_info: [
 { icon:'email', title:'Email', value:'hello@acmesaas.com', detail:'We reply within 2 hours' },
 { icon:'phone', title:'Phone', value:'+1 (555) 123-4567', detail:'Mon-Fri, 9 AM - 6 PM EST' },
 { icon:'location', title:'Office', value:'123 Innovation Drive', detail:'San Francisco, CA 94105' },
 ],
 };

 default:
 return {
 description: template.description,
 features: template.features,
 };
 }
 };

 const handleConfirmSave = async () => {
 if (!confirmDialog.selectedProject) return;

 try {
 setLoading(true);

 // Create pages for each selected template
 for (const template of confirmDialog.selectedTemplates) {
 await axios.post(API.pages, {
 app_id: confirmDialog.selectedProject.id,
 page_type: template.type,
 title: template.title,
 content_json: getTemplateContentJson(template.type, template),
 });
 }

 setSuccess(
`Successfully added ${confirmDialog.selectedTemplates.length} template(s) to "${confirmDialog.selectedProject.name}"`
 );
 setSelectedTemplateIds({});
 setSelectedProjectId('');
 setConfirmDialog({ open: false, selectedProject: null, selectedTemplates: [], existingPages: [] });

 // Clear success message after 4 seconds
 setTimeout(() => setSuccess(null), 4000);
 } catch (err) {
 console.error('Failed to save templates:', err);
 setError('Failed to save templates to project');
 } finally {
 setLoading(false);
 }
 };

 const handleCloseConfirm = () => {
 setConfirmDialog({ open: false, selectedProject: null, selectedTemplates: [], existingPages: [] });
 };

 const overwriteWarnings = getOverwriteWarnings();
 const selectedCount = getSelectedTemplateCount();

 const [mainTab, setMainTab] = useState(0);

 return (
 <Box sx={{ backgroundColor:'#fafbfc', minHeight:'100vh' }}>

 {/* ===== TOP TABS ===== */}
 <Box sx={{ borderBottom:'1px solid rgba(0,0,0,0.06)', bgcolor:'white', position:'sticky', top: 0, zIndex: 10 }}>
 <Container maxWidth="lg">
 <Tabs
 value={mainTab}
 onChange={(_, v) => setMainTab(v)}
 sx={{
 minHeight: 48,
'& .MuiTab-root': {
 minHeight: 48,
 fontSize:'0.88rem',
 fontWeight: 700,
 textTransform:'none',
 gap: 1,
 },
'& .MuiTabs-indicator': {
 background:'linear-gradient(90deg, #667eea, #764ba2)',
 height: 3,
 borderRadius:'3px 3px 0 0',
 },
 }}
 >
 <Tab icon={<TemplateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Page Templates" />
 <Tab icon={<BlogIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Blog Manager" />
 </Tabs>
 </Container>
 </Box>

 {/* ===== TAB: Blog Manager ===== */}
 {mainTab === 1 && <BlogPage />}

 {/* ===== TAB: Page Templates ===== */}
 {mainTab === 0 && (
 <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
 {/* Success/Error Alerts */}
 {success && (
 <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
 {success}
 </Alert>
 )}
 {error && (
 <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
 {error}
 </Alert>
 )}

 {/* ===== SELECTION BAR ===== */}
 {selectedCount > 0 && apps && (
 <Paper
 elevation={4}
 sx={{
 p: 2.5,
 mb: 4,
 background:'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
 borderRadius: 3,
 display:'flex',
 justifyContent:'space-between',
 alignItems:'center',
 flexWrap:'wrap',
 gap: 2,
 border:'1px solid rgba(33, 150, 243, 0.2)',
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <Avatar sx={{ bgcolor:'#1976d2', width: 36, height: 36 }}>
 <CheckCircleIcon sx={{ fontSize: 20 }} />
 </Avatar>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e' }}>
 {selectedCount} template{selectedCount > 1 ?'s' :''} selected
 </Typography>
 </Box>

 <FormControl sx={{ minWidth: 240 }} size="small">
 <InputLabel id="project-select-label">Assign to project</InputLabel>
 <Select
 labelId="project-select-label"
 id="project-select"
 value={selectedProjectId}
 onChange={(e) => {
 console.log('Project selected:', e.target.value);
 setSelectedProjectId(e.target.value);
 }}
 label="Assign to project"
 disabled={appLoading || apps.length === 0}
 sx={{ backgroundColor:'white', borderRadius: 2 }}
 >
 {appLoading && (
 <MenuItem disabled>
 <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
 </MenuItem>
 )}
 {!appLoading && apps.length === 0 && <MenuItem disabled>No projects available</MenuItem>}
 {!appLoading &&
 apps.length > 0 &&
 apps.map((app) => (
 <MenuItem key={`app-${app.id}`} value={String(app.id)}>
 {app.name}
 </MenuItem>
 ))}
 </Select>
 </FormControl>

 <Box sx={{ display:'flex', gap: 1 }}>
 <Button
 variant="outlined"
 size="small"
 onClick={() => {
 setSelectedTemplateIds({});
 setSelectedProjectId('');
 }}
 sx={{ borderRadius: 2 }}
 >
 Clear
 </Button>
 <Button
 variant="contained"
 size="small"
 onClick={handleSaveToProject}
 disabled={loading || !selectedProjectId}
 sx={{
 borderRadius: 2,
 background:'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
 fontWeight: 700,
'&:hover': { background:'linear-gradient(135deg, #219a52 0%, #27ae60 100%)' },
 }}
 >
 Save to Project
 </Button>
 </Box>
 </Paper>
 )}

 {/* ===== SECTION HEADER ===== */}
 <Box id="templates-grid" sx={{ textAlign:'center', mb: 5, scrollMarginTop:'80px' }}>
 <Typography
 variant="h4"
 sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1.5, letterSpacing:'-0.01em' }}
 >
 Choose Your Perfect Template
 </Typography>
 <Typography
 variant="body1"
 sx={{ color:'#666', maxWidth: 560, mx:'auto', lineHeight: 1.7 }}
 >
 Each template is built with best practices in UX design, conversion optimisation,
 and responsive layouts. Select the pages you need and deploy them to any project.
 </Typography>
 </Box>

 {/* ===== TEMPLATES GRID ===== */}
 <Grid container spacing={4}>
 {templates.map((template) => (
 <Grid item xs={12} sm={6} md={4} key={template.id}>
 <Card
 sx={{
 height:'100%',
 display:'flex',
 flexDirection:'column',
 borderRadius: 4,
 overflow:'hidden',
 transition:'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
 border: selectedTemplateIds[template.id]
 ?'2px solid #667eea'
 :'1px solid rgba(0,0,0,0.06)',
 backgroundColor: selectedTemplateIds[template.id] ?'#f5f3ff' :'white',
 boxShadow: selectedTemplateIds[template.id]
 ?'0 8px 30px rgba(102, 126, 234, 0.2)'
 :'0 2px 12px rgba(0,0,0,0.04)',
'&:hover': {
 transform:'translateY(-8px)',
 boxShadow:'0 20px 40px rgba(0,0,0,0.12)',
 },
 }}
 >
 {/* Card Image */}
 <Box sx={{ position:'relative' }}>
 <CardMedia
 component="img"
 height="180"
 image={template.image}
 alt={template.title}
 sx={{
 objectFit:'cover',
 filter:'brightness(0.95)',
 }}
 onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
 e.currentTarget.style.display ='none';
 const parent = e.currentTarget.parentElement;
 if (parent) {
 parent.style.background = template.gradient;
 parent.style.height ='180px';
 parent.style.display ='flex';
 parent.style.alignItems ='center';
 parent.style.justifyContent ='center';
 }
 }}
 />
 {/* Overlay gradient */}
 <Box
 sx={{
 position:'absolute',
 bottom: 0,
 left: 0,
 right: 0,
 height:'60%',
 background:'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
 pointerEvents:'none',
 }}
 />
 {/* Category chip on image */}
 <Chip
 label={template.category}
 size="small"
 sx={{
 position:'absolute',
 top: 12,
 left: 12,
 backgroundColor:'rgba(255,255,255,0.92)',
 fontWeight: 700,
 fontSize:'0.7rem',
 letterSpacing:'0.03em',
 backdropFilter:'blur(8px)',
 }}
 />
 {/* Checkbox on image */}
 <Checkbox
 checked={!!selectedTemplateIds[template.id]}
 onChange={() => handleTemplateSelect(template.id)}
 sx={{
 position:'absolute',
 top: 4,
 right: 4,
 color:'rgba(255,255,255,0.8)',
'&.Mui-checked': { color:'#667eea' },
 bgcolor:'rgba(0,0,0,0.2)',
 borderRadius: 1,
'&:hover': { bgcolor:'rgba(0,0,0,0.35)' },
 }}
 />
 {/* Template icon */}
 <Avatar
 sx={{
 position:'absolute',
 bottom: -20,
 left: 20,
 width: 44,
 height: 44,
 bgcolor:'white',
 boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
 border:'3px solid white',
 }}
 >
 {getTemplateIcon(template.iconType)}
 </Avatar>
 </Box>

 {/* Card Content */}
 <CardContent sx={{ flexGrow: 1, pt: 4, px: 2.5, pb: 1 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color:'#1a1a2e', fontSize:'1.05rem' }}>
 {template.title}
 </Typography>
 <Typography variant="body2" sx={{ mb: 2, color:'#777', lineHeight: 1.6 }}>
 {template.description}
 </Typography>

 {/* Features */}
 <Box sx={{ mb: 2 }}>
 {template.features.map((feature, idx) => (
 <Box
 key={idx}
 sx={{
 display:'flex',
 alignItems:'center',
 mb: 0.75,
 }}
 >
 <CheckCircleIcon sx={{ fontSize: 15, color:'#27ae60', mr: 0.75, flexShrink: 0 }} />
 <Typography variant="body2" sx={{ fontSize:'0.8rem', color:'#555' }}>
 {feature}
 </Typography>
 </Box>
 ))}
 </Box>

 {/* Rating */}
 <Box sx={{ display:'flex', alignItems:'center', gap: 0.75, mt:'auto' }}>
 <Rating value={Math.round(template.rating * 2) / 2} readOnly size="small" />
 <Typography variant="caption" sx={{ color:'#999', fontWeight: 600 }}>
 {template.rating}
 </Typography>
 <Typography variant="caption" sx={{ color:'#bbb' }}>
 ({template.reviews.toLocaleString()} reviews)
 </Typography>
 </Box>
 </CardContent>

 {/* Card Actions */}
 <CardActions sx={{ px: 2.5, pb: 2, pt: 0.5, gap: 1 }}>
 <Button
 size="small"
 startIcon={<PreviewIcon />}
 onClick={() => handleOpenPreview(template)}
 sx={{
 borderRadius: 2,
 textTransform:'none',
 fontWeight: 600,
 color:'#667eea',
 }}
 >
 Live Preview
 </Button>
 <Button
 size="small"
 variant={selectedTemplateIds[template.id] ?'contained' :'outlined'}
 onClick={() => handleTemplateSelect(template.id)}
 sx={{
 borderRadius: 2,
 textTransform:'none',
 fontWeight: 600,
 ml:'auto',
 ...(selectedTemplateIds[template.id]
 ? {
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }
 : {
 borderColor:'#667eea',
 color:'#667eea',
'&:hover': { borderColor:'#5a6fd6', backgroundColor:'#f5f3ff' },
 }),
 }}
 >
 {selectedTemplateIds[template.id] ?'Selected [OK]' :'Select'}
 </Button>
 </CardActions>
 </Card>
 </Grid>
 ))}
 </Grid>

 {/* ===== TESTIMONIALS SECTION ===== */}
 <Box sx={{ mt: 10, mb: 4 }}>
 <Box sx={{ textAlign:'center', mb: 5 }}>
 <Chip
 label="What Our Users Say"
 sx={{
 mb: 2,
 bgcolor:'#f5f3ff',
 color:'#667eea',
 fontWeight: 700,
 fontSize:'0.8rem',
 }}
 />
 <Typography
 variant="h4"
 sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1.5, letterSpacing:'-0.01em' }}
 >
 Loved by Builders Worldwide
 </Typography>
 <Typography variant="body1" sx={{ color:'#666', maxWidth: 500, mx:'auto', lineHeight: 1.7 }}>
 Join thousands of entrepreneurs, developers, and agencies who ship faster
 with our templates.
 </Typography>
 </Box>

 <Grid container spacing={3}>
 {testimonials.map((testimonial, idx) => (
 <Grid item xs={12} sm={6} key={idx}>
 <Paper
 elevation={0}
 sx={{
 p: 3.5,
 height:'100%',
 borderRadius: 4,
 border:'1px solid rgba(0,0,0,0.06)',
 transition:'all 0.3s ease',
'&:hover': {
 boxShadow:'0 12px 36px rgba(0,0,0,0.08)',
 borderColor:'transparent',
 },
 }}
 >
 {/* Stars */}
 <Box sx={{ mb: 2 }}>
 {[...Array(testimonial.rating)].map((_, i) => (
 <StarIcon key={i} sx={{ fontSize: 18, color:'#ffd700' }} />
 ))}
 </Box>

 {/* Quote */}
 <Typography
 variant="body2"
 sx={{
 color:'#444',
 lineHeight: 1.75,
 mb: 3,
 fontSize:'0.92rem',
 fontStyle:'italic',
 position:'relative',
 }}
 >
 "{testimonial.quote}"
 </Typography>

 {/* Author */}
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 <Avatar
 src={testimonial.avatar}
 alt={testimonial.name}
 sx={{ width: 44, height: 44, border:'2px solid #f0f0f0' }}
 />
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e', lineHeight: 1.3 }}>
 {testimonial.name}
 </Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>
 {testimonial.role} - {testimonial.company}
 </Typography>
 </Box>
 </Box>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>

 {/* ===== BOTTOM CTA ===== */}
 <Box
 sx={{
 mt: 8,
 mb: 4,
 p: { xs: 4, md: 6 },
 borderRadius: 5,
 textAlign:'center',
 background:'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
 color:'white',
 position:'relative',
 overflow:'hidden',
'&::before': {
 content:'""',
 position:'absolute',
 top:'-50%',
 right:'-20%',
 width:'400px',
 height:'400px',
 borderRadius:'50%',
 background:'radial-gradient(circle, rgba(102,126,234,0.3), transparent 70%)',
 pointerEvents:'none',
 },
 }}
 >
 <Typography
 variant="h4"
 sx={{ fontWeight: 800, mb: 2, position:'relative', fontSize: { xs:'1.5rem', md:'2.2rem' } }}
 >
 Ready to Build Something Amazing?
 </Typography>
 <Typography
 variant="body1"
 sx={{
 color:'rgba(255,255,255,0.7)',
 mb: 4,
 maxWidth: 500,
 mx:'auto',
 lineHeight: 1.7,
 position:'relative',
 }}
 >
 Select your templates above, assign them to a project, and start customising.
 Your next great product is just a few clicks away.
 </Typography>
 <Button
 variant="contained"
 size="large"
 endIcon={<RocketIcon />}
 onClick={() => {
 document.getElementById('templates-grid')?.scrollIntoView({ behavior:'smooth' });
 }}
 sx={{
 px: 5,
 py: 1.5,
 borderRadius: 3,
 fontSize:'1.05rem',
 fontWeight: 700,
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 boxShadow:'0 8px 32px rgba(102, 126, 234, 0.4)',
 position:'relative',
'&:hover': {
 background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)',
 transform:'translateY(-2px)',
 },
 transition:'all 0.3s ease',
 }}
 >
 Get Started Now
 </Button>
 </Box>
 </Container>
 )}

 {/* ===== PREVIEW DIALOG ===== */}
 <Dialog
 open={previewDialog.open}
 onClose={handleClosePreview}
 maxWidth="md"
 fullWidth
 PaperProps={{
 sx: { borderRadius: 4 },
 }}
 >
 <DialogTitle sx={{ fontWeight: 700, pb: 0, pt: 3, px: 3 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 {previewDialog.template && getTemplateIcon(previewDialog.template.iconType)}
 <Box>
 <Typography variant="h6" sx={{ fontWeight: 700 }}>
 {previewDialog.template?.title}
 </Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>
 Live Preview
 </Typography>
 </Box>
 </Box>
 </DialogTitle>
 <DialogContent sx={{ maxHeight:'60vh', overflow:'auto', px: 3 }}>
 {previewDialog.template && (
 <Box sx={{ mt: 2 }}>
 <Typography variant="body2" sx={{ color:'#555', mb: 3, lineHeight: 1.7 }}>
 {previewDialog.template.longDescription}
 </Typography>
 <Box
 sx={{
 p: 2,
 backgroundColor:'#fafbfc',
 border:'1px solid #e8e8e8',
 borderRadius: 3,
 }}
 >
 <PreviewContent template={previewDialog.template} />
 </Box>
 </Box>
 )}
 </DialogContent>
 <DialogActions sx={{ p: 2.5 }}>
 <Button onClick={handleClosePreview} sx={{ borderRadius: 2 }}>
 Close
 </Button>
 <Button
 variant="contained"
 startIcon={<DownloadIcon />}
 sx={{
 borderRadius: 2,
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'&:hover': { background:'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
 }}
 >
 Use Template
 </Button>
 </DialogActions>
 </Dialog>

 {/* ===== CONFIRMATION DIALOG ===== */}
 <Dialog
 open={confirmDialog.open}
 onClose={handleCloseConfirm}
 maxWidth="sm"
 fullWidth
 PaperProps={{
 sx: { borderRadius: 4 },
 }}
 >
 <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 3 }}>Confirm Save to Project</DialogTitle>
 <DialogContent>
 <Box sx={{ pt: 2 }}>
 <Typography variant="body2" sx={{ mb: 2, color:'#666' }}>
 Ready to add {confirmDialog.selectedTemplates.length} template(s) to{''}
 <strong>"{confirmDialog.selectedProject?.name}"</strong>.
 </Typography>

 {overwriteWarnings.length > 0 && (
 <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
 <Typography variant="body2" sx={{ fontWeight:'bold', mb: 1 }}>
 <WarningIcon sx={{ fontSize: 16, mr: 1, verticalAlign:'text-bottom' }} />
 The following pages will be overwritten:
 </Typography>
 <Box sx={{ ml: 2 }}>
 {overwriteWarnings.map((warning, idx) => (
 <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
 * {warning}
 </Typography>
 ))}
 </Box>
 </Alert>
 )}

 <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
 Templates to be added:
 </Typography>
 <List dense>
 {confirmDialog.selectedTemplates.map((template) => (
 <ListItem key={template.id}>
 <ListItemIcon>
 <CheckCircleIcon sx={{ color:'#27ae60' }} />
 </ListItemIcon>
 <ListItemText primary={template.title} secondary={template.description} />
 </ListItem>
 ))}
 </List>
 </Box>
 </DialogContent>
 <DialogActions sx={{ p: 2.5 }}>
 <Button onClick={handleCloseConfirm} disabled={loading} sx={{ borderRadius: 2 }}>
 Cancel
 </Button>
 <Button
 variant="contained"
 color="success"
 onClick={handleConfirmSave}
 disabled={loading}
 sx={{ borderRadius: 2, fontWeight: 700 }}
 >
 {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
 Confirm & Save
 </Button>
 </DialogActions>
 </Dialog>
 </Box>
 );
};

export default TemplatesPage;
