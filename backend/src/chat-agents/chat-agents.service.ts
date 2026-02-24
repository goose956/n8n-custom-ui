import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

// ── Types ─────────────────────────────────────────────────────────
export interface ChatAgentConfig {
  id: string;
  name: string;
  description: string;
  /** The persona / system prompt for the agent */
  systemPrompt: string;
  /** Welcome message shown when widget opens */
  welcomeMessage: string;
  /** Optional KB to source answers from */
  knowledgeBaseId?: string;
  /** Branding */
  brandColor: string;
  textColor: string;
  avatarUrl?: string;
  position: 'bottom-right' | 'bottom-left';
  /** Allowed domains (CORS). Empty = all. */
  allowedDomains: string[];
  /** Optional guardrails appended to system prompt */
  guardrails: string;
  /** Model settings */
  model: string;
  maxTokens: number;
  temperature: number;
  /** Rate limiting */
  maxMessagesPerMinute: number;
  /** Lead capture: ask for email before chatting */
  requireEmail: boolean;
  /** Enabled / disabled */
  enabled: boolean;
  /** Stats */
  totalConversations: number;
  totalMessages: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  id: string;
  agentId: string;
  visitorEmail?: string;
  visitorName?: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ChatAgentsService {
  private readonly logger = new Logger(ChatAgentsService.name);
  /** In-memory rate limiter: agentId → { minute, count } */
  private rateLimits = new Map<string, { minute: number; count: number }>();

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
    private readonly kbService: KnowledgeBaseService,
  ) {}

  // ── Agents CRUD ───────────────────────────────────────────────
  private getAllAgents(): ChatAgentConfig[] {
    const data = this.db.readSync();
    return data.chatAgents || [];
  }

  private saveAllAgents(agents: ChatAgentConfig[]): void {
    const data = this.db.readSync();
    data.chatAgents = agents;
    this.db.writeSync(data);
  }

  listAgents(): ChatAgentConfig[] {
    return this.getAllAgents();
  }

  getAgent(id: string): ChatAgentConfig | undefined {
    return this.getAllAgents().find((a) => a.id === id);
  }

  createAgent(input: Partial<ChatAgentConfig>): ChatAgentConfig {
    const now = new Date().toISOString();
    const agent: ChatAgentConfig = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: input.name || 'New Chat Agent',
      description: input.description || '',
      systemPrompt:
        input.systemPrompt ||
        'You are a helpful assistant. Answer questions clearly and concisely based on the knowledge provided. If you don\'t know the answer, say so honestly.',
      welcomeMessage: input.welcomeMessage || 'Hi! How can I help you today?',
      knowledgeBaseId: input.knowledgeBaseId || undefined,
      brandColor: input.brandColor || '#667eea',
      textColor: input.textColor || '#ffffff',
      avatarUrl: input.avatarUrl || '',
      position: input.position || 'bottom-right',
      allowedDomains: input.allowedDomains || [],
      guardrails: input.guardrails || '',
      model: input.model || 'openai/gpt-4o-mini',
      maxTokens: input.maxTokens || 1024,
      temperature: input.temperature ?? 0.7,
      maxMessagesPerMinute: input.maxMessagesPerMinute || 20,
      requireEmail: input.requireEmail || false,
      enabled: true,
      totalConversations: 0,
      totalMessages: 0,
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAllAgents();
    all.push(agent);
    this.saveAllAgents(all);
    this.logger.log(`Created agent: ${agent.id} "${agent.name}"`);
    return agent;
  }

  updateAgent(id: string, updates: Partial<ChatAgentConfig>): ChatAgentConfig | null {
    const all = this.getAllAgents();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const blocked = new Set(['id', 'createdAt', 'totalConversations', 'totalMessages']);
    for (const [key, val] of Object.entries(updates)) {
      if (!blocked.has(key)) (all[idx] as any)[key] = val;
    }
    all[idx].updatedAt = new Date().toISOString();
    this.saveAllAgents(all);
    return all[idx];
  }

  deleteAgent(id: string): boolean {
    const all = this.getAllAgents();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    this.saveAllAgents(all);
    return true;
  }

