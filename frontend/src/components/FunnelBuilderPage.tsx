import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Box, Typography, Paper, Button, IconButton, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  CircularProgress, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  ShoppingCart as CheckoutIcon,
  CardGiftcard as UpsellIcon,
  PersonAdd as RegisterIcon,
  ThumbUp as ThanksIcon,
  Article as PageIcon,
  ArrowForward as ArrowIcon,
  ContentCopy as DuplicateIcon,
  AccountTree as FunnelIcon,
  AutoFixHigh as AIEditIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Close as CloseIcon,
  Visibility as PreviewIcon,
  PlayArrow as PlayIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  CheckCircle as CheckIcon,
  Storefront as PricingIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { LinearProgress } from '@mui/material';

// ——— Types ————————————————————————————————————————————————

interface FunnelStep {
  id: string;
  pageType: string;
  label: string;
  pageId?: number;
  config?: Record<string, any>;
}

interface FunnelTier {
  id: string;
  name: string;
  color: string;
  steps: FunnelStep[];
}

interface Funnel {
  id: number;
  app_id: number;
  name: string;
  description?: string;
  tiers: FunnelTier[];
  created_at: string;
  updated_at: string;
}

interface AppInfo {
  id: number;
  name: string;
  slug: string;
  primary_color: string;
}

// ——— Step type config ——————————————————————————————————————

const STEP_TYPES = [
  { type: 'checkout', label: 'Checkout', icon: <CheckoutIcon />, color: '#667eea', description: 'Payment / pricing page' },
  { type: 'upsell', label: 'Upsell', icon: <UpsellIcon />, color: '#e67e22', description: 'One-time offer after purchase' },
  { type: 'register', label: 'Register', icon: <RegisterIcon />, color: '#27ae60', description: 'Account creation page' },
  { type: 'thankyou', label: 'Thank You', icon: <ThanksIcon />, color: '#3498db', description: 'Confirmation / welcome page' },
  { type: 'custom', label: 'Custom Page', icon: <PageIcon />, color: '#9b59b6', description: 'Any custom page' },
];

