import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import axios from 'axios';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

export interface PageView {
  id?: string;
  app_id: number;
  page_title: string;
  page_url: string;
  visitor_id: string;
  timestamp: string;
  referrer?: string;
  user_agent?: string;
  location?: string;
}

export interface ErrorLog {
  id: string;
  source: 'backend' | 'frontend' | 'n8n' | 'api';
  severity: 'error' | 'warning' | 'critical';
  message: string;
  stack?: string;
  endpoint?: string;
  statusCode?: number;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface ApiUsageEntry {
  id: string;
  provider: 'anthropic' | 'openai' | 'openrouter' | 'n8n' | 'other';
  endpoint: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  duration?: number;
  statusCode: number;
  success: boolean;
  timestamp: string;
  module: string;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'success' | 'error' | 'waiting' | 'running';
  startedAt: string;
  stoppedAt?: string;
  error?: string;
  mode?: string;
}

export interface AnalyticsData {
  analytics: PageView[];
  errorLogs?: ErrorLog[];
  apiUsage?: ApiUsageEntry[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async trackPageView(pageView: PageView): Promise<PageView> {
    const database = await this.readDatabase();
    
    if (!database.analytics) {
      database.analytics = [];
    }

    // Add generated ID and timestamp if not present
    const newPageView: PageView = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...pageView,
      timestamp: pageView.timestamp || new Date().toISOString(),
    };

    database.analytics.push(newPageView);
    await this.writeDatabase(database);
    
    return newPageView;
  }

