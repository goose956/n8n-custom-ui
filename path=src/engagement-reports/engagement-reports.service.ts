import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

interface EngagementData {
  id: string;
  userId: string;
  postId: string;
  postType: 'article' | 'image' | 'video' | 'carousel' | 'text';
  title: string;
  content: string;
  publishedAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    clicks: number;
    impressions: number;
    engagementRate: number;
  };
  demographics: {
    topIndustries: string[];
    topLocations: string[];
    seniorityLevels: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

interface EngagementFilters {
  startDate?: Date;
  endDate?: Date;
  postType?: string;
  userId?: string;
  limit?: number;
}

@Injectable()
export class EngagementReportsService {
  private readonly collectionName = 'engagement_reports';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getEngagementReports(filters: EngagementFilters) {
    const data = this.db.readSync();
    let reports: EngagementData[] = data[this.collectionName] || [];

    // Apply filters
    if (filters.userId) {
      reports = reports.filter(report => report.userId === filters.userId);
    }

    if (filters.postType) {
      reports = reports.filter(report => report.postType === filters.postType);
    }

    if (filters.startDate || filters.endDate) {
      reports = reports.filter(report => {
        const publishedAt = new Date(report.publishedAt);
        
        if (filters.startDate && publishedAt < filters.startDate) {
          return false;
        }
        
        if (filters.endDate && publishedAt > filters.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Sort by published date (most recent first)
    reports.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Apply limit
    if (filters.limit) {
      reports = reports.slice(0, filters.limit);
    }

    // Calculate additional metrics for each report
    const enrichedReports = reports.map(report => ({
      ...report,
      calculatedMetrics: {
        totalEngagements: report.metrics.likes + report.metrics.comments + report.metrics.shares,
        ctr: report.metrics.impressions > 0 ? (report.metrics.clicks / report.metrics.impressions) * 100 : 0,
        reach: report.metrics.impressions,
        viralityRate: report.metrics.shares > 0 ? (report.metrics.shares / report.metrics.impressions) * 100 : 0,
      },
    }));

    return {
      reports: enrichedReports,
      totalCount: reports.length,
      filters: {
        ...filters,
        appliedAt: new Date().toISOString(),
      },
    };
  }

  async getEngagementSummary(period: string, userId?: string) {
    const data = this.db.readSync();
    let reports: EngagementData[] = data[this.collectionName] || [];

    // Filter by user if specified
    if (userId) {
      reports = reports.filter(report => report.userId === userId);
    }

    // Filter by period
    const now = new Date();
    const periodStart = this.getPeriodStartDate(period, now);
    
    reports = reports.filter(report => {
      const publishedAt = new Date(report.publishedAt);
      return publishedAt >= periodStart && publishedAt <= now;
    });

    if (reports.length === 0) {
      return {
        period,
        totalPosts: 0,
        summary: {
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          totalImpressions: 0,
          averageEngagementRate: 0,
          totalEngagements: 0,
        },
        postTypeBreakdown: {},
        topPerformingPost: null,
      };
    }

    // Calculate summary metrics
    const summary = reports.reduce(
      (acc, report) => {
        acc.totalLikes += report.metrics.likes;
        acc.totalComments += report.metrics.comments;
        acc.totalShares += report.metrics.shares;
        acc.totalViews += report.metrics.views;
        acc.totalImpressions += report.metrics.impressions;
        acc.totalEngagements += report.metrics.likes + report.metrics.comments + report.metrics.shares;
        return acc;
      },
      {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        averageEngagementRate: 0,
      },
    );

    // Calculate average engagement rate
    summary.averageEngagementRate = reports.length > 0 
      ? reports.reduce((sum, report) => sum + report.metrics.engagementRate, 0) / reports.length 
      : 0;

    // Post type breakdown
    const postTypeBreakdown = reports.reduce((acc, report) => {
      acc[report.postType] = (acc[report.postType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find top performing post
    const topPerformingPost = reports.reduce((best, current) => 
      current.metrics.engagementRate > best.metrics.engagementRate ? current : best
    );

    return {
      period,
      totalPosts: reports.length,
      dateRange: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      summary,
      postTypeBreakdown,
      topPerformingPost: {
        id: topPerformingPost.id,
        title: topPerformingPost.title,
        postType: topPerformingPost.postType,
        engagementRate: topPerformingPost.metrics.engagementRate,
        totalEngagements: topPerformingPost.metrics.likes + topPerformingPost.metrics.comments + topPerformingPost.metrics.shares,
      },
    };
  }

  async getEngagementTrends(metric: string, period: string, userId?: string) {
    const data = this.db.readSync();
    let reports: EngagementData[] = data[this.collectionName] || [];

    // Filter by user if specified
    if (userId) {
      reports = reports.filter(report => report.userId === userId);
    }

    // Filter by period
    const now = new Date();
    const periodStart = this.getPeriodStartDate(period, now);
    
    reports = reports.filter(report => {
      const publishedAt = new Date(report.publishedAt);
      return publishedAt >= periodStart && publishedAt <= now;
    });

    // Group data by time intervals
    const intervals = this.getTimeIntervals(periodStart, now, period);
    const trendData = intervals.map(interval => {
      const intervalReports = reports.filter(report => {
        const publishedAt = new Date(report.publishedAt);
        return publishedAt >= interval.start && publishedAt < interval.end;
      });

      let value = 0;
      if (intervalReports.length > 0) {
        switch (metric) {
          case 'likes':
            value = intervalReports.reduce((sum, report) => sum + report.metrics.likes, 0);
            break;
          case 'comments':
            value = intervalReports.reduce((sum, report) => sum + report.metrics.comments, 0);
            break;
          case 'shares':
            value = intervalReports.reduce((sum, report) => sum + report.metrics.shares, 0);
            break;
          case 'views':
            value = intervalReports.reduce((sum, report) => sum + report.metrics.views, 0);
            break;
          case 'engagement_rate':
            value = intervalReports.reduce((sum, report) => sum + report.metrics.engagementRate, 0) / intervalReports.length;
            break;
        }
      }

      return {
        date: interval.start.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        postsCount: intervalReports.length,
      };
    });

    // Calculate trend direction and percentage change
    const firstValue = trendData.find(d => d.value > 0)?.value || 0;
    const lastValue = trendData[trendData.length - 1]?.value || 0;
    const percentageChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      metric,
      period,
      dateRange: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      trendData,
      summary: {
        trend: percentageChange > 5 ? 'increasing' : percentageChange < -5 ? 'decreasing' : 'stable',
        percentageChange: Math.round(percentageChange * 100) / 100,
        totalDataPoints: trendData.length,
        averageValue: trendData.length > 0 
          ? Math.round((trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length) * 100) / 100 
          : 0,
      },
    };
  }

  async getTopPerformingPosts(metric: string, limit: number, userId?: string, period?: string) {
    const data = this.db.readSync();
    let reports: EngagementData[] = data[this.collectionName] || [];

    // Filter by user if specified
    if (userId) {
      reports = reports.filter(report => report.userId === userId);
    }

    // Filter by period if specified
    if (period) {
      const now = new Date();
      const periodStart = this.getPeriodStartDate(period, now);
      
      reports = reports.filter(report => {
        const publishedAt = new Date(report.publishedAt);
        return publishedAt >= periodStart && publishedAt <= now;
      });
    }

    // Sort by specified metric
    reports.sort((a, b) => {
      let valueA, valueB;
      
      switch (metric) {
        case 'likes':
          valueA = a.metrics.likes;
          valueB = b.metrics.likes;
          break;
        case 'comments':
          valueA = a.metrics.comments;
          valueB = b.metrics.comments;
          break;
        case 'shares':
          valueA = a.metrics.shares;
          valueB = b.metrics.shares;
          break;
        case 'views':
          valueA = a.metrics.views;
          valueB = b.metrics.views;
          break;
        case 'engagement_rate':
          valueA = a.metrics.engagementRate;
          valueB = b.metrics.engagementRate;
          break;
        default:
          valueA = a.metrics.engagementRate;
          valueB = b.metrics.engagementRate;
      }
      
      return valueB - valueA;
    });

    // Take top N posts
    const topPosts = reports.slice(0, limit).map((post, index) => ({
      rank: index + 1,
      id: post.id,
      title: post.title,
      postType: post.postType,
      publishedAt: post.publishedAt,
      metrics: post.metrics,
      sortedBy: metric,
      sortedValue: this.getMetricValue(post, metric),
      totalEngagements: post.metrics.likes + post.metrics.comments + post.metrics.shares,
      demographics: post.demographics,
    }));

    return {
      metric,
      limit,
      period: period || 'all-time',
      totalPostsAnalyzed: reports.length,
      topPosts,
      summary: {
        averageValue: topPosts.length > 0 
          ? Math.round((topPosts.reduce((sum, post) => sum + post.sortedValue, 0) / topPosts.length) * 100) / 100
          : 0,
        bestPerformer: topPosts[0] || null,
        postTypeDistribution: topPosts.reduce((acc, post) => {
          acc[post.postType] = (acc[post.postType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }

  private getPeriodStartDate(period: string, now: Date): Date {
    const start = new Date(now);
    
    switch (period) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return start;
  }

  private getTimeIntervals(start: Date, end: Date, period: string) {
    const intervals = [];
    let current = new Date(start);
    let intervalDays: number;

    switch (period) {
      case '7d':
        intervalDays = 1; // Daily intervals
        break;
      case '30d':
        intervalDays = 2; // 2-day intervals
        break;
      case '90d':
        intervalDays = 7; // Weekly intervals
        break;
      case '1y':
        intervalDays = 30; // Monthly intervals
        break;
      default:
        intervalDays = 2;
    }

    while (current < end) {
      const intervalEnd = new Date(current);
      intervalEnd.setDate(current.getDate() + intervalDays);
      
      if (intervalEnd > end) {
        intervalEnd.setTime(end.getTime());
      }

      intervals.push({
        start: new Date(current),
        end: intervalEnd,
      });

      current = new Date(intervalEnd);
    }

    return intervals;
  }

  private getMetricValue(post: EngagementData, metric: string): number {
    switch (metric) {
      case 'likes':
        return post.metrics.likes;
      case 'comments':
        return post.metrics.comments;
      case 'shares':
        return post.metrics.shares;
      case 'views':
        return post.metrics.views;
      case 'engagement_rate':
        return post.metrics.engagementRate;
      default:
        return post.metrics.engagementRate;
    }
  }
}