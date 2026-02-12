import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AppPlannerService } from './app-planner.service';

@Controller('api/app-planner')
export class AppPlannerController {
  constructor(private readonly plannerService: AppPlannerService) {}

  @Get()
  getAll() {
    return { success: true, data: this.plannerService.getAll(), timestamp: new Date().toISOString() };
  }

  @Get('stats')
  getStats() {
    return { success: true, data: this.plannerService.getStats(), timestamp: new Date().toISOString() };
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    const plan = this.plannerService.getById(id);
    if (!plan) return { success: false, error: 'Not found' };
    return { success: true, data: plan };
  }

  @Post()
  create(@Body() body: any) {
    const plan = this.plannerService.create(body);
    return { success: true, data: plan, timestamp: new Date().toISOString() };
  }

  @Put('reorder')
  reorder(@Body() body: { orderedIds: string[] }) {
    const plans = this.plannerService.reorder(body.orderedIds);
    return { success: true, data: plans, timestamp: new Date().toISOString() };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const plan = this.plannerService.update(id, body);
    if (!plan) return { success: false, error: 'Not found' };
    return { success: true, data: plan, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const ok = this.plannerService.delete(id);
    if (!ok) return { success: false, error: 'Not found' };
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    const plan = this.plannerService.duplicate(id);
    if (!plan) return { success: false, error: 'Not found' };
    return { success: true, data: plan, timestamp: new Date().toISOString() };
  }
}
