import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { SkillRunnerService } from './skill-runner.service';
import { CreateToolDto, UpdateToolDto, CreateSkillDto, UpdateSkillDto, RunSkillDto, SkillProgressEvent } from './skill.types';

/**
 * Skills Controller — Two-layer agent architecture
 *
 * IMPORTANT: Route order matters in NestJS. Static routes (tools, runs/all,
 * builder/chat) MUST come before parameterized routes (:id) to avoid
 * "tools" being matched as a skill ID.
 */
@Controller('api/skills')
export class SkillsController {
  constructor(private readonly runner: SkillRunnerService) {}

  // ══════════════════════════════════════════════════════════════════
  //  TOOLS (must be before :id routes)
  // ══════════════════════════════════════════════════════════════════

  @Get('tools')
  async listTools(@Query('app_id') appId?: string) {
    const tools = await this.runner.listTools(appId ? parseInt(appId) : undefined);
    return { success: true, tools };
  }

  @Post('tools')
  async createTool(@Body() dto: CreateToolDto) {
    const tool = await this.runner.createTool(dto);
    return { success: true, tool };
  }

  @Get('tools/:id')
  async getTool(@Param('id') id: string) {
    const tool = await this.runner.getTool(id);
    if (!tool) return { success: false, message: 'Tool not found' };
    return { success: true, tool };
  }

  @Put('tools/:id')
  async updateTool(@Param('id') id: string, @Body() dto: UpdateToolDto) {
    const tool = await this.runner.updateTool(id, dto);
    if (!tool) return { success: false, message: 'Tool not found' };
    return { success: true, tool };
  }

  @Delete('tools/:id')
  async deleteTool(@Param('id') id: string) {
    const deleted = await this.runner.deleteTool(id);
    return { success: deleted, message: deleted ? 'Deleted' : 'Tool not found' };
  }

  // ══════════════════════════════════════════════════════════════════
  //  STATIC ROUTES (must be before :id routes)
  // ══════════════════════════════════════════════════════════════════

  @Get('runs/all')
  async allRuns(@Query('limit') limit?: string, @Query('app_id') appId?: string) {
    const runs = await this.runner.getRunHistory(undefined, limit ? parseInt(limit) : 50, appId ? parseInt(appId) : undefined);
    return { success: true, runs };
  }

