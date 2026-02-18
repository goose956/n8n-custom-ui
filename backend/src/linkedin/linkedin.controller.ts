import { Controller, Post, Body } from '@nestjs/common';
import { LinkedInService } from './linkedin.service';

interface ScrapeProfileRequest {
  profileUrls: string[];
  recordCount?: number;
}

@Controller('api/linkedin')
export class LinkedInController {
  constructor(private readonly linkedInService: LinkedInService) {}

  @Post('scrape-profiles')
  async scrapeProfiles(@Body() body: ScrapeProfileRequest) {
    try {
      const result = await this.linkedInService.scrapeLinkedInProfiles(body);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          count: result.count,
          message: `Successfully scraped ${result.count} LinkedIn profiles`,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'LinkedIn profile scraping failed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred while scraping LinkedIn profiles',
        timestamp: new Date().toISOString(),
      };
    }
  }
}