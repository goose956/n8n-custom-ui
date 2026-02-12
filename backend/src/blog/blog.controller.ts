import { Controller, Get, Post, Put, Delete, Body, Param, Res, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { Response } from 'express';

@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ─── Posts CRUD ────────────────────────────────────────────────────────────

  @Get('posts')
  async getAllPosts(@Query('projectId') projectId?: string) {
    const pid = projectId ? parseInt(projectId, 10) : undefined;
    return this.blogService.getAllPosts(pid);
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    return this.blogService.getPost(id);
  }

  @Get('stats')
  async getStats(@Query('projectId') projectId?: string) {
    const pid = projectId ? parseInt(projectId, 10) : undefined;
    return this.blogService.getStats(pid);
  }

  @Put('posts/:id')
  async updatePost(@Param('id') id: string, @Body() updates: any) {
    return this.blogService.updatePost(id, updates);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  @Post('posts/bulk-delete')
  async deletePosts(@Body() body: { ids: string[] }) {
    return this.blogService.deletePosts(body.ids);
  }

  // ─── Keywords / Queue ──────────────────────────────────────────────────────

  @Post('keywords')
  async addKeywords(@Body() body: { keywords: string[]; length?: 'short' | 'medium' | 'long'; projectId?: number }) {
    return this.blogService.addKeywords(body.keywords, body.length, body.projectId);
  }

  // ─── Generation ────────────────────────────────────────────────────────────

  @Post('generate/:id')
  async generatePost(@Param('id') id: string) {
    return this.blogService.generatePost(id);
  }

  @Post('generate-all')
  async generateAll() {
    return this.blogService.generateAll();
  }

  @Post('retry/:id')
  async retryFailed(@Param('id') id: string) {
    return this.blogService.retryFailed(id);
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────────────

  @Post('publish/:id')
  async publishPost(@Param('id') id: string) {
    return this.blogService.publishPost(id);
  }

  @Post('unpublish/:id')
  async unpublishPost(@Param('id') id: string) {
    return this.blogService.unpublishPost(id);
  }

  // ─── Project Index ─────────────────────────────────────────────────────────

  @Get('project-index')
  async getProjectIndex() {
    return this.blogService.getProjectIndex();
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  @Get('settings')
  async getSettings() {
    return this.blogService.getBlogSettings();
  }

  @Put('settings')
  async updateSettings(@Body() settings: any) {
    return this.blogService.updateBlogSettings(settings);
  }

  // ─── Sitemap ───────────────────────────────────────────────────────────────

  @Get('sitemap')
  async getSitemap() {
    return this.blogService.getSitemap();
  }

  @Post('sitemap/regenerate')
  async regenerateSitemap() {
    const result = this.blogService.generateSitemap();
    return { success: true, message: `Sitemap regenerated with ${result.urls} published posts` };
  }

  @Get('sitemap.xml')
  async getSitemapXml(@Res() res: Response) {
    const result = await this.blogService.getSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(result.content || '<?xml version="1.0" encoding="UTF-8"?><urlset/>');
  }
}
