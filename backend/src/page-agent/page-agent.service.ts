import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

/**
 * Defines a single backend task that needs to be completed
 */
export interface BackendTask {
  id: string;
  category: 'database' | 'api' | 'integration' | 'security' | 'data';
  title: string;
  description: string;
  status: 'pending' | 'done' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  /**
   * If the task can be auto-implemented, this contains the implementation details
   */
  implementation?: {
    type: 'db_seed' | 'api_route' | 'config' | 'schema';
    payload: Record<string, any>;
  };
}

export interface AnalysisResult {
  pageType: string;
  pageTitle: string;
  summary: string;
  tasks: BackendTask[];
  completedCount: number;
  totalCount: number;
}

export interface ImplementResult {
  success: boolean;
  taskId: string;
  message: string;
  details?: Record<string, any>;
}

export interface AgentChatResult {
  success: boolean;
  message: string;
  tasks?: BackendTask[];
  actions?: ImplementResult[];
}

@Injectable()
export class PageAgentService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      if (!this.db.exists()) return null;
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name === provider);
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch {
      return null;
    }
  }

  private readDatabase(): any {
    return this.db.readSync();
  }

  private writeDatabase(data: any): void {
    this.db.writeSync(data);
  }

  // ─── Core analysis: examine a page's content_json and determine what backend work is needed ───

  analyzePage(appId: number, pageId: number): AnalysisResult {
    const db = this.readDatabase();
    const page = (db.pages || []).find((p: any) => p.id === pageId && p.app_id === appId);

    if (!page) {
      return {
        pageType: 'unknown',
        pageTitle: 'Unknown',
        summary: 'Page not found.',
        tasks: [],
        completedCount: 0,
        totalCount: 0,
      };
    }

    const content = page.content_json || {};
    const tasks: BackendTask[] = [];

    // Analyze based on page type
    switch (page.page_type) {
      case 'admin':
        this.analyzeAdminPage(content, db, appId, tasks);
        break;
      case 'checkout':
        this.analyzeCheckoutPage(content, db, appId, tasks);
        break;
      case 'members':
        this.analyzeMembersPage(content, db, appId, tasks);
        break;
      case 'index':
        this.analyzeIndexPage(content, db, appId, tasks);
        break;
      case 'thanks':
        this.analyzeThanksPage(content, db, appId, tasks);
        break;
      default:
        this.analyzeGenericPage(content, db, appId, tasks);
    }

    const completedCount = tasks.filter(t => t.status === 'done').length;

    return {
      pageType: page.page_type,
      pageTitle: page.title,
      summary: this.generateSummary(page.page_type, tasks),
      tasks,
      completedCount,
      totalCount: tasks.length,
    };
  }

  // ─── Admin page analysis ───

  private analyzeAdminPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    // KPI data – needs real revenue, users, signups, churn tracking
    if (content.kpis) {
      const hasUsers = (db.users || []).length > 0;
      const hasSubscriptions = (db.subscriptions || []).filter((s: any) => s.app_id === appId).length > 0;

      tasks.push({
        id: 'admin-kpi-users',
        category: 'database',
        title: 'Seed user records',
        description: 'The KPI panel shows user counts. Create real user records in the database so the dashboard can query actual data instead of hardcoded numbers.',
        status: hasUsers ? 'done' : 'pending',
        priority: 'high',
        implementation: {
          type: 'db_seed',
          payload: {
            table: 'users',
            records: [
              { email: 'sarah@startup.io', name: 'Sarah Chen' },
              { email: 'marcus@scale.co', name: 'Marcus Johnson' },
              { email: 'emily@dev.studio', name: 'Emily Rodriguez' },
              { email: 'david@cloud.io', name: 'David Park' },
              { email: 'lisa@growth.co', name: 'Lisa Wang' },
            ],
          },
        },
      });

      tasks.push({
        id: 'admin-kpi-subscriptions',
        category: 'database',
        title: 'Create subscription records',
        description: 'Wire up subscriptions so revenue and churn KPIs pull from real data. Needs plan and subscription records for this app.',
        status: hasSubscriptions ? 'done' : 'pending',
        priority: 'high',
        implementation: {
          type: 'db_seed',
          payload: {
            table: 'subscriptions',
            records: [
              { plan: 'Enterprise', status: 'active' },
              { plan: 'Professional', status: 'active' },
              { plan: 'Professional', status: 'active' },
              { plan: 'Starter', status: 'free' },
              { plan: 'Professional', status: 'cancelled' },
            ],
          },
        },
      });

      tasks.push({
        id: 'admin-kpi-api',
        category: 'api',
        title: 'KPI aggregation API route',
        description: 'Create GET /api/apps/:id/kpis endpoint that calculates total revenue, active users, new signups (last 30 days), and churn rate from real database records.',
        status: this.routeExists(db, appId, 'kpis') ? 'done' : 'pending',
        priority: 'high',
      });
    }

    // Revenue chart – needs time-series data
    if (content.revenue_chart) {
      const hasUsage = (db.app_usage || []).filter((u: any) => u.app_id === appId).length > 0;
      tasks.push({
        id: 'admin-revenue-data',
        category: 'data',
        title: 'Revenue time-series data',
        description: 'Seed monthly revenue data into app_usage so the revenue chart renders real figures instead of static placeholder values.',
        status: hasUsage ? 'done' : 'pending',
        priority: 'medium',
        implementation: {
          type: 'db_seed',
          payload: {
            table: 'app_usage',
            records: this.generateMonthlyRevenue(appId),
          },
        },
      });
    }

    // Recent users table
    if (content.recent_users) {
      tasks.push({
        id: 'admin-recent-users-api',
        category: 'api',
        title: 'Recent users API endpoint',
        description: 'Create GET /api/apps/:id/recent-users that returns the latest registered users with their subscription plan and status.',
        status: this.routeExists(db, appId, 'recent-users') ? 'done' : 'pending',
        priority: 'medium',
      });
    }

    // System health
    if (content.system_health) {
      tasks.push({
        id: 'admin-health-check',
        category: 'integration',
        title: 'System health monitoring',
        description: 'Wire up real health checks for API server, database connectivity, CDN status, and email service so the admin dashboard shows live system status.',
        status: 'pending',
        priority: 'low',
      });
    }
  }

  // ─── Checkout page analysis ───

  private analyzeCheckoutPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    const appPlans = (db.plans || []).filter((p: any) => p.app_id === appId);

    if (content.plans) {
      tasks.push({
        id: 'checkout-plans-db',
        category: 'database',
        title: 'Create plan records in database',
        description: `The checkout page shows ${content.plans.length} pricing plans. Create matching plan records in the database with correct prices and features.`,
        status: appPlans.length >= (content.plans?.length || 0) ? 'done' : 'pending',
        priority: 'high',
        implementation: {
          type: 'db_seed',
          payload: {
            table: 'plans',
            records: (content.plans || []).map((p: any) => ({
              name: p.name,
              price: parseFloat((p.price || '$0').replace(/[^0-9.]/g, '')) || 0,
              billing_period: 'monthly',
              features_json: { features: p.features || [] },
            })),
          },
        },
      });
    }

    if (content.payment_form) {
      tasks.push({
        id: 'checkout-stripe',
        category: 'integration',
        title: 'Stripe payment integration',
        description: 'Connect the payment form to Stripe. Create a POST /api/apps/:id/checkout endpoint that creates a Stripe checkout session and returns a client secret.',
        status: 'pending',
        priority: 'high',
      });

      tasks.push({
        id: 'checkout-webhook',
        category: 'integration',
        title: 'Payment webhook handler',
        description: 'Add POST /api/webhooks/stripe endpoint to handle payment confirmations, update subscription status, and send confirmation emails.',
        status: 'pending',
        priority: 'high',
      });
    }

    if (content.trust_badges) {
      tasks.push({
        id: 'checkout-ssl',
        category: 'security',
        title: 'SSL & security compliance',
        description: 'Verify SSL certificate is configured, confirm PCI-compliant payment flow — ensure card data never touches your server (use Stripe Elements).',
        status: 'pending',
        priority: 'medium',
      });
    }
  }

  // ─── Members page analysis ───

  private analyzeMembersPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    const hasUsers = (db.users || []).length > 0;

    tasks.push({
      id: 'members-auth',
      category: 'security',
      title: 'User authentication',
      description: 'Implement login/signup flow with JWT tokens. The members area needs to know who the logged-in user is to show personalised content.',
      status: 'pending',
      priority: 'high',
    });

    tasks.push({
      id: 'members-profile-api',
      category: 'api',
      title: 'User profile API',
      description: 'Create GET /api/apps/:id/me endpoint that returns the current user\'s profile, plan, streak, and course progress.',
      status: 'pending',
      priority: 'high',
    });

    if (content.courses) {
      tasks.push({
        id: 'members-courses-db',
        category: 'database',
        title: 'Course / content records',
        description: `Create a course content table and seed ${content.courses.length} courses with lessons so the members dashboard shows real progress.`,
        status: 'pending',
        priority: 'medium',
        implementation: {
          type: 'db_seed',
          payload: {
            table: 'courses',
            records: (content.courses || []).map((c: any) => ({
              title: c.title,
              total_lessons: parseInt((c.lessons || '0').split('/').pop()) || 8,
            })),
          },
        },
      });

      tasks.push({
        id: 'members-progress-api',
        category: 'api',
        title: 'Course progress API',
        description: 'Create GET/PUT /api/apps/:id/courses/:courseId/progress to track and update lesson completion per user.',
        status: 'pending',
        priority: 'medium',
      });
    }

    if (content.stats) {
      tasks.push({
        id: 'members-stats-api',
        category: 'api',
        title: 'Member statistics API',
        description: 'Create GET /api/apps/:id/member-stats that returns plan info, completion stats, and streak data for the logged-in user.',
        status: 'pending',
        priority: 'medium',
      });
    }
  }

  // ─── Index/landing page analysis ───

  private analyzeIndexPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    if (content.features_section) {
      tasks.push({
        id: 'index-features-api',
        category: 'api',
        title: 'Dynamic features API',
        description: 'Optionally, create GET /api/apps/:id/features endpoint so feature list can be managed from the admin panel rather than hardcoded in JSON.',
        status: 'pending',
        priority: 'low',
      });
    }

    if (content.stats) {
      tasks.push({
        id: 'index-stats-api',
        category: 'api',
        title: 'Live stats aggregation',
        description: 'Create GET /api/apps/:id/public-stats that returns real active user count, uptime SLA, and revenue figures for the landing page social proof.',
        status: 'pending',
        priority: 'medium',
      });
    }

    if (content.hero?.cta_primary) {
      tasks.push({
        id: 'index-signup-flow',
        category: 'api',
        title: 'Signup/registration endpoint',
        description: 'Create POST /api/apps/:id/signup to handle the "Start Building Free" CTA — creates a user record and starts a free-tier subscription.',
        status: 'pending',
        priority: 'high',
      });
    }

    if (content.cta_footer) {
      tasks.push({
        id: 'index-email-capture',
        category: 'integration',
        title: 'Email capture & welcome email',
        description: 'Wire up the footer CTA to create a user, trigger a welcome email via n8n workflow, and redirect to the members area.',
        status: 'pending',
        priority: 'medium',
      });
    }
  }

  // ─── Thank-you page analysis ───

  private analyzeThanksPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    if (content.order_confirmation) {
      tasks.push({
        id: 'thanks-confirmation-api',
        category: 'api',
        title: 'Order confirmation API',
        description: 'Create GET /api/apps/:id/order/:orderId that returns the actual plan name, billing amount, and confirmation number for a completed purchase.',
        status: 'pending',
        priority: 'high',
      });
    }

    if (content.email_notification) {
      tasks.push({
        id: 'thanks-email',
        category: 'integration',
        title: 'Confirmation email trigger',
        description: 'Wire up an n8n workflow to send a confirmation email when the user lands on the thank-you page (triggered by webhook or subscription event).',
        status: 'pending',
        priority: 'medium',
      });
    }

    if (content.next_steps) {
      tasks.push({
        id: 'thanks-onboarding',
        category: 'api',
        title: 'Onboarding checklist API',
        description: 'Create GET/PUT /api/apps/:id/onboarding that tracks which onboarding steps the user has completed and returns progress.',
        status: 'pending',
        priority: 'low',
      });
    }
  }

  // ─── Generic page analysis ───

  private analyzeGenericPage(content: any, db: any, appId: number, tasks: BackendTask[]): void {
    tasks.push({
      id: 'generic-data-api',
      category: 'api',
      title: 'Page data API',
      description: 'Create a generic GET /api/apps/:id/page-data/:pageType endpoint to serve dynamic content for this custom page.',
      status: 'pending',
      priority: 'low',
    });
  }

  // ─── Implement a specific task ───

  implementTask(appId: number, pageId: number, taskId: string): ImplementResult {
    const analysis = this.analyzePage(appId, pageId);
    const task = analysis.tasks.find(t => t.id === taskId);

    if (!task) {
      return { success: false, taskId, message: `Task "${taskId}" not found.` };
    }

    if (task.status === 'done') {
      return { success: true, taskId, message: `Task "${task.title}" is already completed.` };
    }

    if (!task.implementation) {
      return {
        success: false,
        taskId,
        message: `Task "${task.title}" requires manual implementation. ${task.description}`,
      };
    }

    // Execute the implementation
    try {
      switch (task.implementation.type) {
        case 'db_seed':
          return this.executeSeed(appId, task);
        default:
          return { success: false, taskId, message: `Implementation type "${task.implementation.type}" is not yet supported.` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, taskId, message: `Failed to implement: ${msg}` };
    }
  }

  // ─── Auto-implement all pending tasks that have implementations ───

  implementAll(appId: number, pageId: number): ImplementResult[] {
    const analysis = this.analyzePage(appId, pageId);
    const results: ImplementResult[] = [];

    for (const task of analysis.tasks) {
      if (task.status === 'pending' && task.implementation) {
        results.push(this.implementTask(appId, pageId, task.id));
      }
    }

    return results;
  }

  // ─── Execute a database seed ───

  private executeSeed(appId: number, task: BackendTask): ImplementResult {
    const db = this.readDatabase();
    const payload = task.implementation!.payload;
    const table = payload.table as string;
    const records = payload.records as any[];

    if (!db[table]) {
      db[table] = [];
    }

    const maxId = Math.max(0, ...(db[table] as any[]).map((r: any) => r.id || 0));
    let nextId = maxId + 1;
    const created: any[] = [];

    for (const record of records) {
      const newRecord: any = {
        id: nextId++,
        app_id: appId,
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Resolve user_id references for subscriptions
      if (table === 'subscriptions') {
        const users = db.users || [];
        const plans = (db.plans || []).filter((p: any) => p.app_id === appId);

        if (users.length > 0 && plans.length > 0) {
          const userIndex = Math.min(created.length, users.length - 1);
          const planMatch = plans.find((p: any) => p.name === record.plan) || plans[0];
          newRecord.user_id = users[userIndex]?.id || 1;
          newRecord.plan_id = planMatch?.id || plans[0]?.id || 1;
          delete newRecord.plan;
        }
      }

      db[table].push(newRecord);
      created.push(newRecord);
    }

    db.last_updated = new Date().toISOString();
    this.writeDatabase(db);

    return {
      success: true,
      taskId: task.id,
      message: `Created ${created.length} ${table} record(s) for this app.`,
      details: { table, count: created.length, ids: created.map(r => r.id) },
    };
  }

  // ─── AI-powered chat for backend tasks ───

  async chat(
    appId: number,
    pageId: number,
    message: string,
    apiProvider: string,
    model?: string,
  ): Promise<AgentChatResult> {
    // First, run the analysis so the AI has context
    const analysis = this.analyzePage(appId, pageId);
    const db = this.readDatabase();
    const page = (db.pages || []).find((p: any) => p.id === pageId);

    // Check for quick commands
    const lowerMsg = message.toLowerCase().trim();

    if (lowerMsg.includes('what needs') || lowerMsg.includes('what tasks') || lowerMsg.includes('what backend') || lowerMsg.includes('analyse') || lowerMsg.includes('analyze') || lowerMsg.includes('scan') || lowerMsg.includes('status')) {
      return {
        success: true,
        message: this.formatAnalysisMessage(analysis),
        tasks: analysis.tasks,
      };
    }

    if (lowerMsg.includes('implement all') || lowerMsg.includes('do everything') || lowerMsg.includes('run all') || lowerMsg.includes('fix all') || lowerMsg.includes('set up everything')) {
      const results = this.implementAll(appId, pageId);
      const successCount = results.filter(r => r.success).length;
      const updatedAnalysis = this.analyzePage(appId, pageId);

      return {
        success: true,
        message: `Implemented ${successCount}/${results.length} auto-tasks.\n\n${results.map(r => `${r.success ? '✅' : '⚠️'} ${r.message}`).join('\n')}\n\n${this.formatRemainingTasks(updatedAnalysis)}`,
        tasks: updatedAnalysis.tasks,
        actions: results,
      };
    }

    // Check if they're asking to implement a specific task
    const matchedTask = analysis.tasks.find(t =>
      lowerMsg.includes(t.id) || lowerMsg.includes(t.title.toLowerCase()),
    );

    if (matchedTask && (lowerMsg.includes('implement') || lowerMsg.includes('create') || lowerMsg.includes('set up') || lowerMsg.includes('do '))) {
      const result = this.implementTask(appId, pageId, matchedTask.id);
      const updatedAnalysis = this.analyzePage(appId, pageId);

      return {
        success: true,
        message: `${result.success ? '✅' : '⚠️'} ${result.message}\n\n${this.formatRemainingTasks(updatedAnalysis)}`,
        tasks: updatedAnalysis.tasks,
        actions: [result],
      };
    }

    // Fall through to AI for complex questions
    const apiKey = this.getApiKey(apiProvider);
    if (!apiKey) {
      // No API key — provide rule-based response
      return {
        success: true,
        message: this.formatAnalysisMessage(analysis),
        tasks: analysis.tasks,
      };
    }

    return this.askAI(apiKey, apiProvider, model || 'gpt-4', message, analysis, page);
  }

  // ─── Ask AI about backend tasks ───

  private async askAI(
    apiKey: string,
    provider: string,
    model: string,
    message: string,
    analysis: AnalysisResult,
    page: any,
  ): Promise<AgentChatResult> {
    const systemPrompt = `You are a Backend Agent for a SaaS page builder. Your job is to tell the user what backend work is needed to make their pages functional.

Current page: "${analysis.pageTitle}" (type: ${analysis.pageType})
Page content_json: ${JSON.stringify(page?.content_json || {}, null, 2).substring(0, 2000)}

Current backend task analysis:
${analysis.tasks.map(t => `- [${t.status.toUpperCase()}] (${t.priority}) ${t.title}: ${t.description}`).join('\n')}

Progress: ${analysis.completedCount}/${analysis.totalCount} tasks complete.

Database tables available: apps, pages, plans, users, subscriptions, app_settings, api_keys, workflows, workflow_configs, app_usage.

Your rules:
1. Be concise and practical. Explain what each task does and why it matters.
2. If the user asks to implement something, tell them which task IDs they can auto-implement (those with implementations) and which require manual coding.
3. Suggest concrete next steps.
4. Format responses clearly with task status icons: ✅ done, 🔲 pending, 🔧 in-progress.
5. Do NOT return JSON. Return human-readable text.`;

    try {
      const endpoint = provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'http://localhost:3000';
        headers['X-Title'] = 'n8n Surface Backend Agent';
      }

      const response = await axios.post(
        endpoint,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.5,
          max_tokens: 1200,
        },
        { headers, timeout: 30000 },
      );

      const aiMessage = response.data.choices?.[0]?.message?.content;
      return {
        success: true,
        message: aiMessage || 'No response from AI.',
        tasks: analysis.tasks,
      };
    } catch (err) {
      // Fallback to rule-based
      return {
        success: true,
        message: this.formatAnalysisMessage(analysis),
        tasks: analysis.tasks,
      };
    }
  }

  // ─── Formatting helpers ───

  private formatAnalysisMessage(analysis: AnalysisResult): string {
    if (analysis.tasks.length === 0) {
      return `No backend tasks detected for the "${analysis.pageTitle}" page.`;
    }

    const byCategory: Record<string, BackendTask[]> = {};
    for (const t of analysis.tasks) {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t);
    }

    const categoryLabels: Record<string, string> = {
      database: '🗄️ Database',
      api: '🔌 API Routes',
      integration: '🔗 Integrations',
      security: '🔒 Security',
      data: '📊 Data',
    };

    let msg = `**Backend Analysis: ${analysis.pageTitle}** (${analysis.pageType})\n`;
    msg += `Progress: ${analysis.completedCount}/${analysis.totalCount} tasks complete\n\n`;

    for (const [cat, tasks] of Object.entries(byCategory)) {
      msg += `${categoryLabels[cat] || cat}\n`;
      for (const t of tasks) {
        const icon = t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔧' : '🔲';
        const autoTag = t.implementation ? ' ⚡' : '';
        msg += `  ${icon} ${t.title}${autoTag}\n     ${t.description}\n`;
      }
      msg += '\n';
    }

    const autoCount = analysis.tasks.filter(t => t.status === 'pending' && t.implementation).length;
    if (autoCount > 0) {
      msg += `\n⚡ ${autoCount} task(s) can be auto-implemented. Say "implement all" to run them.`;
    }

    return msg;
  }

  private formatRemainingTasks(analysis: AnalysisResult): string {
    const remaining = analysis.tasks.filter(t => t.status !== 'done');
    if (remaining.length === 0) return '🎉 All backend tasks are complete!';

    let msg = `**Remaining tasks (${remaining.length}):**\n`;
    for (const t of remaining) {
      const autoTag = t.implementation ? ' ⚡' : ' (manual)';
      msg += `  🔲 ${t.title}${autoTag}\n`;
    }
    return msg;
  }

  private generateSummary(pageType: string, tasks: BackendTask[]): string {
    const pending = tasks.filter(t => t.status !== 'done').length;
    const auto = tasks.filter(t => t.status !== 'done' && t.implementation).length;
    if (tasks.length === 0) return 'No backend tasks detected.';
    if (pending === 0) return `All ${tasks.length} backend tasks are complete. This page is fully wired up!`;
    return `${pending} of ${tasks.length} backend tasks need attention for this ${pageType} page. ${auto > 0 ? `${auto} can be auto-implemented.` : ''}`;
  }

  // ─── Utility ───

  private routeExists(_db: any, _appId: number, _routeSuffix: string): boolean {
    // In a real system this would check registered routes
    // For now, return false — these endpoints don't exist yet
    return false;
  }

  private generateMonthlyRevenue(appId: number): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      usage_type: `revenue_${month.toLowerCase()}`,
      usage_count: Math.floor(3000 + Math.random() * 5000),
    }));
  }
}
