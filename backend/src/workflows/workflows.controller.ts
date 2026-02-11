import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowConfigService } from './workflow-config.service';

@Controller('api/workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly configService: WorkflowConfigService,
  ) {}

  @Get()
  async getWorkflows() {
    return this.workflowsService.getWorkflows();
  }

  @Get('validation')
  async getWorkflowsWithValidation() {
    return this.workflowsService.getWorkflowsWithValidation();
  }

  @Get('config/:id')
  async getWorkflowConfig(@Param('id') workflowId: string) {
    const config = await this.configService.getWorkflowConfig(workflowId);
    return { success: true, config };
  }

  @Put('config/:id')
  async saveWorkflowConfig(
    @Param('id') workflowId: string,
    @Body() body: { workflowName: string; fields: any[] },
  ) {
    const result = await this.configService.saveWorkflowConfig(
      workflowId,
      body.workflowName,
      body.fields,
    );
    if (result.n8nUpdate) {
      return { success: true, config: result.config, message: 'Workflow updated in n8n.' };
    } else {
      return { success: false, config: result.config, message: result.n8nError || 'Failed to update workflow in n8n.' };
    }
  }

  @Delete('config/:id')
  async deleteWorkflowConfig(@Param('id') workflowId: string) {
    const success = await this.configService.deleteWorkflowConfig(workflowId);
    return { success };
  }

  @Post(':id/trigger')
  async triggerWorkflow(@Param('id') workflowId: string, @Body() body?: Record<string, any>) {
    return this.workflowsService.triggerWorkflow(workflowId, body?.data);
  }
}

