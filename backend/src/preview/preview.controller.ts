import { Controller, Post, Body } from'@nestjs/common';
import { PreviewService } from'./preview.service';

@Controller('api/preview')
export class PreviewController {
 constructor(private readonly previewService: PreviewService) {}

 /** Spin up a Vite dev server for the preview. Returns { sessionId, port }. */
 @Post('start')
 async start(
 @Body()
 body: {
 files: { path: string; content: string }[];
 entryFile: string;
 componentName: string;
 primaryColor?: string;
 },
 ) {
 return this.previewService.start(body);
 }

 /** Write updated files into an active session (Vite HMR refreshes). */
 @Post('update')
 async update(
 @Body()
 body: {
 sessionId: string;
 files: { path: string; content: string }[];
 entryFile: string;
 componentName: string;
 primaryColor?: string;
 },
 ) {
 await this.previewService.update(body);
 return { ok: true };
 }

 /** Kill a preview session and clean up its temp directory. */
 @Post('stop')
 async stop(@Body() body: { sessionId: string }) {
 await this.previewService.stop(body.sessionId);
 return { ok: true };
 }

 /** Start a full-site preview with all pages routed + sidebar nav. */
 @Post('start-fullsite')
 async startFullSite(
 @Body()
 body: {
 files: { path: string; content: string }[];
 primaryColor?: string;
 appName?: string;
 },
 ) {
 return this.previewService.startFullSite(body);
 }
}
