import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { PagesService, Page } from './pages.service';

@Controller('api/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  create(
    @Body()
    createPageDto: {
      app_id: number;
      page_type: string;
      title: string;
      content_json?: Record<string, unknown>;
    },
  ) {
    const page = this.pagesService.create(createPageDto);
    return {
      success: true,
      data: page,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  findAll(@Query('app_id') app_id?: string) {
    const appId = app_id ? parseInt(app_id, 10) : undefined;
    const pages = this.pagesService.findAll(appId);
    return {
      success: true,
      data: pages,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const page = this.pagesService.findOne(parseInt(id, 10));
    if (!page) {
      return {
        success: false,
        error: 'Page not found',
        statusCode: 404,
      };
    }
    return {
      success: true,
      data: page,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePageDto: Partial<any>) {
    const page = this.pagesService.update(parseInt(id, 10), updatePageDto);
    if (!page) {
      return {
        success: false,
        error: 'Page not found',
        statusCode: 404,
      };
    }
    return {
      success: true,
      data: page,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const deleted = this.pagesService.delete(parseInt(id, 10));
    if (!deleted) {
      return {
        success: false,
        error: 'Page not found',
        statusCode: 404,
      };
    }
    return {
      success: true,
      message: 'Page deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
