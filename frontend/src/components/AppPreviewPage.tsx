import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
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
} from '@mui/material';
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
} from '@mui/icons-material';
import axios from 'axios';

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

// Icon resolver for template content
const getIcon = (iconName: string, color?: string) => {
  const sx = { fontSize: 32, color: color || '#667eea' };
  switch (iconName?.toLowerCase()) {
    case 'bolt': case 'zap': return <BoltIcon sx={sx} />;
    case 'lock': case 'shield': case 'security': return <ShieldIcon sx={sx} />;
    case 'trending_up': case 'trending-up': return <TrendingUpIcon sx={sx} />;
    case 'people': case 'team': return <PeopleIcon sx={sx} />;
    case 'speed': case 'auto-scaling': return <SpeedIcon sx={sx} />;
    case 'support': case 'help': return <SupportIcon sx={sx} />;
    default: return <BoltIcon sx={sx} />;
  }
};

// Page type icon
const getPageIcon = (type: string) => {
  switch (type) {
    case 'index': return <HomeIcon sx={{ fontSize: 16 }} />;
    case 'checkout': return <CreditCardIcon sx={{ fontSize: 16 }} />;
    case 'admin': return <DashboardIcon sx={{ fontSize: 16 }} />;
    case 'members': return <PersonIcon sx={{ fontSize: 16 }} />;
    case 'thanks': return <CelebrationIcon sx={{ fontSize: 16 }} />;
    default: return <HomeIcon sx={{ fontSize: 16 }} />;
  }
};

// ─── Page Renderers ──────────────────────────────────────────────────────────

