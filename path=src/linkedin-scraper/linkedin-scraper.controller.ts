```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { LinkedinScraperService } from './linkedin-scraper.service';
import { CreateScrapingJobDto, SearchQueryDto } from './dto/linkedin-scraper.dto';

@Controller('api/linkedin-scraper')
export class LinkedinScraperController {
  constructor(private readonly linkedinScraperService: LinkedinScraperService) {}

  @Post('jobs')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createScrapingJob(@Body() createJobDto: CreateScrapingJobDto) {
    try {
      const job = await this.linkedinScraperService.createScrapingJob(createJobDto);
      return {
        status: 'success',
        message: 'Scraping job created successfully',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to create scraping job',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('jobs')
  async getScrapingJobs(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const jobs = await this.linkedinScraperService.getScrapingJobs({
        status,
        page: Number(page),
        limit: Number(limit),
      });
      return {
        status: 'success',
        data: jobs,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to fetch scraping jobs',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs/:jobId')
  async getScrapingJob(@Param('jobId') jobId: string) {
    try {
      const job = await this.linkedinScraperService.getScrapingJobById(jobId);
      if (!job) {
        throw new HttpException(
          {
            status: 'error',
            message: 'Scraping job not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: 'success',
        data: job,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to fetch scraping job',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('jobs/:jobId/start')
  async startScrapingJob(@Param('jobId') jobId: string) {
    try {
      const job = await this.linkedinScraperService.startScrapingJob(jobId);
      return {
        status: 'success',
        message: 'Scraping job started',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to start scraping job',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('jobs/:jobId/cancel')
  async cancelScrapingJob(@Param('jobId') jobId: string) {
    try {
      const job = await this.linkedinScraperService.cancelScrapingJob(jobId);
      return {
        status: 'success',
        message: 'Scraping job cancelled',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to cancel scraping job',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('search')
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchProfiles(@Body() searchQuery: SearchQueryDto) {
    try {
      const profiles = await this.linkedinScraperService.searchProfiles(searchQuery);
      return {
        status: 'success',
        message: 'Profile search completed',
        data: profiles,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to search profiles',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('profiles')
  async getScrapedProfiles(
    @Query('jobId') jobId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const profiles = await this.linkedinScraperService.getScrapedProfiles({
        jobId,
        page: Number(page),
        limit: Number(limit),
      });
      return {
        status: 'success',
        data: profiles,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to fetch scraped profiles',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getScrapingStats() {
    try {
      const stats = await this.linkedinScraperService.getScrapingStats();
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Failed to fetch scraping statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```