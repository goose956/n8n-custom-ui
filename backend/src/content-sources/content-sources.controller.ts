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
  UsePipes,
} from '@nestjs/common';
import { ContentSourcesService } from './content-sources.service';
import { CreateContentSourceDto, UpdateContentSourceDto } from './dto/content-sources.dto';

@Controller('api/content-sources')
export class ContentSourcesController {
  constructor(private readonly contentSourcesService: ContentSourcesService) {}

  @Get()
  async getAllContentSources(
    @Query('type') type?: string,
    @Query('active') active?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      const filters = {
        type,
        active: active !== undefined ? active : undefined,
      };
      
      const pagination = {
        limit: limit ? parseInt(limit.toString()) : 50,
        offset: offset ? parseInt(offset.toString()) : 0,
      };

      const result = await this.contentSourcesService.findAll(filters, pagination);
      
      return {
        success: true,
        data: result.data,
        total: result.total,
        pagination: {
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: result.total > pagination.offset + pagination.limit,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve content sources',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getContentSourceById(@Param('id') id: string) {
    try {
      const contentSource = await this.contentSourcesService.findById(id);
      
      if (!contentSource) {
        throw new HttpException(
          {
            success: false,
            message: 'Content source not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: contentSource,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve content source',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createContentSource(@Body() createContentSourceDto: CreateContentSourceDto) {
    try {
      const contentSource = await this.contentSourcesService.create(createContentSourceDto);
      
      return {
        success: true,
        message: 'Content source created successfully',
        data: contentSource,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create content source',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateContentSource(
    @Param('id') id: string,
    @Body() updateContentSourceDto: UpdateContentSourceDto,
  ) {
    try {
      const existingSource = await this.contentSourcesService.findById(id);
      
      if (!existingSource) {
        throw new HttpException(
          {
            success: false,
            message: 'Content source not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedSource = await this.contentSourcesService.update(id, updateContentSourceDto);
      
      return {
        success: true,
        message: 'Content source updated successfully',
        data: updatedSource,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update content source',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteContentSource(@Param('id') id: string) {
    try {
      const existingSource = await this.contentSourcesService.findById(id);
      
      if (!existingSource) {
        throw new HttpException(
          {
            success: false,
            message: 'Content source not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      await this.contentSourcesService.delete(id);
      
      return {
        success: true,
        message: 'Content source deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete content source',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/validate')
  async validateContentSource(@Param('id') id: string) {
    try {
      const existingSource = await this.contentSourcesService.findById(id);
      
      if (!existingSource) {
        throw new HttpException(
          {
            success: false,
            message: 'Content source not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const validationResult = await this.contentSourcesService.validateSource(id);
      
      return {
        success: true,
        message: 'Content source validation completed',
        data: validationResult,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to validate content source',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  async getContentSourcesStats() {
    try {
      const stats = await this.contentSourcesService.getStats();
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve content sources statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
