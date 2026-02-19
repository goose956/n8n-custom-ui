import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ClockworksTiktokScraperService } from './clockworks-tiktok-scraper.service';

interface RunScraperRequest {
  profiles?: string[];
  hashtags?: string[];
  searchTerms?: string[];
  maxItems?: number;
  maxRequestRetries?: number;
  maxScrollWaitTime?: number;
  resultsPerPage?: number;
}

interface ScraperResponse {
  success: boolean;
  runId?: string;
  message?: string;
  timestamp: string;
}

interface ScraperResultsResponse {
  success: boolean;
  data?: any[];
  message?: string;
  timestamp: string;
}

interface ScraperStatusResponse {
  success: boolean;
  status?: string;
  runDetails?: any;
  message?: string;
  timestamp: string;
}

@Controller('api/clockworks-tiktok-scraper')
export class ClockworksTiktokScraperController {
  constructor(private readonly scraperService: ClockworksTiktokScraperService) {}

  @Post('run')
  async runScraper(@Body() body: RunScraperRequest): Promise<ScraperResponse> {
    try {
      const result = await this.scraperService.runTiktokScraper(body);
      
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
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('results/:runId')
  async getResults(@Param('runId') runId: string): Promise<ScraperResultsResponse> {
    try {
      const result = await this.scraperService.getScraperResults(runId);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Results retrieved successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to retrieve results',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status/:runId')
  async getStatus(@Param('runId') runId: string): Promise<ScraperStatusResponse> {
    try {
      const result = await this.scraperService.getScraperStatus(runId);
      
      if (result.success) {
        return {
          success: true,
          status: result.status,
          runDetails: result.runDetails,
          message: 'Status retrieved successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to retrieve status',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }
}