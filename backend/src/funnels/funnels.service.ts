import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { DatabaseService } from '../shared/database.service';
import { SaaSDatabaseSchema, Funnel, FunnelTier, FunnelStep } from '../types/saas-factory.types';

@Injectable()
export class FunnelsService {
  constructor(private readonly db: DatabaseService) {}

  private async readDatabase(): Promise<SaaSDatabaseSchema> {
    const data = await fs.readFile(this.db.dbPath, 'utf-8');
    return JSON.parse(data);
  }

  private async writeDatabase(data: SaaSDatabaseSchema): Promise<void> {
    await fs.writeFile(this.db.dbPath, JSON.stringify(data, null, 2));
  }

  /** Get all funnels for an app */
  async getFunnels(appId: number): Promise<{ success: boolean; data: Funnel[] }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const funnels = db.funnels.filter(f => f.app_id === appId);
    return { success: true, data: funnels };
  }

  /** Get a single funnel */
  async getFunnel(id: number): Promise<{ success: boolean; data: Funnel }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const funnel = db.funnels.find(f => f.id === id);
    if (!funnel) throw new NotFoundException(`Funnel ${id} not found`);
    return { success: true, data: funnel };
  }

  /** Create a new funnel with default tiers */
  async createFunnel(appId: number, name: string, description?: string): Promise<{ success: boolean; data: Funnel }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];

    const maxId = db.funnels.reduce((max, f) => Math.max(max, f.id), 0);
    const now = new Date().toISOString();

    const funnel: Funnel = {
      id: maxId + 1,
      app_id: appId,
      name,
      description,
      tiers: [
        {
          id: 'free',
          name: 'Free',
          color: '#27ae60',
          steps: [
            { id: 'free-1', pageType: 'register', label: 'Register' },
          ],
        },
        {
          id: 'pro',
          name: 'Pro',
          color: '#667eea',
          steps: [
            { id: 'pro-1', pageType: 'checkout', label: 'Checkout' },
            { id: 'pro-2', pageType: 'upsell', label: 'Upsell Offer' },
            { id: 'pro-3', pageType: 'register', label: 'Register' },
          ],
        },
        {
          id: 'gold',
          name: 'Gold',
          color: '#f39c12',
          steps: [
            { id: 'gold-1', pageType: 'checkout', label: 'Checkout' },
            { id: 'gold-2', pageType: 'upsell', label: 'Upsell 1' },
            { id: 'gold-3', pageType: 'upsell', label: 'Upsell 2' },
            { id: 'gold-4', pageType: 'register', label: 'Register' },
          ],
        },
      ],
      created_at: now,
      updated_at: now,
    };

    db.funnels.push(funnel);
    await this.writeDatabase(db);
    return { success: true, data: funnel };
  }

  /** Update an entire funnel (tiers, steps, name, etc.) */
  async updateFunnel(id: number, updates: Partial<Pick<Funnel, 'name' | 'description' | 'tiers'>>): Promise<{ success: boolean; data: Funnel }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const idx = db.funnels.findIndex(f => f.id === id);
    if (idx === -1) throw new NotFoundException(`Funnel ${id} not found`);

    const funnel = db.funnels[idx];
    if (updates.name !== undefined) funnel.name = updates.name;
    if (updates.description !== undefined) funnel.description = updates.description;
    if (updates.tiers !== undefined) funnel.tiers = updates.tiers;
    funnel.updated_at = new Date().toISOString();

    db.funnels[idx] = funnel;
    await this.writeDatabase(db);
    return { success: true, data: funnel };
  }

  /** Delete a funnel */
  async deleteFunnel(id: number): Promise<{ success: boolean }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const idx = db.funnels.findIndex(f => f.id === id);
    if (idx === -1) throw new NotFoundException(`Funnel ${id} not found`);
    db.funnels.splice(idx, 1);
    await this.writeDatabase(db);
    return { success: true };
  }

  /** Add a tier to a funnel */
  async addTier(funnelId: number, tier: FunnelTier): Promise<{ success: boolean; data: Funnel }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const idx = db.funnels.findIndex(f => f.id === funnelId);
    if (idx === -1) throw new NotFoundException(`Funnel ${funnelId} not found`);

    db.funnels[idx].tiers.push(tier);
    db.funnels[idx].updated_at = new Date().toISOString();
    await this.writeDatabase(db);
    return { success: true, data: db.funnels[idx] };
  }

  /** Remove a tier from a funnel */
  async removeTier(funnelId: number, tierId: string): Promise<{ success: boolean; data: Funnel }> {
    const db = await this.readDatabase();
    if (!db.funnels) db.funnels = [];
    const idx = db.funnels.findIndex(f => f.id === funnelId);
    if (idx === -1) throw new NotFoundException(`Funnel ${funnelId} not found`);

    db.funnels[idx].tiers = db.funnels[idx].tiers.filter(t => t.id !== tierId);
    db.funnels[idx].updated_at = new Date().toISOString();
    await this.writeDatabase(db);
    return { success: true, data: db.funnels[idx] };
  }
}
