import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateContentSourceDto, UpdateContentSourceDto } from './dto/content-sources.dto';

export interface ContentSource {
  id: string;
  type: 'account' | 'hashtag' | 'keyword';
  value: string;
  displayName: string;
  description?: string;
  active: boolean;
  priority: number;
  tags: string[];
  metadata: {
    followers?: number;
    verified?: boolean;
    lastChecked?: Date;
    errorCount?: number;
    successCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ContentSourcesData {
  contentSources: ContentSource[];
}

@Injectable()
export class ContentSourcesService {
  private readonly logger = new Logger(ContentSourcesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async findAll(
    filters: { type?: string; active?: boolean } = {},
    pagination: { limit: number; offset: number } = { limit: 50, offset: 0 },
  ): Promise<{ data: ContentSource[]; total: number }> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
    let filteredSources = data.contentSources;

    // Apply filters
    if (filters.type) {
      filteredSources = filteredSources.filter(source => source.type === filters.type);
    }

    if (filters.active !== undefined) {
      filteredSources = filteredSources.filter(source => source.active === filters.active);
    }

    // Sort by priority (descending) then by creation date (newest first)
    filteredSources.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = filteredSources.length;
    const paginatedSources = filteredSources.slice(pagination.offset, pagination.offset + pagination.limit);

    return {
      data: paginatedSources,
      total,
    };
  }

  async findById(id: string): Promise<ContentSource | null> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
    return data.contentSources.find(source => source.id === id) || null;
  }

  async create(createContentSourceDto: CreateContentSourceDto): Promise<ContentSource> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };

    // Check for duplicate sources
    const existingSource = data.contentSources.find(
      source => source.type === createContentSourceDto.type && source.value.toLowerCase() === createContentSourceDto.value.toLowerCase()
    );

    if (existingSource) {
      throw new Error(`Content source with type '${createContentSourceDto.type}' and value '${createContentSourceDto.value}' already exists`);
    }

    const newSource: ContentSource = {
      id: uuidv4(),
      type: createContentSourceDto.type,
      value: createContentSourceDto.value.trim(),
      displayName: createContentSourceDto.displayName || createContentSourceDto.value,
      description: createContentSourceDto.description,
      active: createContentSourceDto.active !== undefined ? createContentSourceDto.active : true,
      priority: createContentSourceDto.priority || 1,
      tags: createContentSourceDto.tags || [],
      metadata: {
        errorCount: 0,
        successCount: 0,
        lastChecked: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate source if it's an account
    if (newSource.type === 'account') {
      try {
        const validationResult = await this.validateTwitterAccount(newSource.value);
        newSource.metadata = {
          ...newSource.metadata,
          ...validationResult,
        };
      } catch (error) {
        this.logger.warn(`Failed to validate Twitter account ${newSource.value}: ${error.message}`);
      }
    }

    data.contentSources.push(newSource);
    this.db.writeSync('content-sources.json', data);

    this.logger.log(`Created new content source: ${newSource.type}:${newSource.value}`);
    return newSource;
  }

  async update(id: string, updateContentSourceDto: UpdateContentSourceDto): Promise<ContentSource> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
    const sourceIndex = data.contentSources.findIndex(source => source.id === id);

    if (sourceIndex === -1) {
      throw new Error('Content source not found');
    }

    const existingSource = data.contentSources[sourceIndex];

    // Check for duplicate if value or type is being changed
    if (updateContentSourceDto.value || updateContentSourceDto.type) {
      const newValue = updateContentSourceDto.value || existingSource.value;
      const newType = updateContentSourceDto.type || existingSource.type;
      
      const duplicateSource = data.contentSources.find(
        source => source.id !== id && source.type === newType && source.value.toLowerCase() === newValue.toLowerCase()
      );

      if (duplicateSource) {
        throw new Error(`Content source with type '${newType}' and value '${newValue}' already exists`);
      }
    }

    const updatedSource: ContentSource = {
      ...existingSource,
      ...updateContentSourceDto,
      id: existingSource.id, // Ensure ID cannot be changed
      createdAt: existingSource.createdAt, // Ensure creation date cannot be changed
      updatedAt: new Date(),
    };

    if (updateContentSourceDto.value) {
      updatedSource.value = updateContentSourceDto.value.trim();
    }

    // Re-validate if account value changed
    if (updatedSource.type === 'account' && updateContentSourceDto.value) {
      try {
        const validationResult = await this.validateTwitterAccount(updatedSource.value);
        updatedSource.metadata = {
          ...updatedSource.metadata,
          ...validationResult,
        };
      } catch (error) {
        this.logger.warn(`Failed to validate updated Twitter account ${updatedSource.value}: ${error.message}`);
      }
    }

    data.contentSources[sourceIndex] = updatedSource;
    this.db.writeSync('content-sources.json', data);

    this.logger.log(`Updated content source: ${updatedSource.id}`);
    return updatedSource;
  }

  async delete(id: string): Promise<void> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
    const sourceIndex = data.contentSources.findIndex(source => source.id === id);

    if (sourceIndex === -1) {
      throw new Error('Content source not found');
    }

    const deletedSource = data.contentSources[sourceIndex];
    data.contentSources.splice(sourceIndex, 1);
    this.db.writeSync('content-sources.json', data);