  async getAppAnalytics(appId: number) {
    const database = await this.readDatabase();
    const analytics = (database.analytics || []) as PageView[];
    
    // Filter by app_id
    const appAnalytics = analytics.filter((view: PageView) => view.app_id === appId);
    
    // Calculate summary stats
    const uniqueVisitors = new Set(appAnalytics.map((v: PageView) => v.visitor_id)).size;
    const totalPageViews = appAnalytics.length;
    const pageStats: { [key: string]: number } = {};
    
    appAnalytics.forEach((view: PageView) => {
      pageStats[view.page_title] = (pageStats[view.page_title] || 0) + 1;
    });

    // Get data by date for graph
    const viewsByDate: { [key: string]: number } = {};
    appAnalytics.forEach((view: PageView) => {
      const date = view.timestamp.split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    return {
      app_id: appId,
      total_page_views: totalPageViews,
      unique_visitors: uniqueVisitors,
      page_stats: pageStats,
      views_by_date: viewsByDate,
      recent_views: appAnalytics.slice(-20).reverse(),
    };
  }

  async getAllAppsAnalytics() {
    const database = await this.readDatabase();
    const analytics = (database.analytics || []) as PageView[];
    const apps = database.apps || [];

    // Group analytics by app
    const appAnalytics: { [key: number]: any } = {};
    
    apps.forEach((app: any) => {
      const appViews = analytics.filter((view: PageView) => view.app_id === app.id);
      const uniqueVisitors = new Set(appViews.map((v: PageView) => v.visitor_id)).size;
      
      appAnalytics[app.id] = {
        app_id: app.id,
        app_name: app.name,
        app_slug: app.slug,
        total_page_views: appViews.length,
        unique_visitors: uniqueVisitors,
      };
    });

    // Sort by page views descending
    const sorted = Object.values(appAnalytics).sort(
      (a: any, b: any) => b.total_page_views - a.total_page_views
    );

    return {
      total_apps: apps.length,
      total_page_views: analytics.length,
      total_unique_visitors: new Set(analytics.map((v: PageView) => v.visitor_id)).size,
      apps: sorted,
    };
  }

  async getVisitorList(appId: number) {
    const database = await this.readDatabase();
    const analytics = (database.analytics || []) as PageView[];
    
    const appAnalytics = analytics.filter((view: PageView) => view.app_id === appId);
    
    // Group by visitor
    const visitors: { [key: string]: any } = {};
    
    appAnalytics.forEach((view: PageView) => {
      if (!visitors[view.visitor_id]) {
        visitors[view.visitor_id] = {
          visitor_id: view.visitor_id,
          first_visit: view.timestamp,
          last_visit: view.timestamp,
          page_views: 0,
          pages: [],
        };
      }
      visitors[view.visitor_id].last_visit = view.timestamp;
      visitors[view.visitor_id].page_views += 1;
      if (!visitors[view.visitor_id].pages.includes(view.page_title)) {
        visitors[view.visitor_id].pages.push(view.page_title);
      }
    });

    // Convert to array and sort by last_visit
    const visitorArray = Object.values(visitors).sort(
      (a: any, b: any) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
    );

    return visitorArray;
  }

  async deleteOldAnalytics(days: number = 90): Promise<number> {
    const database = await this.readDatabase();
    const analytics = (database.analytics || []) as PageView[];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const before = analytics.length;
    database.analytics = analytics.filter(
      (view: PageView) => new Date(view.timestamp) > cutoffDate
    );
    
    await this.writeDatabase(database);
    
    return before - database.analytics.length;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ERROR LOGGING
  // ══════════════════════════════════════════════════════════════════════

  async logError(error: Partial<ErrorLog>): Promise<ErrorLog> {
    const database = await this.readDatabase();
    if (!database.errorLogs) database.errorLogs = [];

    const entry: ErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      source: error.source || 'backend',
      severity: error.severity || 'error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      endpoint: error.endpoint,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: error.metadata,
    };

    database.errorLogs.push(entry);
    // Keep last 500 errors
    if (database.errorLogs.length > 500) {
      database.errorLogs = database.errorLogs.slice(-500);
    }
    await this.writeDatabase(database);
    return entry;
  }

  async getErrors(filters?: { source?: string; severity?: string; resolved?: boolean; limit?: number }): Promise<{
    errors: ErrorLog[];
    summary: { total: number; critical: number; errors: number; warnings: number; unresolved: number; bySource: Record<string, number> };
  }> {
    const database = await this.readDatabase();
    let errors: ErrorLog[] = database.errorLogs || [];

    if (filters?.source) errors = errors.filter(e => e.source === filters.source);
    if (filters?.severity) errors = errors.filter(e => e.severity === filters.severity);
    if (filters?.resolved !== undefined) errors = errors.filter(e => e.resolved === filters.resolved);

    const allErrors: ErrorLog[] = database.errorLogs || [];
    const summary = {
      total: allErrors.length,
      critical: allErrors.filter(e => e.severity === 'critical').length,
      errors: allErrors.filter(e => e.severity === 'error').length,
      warnings: allErrors.filter(e => e.severity === 'warning').length,
      unresolved: allErrors.filter(e => !e.resolved).length,
      bySource: allErrors.reduce((acc: Record<string, number>, e) => {
        acc[e.source] = (acc[e.source] || 0) + 1;
        return acc;
      }, {}),
    };

    const limit = filters?.limit || 100;
    return { errors: errors.slice(-limit).reverse(), summary };
  }

  async resolveError(id: string): Promise<boolean> {
    const database = await this.readDatabase();
    const errors: ErrorLog[] = database.errorLogs || [];
    const idx = errors.findIndex(e => e.id === id);
    if (idx === -1) return false;
    errors[idx].resolved = true;
    database.errorLogs = errors;
    await this.writeDatabase(database);
    return true;
  }

  async clearErrors(source?: string): Promise<number> {
    const database = await this.readDatabase();
    const before = (database.errorLogs || []).length;
    if (source) {
      database.errorLogs = (database.errorLogs || []).filter((e: ErrorLog) => e.source !== source);
    } else {
      database.errorLogs = [];
    }
    await this.writeDatabase(database);
    return before - (database.errorLogs || []).length;
  }

  // ══════════════════════════════════════════════════════════════════════
  // API USAGE TRACKING
  // ══════════════════════════════════════════════════════════════════════

  async trackApiUsage(entry: Partial<ApiUsageEntry>): Promise<ApiUsageEntry> {
    const database = await this.readDatabase();
    if (!database.apiUsage) database.apiUsage = [];

    const record: ApiUsageEntry = {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      provider: entry.provider || 'other',
      endpoint: entry.endpoint || '',
      model: entry.model,
      tokensIn: entry.tokensIn || 0,
      tokensOut: entry.tokensOut || 0,
      cost: entry.cost || 0,
      duration: entry.duration || 0,
      statusCode: entry.statusCode || 200,
      success: entry.success !== false,
      timestamp: new Date().toISOString(),
      module: entry.module || 'unknown',
    };

    database.apiUsage.push(record);
    // Keep last 1000 entries
    if (database.apiUsage.length > 1000) {
      database.apiUsage = database.apiUsage.slice(-1000);
    }
    await this.writeDatabase(database);
    return record;
  }

  async getApiUsage(filters?: { provider?: string; module?: string; days?: number }): Promise<{
    entries: ApiUsageEntry[];
    summary: {
      totalCalls: number; successRate: number; totalTokens: number;
      totalCost: number; avgDuration: number;
      byProvider: Record<string, { calls: number; tokens: number; cost: number }>;
      byModule: Record<string, { calls: number; tokens: number; cost: number }>;
      byDay: { date: string; calls: number; tokens: number; cost: number }[];
    };
  }> {
    const database = await this.readDatabase();
    let entries: ApiUsageEntry[] = database.apiUsage || [];

    if (filters?.provider) entries = entries.filter(e => e.provider === filters.provider);
    if (filters?.module) entries = entries.filter(e => e.module === filters.module);
    if (filters?.days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.days);
      entries = entries.filter(e => new Date(e.timestamp) > cutoff);
    }

    const allEntries = entries;
    const successCount = allEntries.filter(e => e.success).length;
    const totalTokens = allEntries.reduce((s, e) => s + (e.tokensIn || 0) + (e.tokensOut || 0), 0);
    const totalCost = allEntries.reduce((s, e) => s + (e.cost || 0), 0);
    const avgDuration = allEntries.length > 0
      ? allEntries.reduce((s, e) => s + (e.duration || 0), 0) / allEntries.length
      : 0;

    const byProvider: Record<string, { calls: number; tokens: number; cost: number }> = {};
    const byModule: Record<string, { calls: number; tokens: number; cost: number }> = {};
    const byDayMap: Record<string, { calls: number; tokens: number; cost: number }> = {};

    allEntries.forEach(e => {
      // By provider
      if (!byProvider[e.provider]) byProvider[e.provider] = { calls: 0, tokens: 0, cost: 0 };
      byProvider[e.provider].calls++;
      byProvider[e.provider].tokens += (e.tokensIn || 0) + (e.tokensOut || 0);
      byProvider[e.provider].cost += e.cost || 0;

      // By module
      if (!byModule[e.module]) byModule[e.module] = { calls: 0, tokens: 0, cost: 0 };
      byModule[e.module].calls++;
      byModule[e.module].tokens += (e.tokensIn || 0) + (e.tokensOut || 0);
      byModule[e.module].cost += e.cost || 0;

      // By day
      const day = e.timestamp.split('T')[0];
      if (!byDayMap[day]) byDayMap[day] = { calls: 0, tokens: 0, cost: 0 };
      byDayMap[day].calls++;
      byDayMap[day].tokens += (e.tokensIn || 0) + (e.tokensOut || 0);
      byDayMap[day].cost += e.cost || 0;
    });

    const byDay = Object.entries(byDayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      entries: allEntries.slice(-200).reverse(),
      summary: {
        totalCalls: allEntries.length,
        successRate: allEntries.length > 0 ? (successCount / allEntries.length) * 100 : 100,
        totalTokens,
        totalCost,
        avgDuration: Math.round(avgDuration),
        byProvider,
        byModule,
        byDay,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // N8N EXECUTION MONITORING
  // ══════════════════════════════════════════════════════════════════════

  async getN8nExecutions(): Promise<{
    executions: N8nExecution[];
    summary: { total: number; success: number; errors: number; running: number; errorRate: number };
  }> {
    try {
      const database = await this.readDatabase();
      const n8nUrl = database.n8nUrl || 'http://localhost:5678';
      let apiKey: string | null = null;

      // Try to get n8n API key from apiKeys
      const apiKeys = database.apiKeys || [];
      const n8nKeyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === 'n8n');
      if (n8nKeyEntry) {
        try { apiKey = this.cryptoService.decrypt(n8nKeyEntry.value); } catch { /* use without key */ }
      }
      // Fallback to legacy n8nApiKey
      if (!apiKey && database.n8nApiKey) {
        try { apiKey = this.cryptoService.decrypt(database.n8nApiKey); } catch { apiKey = database.n8nApiKey; }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-N8N-API-KEY'] = apiKey;

      const response = await axios.get(`${n8nUrl}/api/v1/executions`, {
        headers,
        params: { limit: 50 },
        timeout: 8000,
      });

      const rawExecutions = response.data?.data || response.data?.results || [];
      const executions: N8nExecution[] = rawExecutions.map((exec: any) => ({
        id: String(exec.id),
        workflowId: String(exec.workflowId || exec.workflowData?.id || ''),
        workflowName: exec.workflowData?.name || exec.workflowName || `Workflow ${exec.workflowId}`,
        status: exec.finished === false ? 'running' : (exec.status === 'error' || exec.status === 'crashed' ? 'error' : 'success'),
        startedAt: exec.startedAt || exec.createdAt,
        stoppedAt: exec.stoppedAt,
        error: exec.status === 'error' ? (exec.data?.resultData?.error?.message || 'Execution failed') : undefined,
        mode: exec.mode,
      }));

      const successCount = executions.filter((e: N8nExecution) => e.status === 'success').length;
      const errorCount = executions.filter((e: N8nExecution) => e.status === 'error').length;
      const runningCount = executions.filter((e: N8nExecution) => e.status === 'running').length;

      // Auto-log n8n errors
      for (const exec of executions.filter((e: N8nExecution) => e.status === 'error')) {
        await this.logError({
          source: 'n8n',
          severity: 'error',
          message: `Workflow "${exec.workflowName}" failed: ${exec.error || 'Unknown error'}`,
          metadata: { workflowId: exec.workflowId, executionId: exec.id },
        });
      }

      return {
        executions,
        summary: {
          total: executions.length,
          success: successCount,
          errors: errorCount,
          running: runningCount,
          errorRate: executions.length > 0 ? (errorCount / executions.length) * 100 : 0,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Could be n8n offline — don't throw, return empty with the error noted
      return {
        executions: [],
        summary: { total: 0, success: 0, errors: 0, running: 0, errorRate: 0 },
      };
    }
  }

  private async readDatabase(): Promise<any> {
    try {
      const content = await readFile(this.db.dbPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return { analytics: [] };
    }
  }

  private async writeDatabase(data: any): Promise<void> {
    await writeFile(this.db.dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
