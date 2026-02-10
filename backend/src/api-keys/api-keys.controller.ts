import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Controller('api/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async saveApiKey(@Body() body: { name: string; value: string }) {
    return this.apiKeysService.saveApiKey(body.name, body.value);
  }

  @Get()
  async getApiKeys() {
    return this.apiKeysService.getApiKeys();
  }

  @Get(':name')
  async getApiKey(@Param('name') name: string) {
    return this.apiKeysService.getApiKey(name);
  }

  @Delete(':name')
  async deleteApiKey(@Param('name') name: string) {
    return this.apiKeysService.deleteApiKey(name);
  }
}
