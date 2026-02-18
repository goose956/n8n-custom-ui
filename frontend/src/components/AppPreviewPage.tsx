import { useState, useEffect, useCallback, Component } from'react';
import { API, API_BASE_URL } from'../config/api';
import {
 Box,
 Typography,
 Paper,
 Button,
 CircularProgress,
 Alert,
 Chip,
 LinearProgress,
 TextField,
 IconButton,
 Tooltip,
} from'@mui/material';
import {
 Check as CheckIcon,
 Bolt as BoltIcon,
 Security as ShieldIcon,
 TrendingUp as TrendingUpIcon,
 People as PeopleIcon,
 Speed as SpeedIcon,
 Support as SupportIcon,
 Lock as LockIcon,
 ArrowBack as BackIcon,
 ArrowForward as ForwardIcon,
 Refresh as RefreshIcon,
 Home as HomeIcon,
 CreditCard as CreditCardIcon,
 Dashboard as DashboardIcon,
 Person as PersonIcon,
 Celebration as CelebrationIcon,
 Circle as CircleIcon,
 Email as EmailIcon,
 MonetizationOn as PricingIcon,
 Info as AboutIcon,
 QuestionAnswer as FaqIcon,
 ContactMail as ContactIcon,
 Phone as PhoneIcon,
 LocationOn as LocationIcon,
 ExpandMore as ExpandMoreIcon,
 ViewStream as ViewStreamIcon,
 WebAsset as SinglePageIcon,
} from'@mui/icons-material';
import { Grid, Avatar, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Select, MenuItem, FormControl, InputLabel } from'@mui/material';
import axios from'axios';

// Error boundary to catch render-phase crashes in page previews
class PreviewErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string }> {
 constructor(props: any) {
 super(props);
 this.state = { hasError: false, errorMessage:'' };
 }
 static getDerivedStateFromError(error: Error) {
 return { hasError: true, errorMessage: error?.message ||'Unknown render error' };
 }
 componentDidUpdate(prevProps: any) {
 if (prevProps.children !== this.props.children && this.state.hasError) {
 this.setState({ hasError: false, errorMessage:'' });
 }
 }
 render() {
 if (this.state.hasError) {
 return (
 <Box sx={{ p: 4, textAlign:'center' }}>
 <Typography sx={{ color:'#e74c3c', fontWeight: 700, mb: 1 }}>Preview crashed</Typography>
 <Typography variant="body2" sx={{ color:'#999' }}>
 This page has content that can't be rendered. Edit the page content to fix it.
 </Typography>
 </Box>
 );
 }
 return this.props.children;
 }
}

interface App {
 id: number;
 name: string;
 slug: string;
 description?: string;
 primary_color?: string;
}

interface Page {
 id: number;
 app_id: number;
 page_type: string;
 title: string;
 content_json?: Record<string, unknown>;
}

// CSS properties the AI design chat may inject into styled-text objects
const CSS_STYLE_KEYS = new Set(['color','fontSize','fontWeight','fontStyle','textDecoration','backgroundColor','textTransform','letterSpacing','opacity','textAlign']);

/**
 * Recursively walk JSON data and convert AI styled-text objects
 * (e.g. {text: "Our Story", color: "orange"}) into <span> elements
 * with inline styles so the preview renderers can display them.
 * Only matches objects where ALL non-text keys are known CSS properties.
 */
function resolveStyledText(obj: any): any {
 if (obj == null || typeof obj !=='object') return obj;
 if (Array.isArray(obj)) return obj.map(resolveStyledText);
 // React element - leave as-is
 if (obj.$$typeof) return obj;

 const keys = Object.keys(obj);

 // Detect styled-text: has string'text' + at least one CSS key, and every
 // non-text key is a known CSS property (avoids false-positives on CTAs etc.)
 if (typeof obj.text ==='string' && keys.length >= 2) {
 const nonTextKeys = keys.filter(k => k !=='text');
 if (nonTextKeys.length > 0 && nonTextKeys.every(k => CSS_STYLE_KEYS.has(k))) {
 const style: Record<string, any> = {};
 for (const k of nonTextKeys) style[k] = obj[k];
 return <span style={style}>{obj.text}</span>;
 }
 }

 // Recurse into regular objects
 const result: Record<string, any> = {};
 for (const key of keys) {
 result[key] = resolveStyledText(obj[key]);
 }
 return result;
}

// Icon resolver for template content
const getIcon = (iconName: string, color?: string) => {
 const sx = { fontSize: 32, color: color ||'#667eea' };
 switch (iconName?.toLowerCase()) {
 case'bolt': case'zap': return <BoltIcon sx={sx} />;
 case'lock': case'shield': case'security': return <ShieldIcon sx={sx} />;
 case'trending_up': case'trending-up': return <TrendingUpIcon sx={sx} />;
 case'people': case'team': return <PeopleIcon sx={sx} />;
 case'speed': case'auto-scaling': return <SpeedIcon sx={sx} />;
 case'support': case'help': return <SupportIcon sx={sx} />;
 default: return <BoltIcon sx={sx} />;
 }
};

// Page type icon
const getPageIcon = (type: string) => {
 switch (type) {
 case'index': return <HomeIcon sx={{ fontSize: 16 }} />;
 case'checkout': return <CreditCardIcon sx={{ fontSize: 16 }} />;
 case'admin': return <DashboardIcon sx={{ fontSize: 16 }} />;
 case'members': return <PersonIcon sx={{ fontSize: 16 }} />;
 case'thanks': return <CelebrationIcon sx={{ fontSize: 16 }} />;
 case'pricing': return <PricingIcon sx={{ fontSize: 16 }} />;
 case'about': return <AboutIcon sx={{ fontSize: 16 }} />;
 case'faq': return <FaqIcon sx={{ fontSize: 16 }} />;
 case'contact': return <ContactIcon sx={{ fontSize: 16 }} />;
 default: return <HomeIcon sx={{ fontSize: 16 }} />;
 }
};

// --- Page Renderers ----------------------------------------------------------

function RenderIndexPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box>
 {/* Nav */}
 {data.nav && (
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #eee' }}>
 <Typography sx={{ fontWeight: 800, fontSize:'1.1rem', color:'#1a1a2e' }}>{data.nav.brand}</Typography>
 <Box sx={{ display:'flex', gap: 2.5, alignItems:'center' }}>
 {data.nav.links?.map((link: any, i: number) => (
 <Typography key={i} sx={{ fontSize:'0.85rem', color:'#555', cursor:'pointer','&:hover': { color: primaryColor } }}>{typeof link ==='string' ? link : link.label}</Typography>
 ))}
 <Button size="small" variant="contained" sx={{ background: gradient, fontWeight: 700, fontSize:'0.8rem', borderRadius: 2, px: 2 }}>
 {data.nav.cta ||'Get Started'}
 </Button>
 </Box>
 </Box>
 )}

 {/* Hero */}
 {data.hero && (
 <Box sx={{ background: gradient, color:'#fff', px: 5, py: 6, textAlign:'center' }}>
 {data.hero.badge && (
 <Chip label={data.hero.badge} sx={{ bgcolor:'rgba(255,255,255,0.2)', color:'#fff', fontWeight: 600, fontSize:'0.8rem', mb: 2 }} />
 )}
 <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>{data.hero.headline}</Typography>
 <Typography sx={{ fontSize:'1.1rem', opacity: 0.92, mb: 3, maxWidth: 650, mx:'auto', lineHeight: 1.6 }}>{data.hero.subheading}</Typography>
 <Box sx={{ display:'flex', gap: 2, justifyContent:'center', mb: 2 }}>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 3, py: 1 }}>
 {data.hero.cta_primary?.text || data.hero.primaryCta ||'Get Started'}
 </Button>
 <Button variant="outlined" sx={{ borderColor:'rgba(255,255,255,0.5)', color:'#fff', fontWeight: 600, px: 3, py: 1 }}>
 {data.hero.cta_secondary?.text || data.hero.secondaryCta ||'Learn More'}
 </Button>
 </Box>
 {data.hero.social_proof && (
 <Typography sx={{ fontSize:'0.85rem', opacity: 0.75, mt: 2 }}>{data.hero.social_proof}</Typography>
 )}
 </Box>
 )}

 {/* Trusted By */}
 {Array.isArray(data.trusted_by) && (
 <Box sx={{ display:'flex', justifyContent:'center', gap: 4, py: 3, bgcolor:'#f9fafb', borderBottom:'1px solid #eee' }}>
 {data.trusted_by.map((brand: string, i: number) => (
 <Typography key={i} sx={{ fontSize:'0.85rem', fontWeight: 700, color:'#bbb', textTransform:'uppercase', letterSpacing:'0.05em' }}>{brand}</Typography>
 ))}
 </Box>
 )}

 {/* Features */}
 {data.features_section && (
 <Box sx={{ px: 4, py: 5, textAlign:'center' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color:'#1a1a2e' }}>{data.features_section.headline}</Typography>
 <Typography sx={{ color:'#888', mb: 4, maxWidth: 550, mx:'auto' }}>{data.features_section.subheading}</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 3 }}>
 {data.features_section.items?.map((f: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 3, border:'1px solid #eee', borderRadius: 3, textAlign:'center', transition:'all 0.2s','&:hover': { transform:'translateY(-4px)', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' } }}>
 <Box sx={{ mb: 1.5 }}>{getIcon(f.icon, f.color)}</Box>
 <Typography sx={{ fontWeight: 700, mb: 0.5, color:'#1a1a2e' }}>{f.title}</Typography>
 <Typography variant="body2" sx={{ color:'#888', lineHeight: 1.6 }}>{f.description}</Typography>
 </Paper>
 ))}
 </Box>
 </Box>
 )}

 {/* Stats */}
 {Array.isArray(data.stats) && (
 <Box sx={{ display:'flex', justifyContent:'center', gap: 5, py: 4, bgcolor:'#f9fafb' }}>
 {data.stats.map((s: any, i: number) => (
 <Box key={i} sx={{ textAlign:'center' }}>
 <Typography sx={{ fontSize:'2rem', fontWeight: 800, color: primaryColor }}>{s.value}</Typography>
 <Typography variant="body2" sx={{ color:'#888', fontWeight: 600 }}>{s.label}</Typography>
 </Box>
 ))}
 </Box>
 )}

 {/* Sections (generic) */}
 {Array.isArray(data.sections) && (
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, px: 4, py: 4 }}>
 {data.sections.map((s: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 3, textAlign:'center', border:'1px solid #eee', borderRadius: 3,'&:hover': { transform:'translateY(-4px)', boxShadow: 3 }, transition:'all 0.2s' }}>
 {s.icon && <Box sx={{ mb: 1.5 }}>{getIcon(s.icon)}</Box>}
 <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{s.title}</Typography>
 <Typography variant="body2" sx={{ color:'#666' }}>{s.description}</Typography>
 </Paper>
 ))}
 </Box>
 )}

 {/* Testimonials */}
 {Array.isArray(data.testimonials) && (
 <Box sx={{ px: 4, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 3 }}>Loved by Teams Worldwide</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
 {data.testimonials.map((t: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, borderLeft:`4px solid ${primaryColor}`, border:'1px solid #eee' }}>
 <Typography variant="body2" sx={{ fontStyle:'italic', color:'#555', mb: 2, lineHeight: 1.7 }}>"{t.quote}"</Typography>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ fontSize:'20px' }}>{t.avatar}</Box>
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.author}</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{t.title}</Typography>
 </Box>
 </Box>
 </Paper>
 ))}
 </Box>
 </Box>
 )}

 {/* Pricing (generic) */}
 {data.pricing && (
 <Box sx={{ px: 4, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 1 }}>{data.pricing.title}</Typography>
 <Typography sx={{ textAlign:'center', color:'#888', mb: 3 }}>{data.pricing.subtitle}</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
 {data.pricing.plans?.map((plan: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 3, border: plan.badge ?`2px solid ${primaryColor}` :'1px solid #eee', position:'relative', borderRadius: 3 }}>
 {plan.badge && (
 <Chip label={plan.badge} size="small" sx={{ position:'absolute', top: -12, left:'50%', transform:'translateX(-50%)', bgcolor: primaryColor, color:'#fff', fontWeight: 700 }} />
 )}
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{plan.name}</Typography>
 <Typography variant="h4" sx={{ fontWeight: 800, color: primaryColor }}>{plan.price}</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{plan.period}</Typography>
 <Box sx={{ mt: 2 }}>
 {plan.features?.map((f: string, fi: number) => (
 <Box key={fi} sx={{ display:'flex', gap: 1, mb: 0.5, alignItems:'center' }}>
 <CheckIcon sx={{ fontSize: 16, color:'#4caf50' }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{f}</Typography>
 </Box>
 ))}
 </Box>
 <Button variant={plan.badge ?'contained' :'outlined'} fullWidth sx={{ mt: 2, background: plan.badge ? gradient : undefined }}>{plan.cta ||'Choose Plan'}</Button>
 </Paper>
 ))}
 </Box>
 </Box>
 )}

 {/* CTA Footer */}
 {data.cta_footer && (
 <Box sx={{ background: gradient, color:'#fff', px: 4, py: 5, textAlign:'center', mt: 2 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.cta_footer.headline}</Typography>
 <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 550, mx:'auto' }}>{data.cta_footer.subheading}</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 4 }}>
 {data.cta_footer.button_text ||'Get Started'}
 </Button>
 </Box>
 )}

 {/* Generic CTA */}
 {data.cta && typeof data.cta ==='string' && (
 <Box sx={{ background: gradient, color:'#fff', p: 4, textAlign:'center', borderRadius: 2, mt: 2 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{data.cta}</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700 }}>{data.ctaButton ||'Get Started'}</Button>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['stats','testimonials','cta_footer','cta']} />
 </Box>
 );
}

function RenderThanksPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box>
 {/* Hero */}
 {data.hero && (
 <Box sx={{ background: gradient, color:'#fff', px: 5, py: 5, textAlign:'center' }}>
 <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>{data.hero.headline}</Typography>
 <Typography sx={{ fontSize:'1.05rem', opacity: 0.92, maxWidth: 600, mx:'auto' }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* Order Confirmation */}
 {data.order_confirmation && (
 <Paper elevation={0} sx={{ mx: 4, mt: 3, p: 3, border:'1px solid #e0e0e0', borderRadius: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 2, fontSize:'1rem' }}>Order Confirmation</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 2 }}>
 {Object.entries(data.order_confirmation).map(([key, val]: [string, any]) => (
 <Box key={key}>
 <Typography variant="caption" sx={{ color:'#999', textTransform:'capitalize' }}>{key.replace(/_/g,'')}</Typography>
 <Typography sx={{ fontWeight: 600, color:'#1a1a2e' }}>{val}</Typography>
 </Box>
 ))}
 </Box>
 </Paper>
 )}

 {/* Email Notification */}
 {data.email_notification && (
 <Paper elevation={0} sx={{ mx: 4, mt: 2, p: 2.5, bgcolor:'#e8f5e9', border:'1px solid #c8e6c9', borderRadius: 3, display:'flex', alignItems:'center', gap: 2 }}>
 <EmailIcon sx={{ color:'#4caf50', fontSize: 28 }} />
 <Box>
 <Typography sx={{ fontWeight: 700, color:'#2e7d32' }}>{data.email_notification.message}</Typography>
 <Typography variant="body2" sx={{ color:'#4caf50' }}>{data.email_notification.detail}</Typography>
 </Box>
 </Paper>
 )}

 {/* Next Steps */}
 {Array.isArray(data.next_steps) && (
 <Box sx={{ px: 4, py: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 2, fontSize:'1rem' }}>What's Next</Typography>
 {data.next_steps.map((step: any, i: number) => (
 <Box key={i} sx={{ display:'flex', gap: 2, mb: 2, alignItems:'flex-start' }}>
 <Box sx={{ width: 32, height: 32, borderRadius:'50%', background:`linear-gradient(135deg, ${primaryColor}, #764ba2)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, fontSize:'0.85rem', flexShrink: 0 }}>
 {step.step}
 </Box>
 <Box>
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e' }}>{step.title}</Typography>
 <Typography variant="body2" sx={{ color:'#888' }}>{step.description}</Typography>
 </Box>
 </Box>
 ))}
 </Box>
 )}

 {/* CTAs */}
 {(data.cta_primary || data.cta_secondary) && (
 <Box sx={{ px: 4, pb: 4, display:'flex', gap: 2 }}>
 {data.cta_primary && (
 <Button variant="contained" sx={{ background:`linear-gradient(135deg, ${primaryColor}, #764ba2)`, fontWeight: 700, px: 3 }}>
 {data.cta_primary.text}
 </Button>
 )}
 {data.cta_secondary && (
 <Button variant="outlined" sx={{ borderColor: primaryColor, color: primaryColor, fontWeight: 600 }}>
 {data.cta_secondary.text}
 </Button>
 )}
 </Box>
 )}
 </Box>
 );
}

function RenderMembersPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 return (
 <Box>
 {/* Welcome */}
 {data.welcome && (
 <Box sx={{ px: 4, py: 3, borderBottom:'1px solid #eee' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, color:'#1a1a2e' }}>{data.welcome.headline}</Typography>
 <Typography sx={{ color:'#888', mt: 0.5 }}>{data.welcome.subheading}</Typography>
 </Box>
 )}

 {/* Stats */}
 {Array.isArray(data.stats) && (
 <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${data.stats.length}, 1fr)`, gap: 2, px: 4, py: 3 }}>
 {data.stats.map((s: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3, textAlign:'center' }}>
 <Typography variant="caption" sx={{ color:'#999', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</Typography>
 <Typography sx={{ fontSize:'1.5rem', fontWeight: 800, color: primaryColor, my: 0.5 }}>{s.value}</Typography>
 {s.sub && <Typography variant="caption" sx={{ color:'#aaa' }}>{s.sub}</Typography>}
 </Paper>
 ))}
 </Box>
 )}

 {/* Courses */}
 {Array.isArray(data.courses) && (
 <Box sx={{ px: 4, py: 2 }}>
 <Typography sx={{ fontWeight: 700, mb: 2, fontSize:'1rem' }}>Your Courses</Typography>
 {data.courses.map((c: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, mb: 2, border:'1px solid #eee', borderRadius: 3 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e' }}>{c.title}</Typography>
 <Chip label={c.tag} size="small" sx={{ fontWeight: 600, fontSize:'0.7rem', bgcolor: c.tag ==='New' ?'#e8f5e9' :'#e3f2fd', color: c.tag ==='New' ?'#2e7d32' :'#1565c0' }} />
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
 <Box sx={{ flex: 1 }}>
 <LinearProgress variant="determinate" value={c.progress} sx={{ height: 8, borderRadius: 4, bgcolor:'#f0f0f0','& .MuiLinearProgress-bar': { borderRadius: 4, background:`linear-gradient(90deg, ${primaryColor}, #764ba2)` } }} />
 </Box>
 <Typography variant="caption" sx={{ color:'#888', fontWeight: 600, whiteSpace:'nowrap' }}>{c.lessons} - {c.progress}%</Typography>
 </Box>
 </Paper>
 ))}
 </Box>
 )}

 {/* Quick Actions */}
 {Array.isArray(data.quick_actions) && (
 <Box sx={{ px: 4, py: 2 }}>
 <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.9rem' }}>Quick Actions</Typography>
 <Box sx={{ display:'flex', gap: 1.5, flexWrap:'wrap' }}>
 {data.quick_actions.map((a: string, i: number) => (
 <Button key={i} variant="outlined" size="small" sx={{ borderRadius: 2, borderColor:'#ddd', color:'#555', fontWeight: 600,'&:hover': { borderColor: primaryColor, color: primaryColor } }}>
 {a}
 </Button>
 ))}
 </Box>
 </Box>
 )}
 </Box>
 );
}

