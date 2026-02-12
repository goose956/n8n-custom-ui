import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { DatabaseService } from '../shared/database.service';

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

export interface AnalyticsData {
  analytics: PageView[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

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
