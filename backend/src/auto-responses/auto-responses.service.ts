import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  CreateAutoResponseDto,
  UpdateAutoResponseDto,
  AutoResponseQueryDto,
} from './dto/auto-responses.dto';

interface AutoResponse {
  id: string;
  name: string;
  subject: string;
  content: string;
  trigger: {
    type: 'keyword' | 'time_delay' | 'event';
    value: string;
    conditions?: any;
  };
  settings: {
    delayMinutes?: number;
    maxSends?: number;
    trackOpens?: boolean;
    trackClicks?: boolean;
  };
  personalization: {
    enabled: boolean;
    fields: string[];
  };
  status: 'active' | 'inactive' | 'draft';
  userId: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

interface SentResponse {
  id: string;
  templateId: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  metadata: {
    opens: number;
    clicks: number;
    lastOpenedAt?: string;
    lastClickedAt?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  conversions: {
    converted: boolean;
    convertedAt?: string;
    conversionValue?: number;
    conversionType?: string;
  };
}

interface AutoResponsesDatabase {
  autoResponses: AutoResponse[];
  sentResponses: SentResponse[];
}

@Injectable()
export class AutoResponsesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  private getDatabase(): AutoResponsesDatabase {
    const data = this.db.readSync();
    if (!data.autoResponses) {
      data.autoResponses = [];
    }
    if (!data.sentResponses) {
      data.sentResponses = [];
    }
    return data as AutoResponsesDatabase;
  }

  private saveDatabase(data: AutoResponsesDatabase): void {
    this.db.writeSync(data);
  }