function RenderCheckoutPage({ data, primaryColor, appId }: { data: any; primaryColor: string; appId?: number }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

 const handleStripeCheckout = async (plan: any) => {
 if (!plan.stripe_price_id || !appId) return;
 setCheckoutLoading(plan.stripe_price_id);
 try {
 const res = await axios.post(`${API.stripe}/checkout`, {
 app_id: appId,
 price_id: plan.stripe_price_id,
 success_url: window.location.origin +'?checkout=success',
 cancel_url: window.location.origin +'?checkout=cancelled',
 });
 if (res.data.success && res.data.url) {
 window.open(res.data.url,'_blank');
 }
 } catch (err) {
 console.error('Stripe checkout failed:', err);
 } finally {
 setCheckoutLoading(null);
 }
 };

 return (
 <Box sx={{ px: 4, py: 4 }}>
 {/* Headline */}
 <Box sx={{ textAlign:'center', mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 0.5 }}>{data.headline}</Typography>
 {data.subheading && <Typography sx={{ color:'#888' }}>{data.subheading}</Typography>}
 </Box>

 {/* Plans */}
 {Array.isArray(data.plans) && (
 <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(data.plans.length, 3)}, 1fr)`, gap: 2.5, mb: 4 }}>
 {data.plans.map((plan: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 3, border: plan.popular ?`2px solid ${primaryColor}` :'1px solid #eee', borderRadius: 3, position:'relative', opacity: plan.disabled ? 0.6 : 1 }}>
 {plan.popular && (
 <Chip label="Most Popular" size="small" sx={{ position:'absolute', top: -12, left:'50%', transform:'translateX(-50%)', bgcolor: primaryColor, color:'#fff', fontWeight: 700, fontSize:'0.7rem' }} />
 )}
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>
 <Typography variant="body2" sx={{ color:'#888', mb: 2, minHeight: 40 }}>{plan.description}</Typography>
 <Box sx={{ mb: 2 }}>
 <Typography variant="h3" component="span" sx={{ fontWeight: 800, color: primaryColor }}>{plan.price}</Typography>
 <Typography component="span" sx={{ color:'#999' }}>{plan.period}</Typography>
 </Box>
 <Box sx={{ mb: 2 }}>
 {plan.features?.map((f: string, fi: number) => (
 <Box key={fi} sx={{ display:'flex', gap: 1, mb: 0.75, alignItems:'center' }}>
 <CheckIcon sx={{ fontSize: 16, color:'#4caf50' }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{f}</Typography>
 </Box>
 ))}
 </Box>
 <Button
 variant={plan.popular ?'contained' :'outlined'}
 fullWidth
 disabled={plan.disabled || checkoutLoading === plan.stripe_price_id}
 onClick={() => plan.stripe_price_id ? handleStripeCheckout(plan) : undefined}
 sx={{ mt: 1, fontWeight: 700, background: plan.popular ? gradient : undefined, borderColor: !plan.popular ?'#ddd' : undefined }}
 >
 {checkoutLoading === plan.stripe_price_id ?'Loading...' : (plan.cta ||'Choose Plan')}
 </Button>
 </Paper>
 ))}
 </Box>
 )}

 {/* Payment Form */}
 {data.payment_form && (
 <Paper elevation={0} sx={{ p: 3, border:'1px solid #eee', borderRadius: 3, maxWidth: 500, mx:'auto', mb: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 2 }}>Payment Details</Typography>
 {data.payment_form.fields?.map((field: string, i: number) => (
 <TextField key={i} fullWidth size="small" label={field} variant="outlined" sx={{ mb: 1.5,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 ))}
 <Button variant="contained" fullWidth sx={{ mt: 1, background: gradient, fontWeight: 700, py: 1.2 }}>
 {data.payment_form.submit_text ||'Subscribe'}
 </Button>
 </Paper>
 )}

 {/* Trust Badges */}
 {Array.isArray(data.trust_badges) && (
 <Box sx={{ display:'flex', justifyContent:'center', gap: 3, mb: 2 }}>
 {data.trust_badges.map((badge: string, i: number) => (
 <Box key={i} sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
 <ShieldIcon sx={{ fontSize: 16, color:'#4caf50' }} />
 <Typography variant="caption" sx={{ color:'#888', fontWeight: 600 }}>{badge}</Typography>
 </Box>
 ))}
 </Box>
 )}

 {/* Guarantee */}
 {data.guarantee && (
 <Typography sx={{ textAlign:'center', color:'#aaa', fontSize:'0.82rem' }}>{data.guarantee}</Typography>
 )}
 </Box>
 );
}

function RenderAdminPage({ data, primaryColor, appId }: { data: any; primaryColor: string; appId?: number }) {
 const [members, setMembers] = useState<any[]>([]);
 const [loadingMembers, setLoadingMembers] = useState(false);

 // Fetch real members from the API
 useEffect(() => {
  if (!appId) return;
  setLoadingMembers(true);
  fetch(`${API.apps}/${appId}/members`)
   .then(r => r.json())
   .then(json => {
    const list = json.data || json || [];
    setMembers(Array.isArray(list) ? list : []);
   })
   .catch(() => setMembers([]))
   .finally(() => setLoadingMembers(false));
 }, [appId]);

 // Build live KPIs from real member data (override static ones when we have real data)
 const liveKpis = members.length > 0 ? [
  { label: 'Total Members', value: String(members.length), change: `+${members.filter((m: any) => { const d = new Date(m.created_at); const week = Date.now() - 7*24*60*60*1000; return d.getTime() > week; }).length} this week`, up: true },
  { label: 'Active', value: String(members.filter((m: any) => m.status === 'active' || m.status === 'free').length), change: '', up: true },
  { label: 'Paid', value: String(members.filter((m: any) => m.plan_price > 0).length), change: '', up: true },
  { label: 'MRR', value: `$${members.reduce((sum: number, m: any) => sum + (m.plan_price || 0), 0).toFixed(0)}`, change: '', up: true },
 ] : data.kpis;

 return (
 <Box sx={{ px: 3, py: 3 }}>
 {/* Dashboard Title */}
 {data.dashboard_title && (
 <Typography variant="h5" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 3 }}>{data.dashboard_title}</Typography>
 )}

 {/* KPIs */}
 {Array.isArray(liveKpis) && (
 <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${liveKpis.length}, 1fr)`, gap: 2, mb: 3 }}>
 {liveKpis.map((kpi: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3 }}>
 <Typography variant="caption" sx={{ color:'#999', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{kpi.label}</Typography>
 <Typography sx={{ fontSize:'1.6rem', fontWeight: 800, color:'#1a1a2e', my: 0.5 }}>{kpi.value}</Typography>
 {kpi.change && (
 <Chip
 label={kpi.change}
 size="small"
 sx={{
 height: 22, fontSize:'0.72rem', fontWeight: 700,
 bgcolor: kpi.up ?'rgba(46,125,50,0.08)' :'rgba(211,47,47,0.08)',
 color: kpi.up ?'#2e7d32' :'#d32f2f',
 }}
 />
 )}
 </Paper>
 ))}
 </Box>
 )}

 {/* Revenue Chart (simplified bar representation) */}
 {data.revenue_chart && (
 <Paper elevation={0} sx={{ p: 3, border:'1px solid #eee', borderRadius: 3, mb: 3 }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 2 }}>
 <Typography sx={{ fontWeight: 700 }}>{data.revenue_chart.title}</Typography>
 <Box sx={{ display:'flex', gap: 0.5 }}>
 {data.revenue_chart.periods?.map((p: string, i: number) => (
 <Chip key={i} label={p} size="small" variant={p === data.revenue_chart.default_period ?'filled' :'outlined'}
 sx={{ height: 24, fontSize:'0.7rem', fontWeight: 600, ...(p === data.revenue_chart.default_period ? { bgcolor: primaryColor, color:'#fff' } : { borderColor:'#ddd' }) }}
 />
 ))}
 </Box>
 </Box>
 <Box sx={{ display:'flex', alignItems:'flex-end', gap:'6px', height: 120, px: 1 }}>
 {data.revenue_chart.data?.map((val: number, i: number) => {
 const max = Math.max(...data.revenue_chart.data);
 const height = max > 0 ? (val / max) * 100 : 0;
 return (
 <Tooltip key={i} title={`${data.revenue_chart.months?.[i] ||''}: ${val}`} arrow>
 <Box sx={{ flex: 1, height:`${height}%`, background:`linear-gradient(180deg, ${primaryColor}, #764ba2)`, borderRadius:'4px 4px 0 0', minHeight: 4, cursor:'pointer', transition:'all 0.2s','&:hover': { opacity: 0.8 } }} />
 </Tooltip>
 );
 })}
 </Box>
 {data.revenue_chart.months && (
 <Box sx={{ display:'flex', gap:'6px', px: 1, mt: 0.5 }}>
 {data.revenue_chart.months.map((m: string, i: number) => (
 <Typography key={i} sx={{ flex: 1, textAlign:'center', fontSize:'0.6rem', color:'#bbb' }}>{m.slice(0, 3)}</Typography>
 ))}
 </Box>
 )}
 </Paper>
 )}

 {/* Registered Members — full-width table */}
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3, mb: 3 }}>
 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography sx={{ fontWeight: 700, fontSize:'0.95rem' }}>
   Registered Members {members.length > 0 && <Chip label={members.length} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${primaryColor}15`, color: primaryColor }} />}
  </Typography>
  {loadingMembers && <CircularProgress size={16} />}
 </Box>
 {!appId && (
  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>No app selected — cannot load members</Typography>
 )}
 {appId && !loadingMembers && members.length === 0 && (
  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>No members registered yet. Use the Register page to add members.</Typography>
 )}
 {members.length > 0 && (
  <Box sx={{ overflowX: 'auto' }}>
   {/* Table header */}
   <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr', gap: 1, px: 1, py: 1, bgcolor: '#f8f9fa', borderRadius: 1.5, mb: 0.5 }}>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Name</Typography>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Email</Typography>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Membership</Typography>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>Joined</Typography>
   </Box>
   {/* Table rows */}
   {members.map((m: any, i: number) => {
    const tierName = (m.plan_name || 'Free').toLowerCase();
    const tierColor = tierName.includes('gold') || tierName.includes('enterprise') ? '#f59e0b'
     : tierName.includes('pro') || tierName.includes('professional') ? primaryColor
     : '#6b7280';
    const tierBg = tierName.includes('gold') || tierName.includes('enterprise') ? '#fef3c7'
     : tierName.includes('pro') || tierName.includes('professional') ? `${primaryColor}15`
     : '#f3f4f6';
    const joined = m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    return (
     <Box key={m.id || i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr', gap: 1, px: 1, py: 1.25, alignItems: 'center', borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: '#fafafa' } }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>{m.name}</Typography>
      <Typography sx={{ fontSize: '0.82rem', color: '#888' }}>{m.email}</Typography>
      <Chip label={m.plan_name || 'Free'} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: tierBg, color: tierColor, width: 'fit-content' }} />
      <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>{joined}</Typography>
     </Box>
    );
   })}
  </Box>
 )}
 </Paper>

 <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 2 }}>
 {/* System Health */}
 {Array.isArray(data.system_health) && (
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.95rem' }}>System Health</Typography>
 {data.system_health.map((s: any, i: number) => (
 <Box key={i} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', py: 0.75 }}>
 <Typography variant="body2" sx={{ color:'#555' }}>{s.label}</Typography>
 <Chip
 icon={<CircleIcon sx={{ fontSize:'10px !important', color: s.status ==='Operational' ?'#4caf50 !important' :'#ff9800 !important' }} />}
 label={s.status}
 size="small"
 sx={{ height: 22, fontSize:'0.7rem', fontWeight: 600, bgcolor: s.status ==='Operational' ?'#e8f5e9' :'#fff3e0', color: s.status ==='Operational' ?'#2e7d32' :'#e65100' }}
 />
 </Box>
 ))}
 </Paper>
 )}

 {/* Recent Activity */}
 {Array.isArray(data.recent_activity) && (
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize:'0.95rem' }}>Recent Activity</Typography>
 {data.recent_activity.map((a: any, i: number) => (
 <Box key={i} sx={{ display:'flex', justifyContent:'space-between', py: 0.75, borderBottom:'1px solid #f8f8f8','&:last-child': { borderBottom:'none' } }}>
 <Typography variant="body2" sx={{ color:'#555', fontSize:'0.82rem' }}>{a.text}</Typography>
 <Typography variant="caption" sx={{ color:'#bbb', whiteSpace:'nowrap', ml: 1 }}>{a.time}</Typography>
 </Box>
 ))}
 </Paper>
 )}
 </Box>
 </Box>
 );
}

// --- Pricing Page -----------------------------------------------------------
function RenderPricingPage({ data, primaryColor, onNavigate }: { data: any; primaryColor: string; onNavigate?: (pageType: string, plan?: any) => void }) {
 const isFree = (plan: any) => {
  const p = (plan.price_monthly || plan.price || '').toString().toLowerCase();
  return p === '£0' || p === '$0' || p === '€0' || p === '0' || p === 'free' || p.includes('free');
 };
 return (
 <Box sx={{ px: 3, py: 3 }}>
 {/* Hero */}
 {data.hero && (
 <Box sx={{ textAlign:'center', mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>{data.hero.headline}</Typography>
 <Typography sx={{ color:'#888', maxWidth: 500, mx:'auto' }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* Billing Toggle */}
 {data.billing_toggle && (
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', gap: 1.5, mb: 4 }}>
 <Typography variant="body2" sx={{ color:'#888', fontWeight: 600 }}>{data.billing_toggle.options?.[0]}</Typography>
 <Box sx={{ width: 44, height: 24, borderRadius: 12, bgcolor: primaryColor, position:'relative', cursor:'pointer' }}>
 <Box sx={{ width: 20, height: 20, borderRadius:'50%', bgcolor:'#fff', position:'absolute', top: 2, right: 2, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
 </Box>
 <Typography variant="body2" sx={{ color: primaryColor, fontWeight: 700 }}>
 {data.billing_toggle.options?.[1]}
 {data.billing_toggle.discount && (
 <Chip label={data.billing_toggle.discount} size="small" sx={{ ml: 0.5, height: 20, fontSize:'0.65rem', fontWeight: 700, bgcolor:'#e8f5e9', color:'#27ae60' }} />
 )}
 </Typography>
 </Box>
 )}

 {/* Plans */}
 {Array.isArray(data.plans) && (
 <Grid container spacing={2.5} justifyContent="center" sx={{ mb: 4 }}>
 {data.plans.map((plan: any, i: number) => (
 <Grid item xs={12} sm={4} key={i}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: plan.popular ?`2px solid ${primaryColor}` :'1px solid #eee', position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
 {plan.popular && (
 <Chip label="Most Popular" size="small" sx={{ position:'absolute', top: -12, left:'50%', transform:'translateX(-50%)', bgcolor: primaryColor, color:'#fff', fontWeight: 700, fontSize:'0.7rem' }} />
 )}
 <Typography variant="h6" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 0.5 }}>{plan.name}</Typography>
 <Typography variant="body2" sx={{ color:'#888', mb: 2, minHeight: 40 }}>{plan.description}</Typography>
 <Box sx={{ mb: 2 }}>
 <Typography variant="h3" component="span" sx={{ fontWeight: 800, color:'#1a1a2e' }}>{plan.price_monthly || plan.price}</Typography>
 <Typography component="span" sx={{ color:'#999' }}>{plan.period}</Typography>
 </Box>
 <Divider sx={{ mb: 2 }} />
 <Box sx={{ flex: 1, mb: 2 }}>
 {plan.features?.map((f: string, fi: number) => (
 <Box key={fi} sx={{ display:'flex', gap: 1, mb: 0.75, alignItems:'center' }}>
 <CheckIcon sx={{ fontSize: 16, color:'#27ae60' }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{f}</Typography>
 </Box>
 ))}
 </Box>
 <Button variant={plan.popular ?'contained' :'outlined'} fullWidth
 onClick={() => {
  if (onNavigate) {
   if (isFree(plan)) {
    onNavigate('register', plan);
   } else if ((plan.cta || '').toLowerCase().includes('contact')) {
    // "Contact Sales" — no navigation
   } else {
    onNavigate('checkout', plan);
   }
  }
 }}
 sx={{ fontWeight: 700, borderRadius: 2, textTransform:'none', cursor: 'pointer', ...(plan.popular ? { background:`linear-gradient(135deg, ${primaryColor}, #764ba2)` } : { borderColor:'#ddd', color:'#555' }) }}>
 {isFree(plan) ? 'Get Started Free' : plan.cta}
 </Button>
 </Paper>
 </Grid>
 ))}
 </Grid>
 )}

 {/* Comparison Table */}
 {data.comparison && (
 <Box sx={{ mb: 4 }}>
 <Typography variant="h6" sx={{ fontWeight: 700, textAlign:'center', mb: 3, color:'#1a1a2e' }}>{data.comparison.title}</Typography>
 <TableContainer component={Paper} elevation={0} sx={{ border:'1px solid #eee', borderRadius: 3 }}>
 <Table size="small">
 <TableHead>
 <TableRow sx={{ bgcolor:'#fafbfc' }}>
 <TableCell sx={{ fontWeight: 700, color:'#1a1a2e' }}>Feature</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color:'#888' }}>Starter</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color: primaryColor }}>Professional</TableCell>
 <TableCell align="center" sx={{ fontWeight: 700, color:'#888' }}>Enterprise</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {data.comparison.rows?.map((row: any, i: number) => (
 <TableRow key={i}>
 <TableCell sx={{ color:'#555', fontWeight: 500 }}>{row.feature}</TableCell>
 <TableCell align="center" sx={{ color: row.starter ==='[OK]' ?'#27ae60' : row.starter ==='--' ?'#ccc' :'#555', fontWeight: 600 }}>{row.starter}</TableCell>
 <TableCell align="center" sx={{ color: row.pro ==='[OK]' ?'#27ae60' : row.pro ==='--' ?'#ccc' : primaryColor, fontWeight: 600 }}>{row.pro}</TableCell>
 <TableCell align="center" sx={{ color: row.enterprise ==='[OK]' ?'#27ae60' : row.enterprise ==='--' ?'#ccc' :'#555', fontWeight: 600 }}>{row.enterprise}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Box>
 )}

 {/* Trust Badges */}
 {Array.isArray(data.trust_badges) && (
 <Box sx={{ display:'flex', justifyContent:'center', gap: 4, flexWrap:'wrap' }}>
 {data.trust_badges.map((badge: string, i: number) => (
 <Typography key={i} variant="body2" sx={{ color:'#888', fontWeight: 600, fontSize:'0.82rem' }}>{badge}</Typography>
 ))}
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['stats','faq']} />
 </Box>
 );
}