    this.logger.log(`Deleted content source: ${deletedSource.type}:${deletedSource.value}`);
  }

  async validateSource(id: string): Promise<any> {
    const source = await this.findById(id);
    if (!source) {
      throw new Error('Content source not found');
    }

    let validationResult: any = {
      valid: true,
      lastValidated: new Date(),
      errors: [],
    };

    try {
      switch (source.type) {
        case 'account':
          validationResult = await this.validateTwitterAccount(source.value);
          break;
        case 'hashtag':
          validationResult = await this.validateHashtag(source.value);
          break;
        case 'keyword':
          validationResult = await this.validateKeyword(source.value);
          break;
        default:
          throw new Error(`Unknown source type: ${source.type}`);
      }

      // Update source metadata with validation results
      const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
      const sourceIndex = data.contentSources.findIndex(s => s.id === id);
      
      if (sourceIndex !== -1) {
        data.contentSources[sourceIndex].metadata = {
          ...data.contentSources[sourceIndex].metadata,
          lastChecked: new Date(),
          ...validationResult,
        };
        
        if (validationResult.valid) {
          data.contentSources[sourceIndex].metadata.successCount = 
            (data.contentSources[sourceIndex].metadata.successCount || 0) + 1;
        } else {
          data.contentSources[sourceIndex].metadata.errorCount = 
            (data.contentSources[sourceIndex].metadata.errorCount || 0) + 1;
        }
        
        this.db.writeSync('content-sources.json', data);
      }

    } catch (error) {
      this.logger.error(`Validation failed for source ${id}: ${error.message}`);
      validationResult = {
        valid: false,
        lastValidated: new Date(),
        errors: [error.message],
      };
    }

    return validationResult;
  }

  async getStats(): Promise<any> {
    const data = this.db.readSync<ContentSourcesData>('content-sources.json') || { contentSources: [] };
    const sources = data.contentSources;

    const stats = {
      total: sources.length,
      active: sources.filter(s => s.active).length,
      inactive: sources.filter(s => !s.active).length,
      byType: {
        account: sources.filter(s => s.type === 'account').length,
        hashtag: sources.filter(s => s.type === 'hashtag').length,
        keyword: sources.filter(s => s.type === 'keyword').length,
      },
      performance: {
        totalSuccesses: sources.reduce((sum, s) => sum + (s.metadata.successCount || 0), 0),
        totalErrors: sources.reduce((sum, s) => sum + (s.metadata.errorCount || 0), 0),
        averagePriority: sources.length > 0 ? sources.reduce((sum, s) => sum + s.priority, 0) / sources.length : 0,
      },
      recentActivity: {
        createdToday: sources.filter(s => {
          const today = new Date();
          const sourceDate = new Date(s.createdAt);
          return sourceDate.toDateString() === today.toDateString();
        }).length,
        updatedToday: sources.filter(s => {
          const today = new Date();
          const sourceDate = new Date(s.updatedAt);
          return sourceDate.toDateString() === today.toDateString();
        }).length,
      },
    };

    return stats;
  }

  private async validateTwitterAccount(username: string): Promise<any> {
    try {
      // Clean username (remove @ if present)
      const cleanUsername = username.replace(/^@/, '');
      
      // Simulate Twitter API validation
      // In a real implementation, you would use the Twitter API here
      const apiKey = this.cryptoService.getApiKey('TWITTER_API_KEY');
      
      if (!apiKey) {
        throw new Error('Twitter API key not configured');
      }

      // Mock validation for demonstration
      // Replace with actual Twitter API call
      const mockValidation = {
        valid: true,
        followers: Math.floor(Math.random() * 100000),
        verified: Math.random() > 0.8,
        exists: true,
        lastValidated: new Date(),
      };

      this.logger.debug(`Validated Twitter account: @${cleanUsername}`);
      return mockValidation;
    } catch (error) {
      this.logger.error(`Failed to validate Twitter account ${username}: ${error.message}`);
      return {
        valid: false,
        errors: [error.message],
        lastValidated: new Date(),
      };
    }
  }

  private async validateHashtag(hashtag: string): Promise<any> {
    try {
      // Clean hashtag (ensure it starts with #)
      const cleanHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
      
      // Basic validation rules for hashtags
      if (cleanHashtag.length < 2 || cleanHashtag.length > 100) {
        throw new Error('Hashtag must be between 1 and 99 characters');
      }
      
      if (!/^#[a-zA-Z0-9_]+$/.test(cleanHashtag)) {
        throw new Error('Hashtag contains invalid characters');
      }

      return {
        valid: true,
        lastValidated: new Date(),
        trending: Math.random() > 0.7,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        lastValidated: new Date(),
      };
    }
  }

  private async validateKeyword(keyword: string): Promise<any> {
    try {
      const cleanKeyword = keyword.trim();
      
      // Basic validation rules for keywords
      if (cleanKeyword.length < 1 || cleanKeyword.length > 100) {
        throw new Error('Keyword must be between 1 and 100 characters');
      }
      
      if (cleanKeyword.includes('@') || cleanKeyword.includes('#')) {
        throw new Error('Keywords should not contain @ or # symbols');
      }

      return {
        valid: true,
        lastValidated: new Date(),
        searchVolume: Math.floor(Math.random() * 10000),
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        lastValidated: new Date(),
      };
    }
  }
}
