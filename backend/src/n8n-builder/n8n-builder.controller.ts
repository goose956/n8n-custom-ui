import { Controller, Post, Get, Body, Param, Query } from'@nestjs/common';
import { N8nBuilderService } from'./n8n-builder.service';

@Controller('api/n8n-builder')
export class N8nBuilderController {
 constructor(private readonly builderService: N8nBuilderService) {}

 /**
 * Chat with the n8n workflow builder AI
 */
 @Post('chat')
 async chat(
 @Body()
 body: {
 message: string;
 apiProvider: string;
 model?: string;
 conversationHistory?: Array<{ role:'user' |'assistant'; content: string }>;
 currentWorkflow?: any;
 },
 ) {
 const result = await this.builderService.chat({
 message: body.message,
 apiProvider: body.apiProvider,
 model: body.model,
 conversationHistory: body.conversationHistory,
 currentWorkflow: body.currentWorkflow,
 });

 return {
 ...result,
 timestamp: new Date().toISOString(),
 };
 }

 /**
 * Validate a workflow JSON
 */
 @Post('validate')
 validateWorkflow(@Body() body: { workflow: any }) {
 const result = this.builderService.validateWorkflow(body.workflow);
 return {
 ...result,
 timestamp: new Date().toISOString(),
 };
 }

 /**
 * Get all available n8n node types
 */
 @Get('nodes')
 getNodes(@Query('group') group?: string, @Query('search') search?: string) {
 if (search) {
 return { nodes: this.builderService.searchNodes(search) };
 }
 if (group) {
 return { nodes: this.builderService.getNodesByGroup(group) };
 }
 return { nodes: this.builderService.getAvailableNodes() };
 }

 /**
 * Get starter template list
 */
 @Get('templates')
 getTemplates() {
 return { templates: this.builderService.getTemplateList() };
 }

 /**
 * Get a specific template workflow
 */
 @Get('templates/:id')
 getTemplate(@Param('id') id: string) {
 const workflow = this.builderService.generateTemplate(id);
 if (!workflow) {
 return { success: false, error:`Template "${id}" not found` };
 }
 return { success: true, workflow };
 }
}
