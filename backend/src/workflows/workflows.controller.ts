import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';

@Controller('api/workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async getWorkflows() {
    return this.workflowsService.getWorkflows();
  }

  @Post(':id/trigger')
  async triggerWorkflow(@Param('id') workflowId: string, @Body() body?: Record<string, any>) {
    return this.workflowsService.triggerWorkflow(workflowId, body?.data);
  }
}
