import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { 
  App, 
  CreateAppDto, 
  UpdateAppDto, 
  SaaSDatabaseSchema,
  Page,
  Plan
} from '../types/saas-factory.types';
import { DatabaseService } from '../shared/database.service';

/**
 * Service for managing multiple SaaS applications
 */
@Injectable()
export class AppManagementService {
  constructor(private readonly db: DatabaseService) {}

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
      await this.createDefaultPages(db, newApp.id);

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
  private async createDefaultPages(db: SaaSDatabaseSchema, appId: number): Promise<void> {
    const pageTypes: Array<{ type: 'index' | 'thanks' | 'members' | 'checkout' | 'admin'; title: string }> = [
      { type: 'index', title: 'Home' },
      { type: 'thanks', title: 'Thank You' },
      { type: 'members', title: 'Members Area' },
      { type: 'checkout', title: 'Upgrade' },
      { type: 'admin', title: 'Admin Dashboard' },
    ];

    const maxId = Math.max(0, ...(db.pages?.map(p => p.id) || [0]));
    let nextId = maxId + 1;

    pageTypes.forEach(page => {
      const newPage: Page = {
        id: nextId++,
        app_id: appId,
        page_type: page.type,
        title: page.title,
        content_json: this.getDefaultContentJson(page.type, page.title),
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
  private getDefaultContentJson(type: string, title: string): Record<string, any> {
    switch (type) {
      case 'index':
        return {
          page_type: 'index',
          nav: { brand: 'Acme SaaS', links: ['Features', 'Pricing', 'About', 'Blog'], cta: 'Get Started' },
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
              { icon: 'bolt', title: 'Lightning Fast', description: 'Sub-100ms response times with global edge caching and optimised queries.', color: '#667eea' },
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
            { value: '$2.4M', label: 'Revenue Generated' },
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
          order_confirmation: { plan: 'Professional', billing: 'Monthly', amount: '$29.00/mo', confirmation_number: 'ACM-2026-8847' },
          email_notification: { message: 'Confirmation email sent', detail: 'Check your inbox at j.smith@example.com' },
          next_steps: [
            { step: '1', title: 'Complete your profile', description: 'Add your company details and logo' },
            { step: '2', title: 'Create your first project', description: 'Use a template or start from scratch' },
            { step: '3', title: 'Invite your team', description: 'Collaborate with up to 10 team members' },
          ],
          cta_primary: { text: 'Go to Dashboard', url: '/dashboard' },
          cta_secondary: { text: 'Back to Home', url: '/' },
        };

      case 'members':
        return {
          page_type: 'members',
          welcome: { headline: 'Welcome back, Jessica 👋', subheading: 'You have 3 new lessons available and your streak is on fire — 14 days!' },
          stats: [
            { label: 'Current Plan', value: 'Premium', sub: 'Renews Mar 15, 2026' },
            { label: 'Courses Completed', value: '12 / 24', sub: '50% complete' },
            { label: 'Streak', value: '14 Days', sub: 'Personal best!' },
          ],
          courses: [
            { title: 'Building Your First Workflow', progress: 75, lessons: '6/8 lessons', tag: 'In Progress' },
            { title: 'Advanced Automation Patterns', progress: 30, lessons: '3/10 lessons', tag: 'In Progress' },
            { title: 'Scaling to 10K Users', progress: 0, lessons: '0/12 lessons', tag: 'New' },
          ],
          quick_actions: ['My Profile', 'Billing', 'Support', 'Community'],
        };

      case 'checkout':
        return {
          page_type: 'checkout',
          headline: 'Choose Your Plan',
          subheading: 'All plans include a 14-day free trial. No credit card required to start.',
          plans: [
            { name: 'Starter', price: '$0', period: '/month', description: 'Perfect for individuals getting started', features: ['1 Project', '1,000 API calls/mo', 'Community support', 'Basic analytics'], cta: 'Current Plan', popular: false, disabled: true },
            { name: 'Professional', price: '$29', period: '/month', description: 'For growing teams and startups', features: ['Unlimited projects', '100K API calls/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], cta: 'Upgrade Now', popular: true, disabled: false },
            { name: 'Enterprise', price: '$99', period: '/month', description: 'For large organisations needing scale', features: ['Everything in Pro', 'Unlimited API calls', 'Dedicated support', 'SLA guarantee', 'SSO & SAML', 'Custom integrations'], cta: 'Contact Sales', popular: false, disabled: false },
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
            { label: 'Total Revenue', value: '$48,295', change: '+12.5%', up: true },
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
            { name: 'Sarah Chen', email: 's.chen@startup.io', plan: 'Enterprise', status: 'Active', mrr: '$99' },
            { name: 'Marcus Johnson', email: 'm.johnson@scale.co', plan: 'Professional', status: 'Active', mrr: '$29' },
            { name: 'Emily Rodriguez', email: 'e.rod@dev.studio', plan: 'Professional', status: 'Trial', mrr: '$0' },
            { name: 'David Park', email: 'd.park@cloud.io', plan: 'Starter', status: 'Churned', mrr: '$0' },
          ],
          system_health: [
            { label: 'API Server', status: 'Operational' },
            { label: 'Database', status: 'Operational' },
            { label: 'CDN', status: 'Operational' },
            { label: 'Email Service', status: 'Degraded' },
          ],
          recent_activity: [
            { text: 'New enterprise signup: Acme Corp', time: '2 min ago' },
            { text: 'Payment received: $99.00', time: '15 min ago' },
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
}
