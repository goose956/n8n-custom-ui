import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { LinkedinScraperService } from './linkedin-scraper.service';

export interface CreateScrapingJobDto {
  profileUrl: string;
  jobName?: string;
  extractFields?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface ScrapingJobQuery {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}

@Controller('api/linkedin-scraper')
export class LinkedinScraperController {
  constructor(private readonly linkedinScraperService: LinkedinScraperService) {}

  @Get()
  async getScrapingJobs(@Query() query: ScrapingJobQuery) {
    try {
      const jobs = await this.linkedinScraperService.getScrapingJobs(query);
      return {
        success: true,
        data: jobs,
        total: jobs.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve scraping jobs',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('job/:id')
  async getScrapingJobById(@Query('id') id: string) {
    try {
      const job = await this.linkedinScraperService.getScrapingJobById(id);
      if (!job) {
        throw new HttpException(
          {
            success: false,
            message: 'Scraping job not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      return {
        success: true,
        data: job
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve scraping job',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async createScrapingJob(@Body() createJobDto: CreateScrapingJobDto) {
    try {
      // Validate LinkedIn URL
      if (!createJobDto.profileUrl || !this.isValidLinkedInUrl(createJobDto.profileUrl)) {
        throw new HttpException(
          {
            success: false,
            message: 'Valid LinkedIn profile URL is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const job = await this.linkedinScraperService.createScrapingJob(createJobDto);
      return {
        success: true,
        message: 'Scraping job created successfully',
        data: job
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create scraping job',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('process/:id')
  async processScrapingJob(@Query('id') id: string) {
    try {
      const result = await this.linkedinScraperService.processScrapingJob(id);
      return {
        success: true,
        message: 'Scraping job processed successfully',
        data: result
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process scraping job',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getScrapingStats() {
    try {
      const stats = await this.linkedinScraperService.getScrapingStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve scraping statistics',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private isValidLinkedInUrl(url: string): boolean {
    const linkedinUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinUrlPattern.test(url);
  }
}