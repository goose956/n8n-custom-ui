import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { EngagementReportsService } from './engagement-reports.service';

export interface EngagementReportQuery {
  dateRange?: string;
  postType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagementRate: number;
}

export interface EngagementReport {
  id: string;
  postId: string;
  postContent: string;
  postType: 'text' | 'image' | 'video' | 'article' | 'poll';
  publishedAt: string;
  metrics: EngagementMetrics;
  audienceInsights: {
    topLocations: Array<{ location: string; percentage: number }>;
    demographics: {
      ageGroups: Array<{ range: string; percentage: number }>;
      industries: Array<{ industry: string; percentage: number }>;
    };
  };
  performanceScore: number;
  trending: boolean;
}

export interface EngagementReportsResponse {
  reports: EngagementReport[];
  summary: {
    totalPosts: number;
    averageEngagementRate: number;
    totalReach: number;
    totalImpressions: number;
    topPerformingPost: {
      id: string;
      content: string;
      engagementRate: number;
    };
    engagementTrends: Array<{
      date: string;
      engagement: number;
      reach: number;
    }>;
  };
  dateRange: {
    from: string;
    to: string;
  };
  filters: {
    postType?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Controller('api/engagement-reports')
export class EngagementReportsController {
  constructor(private readonly engagementReportsService: EngagementReportsService) {}

  @Get()
  async getEngagementReports(
    @Query() query: EngagementReportQuery,
  ): Promise<EngagementReportsResponse> {
    try {
      const reports = await this.engagementReportsService.getEngagementReports(query);
      return reports;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch engagement reports',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary')
  async getEngagementSummary(
    @Query('dateRange') dateRange?: string,
  ): Promise<EngagementReportsResponse['summary']> {
    try {
      const summary = await this.engagementReportsService.getEngagementSummary(dateRange);
      return summary;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch engagement summary',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trends')
  async getEngagementTrends(
    @Query('dateRange') dateRange?: string,
    @Query('metric') metric: string = 'engagement',
  ): Promise<Array<{ date: string; value: number; metric: string }>> {
    try {
      const trends = await this.engagementReportsService.getEngagementTrends(dateRange, metric);
      return trends;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch engagement trends',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}