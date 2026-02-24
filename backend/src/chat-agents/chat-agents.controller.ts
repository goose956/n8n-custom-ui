import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ChatAgentsService } from './chat-agents.service';

@Controller('api/chat-agents')
export class ChatAgentsController {
  private readonly logger = new Logger(ChatAgentsController.name);

  constructor(private readonly service: ChatAgentsService) {}

  // ═══════════════════════════════════════════════════════════════
  //  ADMIN ENDPOINTS (protected by same-origin / dashboard)
  // ═══════════════════════════════════════════════════════════════

  @Get()
  list() {
    return { success: true, agents: this.service.listAgents() };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    const agent = this.service.getAgent(id);
    if (!agent) return { success: false, message: 'Agent not found' };
    return { success: true, agent };
  }

  @Post()
  create(@Body() body: any) {
    const agent = this.service.createAgent(body);
    return { success: true, agent };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const agent = this.service.updateAgent(id, body);
    if (!agent) return { success: false, message: 'Not found' };
    return { success: true, agent };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const ok = this.service.deleteAgent(id);
    return { success: ok };
  }

  // ── Conversations ───────────────────────────────────────────
  @Get(':id/conversations')
  listConversations(@Param('id') id: string) {
    return { success: true, conversations: this.service.listConversations(id) };
  }

  @Get(':id/conversations/:convId')
  getConversation(@Param('id') _id: string, @Param('convId') convId: string) {
    const convo = this.service.getConversation(convId);
    if (!convo) return { success: false, message: 'Conversation not found' };
    return { success: true, conversation: convo };
  }

  // ── Embed snippet ───────────────────────────────────────────
  @Get(':id/embed')
  getEmbedSnippet(@Param('id') id: string) {
    const agent = this.service.getAgent(id);
    if (!agent) return { success: false, message: 'Not found' };

    // Determine the base URL from environment or default
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const snippet = `<!-- ${agent.name} Chat Widget -->\n<script src="${baseUrl}/widget/chat-widget.js" data-agent-id="${agent.id}" data-color="${agent.brandColor}" data-position="${agent.position}" defer></script>`;

    return { success: true, snippet, agentId: agent.id };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC CHAT ENDPOINT (used by the widget)
  //  POST /api/chat-agents/public/:agentId/message
  //  Streams SSE response
  // ═══════════════════════════════════════════════════════════════

  @Post('public/:agentId/message')
  async publicMessage(
    @Param('agentId') agentId: string,
    @Body() body: { message: string; conversationId?: string; email?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const agent = this.service.getAgent(agentId);
    if (!agent || !agent.enabled) {
      return res.status(404).json({ error: 'Agent not found or disabled' });
    }

    // CORS check for allowed domains
    const origin = req.headers.origin || '';
    if (agent.allowedDomains.length > 0) {
      const allowed = agent.allowedDomains.some((d) => {
        if (d === '*') return true;
        return origin.includes(d);
      });
      if (!allowed && origin) {
        return res.status(403).json({ error: 'Domain not allowed' });
      }
    }
    // Set CORS headers for the widget
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (!body.message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Rate limit
    if (!this.service.checkRateLimit(agentId, agent.maxMessagesPerMinute)) {
      return res.status(429).json({ error: 'Too many messages. Please wait a moment.' });
    }

    // Email required?
    if (agent.requireEmail && !body.email && !body.conversationId) {
      return res.status(400).json({ error: 'Email is required to start a conversation', requireEmail: true });
    }

    // Get/create conversation
    const convo = this.service.getOrCreateConversation(agentId, body.conversationId, body.email);

    // Save user message
    this.service.appendMessage(convo.id, 'user', body.message);

    // Build messages for LLM
    const systemPrompt = this.service.buildSystemPrompt(agent, body.message);

    // Get full conversation history (capped at last 20 messages)
    const fullConvo = this.service.getConversation(convo.id);
    const historyMessages = (fullConvo?.messages || []).slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Get API key
    const apiKey = this.service.getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'No API key configured' });
    }

    // Determine provider
    const provider = this.service.getProviderForModel(agent.model);
    const baseURL =
      provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1'
        : 'https://api.openai.com/v1';

    // SSE streaming setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send conversationId as first event
    res.write(`data: ${JSON.stringify({ type: 'meta', conversationId: convo.id })}\n\n`);

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider === 'openrouter' ? agent.model : agent.model.replace(/.*\//, ''),
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
          ],
          max_tokens: agent.maxTokens,
          temperature: agent.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`LLM error: ${response.status} ${errText}`);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI service error' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const reader = (response.body as any)?.getReader?.();
      if (!reader) {
        // Non-streaming fallback
        const json = await response.json() as any;
        const content = json.choices?.[0]?.message?.content || '';
        res.write(`data: ${JSON.stringify({ type: 'token', token: content })}\n\n`);
        this.service.appendMessage(convo.id, 'assistant', content);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l: string) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullResponse += token;
              res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
            }
          } catch {
            // Ignore parse errors from partial JSON
          }
        }
      }

      // Save full assistant response
      if (fullResponse) {
        this.service.appendMessage(convo.id, 'assistant', fullResponse);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      this.logger.error(`Chat error: ${err.message}`);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