  async getAllAutoResponses(query: AutoResponseQueryDto) {
    const db = this.getDatabase();
    let autoResponses = db.autoResponses;

    // Apply filters
    if (query.userId) {
      autoResponses = autoResponses.filter(ar => ar.userId === query.userId);
    }

    if (query.status) {
      autoResponses = autoResponses.filter(ar => ar.status === query.status);
    }

    if (query.trigger) {
      autoResponses = autoResponses.filter(ar => ar.trigger.type === query.trigger);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      autoResponses = autoResponses.filter(ar =>
        ar.name.toLowerCase().includes(searchLower) ||
        ar.subject.toLowerCase().includes(searchLower) ||
        ar.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (query.sortBy) {
      autoResponses.sort((a, b) => {
        const aValue = this.getNestedProperty(a, query.sortBy);
        const bValue = this.getNestedProperty(b, query.sortBy);
        
        if (query.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedResults = autoResponses.slice(startIndex, endIndex);

    return {
      autoResponses: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(autoResponses.length / limit),
        totalItems: autoResponses.length,
        itemsPerPage: limit,
      },
    };
  }

  async getAutoResponseById(id: string): Promise<AutoResponse | null> {
    const db = this.getDatabase();
    return db.autoResponses.find(ar => ar.id === id) || null;
  }

  async createAutoResponse(createDto: CreateAutoResponseDto): Promise<AutoResponse> {
    const db = this.getDatabase();
    
    const newAutoResponse: AutoResponse = {
      id: this.generateId(),
      name: createDto.name,
      subject: createDto.subject,
      content: createDto.content,
      trigger: createDto.trigger,
      settings: {
        delayMinutes: createDto.settings?.delayMinutes || 0,
        maxSends: createDto.settings?.maxSends || 1,
        trackOpens: createDto.settings?.trackOpens ?? true,
        trackClicks: createDto.settings?.trackClicks ?? true,
      },
      personalization: {
        enabled: createDto.personalization?.enabled || false,
        fields: createDto.personalization?.fields || [],
      },
      status: createDto.status || 'draft',
      userId: createDto.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
    };

    db.autoResponses.push(newAutoResponse);
    this.saveDatabase(db);

    return newAutoResponse;
  }

  async updateAutoResponse(
    id: string,
    updateDto: UpdateAutoResponseDto,
  ): Promise<AutoResponse | null> {
    const db = this.getDatabase();
    const index = db.autoResponses.findIndex(ar => ar.id === id);

    if (index === -1) {
      return null;
    }

    const existingAutoResponse = db.autoResponses[index];
    const updatedAutoResponse: AutoResponse = {
      ...existingAutoResponse,
      ...updateDto,
      id,
      updatedAt: new Date().toISOString(),
    };

    db.autoResponses[index] = updatedAutoResponse;
    this.saveDatabase(db);

    return updatedAutoResponse;
  }

  async updateAutoResponseStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<AutoResponse | null> {
    const db = this.getDatabase();
    const index = db.autoResponses.findIndex(ar => ar.id === id);

    if (index === -1) {
      return null;
    }

    db.autoResponses[index].status = status;
    db.autoResponses[index].updatedAt = new Date().toISOString();
    this.saveDatabase(db);

    return db.autoResponses[index];
  }

  async deleteAutoResponse(id: string): Promise<boolean> {
    const db = this.getDatabase();
    const initialLength = db.autoResponses.length;
    db.autoResponses = db.autoResponses.filter(ar => ar.id !== id);
    
    if (db.autoResponses.length < initialLength) {
      this.saveDatabase(db);
      return true;
    }
    return false;
  }

  async duplicateAutoResponse(id: string): Promise<AutoResponse | null> {
    const db = this.getDatabase();
    const originalTemplate = db.autoResponses.find(ar => ar.id === id);

    if (!originalTemplate) {
      return null;
    }

    const duplicatedTemplate: AutoResponse = {
      ...originalTemplate,
      id: this.generateId(),
      name: `${originalTemplate.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
    };

    db.autoResponses.push(duplicatedTemplate);
    this.saveDatabase(db);

    return duplicatedTemplate;
  }

  async testAutoResponse(id: string, testRecipient: string): Promise<any> {
    const db = this.getDatabase();
    const template = db.autoResponses.find(ar => ar.id === id);

    if (!template) {
      throw new BadRequestException('Auto response template not found');
    }

    // Simulate sending test email
    const testResponse = {
      templateId: id,
      recipient: testRecipient,
      subject: template.subject,
      content: this.personalizeContent(template.content, {
        name: 'Test User',
        email: testRecipient,
      }),
      sentAt: new Date().toISOString(),
      status: 'test_sent',
    };

    return {
      message: 'Test email sent successfully',
      testResponse,
    };
  }

  async getSentResponses(options: {
    page: number;
    limit: number;
    userId?: string;
    templateId?: string;
  }) {
    const db = this.getDatabase();
    let sentResponses = db.sentResponses;

    // Apply filters
    if (options.userId) {
      sentResponses = sentResponses.filter(sr => sr.userId === options.userId);
    }

    if (options.templateId) {
      sentResponses = sentResponses.filter(sr => sr.templateId === options.templateId);
    }

    // Sort by sent date (newest first)
    sentResponses.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    // Apply pagination
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedResults = sentResponses.slice(startIndex, endIndex);

    return {
      sentResponses: paginatedResults,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(sentResponses.length / options.limit),
        totalItems: sentResponses.length,
        itemsPerPage: options.limit,
      },
    };
  }

  async deleteSentResponse(id: string): Promise<boolean> {
    const db = this.getDatabase();
    const initialLength = db.sentResponses.length;
    db.sentResponses = db.sentResponses.filter(sr => sr.id !== id);
    
    if (db.sentResponses.length < initialLength) {
      this.saveDatabase(db);
      return true;
    }
    return false;
  }

  async getAutoResponseStats(userId?: string) {
    const db = this.getDatabase();
    let autoResponses = db.autoResponses;
    let sentResponses = db.sentResponses;

    if (userId) {
      autoResponses = autoResponses.filter(ar => ar.userId === userId);
      sentResponses = sentResponses.filter(sr => sr.userId === userId);
    }

    const totalTemplates = autoResponses.length;
    const activeTemplates = autoResponses.filter(ar => ar.status === 'active').length;
    const totalSent = sentResponses.length;
    const totalOpened = sentResponses.filter(sr => sr.metadata.opens > 0).length;
    const totalClicked = sentResponses.filter(sr => sr.metadata.clicks > 0).length;
    const totalConverted = sentResponses.filter(sr => sr.conversions.converted).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

    return {
      overview: {
        totalTemplates,
        activeTemplates,
        totalSent,
        totalOpened,
        totalClicked,
        totalConverted,
      },
      rates: {
        openRate: Number(openRate.toFixed(2)),
        clickRate: Number(clickRate.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
      },
      recentActivity: sentResponses
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
        .slice(0, 10),
    };
  }

  async getConversionMetrics(filters: {
    templateId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const db = this.getDatabase();
    let sentResponses = db.sentResponses;

    // Apply filters
    if (filters.userId) {
      sentResponses = sentResponses.filter(sr => sr.userId === filters.userId);
    }

    if (filters.templateId) {
      sentResponses = sentResponses.filter(sr => sr.templateId === filters.templateId);
    }

    if (filters.startDate) {
      sentResponses = sentResponses.filter(sr => 
        new Date(sr.sentAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      sentResponses = sentResponses.filter(sr => 
        new Date(sr.sentAt) <= new Date(filters.endDate)
      );
    }

    // Calculate metrics
    const totalSent = sentResponses.length;
    const conversions = sentResponses.filter(sr => sr.conversions.converted);
    const totalConverted = conversions.length;
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;
    
    const totalConversionValue = conversions.reduce((sum, sr) => 
      sum + (sr.conversions.conversionValue || 0), 0
    );

    // Group by template
    const templateMetrics = db.autoResponses.map(template => {
      const templateResponses = sentResponses.filter(sr => sr.templateId === template.id);
      const templateConversions = templateResponses.filter(sr => sr.conversions.converted);
      
      return {
        templateId: template.id,
        templateName: template.name,
        sent: templateResponses.length,
        converted: templateConversions.length,
        conversionRate: templateResponses.length > 0 
          ? Number(((templateConversions.length / templateResponses.length) * 100).toFixed(2))
          : 0,
        conversionValue: templateConversions.reduce((sum, sr) => 
          sum + (sr.conversions.conversionValue || 0), 0
        ),
      };
    }).filter(metric => metric.sent > 0);

    // Daily metrics for the last 30 days
    const dailyMetrics = this.getDailyMetrics(sentResponses, 30);

    return {
      overview: {
        totalSent,
        totalConverted,
        conversionRate: Number(conversionRate.toFixed(2)),
        totalConversionValue: Number(totalConversionValue.toFixed(2)),
      },
      templateMetrics,
      dailyMetrics,
      topConverting: templateMetrics
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5),
    };
  }

  private getDailyMetrics(sentResponses: SentResponse[], days: number) {
    const metrics = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResponses = sentResponses.filter(sr => 
        sr.sentAt.startsWith(dateStr)
      );
      
      const dayConversions = dayResponses.filter(sr => sr.conversions.converted);
      
      metrics.push({
        date: dateStr,
        sent: dayResponses.length,
        converted: dayConversions.length,
        conversionRate: dayResponses.length > 0 
          ? Number(((dayConversions.length / dayResponses.length) * 100).toFixed(2))
          : 0,
      });
    }
    
    return metrics;
  }

  private personalizeContent(content: string, data: any): string {
    let personalizedContent = content;
    
    // Replace common placeholders
    personalizedContent = personalizedContent.replace(/\{\{name\}\}/g, data.name || '');
    personalizedContent = personalizedContent.replace(/\{\{email\}\}/g, data.email || '');
    personalizedContent = personalizedContent.replace(/\{\{firstName\}\}/g, 
      (data.name || '').split(' ')[0] || '');
    
    return personalizedContent;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}