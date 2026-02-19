import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';

@Controller('api/integrations')
@UsePipes(new ValidationPipe({ transform: true }))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getAllIntegrations() {
    try {
      return await this.integrationsService.getAllIntegrations();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve integrations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getIntegrationById(@Param('id') id: string) {
    try {
      const integration = await this.integrationsService.getIntegrationById(id);
      if (!integration) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }
      return integration;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/sync-status')
  async getSyncStatus(@Param('id') id: string) {
    try {
      const syncStatus = await this.integrationsService.getSyncStatus(id);
      if (!syncStatus) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }
      return syncStatus;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve sync status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createIntegration(@Body() createIntegrationDto: CreateIntegrationDto) {
    try {
      return await this.integrationsService.createIntegration(createIntegrationDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create integration',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/sync')
  async triggerSync(@Param('id') id: string) {
    try {
      const result = await this.integrationsService.triggerSync(id);
      if (!result) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to trigger sync',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ) {
    try {
      const updatedIntegration = await this.integrationsService.updateIntegration(
        id,
        updateIntegrationDto,
      );
      if (!updatedIntegration) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }
      return updatedIntegration;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  async updateIntegrationStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { status: 'active' | 'inactive' | 'error' },
  ) {
    try {
      const updatedIntegration = await this.integrationsService.updateIntegrationStatus(
        id,
        statusUpdate.status,
      );
      if (!updatedIntegration) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }
      return updatedIntegration;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update integration status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}