import { Controller, Get, Post, Put, Delete, Body, Param, Query } from'@nestjs/common';
import { ResearchService } from'./research.service';

@Controller('api/research')
export class ResearchController {
 constructor(private readonly researchService: ResearchService) {}

 // --- CRUD ------------------------------------------------------------------

 @Get('projects')
 async getAllProjects(@Query('projectId') projectId?: string) {
 const pid = projectId ? parseInt(projectId, 10) : undefined;
 return this.researchService.getAllProjects(pid);
 }

 @Get('projects/:id')
 async getProject(@Param('id') id: string) {
 return this.researchService.getProject(id);
 }

 @Get('stats')
 async getStats(@Query('projectId') projectId?: string) {
 const pid = projectId ? parseInt(projectId, 10) : undefined;
 return this.researchService.getStats(pid);
 }

 @Get('project-index')
 async getProjectIndex() {
 return this.researchService.getProjectIndex();
 }

 @Post('projects')
 async createResearch(@Body() body: { query: string; name?: string; projectId?: number }) {
 return this.researchService.createResearch(body.query, body.name, body.projectId);
 }

 @Post('run/:id')
 async runResearch(@Param('id') id: string, @Body() body?: { model?: string }) {
 return this.researchService.runResearch(id, body?.model);
 }

 @Put('projects/:id')
 async updateResearch(@Param('id') id: string, @Body() updates: any) {
 return this.researchService.updateResearch(id, updates);
 }

 @Delete('projects/:id')
 async deleteResearch(@Param('id') id: string) {
 return this.researchService.deleteResearch(id);
 }

 @Post('projects/bulk-delete')
 async deleteMultiple(@Body() body: { ids: string[] }) {
 return this.researchService.deleteMultiple(body.ids);
 }

 // --- Settings --------------------------------------------------------------

 @Get('settings')
 async getSettings() {
 return this.researchService.getResearchSettings();
 }

 @Put('settings')
 async updateSettings(@Body() settings: any) {
 return this.researchService.updateResearchSettings(settings);
 }
}
