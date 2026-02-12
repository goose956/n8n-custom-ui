import { Controller, Post, Get, Body } from '@nestjs/common';
import { ProgrammerAgentService } from './programmer-agent.service';

@Controller('api/programmer-agent')
export class ProgrammerAgentController {
  constructor(private readonly agentService: ProgrammerAgentService) {}

  /**
   * Generate code from a prompt using orchestrator + sub-agents
   */
  @Post('generate')
  async generate(
    @Body()
    body: {
      prompt: string;
      targetType?: 'page' | 'component' | 'feature' | 'full-stack';
      appId?: number;
      orchestratorModel?: string;
      subAgentModel?: string;
      conversationHistory?: { role: string; content: string }[];
    },
  ) {
    return this.agentService.generate(body);
  }

  /**
   * Refine a specific generated file using the orchestrator
   */
  @Post('refine')
  async refine(
    @Body()
    body: {
      instruction: string;
      files: { path: string; content: string; language: string; description?: string }[];
      fileIndex: number;
      model?: string;
    },
  ) {
    return this.agentService.refineFile(body);
  }

  /**
   * Quick task via sub-agent (cheaper model) — types, styles, utils, docs
   */
  @Post('sub-task')
  async subTask(
    @Body()
    body: {
      task: 'types' | 'styles' | 'utils' | 'docs' | 'review' | 'test';
      context: string;
      model?: string;
    },
  ) {
    return this.agentService.runSubTask(body);
  }

  /**
   * Save generated files to the project
   */
  @Post('save')
  async saveFiles(
    @Body()
    body: {
      files: { path: string; content: string }[];
    },
  ) {
    return this.agentService.saveFiles(body.files);
  }

  /**
   * Get available models and current settings
   */
  @Get('models')
  getModels() {
    return this.agentService.getAvailableModels();
  }

  /**
   * Get agent usage stats
   */
  @Get('stats')
  getStats() {
    return this.agentService.getStats();
  }
}
