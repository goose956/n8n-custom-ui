import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  CreateAutoResponseTemplateDto,
  UpdateAutoResponseTemplateDto,
  AutoResponseTemplateQueryDto,
} from './dto/auto-response-templates.dto';

export interface AutoResponseTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateType: 'welcome' | 'follow_up' | 'thank_you' | 'reminder' | 'custom';
  triggerConditions: {
    eventType: string;
    delayMinutes?: number;
    conditions?: Record<string, any>;
  };
  isActive: boolean;
  variables: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usage: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    lastUsed?: Date;
  };
}

export interface SentResponse {
  id: string;
  templateId: string;
  recipientEmail: string;
  subject: string;
  content: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  contextData?: Record<string, any>;
  metadata?: Record<string, any>;
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
  errorMessage?: string;
}

export interface ConversionMetrics {
  templateId?: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  breakdown?: {
    byTemplate?: Record<string, any>;
    byDay?: Record<string, any>;
  };
}

@Injectable()
export class AutoResponseTemplatesService {
  private readonly logger = new Logger(AutoResponseTemplatesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  async getAllTemplates(query: AutoResponseTemplateQueryDto): Promise<{
    templates: AutoResponseTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const data = this.db.readSync();
      let templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];

      // Apply filters
      if (query.templateType) {
        templates = templates.filter(t => t.templateType === query.templateType);
      }

      if (query.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === query.isActive);
      }

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        templates = templates.filter(
          t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.subject.toLowerCase().includes(searchLower),
        );
      }

      // Apply sorting
      if (query.sortBy) {
        templates.sort((a, b) => {
          const aVal = a[query.sortBy as keyof AutoResponseTemplate];
          const bVal = b[query.sortBy as keyof AutoResponseTemplate];
          
          if (query.sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginatedTemplates = templates.slice(startIndex, startIndex + limit);

      return {
        templates: paginatedTemplates,
        total: templates.length,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error getting all templates:', error);
      throw new Error('Failed to retrieve templates');
    }
  }

  async getTemplateById(id: string): Promise<AutoResponseTemplate | null> {
    try {
      const data = this.db.readSync();
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
      return templates.find(t => t.id === id) || null;
    } catch (error) {
      this.logger.error('Error getting template by ID:', error);
      throw new Error('Failed to retrieve template');
    }
  }

  async createTemplate(createDto: CreateAutoResponseTemplateDto): Promise<AutoResponseTemplate> {
    try {
      const data = this.db.readSync();
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];

      // Extract variables from content
      const variables = this.extractVariablesFromContent(createDto.content);

      const newTemplate: AutoResponseTemplate = {
        id: this.generateId(),
        name: createDto.name,
        subject: createDto.subject,
        content: createDto.content,
        templateType: createDto.templateType,
        triggerConditions: createDto.triggerConditions,
        isActive: createDto.isActive ?? true,
        variables,
        createdBy: createDto.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
        },
      };

      templates.push(newTemplate);
      data.autoResponseTemplates = templates;
      this.db.writeSync(data);

      this.logger.log(`Created auto response template: ${newTemplate.id}`);
      return newTemplate;
    } catch (error) {
      this.logger.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  async updateTemplate(
    id: string,
    updateDto: UpdateAutoResponseTemplateDto,
  ): Promise<AutoResponseTemplate | null> {
    try {
      const data = this.db.readSync();
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
      const templateIndex = templates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return null;
      }

      const existingTemplate = templates[templateIndex];
      const updatedTemplate: AutoResponseTemplate = {
        ...existingTemplate,
        ...updateDto,
        variables: updateDto.content 
          ? this.extractVariablesFromContent(updateDto.content)
          : existingTemplate.variables,
        updatedAt: new Date(),
      };

      templates[templateIndex] = updatedTemplate;
      data.autoResponseTemplates = templates;
      this.db.writeSync(data);

      this.logger.log(`Updated auto response template: ${id}`);
      return updatedTemplate;
    } catch (error) {
      this.logger.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  async toggleTemplateStatus(id: string): Promise<AutoResponseTemplate | null> {
    try {
      const data = this.db.readSync();
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
      const templateIndex = templates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return null;
      }

      templates[templateIndex].isActive = !templates[templateIndex].isActive;
      templates[templateIndex].updatedAt = new Date();

      data.autoResponseTemplates = templates;
      this.db.writeSync(data);

      this.logger.log(`Toggled template status: ${id} to ${templates[templateIndex].isActive}`);
      return templates[templateIndex];
    } catch (error) {
      this.logger.error('Error toggling template status:', error);
      throw new Error('Failed to toggle template status');
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const data = this.db.readSync();
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
      const initialLength = templates.length;

      data.autoResponseTemplates = templates.filter(t => t.id !== id);
      
      if (data.autoResponseTemplates.length === initialLength) {
        return false;
      }

      this.db.writeSync(data);
      this.logger.log(`Deleted auto response template: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }

  async triggerAutoResponse(
    templateId: string,
    recipientEmail: string,
    contextData?: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<SentResponse> {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      // Process template content with variables
      const processedContent = this.processTemplateVariables(template.content, contextData);
      const processedSubject = this.processTemplateVariables(template.subject, contextData);

      const data = this.db.readSync();
      const sentResponses: SentResponse[] = data.sentResponses || [];

      const sentResponse: SentResponse = {
        id: this.generateId(),
        templateId,
        recipientEmail,
        subject: processedSubject,
        content: processedContent,
        sentAt: new Date(),
        status: 'sent',
        contextData,
        metadata,
        deliveryAttempts: 1,
        lastDeliveryAttempt: new Date(),
      };

      // Simulate email sending (in real implementation, integrate with email service)
      try {
        await this.sendEmail(sentResponse);
        sentResponse.status = 'delivered';
      } catch (emailError) {
        sentResponse.status = 'failed';
        sentResponse.errorMessage = emailError.message;
      }

      sentResponses.push(sentResponse);
      data.sentResponses = sentResponses;

      // Update template usage statistics
      const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
      const templateIndex = templates.findIndex(t => t.id === templateId);
      if (templateIndex !== -1) {
        templates[templateIndex].usage.totalSent++;
        templates[templateIndex].usage.lastUsed = new Date();
        data.autoResponseTemplates = templates;
      }

      this.db.writeSync(data);

      this.logger.log(`Triggered auto response for template: ${templateId}`);
      return sentResponse;
    } catch (error) {
      this.logger.error('Error triggering auto response:', error);
      throw new Error('Failed to trigger auto response');
    }
  }

  async getSentResponses(
    templateId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    sentResponses: SentResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const data = this.db.readSync();
      let sentResponses: SentResponse[] = data.sentResponses || [];

      if (templateId) {
        sentResponses = sentResponses.filter(sr => sr.templateId === templateId);
      }

      // Sort by sent date (most recent first)
      sentResponses.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedResponses = sentResponses.slice(startIndex, startIndex + limit);

      return {
        sentResponses: paginatedResponses,
        total: sentResponses.length,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error getting sent responses:', error);
      throw new Error('Failed to retrieve sent responses');
    }
  }

  async getConversionMetrics(templateId?: string): Promise<ConversionMetrics> {
    try {
      const data = this.db.readSync();
      const sentResponses: SentResponse[] = data.sentResponses || [];
      
      let filteredResponses = sentResponses;
      if (templateId) {
        filteredResponses = sentResponses.filter(sr => sr.templateId === templateId);
      }

      const totalSent = filteredResponses.length;
      const totalDelivered = filteredResponses.filter(sr => sr.status === 'delivered' || sr.status === 'opened' || sr.status === 'clicked').length;
      const totalOpened = filteredResponses.filter(sr => sr.status === 'opened' || sr.status === 'clicked').length;
      const totalClicked = filteredResponses.filter(sr => sr.status === 'clicked').length;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const conversionRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

      // Calculate date range
      const dates = filteredResponses.map(sr => new Date(sr.sentAt));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

      const metrics: ConversionMetrics = {
        templateId,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dateRange: { startDate, endDate },
      };

      // Add breakdown by template if not filtering by specific template
      if (!templateId && totalSent > 0) {
        const byTemplate: Record<string, any> = {};
        const templates: AutoResponseTemplate[] = data.autoResponseTemplates || [];
        
        templates.forEach(template => {
          const templateResponses = sentResponses.filter(sr => sr.templateId === template.id);
          if (templateResponses.length > 0) {
            const tSent = templateResponses.length;
            const tDelivered = templateResponses.filter(sr => sr.status === 'delivered' || sr.status === 'opened' || sr.status === 'clicked').length;
            const tOpened = templateResponses.filter(sr => sr.status === 'opened' || sr.status === 'clicked').length;
            const tClicked = templateResponses.filter(sr => sr.status === 'clicked').length;
            
            byTemplate[template.id] = {
              name: template.name,
              sent: tSent,
              delivered: tDelivered,
              opened: tOpened,
              clicked: tClicked,
              deliveryRate: tSent > 0 ? Math.round((tDelivered / tSent) * 10000) / 100 : 0,
              openRate: tDelivered > 0 ? Math.round((tOpened / tDelivered) * 10000) / 100 : 0,
              clickRate: tOpened > 0 ? Math.round((tClicked / tOpened) * 10000) / 100 : 0,
            };
          }
        });

        metrics.breakdown = { byTemplate };
      }

      return metrics;
    } catch (error) {
      this.logger.error('Error getting conversion metrics:', error);
      throw new Error('Failed to retrieve conversion metrics');
    }
  }

  private extractVariablesFromContent(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  private processTemplateVariables(template: string, contextData?: Record<string, any>): string {
    if (!contextData) return template;

    let processedTemplate = template;
    Object.keys(contextData).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedTemplate = processedTemplate.replace(regex, contextData[key]);
    });

    return processedTemplate;
  }

  private async sendEmail(sentResponse: SentResponse): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate random success/failure (90% success rate)
    if (Math.random() < 0.9) {
      this.logger.log(`Email sent successfully to: ${sentResponse.recipientEmail}`);
    } else {
      throw new Error('Email delivery failed');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
