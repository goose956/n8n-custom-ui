import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FunnelsService } from './funnels.service';

@Controller('api/funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Get()
  async getFunnels(@Query('appId') appId: string) {
    return this.funnelsService.getFunnels(parseInt(appId, 10));
  }

  @Get(':id')
  async getFunnel(@Param('id') id: string) {
    return this.funnelsService.getFunnel(parseInt(id, 10));
  }

  @Post()
  async createFunnel(@Body() body: { appId: number; name: string; description?: string }) {
    return this.funnelsService.createFunnel(body.appId, body.name, body.description);
  }

  @Put(':id')
  async updateFunnel(@Param('id') id: string, @Body() body: any) {
    return this.funnelsService.updateFunnel(parseInt(id, 10), body);
  }

  @Delete(':id')
  async deleteFunnel(@Param('id') id: string) {
    return this.funnelsService.deleteFunnel(parseInt(id, 10));
  }

  @Post(':id/tiers')
  async addTier(@Param('id') id: string, @Body() tier: any) {
    return this.funnelsService.addTier(parseInt(id, 10), tier);
  }

  @Delete(':id/tiers/:tierId')
  async removeTier(@Param('id') id: string, @Param('tierId') tierId: string) {
    return this.funnelsService.removeTier(parseInt(id, 10), tierId);
  }
}