// --- About Page -------------------------------------------------------------
function RenderAboutPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 return (
 <Box>
 {/* Hero */}
 {data.hero && (
 <Box sx={{ background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`, color:'#fff', py: 6, px: 4, textAlign:'center' }}>
 <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>{data.hero.headline}</Typography>
 <Typography sx={{ fontSize:'1.05rem', opacity: 0.9, maxWidth: 560, mx:'auto', lineHeight: 1.7 }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* Story */}
 {data.story && (
 <Box sx={{ px: 4, py: 5 }}>
 <Grid container spacing={4} alignItems="center">
 <Grid item xs={12} sm={6}>
 <Typography variant="overline" sx={{ color: primaryColor, fontWeight: 700, letterSpacing: 1.5 }}>{data.story.overline}</Typography>
 <Typography variant="h5" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 2, mt: 1 }}>{data.story.headline}</Typography>
 {data.story.paragraphs?.map((p: string, i: number) => (
 <Typography key={i} variant="body2" sx={{ color:'#666', lineHeight: 1.8, mb: 2 }}>{p}</Typography>
 ))}
 </Grid>
 <Grid item xs={12} sm={6}>
 <Paper elevation={0} sx={{ height: 200, borderRadius: 3, background:'linear-gradient(135deg, #eef0ff 0%, #f3e5f5 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Typography sx={{ fontSize:'3rem' }}></Typography>
 </Paper>
 </Grid>
 </Grid>
 </Box>
 )}

 {/* Values */}
 {Array.isArray(data.values) && (
 <Box sx={{ px: 4, py: 4, bgcolor:'#fafbfc' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 3, color:'#1a1a2e' }}>Our Values</Typography>
 <Grid container spacing={2.5}>
 {data.values.map((v: any, i: number) => (
 <Grid item xs={12} sm={6} key={i}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee', height:'100%' }}>
 <Typography sx={{ fontSize:'1.5rem', mb: 1 }}>{v.emoji}</Typography>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color:'#1a1a2e', mb: 0.5 }}>{v.title}</Typography>
 <Typography variant="body2" sx={{ color:'#777', lineHeight: 1.6 }}>{v.description}</Typography>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>
 )}

 {/* Team */}
 {Array.isArray(data.team) && (
 <Box sx={{ px: 4, py: 5 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 1, color:'#1a1a2e' }}>Meet the Team</Typography>
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 4 }}>The people behind the product</Typography>
 <Grid container spacing={3} justifyContent="center">
 {data.team.map((member: any, i: number) => (
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
 )}

 {/* Timeline */}
 {Array.isArray(data.timeline) && (
 <Box sx={{ px: 4, py: 4, bgcolor:'#fafbfc' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, textAlign:'center', mb: 3, color:'#1a1a2e' }}>Our Journey</Typography>
 {data.timeline.map((item: any, i: number) => (
 <Box key={i} sx={{ display:'flex', gap: 2, mb: 2, alignItems:'center' }}>
 <Chip label={item.year} size="small" sx={{ fontWeight: 700, bgcolor: primaryColor, color:'#fff', minWidth: 50 }} />
 <Typography variant="body2" sx={{ color:'#555' }}>{item.event}</Typography>
 </Box>
 ))}
 </Box>
 )}

 {/* CTA */}
 {data.cta && (
 <Box sx={{ py: 5, textAlign:'center', px: 3 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color:'#1a1a2e' }}>{data.cta.headline}</Typography>
 <Typography variant="body2" sx={{ color:'#888', mb: 3 }}>{data.cta.subheading}</Typography>
 <Button variant="contained" sx={{ borderRadius: 3, px: 4, background:`linear-gradient(135deg, ${primaryColor}, #764ba2)`, textTransform:'none', fontWeight: 700 }}>
 {data.cta.button_text}
 </Button>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['stats','cta']} />
 </Box>
 );
}

// --- FAQ Page ---------------------------------------------------------------
function RenderFaqPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 return (
 <Box sx={{ px: 3, py: 3 }}>
 {/* Hero */}
 {data.hero && (
 <Box sx={{ textAlign:'center', mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>{data.hero.headline}</Typography>
 <Typography sx={{ color:'#888', maxWidth: 500, mx:'auto' }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* FAQ Categories */}
 {Array.isArray(data.categories) && data.categories.map((section: any, si: number) => (
 <Box key={si} sx={{ mb: 4 }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, color: primaryColor, mb: 2, pl: 1 }}>{section.title}</Typography>
 {section.questions?.map((faq: any, qi: number) => (
 <Paper key={qi} elevation={0} sx={{ mb: 1.5, border:'1px solid #eee', borderRadius: 2, overflow:'hidden' }}>
 <Box sx={{ p: 2, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer','&:hover': { bgcolor:'#fafbfc' } }}>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{faq.question}</Typography>
 <ExpandMoreIcon sx={{ fontSize: 20, color:'#999' }} />
 </Box>
 <Box sx={{ px: 2, pb: 2 }}>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.7 }}>{faq.answer}</Typography>
 </Box>
 </Paper>
 ))}
 </Box>
 ))}

 {/* Support CTA */}
 {data.support_cta && (
 <Box sx={{ p: 3, borderRadius: 3, background:`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`, color:'#fff', textAlign:'center' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{data.support_cta.headline}</Typography>
 <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>{data.support_cta.subheading}</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, textTransform:'none', borderRadius: 2 }}>
 {data.support_cta.button_text}
 </Button>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['faq']} />
 </Box>
 );
}

// --- Contact Page -----------------------------------------------------------
function RenderContactPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const iconMap: Record<string, React.ReactNode> = {
 email: <EmailIcon />,
 phone: <PhoneIcon />,
 location: <LocationIcon />,
 };
 return (
 <Box sx={{ px: 3, py: 3 }}>
 {/* Hero */}
 {data.hero && (
 <Box sx={{ textAlign:'center', mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>{data.hero.headline}</Typography>
 <Typography sx={{ color:'#888', maxWidth: 500, mx:'auto' }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 <Grid container spacing={4}>
 {/* Contact Form */}
 {data.form && (
 <Grid item xs={12} sm={7}>
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee' }}>
 <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>{data.form.title}</Typography>
 <Grid container spacing={2}>
 {data.form.fields?.map((field: any, fi: number) => (
 <Grid item xs={field.half ? 6 : 12} key={fi}>
 {field.type ==='select' ? (
 <FormControl fullWidth size="small">
 <InputLabel>{field.label}</InputLabel>
 <Select label={field.label} defaultValue="" sx={{ borderRadius: 2 }}>
 {field.options?.map((opt: string, oi: number) => (
 <MenuItem key={oi} value={opt}>{opt}</MenuItem>
 ))}
 </Select>
 </FormControl>
 ) : field.type ==='textarea' ? (
 <TextField fullWidth multiline rows={field.rows || 4} label={field.label} variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 ) : (
 <TextField fullWidth size="small" label={field.label} variant="outlined" sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 )}
 </Grid>
 ))}
 <Grid item xs={12}>
 <Button variant="contained" fullWidth sx={{ background:`linear-gradient(135deg, ${primaryColor}, #764ba2)`, fontWeight: 700, textTransform:'none', borderRadius: 2, py: 1.2 }}>
 {data.form.submit_text}
 </Button>
 </Grid>
 </Grid>
 </Paper>
 </Grid>
 )}

 {/* Contact Info */}
 {Array.isArray(data.contact_info) && (
 <Grid item xs={12} sm={5}>
 <Stack spacing={2.5}>
 {data.contact_info.map((info: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: 3, border:'1px solid #eee' }}>
 <Box sx={{ display:'flex', gap: 2, alignItems:'flex-start' }}>
 <Avatar sx={{ bgcolor: info.icon ==='email' ?'#eef0ff' : info.icon ==='phone' ?'#e8f5e9' :'#fce4ec', color: info.icon ==='email' ? primaryColor : info.icon ==='phone' ?'#27ae60' :'#e74c3c', width: 40, height: 40 }}>
 {iconMap[info.icon] || <EmailIcon />}
 </Avatar>
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700, color:'#1a1a2e' }}>{info.title}</Typography>
 <Typography variant="body2" sx={{ color: info.icon ==='email' ? primaryColor :'#555' }}>{info.value}</Typography>
 <Typography variant="caption" sx={{ color:'#888' }}>{info.detail}</Typography>
 </Box>
 </Box>
 </Paper>
 ))}

 {/* Map Placeholder */}
 <Paper elevation={0} sx={{ height: 120, borderRadius: 3, border:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'#f5f5f5' }}>
 <Box sx={{ textAlign:'center' }}>
 <LocationIcon sx={{ fontSize: 28, color:'#ccc' }} />
 <Typography variant="caption" sx={{ display:'block', color:'#bbb' }}>Map placeholder</Typography>
 </Box>
 </Paper>
 </Stack>
 </Grid>
 )}
 </Grid>

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['contact_form']} />
 </Box>
 );
}

// --- Tool / Content / Interactive Page ---------------------------------------
// A flexible renderer for pages that represent tools, generators, content lists,
// notification feeds, settings panels etc. Mostly text + one contextual UI block.
function RenderToolPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box>
 {/* Page header */}
 <Box sx={{ px: 4, pt: 4, pb: 2 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>{data.title}</Typography>
 {data.description && (
 <Typography sx={{ color:'#666', lineHeight: 1.7, maxWidth: 700, mb: 1 }}>{data.description}</Typography>
 )}
 {data.badge && <Chip label={data.badge} size="small" sx={{ bgcolor:`${primaryColor}15`, color: primaryColor, fontWeight: 600, mt: 0.5 }} />}
 </Box>

 {/* Info callout */}
 {data.info && (
 <Box sx={{ mx: 4, mb: 3 }}>
 <Paper elevation={0} sx={{ p: 2.5, borderLeft:`4px solid ${primaryColor}`, bgcolor:`${primaryColor}08`, borderRadius: 2 }}>
 <Typography variant="body2" sx={{ color:'#555', lineHeight: 1.7 }}>{data.info}</Typography>
 </Paper>
 </Box>
 )}

 {/* Tool input section -- for generators / AI tools / search */}
 {data.tool_input && (
 <Box sx={{ px: 4, pb: 3 }}>
 <Paper elevation={0} sx={{ p: 3, border:'1px solid #eee', borderRadius: 3 }}>
 {data.tool_input.headline && (
 <Typography sx={{ fontWeight: 700, mb: 2, color:'#1a1a2e' }}>{data.tool_input.headline}</Typography>
 )}
 {data.tool_input.fields?.map((field: any, i: number) => (
 field.type ==='textarea' ? (
 <TextField key={i} fullWidth multiline rows={field.rows || 3} label={field.label} placeholder={field.placeholder ||''} variant="outlined" size="small" sx={{ mb: 1.5,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 ) : field.type ==='select' ? (
 <FormControl key={i} fullWidth size="small" sx={{ mb: 1.5 }}>
 <InputLabel>{field.label}</InputLabel>
 <Select label={field.label} defaultValue="" sx={{ borderRadius: 2 }}>
 {field.options?.map((opt: string, oi: number) => (
 <MenuItem key={oi} value={opt}>{opt}</MenuItem>
 ))}
 </Select>
 </FormControl>
 ) : (
 <TextField key={i} fullWidth label={field.label} placeholder={field.placeholder ||''} type={field.type ||'text'} variant="outlined" size="small" sx={{ mb: 1.5,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 )
 ))}
 <Button variant="contained" sx={{ background: gradient, fontWeight: 700, textTransform:'none', borderRadius: 2, px: 3 }}>
 {data.tool_input.submit_text ||'Submit'}
 </Button>
 {data.tool_input.hint && (
 <Typography variant="caption" sx={{ display:'block', color:'#aaa', mt: 1 }}>{data.tool_input.hint}</Typography>
 )}
 </Paper>
 </Box>
 )}

 {/* Output / results preview */}
 {data.output_preview && (
 <Box sx={{ px: 4, pb: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 1.5, color:'#1a1a2e', fontSize:'0.95rem' }}>{data.output_preview.headline ||'Recent Output'}</Typography>
 {data.output_preview.items?.map((item: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2, mb: 1, border:'1px solid #eee', borderRadius: 2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box>
 <Typography sx={{ fontWeight: 600, fontSize:'0.9rem', color:'#1a1a2e' }}>{item.title}</Typography>
 {item.subtitle && <Typography variant="caption" sx={{ color:'#999' }}>{item.subtitle}</Typography>}
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Chip label={item.status ||'Done'} size="small" sx={{ height: 22, fontSize:'0.7rem', fontWeight: 600, bgcolor: item.status ==='Processing' ?'#fff3e0' :'#e8f5e9', color: item.status ==='Processing' ?'#e65100' :'#2e7d32' }} />
 {item.time && <Typography variant="caption" sx={{ color:'#bbb' }}>{item.time}</Typography>}
 </Box>
 </Paper>
 ))}
 </Box>
 )}

 {/* Content list -- for management / library pages */}
 {data.content_list && (
 <Box sx={{ px: 4, pb: 3 }}>
 {data.content_list.search_placeholder && (
 <TextField fullWidth size="small" placeholder={data.content_list.search_placeholder} variant="outlined" sx={{ mb: 2,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 )}
 {Array.isArray(data.content_list.actions) && (
 <Box sx={{ display:'flex', gap: 1, mb: 2 }}>
 {data.content_list.actions.map((a: string, i: number) => (
 <Button key={i} variant={i === 0 ?'contained' :'outlined'} size="small" sx={{ borderRadius: 2, fontWeight: 600, textTransform:'none', ...(i === 0 ? { background: gradient } : { borderColor:'#ddd', color:'#555' }) }}>{a}</Button>
 ))}
 </Box>
 )}
 {data.content_list.items?.map((item: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2, mb: 1, border:'1px solid #eee', borderRadius: 2, display:'flex', justifyContent:'space-between', alignItems:'center','&:hover': { bgcolor:'#fafbfc' }, cursor:'pointer' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 {item.icon && <Box sx={{ fontSize:'1.2rem' }}>{item.icon}</Box>}
 <Box>
 <Typography sx={{ fontWeight: 600, fontSize:'0.9rem', color:'#1a1a2e' }}>{item.title}</Typography>
 {item.subtitle && <Typography variant="caption" sx={{ color:'#999' }}>{item.subtitle}</Typography>}
 </Box>
 </Box>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
 {item.type && <Chip label={item.type} size="small" variant="outlined" sx={{ height: 22, fontSize:'0.68rem', fontWeight: 600, borderColor:'#ddd', color:'#888' }} />}
 {item.status && <Chip label={item.status} size="small" sx={{ height: 22, fontSize:'0.68rem', fontWeight: 600, bgcolor: item.status ==='Published' || item.status ==='Active' ?'#e8f5e9' : item.status ==='Draft' ?'#fff3e0' :'#e3f2fd', color: item.status ==='Published' || item.status ==='Active' ?'#2e7d32' : item.status ==='Draft' ?'#e65100' :'#1565c0' }} />}
 {item.date && <Typography variant="caption" sx={{ color:'#bbb' }}>{item.date}</Typography>}
 </Box>
 </Paper>
 ))}
 </Box>
 )}

 {/* Notification feed */}
 {Array.isArray(data.notifications) && (
 <Box sx={{ px: 4, pb: 3 }}>
 {data.notifications.map((n: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2, mb: 1, border:'1px solid #eee', borderRadius: 2, bgcolor: n.read === false ?`${primaryColor}04` :'transparent', borderLeft: n.read === false ?`3px solid ${primaryColor}` :'3px solid transparent' }}>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
 <Box>
 <Typography sx={{ fontWeight: n.read === false ? 700 : 600, fontSize:'0.9rem', color:'#1a1a2e' }}>{n.title}</Typography>
 <Typography variant="body2" sx={{ color:'#888', mt: 0.25 }}>{n.message}</Typography>
 </Box>
 <Typography variant="caption" sx={{ color:'#bbb', whiteSpace:'nowrap', ml: 2 }}>{n.time}</Typography>
 </Box>
 </Paper>
 ))}
 </Box>
 )}

 {/* Settings list */}
 {Array.isArray(data.settings_sections) && (
 <Box sx={{ px: 4, pb: 3 }}>
 {data.settings_sections.map((section: any, si: number) => (
 <Paper key={si} elevation={0} sx={{ p: 2.5, mb: 2, border:'1px solid #eee', borderRadius: 3 }}>
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e', mb: 1.5 }}>{section.title}</Typography>
 {section.items?.map((item: any, ii: number) => (
 <Box key={ii} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', py: 1, borderBottom: ii < section.items.length - 1 ?'1px solid #f5f5f5' :'none' }}>
 <Box>
 <Typography sx={{ fontWeight: 600, fontSize:'0.88rem', color:'#333' }}>{item.label}</Typography>
 {item.hint && <Typography variant="caption" sx={{ color:'#aaa' }}>{item.hint}</Typography>}
 </Box>
 <Typography sx={{ fontSize:'0.85rem', color: primaryColor, fontWeight: 600 }}>{item.value}</Typography>
 </Box>
 ))}
 </Paper>
 ))}
 </Box>
 )}

 {/* Quick tips / how-to */}
 {Array.isArray(data.tips) && (
 <Box sx={{ px: 4, pb: 3 }}>
 <Typography sx={{ fontWeight: 700, mb: 1, color:'#1a1a2e', fontSize:'0.95rem' }}>Tips</Typography>
 <Paper elevation={0} sx={{ p: 2.5, border:'1px solid #eee', borderRadius: 3, bgcolor:'#fafbfc' }}>
 {data.tips.map((tip: string, i: number) => (
 <Box key={i} sx={{ display:'flex', gap: 1, mb: i < data.tips.length - 1 ? 1 : 0, alignItems:'flex-start' }}>
 <Typography sx={{ color: primaryColor, fontWeight: 700, fontSize:'0.85rem' }}>Tip:</Typography>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.6 }}>{tip}</Typography>
 </Box>
 ))}
 </Paper>
 </Box>
 )}

 {/* Quick Actions */}
 {Array.isArray(data.quick_actions) && (
 <Box sx={{ px: 4, py: 2 }}>
 <Box sx={{ display:'flex', gap: 1.5, flexWrap:'wrap' }}>
 {data.quick_actions.map((a: string, i: number) => (
 <Button key={i} variant="outlined" size="small" sx={{ borderRadius: 2, borderColor:'#ddd', color:'#555', fontWeight: 600, textTransform:'none','&:hover': { borderColor: primaryColor, color: primaryColor } }}>
 {a}
 </Button>
 ))}
 </Box>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} />
 </Box>
 );
}

// Generic fallback renderer
function RenderGenericPage({ data }: { data: any }) {
 return (
 <Box sx={{ p: 4 }}>
 {data.title && <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>{data.title}</Typography>}
 {data.heading && <Typography variant="h5" sx={{ fontWeight: 700, color:'#333', mb: 1 }}>{data.heading}</Typography>}
 {data.description && <Typography sx={{ color:'#555', lineHeight: 1.6, mb: 2 }}>{data.description}</Typography>}
 {data.message && (
 <Paper elevation={0} sx={{ p: 2.5, borderLeft:'4px solid #667eea', bgcolor:'#f8f9ff' }}>
 <Typography sx={{ color:'#333' }}>{data.message}</Typography>
 </Paper>
 )}
 </Box>
 );
}

// --- Nav Bar (shared) --------------------------------------------------------
function RenderNav({ data, primaryColor }: { data: any; primaryColor: string }) {
 if (!data.nav) return null;
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px: 3, py: 1.5, borderBottom:'1px solid #eee' }}>
 <Typography sx={{ fontWeight: 800, fontSize:'1.1rem', color:'#1a1a2e' }}>{data.nav.brand}</Typography>
 <Box sx={{ display:'flex', gap: 2.5, alignItems:'center' }}>
 {data.nav.links?.map((link: any, i: number) => (
 <Typography key={i} sx={{ fontSize:'0.85rem', color:'#555', cursor:'pointer','&:hover': { color: primaryColor } }}>{typeof link ==='string' ? link : link.label}</Typography>
 ))}
 <Button size="small" variant="contained" sx={{ background: gradient, fontWeight: 700, fontSize:'0.8rem', borderRadius: 2, px: 2 }}>
 {data.nav.cta ||'Get Started'}
 </Button>
 </Box>
 </Box>
 );
}

// --- Extra Sections (shared) ------------------------------------------------
// Renders common AI-injected sections that may appear on ANY page type.
// Pass`exclude` to skip sections already rendered by the page-specific renderer.
function RenderExtraSections({ data, primaryColor, exclude = [] }: { data: any; primaryColor: string; exclude?: string[] }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <>
 {/* Contact Form */}
 {!exclude.includes('contact_form') && data.contact_form && (
 <Box sx={{ px: 4, py: 5, bgcolor:'#fafbfc' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 1, color:'#1a1a2e' }}>
 {data.contact_form.headline ||'Get in Touch'}
 </Typography>
 {data.contact_form.subheading && (
 <Typography variant="body2" sx={{ textAlign:'center', color:'#888', mb: 3 }}>{data.contact_form.subheading}</Typography>
 )}
 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border:'1px solid #eee', maxWidth: 500, mx:'auto' }}>
 {data.contact_form.fields?.map((field: any, i: number) => (
 field.type ==='textarea' ? (
 <TextField key={i} fullWidth multiline rows={field.rows || 4} label={field.label} placeholder={field.placeholder ||''} variant="outlined" size="small" sx={{ mb: 1.5,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 ) : (
 <TextField key={i} fullWidth label={field.label} placeholder={field.placeholder ||''} type={field.type ||'text'} variant="outlined" size="small" sx={{ mb: 1.5,'& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
 )
 ))}
 <Button variant="contained" fullWidth sx={{ mt: 1, background: gradient, fontWeight: 700, textTransform:'none', borderRadius: 2, py: 1.2 }}>
 {data.contact_form.submit_text || data.contact_form.button_text ||'Send Message'}
 </Button>
 </Paper>
 </Box>
 )}

 {/* Newsletter */}
 {!exclude.includes('newsletter') && data.newsletter && (
 <Box sx={{ background: gradient, color:'#fff', px: 4, py: 5, textAlign:'center' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.newsletter.headline}</Typography>
 <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 500, mx:'auto', fontSize:'0.95rem' }}>{data.newsletter.subheading}</Typography>
 <Box sx={{ display:'flex', gap: 1.5, justifyContent:'center', maxWidth: 440, mx:'auto' }}>
 <TextField size="small" placeholder={data.newsletter.placeholder ||'Enter your email'}
 sx={{ flex: 1, bgcolor:'rgba(255,255,255,0.15)', borderRadius: 2, input: { color:'#fff','&::placeholder': { color:'rgba(255,255,255,0.6)' } },'& .MuiOutlinedInput-notchedOutline': { borderColor:'rgba(255,255,255,0.25)' } }}
 />
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 3, borderRadius: 2, textTransform:'none','&:hover': { bgcolor:'#f0f0f0' } }}>
 {data.newsletter.button_text ||'Subscribe'}
 </Button>
 </Box>
 </Box>
 )}

 {/* Testimonials */}
 {!exclude.includes('testimonials') && Array.isArray(data.testimonials) && (
 <Box sx={{ px: 4, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 3 }}>What People Say</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
 {data.testimonials.map((t: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 2.5, borderLeft:`4px solid ${primaryColor}`, border:'1px solid #eee' }}>
 <Typography variant="body2" sx={{ fontStyle:'italic', color:'#555', mb: 2, lineHeight: 1.7 }}>"{t.quote}"</Typography>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 {t.avatar && <Box sx={{ fontSize:'20px' }}>{t.avatar}</Box>}
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.author}</Typography>
 {t.title && <Typography variant="caption" sx={{ color:'#999' }}>{t.title}</Typography>}
 </Box>
 </Box>
 </Paper>
 ))}
 </Box>
 </Box>
 )}

 {/* FAQ section */}
 {!exclude.includes('faq') && Array.isArray(data.faq) && (
 <Box sx={{ px: 4, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 3, color:'#1a1a2e' }}>
 {data.faq_headline ||'Frequently Asked Questions'}
 </Typography>
 {data.faq.map((item: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ mb: 1.5, border:'1px solid #eee', borderRadius: 2, overflow:'hidden' }}>
 <Box sx={{ p: 2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Typography variant="body2" sx={{ fontWeight: 600, color:'#1a1a2e' }}>{item.question || item.q}</Typography>
 <ExpandMoreIcon sx={{ fontSize: 20, color:'#999' }} />
 </Box>
 <Box sx={{ px: 2, pb: 2 }}>
 <Typography variant="body2" sx={{ color:'#666', lineHeight: 1.7 }}>{item.answer || item.a}</Typography>
 </Box>
 </Paper>
 ))}
 </Box>
 )}

 {/* Stats */}
 {!exclude.includes('stats') && Array.isArray(data.stats) && (
 <Box sx={{ display:'flex', justifyContent:'center', gap: 5, py: 4, bgcolor:'#f9fafb' }}>
 {data.stats.map((s: any, i: number) => (
 <Box key={i} sx={{ textAlign:'center' }}>
 <Typography sx={{ fontSize:'2rem', fontWeight: 800, color: primaryColor }}>{s.value}</Typography>
 <Typography variant="body2" sx={{ color:'#888', fontWeight: 600 }}>{s.label}</Typography>
 </Box>
 ))}
 </Box>
 )}

 {/* CTA Footer */}
 {!exclude.includes('cta_footer') && data.cta_footer && (
 <Box sx={{ background: gradient, color:'#fff', px: 4, py: 5, textAlign:'center', mt: 2 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.cta_footer.headline}</Typography>
 <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 550, mx:'auto' }}>{data.cta_footer.subheading}</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 4 }}>
 {data.cta_footer.button_text ||'Get Started'}
 </Button>
 </Box>
 )}

 {/* CTA (object variant) */}
 {!exclude.includes('cta') && data.cta && typeof data.cta ==='object' && data.cta.headline && (
 <Box sx={{ py: 5, textAlign:'center', px: 3 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color:'#1a1a2e' }}>{data.cta.headline}</Typography>
 {data.cta.subheading && <Typography variant="body2" sx={{ color:'#888', mb: 3 }}>{data.cta.subheading}</Typography>}
 <Button variant="contained" sx={{ borderRadius: 3, px: 4, background: gradient, textTransform:'none', fontWeight: 700 }}>
 {data.cta.button_text ||'Get Started'}
 </Button>
 </Box>
 )}
 </>
 );
}

