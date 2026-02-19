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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/templates.dto';

@Controller('api/templates-api')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getAllTemplates() {
    try {
      return await this.templatesService.findAll();
    } catch (error) {
      throw new BadRequestException('Failed to retrieve templates');
    }
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    try {
      const template = await this.templatesService.findById(id);
      if (!template) {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve template');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    try {
      return await this.templatesService.create(createTemplateDto);
    } catch (error) {
      throw new BadRequestException('Failed to create template');
    }
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    try {
      const updatedTemplate = await this.templatesService.update(id, updateTemplateDto);
      if (!updatedTemplate) {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      return updatedTemplate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update template');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string) {
    try {
      const deleted = await this.templatesService.delete(id);
      if (!deleted) {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete template');
    }
  }
}