import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { SocialMonitorService } from './social-monitor.service';

@Controller('api/social-monitor')
export class SocialMonitorController {
  constructor(private readonly service: SocialMonitorService) {}

  /* ─── Keywords ────────────────────────────────────────────────── */

  @Get('keywords')
  async getKeywords() {
    const keywords = await this.service.getKeywords();
    return { success: true, data: keywords };
  }

  @Post('keywords')
  async addKeyword(@Body() body: { term: string; subreddits?: string[] }) {
    const keyword = await this.service.addKeyword(body.term, body.subreddits || []);
    return { success: true, data: keyword };
  }

  @Delete('keywords/:id')
  async deleteKeyword(@Param('id') id: string) {
    const deleted = await this.service.deleteKeyword(id);
    return { success: deleted, message: deleted ? 'Keyword deleted' : 'Keyword not found' };
  }

  @Post('keywords/:id/toggle')
  async toggleKeyword(@Param('id') id: string) {
    const keyword = await this.service.toggleKeyword(id);
    return { success: !!keyword, data: keyword };
  }

  /* ─── Posts ───────────────────────────────────────────────────── */

  @Get('posts')
  async getPosts(
    @Query('status') status?: string,
    @Query('minScore') minScore?: string,
    @Query('subreddit') subreddit?: string,
  ) {
    const posts = await this.service.getPosts({
      status,
      minScore: minScore ? parseInt(minScore, 10) : undefined,
      subreddit,
    });
    return { success: true, data: posts };
  }

  @Post('posts/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const post = await this.service.updatePostStatus(id, body.status as any);
    return { success: !!post, data: post };
  }

  @Post('posts/:id/draft')
  async updateDraft(@Param('id') id: string, @Body() body: { draftReply: string }) {
    const post = await this.service.updateDraftReply(id, body.draftReply);
    return { success: !!post, data: post };
  }

  @Post('posts/:id/notes')
  async updateNotes(@Param('id') id: string, @Body() body: { notes: string }) {
    const post = await this.service.updateNotes(id, body.notes);
    return { success: !!post, data: post };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    const deleted = await this.service.deletePost(id);
    return { success: deleted };
  }

  /* ─── Scan ───────────────────────────────────────────────────── */

  @Post('scan')
  async scan() {
    try {
      const result = await this.service.scanReddit();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  /* ─── AI Draft ───────────────────────────────────────────────── */

  @Post('posts/:id/generate-reply')
  async generateReply(@Param('id') id: string, @Body() body: { context?: string }) {
    try {
      const result = await this.service.generateDraftReply(id, body.context);
      return { success: !!result, data: result };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  /* ─── Stats ──────────────────────────────────────────────────── */

  @Get('stats')
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }
}
