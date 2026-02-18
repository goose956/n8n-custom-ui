import { Controller, Get, Post, Patch, Delete, Body, Param, Query, NotFoundException } from'@nestjs/common';
import { PagesService, Page } from'./pages.service';

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
 throw new NotFoundException('Page not found');
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
 throw new NotFoundException('Page not found');
 }
 return {
 success: true,
 data: page,
 timestamp: new Date().toISOString(),
 };
 }

 @Delete()
 deleteBulk(
 @Query('app_id') app_id: string,
 @Query('page_type') page_type: string,
 ) {
 if (!app_id || !page_type) {
 return {
 success: false,
 error: 'Both app_id and page_type query params are required',
 };
 }
 const count = this.pagesService.deleteByAppAndType(
 parseInt(app_id, 10),
 page_type,
 );
 return {
 success: true,
 deleted: count,
 message: `Deleted ${count} ${page_type} page(s)`,
 timestamp: new Date().toISOString(),
 };
 }

 @Delete(':id')
 delete(@Param('id') id: string) {
 const deleted = this.pagesService.delete(parseInt(id, 10));
 if (!deleted) {
 throw new NotFoundException('Page not found');
 }
 return {
 success: true,
 message:'Page deleted successfully',
 timestamp: new Date().toISOString(),
 };
 }
}
