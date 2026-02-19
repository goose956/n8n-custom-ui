import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  CreateAutoresponderDto,
  UpdateAutoresponderDto,
  AutoresponderQueryDto,
} from './dto/autoresponder.dto';

export interface Autoresponder {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: 'keyword' | 'time_based' | 'event_based';
  triggerValue: string;
  responseType: 'text' | 'ai_generated' | 'template';
  responseContent: string;
  aiProvider?: 'openai' | 'anthropic' | 'google';
  aiModel?: string;
  aiPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  delay?: number; // in seconds
  conditions?: {
    timeRange?: { start: string; end: string };
    days?: string[];
    userSegments?: string[];
    channels?: string[];
  };
  analytics?: {
    totalTriggers: number;
    successfulResponses: number;
    failureRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AutorespondersData {
  autoresponders: Autoresponder[];
  nextId: number;
}

@Injectable()
export class AutorespondersService {
  private readonly dataKey = 'autoresponders';

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  private getDefaultData(): AutorespondersData {
    return {
      autoresponders: [],
      nextId: 1,
    };
  }

  private getData(): AutorespondersData {
    const data = this.db.readSync();
    return data[this.dataKey] || this.getDefaultData();
  }

  private saveData(data: AutorespondersData): void {
    const allData = this.db.readSync();
    allData[this.dataKey] = data;
    this.db.writeSync(allData);
  }

  async findAll(query: AutoresponderQueryDto): Promise<{
    data: Autoresponder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const data = this.getData();
    let autoresponders = [...data.autoresponders];

    // Apply filters
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      autoresponders = autoresponders.filter(
        (autoresponder) =>
          autoresponder.name.toLowerCase().includes(searchLower) ||
          autoresponder.description?.toLowerCase().includes(searchLower) ||
          autoresponder.triggerValue.toLowerCase().includes(searchLower),
      );
    }

    if (query.isActive !== undefined) {
      autoresponders = autoresponders.filter(
        (autoresponder) => autoresponder.isActive === query.isActive,
      );
    }

    if (query.triggerType) {
      autoresponders = autoresponders.filter(
        (autoresponder) => autoresponder.triggerType === query.triggerType,
      );
    }

    if (query.responseType) {
      autoresponders = autoresponders.filter(
        (autoresponder) => autoresponder.responseType === query.responseType,
      );
    }

    // Apply sorting
    if (query.sortBy) {
      const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
      autoresponders.sort((a, b) => {
        const aValue = a[query.sortBy];
        const bValue = b[query.sortBy];
        
        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAutoresponders = autoresponders.slice(startIndex, endIndex);

    return {
      data: paginatedAutoresponders,
      total: autoresponders.length,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Autoresponder | null> {
    const data = this.getData();
    return data.autoresponders.find((autoresponder) => autoresponder.id === id) || null;
  }

  async create(createAutoresponderDto: CreateAutoresponderDto): Promise<Autoresponder> {
    const data = this.getData();
    
    // Validate AI configuration if using AI response type
    if (createAutoresponderDto.responseType === 'ai_generated') {
      await this.validateAiConfiguration(createAutoresponderDto);
    }

    const newAutoresponder: Autoresponder = {
      id: data.nextId,
      name: createAutoresponderDto.name,
      description: createAutoresponderDto.description,
      isActive: createAutoresponderDto.isActive ?? true,
      triggerType: createAutoresponderDto.triggerType,
      triggerValue: createAutoresponderDto.triggerValue,
      responseType: createAutoresponderDto.responseType,
      responseContent: createAutoresponderDto.responseContent,
      aiProvider: createAutoresponderDto.aiProvider,
      aiModel: createAutoresponderDto.aiModel,
      aiPrompt: createAutoresponderDto.aiPrompt,
      maxTokens: createAutoresponderDto.maxTokens || 150,
      temperature: createAutoresponderDto.temperature || 0.7,
      delay: createAutoresponderDto.delay || 0,
      conditions: createAutoresponderDto.conditions,
      analytics: {
        totalTriggers: 0,
        successfulResponses: 0,
        failureRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.autoresponders.push(newAutoresponder);
    data.nextId++;
    this.saveData(data);

    return newAutoresponder;
  }

  async update(id: number, updateAutoresponderDto: UpdateAutoresponderDto): Promise<Autoresponder | null> {
    const data = this.getData();
    const autoresponderIndex = data.autoresponders.findIndex((autoresponder) => autoresponder.id === id);

    if (autoresponderIndex === -1) {
      return null;
    }

    // Validate AI configuration if updating to AI response type
    if (updateAutoresponderDto.responseType === 'ai_generated') {
      await this.validateAiConfiguration(updateAutoresponderDto);
    }

    const existingAutoresponder = data.autoresponders[autoresponderIndex];
    const updatedAutoresponder: Autoresponder = {
      ...existingAutoresponder,
      ...updateAutoresponderDto,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    data.autoresponders[autoresponderIndex] = updatedAutoresponder;
    this.saveData(data);

    return updatedAutoresponder;
  }

  async remove(id: number): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.autoresponders.length;
    data.autoresponders = data.autoresponders.filter((autoresponder) => autoresponder.id !== id);

    if (data.autoresponders.length < initialLength) {
      this.saveData(data);
      return true;
    }

    return false;
  }

  async toggleStatus(id: number, isActive: boolean): Promise<Autoresponder | null> {
    const data = this.getData();
    const autoresponderIndex = data.autoresponders.findIndex((autoresponder) => autoresponder.id === id);

    if (autoresponderIndex === -1) {
      return null;
    }

    data.autoresponders[autoresponderIndex].isActive = isActive;
    data.autoresponders[autoresponderIndex].updatedAt = new Date();
    this.saveData(data);

    return data.autoresponders[autoresponderIndex];
  }

  async updateAnalytics(id: number, analytics: Partial<Autoresponder['analytics']>): Promise<void> {
    const data = this.getData();
    const autoresponderIndex = data.autoresponders.findIndex((autoresponder) => autoresponder.id === id);

    if (autoresponderIndex !== -1) {
      data.autoresponders[autoresponderIndex].analytics = {
        ...data.autoresponders[autoresponderIndex].analytics,
        ...analytics,
      };
      data.autoresponders[autoresponderIndex].updatedAt = new Date();
      this.saveData(data);
    }
  }

  async findActiveByTrigger(triggerType: string, triggerValue?: string): Promise<Autoresponder[]> {
    const data = this.getData();
    return data.autoresponders.filter(
      (autoresponder) =>
        autoresponder.isActive &&
        autoresponder.triggerType === triggerType &&
        (!triggerValue || autoresponder.triggerValue === triggerValue),
    );
  }

  private async validateAiConfiguration(dto: CreateAutoresponderDto | UpdateAutoresponderDto): Promise<void> {
    if (!dto.aiProvider) {
      throw new Error('AI provider is required for AI-generated responses');
    }

    if (!dto.aiModel) {
      throw new Error('AI model is required for AI-generated responses');
    }

    if (!dto.aiPrompt) {
      throw new Error('AI prompt is required for AI-generated responses');
    }

    // Validate API key exists for the provider
    try {
      const apiKey = await this.crypto.getApiKey(`${dto.aiProvider}_api_key`);
      if (!apiKey) {
        throw new Error(`API key not found for ${dto.aiProvider}`);
      }
    } catch (error) {
      throw new Error(`Failed to validate API key for ${dto.aiProvider}: ${error.message}`);
    }
  }

  async generateAiResponse(autoresponder: Autoresponder, context: any): Promise<string> {
    if (autoresponder.responseType !== 'ai_generated' || !autoresponder.aiProvider) {
      throw new Error('Autoresponder is not configured for AI generation');
    }

    try {
      const apiKey = await this.crypto.getApiKey(`${autoresponder.aiProvider}_api_key`);
      if (!apiKey) {
        throw new Error(`API key not found for ${autoresponder.aiProvider}`);
      }

      // Build the prompt with context
      const prompt = this.buildPromptWithContext(autoresponder.aiPrompt!, context);

      // Generate response based on provider
      switch (autoresponder.aiProvider) {
        case 'openai':
          return await this.generateOpenAiResponse(apiKey, autoresponder, prompt);
        case 'anthropic':
          return await this.generateAnthropicResponse(apiKey, autoresponder, prompt);
        case 'google':
          return await this.generateGoogleResponse(apiKey, autoresponder, prompt);
        default:
          throw new Error(`Unsupported AI provider: ${autoresponder.aiProvider}`);
      }
    } catch (error) {
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  private buildPromptWithContext(prompt: string, context: any): string {
    let finalPrompt = prompt;
    
    // Replace common context variables
    if (context.userMessage) {
      finalPrompt = finalPrompt.replace('{{userMessage}}', context.userMessage);
    }
    if (context.userName) {
      finalPrompt = finalPrompt.replace('{{userName}}', context.userName);
    }
    if (context.currentTime) {
      finalPrompt = finalPrompt.replace('{{currentTime}}', context.currentTime);
    }

    return finalPrompt;
  }

  private async generateOpenAiResponse(apiKey: string, autoresponder: Autoresponder, prompt: string): Promise<string> {
    // Implementation would make actual API call to OpenAI
    // For now, return a simulated response
    return `OpenAI Response: ${prompt.substring(0, 100)}...`;
  }

  private async generateAnthropicResponse(apiKey: string, autoresponder: Autoresponder, prompt: string): Promise<string> {
    // Implementation would make actual API call to Anthropic
    // For now, return a simulated response
    return `Anthropic Response: ${prompt.substring(0, 100)}...`;
  }

  private async generateGoogleResponse(apiKey: string, autoresponder: Autoresponder, prompt: string): Promise<string> {
    // Implementation would make actual API call to Google AI
    // For now, return a simulated response
    return `Google AI Response: ${prompt.substring(0, 100)}...`;
  }
}