import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { LinkedinScraperService } from './linkedin-scraper.service';

export interface SavedProfile {
  id: string;
  profileUrl: string;
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  recommendations?: any[];
  scrapedAt: string;
}

interface ScrapeLinkedinProfileRequest {
  profileUrls: string[];
  includeSkills?: boolean;
  includeEducation?: boolean;
  includeExperience?: boolean;
  includeRecommendations?: boolean;
}

@Controller('api/linkedin-scraper')
export class LinkedinScraperController {
  constructor(private readonly linkedinScraperService: LinkedinScraperService) {}

  @Post('scrape')
  async scrapeProfiles(@Body() body: ScrapeLinkedinProfileRequest) {
    try {
      const result = await this.linkedinScraperService.scrapeLinkedinProfiles(body);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: `Successfully scraped ${result.data?.length || 0} LinkedIn profiles`,
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
        message: error instanceof Error ? error.message : 'Unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('saved')
  async getSavedProfiles(): Promise<{ success: boolean; data?: SavedProfile[]; message: string; timestamp: string; }> {
    try {
      const result = await this.linkedinScraperService.getSavedProfiles();

      return {
        success: true,
        data: result as SavedProfile[],
        message: `Retrieved ${result.length} saved LinkedIn profiles`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve saved profiles',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('saved/:id')
  async getSavedProfile(@Param('id') id: string): Promise<{ success: boolean; data?: SavedProfile; message: string; timestamp: string; }> {
    try {
      const result = await this.linkedinScraperService.getSavedProfile(id);

      if (result) {
        return {
          success: true,
          data: result as SavedProfile,
          message: 'Profile retrieved successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: 'Profile not found',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve profile',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Delete('saved/:id')
  async deleteSavedProfile(@Param('id') id: string) {
    try {
      const result = await this.linkedinScraperService.deleteSavedProfile(id);

      if (result) {
        return {
          success: true,
          message: 'Profile deleted successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: 'Profile not found',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete profile',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('analyze/:id')
  async analyzeProfile(@Param('id') id: string) {
    try {
      const result = await this.linkedinScraperService.analyzeProfile(id);

      if (result.success) {
        return {
          success: true,
          data: result.analysis,
          message: 'Profile analysis completed successfully',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          message: result.error || 'Profile analysis failed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze profile',
        timestamp: new Date().toISOString(),
      };
    }
  }
}