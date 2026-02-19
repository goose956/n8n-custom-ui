import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

export interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  config: {
    apiUrl?: string;
    apiKey?: string;
    webhookUrl?: string;
    settings?: Record<string, any>;
  };
  metadata: {
    lastSync?: string;
    syncInterval?: number;
    errorCount?: number;
    lastError?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationDto {
  name: string;
  type: string;
  description?: string;
  config: {
    apiUrl?: string;
    apiKey?: string;
    webhookUrl?: string;
    settings?: Record<string, any>;
  };
  metadata?: {
    syncInterval?: number;
  };
}

export interface UpdateIntegrationDto {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending' | 'error';
  config?: {
    apiUrl?: string;
    apiKey?: string;
    webhookUrl?: string;
    settings?: Record<string, any>;
  };
  metadata?: {
    syncInterval?: number;
    errorCount?: number;
    lastError?: string;
  };
}

@Controller('api/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationsService.findAll();
  }

  @Get(':id')
  async getIntegration(@Param('id') id: string): Promise<Integration> {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Integration ID is required');
    }

    const integration = await this.integrationsService.findOne(id);
    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createIntegration(@Body() createIntegrationDto: CreateIntegrationDto): Promise<Integration> {
    if (!createIntegrationDto.name || !createIntegrationDto.type) {
      throw new BadRequestException('Name and type are required fields');
    }

    if (createIntegrationDto.name.trim() === '' || createIntegrationDto.type.trim() === '') {
      throw new BadRequestException('Name and type cannot be empty');
    }

    return this.integrationsService.create(createIntegrationDto);
  }

  @Put(':id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<Integration> {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Integration ID is required');
    }

    const existingIntegration = await this.integrationsService.findOne(id);
    if (!existingIntegration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return this.integrationsService.update(id, updateIntegrationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Param('id') id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Integration ID is required');
    }

    const existingIntegration = await this.integrationsService.findOne(id);
    if (!existingIntegration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    await this.integrationsService.remove(id);
  }

  @Post(':id/test')
  async testIntegration(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Integration ID is required');
    }

    const integration = await this.integrationsService.findOne(id);
    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return this.integrationsService.testConnection(id);
  }

  @Post(':id/sync')
  async syncIntegration(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Integration ID is required');
    }

    const integration = await this.integrationsService.findOne(id);
    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return this.integrationsService.syncData(id);
  }
}