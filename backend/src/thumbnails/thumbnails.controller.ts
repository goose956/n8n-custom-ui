import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ThumbnailsService } from './thumbnails.service';

@Controller('api/thumbnails')
export class ThumbnailsController {
  constructor(private readonly thumbnailsService: ThumbnailsService) {}

  @Get()
  async findAll() {
    return await this.thumbnailsService.findAll();
  }

  @Post()
  async create(@Body() createThumbnailDto: { name: string; url: string }) {
    return await this.thumbnailsService.create(createThumbnailDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateThumbnailDto: { name?: string; url?: string }) {
    return await this.thumbnailsService.update(id, updateThumbnailDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.thumbnailsService.remove(id);
  }
}
