import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LinkedinProfileScraperService } from './linkedin-profile-scraper.service';

export class ScrapeProfileDto {
  profileUrl: string;
  includeConnections?: boolean;
  includeExperience?: boolean;
  includeEducation?: boolean;
}

export class BulkScrapeDto {
  profileUrls: string[];
  includeConnections?: boolean;
  includeExperience?: boolean;
  includeEducation?: boolean;
}

@Controller('api/linkedin-scrape-profiles')
export class LinkedinProfileScraperController {
  private readonly logger = new Logger(LinkedinProfileScraperController.name);

  constructor(
    private readonly linkedinProfileScraperService: LinkedinProfileScraperService,
  ) {}

  @Get()
  async getScrapedProfiles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (pageNum < 1 || limitNum < 1) {
        throw new HttpException(
          'Page and limit must be positive numbers',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.linkedinProfileScraperService.getScrapedProfiles(
        pageNum,
        limitNum,
        search,
        status,
      );

      return {
        success: true,
        data: result.profiles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching scraped profiles:', error);
      throw new HttpException(
        'Failed to fetch scraped profiles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('profile')
  async getScrapedProfile(@Query('id') id: string) {
    try {
      if (!id) {
        throw new HttpException('Profile ID is required', HttpStatus.BAD_REQUEST);
      }

      const profile = await this.linkedinProfileScraperService.getScrapedProfile(id);

      if (!profile) {
        throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      this.logger.error('Error fetching scraped profile:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch scraped profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('scrape')
  async scrapeProfile(@Body() scrapeDto: ScrapeProfileDto) {
    try {
      if (!scrapeDto.profileUrl) {
        throw new HttpException('Profile URL is required', HttpStatus.BAD_REQUEST);
      }

      // Validate LinkedIn URL format
      const linkedinUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedinUrlPattern.test(scrapeDto.profileUrl)) {
        throw new HttpException(
          'Invalid LinkedIn profile URL format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.linkedinProfileScraperService.scrapeProfile(scrapeDto);

      return {
        success: true,
        data: result,
        message: 'Profile scraping initiated successfully',
      };
    } catch (error) {
      this.logger.error('Error scraping profile:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to scrape profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('scrape-bulk')
  async scrapeBulkProfiles(@Body() bulkScrapeDto: BulkScrapeDto) {
    try {
      if (!bulkScrapeDto.profileUrls || bulkScrapeDto.profileUrls.length === 0) {
        throw new HttpException('Profile URLs are required', HttpStatus.BAD_REQUEST);
      }

      if (bulkScrapeDto.profileUrls.length > 50) {
        throw new HttpException(
          'Maximum 50 profiles can be scraped at once',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate all LinkedIn URLs
      const linkedinUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      const invalidUrls = bulkScrapeDto.profileUrls.filter(url => !linkedinUrlPattern.test(url));
      
      if (invalidUrls.length > 0) {
        throw new HttpException(
          `Invalid LinkedIn URLs: ${invalidUrls.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.linkedinProfileScraperService.scrapeBulkProfiles(bulkScrapeDto);

      return {
        success: true,
        data: result,
        message: 'Bulk profile scraping initiated successfully',
      };
    } catch (error) {
      this.logger.error('Error scraping bulk profiles:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to scrape bulk profiles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cancel')
  async cancelScraping(@Body() body: { profileId: string }) {
    try {
      if (!body.profileId) {
        throw new HttpException('Profile ID is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.linkedinProfileScraperService.cancelScraping(body.profileId);

      return {
        success: true,
        data: result,
        message: 'Scraping cancelled successfully',
      };
    } catch (error) {
      this.logger.error('Error cancelling scraping:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel scraping',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getScrapingStats() {
    try {
      const stats = await this.linkedinProfileScraperService.getScrapingStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error fetching scraping stats:', error);
      throw new HttpException(
        'Failed to fetch scraping stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}