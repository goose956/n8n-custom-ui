import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { YoutubeContentAppScraperService } from './youtube-content-app-scraper.service';

interface ScrapeRequest {
  urls: string[];
  options?: {
    maxItems?: number;
    [key: string]: any;
  };
}

@Controller('api/youtube-content-app-scraper')
export class YoutubeContentAppScraperController {
  constructor(private readonly scraperService: YoutubeContentAppScraperService) {}

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  @Post('/run')
  async runScraper(@Body() body: ScrapeRequest) {
    try {
      if (!body.urls || body.urls.length === 0) {
        return {
          success: false,
          message: 'No URLs provided',
          timestamp: new Date().toISOString(),
        };
      }

      const invalidUrls = body.urls.filter(url => !this.isValidUrl(url));
      if (invalidUrls.length > 0) {
        return {
          success: false,
          message: `Invalid URLs: ${invalidUrls.join(', ')}`,
          timestamp: new Date().toISOString(),
        };
      }

      const result = await this.scraperService.runScraper(body);
      return {
        success: result.success,
        runId: result.runId,
        message: result.success ? 'Scraper started successfully' : (result.error || 'Failed to start scraper'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/status')
  async getStatus(@Query('runId') runId: string) {
    try {
      if (!runId) {
        return { success: false, message: 'Run ID is required', timestamp: new Date().toISOString() };
      }
      const result = await this.scraperService.getStatus(runId);
      return {
        success: result.success,
        status: result.status,
        data: result.data,
        message: result.success ? 'Status retrieved' : (result.error || 'Failed to get status'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/results')
  async getResults(@Query('runId') runId: string) {
    try {
      const result = await this.scraperService.getResults(runId);
      return {
        success: result.success,
        data: result.data,
        total: result.data?.length || 0,
        message: result.success ? 'Results retrieved' : (result.error || 'Failed to get results'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}