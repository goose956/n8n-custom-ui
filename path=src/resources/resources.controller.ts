import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto, ResourceFilterDto } from './dto/resources.dto';

@Controller('api/resources-api')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllResources(@Query() filterDto: ResourceFilterDto) {
    try {
      return await this.resourcesService.getAllResources(filterDto);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve resources',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getResourceById(@Param('id') id: string) {
    try {
      const resource = await this.resourcesService.getResourceById(id);
      if (!resource) {
        throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
      }
      return resource;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve resource',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async createResource(@Body() createResourceDto: CreateResourceDto) {
    try {
      return await this.resourcesService.createResource(createResourceDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create resource',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async updateResource(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    try {
      const updatedResource = await this.resourcesService.updateResource(
        id,
        updateResourceDto,
      );
      if (!updatedResource) {
        throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
      }
      return updatedResource;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update resource',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('category/:category')
  async getResourcesByCategory(@Param('category') category: string) {
    try {
      return await this.resourcesService.getResourcesByCategory(category);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve resources by category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/:term')
  async searchResources(@Param('term') searchTerm: string) {
    try {
      return await this.resourcesService.searchResources(searchTerm);
    } catch (error) {
      throw new HttpException(
        'Failed to search resources',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}