// --- Features Page ----------------------------------------------------------
function RenderFeaturesPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box>
 <RenderNav data={data} primaryColor={primaryColor} />

 {/* Hero */}
 {data.hero && (
 <Box sx={{ background: gradient, color:'#fff', px: 5, py: 6, textAlign:'center' }}>
 {data.hero.badge && (
 <Chip label={data.hero.badge} sx={{ bgcolor:'rgba(255,255,255,0.2)', color:'#fff', fontWeight: 600, fontSize:'0.8rem', mb: 2 }} />
 )}
 <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>{data.hero.headline}</Typography>
 <Typography sx={{ fontSize:'1.1rem', opacity: 0.92, mb: 3, maxWidth: 650, mx:'auto', lineHeight: 1.6 }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* Feature Categories */}
 {Array.isArray(data.feature_categories) && data.feature_categories.map((cat: any, ci: number) => (
 <Box key={ci} sx={{ px: 4, py: 4, bgcolor: ci % 2 === 1 ?'#fafbfc' :'#fff' }}>
 <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, mb: 3, textAlign:'center' }}>{cat.category}</Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 3 }}>
 {cat.items?.map((f: any, i: number) => (
 <Paper key={i} elevation={0} sx={{ p: 3, border:'1px solid #eee', borderRadius: 3, textAlign:'center', transition:'all 0.2s','&:hover': { transform:'translateY(-4px)', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' } }}>
 <Box sx={{ mb: 1.5 }}>{getIcon(f.icon, primaryColor)}</Box>
 <Typography sx={{ fontWeight: 700, mb: 0.5, color:'#1a1a2e' }}>{f.title}</Typography>
 <Typography variant="body2" sx={{ color:'#888', lineHeight: 1.6 }}>{f.description}</Typography>
 </Paper>
 ))}
 </Box>
 </Box>
 ))}

 {/* Comparison Table */}
 {data.comparison && (
 <Box sx={{ px: 4, py: 4 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, textAlign:'center', mb: 3, color:'#1a1a2e' }}>{data.comparison.headline}</Typography>
 <TableContainer component={Paper} elevation={0} sx={{ border:'1px solid #eee', borderRadius: 3 }}>
 <Table size="small">
 <TableHead>
 <TableRow sx={{ bgcolor:'#fafbfc' }}>
 {data.comparison.columns?.map((col: string, i: number) => (
 <TableCell key={i} align={i > 0 ?'center' :'left'} sx={{ fontWeight: 700, color: i === 1 ? primaryColor :'#1a1a2e' }}>{col}</TableCell>
 ))}
 </TableRow>
 </TableHead>
 <TableBody>
 {data.comparison.rows?.map((row: any, i: number) => (
 <TableRow key={i}>
 {(Array.isArray(row) ? row : [row.feature, row.us, row.competitor_a, row.competitor_b]).map((cell: string, ci: number) => (
 <TableCell key={ci} align={ci > 0 ?'center' :'left'} sx={{ fontWeight: ci === 0 ? 500 : 600, color: cell ==='[OK]' ?'#27ae60' : cell ==='[X]' ?'#e74c3c' : ci === 1 ? primaryColor :'#555' }}>{cell}</TableCell>
 ))}
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Box>
 )}

 {/* CTA Footer */}
 {data.cta_footer && (
 <Box sx={{ background: gradient, color:'#fff', px: 4, py: 5, textAlign:'center', mt: 2 }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.cta_footer.headline}</Typography>
 <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 550, mx:'auto' }}>{data.cta_footer.subheading}</Typography>
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 4 }}>
 {data.cta_footer.button_text ||'Get Started'}
 </Button>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['cta_footer']} />
 </Box>
 );
}

