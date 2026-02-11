import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { 
  App, 
  CreateAppDto, 
  UpdateAppDto, 
  SaaSDatabaseSchema,
  Page,
  Plan
} from '../types/saas-factory.types';

/**
 * Service for managing multiple SaaS applications
 */
@Injectable()
export class AppManagementService {
  private dbPath: string;
  private encryptionKey: string;

  constructor() {
    this.dbPath = join(process.cwd(), 'db.json');
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
  }

  /**
   * Read the entire database
   */
  private async readDatabase(): Promise<SaaSDatabaseSchema> {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
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
      await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
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
   */
  async createApp(dto: CreateAppDto): Promise<App> {
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

    // Create default pages for the new app
    await this.createDefaultPages(db, newApp.id);

    // Create default plan
    await this.createDefaultPlan(db, newApp.id);

    await this.writeDatabase(db);

    return newApp;
  }

  /**
   * Update an app
   */
  async updateApp(id: number, dto: UpdateAppDto): Promise<App> {
    const db = await this.readDatabase();
    const appIndex = db.apps?.findIndex(a => a.id === id);

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
    const appIndex = db.apps?.findIndex(a => a.id === id);

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
        content_json: { message: `Default ${page.title} page` },
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

    // Create the new app
    const newApp = await this.createApp(newAppDto);

    // Clone pages
    const sourcePages = db.pages?.filter(p => p.app_id === sourceAppId) || [];
    const maxPageId = Math.max(0, ...(db.pages?.map(p => p.id) || [0]));
    let nextPageId = maxPageId + 1;

    sourcePages.forEach(page => {
      const clonedPage: Page = {
        ...page,
        id: nextPageId++,
        app_id: newApp.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.pages.push(clonedPage);
    });

    db.last_updated = new Date().toISOString();
    await this.writeDatabase(db);

    return newApp;
  }
}
