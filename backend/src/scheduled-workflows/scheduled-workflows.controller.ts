import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ScheduledWorkflowsService } from './scheduled-workflows.service';

@Controller('api/scheduled-workflows')
export class ScheduledWorkflowsController {
  constructor(private readonly service: ScheduledWorkflowsService) {}

  @Get()
  async list(@Query('app_id') appId?: string) {
    return this.service.list(appId ? parseInt(appId) : undefined);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post()
  async create(@Body() body: {
    name: string;
    description?: string;
    prompt: string;
    schedule: 'daily' | 'weekly' | 'monitor';
    app_id?: number;
    dataSource?: any;
  }) {
    return this.service.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