// --- Blog Page --------------------------------------------------------------
function RenderBlogPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient =`linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box>
 <RenderNav data={data} primaryColor={primaryColor} />

 {/* Hero */}
 {data.hero && (
 <Box sx={{ background: gradient, color:'#fff', px: 5, py: 5, textAlign:'center' }}>
 <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>{data.hero.headline}</Typography>
 <Typography sx={{ fontSize:'1.1rem', opacity: 0.92, maxWidth: 600, mx:'auto', lineHeight: 1.6 }}>{data.hero.subheading}</Typography>
 </Box>
 )}

 {/* Category Pills */}
 {Array.isArray(data.categories) && (
 <Box sx={{ display:'flex', gap: 1, px: 4, py: 2.5, flexWrap:'wrap', borderBottom:'1px solid #eee' }}>
 {data.categories.map((cat: string, i: number) => (
 <Chip key={i} label={cat} size="small" variant={i === 0 ?'filled' :'outlined'}
 sx={{ fontWeight: 600, fontSize:'0.78rem', cursor:'pointer', ...(i === 0 ? { bgcolor: primaryColor, color:'#fff' } : { borderColor:'#ddd','&:hover': { borderColor: primaryColor, color: primaryColor } }) }}
 />
 ))}
 </Box>
 )}

 {/* Featured Post */}
 {data.featured_post && (
 <Box sx={{ px: 4, py: 3 }}>
 <Paper elevation={0} sx={{ border:'1px solid #eee', borderRadius: 3, overflow:'hidden', display:'flex', flexDirection: { xs:'column', sm:'row' }, cursor:'pointer', transition:'all 0.2s','&:hover': { boxShadow:'0 8px 24px rgba(0,0,0,0.08)' } }}>
 {/* Image placeholder */}
 <Box sx={{ width: { xs:'100%', sm: 280 }, minHeight: 200, background:'linear-gradient(135deg, #eef0ff 0%, #f3e5f5 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
 <Typography sx={{ fontSize:'2.5rem' }}></Typography>
 </Box>
 <Box sx={{ p: 3, display:'flex', flexDirection:'column', justifyContent:'center' }}>
 <Box sx={{ display:'flex', gap: 1, mb: 1.5, alignItems:'center' }}>
 <Chip label={data.featured_post.category} size="small" sx={{ bgcolor: primaryColor, color:'#fff', fontWeight: 600, fontSize:'0.7rem' }} />
 <Chip label="Featured" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize:'0.7rem', borderColor:'#ffa726', color:'#ffa726' }} />
 </Box>
 <Typography variant="h5" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1, lineHeight: 1.3 }}>{data.featured_post.title}</Typography>
 <Typography variant="body2" sx={{ color:'#666', mb: 2, lineHeight: 1.7 }}>{data.featured_post.excerpt}</Typography>
 <Box sx={{ display:'flex', gap: 2, alignItems:'center', mt:'auto' }}>
 <Typography variant="caption" sx={{ color:'#999', fontWeight: 600 }}>{data.featured_post.author}</Typography>
 <Typography variant="caption" sx={{ color:'#ccc' }}>*</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{data.featured_post.date}</Typography>
 <Typography variant="caption" sx={{ color:'#ccc' }}>*</Typography>
 <Typography variant="caption" sx={{ color:'#999' }}>{data.featured_post.read_time}</Typography>
 </Box>
 </Box>
 </Paper>
 </Box>
 )}

 {/* Posts Grid */}
 {Array.isArray(data.posts) && (
 <Box sx={{ px: 4, pb: 4 }}>
 <Grid container spacing={2.5}>
 {data.posts.map((post: any, i: number) => (
 <Grid item xs={12} sm={6} md={4} key={i}>
 <Paper elevation={0} sx={{ border:'1px solid #eee', borderRadius: 3, overflow:'hidden', height:'100%', display:'flex', flexDirection:'column', cursor:'pointer', transition:'all 0.2s','&:hover': { transform:'translateY(-4px)', boxShadow:'0 8px 24px rgba(0,0,0,0.08)' } }}>
 {/* Image placeholder */}
 <Box sx={{ height: 140, background:`linear-gradient(135deg, ${primaryColor}15, #764ba215)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Typography sx={{ fontSize:'1.8rem' }}>{['','','','','','*'][i % 6]}</Typography>
 </Box>
 <Box sx={{ p: 2.5, flex: 1, display:'flex', flexDirection:'column' }}>
 <Chip label={post.category} size="small" sx={{ alignSelf:'flex-start', mb: 1.5, fontWeight: 600, fontSize:'0.68rem', bgcolor:`${primaryColor}12`, color: primaryColor }} />
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e', mb: 1, lineHeight: 1.3, fontSize:'0.95rem' }}>{post.title}</Typography>
 <Typography variant="body2" sx={{ color:'#888', lineHeight: 1.6, mb: 2, flex: 1, fontSize:'0.82rem' }}>{post.excerpt}</Typography>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt:'auto' }}>
 <Typography variant="caption" sx={{ color:'#aaa', fontWeight: 600 }}>{post.author}</Typography>
 <Typography variant="caption" sx={{ color:'#ccc' }}>{post.read_time}</Typography>
 </Box>
 </Box>
 </Paper>
 </Grid>
 ))}
 </Grid>
 </Box>
 )}

 {/* Newsletter */}
 {data.newsletter && (
 <Box sx={{ background: gradient, color:'#fff', px: 4, py: 5, textAlign:'center' }}>
 <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.newsletter.headline}</Typography>
 <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 500, mx:'auto', fontSize:'0.95rem' }}>{data.newsletter.subheading}</Typography>
 <Box sx={{ display:'flex', gap: 1.5, justifyContent:'center', maxWidth: 440, mx:'auto' }}>
 <TextField size="small" placeholder={data.newsletter.placeholder ||'Enter your email'}
 sx={{ flex: 1, bgcolor:'rgba(255,255,255,0.15)', borderRadius: 2, input: { color:'#fff','&::placeholder': { color:'rgba(255,255,255,0.6)' } },'& .MuiOutlinedInput-notchedOutline': { borderColor:'rgba(255,255,255,0.25)' } }}
 />
 <Button variant="contained" sx={{ bgcolor:'#fff', color: primaryColor, fontWeight: 700, px: 3, borderRadius: 2, textTransform:'none','&:hover': { bgcolor:'#f0f0f0' } }}>
 {data.newsletter.button_text ||'Subscribe'}
 </Button>
 </Box>
 </Box>
 )}

 <RenderExtraSections data={data} primaryColor={primaryColor} exclude={['newsletter']} />
 </Box>
 );
}

