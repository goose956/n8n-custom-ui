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
  ValidationPipe,
} from '@nestjs/common';
import { AutoResponseTemplatesService } from './auto-response-templates.service';
import {
  CreateAutoResponseTemplateDto,
  UpdateAutoResponseTemplateDto,
  AutoResponseTemplateQueryDto,
} from './dto/auto-response-templates.dto';

@Controller('api/auto-response-templates')
export class AutoResponseTemplatesController {
  constructor(
    private readonly autoResponseTemplatesService: AutoResponseTemplatesService,
  ) {}

  @Get()
  async getAllTemplates(@Query() query: AutoResponseTemplateQueryDto) {
    try {
      const templates = await this.autoResponseTemplatesService.getAllTemplates(query);
      return {
        status: 'success',
        data: templates,
        message: 'Auto response templates retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve auto response templates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metrics')
  async getMetrics(@Query('templateId') templateId?: string) {
    try {
      const metrics = await this.autoResponseTemplatesService.getConversionMetrics(templateId);
      return {
        status: 'success',
        data: metrics,
        message: 'Conversion metrics retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve conversion metrics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sent-responses')
  async getSentResponses(
    @Query('templateId') templateId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const sentResponses = await this.autoResponseTemplatesService.getSentResponses(
        templateId,
        page,
        limit,
      );
      return {
        status: 'success',
        data: sentResponses,
        message: 'Sent responses retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve sent responses',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    try {
      const template = await this.autoResponseTemplatesService.getTemplateById(id);
      if (!template) {
        throw new HttpException(
          {
            status: 'error',
            message: 'Auto response template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: 'success',
        data: template,
        message: 'Auto response template retrieved successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to retrieve auto response template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createTemplate(
    @Body(ValidationPipe) createTemplateDto: CreateAutoResponseTemplateDto,
  ) {
    try {
      const template = await this.autoResponseTemplatesService.createTemplate(
        createTemplateDto,
      );
      return {
        status: 'success',
        data: template,
        message: 'Auto response template created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to create auto response template',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/trigger')
  async triggerAutoResponse(
    @Param('id') id: string,
    @Body() triggerData: {
      recipientEmail: string;
      contextData?: Record<string, any>;
      metadata?: Record<string, any>;
    },
  ) {
    try {
      const sentResponse = await this.autoResponseTemplatesService.triggerAutoResponse(
        id,
        triggerData.recipientEmail,
        triggerData.contextData,
        triggerData.metadata,
      );
      return {
        status: 'success',
        data: sentResponse,
        message: 'Auto response triggered successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to trigger auto response',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTemplateDto: UpdateAutoResponseTemplateDto,
  ) {
    try {
      const template = await this.autoResponseTemplatesService.updateTemplate(
        id,
        updateTemplateDto,
      );
      if (!template) {
        throw new HttpException(
          {
            status: 'error',
            message: 'Auto response template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: 'success',
        data: template,
        message: 'Auto response template updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to update auto response template',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/toggle-status')
  async toggleTemplateStatus(@Param('id') id: string) {
    try {
      const template = await this.autoResponseTemplatesService.toggleTemplateStatus(id);
      if (!template) {
        throw new HttpException(
          {
            status: 'error',
            message: 'Auto response template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: 'success',
        data: template,
        message: 'Template status updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to toggle template status',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    try {
      const success = await this.autoResponseTemplatesService.deleteTemplate(id);
      if (!success) {
        throw new HttpException(
          {
            status: 'error',
            message: 'Auto response template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        status: 'success',
        message: 'Auto response template deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to delete auto response template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
