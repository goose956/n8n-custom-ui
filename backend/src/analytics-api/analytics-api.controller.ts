import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsApiService } from './analytics-api.service';

@Controller('api/analytics-api')
export class AnalyticsApiController {
  constructor(private readonly analyticsApiService: AnalyticsApiService) {}

  @Get('engagement')
  async getEngagementMetrics(
    @Query('memberId') memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: 'day' | 'week' | 'month' = 'day'
  ) {
    if (!memberId) {
      throw new HttpException('Member ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.analyticsApiService.getEngagementMetrics(memberId, {
        startDate,
        endDate,
        period
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch engagement metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('follower-growth')
  async getFollowerGrowth(
    @Query('memberId') memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: 'day' | 'week' | 'month' = 'day'
  ) {
    if (!memberId) {
      throw new HttpException('Member ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.analyticsApiService.getFollowerGrowth(memberId, {
        startDate,
        endDate,
        period
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch follower growth data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('funnel')
  async getFunnelAnalytics(
    @Query('memberId') memberId: string,
    @Query('campaignId') campaignId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (!memberId) {
      throw new HttpException('Member ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.analyticsApiService.getFunnelAnalytics(memberId, {
        campaignId,
        startDate,
        endDate
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch funnel analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('roi')
  async getRoiTracking(
    @Query('memberId') memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('campaignId') campaignId?: string
  ) {
    if (!memberId) {
      throw new HttpException('Member ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.analyticsApiService.getRoiTracking(memberId, {
        startDate,
        endDate,
        campaignId
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch ROI tracking data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('overview')
  async getAnalyticsOverview(
    @Query('memberId') memberId: string,
    @Query('period') period?: 'week' | 'month' | 'quarter' = 'month'
  ) {
    if (!memberId) {
      throw new HttpException('Member ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.analyticsApiService.getAnalyticsOverview(memberId, period);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch analytics overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