function RenderLoginPage({ data, primaryColor }: { data: any; primaryColor: string }) {
 const gradient = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 return (
 <Box sx={{ minHeight: '100vh', display: 'flex' }}>
  {/* Left side — branding */}
  <Box sx={{ flex: 1, background: gradient, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 6, color: '#fff' }}>
   <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{data.hero?.headline || 'Welcome Back'}</Typography>
   <Typography sx={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 400, textAlign: 'center', lineHeight: 1.7 }}>{data.hero?.subheading || 'Log in to your account.'}</Typography>
   {data.trust_badges && (
    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
     {data.trust_badges.map((b: string, i: number) => (
      <Chip key={i} label={b} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} />
     ))}
    </Box>
   )}
  </Box>
  {/* Right side — form */}
  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: '#f9fafb' }}>
   <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid #eee', width: '100%', maxWidth: 440 }}>
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#1a1a2e' }}>Log In</Typography>
    <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>Enter your credentials to continue</Typography>
    {data.form?.fields?.map((f: any, i: number) => (
     <Box key={i} sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#555' }}>{f.label}</Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 2, px: 1.5, py: 1, bgcolor: '#fff', fontSize: '0.9rem', color: '#bbb' }}>{f.placeholder}</Box>
     </Box>
    ))}
    {data.form?.forgot_password && (
     <Typography variant="body2" sx={{ textAlign: 'right', color: primaryColor, cursor: 'pointer', mb: 2, fontSize: '0.8rem', fontWeight: 600 }}>{data.form.forgot_password.text}</Typography>
    )}
    <Button fullWidth variant="contained" sx={{ background: gradient, fontWeight: 700, py: 1.2, borderRadius: 2, fontSize: '0.95rem', mb: 2 }}>
     {data.form?.submit_text || 'Log In'}
    </Button>
    {data.social_login && (
     <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.8rem' }}>{data.social_login.headline}</Typography></Divider>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
       {data.social_login.providers?.map((p: any, i: number) => (
        <Button key={i} fullWidth variant="outlined" sx={{ borderColor: '#ddd', color: '#555', fontWeight: 600, borderRadius: 2, py: 1, textTransform: 'none' }}>{p.name}</Button>
       ))}
      </Box>
     </Box>
    )}
    {data.register_cta && (
     <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#888' }}>
      {data.register_cta.text}{' '}
      <Typography component="span" sx={{ color: primaryColor, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>{data.register_cta.link_text}</Typography>
     </Typography>
    )}
   </Paper>
  </Box>
 </Box>
 );
}

