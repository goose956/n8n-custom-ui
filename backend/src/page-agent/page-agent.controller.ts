import { Controller, Post, Get, Body, Param, ParseIntPipe } from'@nestjs/common';
import { PageAgentService } from'./page-agent.service';

@Controller('api/page-agent')
export class PageAgentController {
 constructor(private readonly pageAgentService: PageAgentService) {}

 /**
 * Analyze a page and return the list of backend tasks
 */
 @Get('analyze/:appId/:pageId')
 analyzePage(
 @Param('appId', ParseIntPipe) appId: number,
 @Param('pageId', ParseIntPipe) pageId: number,
 ) {
 const result = this.pageAgentService.analyzePage(appId, pageId);
 return {
 success: true,
 ...result,
 timestamp: new Date().toISOString(),
 };
 }

 /**
 * Implement a single backend task
 */
 @Post('implement/:appId/:pageId/:taskId')
 implementTask(
 @Param('appId', ParseIntPipe) appId: number,
 @Param('pageId', ParseIntPipe) pageId: number,
 @Param('taskId') taskId: string,
 ) {
 const result = this.pageAgentService.implementTask(appId, pageId, taskId);
 return {
 ...result,
 timestamp: new Date().toISOString(),
 };
 }

 /**
 * Auto-implement all pending tasks
 */
 @Post('implement-all/:appId/:pageId')
 implementAll(
 @Param('appId', ParseIntPipe) appId: number,
 @Param('pageId', ParseIntPipe) pageId: number,
 ) {
 const results = this.pageAgentService.implementAll(appId, pageId);
 const analysis = this.pageAgentService.analyzePage(appId, pageId);
 return {
 success: true,
 results,
 tasks: analysis.tasks,
 completedCount: analysis.completedCount,
 totalCount: analysis.totalCount,
 timestamp: new Date().toISOString(),
 };
 }

 /**
 * Chat with the backend agent about a page
 */
 @Post('chat')
 async chat(
 @Body()
 body: {
 appId: number;
 pageId: number;
 message: string;
 apiProvider: string;
 model?: string;
 },
 ) {
 const result = await this.pageAgentService.chat(
 body.appId,
 body.pageId,
 body.message,
 body.apiProvider,
 body.model,
 );

 return {
 ...result,
 timestamp: new Date().toISOString(),
 };
 }
}
