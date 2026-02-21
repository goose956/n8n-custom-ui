import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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
  async listTools() {
    const tools = await this.runner.listTools();
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
  async allRuns(@Query('limit') limit?: string) {
    const runs = await this.runner.getRunHistory(undefined, limit ? parseInt(limit) : 50);
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

  // ── Freeform Chat (SSE) ─────────────────────────────────────────

  @Post('chat-stream')
  async chatStream(
    @Body() body: { message: string },
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

      const result = await this.runner.runChat(body.message, onProgress);
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
  async listSkills() {
    const skills = await this.runner.listSkills();
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
