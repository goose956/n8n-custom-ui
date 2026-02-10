import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'n8n Custom UI Backend is running',
      timestamp: new Date().toISOString(),
    };
  }
}