const TIER_COLORS = ['#27ae60', '#667eea', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'];

function getStepIcon(pageType: string) {
  const st = STEP_TYPES.find(s => s.type === pageType);
  return st?.icon || <PageIcon />;
}

function getStepColor(pageType: string) {
  const st = STEP_TYPES.find(s => s.type === pageType);
  return st?.color || '#999';
}

function generateId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ——— Auto-generate HTML preview from structured page JSON ————————————

function generateHtmlFromPageJson(cj: Record<string, any>): string | null {
  try {
  const pageType = cj.page_type || cj.pageType;

  // If it has componentCode but no htmlPreview, build a simple rendered version
  if (cj.componentCode && !cj.htmlPreview) {
    return null; // Can't render React component code without build step
  }

  const baseStyles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #fafbfc; }
      .container { max-width: 720px; margin: 0 auto; padding: 40px 24px; }
      .hero { text-align: center; margin-bottom: 40px; }
      .hero h1 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; color: #1a1a2e; }
      .hero p { font-size: 1.05rem; color: #666; line-height: 1.6; }
      .card { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); margin-bottom: 24px; }
      .btn { display: inline-block; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 1rem; border: none; cursor: pointer; text-align: center; width: 100%; transition: all .15s; }
      .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
      .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(102,126,234,0.3); }
      .form-group { margin-bottom: 16px; }
      .form-group label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 6px; color: #333; }
      .form-group input { width: 100%; padding: 12px 16px; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 0.95rem; outline: none; transition: border-color .15s; }
      .form-group input:focus { border-color: #667eea; }
      .benefits { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 32px; }
      .benefit { text-align: center; padding: 20px 16px; border-radius: 12px; background: #f8f9ff; }
      .benefit-icon { font-size: 1.8rem; margin-bottom: 8px; }
      .benefit h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 4px; }
      .benefit p { font-size: 0.78rem; color: #888; line-height: 1.4; }
      .trust { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }
      .trust-badge { padding: 6px 14px; background: #f0f0f0; border-radius: 20px; font-size: 0.72rem; font-weight: 600; color: #666; }
      .social-row { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
      .social-btn { padding: 10px 24px; border-radius: 10px; border: 1.5px solid #e0e0e0; background: #fff; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
      .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 32px 0; }
      .plan { padding: 28px 20px; border-radius: 16px; border: 1.5px solid #e8e8e8; background: #fff; text-align: center; position: relative; }
      .plan.popular { border-color: #667eea; box-shadow: 0 4px 20px rgba(102,126,234,0.15); }
      .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 4px 16px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; }
      .plan h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; }
      .plan .price { font-size: 2rem; font-weight: 800; color: #667eea; }
      .plan .price span { font-size: 0.85rem; color: #999; font-weight: 500; }
      .plan .features { list-style: none; padding: 0; margin: 16px 0; text-align: left; }
      .plan .features li { padding: 6px 0; font-size: 0.82rem; color: #555; }
      .plan .features li::before { content: '✓ '; color: #27ae60; font-weight: 700; }
      .order-box { background: #f8f9ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      .order-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem; }
      .order-row.total { border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 1rem; }
      .next-steps { margin-top: 32px; }
      .next-step { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
      .step-num { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
      .link { color: #667eea; text-decoration: none; font-weight: 600; }
    </style>
  `;

  // ——— Register page ———
  if (pageType === 'register') {
    const hero = cj.hero || {};
    const form = cj.form || {};
    const benefits = cj.benefits || [];
    const socialLogin = cj.social_login || {};
    const trustBadges = cj.trust_badges || [];
    const loginCta = cj.login_cta || {};

    const fieldsHtml = (form.fields || []).map((f: any) =>
      `<div class="form-group"><label>${f.label}${f.required ? ' *' : ''}</label><input type="${f.type || 'text'}" placeholder="${f.placeholder || ''}"></div>`
    ).join('');

    const benefitsHtml = benefits.map((b: any) =>
      `<div class="benefit"><div class="benefit-icon">⚡</div><h3>${b.title}</h3><p>${b.description}</p></div>`
    ).join('');

    const socialHtml = (socialLogin.providers || []).map((p: any) =>
      `<button class="social-btn">${p.name}</button>`
    ).join('');

    const trustHtml = trustBadges.map((b: string) =>
      `<span class="trust-badge">🔒 ${b}</span>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero">
          <h1>${hero.headline || 'Create Your Account'}</h1>
          <p>${hero.subheading || ''}</p>
        </div>
        <div class="card">
          ${fieldsHtml}
          <button class="btn btn-primary" style="margin-top:8px">${form.submit_text || 'Create Account'}</button>
          ${form.terms ? `<p style="text-align:center;font-size:0.75rem;color:#999;margin-top:12px">${form.terms.text} <a class="link">${form.terms.link_text}</a></p>` : ''}
          ${socialHtml ? `<div style="text-align:center;margin-top:20px;color:#bbb;font-size:0.82rem">${socialLogin.headline || 'Or sign up with'}</div><div class="social-row">${socialHtml}</div>` : ''}
        </div>
        ${benefitsHtml ? `<div class="benefits">${benefitsHtml}</div>` : ''}
        ${trustHtml ? `<div class="trust">${trustHtml}</div>` : ''}
        ${loginCta.text ? `<p style="text-align:center;margin-top:24px;font-size:0.85rem;color:#888">${loginCta.text} <a class="link">${loginCta.link_text}</a></p>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Checkout / pricing page ———
  if (pageType === 'checkout') {
    const plans = cj.plans || [];
    const paymentForm = cj.payment_form || {};

    const plansHtml = plans.map((p: any) =>
      `<div class="plan ${p.popular ? 'popular' : ''}">
        ${p.popular ? '<div class="plan-badge">Most Popular</div>' : ''}
        <h3>${p.name}</h3>
        <div class="price">${p.price}<span>${p.period || ''}</span></div>
        <p style="font-size:0.8rem;color:#888;margin:8px 0">${p.description || ''}</p>
        <ul class="features">${(p.features || []).map((f: any) => `<li>${typeof f === 'string' ? f : f.text || f.name || ''}</li>`).join('')}</ul>
        <button class="btn ${p.popular ? 'btn-primary' : ''}" style="${!p.popular ? 'background:#f0f0f0;color:#333' : ''}">${p.cta || 'Select'}</button>
      </div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero">
          <h1>${cj.headline || 'Choose Your Plan'}</h1>
          <p>${cj.subheading || ''}</p>
        </div>
        <div class="plan-grid">${plansHtml}</div>
        ${paymentForm.trust_badges ? `<div class="trust">${(paymentForm.trust_badges || []).map((b: string) => `<span class="trust-badge">🔒 ${b}</span>`).join('')}</div>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Thank you / confirmation page ———
  if (pageType === 'thanks' || pageType === 'thankyou') {
    const hero = cj.hero || {};
    const headline = typeof hero.headline === 'string' ? hero.headline : hero.headline?.text || 'Thank You!';
    const order = cj.order_confirmation || {};
    const nextSteps = cj.next_steps || [];
    const email = cj.email_notification || {};

    const orderHtml = order.plan ? `
      <div class="order-box">
        <div class="order-row"><span>Plan</span><span>${order.plan}</span></div>
        <div class="order-row"><span>Billing</span><span>${order.billing || ''}</span></div>
        <div class="order-row total"><span>Total</span><span>${order.amount || ''}</span></div>
        ${order.confirmation_number ? `<p style="text-align:center;font-size:0.75rem;color:#999;margin-top:8px">Confirmation: ${order.confirmation_number}</p>` : ''}
      </div>` : '';

    const stepsHtml = nextSteps.map((s: any, i: number) =>
      `<div class="next-step"><div class="step-num">${i + 1}</div><div><strong style="font-size:0.9rem">${s.action || s.title || ''}</strong><p style="font-size:0.8rem;color:#888;margin-top:4px">${s.description || ''}</p></div></div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero">
          <h1>${headline}</h1>
          <p>${hero.subheading || ''}</p>
        </div>
        ${email.message ? `<div class="card" style="text-align:center;background:#f0fdf4;border-color:#bbf7d0"><p style="color:#16a34a;font-weight:600">✉️ ${email.message}</p>${email.details ? `<p style="font-size:0.8rem;color:#888;margin-top:4px">${email.details}</p>` : ''}</div>` : ''}
        ${orderHtml}
        ${stepsHtml ? `<div class="card"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:16px">Next Steps</h2>${stepsHtml}</div>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Login page ———
  if (pageType === 'login') {
    const hero = cj.hero || {};
    const form = cj.form || {};
    const socialLogin = cj.social_login || {};
    const trustBadges = cj.trust_badges || [];
    const registerCta = cj.register_cta || {};

    const fieldsHtml = (form.fields || []).map((f: any) =>
      `<div class="form-group"><label>${f.label}${f.required ? ' *' : ''}</label><input type="${f.type || 'text'}" placeholder="${f.placeholder || ''}"></div>`
    ).join('');

    const socialHtml = (socialLogin.providers || []).map((p: any) =>
      `<button class="social-btn">${p.name}</button>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${hero.headline || 'Welcome Back'}</h1><p>${hero.subheading || ''}</p></div>
        <div class="card">
          ${fieldsHtml}
          <button class="btn btn-primary" style="margin-top:8px">${form.submit_text || 'Log In'}</button>
          ${form.forgot_password ? `<p style="text-align:center;margin-top:12px"><a class="link" style="font-size:0.82rem">${form.forgot_password.link_text || 'Forgot password?'}</a></p>` : ''}
          ${socialHtml ? `<div style="text-align:center;margin-top:20px;color:#bbb;font-size:0.82rem">${socialLogin.headline || 'Or log in with'}</div><div class="social-row">${socialHtml}</div>` : ''}
        </div>
        ${trustBadges.length ? `<div class="trust">${trustBadges.map((b: string) => `<span class="trust-badge">🔒 ${b}</span>`).join('')}</div>` : ''}
        ${registerCta.text ? `<p style="text-align:center;margin-top:24px;font-size:0.85rem;color:#888">${registerCta.text} <a class="link">${registerCta.link_text || 'Sign up'}</a></p>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Index / home page ———
  if (pageType === 'index') {
    const hero = cj.hero || {};
    const features = cj.features_section || {};
    const stats = cj.stats || {};
    const ctaFooter = cj.cta_footer || {};

    const featuresHtml = (features.features || features.items || []).map((f: any) =>
      `<div class="benefit"><div class="benefit-icon">${f.icon === 'speed' ? '⚡' : f.icon === 'security' ? '🔒' : f.icon === 'analytics' ? '📊' : f.icon === 'automation' ? '🤖' : '✨'}</div><h3>${f.title || f.name}</h3><p>${f.description || ''}</p></div>`
    ).join('');

    const statsHtml = (stats.items || []).map((s: any) =>
      `<div style="text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#667eea">${s.value || s.number}</div><div style="font-size:0.78rem;color:#888">${s.label || s.title}</div></div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero">
          <h1>${hero.headline || 'Welcome'}</h1>
          <p>${hero.subheading || ''}</p>
          ${hero.cta ? `<button class="btn btn-primary" style="width:auto;margin-top:16px;padding:14px 40px">${hero.cta.text || hero.cta}</button>` : ''}
        </div>
        ${featuresHtml ? `<div class="benefits">${featuresHtml}</div>` : ''}
        ${statsHtml ? `<div style="display:flex;gap:40px;justify-content:center;margin:32px 0;flex-wrap:wrap">${statsHtml}</div>` : ''}
        ${ctaFooter.headline ? `<div class="card" style="text-align:center;background:linear-gradient(135deg,#667eea08,#764ba208)"><h2 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">${ctaFooter.headline}</h2><p style="font-size:0.85rem;color:#888;margin-bottom:16px">${ctaFooter.subheading || ''}</p><button class="btn btn-primary" style="width:auto;padding:12px 36px">${ctaFooter.button_text || 'Get Started'}</button></div>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Features page ———
  if (pageType === 'features') {
    const hero = cj.hero || {};
    const categories = cj.feature_categories || [];

    const catsHtml = (Array.isArray(categories) ? categories : []).map((cat: any) => {
      const items = (cat.features || cat.items || []).map((f: any) =>
        `<div class="benefit"><div class="benefit-icon">✨</div><h3>${f.title || f.name}</h3><p>${f.description || ''}</p></div>`
      ).join('');
      return `<div style="margin-bottom:24px"><h2 style="font-size:1rem;font-weight:800;margin-bottom:12px;color:#667eea">${cat.category || cat.name || cat.title || ''}</h2><div class="benefits">${items}</div></div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${hero.headline || 'Features'}</h1><p>${hero.subheading || ''}</p></div>
        ${catsHtml}
      </div>
    </body></html>`;
  }

  // ——— Pricing page ———
  if (pageType === 'pricing') {
    const hero = cj.hero || {};
    const plans = cj.plans || [];

    const plansHtml = plans.map((p: any) =>
      `<div class="plan ${p.popular ? 'popular' : ''}">
        ${p.popular ? '<div class="plan-badge">Most Popular</div>' : ''}
        <h3>${p.name}</h3>
        <div class="price">${p.price}<span>${p.period || ''}</span></div>
        <p style="font-size:0.8rem;color:#888;margin:8px 0">${p.description || ''}</p>
        <ul class="features">${(p.features || []).map((f: any) => `<li>${typeof f === 'string' ? f : f.text || f.name || ''}</li>`).join('')}</ul>
        <button class="btn ${p.popular ? 'btn-primary' : ''}" style="${!p.popular ? 'background:#f0f0f0;color:#333' : ''}">${p.cta || 'Select'}</button>
      </div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${hero.headline || 'Pricing'}</h1><p>${hero.subheading || ''}</p></div>
        <div class="plan-grid">${plansHtml}</div>
      </div>
    </body></html>`;
  }

  // ——— About page ———
  if (pageType === 'about') {
    const hero = cj.hero || {};
    const story = cj.story || {};
    const valuesData = Array.isArray(cj.values) ? cj.values : (cj.values?.items || cj.values?.values || []);
    const teamData = Array.isArray(cj.team) ? cj.team : (cj.team?.members || []);

    const storyText = story.content || story.text || (Array.isArray(story.paragraphs) ? story.paragraphs.join('</p><p style="font-size:0.9rem;line-height:1.7;color:#555;margin-top:12px">') : '');

    const valuesHtml = valuesData.map((v: any) =>
      `<div class="benefit"><div class="benefit-icon">💎</div><h3>${v.title || v.name}</h3><p>${v.description || ''}</p></div>`
    ).join('');

    const teamHtml = teamData.map((m: any) =>
      `<div style="text-align:center"><div style="width:60px;height:60px;border-radius:50%;background:#667eea15;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#667eea">${(m.name || '?')[0]}</div><strong style="font-size:0.85rem">${m.name}</strong><p style="font-size:0.72rem;color:#999">${m.role || m.title || ''}</p></div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${hero.headline || 'About Us'}</h1><p>${hero.subheading || ''}</p></div>
        ${storyText ? `<div class="card"><p style="font-size:0.9rem;line-height:1.7;color:#555">${storyText}</p></div>` : ''}
        ${valuesHtml ? `<h2 style="font-size:1.1rem;font-weight:800;margin:24px 0 12px">Our Values</h2><div class="benefits">${valuesHtml}</div>` : ''}
        ${teamHtml ? `<h2 style="font-size:1.1rem;font-weight:800;margin:24px 0 12px">Our Team</h2><div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">${teamHtml}</div>` : ''}
      </div>
    </body></html>`;
  }

  // ——— Blog page ———
  if (pageType === 'blog-page' || pageType === 'blog') {
    const hero = cj.hero || {};
    const posts = cj.posts || [];
    const featured = cj.featured_post || null;

    const postsHtml = posts.slice(0, 6).map((p: any) =>
      `<div class="card" style="padding:20px"><h3 style="font-size:0.95rem;font-weight:700;margin-bottom:6px">${p.title}</h3><p style="font-size:0.8rem;color:#888;line-height:1.5">${p.excerpt || p.summary || ''}</p><p style="font-size:0.7rem;color:#bbb;margin-top:8px">${p.date || ''} ${p.author ? '· ' + p.author : ''}</p></div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${hero.headline || 'Blog'}</h1><p>${hero.subheading || ''}</p></div>
        ${featured ? `<div class="card" style="border-left:4px solid #667eea"><h2 style="font-size:1.1rem;font-weight:800;margin-bottom:4px">${featured.title || ''}</h2><p style="font-size:0.85rem;color:#888">${featured.excerpt || ''}</p></div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">${postsHtml}</div>
      </div>
    </body></html>`;
  }

  // ——— Generic fallback for pages with a hero ———
  if (cj.hero) {
    const hero = cj.hero || {};
    const headline = typeof hero.headline === 'string' ? hero.headline : hero.headline?.text || 'Page Preview';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyles}</head><body>
      <div class="container">
        <div class="hero"><h1>${headline}</h1><p>${hero.subheading || ''}</p></div>
        <div class="card" style="text-align:center;color:#999"><p>Additional page content would render here.</p></div>
      </div>
    </body></html>`;
  }

  return null;
  } catch {
    return null;
  }
}

// ——— Main component ———————————————————————————————————————

export function FunnelBuilderPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [activeFunnel, setActiveFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  // Dialogs
  const [newFunnelDialog, setNewFunnelDialog] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [addTierDialog, setAddTierDialog] = useState(false);
  const [newTierName, setNewTierName] = useState('');

  // Page picker dialog
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [pagePickerStep, setPagePickerStep] = useState<{ tierId: string; stepId: string } | null>(null);
  const [savedPages, setSavedPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagePreviewOpen, setPagePreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Drag state
  const [dragState, setDragState] = useState<{ tierId: string; stepIdx: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ tierId: string; position: number } | null>(null);

  // Test / simulate funnel state
  const [testTierPicker, setTestTierPicker] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const [testTier, setTestTier] = useState<FunnelTier | null>(null);
  const [testStepIdx, setTestStepIdx] = useState(0);
  const [testPageHtml, setTestPageHtml] = useState<Record<number, string>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testCountdown, setTestCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Delay config dialog
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayDialogStep, setDelayDialogStep] = useState<{ tierId: string; stepId: string } | null>(null);
  const [delayDialogValue, setDelayDialogValue] = useState(0);

  // Pricing preview / customer view state
  const [pricingPreviewOpen, setPricingPreviewOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [planTierMap, setPlanTierMap] = useState<Record<string, string>>({});
  const [pricingHero, setPricingHero] = useState<any>({});
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Clone funnel state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [allFunnelsForClone, setAllFunnelsForClone] = useState<(Funnel & { appName?: string })[]>([]);
  const [selectedCloneFunnelId, setSelectedCloneFunnelId] = useState<number | ''>('');
  const [cloneFunnelName, setCloneFunnelName] = useState('');
  const [loadingClone, setLoadingClone] = useState(false);

  const FUNNELS_API = `${API_BASE_URL}/api/funnels`;

  // ——— Load apps ——————————————————————————————————————————

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/apps`);
        const data = await res.json();
        setApps(data.data || data || []);
        if (data.data?.length > 0 || data?.length > 0) {
          const list = data.data || data;
          setSelectedAppId(list[0].id);
        }
      } catch {
        setSnack({ open: true, msg: 'Failed to load projects', severity: 'error' });
      }
    })();
  }, []);

  // ——— Data fetching ———————————————————————————————————————

  const fetchFunnels = useCallback(async () => {
    if (!selectedAppId) return;
    setLoading(true);
    try {
      const res = await fetch(`${FUNNELS_API}?appId=${selectedAppId}`);
      const data = await res.json();
      setFunnels(data.data || []);
      if (data.data?.length > 0 && !activeFunnel) {
        setActiveFunnel(data.data[0]);
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to load funnels', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedAppId, FUNNELS_API]);

  useEffect(() => {
    if (selectedAppId) {
      fetchFunnels();
    } else {
      setFunnels([]);
      setActiveFunnel(null);
    }
  }, [selectedAppId, fetchFunnels]);

  // ——— CRUD ————————————————————————————————————————————————

  const handleCreateFunnel = async () => {
    if (!selectedAppId || !newFunnelName.trim()) return;
    try {
      const res = await fetch(FUNNELS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedAppId, name: newFunnelName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFunnels(prev => [...prev, data.data]);
        setActiveFunnel(data.data);
        setNewFunnelDialog(false);
        setNewFunnelName('');
        setDirty(false);
        setSnack({ open: true, msg: 'Funnel created', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to create funnel', severity: 'error' });
    }
  };

  // ——— Clone funnel ————————————————————————————————————————

  const openCloneDialog = async () => {
    setCloneDialogOpen(true);
    setSelectedCloneFunnelId('');
    setCloneFunnelName('');
    setLoadingClone(true);
    try {
      const res = await fetch(`${FUNNELS_API}/all/list`);
      const data = await res.json();
      // Filter out funnels belonging to the current app
      const otherAppFunnels = (data.data || []).filter((f: any) => f.app_id !== selectedAppId);
      setAllFunnelsForClone(otherAppFunnels);
    } catch {
      setSnack({ open: true, msg: 'Failed to load funnels for cloning', severity: 'error' });
    } finally {
      setLoadingClone(false);
    }
  };

  const handleCloneFunnel = async () => {
    if (!selectedAppId || !selectedCloneFunnelId) return;
    setLoadingClone(true);
    try {
      const res = await fetch(`${FUNNELS_API}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFunnelId: selectedCloneFunnelId,
          targetAppId: selectedAppId,
          name: cloneFunnelName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFunnels(prev => [...prev, data.data]);
        setActiveFunnel(data.data);
        setCloneDialogOpen(false);
        setDirty(false);
        setSnack({ open: true, msg: 'Funnel cloned! Link your pages to each step.', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to clone funnel', severity: 'error' });
    } finally {
      setLoadingClone(false);
    }
  };

  const handleSave = async () => {
    if (!activeFunnel) return;
    setSaving(true);
    try {
      const res = await fetch(`${FUNNELS_API}/${activeFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeFunnel.name, description: activeFunnel.description, tiers: activeFunnel.tiers }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveFunnel(data.data);
        setFunnels(prev => prev.map(f => f.id === data.data.id ? data.data : f));
        setDirty(false);
        setSnack({ open: true, msg: 'Funnel saved', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to save', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFunnel = async () => {
    if (!activeFunnel) return;
    try {
      await fetch(`${FUNNELS_API}/${activeFunnel.id}`, { method: 'DELETE' });
      setFunnels(prev => prev.filter(f => f.id !== activeFunnel.id));
      setActiveFunnel(null);
      setDirty(false);
      setSnack({ open: true, msg: 'Funnel deleted', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Failed to delete', severity: 'error' });
    }
  };

  // ——— Tier management —————————————————————————————————————

  const addTier = () => {
    if (!activeFunnel || !newTierName.trim()) return;
    const usedColors = new Set(activeFunnel.tiers.map(t => t.color));
    const nextColor = TIER_COLORS.find(c => !usedColors.has(c)) || TIER_COLORS[0];
    const tierId = newTierName.trim().toLowerCase().replace(/\s+/g, '-');
    const newTier: FunnelTier = {
      id: tierId,
      name: newTierName.trim(),
      color: nextColor,
      steps: [{ id: generateId(), pageType: 'register', label: 'Register' }],
    };
    setActiveFunnel({ ...activeFunnel, tiers: [...activeFunnel.tiers, newTier] });
    setDirty(true);
    setAddTierDialog(false);
    setNewTierName('');
  };

  const removeTier = (tierId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({ ...activeFunnel, tiers: activeFunnel.tiers.filter(t => t.id !== tierId) });
    setDirty(true);
  };

  const renameTier = (tierId: string, name: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t => t.id === tierId ? { ...t, name } : t),
    });
    setDirty(true);
  };

  // ——— Step management —————————————————————————————————————

  const addStep = (tierId: string, pageType: string) => {
    if (!activeFunnel) return;
    const st = STEP_TYPES.find(s => s.type === pageType);
    const newStep: FunnelStep = {
      id: generateId(),
      pageType,
      label: st?.label || 'Page',
    };
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId ? { ...t, steps: [...t.steps, newStep] } : t
      ),
    });
    setDirty(true);
  };

  const removeStep = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId ? { ...t, steps: t.steps.filter(s => s.id !== stepId) } : t
      ),
    });
    setDirty(true);
  };

  const updateStepLabel = (tierId: string, stepId: string, label: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId
          ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, label } : s) }
          : t
      ),
    });
    setDirty(true);
  };

  const duplicateStep = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t => {
        if (t.id !== tierId) return t;
        const idx = t.steps.findIndex(s => s.id === stepId);
        if (idx === -1) return t;
        const clone = { ...t.steps[idx], id: generateId(), label: `${t.steps[idx].label} (copy)` };
        const newSteps = [...t.steps];
        newSteps.splice(idx + 1, 0, clone);
        return { ...t, steps: newSteps };
      }),
    });
    setDirty(true);
  };

  // ——— Drag and drop ———————————————————————————————————————

  const handleDragStart = (tierId: string, stepIdx: number) => {
    setDragState({ tierId, stepIdx });
  };

  const handleDragOver = (e: React.DragEvent, tierId: string, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ tierId, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetTierId: string, targetPosition: number) => {
    e.preventDefault();
    if (!dragState || !activeFunnel) {
      setDragState(null);
      setDropTarget(null);
      return;
    }

    const { tierId: srcTierId, stepIdx: srcIdx } = dragState;

    setActiveFunnel(prev => {
      if (!prev) return prev;
      const tiers = prev.tiers.map(t => ({ ...t, steps: [...t.steps] }));

      const srcTier = tiers.find(t => t.id === srcTierId);
      const dstTier = tiers.find(t => t.id === targetTierId);
      if (!srcTier || !dstTier) return prev;

      const [movedStep] = srcTier.steps.splice(srcIdx, 1);

      // Adjust target position if same tier and source was before target
      let insertAt = targetPosition;
      if (srcTierId === targetTierId && srcIdx < targetPosition) {
        insertAt = Math.max(0, targetPosition - 1);
      }

      dstTier.steps.splice(insertAt, 0, movedStep);

      return { ...prev, tiers };
    });

    setDirty(true);
    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  // Palette drag (new step from palette)
  const handlePaletteDragStart = (e: React.DragEvent, pageType: string) => {
    e.dataTransfer.setData('application/funnel-step-type', pageType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePaletteDrop = (e: React.DragEvent, tierId: string, position: number) => {
    const pageType = e.dataTransfer.getData('application/funnel-step-type');
    if (pageType) {
      e.preventDefault();
      if (!activeFunnel) return;
      const st = STEP_TYPES.find(s => s.type === pageType);
      const newStep: FunnelStep = { id: generateId(), pageType, label: st?.label || 'Page' };
      setActiveFunnel({
        ...activeFunnel,
        tiers: activeFunnel.tiers.map(t => {
          if (t.id !== tierId) return t;
          const steps = [...t.steps];
          steps.splice(position, 0, newStep);
          return { ...t, steps };
        }),
      });
      setDirty(true);
      setDropTarget(null);
      return;
    }

    // Otherwise it's a move within tiers
    handleDrop(e, tierId, position);
  };

  // ——— Page picker ————————————————————————————————————————

  const openPagePicker = async (tierId: string, stepId: string) => {
    setPagePickerStep({ tierId, stepId });
    setPagePickerOpen(true);
    setLoadingPages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages?app_id=${selectedAppId}`);
      const data = await res.json();
      setSavedPages(data.data || []);
    } catch {
      setSnack({ open: true, msg: 'Failed to load pages', severity: 'error' });
    } finally {
      setLoadingPages(false);
    }
  };

  const assignPageToStep = (pageId: number, pageTitle: string) => {
    if (!activeFunnel || !pagePickerStep) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === pagePickerStep.tierId
          ? {
              ...t,
              steps: t.steps.map(s =>
                s.id === pagePickerStep.stepId
                  ? { ...s, pageId, config: { ...s.config, pageTitle } }
                  : s
              ),
            }
          : t
      ),
    });
    setDirty(true);
    setPagePickerOpen(false);
    setPagePickerStep(null);
    setSnack({ open: true, msg: `Linked "${pageTitle}" to step`, severity: 'success' });
  };

  const unlinkPage = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId
          ? {
              ...t,
              steps: t.steps.map(s =>
                s.id === stepId
                  ? { ...s, pageId: undefined, config: { ...s.config, pageTitle: undefined } }
                  : s
              ),
            }
          : t
      ),
    });
    setDirty(true);
    setSnack({ open: true, msg: 'Page unlinked from step', severity: 'info' });
  };

  // ——— Pricing preview / customer flow ——————————————————————

  const openPricingPreview = async () => {
    if (!activeFunnel || !selectedAppId) return;
    setLoadingPricing(true);
    setPricingPreviewOpen(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/pages?app_id=${selectedAppId}`);
      const data = await res.json();
      const pages = data.data || [];
      const pricingPage = pages.find((p: any) => p.page_type === 'pricing' || p.page_type === 'checkout');
      if (pricingPage?.content_json) {
        const cj = pricingPage.content_json;
        setPricingPlans(cj.plans || []);
        setPricingHero(cj.hero || { headline: cj.headline || 'Choose Your Plan', subheading: cj.subheading || '' });
      } else {
        // No pricing page — build plans from funnel tiers
        setPricingPlans(activeFunnel.tiers.map(t => ({ name: t.name, price: '', cta: 'Get Started', _tierId: t.id })));
        setPricingHero({ headline: 'Choose Your Plan', subheading: 'Select the tier that fits your needs' });
      }

      // Auto-map plans to tiers by name match
      const autoMap: Record<string, string> = {};
      const tiers = activeFunnel.tiers;
      if (pricingPage?.content_json?.plans) {
        for (const plan of pricingPage.content_json.plans) {
          const planNameLower = (plan.name || '').toLowerCase().trim();
          // Try exact match first
          const exact = tiers.find(t => t.name.toLowerCase().trim() === planNameLower);
          if (exact) {
            autoMap[plan.name] = exact.id;
            continue;
          }
          // Try partial match (plan name contains tier name or vice versa)
          const partial = tiers.find(t =>
            planNameLower.includes(t.name.toLowerCase().trim()) ||
            t.name.toLowerCase().trim().includes(planNameLower)
          );
          if (partial) {
            autoMap[plan.name] = partial.id;
          }
        }
      }
      setPlanTierMap(autoMap);
    } catch {
      setSnack({ open: true, msg: 'Failed to load pricing page', severity: 'error' });
    } finally {
      setLoadingPricing(false);
    }
  };

  const launchFunnelFromPlan = (planName: string) => {
    const tierId = planTierMap[planName];
    if (!tierId || !activeFunnel) {
      setSnack({ open: true, msg: `No funnel tier linked to "${planName}" — use the dropdown to map it`, severity: 'info' });
      return;
    }
    const tier = activeFunnel.tiers.find(t => t.id === tierId);
    if (!tier || tier.steps.length === 0) {
      setSnack({ open: true, msg: `Tier "${tier?.name || tierId}" has no steps yet`, severity: 'info' });
      return;
    }
    setPricingPreviewOpen(false);
    startTestFunnel(tier);
  };

  // ——— Test / simulate funnel ——————————————————————————————

  const startTestFunnel = async (tier: FunnelTier) => {
    setTestTierPicker(false);
    setTestTier(tier);
    setTestStepIdx(0);
    setTestActive(true);
    setTestLoading(true);

    // Pre-fetch HTML previews for all linked pages in this tier
    const pageIds = tier.steps.filter(s => s.pageId).map(s => s.pageId!);
    const uniqueIds = [...new Set(pageIds)];
    const htmlMap: Record<number, string> = {};

    try {
      const res = await fetch(`${API_BASE_URL}/api/pages?app_id=${selectedAppId}`);
      const data = await res.json();
      const pages = data.data || [];
      for (const pid of uniqueIds) {
        const pg = pages.find((p: any) => p.id === pid);
        if (pg?.content_json?.htmlPreview) {
          htmlMap[pid] = pg.content_json.htmlPreview;
        } else if (pg?.content_json) {
          // Auto-generate HTML from structured page JSON
          const generated = generateHtmlFromPageJson(pg.content_json);
          if (generated) htmlMap[pid] = generated;
        }
      }
    } catch {
      // Pages may fail to load — we'll show placeholder
    }

    setTestPageHtml(htmlMap);
    setTestLoading(false);
  };

  const handleTestFunnel = () => {
    if (!activeFunnel) return;
    if (activeFunnel.tiers.length === 0) {
      setSnack({ open: true, msg: 'Add at least one tier first', severity: 'info' });
      return;
    }
    if (activeFunnel.tiers.length === 1) {
      startTestFunnel(activeFunnel.tiers[0]);
    } else {
      setTestTierPicker(true);
    }
  };

  // Get auto-advance delay for a step (from config, or smart default)
  const getStepDelay = (step: FunnelStep): number => {
    if (step.config?.autoAdvance !== undefined) return step.config.autoAdvance;
    // Smart defaults: thanks pages auto-advance after 5s
    if (step.pageType === 'thankyou' || step.pageType === 'thanks') return 5;
    return 0; // manual by default
  };

  // Auto-advance effect: runs countdown when a step has a delay
  useEffect(() => {
    // Clear any existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTestCountdown(0);

    if (!testActive || !testTier || testLoading) return;
    const step = testTier.steps[testStepIdx];
    if (!step) return;
    const delay = getStepDelay(step);
    if (delay <= 0) return;
    const isLast = testStepIdx === testTier.steps.length - 1;
    if (isLast) return; // Don't auto-advance on last step

    setTestCountdown(delay);
    countdownRef.current = setInterval(() => {
      setTestCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          setTestStepIdx(i => i + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [testActive, testTier, testStepIdx, testLoading]);

  // Set delay on a step
  const setStepDelay = (tierId: string, stepId: string, seconds: number) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId
          ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, config: { ...s.config, autoAdvance: seconds } } : s) }
          : t
      ),
    });
    setDirty(true);
  };

  const openDelayDialog = (tierId: string, stepId: string) => {
    const tier = activeFunnel?.tiers.find(t => t.id === tierId);
    const step = tier?.steps.find(s => s.id === stepId);
    if (!step) return;
    setDelayDialogStep({ tierId, stepId });
    setDelayDialogValue(getStepDelay(step));
    setDelayDialogOpen(true);
  };

  const saveDelay = () => {
    if (delayDialogStep) {
      setStepDelay(delayDialogStep.tierId, delayDialogStep.stepId, delayDialogValue);
      setSnack({ open: true, msg: delayDialogValue > 0 ? `Auto-advance set to ${delayDialogValue}s` : 'Auto-advance disabled', severity: 'success' });
    }
    setDelayDialogOpen(false);
    setDelayDialogStep(null);
  };

  const skipCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTestCountdown(0);
    if (testTier && testStepIdx < testTier.steps.length - 1) {
      setTestStepIdx(i => i + 1);
    }
  };

  const pauseCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTestCountdown(0); // stops the countdown display
  };

  const closeTest = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTestCountdown(0);
    setTestActive(false);
    setTestTier(null);
    setTestStepIdx(0);
    setTestPageHtml({});
  };

  // ——— Render ——————————————————————————————————————————————

  if (!selectedAppId) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <FunnelIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#999' }}>Select a project first</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#bbb', mt: 0.5 }}>Choose a project to build membership funnels for</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress size={32} />
        <Typography sx={{ mt: 1, color: '#999' }}>Loading funnels...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ——— Header ——————————————————————————————— */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FunnelIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Funnel Builder</Typography>
          </Box>

          {/* Project selector */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedAppId}
              label="Project"
              onChange={(e) => { setSelectedAppId(Number(e.target.value)); setActiveFunnel(null); setDirty(false); }}
              sx={{ borderRadius: 2 }}
            >
              {apps.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Funnel selector */}
          {funnels.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Funnel</InputLabel>
              <Select
                value={activeFunnel?.id || ''}
                label="Funnel"
                onChange={(e) => {
                  const f = funnels.find(f => f.id === Number(e.target.value));
                  if (f) { setActiveFunnel(f); setDirty(false); }
                }}
                sx={{ borderRadius: 2 }}
              >
                {funnels.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {dirty && activeFunnel && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {saving ? 'Saving...' : 'Save Funnel'}
            </Button>
          )}
          {activeFunnel && activeFunnel.tiers.some(t => t.steps.length > 0) && (
            <Button
              variant="outlined"
              startIcon={<PlayIcon />}
              onClick={handleTestFunnel}
              sx={{
                borderRadius: 2, textTransform: 'none',
                borderColor: '#27ae60', color: '#27ae60',
                '&:hover': { bgcolor: '#27ae6008', borderColor: '#27ae60' },
              }}
            >
              Test Funnel
            </Button>
          )}
          {activeFunnel && activeFunnel.tiers.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<PricingIcon />}
              onClick={openPricingPreview}
              sx={{
                borderRadius: 2, textTransform: 'none',
                borderColor: '#667eea', color: '#667eea',
                '&:hover': { bgcolor: '#667eea08', borderColor: '#667eea' },
              }}
            >
              Preview as Customer
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewFunnelDialog(true)}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            New Funnel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DuplicateIcon />}
            onClick={openCloneDialog}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            Clone Funnel
          </Button>
          {activeFunnel && (
            <Tooltip title="Delete funnel">
              <IconButton size="small" onClick={handleDeleteFunnel} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ——— No funnels state ———————————————————— */}
      {funnels.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', boxShadow: 'none', border: '2px dashed rgba(102,126,234,0.2)', borderRadius: 3 }}>
          {/* Warning banner */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            bgcolor: '#fff3e0', border: '1px solid #ffcc02', borderRadius: 2,
            px: 2.5, py: 1, mb: 3,
          }}>
            <Box sx={{ fontSize: '1.2rem' }}>⚠️</Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e65100' }}>
              This project has no funnel — create one or clone from another project to get started
            </Typography>
          </Box>

          <Box>
            <FunnelIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#999', mb: 1 }}>No funnels yet</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#bbb', mb: 3 }}>
              Create a funnel to build visual signup paths for Free, Pro, Gold members and more.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewFunnelDialog(true)}
                sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Create New Funnel
              </Button>
              <Button
                variant="outlined"
                startIcon={<DuplicateIcon />}
                onClick={openCloneDialog}
                sx={{
                  borderRadius: 2, textTransform: 'none',
                  borderColor: '#667eea', color: '#667eea',
                  '&:hover': { bgcolor: '#667eea08', borderColor: '#667eea' },
                }}
              >
                Clone from Another Project
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ——— Funnel canvas ————————————————————————— */}
      {activeFunnel && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Step palette */}
          <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', mb: 1.5, letterSpacing: 0.5 }}>
              Drag steps into lanes below
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {STEP_TYPES.map(st => (
                <Paper
                  key={st.type}
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, st.type)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 2, py: 1, borderRadius: 2,
                    border: `1.5px solid ${st.color}22`,
                    bgcolor: `${st.color}08`,
                    cursor: 'grab',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: `${st.color}15`, borderColor: `${st.color}40`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${st.color}20` },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
                  <Box sx={{ color: st.color, display: 'flex' }}>{st.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{st.label}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{st.description}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>

          {/* Tier lanes */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pb: 2 }}>
            {activeFunnel.tiers.map(tier => (
              <Paper
                key={tier.id}
                sx={{
                  boxShadow: 'none',
                  border: `1.5px solid ${tier.color}30`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                {/* Tier header */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 2.5, py: 1.5,
                  bgcolor: `${tier.color}0a`,
                  borderBottom: `1px solid ${tier.color}15`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tier.color }} />
                    <TextField
                      value={tier.name}
                      onChange={(e) => renameTier(tier.id, e.target.value)}
                      variant="standard"
                      InputProps={{ disableUnderline: true, sx: { fontSize: '1rem', fontWeight: 800, color: '#1a1a2e' } }}
                      sx={{ maxWidth: 160 }}
                    />
                    <Chip
                      label={`${tier.steps.length} step${tier.steps.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ fontSize: '0.68rem', fontWeight: 600, bgcolor: `${tier.color}15`, color: tier.color, height: 22 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* Quick-add buttons */}
                    {STEP_TYPES.slice(0, 3).map(st => (
                      <Tooltip key={st.type} title={`Add ${st.label}`}>
                        <IconButton size="small" onClick={() => addStep(tier.id, st.type)} sx={{ color: st.color, opacity: 0.6, '&:hover': { opacity: 1 } }}>
                          {st.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                    <Tooltip title="Delete tier">
                      <IconButton size="small" onClick={() => removeTier(tier.id)} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Steps lane */}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0, px: 2, py: 2.5,
                    minHeight: 100,
                    overflowX: 'auto',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    if (tier.steps.length === 0) {
                      setDropTarget({ tierId: tier.id, position: 0 });
                    } else {
                      // Allow drop at end of lane when dragging over empty space
                      setDropTarget({ tierId: tier.id, position: tier.steps.length });
                    }
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    if (tier.steps.length === 0) {
                      handlePaletteDrop(e, tier.id, 0);
                    } else {
                      // Drop at end of lane
                      handlePaletteDrop(e, tier.id, tier.steps.length);
                    }
                  }}
                >
                  {tier.steps.length === 0 && (
                    <Box sx={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed rgba(0,0,0,0.08)', borderRadius: 2, py: 3,
                      bgcolor: dropTarget?.tierId === tier.id ? 'rgba(102,126,234,0.05)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#bbb' }}>
                        Drag steps here or use the + buttons above
                      </Typography>
                    </Box>
                  )}

                  {tier.steps.map((step, idx) => (
                    <Box key={step.id} sx={{ display: 'flex', alignItems: 'center' }}>
                      {/* Drop zone before step */}
                      <Box
                        onDragOver={(e) => handleDragOver(e, tier.id, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handlePaletteDrop(e, tier.id, idx)}
                        sx={{
                          width: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? 60 : 16,
                          minHeight: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'width 0.2s ease',
                          borderRadius: 1,
                          bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? 'rgba(102,126,234,0.1)' : 'transparent',
                          border: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? '2px dashed #667eea' : '2px solid transparent',
                        }}
                      />

                      {/* Step card */}
                      <Paper
                        draggable
                        onDragStart={() => handleDragStart(tier.id, idx)}
                        onDragEnd={handleDragEnd}
                        onDoubleClick={() => openPagePicker(tier.id, step.id)}
                        elevation={0}
                        sx={{
                          position: 'relative',
                          width: 140,
                          p: 1.5,
                          border: `1.5px solid ${step.pageId ? getStepColor(step.pageType) : getStepColor(step.pageType) + '25'}`,
                          borderRadius: 2.5,
                          cursor: 'grab',
                          bgcolor: step.pageId ? `${getStepColor(step.pageType)}06` : '#fff',
                          transition: 'all 0.15s ease',
                          opacity: dragState?.tierId === tier.id && dragState?.stepIdx === idx ? 0.4 : 1,
                          '&:hover': {
                            borderColor: getStepColor(step.pageType),
                            boxShadow: `0 4px 16px ${getStepColor(step.pageType)}20`,
                            transform: 'translateY(-2px)',
                          },
                          '&:hover .step-actions': { opacity: 1 },
                          '&:active': { cursor: 'grabbing' },
                        }}
                      >
                        {/* Drag handle */}
                        <Box sx={{ position: 'absolute', top: 4, left: 4, color: '#ddd', cursor: 'grab' }}>
                          <DragIcon sx={{ fontSize: 14 }} />
                        </Box>

                        {/* Step actions (hidden until hover) */}
                        <Box
                          className="step-actions"
                          sx={{
                            position: 'absolute', top: 2, right: 2,
                            display: 'flex', gap: 0,
                            opacity: 0, transition: 'opacity 0.15s ease',
                          }}
                        >
                          <Tooltip title="Edit in AI Editor">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.location.href = '/upsell-editor'; }} sx={{ p: 0.3 }}>
                              <AIEditIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#667eea' } }} />
                            </IconButton>
                          </Tooltip>
                          {step.pageId ? (
                            <Tooltip title="Unlink page">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); unlinkPage(tier.id, step.id); }} sx={{ p: 0.3 }}>
                                <UnlinkIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#e67e22' } }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Link a saved page">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPagePicker(tier.id, step.id); }} sx={{ p: 0.3 }}>
                                <LinkIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#27ae60' } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Duplicate">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateStep(tier.id, step.id); }} sx={{ p: 0.3 }}>
                              <DuplicateIcon sx={{ fontSize: 13, color: '#bbb' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeStep(tier.id, step.id); }} sx={{ p: 0.3 }}>
                              <DeleteIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#e74c3c' } }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Icon */}
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 44, height: 44, borderRadius: 2,
                          bgcolor: `${getStepColor(step.pageType)}12`,
                          color: getStepColor(step.pageType),
                          mx: 'auto', mb: 1, mt: 0.5,
                        }}>
                          {getStepIcon(step.pageType)}
                        </Box>

                        {/* Label */}
                        <TextField
                          value={step.label}
                          onChange={(e) => updateStepLabel(tier.id, step.id, e.target.value)}
                          variant="standard"
                          InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.78rem', fontWeight: 700, color: '#1a1a2e', textAlign: 'center', '& input': { textAlign: 'center' } },
                          }}
                          sx={{ width: '100%' }}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Type chip + linked page indicator */}
                        {step.pageId ? (
                          <Tooltip title={`Linked: ${step.config?.pageTitle || `Page #${step.pageId}`}`}>
                            <Chip
                              icon={<LinkIcon sx={{ fontSize: '0.6rem !important' }} />}
                              label={step.config?.pageTitle ? (step.config.pageTitle.length > 12 ? step.config.pageTitle.slice(0, 12) + '…' : step.config.pageTitle) : `Page #${step.pageId}`}
                              size="small"
                              sx={{
                                display: 'block', mx: 'auto', mt: 0.5,
                                height: 18, fontSize: '0.58rem', fontWeight: 600,
                                bgcolor: '#27ae6018',
                                color: '#27ae60',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => { e.stopPropagation(); openPagePicker(tier.id, step.id); }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label={step.pageType}
                            size="small"
                            sx={{
                              display: 'block', mx: 'auto', mt: 0.5,
                              height: 18, fontSize: '0.6rem', fontWeight: 600,
                              bgcolor: `${getStepColor(step.pageType)}12`,
                              color: getStepColor(step.pageType),
                            }}
                          />
                        )}

                        {/* Double-click hint */}
                        {!step.pageId && (
                          <Typography sx={{
                            fontSize: '0.55rem', color: '#ccc', textAlign: 'center', mt: 0.5,
                            opacity: 0, transition: 'opacity 0.15s',
                            '.MuiPaper-root:hover &': { opacity: 1 },
                          }}>
                            Double-click to link page
                          </Typography>
                        )}

                        {/* Auto-advance delay indicator */}
                        {(() => {
                          const delay = getStepDelay(step);
                          return (
                            <Tooltip title={delay > 0 ? `Auto-advances after ${delay}s — click to change` : 'Click to set auto-advance delay'}>
                              <Chip
                                icon={<TimerIcon sx={{ fontSize: '0.6rem !important' }} />}
                                label={delay > 0 ? `${delay}s` : 'manual'}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); openDelayDialog(tier.id, step.id); }}
                                sx={{
                                  display: 'block', mx: 'auto', mt: 0.5,
                                  height: 16, fontSize: '0.55rem', fontWeight: 600,
                                  bgcolor: delay > 0 ? '#e67e2218' : 'transparent',
                                  color: delay > 0 ? '#e67e22' : '#ccc',
                                  border: delay > 0 ? 'none' : '1px dashed #e0e0e0',
                                  cursor: 'pointer',
                                  opacity: delay > 0 ? 1 : 0,
                                  transition: 'opacity 0.15s',
                                  '.MuiPaper-root:hover &': { opacity: 1 },
                                  '&:hover': { bgcolor: '#e67e2220', color: '#e67e22', opacity: 1 },
                                }}
                              />
                            </Tooltip>
                          );
                        })()}
                      </Paper>

                      {/* Arrow between steps */}
                      {idx < tier.steps.length - 1 && (
                        <Box
                          onDragOver={(e) => handleDragOver(e, tier.id, idx + 1)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handlePaletteDrop(e, tier.id, idx + 1)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            px: 0.5,
                            minWidth: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 60 : 32,
                            transition: 'min-width 0.2s ease',
                            minHeight: 80,
                            bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 'rgba(102,126,234,0.06)' : 'transparent',
                            borderRadius: 1,
                            border: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? '2px dashed #667eea' : '2px solid transparent',
                          }}
                        >
                          <ArrowIcon sx={{ color: `${tier.color}60`, fontSize: 22 }} />
                        </Box>
                      )}

                      {/* Drop zone after last step */}
                      {idx === tier.steps.length - 1 && (
                        <Box
                          onDragOver={(e) => handleDragOver(e, tier.id, idx + 1)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handlePaletteDrop(e, tier.id, idx + 1)}
                          sx={{
                            width: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 80 : 40,
                            minHeight: 80,
                            ml: 0.5,
                            transition: 'width 0.2s ease',
                            borderRadius: 1,
                            bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 'rgba(102,126,234,0.1)' : 'transparent',
                            border: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? '2px dashed #667eea' : '2px solid transparent',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            {/* Add tier button */}
            <Button
              startIcon={<AddIcon />}
              onClick={() => setAddTierDialog(true)}
              sx={{
                alignSelf: 'flex-start',
                borderRadius: 2,
                textTransform: 'none',
                color: '#999',
                border: '1.5px dashed rgba(0,0,0,0.1)',
                px: 3,
                '&:hover': { borderColor: '#667eea', color: '#667eea', bgcolor: 'rgba(102,126,234,0.04)' },
              }}
            >
              Add Tier
            </Button>
          </Box>
        </Box>
      )}

      {/* ——— Create funnel dialog ———————————————— */}
      <Dialog open={newFunnelDialog} onClose={() => setNewFunnelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Funnel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Funnel Name"
            value={newFunnelName}
            onChange={(e) => setNewFunnelName(e.target.value)}
            placeholder="e.g., Main Signup Funnel"
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFunnel(); }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewFunnelDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFunnel}
            disabled={!newFunnelName.trim()}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Clone funnel dialog ———————————————— */}
      <Dialog open={cloneDialogOpen} onClose={() => setCloneDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DuplicateIcon sx={{ color: '#667eea' }} /> Clone Funnel from Another Project
        </DialogTitle>
        <DialogContent>
          {loadingClone && !allFunnelsForClone.length ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} />
              <Typography sx={{ mt: 1, color: '#999', fontSize: '0.85rem' }}>Loading available funnels...</Typography>
            </Box>
          ) : allFunnelsForClone.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#999', fontSize: '0.9rem' }}>No funnels found in other projects to clone.</Typography>
              <Typography sx={{ color: '#bbb', fontSize: '0.8rem', mt: 0.5 }}>Create a funnel in another project first, then come back to clone it.</Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#666', mb: 2 }}>
                Select a funnel to clone into this project. The structure (tiers & steps) will be copied, but page links will need to be re-linked to this project's pages.
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Source Funnel</InputLabel>
                <Select
                  value={selectedCloneFunnelId}
                  label="Source Funnel"
                  onChange={(e) => {
                    const fid = Number(e.target.value);
                    setSelectedCloneFunnelId(fid);
                    const src = allFunnelsForClone.find(f => f.id === fid);
                    if (src) setCloneFunnelName(src.name);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {allFunnelsForClone.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <FunnelIcon sx={{ fontSize: 18, color: '#667eea' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                            {f.appName} · {f.tiers.length} tier{f.tiers.length !== 1 ? 's' : ''} · {f.tiers.reduce((sum, t) => sum + t.steps.length, 0)} steps
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Preview of selected funnel */}
              {selectedCloneFunnelId && (() => {
                const src = allFunnelsForClone.find(f => f.id === selectedCloneFunnelId);
                if (!src) return null;
                return (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafbfc', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', mb: 1, letterSpacing: 0.5 }}>
                      Funnel Preview
                    </Typography>
                    {src.tiers.map(tier => (
                      <Box key={tier.id} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tier.color }} />
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#333' }}>{tier.name}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#999', ml: 0.5 }}>({tier.steps.length} steps)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, pl: 2, flexWrap: 'wrap' }}>
                          {tier.steps.map((step) => (
                            <Chip
                              key={step.id}
                              size="small"
                              label={step.label}
                              sx={{
                                fontSize: '0.68rem', fontWeight: 600,
                                bgcolor: `${getStepColor(step.pageType)}12`,
                                color: getStepColor(step.pageType),
                                border: `1px solid ${getStepColor(step.pageType)}30`,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                );
              })()}

              <TextField
                fullWidth
                label="Name for cloned funnel"
                value={cloneFunnelName}
                onChange={(e) => setCloneFunnelName(e.target.value)}
                placeholder="e.g., Main Signup Funnel"
                sx={{ mb: 1 }}
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCloneDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCloneFunnel}
            disabled={!selectedCloneFunnelId || loadingClone}
            startIcon={loadingClone ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <DuplicateIcon />}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {loadingClone ? 'Cloning...' : 'Clone Funnel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Add tier dialog ————————————————————— */}
      <Dialog open={addTierDialog} onClose={() => setAddTierDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Membership Tier</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Tier Name"
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            placeholder="e.g., Premium, Enterprise"
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') addTier(); }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddTierDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={addTier}
            disabled={!newTierName.trim()}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Page picker dialog ————————————————— */}
      <Dialog
        open={pagePickerOpen}
        onClose={() => { setPagePickerOpen(false); setPagePickerStep(null); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon sx={{ color: '#667eea' }} />
            Link a Saved Page
          </Box>
          <IconButton onClick={() => { setPagePickerOpen(false); setPagePickerStep(null); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingPages ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={28} />
              <Typography sx={{ mt: 1, color: '#999', fontSize: '0.85rem' }}>Loading saved pages...</Typography>
            </Box>
          ) : savedPages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
              <PageIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: '#999', mb: 0.5 }}>No saved pages yet</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#bbb' }}>
                Create pages in the Upsell Editor first, then link them to funnel steps here.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, p: 2.5 }}>
              {savedPages.map(page => {
                const cj = page.content_json || {};
                let previewHtmlSrc = '';
                try { previewHtmlSrc = cj.htmlPreview || generateHtmlFromPageJson(cj) || ''; } catch { /* ignore */ }
                const isLinked = pagePickerStep && activeFunnel?.tiers
                  .find(t => t.id === pagePickerStep.tierId)?.steps
                  .find(s => s.id === pagePickerStep.stepId)?.pageId === page.id;

                return (
                  <Paper
                    key={page.id}
                    onClick={() => assignPageToStep(page.id, page.title)}
                    sx={{
                      border: isLinked ? '2px solid #27ae60' : '1.5px solid rgba(0,0,0,0.08)',
                      borderRadius: 2.5, overflow: 'hidden', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#667eea', boxShadow: '0 4px 16px rgba(102,126,234,0.15)', transform: 'translateY(-2px)' },
                    }}
                  >
                    {/* Page preview thumbnail */}
                    <Box sx={{
                      height: 140, bgcolor: '#f8f9fa', overflow: 'hidden', position: 'relative',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {previewHtmlSrc ? (
                        <iframe
                          srcDoc={previewHtmlSrc}
                          title={page.title}
                          sandbox=""
                          style={{
                            width: '400%', height: '400%', border: 'none',
                            transform: 'scale(0.25)', transformOrigin: 'top left',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <PageIcon sx={{ fontSize: 40, color: '#ddd' }} />
                        </Box>
                      )}
                      {/* Preview button overlay */}
                      {previewHtmlSrc && (
                        <Tooltip title="Full preview">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewHtml(previewHtmlSrc);
                              setPagePreviewOpen(true);
                            }}
                            sx={{
                              position: 'absolute', top: 4, right: 4,
                              bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                              '&:hover': { bgcolor: '#fff' },
                            }}
                          >
                            <PreviewIcon sx={{ fontSize: 16, color: '#667eea' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isLinked && (
                        <Chip
                          label="Currently linked"
                          size="small"
                          sx={{
                            position: 'absolute', bottom: 4, left: 4,
                            bgcolor: '#27ae60', color: '#fff', fontSize: '0.65rem', fontWeight: 700, height: 20,
                          }}
                        />
                      )}
                    </Box>

                    {/* Page info */}
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', mb: 0.3, lineHeight: 1.3 }} noWrap>
                        {page.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={page.page_type || cj.pageType || 'page'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#f0f0f0', color: '#999' }}
                        />
                        {cj.productName && (
                          <Typography sx={{ fontSize: '0.65rem', color: '#bbb' }} noWrap>
                            {cj.productName}
                          </Typography>
                        )}
                      </Box>
                      {cj.price && (
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', mt: 0.3 }}>
                          {cj.price}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ——— Full page preview dialog ———————————— */}
      <Dialog
        open={pagePreviewOpen}
        onClose={() => setPagePreviewOpen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#fafbfc' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography sx={{ fontWeight: 700 }}>Page Preview</Typography>
          <IconButton onClick={() => setPagePreviewOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <iframe
            srcDoc={previewHtml}
            title="Page Preview"
            sandbox="allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      </Dialog>

      {/* ——— Pricing preview / customer flow dialog ————— */}
      <Dialog
        open={pricingPreviewOpen}
        onClose={() => setPricingPreviewOpen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#f5f6f8' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header bar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 3, py: 1.5,
            bgcolor: '#fff',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PricingIcon sx={{ color: '#667eea' }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e' }}>
                  Customer Pricing Preview
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                  Click a plan to launch its funnel — map tiers below if needed
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={activeFunnel?.name || ''} size="small" sx={{ fontWeight: 700, bgcolor: '#667eea12', color: '#667eea' }} />
              <IconButton onClick={() => setPricingPreviewOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {loadingPricing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 1.5, color: '#999', fontSize: '0.85rem' }}>Loading pricing page...</Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Plan → Tier mapping bar */}
              <Box sx={{
                display: 'flex', flexWrap: 'wrap', gap: 2, px: 3, py: 2,
                bgcolor: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
                alignItems: 'center',
              }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', mr: 1 }}>
                  Plan → Funnel Tier:
                </Typography>
                {pricingPlans.map(plan => {
                  const mappedTier = activeFunnel?.tiers.find(t => t.id === planTierMap[plan.name]);
                  return (
                    <Box key={plan.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={plan.name}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: '#f0f0f0' }}
                      />
                      <ArrowIcon sx={{ fontSize: 14, color: '#ccc' }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={planTierMap[plan.name] || ''}
                          displayEmpty
                          onChange={(e) => setPlanTierMap(prev => ({ ...prev, [plan.name]: e.target.value as string }))}
                          sx={{
                            borderRadius: 2, fontSize: '0.78rem', height: 30,
                            '& .MuiSelect-select': { py: 0.5 },
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: '0.78rem', color: '#999' }}><em>Not linked</em></MenuItem>
                          {activeFunnel?.tiers.map(tier => (
                            <MenuItem key={tier.id} value={tier.id} sx={{ fontSize: '0.78rem' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tier.color }} />
                                {tier.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {mappedTier && (
                        <Chip
                          label={`${mappedTier.steps.length} steps`}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20, bgcolor: `${mappedTier.color}15`, color: mappedTier.color, fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Rendered pricing page */}
              <Box sx={{ maxWidth: 1000, mx: 'auto', py: 6, px: 3 }}>
                {/* Hero */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                  <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a1a2e', mb: 1, lineHeight: 1.2 }}>
                    {pricingHero.headline || 'Choose Your Plan'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.05rem', color: '#888', maxWidth: 500, mx: 'auto' }}>
                    {pricingHero.subheading || ''}
                  </Typography>
                </Box>

                {/* Plan cards */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(pricingPlans.length, 4)}, 1fr)`,
                  gap: 3,
                }}>
                  {pricingPlans.map(plan => {
                    const tierId = planTierMap[plan.name];
                    const mappedTier = activeFunnel?.tiers.find(t => t.id === tierId);
                    const isLinked = !!mappedTier && mappedTier.steps.length > 0;

                    return (
                      <Paper
                        key={plan.name}
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          border: plan.popular ? '2px solid #667eea' : '1.5px solid rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                          position: 'relative',
                          transition: 'all 0.2s',
                          ...(plan.popular ? { boxShadow: '0 8px 32px rgba(102,126,234,0.15)' } : {}),
                        }}
                      >
                        {plan.popular && (
                          <Box sx={{
                            position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: '#fff', px: 2, py: 0.4, borderRadius: '0 0 10px 10px',
                            fontSize: '0.7rem', fontWeight: 700,
                          }}>
                            Most Popular
                          </Box>
                        )}

                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e', mb: 1, mt: plan.popular ? 2 : 0 }}>
                            {plan.name}
                          </Typography>
                          <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: '#667eea', lineHeight: 1 }}>
                            {plan.price}
                          </Typography>
                          {plan.period && (
                            <Typography sx={{ fontSize: '0.85rem', color: '#999', mb: 2 }}>{plan.period}</Typography>
                          )}
                          {plan.description && (
                            <Typography sx={{ fontSize: '0.82rem', color: '#888', mb: 2, lineHeight: 1.5 }}>
                              {plan.description}
                            </Typography>
                          )}

                          {/* Features list */}
                          {plan.features && (
                            <Box sx={{ textAlign: 'left', mb: 3, mt: 2 }}>
                              {(plan.features || []).map((f: any, i: number) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                  <CheckIcon sx={{ fontSize: 16, color: '#27ae60' }} />
                                  <Typography sx={{ fontSize: '0.82rem', color: '#555' }}>
                                    {typeof f === 'string' ? f : f.text || f.name || ''}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* CTA button */}
                          <Button
                            fullWidth
                            variant={plan.popular ? 'contained' : 'outlined'}
                            onClick={() => launchFunnelFromPlan(plan.name)}
                            sx={{
                              borderRadius: 2.5,
                              textTransform: 'none',
                              fontWeight: 700,
                              py: 1.5,
                              fontSize: '0.95rem',
                              ...(plan.popular
                                ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 16px rgba(102,126,234,0.3)' }
                                : { borderColor: '#667eea', color: '#667eea' }),
                            }}
                          >
                            {plan.cta || 'Get Started'}
                          </Button>

                          {/* Mapping indicator */}
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {isLinked ? (
                              <>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: mappedTier!.color }} />
                                <Typography sx={{ fontSize: '0.68rem', color: mappedTier!.color, fontWeight: 600 }}>
                                  → {mappedTier!.name} tier ({mappedTier!.steps.length} steps)
                                </Typography>
                              </>
                            ) : (
                              <Typography sx={{ fontSize: '0.68rem', color: '#ccc', fontStyle: 'italic' }}>
                                No funnel tier linked
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>

                {/* Info note */}
                <Box sx={{
                  textAlign: 'center', mt: 5, p: 3, borderRadius: 3,
                  bgcolor: '#fff', border: '1px dashed rgba(0,0,0,0.1)',
                }}>
                  <Typography sx={{ fontSize: '0.82rem', color: '#999' }}>
                    Click any plan's button to launch that tier's funnel. Use the dropdowns at the top to re-map plans to different tiers.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* ——— Test tier picker dialog ————————————— */}
      <Dialog
        open={testTierPicker}
        onClose={() => setTestTierPicker(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayIcon sx={{ color: '#27ae60' }} />
          Choose a Tier to Test
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#888', mb: 2 }}>
            Walk through the steps as a customer would see them.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeFunnel?.tiers.map(tier => (
              <Paper
                key={tier.id}
                onClick={() => tier.steps.length > 0 && startTestFunnel(tier)}
                sx={{
                  p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: 2.5, border: `1.5px solid ${tier.color}30`,
                  cursor: tier.steps.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: tier.steps.length > 0 ? 1 : 0.5,
                  boxShadow: 'none',
                  transition: 'all 0.15s',
                  '&:hover': tier.steps.length > 0 ? {
                    borderColor: tier.color, bgcolor: `${tier.color}06`,
                    transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${tier.color}15`,
                  } : {},
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: tier.color }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{tier.name}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                      {tier.steps.length} step{tier.steps.length !== 1 ? 's' : ''}
                      {tier.steps.filter(s => s.pageId).length > 0 && ` · ${tier.steps.filter(s => s.pageId).length} linked`}
                    </Typography>
                  </Box>
                </Box>
                <PlayIcon sx={{ color: tier.steps.length > 0 ? tier.color : '#ddd', fontSize: 22 }} />
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTestTierPicker(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ——— Test funnel simulator dialog —————————— */}
      <Dialog
        open={testActive}
        onClose={closeTest}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#f5f6f8' } }}
      >
        {testTier && (() => {
          const step = testTier.steps[testStepIdx];
          const total = testTier.steps.length;
          const progress = total > 1 ? ((testStepIdx + 1) / total) * 100 : 100;
          const hasPreview = step?.pageId && testPageHtml[step.pageId];
          const isLast = testStepIdx === total - 1;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Test header */}
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, py: 1.5,
                bgcolor: '#fff',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PlayIcon sx={{ color: '#27ae60' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a2e' }}>
                      Testing: {activeFunnel?.name} — {testTier.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                      Step {testStepIdx + 1} of {total}
                    </Typography>
                  </Box>
                </Box>

                {/* Step indicator pills */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {testTier.steps.map((s, i) => (
                    <Tooltip key={s.id} title={s.label}>
                      <Box
                        onClick={() => setTestStepIdx(i)}
                        sx={{
                          width: i === testStepIdx ? 28 : 10, height: 10,
                          borderRadius: 5,
                          bgcolor: i < testStepIdx ? '#27ae60' : i === testStepIdx ? getStepColor(s.pageType) : '#e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { transform: 'scale(1.3)' },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    disabled={testStepIdx === 0}
                    onClick={() => setTestStepIdx(i => i - 1)}
                    startIcon={<PrevIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', minWidth: 90 }}
                  >
                    Back
                  </Button>
                  {isLast ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={closeTest}
                      startIcon={<CheckIcon />}
                      sx={{
                        borderRadius: 2, textTransform: 'none', minWidth: 120,
                        background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      }}
                    >
                      Complete
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setTestStepIdx(i => i + 1)}
                      endIcon={<NextIcon />}
                      sx={{
                        borderRadius: 2, textTransform: 'none', minWidth: 120,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      Next Step
                    </Button>
                  )}
                  <IconButton onClick={closeTest} size="small" sx={{ ml: 1 }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Progress bar */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 3,
                  bgcolor: 'rgba(0,0,0,0.04)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #27ae60 0%, #667eea 100%)',
                  },
                }}
              />

              {/* Step info bar */}
              {step && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                  py: 1.5, bgcolor: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 2,
                    bgcolor: `${getStepColor(step.pageType)}12`,
                    color: getStepColor(step.pageType),
                  }}>
                    {getStepIcon(step.pageType)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>
                      {step.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                      {step.pageType}{step.pageId ? ` · Linked to: ${step.config?.pageTitle || `Page #${step.pageId}`}` : ' · No page linked'}
                    </Typography>
                  </Box>

                  {/* Auto-advance countdown */}
                  {testCountdown > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8,
                        px: 2, py: 0.8, borderRadius: 3,
                        bgcolor: '#e67e2212', border: '1px solid #e67e2230',
                      }}>
                        <TimerIcon sx={{ fontSize: 16, color: '#e67e22' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#e67e22', minWidth: 20, textAlign: 'center' }}>
                          {testCountdown}s
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={skipCountdown}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontSize: '0.72rem',
                          minWidth: 50, py: 0.3,
                          color: '#667eea', borderColor: '#667eea30',
                        }}
                        variant="outlined"
                      >
                        Skip
                      </Button>
                      <Button
                        size="small"
                        onClick={pauseCountdown}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontSize: '0.72rem',
                          minWidth: 50, py: 0.3,
                          color: '#999', borderColor: '#e0e0e0',
                        }}
                        variant="outlined"
                      >
                        Pause
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Page preview area */}
              <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {testLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress size={32} />
                    <Typography sx={{ mt: 1.5, color: '#999', fontSize: '0.85rem' }}>Loading page previews...</Typography>
                  </Box>
                ) : hasPreview ? (
                  <iframe
                    srcDoc={testPageHtml[step.pageId!]}
                    title={`Preview: ${step.label}`}
                    sandbox="allow-same-origin"
                    style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                  />
                ) : (
                  <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', textAlign: 'center', px: 4,
                  }}>
                    <Box sx={{
                      width: 100, height: 100, borderRadius: '50%',
                      bgcolor: `${getStepColor(step?.pageType || 'custom')}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 3,
                    }}>
                      <Box sx={{ color: getStepColor(step?.pageType || 'custom'), transform: 'scale(2)' }}>
                        {getStepIcon(step?.pageType || 'custom')}
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#1a1a2e', mb: 1 }}>
                      {step?.label || 'Step'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#999', maxWidth: 400 }}>
                      {step?.pageId
                        ? 'This page doesn\'t have an HTML preview yet. Open it in the Upsell Editor and generate a preview.'
                        : 'No page linked to this step yet. Double-click the step card in the builder to link a saved page.'}
                    </Typography>
                    <Chip
                      label={step?.pageType || 'custom'}
                      sx={{
                        mt: 2, fontWeight: 600,
                        bgcolor: `${getStepColor(step?.pageType || 'custom')}15`,
                        color: getStepColor(step?.pageType || 'custom'),
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          );
        })()}
      </Dialog>

      {/* ——— Delay config dialog ————————————————— */}
      <Dialog
        open={delayDialogOpen}
        onClose={() => setDelayDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerIcon sx={{ color: '#e67e22' }} />
          Auto-Advance Delay
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#888', mb: 3 }}>
            Set how long this step shows before automatically moving to the next one. Set to 0 for manual navigation only.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              type="number"
              value={delayDialogValue}
              onChange={(e) => setDelayDialogValue(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
              InputProps={{
                inputProps: { min: 0, max: 60 },
                endAdornment: <Typography sx={{ fontSize: '0.82rem', color: '#999', ml: 1 }}>seconds</Typography>,
              }}
              size="small"
              sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[0, 3, 5, 8, 10, 15].map(sec => (
              <Chip
                key={sec}
                label={sec === 0 ? 'Manual' : `${sec}s`}
                onClick={() => setDelayDialogValue(sec)}
                sx={{
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                  bgcolor: delayDialogValue === sec ? '#e67e2218' : '#f5f5f5',
                  color: delayDialogValue === sec ? '#e67e22' : '#666',
                  border: delayDialogValue === sec ? '1.5px solid #e67e22' : '1.5px solid transparent',
                  '&:hover': { bgcolor: '#e67e2210' },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDelayDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveDelay}
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)' }}
          >
            Save Delay
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Snackbar ————————————————————————————— */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
