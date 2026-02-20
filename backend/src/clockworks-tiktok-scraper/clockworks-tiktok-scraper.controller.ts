import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ClockworksTiktokScraperService } from './clockworks-tiktok-scraper.service';

interface ScrapeRequest {
  urls: string[];
  options?: {
    maxItems?: number;
    includeComments?: boolean;
    includeStats?: boolean;
  };
}

interface RunStatusRequest {
  runId: string;
}

@Controller('api/clockworks-tiktok-scraper')
export class ClockworksTiktokScraperController {
  constructor(private readonly clockworksTiktokScraperService: ClockworksTiktokScraperService) {}

  @Post('/run')
  async runScraper(@Body() body: ScrapeRequest) {
    try {
      const result = await this.clockworksTiktokScraperService.runScraper(body);

      if (result.success) {
        return {
          success: true,
          runId: result.runId,
          message: 'TikTok scraper started successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to start TikTok scraper',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: (error instanceof Error ? error.message : String(error)) || 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/status')
  async getStatus(@Query('runId') runId: string) {
    try {
      if (!runId) {
        return {
          success: false,
          message: 'Run ID is required',
          timestamp: new Date().toISOString(),
        };
      }

      const result = await this.clockworksTiktokScraperService.getStatus(runId);

      if (result.success) {
        return {
          success: true,
          status: result.status,
          data: result.data,
          message: 'Status retrieved successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to get status',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: (error instanceof Error ? error.message : String(error)) || 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/results')
  async getResults(@Query('runId') runId: string) {
    try {
      if (!runId) {
        return {
          success: false,
          message: 'Run ID is required',
          timestamp: new Date().toISOString(),
        };
      }

      const result = await this.clockworksTiktokScraperService.getResults(runId);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          count: result.data?.length || 0,
          message: 'Results retrieved successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to get results',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: (error instanceof Error ? error.message : String(error)) || 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}