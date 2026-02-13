import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AppManagementService } from './apps.service';
import { CreateAppDto, UpdateAppDto, ApiResponse, App } from '../types/saas-factory.types';

/**
 * Controller for managing multiple SaaS applications
 */
@Controller('api/apps')
export class AppsController {
  constructor(private readonly appsService: AppManagementService) {}

  /**
   * GET /api/apps - List all apps
   */
  @Get()
  async listApps(): Promise<ApiResponse<App[]>> {
    try {
      const apps = await this.appsService.getAllApps();
      return {
        success: true,
        data: apps,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * GET /api/apps/:id - Get app by ID
   */
  @Get(':id')
  async getAppById(@Param('id') id: string): Promise<ApiResponse<App>> {
    try {
      const app = await this.appsService.getAppById(parseInt(id, 10));
      return {
        success: true,
        data: app,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * GET /api/apps/slug/:slug - Get app by slug (for routing)
   */
  @Get('slug/:slug')
  async getAppBySlug(@Param('slug') slug: string): Promise<ApiResponse<App>> {
    try {
      const app = await this.appsService.getAppBySlug(slug);
      return {
        success: true,
        data: app,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * POST /api/apps - Create a new app
   */
  @Post()
  @HttpCode(201)
  async createApp(@Body() dto: CreateAppDto): Promise<ApiResponse<App>> {
    try {
      // Validation
      if (!dto.name || !dto.slug) {
        throw new BadRequestException('name and slug are required');
      }

      if (!/^[a-z0-9\-]+$/.test(dto.slug)) {
        throw new BadRequestException('slug must be lowercase alphanumeric with hyphens only');
      }

      const app = await this.appsService.createApp(dto);
      return {
        success: true,
        data: app,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * PUT /api/apps/:id - Update an app
   */
  @Put(':id')
  async updateApp(@Param('id') id: string, @Body() dto: UpdateAppDto): Promise<ApiResponse<App>> {
    try {
      // Validation
      if (Object.keys(dto).length === 0) {
        throw new BadRequestException('No fields to update');
      }

      const app = await this.appsService.updateApp(parseInt(id, 10), dto);
      return {
        success: true,
        data: app,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * DELETE /api/apps/:id - Delete an app and all associated data
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteApp(@Param('id') id: string): Promise<void> {
    try {
      await this.appsService.deleteApp(parseInt(id, 10));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * GET /api/apps/:id/stats - Get app statistics
   */
  @Get(':id/stats')
  async getAppStats(@Param('id') id: string): Promise<ApiResponse<any>> {
    try {
      const stats = await this.appsService.getAppStats(parseInt(id, 10));
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * POST /api/apps/:id/clone - Clone an app
   */
  @Post(':id/clone')
  @HttpCode(201)
  async cloneApp(
    @Param('id') id: string,
    @Body() dto: CreateAppDto
  ): Promise<ApiResponse<App>> {
    try {
      if (!dto.name || !dto.slug) {
        throw new BadRequestException('name and slug are required');
      }

      if (!/^[a-z0-9\-]+$/.test(dto.slug)) {
        throw new BadRequestException('slug must be lowercase alphanumeric with hyphens only');
      }

      const app = await this.appsService.cloneApp(parseInt(id, 10), dto);
      return {
        success: true,
        data: app,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }

  /**
   * POST /api/apps/:id/generate-pages - AI-generate page content from app description
   */
  @Post(':id/generate-pages')
  async generatePages(
    @Param('id') id: string,
    @Body() body?: { targetAudience?: string; keyProblem?: string; uniqueValue?: string },
  ): Promise<ApiResponse<{ pagesUpdated: number }>> {
    try {
      const extraContext = body && (body.targetAudience || body.keyProblem || body.uniqueValue) ? body : undefined;
      const result = await this.appsService.generatePagesContent(parseInt(id, 10), extraContext);
      if (!result.success) {
        return {
          success: false,
          data: { pagesUpdated: 0 },
          error: result.error,
          timestamp: new Date().toISOString(),
        };
      }
      return {
        success: true,
        data: { pagesUpdated: result.pagesUpdated },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      throw new BadRequestException(message);
    }
  }
}
