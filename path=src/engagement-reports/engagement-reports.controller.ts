import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { EngagementReportsService } from './engagement-reports.service';

@Controller('api/engagement-reports')
export class EngagementReportsController {
  constructor(private readonly engagementReportsService: EngagementReportsService) {}

  @Get()
  async getEngagementReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('postType') postType?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        postType,
        userId,
        limit: limit ? parseInt(limit, 10) : undefined,
      };

      // Validate date range
      if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      // Validate limit
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }

      const reports = await this.engagementReportsService.getEngagementReports(filters);
      
      return {
        success: true,
        data: reports,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve engagement reports: ${error.message}`);
    }
  }

  @Get('summary')
  async getEngagementSummary(
    @Query('period') period?: string,
    @Query('userId') userId?: string,
  ) {
    try {
      const validPeriods = ['7d', '30d', '90d', '1y'];
      if (period && !validPeriods.includes(period)) {
        throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      const summary = await this.engagementReportsService.getEngagementSummary(period || '30d', userId);
      
      return {
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve engagement summary: ${error.message}`);
    }
  }

  @Get('trends')
  async getEngagementTrends(
    @Query('metric') metric?: string,
    @Query('period') period?: string,
    @Query('userId') userId?: string,
  ) {
    try {
      const validMetrics = ['likes', 'comments', 'shares', 'views', 'engagement_rate'];
      if (metric && !validMetrics.includes(metric)) {
        throw new BadRequestException(`Invalid metric. Must be one of: ${validMetrics.join(', ')}`);
      }

      const validPeriods = ['7d', '30d', '90d', '1y'];
      if (period && !validPeriods.includes(period)) {
        throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      const trends = await this.engagementReportsService.getEngagementTrends(
        metric || 'engagement_rate',
        period || '30d',
        userId,
      );
      
      return {
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve engagement trends: ${error.message}`);
    }
  }

  @Get('top-posts')
  async getTopPerformingPosts(
    @Query('metric') metric?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('period') period?: string,
  ) {
    try {
      const validMetrics = ['likes', 'comments', 'shares', 'views', 'engagement_rate'];
      if (metric && !validMetrics.includes(metric)) {
        throw new BadRequestException(`Invalid metric. Must be one of: ${validMetrics.join(', ')}`);
      }

      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      if (parsedLimit < 1 || parsedLimit > 50) {
        throw new BadRequestException('Limit must be between 1 and 50');
      }

      const validPeriods = ['7d', '30d', '90d', '1y'];
      if (period && !validPeriods.includes(period)) {
        throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      const topPosts = await this.engagementReportsService.getTopPerformingPosts(
        metric || 'engagement_rate',
        parsedLimit,
        userId,
        period || '30d',
      );
      
      return {
        success: true,
        data: topPosts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve top performing posts: ${error.message}`);
    }
  }
}