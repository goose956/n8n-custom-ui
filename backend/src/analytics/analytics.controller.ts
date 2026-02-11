import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { AnalyticsService, PageView } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(200)
  async trackPageView(@Body() pageView: PageView) {
    return {
      success: true,
      data: await this.analyticsService.trackPageView(pageView),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('apps')
  async getAllAppsAnalytics() {
    return {
      success: true,
      data: await this.analyticsService.getAllAppsAnalytics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('app/:appId')
  async getAppAnalytics(@Param('appId') appId: string) {
    return {
      success: true,
      data: await this.analyticsService.getAppAnalytics(parseInt(appId)),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('app/:appId/visitors')
  async getVisitorList(@Param('appId') appId: string) {
    return {
      success: true,
      data: await this.analyticsService.getVisitorList(parseInt(appId)),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cleanup')
  @HttpCode(200)
  async cleanupOldAnalytics(@Body('days') days: number = 90) {
    const deleted = await this.analyticsService.deleteOldAnalytics(days);
    return {
      success: true,
      data: {
        deleted_records: deleted,
        retention_days: days,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
