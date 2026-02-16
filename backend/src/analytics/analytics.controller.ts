import { Controller, Get, Post, Body, Param, HttpCode, Query, Delete } from'@nestjs/common';
import { AnalyticsService, PageView } from'./analytics.service';

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

 // ======================================================================
 // ERROR LOGGING ENDPOINTS
 // ======================================================================

 @Post('errors')
 @HttpCode(200)
 async logError(@Body() body: { source?: string; severity?: string; message: string; stack?: string; endpoint?: string; statusCode?: number; metadata?: Record<string, any> }) {
 const entry = await this.analyticsService.logError(body as any);
 return { success: true, data: entry };
 }

 @Get('errors')
 async getErrors(
 @Query('source') source?: string,
 @Query('severity') severity?: string,
 @Query('resolved') resolved?: string,
 @Query('limit') limit?: string,
 ) {
 const filters = {
 source,
 severity,
 resolved: resolved !== undefined ? resolved ==='true' : undefined,
 limit: limit ? parseInt(limit) : undefined,
 };
 const result = await this.analyticsService.getErrors(filters);
 return { success: true, data: result };
 }

 @Post('errors/:id/resolve')
 @HttpCode(200)
 async resolveError(@Param('id') id: string) {
 const resolved = await this.analyticsService.resolveError(id);
 return { success: resolved, message: resolved ?'Error resolved' :'Error not found' };
 }

 @Delete('errors')
 async clearErrors(@Query('source') source?: string) {
 const deleted = await this.analyticsService.clearErrors(source);
 return { success: true, data: { deleted } };
 }

 // ======================================================================
 // API USAGE ENDPOINTS
 // ======================================================================

 @Post('api-usage')
 @HttpCode(200)
 async trackApiUsage(@Body() body: any) {
 const entry = await this.analyticsService.trackApiUsage(body);
 return { success: true, data: entry };
 }

 @Get('api-usage')
 async getApiUsage(
 @Query('provider') provider?: string,
 @Query('module') module?: string,
 @Query('days') days?: string,
 ) {
 const filters = {
 provider,
 module,
 days: days ? parseInt(days) : undefined,
 };
 const result = await this.analyticsService.getApiUsage(filters);
 return { success: true, data: result };
 }

 // ======================================================================
 // N8N EXECUTION MONITORING
 // ======================================================================

 @Get('n8n-executions')
 async getN8nExecutions() {
 const result = await this.analyticsService.getN8nExecutions();
 return { success: true, data: result };
 }
}