function RenderRegisterPage({ data, primaryColor, appId }: { data: any; primaryColor: string; appId?: number }) {
 const gradient = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
 const [formValues, setFormValues] = useState<Record<string, string>>({});
 const [submitting, setSubmitting] = useState(false);
 const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

 // Build the register endpoint — prefer appId prop, fall back to content_json api block
 const registerUrl = (() => {
  if (appId) return `${API.apps}/${appId}/members/register`;
  // Fall back to the api.register_endpoint stored in the page's content_json
  if (data.api?.register_endpoint) {
   const ep = data.api.register_endpoint as string;
   // If it's a relative path, prepend the API base
   if (ep.startsWith('/')) return `${API_BASE_URL}${ep}`;
   return ep;
  }
  return null;
 })();

 const handleChange = (fieldName: string, value: string) => {
  setFormValues(prev => ({ ...prev, [fieldName]: value }));
 };

 const handleSubmit = async () => {
  if (submitting) return;
  // Basic validation
  const email = formValues['email'] || '';
  const password = formValues['password'] || '';
  if (!email) { setResult({ success: false, message: 'Email is required' }); return; }
  if (!password) { setResult({ success: false, message: 'Password is required' }); return; }
  if (!registerUrl) { setResult({ success: false, message: 'No app selected — cannot register. Missing appId and api.register_endpoint.' }); return; }

  setSubmitting(true);
  setResult(null);
  try {
   const res = await fetch(registerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     first_name: formValues['first_name'] || formValues['name'] || '',
     last_name: formValues['last_name'] || '',
     email,
     password,
    }),
   });
   const json = await res.json();
   if (json.success) {
    setResult({ success: true, message: `Welcome ${json.data?.name || ''}! Account created successfully.` });
    setFormValues({});
   } else {
    setResult({ success: false, message: json.message || 'Registration failed' });
   }
  } catch (err: any) {
   setResult({ success: false, message: err?.message || 'Network error' });
  } finally {
   setSubmitting(false);
  }
 };

 return (
 <Box sx={{ minHeight: '100vh', display: 'flex' }}>
  {/* Left side — benefits */}
  <Box sx={{ flex: 1, background: gradient, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 6, color: '#fff' }}>
   <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{data.hero?.headline || 'Create Your Account'}</Typography>
   <Typography sx={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 450, lineHeight: 1.7, mb: 4 }}>{data.hero?.subheading || 'Join us today.'}</Typography>
   {data.benefits?.map((b: any, i: number) => (
    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2.5, alignItems: 'flex-start' }}>
     <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {getIcon(b.icon, '#fff')}
     </Box>
     <Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.title}</Typography>
      <Typography sx={{ fontSize: '0.85rem', opacity: 0.85 }}>{b.description}</Typography>
     </Box>
    </Box>
   ))}
   {data.trust_badges && (
    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
     {data.trust_badges.map((b: string, i: number) => (
      <Chip key={i} label={b} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} />
     ))}
    </Box>
   )}
  </Box>
  {/* Right side — form */}
  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: '#f9fafb' }}>
   <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid #eee', width: '100%', maxWidth: 440 }}>
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#1a1a2e' }}>Create Account</Typography>
    <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>Fill in your details to get started</Typography>
    {result && (
     <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setResult(null)}>
      {result.message}
     </Alert>
    )}
    <Box sx={{ display: 'grid', gridTemplateColumns: data.form?.fields?.some((f: any) => f.name === 'first_name') ? '1fr 1fr' : '1fr', gap: 2 }}>
     {data.form?.fields?.map((f: any, i: number) => {
      const isHalf = f.name === 'first_name' || f.name === 'last_name';
      return (
       <Box key={i} sx={{ gridColumn: isHalf ? 'auto' : '1 / -1', mb: 0.5 }}>
        <TextField
         fullWidth
         size="small"
         label={f.label}
         placeholder={f.placeholder}
         type={f.name === 'password' ? 'password' : f.name === 'email' ? 'email' : 'text'}
         value={formValues[f.name] || ''}
         onChange={(e) => handleChange(f.name, e.target.value)}
         disabled={submitting || result?.success === true}
         sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
        />
       </Box>
      );
     })}
    </Box>
    {data.form?.terms && (
     <Typography variant="body2" sx={{ color: '#888', mt: 2, fontSize: '0.8rem' }}>
      {data.form.terms.text}{' '}
      <Typography component="span" sx={{ color: primaryColor, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>{data.form.terms.link_text}</Typography>
     </Typography>
    )}
    <Button
     fullWidth
     variant="contained"
     onClick={handleSubmit}
     disabled={submitting || result?.success === true}
     sx={{ background: gradient, fontWeight: 700, py: 1.2, borderRadius: 2, fontSize: '0.95rem', mt: 2.5, mb: 2 }}
    >
     {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : result?.success ? '✅ Registered!' : (data.form?.submit_text || 'Create Account')}
    </Button>
    {data.social_login && (
     <Box sx={{ mt: 1 }}>
      <Divider sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.8rem' }}>{data.social_login.headline}</Typography></Divider>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
       {data.social_login.providers?.map((p: any, i: number) => (
        <Button key={i} fullWidth variant="outlined" sx={{ borderColor: '#ddd', color: '#555', fontWeight: 600, borderRadius: 2, py: 1, textTransform: 'none' }}>{p.name}</Button>
       ))}
      </Box>
     </Box>
    )}
    {data.login_cta && (
     <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#888' }}>
      {data.login_cta.text}{' '}
      <Typography component="span" sx={{ color: primaryColor, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>{data.login_cta.link_text}</Typography>
     </Typography>
    )}
   </Paper>
  </Box>
 </Box>
 );
}

// Route the page type to the correct renderer
function RenderPage({ data: rawData, primaryColor, appId, onNavigate }: { data: any; primaryColor: string; appId?: number; onNavigate?: (pageType: string, plan?: any) => void }) {
 // Resolve AI styled-text objects (e.g. {text:"...", color:"orange"}) into <span> elements
 const data = resolveStyledText(rawData);
 const pageType = rawData.page_type;
 switch (pageType) {
 case'index': return <RenderIndexPage data={data} primaryColor={primaryColor} />;
 case'thanks': return <RenderThanksPage data={data} primaryColor={primaryColor} />;
 case'members': return <RenderMembersPage data={data} primaryColor={primaryColor} />;
 case'checkout': return <RenderCheckoutPage data={data} primaryColor={primaryColor} appId={appId} />;
 case'admin': return <RenderAdminPage data={data} primaryColor={primaryColor} appId={appId} />;
 case'pricing': return <RenderPricingPage data={data} primaryColor={primaryColor} onNavigate={onNavigate} />;
 case'about': return <RenderAboutPage data={data} primaryColor={primaryColor} />;
 case'features': return <RenderFeaturesPage data={data} primaryColor={primaryColor} />;
 case'blog-page': return <RenderBlogPage data={data} primaryColor={primaryColor} />;
 case'faq': return <RenderFaqPage data={data} primaryColor={primaryColor} />;
 case'contact': return <RenderContactPage data={data} primaryColor={primaryColor} />;
 case'login': return <RenderLoginPage data={data} primaryColor={primaryColor} />;
 case'register': return <RenderRegisterPage data={data} primaryColor={primaryColor} appId={appId} />;
 case'tool': return <RenderToolPage data={data} primaryColor={primaryColor} />;
 default:
 // Try to auto-detect
 if (data.tool_input || data.content_list || data.notifications || data.settings_sections) return <RenderToolPage data={data} primaryColor={primaryColor} />;
 if (data.features_section || data.nav) return <RenderIndexPage data={data} primaryColor={primaryColor} />;
 if (data.order_confirmation || data.next_steps) return <RenderThanksPage data={data} primaryColor={primaryColor} />;
 if (data.welcome || data.courses) return <RenderMembersPage data={data} primaryColor={primaryColor} />;
 if (data.billing_toggle || data.comparison) return <RenderPricingPage data={data} primaryColor={primaryColor} onNavigate={onNavigate} />;
 if (data.plans || data.payment_form) return <RenderCheckoutPage data={data} primaryColor={primaryColor} appId={appId} />;
 if (data.kpis || data.revenue_chart) return <RenderAdminPage data={data} primaryColor={primaryColor} appId={appId} />;
 if (data.values || data.team || data.timeline) return <RenderAboutPage data={data} primaryColor={primaryColor} />;
 if (data.feature_categories) return <RenderFeaturesPage data={data} primaryColor={primaryColor} />;
 if (data.featured_post || data.posts) return <RenderBlogPage data={data} primaryColor={primaryColor} />;
 if (data.categories && data.support_cta) return <RenderFaqPage data={data} primaryColor={primaryColor} />;
 if (data.form && data.contact_info) return <RenderContactPage data={data} primaryColor={primaryColor} />;
 if (data.form?.fields && data.register_cta) return <RenderLoginPage data={data} primaryColor={primaryColor} />;
 if (data.form?.fields && data.login_cta) return <RenderRegisterPage data={data} primaryColor={primaryColor} appId={appId} />;
 // Handle legacy renderer keys
 if (data.hero || data.sections || data.pricing) return <RenderIndexPage data={data} primaryColor={primaryColor} />;
 return <RenderGenericPage data={data} />;
 }
}

// --- Main Component ----------------------------------------------------------

export function AppPreviewPage() {
 const [apps, setApps] = useState<App[]>([]);
 const [selectedApp, setSelectedApp] = useState<App | null>(null);
 const [pages, setPages] = useState<Page[]>([]);
 const [activePage, setActivePage] = useState<Page | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [history, setHistory] = useState<string[]>([]);
 const [historyIndex, setHistoryIndex] = useState(-1);
 const [addressBar, setAddressBar] = useState('');
 const [scrollAll, setScrollAll] = useState(true);

 // Load apps
 useEffect(() => {
 (async () => {
 try {
 const res = await axios.get(API.apps);
 const list = res.data?.data || res.data || [];
 setApps(list);
 } catch { setError('Failed to load projects'); }
 finally { setLoading(false); }
 })();
 }, []);

 // Load pages when app selected
 const loadPages = useCallback(async (app: App) => {
 setLoading(true);
 try {
 const res = await axios.get(`${API.pages}?app_id=${app.id}`);
 const plist: Page[] = res.data?.data || res.data || [];
 setPages(plist);
 // Navigate to index/home page by default
 const home = plist.find(p => p.page_type ==='index') || plist[0];
 if (home) navigateTo(home, plist, app);
 } catch { setError('Failed to load pages'); }
 finally { setLoading(false); }
 }, []);

 const navigateTo = (page: Page, _pageList?: Page[], app?: App) => {
 const theApp = app || selectedApp;
 const slug = theApp?.slug ||'app';
 const path = page.page_type ==='index' ?`/${slug}` :`/${slug}/${page.page_type}`;
 setActivePage(page);
 setAddressBar(`https://${slug}.example.com${page.page_type ==='index' ?'/' :'/' + page.page_type}`);
 setHistory(prev => {
 const newHistory = [...prev.slice(0, historyIndex + 1), path];
 setHistoryIndex(newHistory.length - 1);
 return newHistory;
 });
 };

 const handleSelectApp = (app: App) => {
 setSelectedApp(app);
 setActivePage(null);
 setHistory([]);
 setHistoryIndex(-1);
 loadPages(app);
 };

 const canGoBack = historyIndex > 0;
 const canGoForward = historyIndex < history.length - 1;

 const goBack = () => {
 if (!canGoBack) return;
 const newIdx = historyIndex - 1;
 setHistoryIndex(newIdx);
 const path = history[newIdx];
 const slug = path.split('/')[1];
 const pageType = path.split('/')[2] ||'index';
 const page = pages.find(p => p.page_type === pageType);
 if (page) {
 setActivePage(page);
 setAddressBar(`https://${slug}.example.com${pageType ==='index' ?'/' :'/' + pageType}`);
 }
 };

 const goForward = () => {
 if (!canGoForward) return;
 const newIdx = historyIndex + 1;
 setHistoryIndex(newIdx);
 const path = history[newIdx];
 const slug = path.split('/')[1];
 const pageType = path.split('/')[2] ||'index';
 const page = pages.find(p => p.page_type === pageType);
 if (page) {
 setActivePage(page);
 setAddressBar(`https://${slug}.example.com${pageType ==='index' ?'/' :'/' + pageType}`);
 }
 };

 const primaryColor = selectedApp?.primary_color ||'#667eea';

 // Handle pricing CTA navigation — free plans go to register, paid plans to checkout
 const handlePricingNavigate = useCallback((pageType: string, _plan?: any) => {
  const target = pages.find(p => p.page_type === pageType);
  if (target) navigateTo(target);
 }, [pages]);

 // --- No app selected ------------------------------------------------------
 if (!selectedApp) {
 return (
 <Box sx={{ p: 3, maxWidth: 1200, mx:'auto' }}>
 <Box sx={{ mb: 4 }}>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 0.5 }}>App Preview</Typography>
 <Typography sx={{ color:'#888' }}>Test your apps in a full browser simulation. Navigate between pages and verify functionality.</Typography>
 </Box>

 {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

 {loading ? (
 <Box sx={{ display:'flex', justifyContent:'center', py: 8 }}><CircularProgress /></Box>
 ) : apps.length === 0 ? (
 <Paper elevation={0} sx={{ p: 5, textAlign:'center', border:'1px solid #eee' }}>
 <Typography sx={{ color:'#999', mb: 1 }}>No projects found</Typography>
 <Typography variant="body2" sx={{ color:'#bbb' }}>Create a project first to preview it here.</Typography>
 </Paper>
 ) : (
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
 {apps.map(app => (
 <Paper
 key={app.id}
 elevation={0}
 onClick={() => handleSelectApp(app)}
 sx={{
 p: 3, border:'1px solid #eee', borderRadius: 3, cursor:'pointer',
 transition:'all 0.2s',
'&:hover': { borderColor: app.primary_color ||'#667eea', transform:'translateY(-2px)', boxShadow:'0 8px 24px rgba(0,0,0,0.06)' },
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, mb: 1.5 }}>
 <Box sx={{ width: 36, height: 36, borderRadius: 2, background:`linear-gradient(135deg, ${app.primary_color ||'#667eea'}, #764ba2)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight: 800, fontSize:'1rem' }}>
 {app.name.charAt(0)}
 </Box>
 <Box>
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e' }}>{app.name}</Typography>
 <Typography variant="caption" sx={{ color:'#bbb' }}>{app.slug}.example.com</Typography>
 </Box>
 </Box>
 {app.description && <Typography variant="body2" sx={{ color:'#888', lineHeight: 1.5 }}>{app.description}</Typography>}
 <Button size="small" sx={{ mt: 1.5, fontWeight: 700, color: app.primary_color ||'#667eea' }}>
 Open Preview {'->'}
 </Button>
 </Paper>
 ))}
 </Box>
 )}
 </Box>
 );
 }

 // --- App Preview Browser --------------------------------------------------
 return (
 <Box sx={{ display:'flex', flexDirection:'column', height:'calc(100vh - 64px)', bgcolor:'#e8eaed' }}>
 {/* Top Bar -- back to selector + app name */}
 <Box sx={{ display:'flex', alignItems:'center', gap: 2, px: 2, py: 1, bgcolor:'#fff', borderBottom:'1px solid #e0e0e0' }}>
 <Button size="small" startIcon={<BackIcon />} onClick={() => { setSelectedApp(null); setPages([]); setActivePage(null); }} sx={{ color:'#888', fontWeight: 600 }}>
 All Apps
 </Button>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ width: 24, height: 24, borderRadius: 1.5, background:`linear-gradient(135deg, ${primaryColor}, #764ba2)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight: 800, fontSize:'0.7rem' }}>
 {selectedApp.name.charAt(0)}
 </Box>
 <Typography sx={{ fontWeight: 700, color:'#1a1a2e', fontSize:'0.95rem' }}>{selectedApp.name}</Typography>
 </Box>
 <Box sx={{ flex: 1 }} />
 {/* Page navigation tabs */}
 {!scrollAll && (
 <Box sx={{ display:'flex', gap: 0.5 }}>
 {pages.map(page => (
 <Chip
 key={page.id}
 icon={getPageIcon(page.page_type)}
 label={page.title}
 size="small"
 onClick={() => navigateTo(page)}
 sx={{
 fontWeight: activePage?.id === page.id ? 700 : 500,
 fontSize:'0.78rem',
 bgcolor: activePage?.id === page.id ?`${primaryColor}15` :'transparent',
 color: activePage?.id === page.id ? primaryColor :'#888',
 border: activePage?.id === page.id ?`1px solid ${primaryColor}40` :'1px solid transparent',
 cursor:'pointer',
'&:hover': { bgcolor:`${primaryColor}08` },
 }}
 />
 ))}
 </Box>
 )}
 {scrollAll && (
 <Chip
 icon={<ViewStreamIcon sx={{ fontSize: 14 }} />}
 label={`${pages.filter(p => p.content_json).length} pages`}
 size="small"
 sx={{ fontWeight: 600, fontSize:'0.78rem', bgcolor:`${primaryColor}12`, color: primaryColor, border:`1px solid ${primaryColor}30` }}
 />
 )}
 </Box>

 {/* Browser Chrome */}
 <Box sx={{ display:'flex', justifyContent:'center', px: 2, pt: 2, flex: 1, overflow:'hidden' }}>
 <Box sx={{ width:'100%', maxWidth: 1200, display:'flex', flexDirection:'column', height:'100%' }}>
 {/* Browser window */}
 <Box sx={{ bgcolor:'#fff', borderRadius:'12px 12px 0 0', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column', flex: 1, overflow:'hidden' }}>
 {/* Title bar */}
 <Box sx={{ bgcolor:'#f5f5f5', px: 2, py: 1, display:'flex', alignItems:'center', gap: 1.5, borderBottom:'1px solid #d0d0d0', borderRadius:'12px 12px 0 0' }}>
 <Box sx={{ display:'flex', gap: 0.5 }}>
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#ff5f56' }} />
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#ffbd2e' }} />
 <Box sx={{ width: 12, height: 12, borderRadius:'50%', bgcolor:'#27c93f' }} />
 </Box>
 {/* Nav buttons */}
 <Box sx={{ display:'flex', gap: 0.25 }}>
 <IconButton size="small" disabled={!canGoBack} onClick={goBack} sx={{ p: 0.5 }}>
 <BackIcon sx={{ fontSize: 16, color: canGoBack ?'#555' :'#ccc' }} />
 </IconButton>
 <IconButton size="small" disabled={!canGoForward} onClick={goForward} sx={{ p: 0.5 }}>
 <ForwardIcon sx={{ fontSize: 16, color: canGoForward ?'#555' :'#ccc' }} />
 </IconButton>
 <IconButton size="small" onClick={() => activePage && navigateTo(activePage)} sx={{ p: 0.5 }}>
 <RefreshIcon sx={{ fontSize: 16, color:'#555' }} />
 </IconButton>
 </Box>
 {/* Address bar */}
 <Box sx={{ flex: 1, bgcolor:'#fff', borderRadius:'8px', border:'1px solid #ddd', px: 1.5, py: 0.5, display:'flex', alignItems:'center', gap: 1 }}>
 <LockIcon sx={{ fontSize: 14, color:'#4caf50' }} />
 <Typography sx={{ fontSize:'0.8rem', color:'#555', fontFamily:'monospace', flex: 1 }}>{scrollAll ?`https://${selectedApp.slug}.example.com/` : addressBar}</Typography>
 </Box>
 {/* View mode toggle */}
 <Tooltip title={scrollAll ?'Single page view' :'Scroll all pages'} arrow>
 <IconButton size="small" onClick={() => setScrollAll(!scrollAll)} sx={{ p: 0.5 }}>
 {scrollAll ? <SinglePageIcon sx={{ fontSize: 18, color: primaryColor }} /> : <ViewStreamIcon sx={{ fontSize: 18, color:'#888' }} />}
 </IconButton>
 </Tooltip>
 </Box>

 {/* Page content */}
 <Box sx={{ flex: 1, overflow:'auto', bgcolor:'#fff' }}>
 {loading ? (
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%' }}>
 <CircularProgress />
 </Box>
 ) : scrollAll ? (
 // --- Scroll-All Mode: render every page stacked -----------
 pages.length > 0 ? (
 <Box>
 {pages.filter(p => p.content_json).map((page, idx) => (
 <Box key={page.id}>
 {/* Page divider header */}
 <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, px: 3, py: 1.5, bgcolor: idx === 0 ?'transparent' :'#f8f9fa', borderTop: idx === 0 ?'none' :'3px solid #e0e0e0' }}>
 <Box sx={{ width: 28, height: 28, borderRadius:'50%', bgcolor:`${primaryColor}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
 {getPageIcon(page.page_type)}
 </Box>
 <Box>
 <Typography sx={{ fontWeight: 700, fontSize:'0.85rem', color:'#1a1a2e', lineHeight: 1.2 }}>{page.title}</Typography>
 <Typography variant="caption" sx={{ color:'#bbb' }}>/{page.page_type ==='index' ?'' : page.page_type}</Typography>
 </Box>
 </Box>
 {/* Rendered page */}
 <PreviewErrorBoundary>
 <RenderPage data={page.content_json as any} primaryColor={primaryColor} appId={selectedApp?.id} onNavigate={handlePricingNavigate} />
 </PreviewErrorBoundary>
 </Box>
 ))}
 {pages.filter(p => p.content_json).length === 0 && (
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height: 300, flexDirection:'column' }}>
 <Typography sx={{ color:'#bbb', fontSize:'1.2rem', mb: 1 }}>No content</Typography>
 <Typography variant="body2" sx={{ color:'#ddd' }}>None of the pages have content configured.</Typography>
 </Box>
 )}
 </Box>
 ) : (
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', flexDirection:'column' }}>
 <Typography sx={{ color:'#bbb', fontSize:'1.2rem', mb: 1 }}>No pages</Typography>
 <Typography variant="body2" sx={{ color:'#ddd' }}>This project has no pages yet.</Typography>
 </Box>
 )
 ) : activePage?.content_json ? (
 <PreviewErrorBoundary>
 <RenderPage data={activePage.content_json} primaryColor={primaryColor} appId={selectedApp?.id} onNavigate={handlePricingNavigate} />
 </PreviewErrorBoundary>
 ) : (
 <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', flexDirection:'column' }}>
 <Typography sx={{ color:'#bbb', fontSize:'1.2rem', mb: 1 }}>No content</Typography>
 <Typography variant="body2" sx={{ color:'#ddd' }}>This page has no content_json configured.</Typography>
 </Box>
 )}
 </Box>
 </Box>
 </Box>
 </Box>
 </Box>
 );
}

export default AppPreviewPage;
export { RenderPage, RenderIndexPage, RenderThanksPage, RenderMembersPage, RenderCheckoutPage, RenderAdminPage, RenderToolPage, RenderGenericPage, RenderLoginPage, RenderRegisterPage };
