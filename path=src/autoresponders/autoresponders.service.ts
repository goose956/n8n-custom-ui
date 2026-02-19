import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateAutoresponderDto, UpdateAutoresponderDto } from './dto/autoresponder.dto';

export interface AutoresponderRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  triggers: {
    keywords?: string[];
    senderCriteria?: {
      jobTitles?: string[];
      companies?: string[];
      industries?: string[];
      connectionDegree?: number[];
    };
    messageCriteria?: {
      isFirstMessage?: boolean;
      containsLinks?: boolean;
      messageLength?: { min?: number; max?: number };
    };
  };
  conditions: {
    timeRestrictions?: {
      daysOfWeek?: number[];
      hoursOfDay?: { start: number; end: number };
      timezone?: string;
    };
    rateLimiting?: {
      maxResponsesPerDay?: number;
      cooldownHours?: number;
    };
  };
  response: {
    type: 'template' | 'ai_generated';
    template?: string;
    aiPrompt?: string;
    personalizationFields?: string[];
    followUpActions?: {
      scheduleFollowUp?: { delayHours: number; message: string };
      addToList?: string;
      setReminder?: { delayHours: number; note: string };
    };
  };
  analytics: {
    totalTriggers: number;
    totalResponses: number;
    successRate: number;
    lastTriggered?: Date;
    averageResponseTime?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseSchema {
  autoresponders: AutoresponderRule[];
}

@Injectable()
export class AutorespondersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async findAll(): Promise<AutoresponderRule[]> {
    const data = this.db.readSync<DatabaseSchema>();
    return data.autoresponders || [];
  }

  async findByUserId(userId: string): Promise<AutoresponderRule[]> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    return autoresponders.filter(rule => rule.userId === userId);
  }

  async findOne(id: string): Promise<AutoresponderRule | null> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    return autoresponders.find(rule => rule.id === id) || null;
  }

  async create(createDto: CreateAutoresponderDto): Promise<AutoresponderRule> {
    const data = this.db.readSync<DatabaseSchema>();
    
    if (!data.autoresponders) {
      data.autoresponders = [];
    }

    const newAutoresponder: AutoresponderRule = {
      id: this.generateId(),
      userId: createDto.userId,
      name: createDto.name,
      description: createDto.description,
      isActive: createDto.isActive ?? true,
      priority: createDto.priority ?? 1,
      triggers: createDto.triggers,
      conditions: createDto.conditions || {},
      response: createDto.response,
      analytics: {
        totalTriggers: 0,
        totalResponses: 0,
        successRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate response configuration
    await this.validateResponseConfiguration(newAutoresponder.response);

    data.autoresponders.push(newAutoresponder);
    this.db.writeSync(data);

    return newAutoresponder;
  }

  async update(id: string, updateDto: UpdateAutoresponderDto): Promise<AutoresponderRule | null> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    const index = autoresponders.findIndex(rule => rule.id === id);

    if (index === -1) {
      return null;
    }

    const existingRule = autoresponders[index];
    const updatedRule: AutoresponderRule = {
      ...existingRule,
      ...updateDto,
      id: existingRule.id,
      userId: existingRule.userId,
      createdAt: existingRule.createdAt,
      updatedAt: new Date(),
    };

    // Validate response configuration if updated
    if (updateDto.response) {
      await this.validateResponseConfiguration(updatedRule.response);
    }

    autoresponders[index] = updatedRule;
    this.db.writeSync(data);

    return updatedRule;
  }

  async remove(id: string): Promise<boolean> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    const initialLength = autoresponders.length;

    data.autoresponders = autoresponders.filter(rule => rule.id !== id);

    if (data.autoresponders.length === initialLength) {
      return false;
    }

    this.db.writeSync(data);
    return true;
  }

  async toggleActive(id: string): Promise<AutoresponderRule | null> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    const index = autoresponders.findIndex(rule => rule.id === id);

    if (index === -1) {
      return null;
    }

    autoresponders[index].isActive = !autoresponders[index].isActive;
    autoresponders[index].updatedAt = new Date();

    this.db.writeSync(data);
    return autoresponders[index];
  }

  async testAutoresponder(
    id: string,
    testData: { message: string; senderProfile?: any },
  ): Promise<{ matches: boolean; response?: string; reasoning: string }> {
    const autoresponder = await this.findOne(id);
    if (!autoresponder) {
      throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
    }

    const matches = this.evaluateTriggers(autoresponder.triggers, testData);
    let response: string | undefined;
    let reasoning: string;

    if (matches) {
      reasoning = 'Message matches autoresponder triggers';
      
      if (autoresponder.response.type === 'template' && autoresponder.response.template) {
        response = this.personalizeTemplate(
          autoresponder.response.template,
          testData.senderProfile,
        );
      } else if (autoresponder.response.type === 'ai_generated' && autoresponder.response.aiPrompt) {
        response = await this.generateAIResponse(
          autoresponder.response.aiPrompt,
          testData.message,
          testData.senderProfile,
        );
      }
    } else {
      reasoning = 'Message does not match autoresponder triggers';
    }

    return { matches, response, reasoning };
  }

  async processIncomingMessage(
    message: string,
    senderProfile: any,
    recipientUserId: string,
  ): Promise<{ shouldRespond: boolean; response?: string; autoresponder?: AutoresponderRule }> {
    const userAutoresponders = await this.findByUserId(recipientUserId);
    const activeAutoresponders = userAutoresponders
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const autoresponder of activeAutoresponders) {
      // Check rate limiting
      if (!(await this.checkRateLimit(autoresponder, recipientUserId))) {
        continue;
      }

      // Check time restrictions
      if (!this.checkTimeRestrictions(autoresponder.conditions.timeRestrictions)) {
        continue;
      }

      // Evaluate triggers
      const testData = { message, senderProfile };
      if (this.evaluateTriggers(autoresponder.triggers, testData)) {
        // Update analytics
        await this.updateAnalytics(autoresponder.id, 'trigger');

        let response: string;
        try {
          if (autoresponder.response.type === 'template' && autoresponder.response.template) {
            response = this.personalizeTemplate(autoresponder.response.template, senderProfile);
          } else if (autoresponder.response.type === 'ai_generated' && autoresponder.response.aiPrompt) {
            response = await this.generateAIResponse(
              autoresponder.response.aiPrompt,
              message,
              senderProfile,
            );
          } else {
            continue;
          }

          // Update analytics for successful response
          await this.updateAnalytics(autoresponder.id, 'response');

          return {
            shouldRespond: true,
            response,
            autoresponder,
          };
        } catch (error) {
          console.error(`Failed to generate response for autoresponder ${autoresponder.id}:`, error);
          continue;
        }
      }
    }

    return { shouldRespond: false };
  }

  private evaluateTriggers(
    triggers: AutoresponderRule['triggers'],
    testData: { message: string; senderProfile?: any },
  ): boolean {
    const { message, senderProfile } = testData;

    // Check keyword triggers
    if (triggers.keywords && triggers.keywords.length > 0) {
      const messageText = message.toLowerCase();
      const hasKeyword = triggers.keywords.some(keyword =>
        messageText.includes(keyword.toLowerCase()),
      );
      if (!hasKeyword) return false;
    }

    // Check sender criteria
    if (triggers.senderCriteria && senderProfile) {
      const criteria = triggers.senderCriteria;

      if (criteria.jobTitles && criteria.jobTitles.length > 0) {
        const profileTitle = senderProfile.jobTitle?.toLowerCase() || '';
        const matchesJobTitle = criteria.jobTitles.some(title =>
          profileTitle.includes(title.toLowerCase()),
        );
        if (!matchesJobTitle) return false;
      }

      if (criteria.companies && criteria.companies.length > 0) {
        const profileCompany = senderProfile.company?.toLowerCase() || '';
        const matchesCompany = criteria.companies.some(company =>
          profileCompany.includes(company.toLowerCase()),
        );
        if (!matchesCompany) return false;
      }

      if (criteria.industries && criteria.industries.length > 0) {
        const profileIndustry = senderProfile.industry?.toLowerCase() || '';
        const matchesIndustry = criteria.industries.some(industry =>
          profileIndustry.includes(industry.toLowerCase()),
        );
        if (!matchesIndustry) return false;
      }

      if (criteria.connectionDegree && criteria.connectionDegree.length > 0) {
        const profileDegree = senderProfile.connectionDegree || 3;
        if (!criteria.connectionDegree.includes(profileDegree)) return false;
      }
    }

    // Check message criteria
    if (triggers.messageCriteria) {
      const criteria = triggers.messageCriteria;

      if (criteria.isFirstMessage !== undefined) {
        const isFirst = senderProfile?.isFirstMessage === true;
        if (criteria.isFirstMessage !== isFirst) return false;
      }

      if (criteria.containsLinks !== undefined) {
        const hasLinks = /https?:\/\/[^\s]+/.test(message);
        if (criteria.containsLinks !== hasLinks) return false;
      }

      if (criteria.messageLength) {
        const length = message.length;
        if (criteria.messageLength.min && length < criteria.messageLength.min) return false;
        if (criteria.messageLength.max && length > criteria.messageLength.max) return false;
      }
    }

    return true;
  }

  private personalizeTemplate(template: string, senderProfile?: any): string {
    if (!senderProfile) return template;

    return template
      .replace(/\{firstName\}/g, senderProfile.firstName || 'there')
      .replace(/\{lastName\}/g, senderProfile.lastName || '')
      .replace(/\{fullName\}/g, senderProfile.fullName || senderProfile.firstName || 'there')
      .replace(/\{company\}/g, senderProfile.company || 'your company')
      .replace(/\{jobTitle\}/g, senderProfile.jobTitle || 'your role');
  }

  private async generateAIResponse(
    aiPrompt: string,
    incomingMessage: string,
    senderProfile?: any,
  ): Promise<string> {
    try {
      const apiKey = await this.cryptoService.getApiKey('openai');
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `
        You are an AI assistant helping to generate professional LinkedIn message responses.
        Use the following context to create a personalized, professional response.
        
        Sender Profile: ${JSON.stringify(senderProfile || {})}
        Custom Instructions: ${aiPrompt}
        
        Keep responses concise, professional, and engaging. Avoid being overly salesy or pushy.
      `;

      // Note: In a real implementation, you would make an actual API call to OpenAI
      // For this example, we'll return a template-based response
      const response = await this.mockAIResponse(systemPrompt, incomingMessage, senderProfile);
      
      return response;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      // Fallback to a generic template
      return this.personalizeTemplate(
        'Hi {firstName}, thanks for reaching out! I\'ll get back to you soon.',
        senderProfile,
      );
    }
  }

  private async mockAIResponse(
    systemPrompt: string,
    message: string,
    senderProfile?: any,
  ): Promise<string> {
    // Mock AI response generation - replace with actual OpenAI API call
    const templates = [
      'Hi {firstName}, thanks for your message! I appreciate you reaching out.',
      'Hello {firstName}, thank you for connecting. I\'d be happy to discuss this further.',
      'Hi {firstName}, interesting message! I\'ll review this and get back to you soon.',
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return this.personalizeTemplate(randomTemplate, senderProfile);
  }

  private async checkRateLimit(autoresponder: AutoresponderRule, userId: string): Promise<boolean> {
    const rateLimiting = autoresponder.conditions.rateLimiting;
    if (!rateLimiting) return true;

    // In a real implementation, you would track rate limiting in the database
    // For now, we'll assume rate limits are not exceeded
    return true;
  }

  private checkTimeRestrictions(timeRestrictions?: AutoresponderRule['conditions']['timeRestrictions']): boolean {
    if (!timeRestrictions) return true;

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentHour = now.getHours();

    // Check days of week
    if (timeRestrictions.daysOfWeek && timeRestrictions.daysOfWeek.length > 0) {
      if (!timeRestrictions.daysOfWeek.includes(currentDayOfWeek)) {
        return false;
      }
    }

    // Check hours of day
    if (timeRestrictions.hoursOfDay) {
      const { start, end } = timeRestrictions.hoursOfDay;
      if (currentHour < start || currentHour >= end) {
        return false;
      }
    }

    return true;
  }

  private async updateAnalytics(autoresponder: string, type: 'trigger' | 'response'): Promise<void> {
    const data = this.db.readSync<DatabaseSchema>();
    const autoresponders = data.autoresponders || [];
    const index = autoresponders.findIndex(rule => rule.id === autoresponder);

    if (index !== -1) {
      const rule = autoresponders[index];
      
      if (type === 'trigger') {
        rule.analytics.totalTriggers++;
        rule.analytics.lastTriggered = new Date();
      } else if (type === 'response') {
        rule.analytics.totalResponses++;
      }

      // Update success rate
      if (rule.analytics.totalTriggers > 0) {
        rule.analytics.successRate = rule.analytics.totalResponses / rule.analytics.totalTriggers;
      }

      rule.updatedAt = new Date();
      this.db.writeSync(data);
    }
  }

  private async validateResponseConfiguration(response: AutoresponderRule['response']): Promise<void> {
    if (response.type === 'template' && !response.template) {
      throw new Error('Template response type requires a template');
    }
    
    if (response.type === 'ai_generated' && !response.aiPrompt) {
      throw new Error('AI generated response type requires an AI prompt');
    }
  }

  private generateId(): string {
    return 'ar_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}