import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { EngagementReportQuery, EngagementReport, EngagementReportsResponse, EngagementMetrics } from './engagement-reports.controller';

interface StoredEngagementData {
  reports: EngagementReport[];
  lastUpdated: string;
  linkedinPosts: Array<{
    id: string;
    content: string;
    type: string;
    publishedAt: string;
    metrics: EngagementMetrics;
    audienceData: any;
  }>;
}

@Injectable()
export class EngagementReportsService {
  private readonly logger = new Logger(EngagementReportsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  async getEngagementReports(query: EngagementReportQuery): Promise<EngagementReportsResponse> {
    try {
      // Get data from database
      const data = this.db.readSync<StoredEngagementData>('engagement-reports.json') || {
        reports: [],
        lastUpdated: new Date().toISOString(),
        linkedinPosts: [],
      };

      // If data is stale or empty, fetch fresh data from LinkedIn
      const shouldRefresh = this.shouldRefreshData(data.lastUpdated);
      if (shouldRefresh || data.reports.length === 0) {
        await this.refreshEngagementData(data);
      }

      // Apply filters
      let filteredReports = data.reports;

      // Filter by date range
      if (query.dateRange) {
        const dateRange = this.parseDateRange(query.dateRange);
        filteredReports = filteredReports.filter(report => {
          const postDate = new Date(report.publishedAt);
          return postDate >= dateRange.from && postDate <= dateRange.to;
        });
      }

      // Filter by post type
      if (query.postType && query.postType !== 'all') {
        filteredReports = filteredReports.filter(report => report.postType === query.postType);
      }

      // Sort reports
      const sortBy = query.sortBy || 'publishedAt';
      const sortOrder = query.sortOrder || 'desc';
      
      filteredReports.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case 'engagementRate':
            aVal = a.metrics.engagementRate;
            bVal = b.metrics.engagementRate;
            break;
          case 'reach':
            aVal = a.metrics.reach;
            bVal = b.metrics.reach;
            break;
          case 'performanceScore':
            aVal = a.performanceScore;
            bVal = b.performanceScore;
            break;
          default:
            aVal = new Date(a.publishedAt);
            bVal = new Date(b.publishedAt);
        }

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      // Generate summary
      const summary = this.generateSummary(filteredReports);

      // Determine date range for response
      const responseDateRange = query.dateRange 
        ? this.parseDateRange(query.dateRange)
        : this.getDefaultDateRange();

      return {
        reports: filteredReports,
        summary,
        dateRange: {
          from: responseDateRange.from.toISOString(),
          to: responseDateRange.to.toISOString(),
        },
        filters: {
          postType: query.postType,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get engagement reports:', error);
      throw error;
    }
  }

  async getEngagementSummary(dateRange?: string): Promise<EngagementReportsResponse['summary']> {
    const data = this.db.readSync<StoredEngagementData>('engagement-reports.json') || {
      reports: [],
      lastUpdated: new Date().toISOString(),
      linkedinPosts: [],
    };

    let reports = data.reports;

    if (dateRange) {
      const parsedRange = this.parseDateRange(dateRange);
      reports = reports.filter(report => {
        const postDate = new Date(report.publishedAt);
        return postDate >= parsedRange.from && postDate <= parsedRange.to;
      });
    }

    return this.generateSummary(reports);
  }

  async getEngagementTrends(
    dateRange?: string,
    metric: string = 'engagement',
  ): Promise<Array<{ date: string; value: number; metric: string }>> {
    const data = this.db.readSync<StoredEngagementData>('engagement-reports.json') || {
      reports: [],
      lastUpdated: new Date().toISOString(),
      linkedinPosts: [],
    };

    let reports = data.reports;

    if (dateRange) {
      const parsedRange = this.parseDateRange(dateRange);
      reports = reports.filter(report => {
        const postDate = new Date(report.publishedAt);
        return postDate >= parsedRange.from && postDate <= parsedRange.to;
      });
    }

    // Group by date and calculate trends
    const trendsMap = new Map<string, number[]>();

    reports.forEach(report => {
      const date = new Date(report.publishedAt).toISOString().split('T')[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, []);
      }

      let value: number;
      switch (metric) {
        case 'reach':
          value = report.metrics.reach;
          break;
        case 'impressions':
          value = report.metrics.impressions;
          break;
        case 'likes':
          value = report.metrics.likes;
          break;
        case 'comments':
          value = report.metrics.comments;
          break;
        default:
          value = report.metrics.engagementRate;
      }

      trendsMap.get(date)!.push(value);
    });

    // Calculate averages and return sorted trends
    const trends = Array.from(trendsMap.entries())
      .map(([date, values]) => ({
        date,
        value: values.reduce((sum, val) => sum + val, 0) / values.length,
        metric,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return trends;
  }

  private async refreshEngagementData(data: StoredEngagementData): Promise<void> {
    try {
      this.logger.log('Refreshing engagement data from LinkedIn API...');

      // Simulate LinkedIn API call
      const linkedinData = await this.fetchLinkedInEngagementData();
      
      // Transform LinkedIn data to our format
      const reports: EngagementReport[] = linkedinData.map(post => this.transformToEngagementReport(post));

      // Update stored data
      data.reports = reports;
      data.lastUpdated = new Date().toISOString();
      data.linkedinPosts = linkedinData;

      // Save to database
      this.db.writeSync('engagement-reports.json', data);

      this.logger.log(`Updated ${reports.length} engagement reports`);
    } catch (error) {
      this.logger.error('Failed to refresh engagement data:', error);
      // Don't throw error, use existing data if available
    }
  }

  private async fetchLinkedInEngagementData(): Promise<any[]> {
    // Simulate API call to LinkedIn
    // In real implementation, this would use the LinkedIn Marketing API
    const apiKey = this.crypto.getApiKey('LINKEDIN_API_KEY');
    
    // Mock data for demonstration
    return [
      {
        id: 'post-1',
        content: 'Exciting news about our latest product launch! 🚀 We\'ve been working hard to bring you innovative solutions.',
        type: 'text',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        metrics: {
          likes: 156,
          comments: 23,
          shares: 12,
          clicks: 89,
          impressions: 2847,
          reach: 2156,
        },
        audienceData: {
          locations: [
            { location: 'United States', percentage: 45 },
            { location: 'United Kingdom', percentage: 23 },
            { location: 'Canada', percentage: 15 },
            { location: 'Australia', percentage: 10 },
            { location: 'Germany', percentage: 7 },
          ],
          demographics: {
            ageGroups: [
              { range: '25-34', percentage: 35 },
              { range: '35-44', percentage: 28 },
              { range: '45-54', percentage: 20 },
              { range: '18-24', percentage: 12 },
              { range: '55+', percentage: 5 },
            ],
            industries: [
              { industry: 'Technology', percentage: 42 },
              { industry: 'Marketing', percentage: 25 },
              { industry: 'Finance', percentage: 18 },
              { industry: 'Healthcare', percentage: 10 },
              { industry: 'Education', percentage: 5 },
            ],
          },
        },
      },
      {
        id: 'post-2',
        content: 'Check out our latest case study on how we helped increase engagement by 300%',
        type: 'article',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: {
          likes: 89,
          comments: 15,
          shares: 28,
          clicks: 156,
          impressions: 3241,
          reach: 2876,
        },
        audienceData: {
          locations: [
            { location: 'United States', percentage: 48 },
            { location: 'United Kingdom', percentage: 21 },
            { location: 'Canada', percentage: 13 },
            { location: 'Australia', percentage: 11 },
            { location: 'France', percentage: 7 },
          ],
          demographics: {
            ageGroups: [
              { range: '35-44', percentage: 32 },
              { range: '25-34', percentage: 30 },
              { range: '45-54', percentage: 22 },
              { range: '18-24', percentage: 10 },
              { range: '55+', percentage: 6 },
            ],
            industries: [
              { industry: 'Marketing', percentage: 38 },
              { industry: 'Technology', percentage: 28 },
              { industry: 'Consulting', percentage: 15 },
              { industry: 'Finance', percentage: 12 },
              { industry: 'Media', percentage: 7 },
            ],
          },
        },
      },
      {
        id: 'post-3',
        content: '🎯 What\'s your biggest challenge in social media marketing? Let us know in the comments!',
        type: 'poll',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: {
          likes: 234,
          comments: 67,
          shares: 19,
          clicks: 123,
          impressions: 4156,
          reach: 3524,
        },
        audienceData: {
          locations: [
            { location: 'United States', percentage: 42 },
            { location: 'India', percentage: 18 },
            { location: 'United Kingdom', percentage: 16 },
            { location: 'Canada', percentage: 12 },
            { location: 'Singapore', percentage: 8 },
            { location: 'Australia', percentage: 4 },
          ],
          demographics: {
            ageGroups: [
              { range: '25-34', percentage: 38 },
              { range: '35-44', percentage: 26 },
              { range: '18-24', percentage: 18 },
              { range: '45-54', percentage: 13 },
              { range: '55+', percentage: 5 },
            ],
            industries: [
              { industry: 'Marketing', percentage: 45 },
              { industry: 'Technology', percentage: 22 },
              { industry: 'Advertising', percentage: 15 },
              { industry: 'Media', percentage: 10 },
              { industry: 'Design', percentage: 8 },
            ],
          },
        },
      },
    ];
  }

  private transformToEngagementReport(post: any): EngagementReport {
    const totalEngagements = post.metrics.likes + post.metrics.comments + post.metrics.shares;
    const engagementRate = post.metrics.impressions > 0 
      ? (totalEngagements / post.metrics.impressions) * 100 
      : 0;

    // Calculate performance score based on multiple factors
    const performanceScore = this.calculatePerformanceScore({
      engagementRate,
      reach: post.metrics.reach,
      clicks: post.metrics.clicks,
      shares: post.metrics.shares,
    });

    // Determine if trending (high engagement in recent posts)
    const trending = engagementRate > 5 && post.metrics.reach > 2000;

    return {
      id: post.id,
      postId: post.id,
      postContent: post.content,
      postType: post.type,
      publishedAt: post.publishedAt,
      metrics: {
        ...post.metrics,
        engagementRate: Math.round(engagementRate * 100) / 100,
      },
      audienceInsights: {
        topLocations: post.audienceData.locations,
        demographics: {
          ageGroups: post.audienceData.demographics.ageGroups,
          industries: post.audienceData.demographics.industries,
        },
      },
      performanceScore: Math.round(performanceScore * 100) / 100,
      trending,
    };
  }

  private calculatePerformanceScore(metrics: {
    engagementRate: number;
    reach: number;
    clicks: number;
    shares: number;
  }): number {
    // Weight different metrics
    const engagementWeight = 0.4;
    const reachWeight = 0.3;
    const clickWeight = 0.2;
    const shareWeight = 0.1;

    // Normalize values to 0-100 scale
    const normalizedEngagement = Math.min(metrics.engagementRate * 10, 100);
    const normalizedReach = Math.min(metrics.reach / 50, 100);
    const normalizedClicks = Math.min(metrics.clicks / 2, 100);
    const normalizedShares = Math.min(metrics.shares * 5, 100);

    const score = 
      normalizedEngagement * engagementWeight +
      normalizedReach * reachWeight +
      normalizedClicks * clickWeight +
      normalizedShares * shareWeight;

    return Math.max(0, Math.min(100, score));
  }

  private generateSummary(reports: EngagementReport[]): EngagementReportsResponse['summary'] {
    if (reports.length === 0) {
      return {
        totalPosts: 0,
        averageEngagementRate: 0,
        totalReach: 0,
        totalImpressions: 0,
        topPerformingPost: {
          id: '',
          content: 'No posts available',
          engagementRate: 0,
        },
        engagementTrends: [],
      };
    }

    const totalReach = reports.reduce((sum, report) => sum + report.metrics.reach, 0);
    const totalImpressions = reports.reduce((sum, report) => sum + report.metrics.impressions, 0);
    const averageEngagementRate = reports.reduce((sum, report) => sum + report.metrics.engagementRate, 0) / reports.length;

    // Find top performing post
    const topPost = reports.reduce((top, current) => 
      current.metrics.engagementRate > top.metrics.engagementRate ? current : top
    );

    // Generate engagement trends for the last 7 days
    const trends = this.generateEngagementTrends(reports);

    return {
      totalPosts: reports.length,
      averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
      totalReach,
      totalImpressions,
      topPerformingPost: {
        id: topPost.id,
        content: topPost.postContent.substring(0, 100) + (topPost.postContent.length > 100 ? '...' : ''),
        engagementRate: topPost.metrics.engagementRate,
      },
      engagementTrends: trends,
    };
  }

  private generateEngagementTrends(reports: EngagementReport[]): Array<{ date: string; engagement: number; reach: number }> {
    const trends = new Map<string, { totalEngagement: number; totalReach: number; count: number }>();

    reports.forEach(report => {
      const date = new Date(report.publishedAt).toISOString().split('T')[0];
      if (!trends.has(date)) {
        trends.set(date, { totalEngagement: 0, totalReach: 0, count: 0 });
      }

      const dayData = trends.get(date)!;
      dayData.totalEngagement += report.metrics.engagementRate;
      dayData.totalReach += report.metrics.reach;
      dayData.count += 1;
    });

    return Array.from(trends.entries())
      .map(([date, data]) => ({
        date,
        engagement: Math.round((data.totalEngagement / data.count) * 100) / 100,
        reach: Math.round(data.totalReach / data.count),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }

  private shouldRefreshData(lastUpdated: string): boolean {
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Refresh if data is older than 4 hours
    return hoursSinceUpdate > 4;
  }

  private parseDateRange(dateRange: string): { from: Date; to: Date } {
    const [from, to] = dateRange.split(',');
    return {
      from: new Date(from),
      to: new Date(to),
    };
  }

  private getDefaultDateRange(): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30); // Last 30 days
    
    return { from, to };
  }
}