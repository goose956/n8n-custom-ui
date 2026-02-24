import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('api/knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  // ── List all knowledge bases ────────────────────────────────
  @Get()
  list() {
    return { success: true, knowledgeBases: this.service.list() };
  }

  // ── Get single KB with chunks ───────────────────────────────
  @Get(':id')
  getOne(@Param('id') id: string) {
    const kb = this.service.getById(id);
    if (!kb) return { success: false, message: 'Knowledge base not found' };
    return { success: true, knowledgeBase: kb };
  }

  // ── Create KB ───────────────────────────────────────────────
  @Post()
  create(@Body() body: { name: string; description?: string }) {
    if (!body.name) throw new BadRequestException('Name is required');
    const kb = this.service.create(body.name, body.description || '');
    return { success: true, knowledgeBase: kb };
  }

  // ── Update KB metadata ──────────────────────────────────────
  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    const kb = this.service.update(id, body);
    if (!kb) return { success: false, message: 'Not found' };
    return { success: true, knowledgeBase: kb };
  }

  // ── Delete KB ───────────────────────────────────────────────
  @Delete(':id')
  delete(@Param('id') id: string) {
    const ok = this.service.delete(id);
    return { success: ok, message: ok ? 'Deleted' : 'Not found' };
  }

  // ── Upload file (PDF, DOCX, TXT) ───────────────────────────
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');

    const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
    let type: 'pdf' | 'docx' | 'txt';
    if (ext === 'pdf') type = 'pdf';
    else if (ext === 'docx') type = 'docx';
    else if (['txt', 'csv', 'md'].includes(ext || '')) type = 'txt';
    else throw new BadRequestException(`Unsupported file type: .${ext}. Use PDF, DOCX, or TXT.`);

    const result = await this.service.addSource(id, type, file.buffer, file.originalname);
    if (!result) return { success: false, message: 'Knowledge base not found' };

    return {
      success: true,
      filename: file.originalname,
      chunks: result.chunks,
      tokens: result.tokens,
    };
  }

  // ── Add text directly ───────────────────────────────────────
  @Post(':id/text')
  async addText(@Param('id') id: string, @Body() body: { text: string }) {
    if (!body.text) throw new BadRequestException('Text is required');
    const result = await this.service.addSource(id, 'text', body.text);
    if (!result) return { success: false, message: 'Not found' };
    return { success: true, chunks: result.chunks, tokens: result.tokens };
  }

  // ── Add URL (scrapes content) ───────────────────────────────
  @Post(':id/url')
  async addUrl(@Param('id') id: string, @Body() body: { url: string }) {
    if (!body.url) throw new BadRequestException('URL is required');
    // Simple scrape via fetch
    try {
      const resp = await fetch(body.url);
      const html = await resp.text();
      // Basic HTML → text: strip tags
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const result = await this.service.addSource(id, 'url', text, undefined, body.url);
      if (!result) return { success: false, message: 'Not found' };
      return { success: true, url: body.url, chunks: result.chunks, tokens: result.tokens };
    } catch (err: any) {
      throw new BadRequestException(`Failed to fetch URL: ${err.message}`);
    }
  }

  // ── Remove a source ─────────────────────────────────────────
  @Delete(':id/source/:sourceIndex')
  removeSource(@Param('id') id: string, @Param('sourceIndex') sourceIndex: string) {
    const ok = this.service.removeSource(id, parseInt(sourceIndex, 10));
    return { success: ok };
  }

  // ── Query / test the KB ─────────────────────────────────────
  @Post(':id/query')
  query(@Param('id') id: string, @Body() body: { question: string; topK?: number }) {
    if (!body.question) throw new BadRequestException('Question is required');
    const chunks = this.service.query(id, body.question, body.topK || 8);
    return { success: true, chunks, count: chunks.length };
  }
}
