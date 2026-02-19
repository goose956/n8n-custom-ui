import { Controller, Post, Body, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { LinkedinAnalyticsScraperService } from './linkedin-analytics-scraper.service';

export class ScrapeAnalyticsDto {
  profileUrl: string;
  timeRange?: string; // 'week' | 'month' | 'quarter' | 'year'
  metrics?: string[]; // ['views', 'impressions', 'engagements', 'clicks']
}

export class ScrapeAnalyticsResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedCompletionTime?: number; // seconds
}

@Controller('api/linkedin-analytics-scraper-api')
export class LinkedinAnalyticsScraperController {
  private readonly logger = new Logger(LinkedinAnalyticsScraperController.name);

  constructor(
    private readonly linkedinAnalyticsScraperService: LinkedinAnalyticsScraperService
  ) {}

  @Post('/analytics')
  async scrapeAnalytics(@Body() scrapeDto: ScrapeAnalyticsDto): Promise<ScrapeAnalyticsResponse> {
    try {
      this.logger.log(`Starting LinkedIn analytics scrape for profile: ${scrapeDto.profileUrl}`);
      
      // Validate input
      if (!scrapeDto.profileUrl) {
        throw new HttpException('Profile URL is required', HttpStatus.BAD_REQUEST);
      }

      if (!this.isValidLinkedInUrl(scrapeDto.profileUrl)) {
        throw new HttpException('Invalid LinkedIn profile URL format', HttpStatus.BAD_REQUEST);
      }

      // Set defaults
      const timeRange = scrapeDto.timeRange || 'month';
      const metrics = scrapeDto.metrics || ['views', 'impressions', 'engagements', 'clicks'];

      // Validate time range
      const validTimeRanges = ['week', 'month', 'quarter', 'year'];
      if (!validTimeRanges.includes(timeRange)) {
        throw new HttpException('Invalid time range. Must be one of: week, month, quarter, year', HttpStatus.BAD_REQUEST);
      }

      // Validate metrics
      const validMetrics = ['views', 'impressions', 'engagements', 'clicks', 'followers', 'reach'];
      const invalidMetrics = metrics.filter(metric => !validMetrics.includes(metric));
      if (invalidMetrics.length > 0) {
        throw new HttpException(`Invalid metrics: ${invalidMetrics.join(', ')}. Valid metrics: ${validMetrics.join(', ')}`, HttpStatus.BAD_REQUEST);
      }

      const result = await this.linkedinAnalyticsScraperService.initiateScrapeJob({
        profileUrl: scrapeDto.profileUrl,
        timeRange,
        metrics
      });

      this.logger.log(`Analytics scrape job created with ID: ${result.jobId}`);

      return {
        success: true,
        jobId: result.jobId,
        message: 'LinkedIn analytics scrape job initiated successfully',
        estimatedCompletionTime: result.estimatedCompletionTime
      };

    } catch (error) {
      this.logger.error(`Error initiating LinkedIn analytics scrape: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error while initiating scrape job',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private isValidLinkedInUrl(url: string): boolean {
    const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9\-]+\/?$/;
    return linkedinUrlPattern.test(url);
  }
}