  @Post('builder/chat')
  async builderChat(@Body() body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }) {
    try {
      const result = await this.runner.builderChat(body.messages || []);
      return { success: true, ...result };
    } catch (err: any) {
      return { success: false, reply: err.message || 'Builder chat failed' };
    }
  }

  @Post('follow-up')
  async followUp(@Body() body: { previousOutput: string; message: string; previousSkillId?: string }) {
    try {
      const result = await this.runner.followUp(body);
      return { success: result.status === 'success', result };
    } catch (err: any) {
      return { success: false, result: { status: 'error', error: err.message } };
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  FILES (list / upload member files)
  // ══════════════════════════════════════════════════════════════════

  private readonly FILE_DIRECTORIES: Record<string, string> = {
    images: 'skill-images',
    pdfs: 'skill-pdfs',
    html: 'skill-html',
    files: 'skill-files',
  };

  /** Build the base directory for a given app_id (or flat if none). */
  private fileBaseDir(appId?: string): string {
    const publicDir = path.join(process.cwd(), 'public');
    return appId ? path.join(publicDir, 'apps', appId) : publicDir;
  }

  @Get('files')
  async listFiles(@Query('category') category?: string, @Query('app_id') appId?: string) {
    const baseDir = this.fileBaseDir(appId);
    const allFiles: Array<{ name: string; category: string; path: string; size: number; modified: string; url: string }> = [];

    const dirs = category && this.FILE_DIRECTORIES[category]
      ? { [category]: this.FILE_DIRECTORIES[category] }
      : this.FILE_DIRECTORIES;

    const urlPrefix = appId ? `/apps/${appId}` : '';

    for (const [cat, dirName] of Object.entries(dirs)) {
      const dirPath = path.join(baseDir, dirName);
      if (!fs.existsSync(dirPath)) continue;
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        try {
          const filePath = path.join(dirPath, entry);
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;
          allFiles.push({
            name: entry,
            category: cat,
            path: `${dirName}/${entry}`,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            url: `${urlPrefix}/${dirName}/${entry}`,
          });
        } catch { /* skip unreadable files */ }
      }
    }

    // Sort newest first
    allFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    return { success: true, files: allFiles, total: allFiles.length };
  }

  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any, @Body() body: { category?: string; app_id?: string }) {
    if (!file) return { success: false, message: 'No file uploaded' };

    const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';
    let category = body.category || 'files';

    // Auto-detect category from extension
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) category = 'images';
    else if (ext === 'pdf') category = 'pdfs';
    else if (['html', 'htm'].includes(ext)) category = 'html';

    const dirName = this.FILE_DIRECTORIES[category] || 'skill-files';
    const baseDir = this.fileBaseDir(body.app_id);
    const targetDir = path.join(baseDir, dirName);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const targetPath = path.join(targetDir, file.originalname);
    fs.writeFileSync(targetPath, file.buffer);

    const urlPrefix = body.app_id ? `/apps/${body.app_id}` : '';

    return {
      success: true,
      file: {
        name: file.originalname,
        category,
        path: `${dirName}/${file.originalname}`,
        size: file.size,
        url: `${urlPrefix}/${dirName}/${file.originalname}`,
      },
    };
  }

  @Delete('files/:category/:filename')
  async deleteFile(@Param('category') category: string, @Param('filename') filename: string, @Query('app_id') appId?: string) {
    const dirName = this.FILE_DIRECTORIES[category];
    if (!dirName) return { success: false, message: 'Invalid category' };

    const baseDir = this.fileBaseDir(appId);
    const filePath = path.join(baseDir, dirName, filename);
    if (!fs.existsSync(filePath)) return { success: false, message: 'File not found' };

    fs.unlinkSync(filePath);
    return { success: true, message: 'Deleted' };
  }

  // ── Freeform Chat (SSE) ─────────────────────────────────────────

  @Post('chat-stream')
  async chatStream(
    @Body() body: { message: string; app_id?: number; attachments?: Array<{ name: string; content: string; type: string }> },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const onProgress = (evt: SkillProgressEvent) => {
        sendEvent('progress', evt);
      };

      // Build the full message with attached document contents prepended
      let fullMessage = body.message;
      if (body.attachments && body.attachments.length > 0) {
        const attachmentSections = body.attachments.map(a => {
          const content = a.type === 'base64' ? `[Binary file: ${a.name} — base64 encoded]\n${a.content.slice(0, 5000)}` : a.content;
          return `--- FILE: ${a.name} ---\n${content}\n--- END FILE ---`;
        }).join('\n\n');
        fullMessage = `[ATTACHED DOCUMENTS]\n${attachmentSections}\n\n[USER REQUEST]\n${body.message}`;
      }

      const result = await this.runner.runChat(fullMessage, onProgress, body.app_id);
      sendEvent('done', { success: result.status === 'success', result });
    } catch (err: any) {
      sendEvent('error', { message: err.message || 'Chat failed' });
    } finally {
      res.end();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  SKILLS (parameterized routes last)
  // ══════════════════════════════════════════════════════════════════

  @Get()
  async listSkills(@Query('app_id') appId?: string) {
    const skills = await this.runner.listSkills(appId ? parseInt(appId) : undefined);
    return { success: true, skills };
  }

  @Post()
  async createSkill(@Body() dto: CreateSkillDto) {
    const skill = await this.runner.createSkill(dto);
    return { success: true, skill };
  }

  @Get(':id')
  async getSkill(@Param('id') id: string) {
    const skill = await this.runner.getSkill(id);
    if (!skill) return { success: false, message: 'Skill not found' };
    return { success: true, skill };
  }

  @Put(':id')
  async updateSkill(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    const skill = await this.runner.updateSkill(id, dto);
    if (!skill) return { success: false, message: 'Skill not found' };
    return { success: true, skill };
  }

  @Delete(':id')
  async deleteSkill(@Param('id') id: string) {
    const deleted = await this.runner.deleteSkill(id);
    return { success: deleted, message: deleted ? 'Deleted' : 'Skill not found' };
  }

  // ── Execution (streaming) ───────────────────────────────────────

  @Post(':id/run-stream')
  async runStream(
    @Param('id') id: string,
    @Body() dto: RunSkillDto,
    @Res() res: Response,
  ) {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const onProgress = (evt: SkillProgressEvent) => {
        sendEvent('progress', evt);
      };

      const result = await this.runner.run(id, dto, onProgress);
      sendEvent('done', { success: result.status === 'success', result });
    } catch (err: any) {
      sendEvent('error', { message: err.message || 'Run failed' });
    } finally {
      res.end();
    }
  }

  // ── Execution ─────────────────────────────────────────────────────

  @Post(':id/run')
  async run(@Param('id') id: string, @Body() dto: RunSkillDto) {
    const result = await this.runner.run(id, dto);
    return { success: result.status === 'success', result };
  }

  @Get(':id/runs')
  async runs(@Param('id') id: string, @Query('limit') limit?: string) {
    const runs = await this.runner.getRunHistory(id, limit ? parseInt(limit) : 50);
    return { success: true, runs };
  }
}