  // ── Conversations CRUD ────────────────────────────────────────
  private getAllConversations(): ChatConversation[] {
    const data = this.db.readSync();
    return data.chatConversations || [];
  }

  private saveAllConversations(convos: ChatConversation[]): void {
    const data = this.db.readSync();
    data.chatConversations = convos;
    this.db.writeSync(data);
  }

  getConversation(id: string): ChatConversation | undefined {
    return this.getAllConversations().find((c) => c.id === id);
  }

  listConversations(agentId: string): ChatConversation[] {
    return this.getAllConversations()
      .filter((c) => c.agentId === agentId)
      .map((c) => ({
        ...c,
        messages: c.messages.slice(-2), // Preview: last 2 messages only
      }));
  }

  getOrCreateConversation(agentId: string, conversationId?: string, email?: string): ChatConversation {
    if (conversationId) {
      const existing = this.getConversation(conversationId);
      if (existing && existing.agentId === agentId) return existing;
    }
    const now = new Date().toISOString();
    const convo: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      agentId,
      visitorEmail: email,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAllConversations();
    all.push(convo);
    this.saveAllConversations(all);

    // Increment agent conversation count
    const agents = this.getAllAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      agent.totalConversations++;
      this.saveAllAgents(agents);
    }

    return convo;
  }

  appendMessage(conversationId: string, role: 'user' | 'assistant', content: string): void {
    const all = this.getAllConversations();
    const convo = all.find((c) => c.id === conversationId);
    if (!convo) return;
    convo.messages.push({ role, content, timestamp: new Date().toISOString() });
    convo.updatedAt = new Date().toISOString();
    this.saveAllConversations(all);

    // Increment agent message count
    const agents = this.getAllAgents();
    const agent = agents.find((a) => a.id === convo.agentId);
    if (agent) {
      agent.totalMessages++;
      this.saveAllAgents(agents);
    }
  }

  // ── Rate Limiting ─────────────────────────────────────────────
  checkRateLimit(agentId: string, maxPerMinute: number): boolean {
    const now = Math.floor(Date.now() / 60000); // current minute
    const entry = this.rateLimits.get(agentId);
    if (!entry || entry.minute !== now) {
      this.rateLimits.set(agentId, { minute: now, count: 1 });
      return true;
    }
    if (entry.count >= maxPerMinute) return false;
    entry.count++;
    return true;
  }

  // ── Build System Prompt (with KB context injection) ───────────
  buildSystemPrompt(agent: ChatAgentConfig, userMessage: string): string {
    const parts: string[] = [];

    // Main persona
    parts.push(agent.systemPrompt);

    // Knowledge base context
    if (agent.knowledgeBaseId) {
      const kbContext = this.kbService.buildContext(agent.knowledgeBaseId, userMessage, 4000);
      if (kbContext) {
        parts.push('\n---\n');
        parts.push(kbContext);
        parts.push('\n---\n');
        parts.push(
          'Use the knowledge base context above to answer the user\'s question. ' +
          'If the answer is not found in the context, say you don\'t have that information. ' +
          'Always be helpful and cite relevant details from the context.',
        );
      }
    }

    // Guardrails
    if (agent.guardrails) {
      parts.push('\n## Important Rules\n');
      parts.push(agent.guardrails);
    }

    return parts.join('\n');
  }

  // ── Get API key for LLM calls ─────────────────────────────────
  getApiKey(): string | null {
    const data = this.db.readSync();
    const keys = data.apiKeys || [];
    // Prefer OpenRouter, fallback to OpenAI
    const openrouter = keys.find(
      (k: any) => k.provider === 'openrouter' && k.isActive,
    );
    if (openrouter) return this.crypto.decrypt(openrouter.key);

    const openai = keys.find(
      (k: any) => k.provider === 'openai' && k.isActive,
    );
    if (openai) return this.crypto.decrypt(openai.key);

    return null;
  }

  getProviderForModel(model: string): 'openrouter' | 'openai' {
    if (model.includes('/')) return 'openrouter';
    return 'openai';
  }
}
