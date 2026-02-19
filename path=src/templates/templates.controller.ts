import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateQueryDto } from './dto/template.dto';

@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getAllTemplates(@Query() query: TemplateQueryDto) {
    try {
      const templates = await this.templatesService.findAll(query);
      return {
        success: true,
        data: templates,
        message: 'Templates retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve templates',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    try {
      const template = await this.templatesService.findById(id);
      if (!template) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: template,
        message: 'Template retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve template',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    try {
      const template = await this.templatesService.create(createTemplateDto);
      return {
        success: true,
        data: template,
        message: 'Template created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create template',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    try {
      const template = await this.templatesService.update(id, updateTemplateDto);
      if (!template) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: template,
        message: 'Template updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update template',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    try {
      const deleted = await this.templatesService.delete(id);
      if (!deleted) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete template',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/performance')
  async getTemplatePerformance(@Param('id') id: string) {
    try {
      const performance = await this.templatesService.getPerformanceMetrics(id);
      if (!performance) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: performance,
        message: 'Performance metrics retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve performance metrics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/track-usage')
  async trackTemplateUsage(@Param('id') id: string, @Body() trackingData: any) {
    try {
      const result = await this.templatesService.trackUsage(id, trackingData);
      if (!result) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: result,
        message: 'Usage tracked successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to track usage',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}