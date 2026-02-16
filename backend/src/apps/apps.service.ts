import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import axios from 'axios';
import { 
  App, 
  CreateAppDto, 
  UpdateAppDto, 
  SaaSDatabaseSchema,
  Page,
  Plan
} from '../types/saas-factory.types';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Service for managing multiple SaaS applications
 */
@Injectable()
export class AppManagementService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Read the entire database
   */
  private async readDatabase(): Promise<SaaSDatabaseSchema> {
    try {
      const data = await fs.readFile(this.db.dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read database:', error);
      throw new Error('Database read error');
    }
  }

  /**
   * Write the entire database
   */
  private async writeDatabase(data: SaaSDatabaseSchema): Promise<void> {
    try {
      await fs.writeFile(this.db.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to write database:', error);
      throw new Error('Database write error');
    }
  }

  /**
   * Get all apps
   */
  async getAllApps(): Promise<App[]> {
    const db = await this.readDatabase();
    return db.apps || [];
  }

  /**
   * Get app by ID
   */
  async getAppById(id: number): Promise<App> {
    const db = await this.readDatabase();
    const app = db.apps?.find(a => a.id === id);
    
    if (!app) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }
    
    return app;
  }

  /**
   * Get app by slug (used for routing)
   */
  async getAppBySlug(slug: string): Promise<App> {
    const db = await this.readDatabase();
    const app = db.apps?.find(a => a.slug === slug);
    
    if (!app) {
      throw new NotFoundException(`App with slug "${slug}" not found`);
    }
    
    return app;
  }

  /**
   * Create a new app
   * @param skipDefaults - When true, skips creating default pages and plans (used by cloneApp)
   */
  async createApp(dto: CreateAppDto, skipDefaults = false): Promise<App> {
    const db = await this.readDatabase();
    
    // Validate slug uniqueness
    if (db.apps?.some(a => a.slug === dto.slug)) {
      throw new Error(`App with slug "${dto.slug}" already exists`);
    }

    const newApp: App = {
      id: Math.max(0, ...(db.apps?.map(a => a.id) || [0])) + 1,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
      logo_url: dto.logo_url,
      primary_color: dto.primary_color || '#3498db',
      locale: dto.locale || 'en-GB',
      n8n_workflow_id: dto.n8n_workflow_id,
      version: '1.0.0',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.apps = db.apps || [];
    db.apps.push(newApp);
    db.last_updated = new Date().toISOString();

    if (!skipDefaults) {
      // Create default pages for the new app
      await this.createDefaultPages(db, newApp.id, newApp.locale);

      // Create default plan
      await this.createDefaultPlan(db, newApp.id);
    }

    await this.writeDatabase(db);

    return newApp;
  }

  /**
   * Update an app
   */
  async updateApp(id: number, dto: UpdateAppDto): Promise<App> {
    const db = await this.readDatabase();
    const appIndex = (db.apps || []).findIndex(a => a.id === id);

    if (appIndex === -1) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    const app = db.apps[appIndex];
    const updated: App = {
      ...app,
      ...dto,
      id: app.id,
      slug: app.slug, // Slug should not be updated
      created_at: app.created_at,
      updated_at: new Date().toISOString(),
    };

    db.apps[appIndex] = updated;
    db.last_updated = new Date().toISOString();

    await this.writeDatabase(db);

    return updated;
  }

  /**
   * Delete an app and all associated data
   */
  async deleteApp(id: number): Promise<void> {
    const db = await this.readDatabase();
    const appIndex = (db.apps || []).findIndex(a => a.id === id);

    if (appIndex === -1) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    // Remove the app
    db.apps.splice(appIndex, 1);

    // Remove all related data
    db.pages = db.pages?.filter(p => p.app_id !== id) || [];
    db.plans = db.plans?.filter(p => p.app_id !== id) || [];
    db.app_settings = db.app_settings?.filter(s => s.app_id !== id) || [];
    db.api_keys = db.api_keys?.filter(k => k.app_id !== id) || [];
    db.workflows = db.workflows?.filter(w => w.app_id !== id) || [];
    db.subscriptions = db.subscriptions?.filter(s => s.app_id !== id) || [];
    db.app_usage = db.app_usage?.filter(u => u.app_id !== id) || [];

    db.last_updated = new Date().toISOString();

    await this.writeDatabase(db);
  }

  /**
   * Create default pages for a new app
   */
  private async createDefaultPages(db: SaaSDatabaseSchema, appId: number, locale?: string): Promise<void> {
    const pageTypes: Array<{ type: Page['page_type']; title: string }> = [
      { type: 'index', title: 'Home' },
      { type: 'features', title: 'Features' },
      { type: 'pricing', title: 'Pricing' },
      { type: 'about', title: 'About' },
      { type: 'blog-page', title: 'Blog' },
      { type: 'thanks', title: 'Thank You' },
      { type: 'checkout', title: 'Upgrade' },
    ];

    const maxId = Math.max(0, ...(db.pages?.map(p => p.id) || [0]));
    let nextId = maxId + 1;

    pageTypes.forEach(page => {
      const newPage: Page = {
        id: nextId++,
        app_id: appId,
        page_type: page.type,
        title: page.title,
        content_json: this.getDefaultContentJson(page.type, page.title, locale),
        custom_css: undefined,
        custom_component_path: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.pages = db.pages || [];
      db.pages.push(newPage);
    });
  }

  /**
   * Get rich default content for a page type
   */
  private getDefaultContentJson(type: string, title: string, locale?: string): Record<string, any> {
    const isUK = locale !== 'en-US'; // default to UK
    const c = isUK ? '£' : '$';  // currency symbol
    // Localised spelling helpers
    const org = isUK ? 'organisations' : 'organizations';
    const customise = isUK ? 'customise' : 'customize';
    const customisable = isUK ? 'customisable' : 'customizable';
    const optimise = isUK ? 'optimise' : 'optimize';
    const optimised = isUK ? 'optimised' : 'optimized';
    const analyse = isUK ? 'analyse' : 'analyze';
    const colour = isUK ? 'colour' : 'color';
    const favourite = isUK ? 'favourite' : 'favorite';
    const licence = isUK ? 'licence' : 'license';
    const centre = isUK ? 'centre' : 'center';
    const catalogue = isUK ? 'catalogue' : 'catalog';

    switch (type) {
      case 'index':
        return {
          page_type: 'index',
          nav: { brand: 'Acme SaaS', links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ], cta: 'Get Started' },
          hero: {
            badge: '🚀 Now in Public Beta',
            headline: 'Build, Ship & Scale Your Dream Product',
            subheading: 'The all-in-one platform that helps startups and solopreneurs launch production-ready SaaS applications in record time. No complex infrastructure needed.',
            cta_primary: { text: 'Start Building Free', url: '/signup' },
            cta_secondary: { text: 'Watch Demo', url: '/demo' },
            social_proof: '2,400+ builders already onboard',
          },
          trusted_by: ['Stripe', 'Vercel', 'Notion', 'Linear', 'Figma'],
          features_section: {
            headline: 'Everything You Need to Launch',
            subheading: 'From authentication to analytics, every feature is built-in so you can focus on what makes your product unique.',
            items: [
              { icon: 'bolt', title: 'Lightning Fast', description: `Sub-100ms response times with global edge caching and ${optimised} queries.`, color: '#667eea' },
              { icon: 'lock', title: 'Enterprise Security', description: 'SOC 2 compliant with end-to-end encryption and role-based access controls.', color: '#27ae60' },
              { icon: 'trending_up', title: 'Built-in Analytics', description: 'Real-time dashboards tracking MRR, churn, LTV and user engagement metrics.', color: '#f39c12' },
              { icon: 'people', title: 'Team Collaboration', description: 'Invite unlimited team members with granular permissions and activity logs.', color: '#e74c3c' },
              { icon: 'speed', title: 'Auto-Scaling', description: 'Seamlessly handles 10 to 10 million users without any configuration changes.', color: '#9b59b6' },
              { icon: 'support', title: '24/7 Support', description: 'Dedicated support team with <2 hour response times and onboarding assistance.', color: '#00bcd4' },
            ],
          },
          stats: [
            { value: '10K+', label: 'Active Users' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '4.9★', label: 'Average Rating' },
            { value: `${c}2.4M`, label: 'Revenue Generated' },
          ],
          cta_footer: {
            headline: 'Ready to Get Started?',
            subheading: 'Join thousands of founders who launched their SaaS with our platform. Free tier available — no credit card required.',
            button_text: 'Create Your Free Account',
          },
        };

      case 'thanks':
        return {
          page_type: 'thanks',
          hero: {
            headline: "You're All Set! 🎉",
            subheading: 'Thank you for signing up. Your account has been created successfully and you\'re ready to start building amazing things.',
          },
          order_confirmation: { plan: 'Professional', billing: 'Monthly', amount: `${c}29.00/mo`, confirmation_number: 'ACM-2026-8847' },
          email_notification: { message: 'Confirmation email sent', detail: 'Check your inbox at j.smith@example.com' },
          next_steps: [
            { step: '1', title: 'Complete your profile', description: 'Add your company details and logo' },
            { step: '2', title: 'Create your first project', description: 'Use a template or start from scratch' },
            { step: '3', title: 'Invite your team', description: 'Collaborate with up to 10 team members' },
          ],
          cta_primary: { text: 'Go to Dashboard', url: '/dashboard' },
          cta_secondary: { text: 'Back to Home', url: '/' },
        };

      case 'features':
        return {
          page_type: 'features',
          nav: { brand: 'Acme SaaS', links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ], cta: 'Get Started' },
          hero: {
            badge: '✨ Powerful Features',
            headline: 'Everything You Need, Nothing You Don\'t',
            subheading: 'Explore the full suite of tools designed to help you build, launch, and grow your product faster than ever before.',
          },
          feature_categories: [
            {
              category: 'Core Platform',
              items: [
                { icon: 'dashboard', title: 'Intuitive Dashboard', description: 'A clean, powerful dashboard that gives you a bird\'s-eye view of your entire business at a glance.' },
                { icon: 'bolt', title: 'Lightning Performance', description: 'Built on modern infrastructure with sub-100ms response times and 99.9% uptime guarantee.' },
                { icon: 'security', title: 'Enterprise Security', description: 'Bank-grade encryption, SOC 2 compliance, and role-based access controls to keep your data safe.' },
              ],
            },
            {
              category: 'Growth Tools',
              items: [
                { icon: 'analytics', title: 'Advanced Analytics', description: 'Track MRR, churn, LTV, and user engagement with real-time dashboards and exportable reports.' },
                { icon: 'email', title: 'Email Automation', description: `Built-in transactional and marketing email workflows with ${customisable} templates.` },
                { icon: 'ab_testing', title: 'A/B Testing', description: `Run experiments on pricing, copy, and features to ${optimise} conversion rates.` },
              ],
            },
            {
              category: 'Developer Experience',
              items: [
                { icon: 'api', title: 'RESTful API', description: 'A comprehensive API with webhooks, SDKs, and detailed documentation for seamless integration.' },
                { icon: 'code', title: 'Custom Workflows', description: 'Automate repetitive tasks with a visual workflow builder — no coding required.' },
                { icon: 'integration', title: 'Integrations', description: 'Connect to 200+ tools including Stripe, Slack, Zapier, HubSpot, and more.' },
              ],
            },
          ],
          comparison: {
            headline: 'How We Compare',
            columns: ['Feature', 'Us', 'Competitor A', 'Competitor B'],
            rows: [
              ['Unlimited Projects', '✅', '❌', '✅'],
              ['Built-in Analytics', '✅', '✅', '❌'],
              ['Custom Domains', '✅', '❌', '❌'],
              ['Priority Support', '✅', '💰 Add-on', '❌'],
              ['API Access', '✅', '✅', '💰 Add-on'],
            ],
          },
          cta_footer: {
            headline: 'Ready to Experience These Features?',
            subheading: 'Start your free trial today — no credit card required.',
            button_text: 'Get Started Free',
            button_url: '/signup',
          },
        };

      case 'pricing':
        return {
          page_type: 'pricing',
          nav: { brand: 'Acme SaaS', links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ], cta: 'Get Started' },
          hero: {
            headline: 'Simple, Transparent Pricing',
            subheading: 'No hidden fees, no surprises. Choose the plan that fits your needs and scale as you grow.',
          },
          billing_toggle: { monthly: 'Monthly', annual: 'Annual', annual_discount: 'Save 20%' },
          plans: [
            {
              name: 'Free',
              price: `${c}0`,
              period: '/month',
              description: 'Perfect for trying things out',
              features: ['1 Project', '1,000 API calls/mo', 'Community support', 'Basic analytics', 'Standard SSL'],
              cta: 'Get Started',
              popular: false,
            },
            {
              name: 'Pro',
              price: `${c}29`,
              period: '/month',
              annual_price: `${c}23`,
              description: 'For serious builders and small teams',
              features: ['Unlimited projects', '100K API calls/mo', 'Priority email support', 'Advanced analytics', 'Custom domains', 'Team collaboration (5 seats)', 'Remove branding'],
              cta: 'Start Free Trial',
              popular: true,
            },
            {
              name: 'Business',
              price: `${c}79`,
              period: '/month',
              annual_price: `${c}63`,
              description: 'For growing companies',
              features: ['Everything in Pro', '1M API calls/mo', 'Phone & chat support', 'SSO & SAML', 'Audit logs', 'Unlimited team seats', 'SLA guarantee'],
              cta: 'Start Free Trial',
              popular: false,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: `For large ${org} with advanced needs`,
              features: ['Everything in Business', 'Unlimited API calls', 'Dedicated account manager', 'Custom integrations', 'On-premise option', 'Custom SLA', 'Training & onboarding'],
              cta: 'Contact Sales',
              popular: false,
            },
          ],
          faq: [
            { question: 'Can I switch plans later?', answer: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately and billing is prorated.' },
            { question: 'Is there a free trial?', answer: 'Yes! All paid plans include a 14-day free trial. No credit card required to start.' },
            { question: 'What happens if I exceed my API limits?', answer: 'We\'ll notify you at 80% usage. You can upgrade your plan or purchase additional capacity as needed.' },
            { question: 'Do you offer refunds?', answer: 'We offer a 30-day money-back guarantee on all paid plans. No questions asked.' },
          ],
          trust_badges: ['256-bit SSL', 'SOC 2 Certified', 'GDPR Compliant', '30-day money-back guarantee'],
        };

      case 'about':
        return {
          page_type: 'about',
          nav: { brand: 'Acme SaaS', links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ], cta: 'Get Started' },
          hero: {
            headline: 'Our Story',
            subheading: 'We\'re on a mission to make building software products accessible to everyone — from indie hackers to enterprise teams.',
          },
          story: {
            paragraphs: [
              'We started in 2023 with a simple observation: building a SaaS product from scratch takes far too long. Developers spend months on authentication, billing, and infrastructure before writing a single line of product code.',
              'We built this platform to change that. Our goal is to give every founder and developer the same tools and infrastructure that billion-dollar companies use — without the complexity or cost.',
              'Today, thousands of builders trust our platform to power their products, from simple landing pages to complex enterprise applications.',
            ],
          },
          values: [
            { icon: 'lightbulb', title: 'Simplicity First', description: 'We believe powerful tools should be intuitive. Every feature is designed to be understood in seconds, not hours.' },
            { icon: 'people', title: 'Builder Community', description: 'We\'re builders ourselves and we put our community first. Your feedback directly shapes our roadmap.' },
            { icon: 'verified', title: 'Transparency', description: 'Open pricing, public changelogs, and honest communication. No dark patterns, ever.' },
            { icon: 'speed', title: 'Speed Matters', description: 'We ship fast and iterate faster. Weekly releases mean you always have the latest and greatest.' },
          ],
          team: [
            { name: 'Alex Chen', role: 'CEO & Co-founder', bio: 'Former engineer at Stripe. Passionate about developer tools and making technology accessible.' },
            { name: 'Sarah Kim', role: 'CTO & Co-founder', bio: '10+ years in distributed systems. Previously at AWS and Cloudflare.' },
            { name: 'Marcus Johnson', role: 'Head of Product', bio: 'Product leader with experience at Notion and Linear. Obsessed with user experience.' },
          ],
          stats: [
            { value: '10,000+', label: 'Builders' },
            { value: '50+', label: 'Countries' },
            { value: '99.9%', label: 'Uptime' },
            { value: '2023', label: 'Founded' },
          ],
          cta_footer: {
            headline: 'Join Us on This Journey',
            subheading: 'Whether you\'re building your first product or your tenth, we\'re here to help you succeed.',
            button_text: 'Start Building Today',
            button_url: '/signup',
          },
        };

      case 'blog-page':
        return {
          page_type: 'blog-page',
          nav: { brand: 'Acme SaaS', links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ], cta: 'Get Started' },
          hero: {
            headline: 'Blog & Resources',
            subheading: 'Insights, tutorials, and updates from our team. Publish blog posts to see them here.',
          },
          featured_post: null,
          posts: [],
          categories: ['All'],
          newsletter: {
            headline: 'Stay in the Loop',
            subheading: 'Get weekly insights on building and growing your SaaS. No spam, unsubscribe anytime.',
            placeholder: 'Enter your email',
            button_text: 'Subscribe',
          },
        };

      case 'checkout':
        return {
          page_type: 'checkout',
          headline: 'Choose Your Plan',
          subheading: 'All plans include a 14-day free trial. No credit card required to start.',
          plans: [
            { name: 'Starter', price: `${c}0`, period: '/month', description: 'Perfect for individuals getting started', features: ['1 Project', '1,000 API calls/mo', 'Community support', 'Basic analytics'], cta: 'Current Plan', popular: false, disabled: true },
            { name: 'Professional', price: `${c}29`, period: '/month', description: 'For growing teams and startups', features: ['Unlimited projects', '100K API calls/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], cta: 'Upgrade Now', popular: true, disabled: false },
            { name: 'Enterprise', price: `${c}99`, period: '/month', description: `For large ${org} needing scale`, features: ['Everything in Pro', 'Unlimited API calls', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'Custom integrations'], cta: 'Contact Sales', popular: false, disabled: false },
          ],
          payment_form: { fields: ['Cardholder Name', 'Card Number', 'Expiry', 'CVC'], submit_text: 'Start 14-Day Free Trial' },
          trust_badges: ['256-bit SSL', 'SOC 2 Certified', 'PCI Compliant'],
          guarantee: '30-day money-back guarantee · Cancel anytime · No hidden fees',
        };

      case 'admin':
        return {
          page_type: 'admin',
          dashboard_title: 'Dashboard Overview',
          kpis: [
            { label: 'Total Revenue', value: `${c}48,295`, change: '+12.5%', up: true },
            { label: 'Active Users', value: '3,847', change: '+8.2%', up: true },
            { label: 'New Signups', value: '284', change: '+23.1%', up: true },
            { label: 'Churn Rate', value: '2.4%', change: '-0.3%', up: false },
          ],
          revenue_chart: {
            title: 'Revenue Overview',
            periods: ['7D', '30D', '90D', '1Y'],
            default_period: '30D',
            data: [45, 62, 58, 75, 88, 72, 95, 80, 68, 92, 78, 85],
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          },
          recent_users: [
            { name: 'Sarah Chen', email: 's.chen@startup.io', plan: 'Enterprise', status: 'Active', mrr: `${c}99` },
            { name: 'Marcus Johnson', email: 'm.johnson@scale.co', plan: 'Professional', status: 'Active', mrr: `${c}29` },
            { name: 'Emily Rodriguez', email: 'e.rod@dev.studio', plan: 'Professional', status: 'Trial', mrr: `${c}0` },
            { name: 'David Park', email: 'd.park@cloud.io', plan: 'Starter', status: 'Churned', mrr: `${c}0` },
          ],
          system_health: [
            { label: 'API Server', status: 'Operational' },
            { label: 'Database', status: 'Operational' },
            { label: 'CDN', status: 'Operational' },
            { label: 'Email Service', status: 'Degraded' },
          ],
          recent_activity: [
            { text: 'New enterprise signup: Acme Corp', time: '2 min ago' },
            { text: `Payment received: ${c}99.00`, time: '15 min ago' },
            { text: 'Support ticket #482 resolved', time: '1 hr ago' },
            { text: 'Database backup completed', time: '3 hrs ago' },
          ],
        };

      default:
        return { message: `Default ${title} page` };
    }
  }

  /**
   * Create default plan for a new app
   */
  private async createDefaultPlan(db: SaaSDatabaseSchema, appId: number): Promise<void> {
    const maxId = Math.max(0, ...(db.plans?.map(p => p.id) || [0]));

    const freePlan: Plan = {
      id: maxId + 1,
      app_id: appId,
      name: 'Free',
      price: 0,
      billing_period: 'monthly',
      features_json: {
        test_count: 10,
        support: 'community',
      },
      created_at: new Date().toISOString(),
    };

    const proPlan: Plan = {
      id: maxId + 2,
      app_id: appId,
      name: 'Pro',
      price: 29,
      billing_period: 'monthly',
      features_json: {
        test_count: 1000,
        support: 'email',
        advanced_features: true,
      },
      created_at: new Date().toISOString(),
    };

    db.plans = db.plans || [];
    db.plans.push(freePlan, proPlan);
  }

  /**
   * Get app statistics
   */
  async getAppStats(appId: number): Promise<any> {
    const db = await this.readDatabase();
    const app = db.apps?.find(a => a.id === appId);

    if (!app) {
      throw new NotFoundException(`App with ID ${appId} not found`);
    }

    const subscriptions = db.subscriptions?.filter(s => s.app_id === appId) || [];
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const totalRevenue = (db.plans?.filter(p => p.app_id === appId) || []).reduce((sum, plan) => {
      const subs = subscriptions.filter(s => s.plan_id === plan.id && s.status === 'active');
      return sum + (plan.price * subs.length);
    }, 0);

    return {
      app_id: appId,
      name: app.name,
      active_subscriptions: activeSubscriptions.length,
      total_subscriptions: subscriptions.length,
      total_revenue: totalRevenue.toFixed(2),
      created_at: app.created_at,
    };
  }

  /**
   * Clone an app (create a copy with a different slug)
   */
  async cloneApp(sourceAppId: number, newAppDto: CreateAppDto): Promise<App> {
    const db = await this.readDatabase();
    const sourceApp = db.apps?.find(a => a.id === sourceAppId);

    if (!sourceApp) {
      throw new NotFoundException(`Source app with ID ${sourceAppId} not found`);
    }

    // Create the new app without default pages (we'll clone the source pages instead)
    const newApp = await this.createApp(newAppDto, true);

    // Re-read DB since createApp wrote to it
    const freshDb = await this.readDatabase();

    // Clone pages from source app
    const sourcePages = freshDb.pages?.filter(p => p.app_id === sourceAppId) || [];
    const maxPageId = Math.max(0, ...(freshDb.pages?.map(p => p.id) || [0]));
    let nextPageId = maxPageId + 1;

    freshDb.pages = freshDb.pages || [];
    sourcePages.forEach(page => {
      const clonedPage: Page = {
        ...page,
        id: nextPageId++,
        app_id: newApp.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      freshDb.pages.push(clonedPage);
    });

    // Clone plans from source app
    const sourcePlans = freshDb.plans?.filter(p => p.app_id === sourceAppId) || [];
    const maxPlanId = Math.max(0, ...(freshDb.plans?.map(p => p.id) || [0]));
    let nextPlanId = maxPlanId + 1;

    freshDb.plans = freshDb.plans || [];
    sourcePlans.forEach(plan => {
      const clonedPlan: Plan = {
        ...plan,
        id: nextPlanId++,
        app_id: newApp.id,
        created_at: new Date().toISOString(),
      };
      freshDb.plans.push(clonedPlan);
    });

    freshDb.last_updated = new Date().toISOString();
    await this.writeDatabase(freshDb);

    return newApp;
  }

  // ─── AI Page Content Generation ───────────────────────────────────

  private getApiKey(provider: string): string | null {
    try {
      if (!this.db.exists()) return null;
      const data = JSON.parse(fsSync.readFileSync(this.db.dbPath, 'utf-8'));
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name === provider);
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch {
      return null;
    }
  }

  /**
   * Generate AI-customised content for all pages of an app based on its description
   */
  async generatePagesContent(appId: number, extraContext?: { targetAudience?: string; keyProblem?: string; uniqueValue?: string }): Promise<{ success: boolean; pagesUpdated: number; error?: string }> {
    const db = await this.readDatabase();
    const app = db.apps?.find(a => a.id === appId);
    if (!app) throw new NotFoundException(`App ${appId} not found`);
    if (!app.description || app.description.trim().length < 5) {
      return { success: false, pagesUpdated: 0, error: 'App description is too short to generate content' };
    }

    const pages = db.pages?.filter(p => p.app_id === appId) || [];
    if (pages.length === 0) {
      return { success: false, pagesUpdated: 0, error: 'No pages found for this app' };
    }

    // Try openrouter first (cheaper), fall back to openai
    let apiKey = this.getApiKey('openrouter');
    let provider: 'openrouter' | 'openai' = 'openrouter';
    if (!apiKey) {
      apiKey = this.getApiKey('openai');
      provider = 'openai';
    }
    if (!apiKey) {
      return { success: false, pagesUpdated: 0, error: 'No AI API key configured (need OpenRouter or OpenAI in Settings)' };
    }

    let pagesUpdated = 0;

    for (const page of pages) {
      try {
        const generated = await this.generateSinglePageContent(
          apiKey, provider, app.name, app.description, page.page_type, page.title, page.content_json || {}, extraContext, app.locale,
        );
        if (generated) {
          page.content_json = generated;
          page.updated_at = new Date().toISOString();
          pagesUpdated++;
        }
      } catch (err) {
        console.error(`Failed to generate content for page ${page.title}:`, err);
      }
    }

    if (pagesUpdated > 0) {
      // Re-read the database to preserve any apiUsage entries added by trackApiUsage
      // during page generation (otherwise our stale snapshot overwrites them)
      const freshDb = await this.readDatabase();
      for (const page of pages) {
        const idx = (freshDb.pages || []).findIndex((p: any) => p.id === page.id);
        if (idx !== -1) {
          freshDb.pages[idx] = page;
        }
      }
      freshDb.last_updated = new Date().toISOString();
      await this.writeDatabase(freshDb);
    }

    return { success: true, pagesUpdated };
  }

  private async generateSinglePageContent(
    apiKey: string,
    provider: 'openrouter' | 'openai',
    appName: string,
    appDescription: string,
    pageType: string,
    pageTitle: string,
    currentContent: Record<string, any>,
    extraContext?: { targetAudience?: string; keyProblem?: string; uniqueValue?: string },
    locale?: string,
  ): Promise<Record<string, any> | null> {
    const extraLines: string[] = [];
    if (extraContext?.targetAudience) extraLines.push(`- Target audience: ${extraContext.targetAudience}`);
    if (extraContext?.keyProblem) extraLines.push(`- Key problem solved: ${extraContext.keyProblem}`);
    if (extraContext?.uniqueValue) extraLines.push(`- Unique value proposition: ${extraContext.uniqueValue}`);
    const extraBlock = extraLines.length > 0 ? `\n\nAdditional Context:\n${extraLines.join('\n')}` : '';

    const isUK = locale !== 'en-US';
    const localeLabel = isUK ? 'British English (en-GB)' : 'American English (en-US)';
    const currencySymbol = isUK ? '£' : '$';
    const localeRule = `- Use ${localeLabel} spelling throughout (e.g. ${isUK ? 'colour, optimise, organisation, customise, centre, catalogue' : 'color, optimize, organization, customize, center, catalog'}).
- Use the ${currencySymbol} currency symbol for all prices and monetary values.`;

    const systemPrompt = `You are a SaaS landing page content writer. Given an app name, description, and a page template structure, rewrite ALL the placeholder content to match the specific app being built.

RULES:
- Return ONLY valid JSON — no markdown, no explanation, no code fences.
- Keep the EXACT same JSON structure/keys as the template. Only change the text values.
- Make the content specific, professional, and compelling for the described app.
- Use the app name "${appName}" instead of any placeholder brand names.
- Tailor features, stats, testimonials, and CTAs to match what the app actually does.
- Keep arrays the same length — just replace the placeholder text.
- For pricing pages, keep plan structure but adjust feature descriptions to match the app.
- For stats/numbers, use realistic but aspirational values appropriate for the app type.
${localeRule}`;

    const userPrompt = `App Name: ${appName}
App Description: ${appDescription}${extraBlock}
Page Type: ${pageType} (${pageTitle})

Here is the current template content. Rewrite all text values to be specific to this app:

${JSON.stringify(currentContent, null, 2)}`;

    try {
      let responseText: string;
      const startTime = Date.now();
      let tokensIn = 0, tokensOut = 0;
      const model = provider === 'openrouter' ? 'google/gemini-2.0-flash-001' : 'gpt-4o-mini';

      if (provider === 'openrouter') {
        const res = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 3000,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
            },
            timeout: 30000,
          },
        );
        responseText = res.data.choices?.[0]?.message?.content || '';
        tokensIn = res.data.usage?.prompt_tokens || 0;
        tokensOut = res.data.usage?.completion_tokens || 0;
      } else {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 3000,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );
        responseText = res.data.choices?.[0]?.message?.content || '';
        tokensIn = res.data.usage?.prompt_tokens || 0;
        tokensOut = res.data.usage?.completion_tokens || 0;
      }

      // Track AI cost
      const cost = this.estimateCost(provider, model, tokensIn, tokensOut);
      await this.analyticsService.trackApiUsage({
        provider,
        endpoint: '/chat/completions',
        model,
        tokensIn,
        tokensOut,
        cost,
        duration: Date.now() - startTime,
        statusCode: 200,
        success: true,
        module: 'page-generation',
      }).catch(() => {}); // Don't fail if tracking fails

      // Clean response — strip markdown fences if present
      responseText = responseText.trim();
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(responseText);
      return parsed;
    } catch (err) {
      console.error(`AI generation failed for ${pageType}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Estimate cost in USD based on provider, model, and token counts
   */
  private estimateCost(provider: string, model: string, tokensIn: number, tokensOut: number): number {
    // Prices per 1M tokens [input, output]
    const rates: Record<string, [number, number]> = {
      'gpt-4o-mini': [0.15, 0.60],
      'gpt-4o': [2.50, 10.00],
      'gpt-3.5-turbo': [0.50, 1.50],
      'gpt-4': [30.00, 60.00],
      'google/gemini-2.0-flash-001': [0.10, 0.40],
      'anthropic/claude-sonnet-4': [3.00, 15.00],
      'claude-sonnet-4-20250514': [3.00, 15.00],
      'openai/gpt-4o': [2.50, 10.00],
    };
    const [inRate, outRate] = rates[model] || [1.00, 3.00]; // fallback
    return (tokensIn * inRate + tokensOut * outRate) / 1_000_000;
  }
}
