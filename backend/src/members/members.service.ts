import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import * as crypto from 'crypto';

/**
 * ════════════════════════════════════════════════════════════════
 * MEMBERS API CONVENTION (shared contract between frontend ↔ backend)
 * ════════════════════════════════════════════════════════════════
 *
 * These routes are a FIXED convention. Every generated register page
 * and admin panel uses them by substituting the app ID.
 *
 *  POST   /api/apps/:appId/members/register   — sign-up a new member
 *  GET    /api/apps/:appId/members             — list all members + tier
 *  DELETE /api/apps/:appId/members/:userId     — remove a member
 *  PATCH  /api/apps/:appId/members/:userId     — update status / plan
 *
 * Frontend templates reference these routes via:
 *   `${API}/api/apps/${appId}/members/register`  (register page)
 *   `${API}/api/apps/${appId}/members`            (admin panel)
 *
 * Because the convention is fixed, frontend pages and backend endpoints
 * can be generated at different times and still agree on the contract.
 * ════════════════════════════════════════════════════════════════
 */

export interface MemberWithPlan {
  id: number;
  app_id: number;
  name: string;
  email: string;
  plan_name: string;
  plan_price: number;
  status: string;         // 'active' | 'cancelled' | 'past_due' | 'free' | 'disabled'
  created_at: string;
  subscription_id?: number;
}

export interface RegisterDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  plan_id?: number;       // optional — defaults to the app's free plan
}

@Injectable()
export class MembersService {
  constructor(private readonly db: DatabaseService) {}

  // ── List all members for an app ──────────────────────────────────
  async listMembers(appId: number): Promise<MemberWithPlan[]> {
    const data = await this.db.read();
    const subs = (data.subscriptions || []).filter(
      (s: any) => s.app_id === appId,
    );
    const users: any[] = data.users || [];
    const plans: any[] = data.plans || [];

    return subs.map((sub: any) => {
      const user = users.find((u: any) => u.id === sub.user_id) || {};
      const plan = plans.find((p: any) => p.id === sub.plan_id) || {};
      return {
        id: user.id ?? sub.user_id,
        app_id: appId,
        name: user.name || 'Unknown',
        email: user.email || '',
        plan_name: plan.name || 'Free',
        plan_price: plan.price ?? 0,
        status: sub.status || 'active',
        created_at: user.created_at || sub.created_at || new Date().toISOString(),
        subscription_id: sub.id,
      };
    });
  }

  // ── Register a new member ────────────────────────────────────────
  async register(appId: number, dto: RegisterDto): Promise<MemberWithPlan> {
    const data = await this.db.read();

    // Ensure arrays exist
    data.users = data.users || [];
    data.subscriptions = data.subscriptions || [];
    data.plans = data.plans || [];

    // Check duplicate email within this app
    const existingUser = data.users.find(
      (u: any) => u.email?.toLowerCase() === dto.email.toLowerCase(),
    );
    if (existingUser) {
      const alreadySubscribed = data.subscriptions.some(
        (s: any) => s.user_id === existingUser.id && s.app_id === appId,
      );
      if (alreadySubscribed) {
        throw new ConflictException('A member with this email already exists');
      }
    }

    // Resolve plan — use provided plan_id or default to cheapest (free) plan
    let plan: any;
    if (dto.plan_id) {
      plan = data.plans.find(
        (p: any) => p.id === dto.plan_id && p.app_id === appId,
      );
    }
    if (!plan) {
      // Find the free/cheapest plan for this app
      const appPlans = data.plans
        .filter((p: any) => p.app_id === appId)
        .sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
      plan = appPlans[0];
    }

    const now = new Date().toISOString();

    // Create (or re-use) user record
    let user = existingUser;
    if (!user) {
      const maxUserId = Math.max(0, ...data.users.filter((u: any) => typeof u.id === 'number').map((u: any) => u.id));
      user = {
        id: maxUserId + 1,
        email: dto.email.toLowerCase().trim(),
        name: `${dto.first_name} ${dto.last_name}`.trim(),
        password_hash: this.hashPassword(dto.password),
        created_at: now,
        updated_at: now,
      };
      data.users.push(user);
    }

    // Create subscription
    const maxSubId = Math.max(
      0,
      ...data.subscriptions.map((s: any) => s.id || 0),
    );
    const subscription: any = {
      id: maxSubId + 1,
      user_id: user.id,
      app_id: appId,
      plan_id: plan?.id ?? 0,
      status: (plan?.price ?? 0) === 0 ? 'free' : 'active',
      created_at: now,
      updated_at: now,
    };
    data.subscriptions.push(subscription);

    await this.db.write(data);

    return {
      id: user.id,
      app_id: appId,
      name: user.name,
      email: user.email,
      plan_name: plan?.name || 'Free',
      plan_price: plan?.price ?? 0,
      status: subscription.status,
      created_at: user.created_at,
      subscription_id: subscription.id,
    };
  }

  // ── Delete a member (remove subscription, optionally remove user) ─
  async deleteMember(appId: number, userId: number): Promise<void> {
    const data = await this.db.read();
    data.subscriptions = data.subscriptions || [];

    const idx = data.subscriptions.findIndex(
      (s: any) => s.app_id === appId && s.user_id === userId,
    );
    if (idx === -1) {
      throw new NotFoundException('Member not found in this app');
    }

    // Remove subscription for this app
    data.subscriptions.splice(idx, 1);

    // If the user has no other subscriptions, remove user record too
    const otherSubs = data.subscriptions.filter(
      (s: any) => s.user_id === userId,
    );
    if (otherSubs.length === 0) {
      data.users = (data.users || []).filter((u: any) => u.id !== userId);
    }

    await this.db.write(data);
  }

  // ── Update member status (disable / re-enable / change plan) ──────
  async updateMember(
    appId: number,
    userId: number,
    update: { status?: string; plan_id?: number },
  ): Promise<MemberWithPlan> {
    const data = await this.db.read();
    data.subscriptions = data.subscriptions || [];

    const sub = data.subscriptions.find(
      (s: any) => s.app_id === appId && s.user_id === userId,
    );
    if (!sub) {
      throw new NotFoundException('Member not found in this app');
    }

    if (update.status) sub.status = update.status;
    if (update.plan_id) sub.plan_id = update.plan_id;
    sub.updated_at = new Date().toISOString();

    await this.db.write(data);

    const user = (data.users || []).find((u: any) => u.id === userId) || {};
    const plan = (data.plans || []).find((p: any) => p.id === sub.plan_id) || {};
    return {
      id: user.id ?? userId,
      app_id: appId,
      name: user.name || 'Unknown',
      email: user.email || '',
      plan_name: plan.name || 'Free',
      plan_price: plan.price ?? 0,
      status: sub.status,
      created_at: user.created_at || sub.created_at,
      subscription_id: sub.id,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
