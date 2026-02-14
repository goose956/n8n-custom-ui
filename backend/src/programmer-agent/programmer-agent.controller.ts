import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { ProgrammerAgentService } from './programmer-agent.service';
import { Response } from 'express';

@Controller('api/programmer-agent')
export class ProgrammerAgentController {
  constructor(private readonly agentService: ProgrammerAgentService) {}

  /**
   * Plan a members area — AI suggests pages based on the app description
   */
  @Post('plan-members')
  async planMembers(
    @Body()
    body: {
      prompt: string;
      appId?: number;
      orchestratorModel?: string;
    },
  ) {
    return this.agentService.planMembersArea(body.prompt, body.appId, body.orchestratorModel);
  }

  /**
   * Generate code from a prompt using orchestrator + sub-agents
   * When targetType is 'members-area', generates the full multi-page members area
   */
  @Post('generate')
  async generate(
    @Body()
    body: {
      prompt: string;
      targetType?: 'page' | 'component' | 'feature' | 'full-stack' | 'members-area';
      appId?: number;
      orchestratorModel?: string;
      subAgentModel?: string;
      conversationHistory?: { role: string; content: string }[];
      pages?: { id: string; name: string; description: string; type: 'dashboard' | 'profile' | 'support' | 'settings' | 'custom'; required: boolean }[];
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
   * Search the web via Brave Search API
   */
  @Get('search')
  async search(@Query('q') query: string, @Query('count') count?: string) {
    const results = await this.agentService.searchBrave(query, count ? parseInt(count) : 5);
    return { success: true, results };
  }

  /**
   * Check which API keys are configured
   */
  @Get('api-keys')
  checkApiKeys() {
    return { success: true, keys: this.agentService.checkApiKeys() };
  }

  /**
   * Analyse generated files for backend infrastructure needs
   */
  @Post('finalize')
  async finalize(
    @Body()
    body: {
      files: { path: string; content: string; language: string; description?: string }[];
      appId?: number;
      model?: string;
    },
  ) {
    return this.agentService.analyzeBackendNeeds(body.files, body.appId, body.model);
  }

  /**
   * Implement a single backend task (e.g. DB seed)
   */
  @Post('implement-task')
  implementTask(
    @Body()
    body: {
      task: {
        id: string;
        category: 'database' | 'api' | 'integration' | 'security' | 'data';
        title: string;
        description: string;
        status: 'pending' | 'done' | 'in-progress';
        priority: 'high' | 'medium' | 'low';
        implementation?: { type: 'db_seed' | 'api_route' | 'config' | 'schema'; payload: Record<string, any> };
      };
      appId?: number;
    },
  ) {
    const result = this.agentService.implementTask(body.task, body.appId);
    return { ...result, timestamp: new Date().toISOString() };
  }

  /**
   * Auto-implement all pending tasks that support it
   */
  @Post('implement-all')
  implementAll(
    @Body()
    body: {
      tasks: {
        id: string;
        category: 'database' | 'api' | 'integration' | 'security' | 'data';
        title: string;
        description: string;
        status: 'pending' | 'done' | 'in-progress';
        priority: 'high' | 'medium' | 'low';
        implementation?: { type: 'db_seed' | 'api_route' | 'config' | 'schema'; payload: Record<string, any> };
      }[];
      appId?: number;
    },
  ) {
    const result = this.agentService.implementAllTasks(body.tasks, body.appId);
    return { success: true, ...result, timestamp: new Date().toISOString() };
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

  /**
   * Estimate token cost before generation
   */
  @Post('estimate-cost')
  estimateCost(
    @Body()
    body: {
      pages: { id: string; type: string }[];
      orchestratorModel?: string;
      subAgentModel?: string;
    },
  ) {
    return this.agentService.estimateCost(
      body.pages,
      body.orchestratorModel || '',
      body.subAgentModel || '',
    );
  }

  /**
   * QA Agent: review generated files for errors and issues
   */
  @Post('qa-review')
  async qaReview(
    @Body()
    body: {
      files: { path: string; content: string; language: string; description?: string }[];
      appId?: number;
      model?: string;
    },
  ) {
    return this.agentService.qaReview(body.files, body.appId, body.model);
  }

  /**
   * QA Agent: auto-fix a single issue
   */
  @Post('qa-fix')
  async qaFix(
    @Body()
    body: {
      files: { path: string; content: string; language: string; description?: string }[];
      issue: {
        id: string;
        file: string;
        line?: number;
        severity: 'error' | 'warning' | 'info';
        category: string;
        title: string;
        description: string;
        autoFix?: string;
      };
      model?: string;
    },
  ) {
    return this.agentService.qaAutoFix(body.files, body.issue as any, body.model);
  }

  /**
   * QA Agent: auto-fix all fixable issues
   */
  @Post('qa-fix-all')
  async qaFixAll(
    @Body()
    body: {
      files: { path: string; content: string; language: string; description?: string }[];
      issues: {
        id: string;
        file: string;
        line?: number;
        severity: 'error' | 'warning' | 'info';
        category: string;
        title: string;
        description: string;
        autoFix?: string;
      }[];
      model?: string;
    },
  ) {
    return this.agentService.qaAutoFixAll(body.files, body.issues as any, body.model);
  }

  /**
   * Generate documentation for the members area
   */
  @Post('generate-docs')
  async generateDocs(
    @Body()
    body: {
      files: { path: string; content: string; language: string; description?: string }[];
      appId?: number;
      backendTasks?: {
        id: string;
        category: string;
        title: string;
        description: string;
        status: string;
        priority: string;
      }[];
      model?: string;
    },
  ) {
    return this.agentService.generateDocs(body.files, body.appId, body.backendTasks as any, body.model);
  }

  /**
   * Coder Agent — autonomous builder with SSE streaming for live progress
   */
  @Post('coder-chat')
  async coderChat(
    @Body()
    body: {
      message: string;
      files?: { path: string; content: string; language: string; description?: string }[];
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
      appId?: number;
      model?: string;
    },
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
      await this.agentService.coderChatStream(body, sendEvent);
    } catch (err) {
      sendEvent('error', { message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      sendEvent('done', {});
      res.end();
    }
  }
}