function RenderIndexPage({ data, primaryColor }: { data: any; primaryColor: string }) {
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
  return (
    <Box>
      {/* Nav */}
      {data.nav && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderBottom: '1px solid #eee' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>{data.nav.brand}</Typography>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            {data.nav.links?.map((link: string, i: number) => (
              <Typography key={i} sx={{ fontSize: '0.85rem', color: '#555', cursor: 'pointer', '&:hover': { color: primaryColor } }}>{link}</Typography>
            ))}
            <Button size="small" variant="contained" sx={{ background: gradient, fontWeight: 700, fontSize: '0.8rem', borderRadius: 2, px: 2 }}>
              {data.nav.cta || 'Get Started'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Hero */}
      {data.hero && (
        <Box sx={{ background: gradient, color: '#fff', px: 5, py: 6, textAlign: 'center' }}>
          {data.hero.badge && (
            <Chip label={data.hero.badge} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.8rem', mb: 2 }} />
          )}
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.2 }}>{data.hero.headline}</Typography>
          <Typography sx={{ fontSize: '1.1rem', opacity: 0.92, mb: 3, maxWidth: 650, mx: 'auto', lineHeight: 1.6 }}>{data.hero.subheading}</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
            <Button variant="contained" sx={{ bgcolor: '#fff', color: primaryColor, fontWeight: 700, px: 3, py: 1 }}>
              {data.hero.cta_primary?.text || data.hero.primaryCta || 'Get Started'}
            </Button>
            <Button variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', fontWeight: 600, px: 3, py: 1 }}>
              {data.hero.cta_secondary?.text || data.hero.secondaryCta || 'Learn More'}
            </Button>
          </Box>
          {data.hero.social_proof && (
            <Typography sx={{ fontSize: '0.85rem', opacity: 0.75, mt: 2 }}>{data.hero.social_proof}</Typography>
          )}
        </Box>
      )}

      {/* Trusted By */}
      {Array.isArray(data.trusted_by) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, py: 3, bgcolor: '#f9fafb', borderBottom: '1px solid #eee' }}>
          {data.trusted_by.map((brand: string, i: number) => (
            <Typography key={i} sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brand}</Typography>
          ))}
        </Box>
      )}

      {/* Features */}
      {data.features_section && (
        <Box sx={{ px: 4, py: 5, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a1a2e' }}>{data.features_section.headline}</Typography>
          <Typography sx={{ color: '#888', mb: 4, maxWidth: 550, mx: 'auto' }}>{data.features_section.subheading}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {data.features_section.items?.map((f: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 3, textAlign: 'center', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
                <Box sx={{ mb: 1.5 }}>{getIcon(f.icon, f.color)}</Box>
                <Typography sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a2e' }}>{f.title}</Typography>
                <Typography variant="body2" sx={{ color: '#888', lineHeight: 1.6 }}>{f.description}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Stats */}
      {Array.isArray(data.stats) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5, py: 4, bgcolor: '#f9fafb' }}>
          {data.stats.map((s: any, i: number) => (
            <Box key={i} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: primaryColor }}>{s.value}</Typography>
              <Typography variant="body2" sx={{ color: '#888', fontWeight: 600 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Sections (generic) */}
      {Array.isArray(data.sections) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, px: 4, py: 4 }}>
          {data.sections.map((s: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px solid #eee', borderRadius: 3, '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }, transition: 'all 0.2s' }}>
              {s.icon && <Box sx={{ mb: 1.5 }}>{getIcon(s.icon)}</Box>}
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{s.title}</Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>{s.description}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Testimonials */}
      {Array.isArray(data.testimonials) && (
        <Box sx={{ px: 4, py: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 3 }}>Loved by Teams Worldwide</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
            {data.testimonials.map((t: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ p: 2.5, borderLeft: `4px solid ${primaryColor}`, border: '1px solid #eee' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555', mb: 2, lineHeight: 1.7 }}>"{t.quote}"</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ fontSize: '20px' }}>{t.avatar}</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.author}</Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>{t.title}</Typography>
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
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>{data.pricing.title}</Typography>
          <Typography sx={{ textAlign: 'center', color: '#888', mb: 3 }}>{data.pricing.subtitle}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {data.pricing.plans?.map((plan: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ p: 3, border: plan.badge ? `2px solid ${primaryColor}` : '1px solid #eee', position: 'relative', borderRadius: 3 }}>
                {plan.badge && (
                  <Chip label={plan.badge} size="small" sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: primaryColor, color: '#fff', fontWeight: 700 }} />
                )}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{plan.name}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: primaryColor }}>{plan.price}</Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>{plan.period}</Typography>
                <Box sx={{ mt: 2 }}>
                  {plan.features?.map((f: string, fi: number) => (
                    <Box key={fi} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                      <CheckIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="body2" sx={{ color: '#555' }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>
                <Button variant={plan.badge ? 'contained' : 'outlined'} fullWidth sx={{ mt: 2, background: plan.badge ? gradient : undefined }}>{plan.cta || 'Choose Plan'}</Button>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* CTA Footer */}
      {data.cta_footer && (
        <Box sx={{ background: gradient, color: '#fff', px: 4, py: 5, textAlign: 'center', mt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{data.cta_footer.headline}</Typography>
          <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 550, mx: 'auto' }}>{data.cta_footer.subheading}</Typography>
          <Button variant="contained" sx={{ bgcolor: '#fff', color: primaryColor, fontWeight: 700, px: 4 }}>
            {data.cta_footer.button_text || 'Get Started'}
          </Button>
        </Box>
      )}

      {/* Generic CTA */}
      {data.cta && typeof data.cta === 'string' && (
        <Box sx={{ background: gradient, color: '#fff', p: 4, textAlign: 'center', borderRadius: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{data.cta}</Typography>
          <Button variant="contained" sx={{ bgcolor: '#fff', color: primaryColor, fontWeight: 700 }}>{data.ctaButton || 'Get Started'}</Button>
        </Box>
      )}
    </Box>
  );
}

function RenderThanksPage({ data, primaryColor }: { data: any; primaryColor: string }) {
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
  return (
    <Box>
      {/* Hero */}
      {data.hero && (
        <Box sx={{ background: gradient, color: '#fff', px: 5, py: 5, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>{data.hero.headline}</Typography>
          <Typography sx={{ fontSize: '1.05rem', opacity: 0.92, maxWidth: 600, mx: 'auto' }}>{data.hero.subheading}</Typography>
        </Box>
      )}

      {/* Order Confirmation */}
      {data.order_confirmation && (
        <Paper elevation={0} sx={{ mx: 4, mt: 3, p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Order Confirmation</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            {Object.entries(data.order_confirmation).map(([key, val]: [string, any]) => (
              <Box key={key}>
                <Typography variant="caption" sx={{ color: '#999', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1a1a2e' }}>{val}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Email Notification */}
      {data.email_notification && (
        <Paper elevation={0} sx={{ mx: 4, mt: 2, p: 2.5, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmailIcon sx={{ color: '#4caf50', fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#2e7d32' }}>{data.email_notification.message}</Typography>
            <Typography variant="body2" sx={{ color: '#4caf50' }}>{data.email_notification.detail}</Typography>
          </Box>
        </Paper>
      )}

      {/* Next Steps */}
      {Array.isArray(data.next_steps) && (
        <Box sx={{ px: 4, py: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>What's Next</Typography>
          {data.next_steps.map((step: any, i: number) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${primaryColor}, #764ba2)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                {step.step}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#1a1a2e' }}>{step.title}</Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>{step.description}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* CTAs */}
      {(data.cta_primary || data.cta_secondary) && (
        <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 2 }}>
          {data.cta_primary && (
            <Button variant="contained" sx={{ background: `linear-gradient(135deg, ${primaryColor}, #764ba2)`, fontWeight: 700, px: 3 }}>
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
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #eee' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e' }}>{data.welcome.headline}</Typography>
          <Typography sx={{ color: '#888', mt: 0.5 }}>{data.welcome.subheading}</Typography>
        </Box>
      )}

      {/* Stats */}
      {Array.isArray(data.stats) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${data.stats.length}, 1fr)`, gap: 2, px: 4, py: 3 }}>
          {data.stats.map((s: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: primaryColor, my: 0.5 }}>{s.value}</Typography>
              {s.sub && <Typography variant="caption" sx={{ color: '#aaa' }}>{s.sub}</Typography>}
            </Paper>
          ))}
        </Box>
      )}

      {/* Courses */}
      {Array.isArray(data.courses) && (
        <Box sx={{ px: 4, py: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Your Courses</Typography>
          {data.courses.map((c: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #eee', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, color: '#1a1a2e' }}>{c.title}</Typography>
                <Chip label={c.tag} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: c.tag === 'New' ? '#e8f5e9' : '#e3f2fd', color: c.tag === 'New' ? '#2e7d32' : '#1565c0' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress variant="determinate" value={c.progress} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { borderRadius: 4, background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` } }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.lessons} · {c.progress}%</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Quick Actions */}
      {Array.isArray(data.quick_actions) && (
        <Box sx={{ px: 4, py: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.9rem' }}>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {data.quick_actions.map((a: string, i: number) => (
              <Button key={i} variant="outlined" size="small" sx={{ borderRadius: 2, borderColor: '#ddd', color: '#555', fontWeight: 600, '&:hover': { borderColor: primaryColor, color: primaryColor } }}>
                {a}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function RenderCheckoutPage({ data, primaryColor }: { data: any; primaryColor: string }) {
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`;
  return (
    <Box sx={{ px: 4, py: 4 }}>
      {/* Headline */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>{data.headline}</Typography>
        {data.subheading && <Typography sx={{ color: '#888' }}>{data.subheading}</Typography>}
      </Box>

      {/* Plans */}
      {Array.isArray(data.plans) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.plans.length, 3)}, 1fr)`, gap: 2.5, mb: 4 }}>
          {data.plans.map((plan: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ p: 3, border: plan.popular ? `2px solid ${primaryColor}` : '1px solid #eee', borderRadius: 3, position: 'relative', opacity: plan.disabled ? 0.6 : 1 }}>
              {plan.popular && (
                <Chip label="Most Popular" size="small" sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: primaryColor, color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>
              <Typography variant="body2" sx={{ color: '#888', mb: 2, minHeight: 40 }}>{plan.description}</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h3" component="span" sx={{ fontWeight: 800, color: primaryColor }}>{plan.price}</Typography>
                <Typography component="span" sx={{ color: '#999' }}>{plan.period}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                {plan.features?.map((f: string, fi: number) => (
                  <Box key={fi} sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'center' }}>
                    <CheckIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="body2" sx={{ color: '#555' }}>{f}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant={plan.popular ? 'contained' : 'outlined'}
                fullWidth
                disabled={plan.disabled}
                sx={{ mt: 1, fontWeight: 700, background: plan.popular ? gradient : undefined, borderColor: !plan.popular ? '#ddd' : undefined }}
              >
                {plan.cta || 'Choose Plan'}
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* Payment Form */}
      {data.payment_form && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 3, maxWidth: 500, mx: 'auto', mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>Payment Details</Typography>
          {data.payment_form.fields?.map((field: string, i: number) => (
            <TextField key={i} fullWidth size="small" label={field} variant="outlined" sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          ))}
          <Button variant="contained" fullWidth sx={{ mt: 1, background: gradient, fontWeight: 700, py: 1.2 }}>
            {data.payment_form.submit_text || 'Subscribe'}
          </Button>
        </Paper>
      )}

      {/* Trust Badges */}
      {Array.isArray(data.trust_badges) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
          {data.trust_badges.map((badge: string, i: number) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ShieldIcon sx={{ fontSize: 16, color: '#4caf50' }} />
              <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>{badge}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Guarantee */}
      {data.guarantee && (
        <Typography sx={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem' }}>{data.guarantee}</Typography>
      )}
    </Box>
  );
}

function RenderAdminPage({ data, primaryColor }: { data: any; primaryColor: string }) {
  return (
    <Box sx={{ px: 3, py: 3 }}>
      {/* Dashboard Title */}
      {data.dashboard_title && (
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 3 }}>{data.dashboard_title}</Typography>
      )}

      {/* KPIs */}
      {Array.isArray(data.kpis) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${data.kpis.length}, 1fr)`, gap: 2, mb: 3 }}>
          {data.kpis.map((kpi: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</Typography>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', my: 0.5 }}>{kpi.value}</Typography>
              <Chip
                label={kpi.change}
                size="small"
                sx={{
                  height: 22, fontSize: '0.72rem', fontWeight: 700,
                  bgcolor: kpi.up ? 'rgba(46,125,50,0.08)' : 'rgba(211,47,47,0.08)',
                  color: kpi.up ? '#2e7d32' : '#d32f2f',
                }}
              />
            </Paper>
          ))}
        </Box>
      )}

      {/* Revenue Chart (simplified bar representation) */}
      {data.revenue_chart && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>{data.revenue_chart.title}</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {data.revenue_chart.periods?.map((p: string, i: number) => (
                <Chip key={i} label={p} size="small" variant={p === data.revenue_chart.default_period ? 'filled' : 'outlined'}
                  sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, ...(p === data.revenue_chart.default_period ? { bgcolor: primaryColor, color: '#fff' } : { borderColor: '#ddd' }) }}
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 120, px: 1 }}>
            {data.revenue_chart.data?.map((val: number, i: number) => {
              const max = Math.max(...data.revenue_chart.data);
              const height = max > 0 ? (val / max) * 100 : 0;
              return (
                <Tooltip key={i} title={`${data.revenue_chart.months?.[i] || ''}: ${val}`} arrow>
                  <Box sx={{ flex: 1, height: `${height}%`, background: `linear-gradient(180deg, ${primaryColor}, #764ba2)`, borderRadius: '4px 4px 0 0', minHeight: 4, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { opacity: 0.8 } }} />
                </Tooltip>
              );
            })}
          </Box>
          {data.revenue_chart.months && (
            <Box sx={{ display: 'flex', gap: '6px', px: 1, mt: 0.5 }}>
              {data.revenue_chart.months.map((m: string, i: number) => (
                <Typography key={i} sx={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#bbb' }}>{m.slice(0, 3)}</Typography>
              ))}
            </Box>
          )}
        </Paper>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {/* Recent Users */}
        {Array.isArray(data.recent_users) && (
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem' }}>Recent Users</Typography>
            {data.recent_users.map((u: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 'none' } }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>{u.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#bbb' }}>{u.email}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={u.plan} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, mb: 0.25 }} />
                  <Typography variant="caption" sx={{ display: 'block', color: u.status === 'Active' ? '#2e7d32' : u.status === 'Trial' ? '#ed6c02' : '#d32f2f', fontWeight: 600 }}>
                    {u.status} · {u.mrr}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* System Health */}
          {Array.isArray(data.system_health) && (
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem' }}>System Health</Typography>
              {data.system_health.map((s: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#555' }}>{s.label}</Typography>
                  <Chip
                    icon={<CircleIcon sx={{ fontSize: '10px !important', color: s.status === 'Operational' ? '#4caf50 !important' : '#ff9800 !important' }} />}
                    label={s.status}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: s.status === 'Operational' ? '#e8f5e9' : '#fff3e0', color: s.status === 'Operational' ? '#2e7d32' : '#e65100' }}
                  />
                </Box>
              ))}
            </Paper>
          )}

          {/* Recent Activity */}
          {Array.isArray(data.recent_activity) && (
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #eee', borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem' }}>Recent Activity</Typography>
              {data.recent_activity.map((a: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f8f8f8', '&:last-child': { borderBottom: 'none' } }}>
                  <Typography variant="body2" sx={{ color: '#555', fontSize: '0.82rem' }}>{a.text}</Typography>
                  <Typography variant="caption" sx={{ color: '#bbb', whiteSpace: 'nowrap', ml: 1 }}>{a.time}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Generic fallback renderer
function RenderGenericPage({ data }: { data: any }) {
  return (
    <Box sx={{ p: 4 }}>
      {data.title && <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 1 }}>{data.title}</Typography>}
      {data.heading && <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>{data.heading}</Typography>}
      {data.description && <Typography sx={{ color: '#555', lineHeight: 1.6, mb: 2 }}>{data.description}</Typography>}
      {data.message && (
        <Paper elevation={0} sx={{ p: 2.5, borderLeft: '4px solid #667eea', bgcolor: '#f8f9ff' }}>
          <Typography sx={{ color: '#333' }}>{data.message}</Typography>
        </Paper>
      )}
    </Box>
  );
}

// Route the page type to the correct renderer
function RenderPage({ data, primaryColor }: { data: any; primaryColor: string }) {
  const pageType = data.page_type;
  switch (pageType) {
    case 'index': return <RenderIndexPage data={data} primaryColor={primaryColor} />;
    case 'thanks': return <RenderThanksPage data={data} primaryColor={primaryColor} />;
    case 'members': return <RenderMembersPage data={data} primaryColor={primaryColor} />;
    case 'checkout': return <RenderCheckoutPage data={data} primaryColor={primaryColor} />;
    case 'admin': return <RenderAdminPage data={data} primaryColor={primaryColor} />;
    default:
      // Try to auto-detect
      if (data.features_section || data.nav) return <RenderIndexPage data={data} primaryColor={primaryColor} />;
      if (data.order_confirmation || data.next_steps) return <RenderThanksPage data={data} primaryColor={primaryColor} />;
      if (data.welcome || data.courses) return <RenderMembersPage data={data} primaryColor={primaryColor} />;
      if (data.plans || data.payment_form) return <RenderCheckoutPage data={data} primaryColor={primaryColor} />;
      if (data.kpis || data.revenue_chart) return <RenderAdminPage data={data} primaryColor={primaryColor} />;
      // Handle legacy renderer keys
      if (data.hero || data.sections || data.pricing) return <RenderIndexPage data={data} primaryColor={primaryColor} />;
      return <RenderGenericPage data={data} />;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
      const home = plist.find(p => p.page_type === 'index') || plist[0];
      if (home) navigateTo(home, plist, app);
    } catch { setError('Failed to load pages'); }
    finally { setLoading(false); }
  }, []);

  const navigateTo = (page: Page, _pageList?: Page[], app?: App) => {
    const theApp = app || selectedApp;
    const slug = theApp?.slug || 'app';
    const path = page.page_type === 'index' ? `/${slug}` : `/${slug}/${page.page_type}`;
    setActivePage(page);
    setAddressBar(`https://${slug}.example.com${page.page_type === 'index' ? '/' : '/' + page.page_type}`);
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
    const pageType = path.split('/')[2] || 'index';
    const page = pages.find(p => p.page_type === pageType);
    if (page) {
      setActivePage(page);
      setAddressBar(`https://${slug}.example.com${pageType === 'index' ? '/' : '/' + pageType}`);
    }
  };

  const goForward = () => {
    if (!canGoForward) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    const path = history[newIdx];
    const slug = path.split('/')[1];
    const pageType = path.split('/')[2] || 'index';
    const page = pages.find(p => p.page_type === pageType);
    if (page) {
      setActivePage(page);
      setAddressBar(`https://${slug}.example.com${pageType === 'index' ? '/' : '/' + pageType}`);
    }
  };

  const primaryColor = selectedApp?.primary_color || '#667eea';

  // ─── No app selected ──────────────────────────────────────────────────────
  if (!selectedApp) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>App Preview</Typography>
          <Typography sx={{ color: '#888' }}>Test your apps in a full browser simulation. Navigate between pages and verify functionality.</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : apps.length === 0 ? (
          <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #eee' }}>
            <Typography sx={{ color: '#999', mb: 1 }}>No projects found</Typography>
            <Typography variant="body2" sx={{ color: '#bbb' }}>Create a project first to preview it here.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {apps.map(app => (
              <Paper
                key={app.id}
                elevation={0}
                onClick={() => handleSelectApp(app)}
                sx={{
                  p: 3, border: '1px solid #eee', borderRadius: 3, cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: app.primary_color || '#667eea', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, background: `linear-gradient(135deg, ${app.primary_color || '#667eea'}, #764ba2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                    {app.name.charAt(0)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1a1a2e' }}>{app.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#bbb' }}>{app.slug}.example.com</Typography>
                  </Box>
                </Box>
                {app.description && <Typography variant="body2" sx={{ color: '#888', lineHeight: 1.5 }}>{app.description}</Typography>}
                <Button size="small" sx={{ mt: 1.5, fontWeight: 700, color: app.primary_color || '#667eea' }}>
                  Open Preview →
                </Button>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // ─── App Preview Browser ──────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', bgcolor: '#e8eaed' }}>
      {/* Top Bar — back to selector + app name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
        <Button size="small" startIcon={<BackIcon />} onClick={() => { setSelectedApp(null); setPages([]); setActivePage(null); }} sx={{ color: '#888', fontWeight: 600 }}>
          All Apps
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: 1.5, background: `linear-gradient(135deg, ${primaryColor}, #764ba2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>
            {selectedApp.name.charAt(0)}
          </Box>
          <Typography sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{selectedApp.name}</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        {/* Page navigation tabs */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {pages.map(page => (
            <Chip
              key={page.id}
              icon={getPageIcon(page.page_type)}
              label={page.title}
              size="small"
              onClick={() => navigateTo(page)}
              sx={{
                fontWeight: activePage?.id === page.id ? 700 : 500,
                fontSize: '0.78rem',
                bgcolor: activePage?.id === page.id ? `${primaryColor}15` : 'transparent',
                color: activePage?.id === page.id ? primaryColor : '#888',
                border: activePage?.id === page.id ? `1px solid ${primaryColor}40` : '1px solid transparent',
                cursor: 'pointer',
                '&:hover': { bgcolor: `${primaryColor}08` },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Browser Chrome */}
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, pt: 2, flex: 1, overflow: 'hidden' }}>
        <Box sx={{ width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Browser window */}
          <Box sx={{ bgcolor: '#fff', borderRadius: '12px 12px 0 0', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Title bar */}
            <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #d0d0d0', borderRadius: '12px 12px 0 0' }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27c93f' }} />
              </Box>
              {/* Nav buttons */}
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <IconButton size="small" disabled={!canGoBack} onClick={goBack} sx={{ p: 0.5 }}>
                  <BackIcon sx={{ fontSize: 16, color: canGoBack ? '#555' : '#ccc' }} />
                </IconButton>
                <IconButton size="small" disabled={!canGoForward} onClick={goForward} sx={{ p: 0.5 }}>
                  <ForwardIcon sx={{ fontSize: 16, color: canGoForward ? '#555' : '#ccc' }} />
                </IconButton>
                <IconButton size="small" onClick={() => activePage && navigateTo(activePage)} sx={{ p: 0.5 }}>
                  <RefreshIcon sx={{ fontSize: 16, color: '#555' }} />
                </IconButton>
              </Box>
              {/* Address bar */}
              <Box sx={{ flex: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #ddd', px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                <Typography sx={{ fontSize: '0.8rem', color: '#555', fontFamily: 'monospace', flex: 1 }}>{addressBar}</Typography>
              </Box>
            </Box>

            {/* Page content */}
            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : activePage?.content_json ? (
                <RenderPage data={activePage.content_json} primaryColor={primaryColor} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
                  <Typography sx={{ color: '#bbb', fontSize: '1.2rem', mb: 1 }}>No content</Typography>
                  <Typography variant="body2" sx={{ color: '#ddd' }}>This page has no content_json configured.</Typography>
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
export { RenderPage, RenderIndexPage, RenderThanksPage, RenderMembersPage, RenderCheckoutPage, RenderAdminPage, RenderGenericPage };
