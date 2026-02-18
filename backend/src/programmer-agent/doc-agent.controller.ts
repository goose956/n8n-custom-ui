import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { DocAgentService, ProjectKnowledge, GotchaEntry } from './doc-agent.service';

@Controller('api/doc-agent')
export class DocAgentController {
  constructor(private readonly docAgent: DocAgentService) {}

  /**
   * Full project knowledge (architecture, files, patterns, gotchas)
   */
  @Get('knowledge')
  getKnowledge(@Query('refresh') refresh?: string): ProjectKnowledge {
    return this.docAgent.getProjectKnowledge(refresh === 'true');
  }

  /**
   * Prompt-ready context string (compact, for injecting into AI prompts)
   */
  @Get('prompt-context')
  getPromptContext(): { context: string } {
    return { context: this.docAgent.getPromptContext() };
  }

  /**
   * List all known gotchas / past failures
   */
  @Get('gotchas')
  getGotchas(): GotchaEntry[] {
    return this.docAgent.getGotchas();
  }

  /**
   * Add a new gotcha (learning from a past failure)
   */
  @Post('gotchas')
  addGotcha(
    @Body() body: { description: string; resolution: string },
  ): { success: boolean; message: string } {
    this.docAgent.addGotcha(body.description, body.resolution);
    return { success: true, message: 'Gotcha recorded' };
  }

  /**
   * Remove a gotcha by ID
   */
  @Delete('gotchas/:id')
  removeGotcha(@Param('id') id: string): { success: boolean } {
    const removed = this.docAgent.removeGotcha(id);
    return { success: removed };
  }
}
