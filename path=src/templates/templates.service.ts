import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateQueryDto } from './dto/template.dto';
import { v4 as uuidv4 } from 'uuid';

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  tags: string[];
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  performance: {
    totalSent: number;
    totalResponses: number;
    responseRate: number;
    totalConnections: number;
    connectionRate: number;
    avgResponseTime: number; // in hours
    lastUsed: string;
  };
}

export interface TemplateUsageTracking {
  templateId: string;
  timestamp: string;
  action: 'sent' | 'response_received' | 'connection_accepted';
  responseTime?: number; // in hours for response tracking
}

@Injectable()
export class TemplatesService {
  private readonly dataFile = 'message-templates.json';

  constructor(private readonly db: DatabaseService) {}

  async findAll(query: TemplateQueryDto): Promise<MessageTemplate[]> {
    const data = this.db.readSync(this.dataFile);
    let templates: MessageTemplate[] = data.templates || [];

    // Apply filters
    if (query.category) {
      templates = templates.filter(
        template => template.category.toLowerCase() === query.category.toLowerCase(),
      );
    }

    if (query.isActive !== undefined) {
      templates = templates.filter(template => template.isActive === query.isActive);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      templates = templates.filter(
        template =>
          template.name.toLowerCase().includes(searchLower) ||
          template.subject.toLowerCase().includes(searchLower) ||
          template.content.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Apply sorting
    if (query.sortBy) {
      templates.sort((a, b) => {
        let aVal, bVal;
        
        switch (query.sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case 'responseRate':
            aVal = a.performance.responseRate;
            bVal = b.performance.responseRate;
            break;
          case 'totalSent':
            aVal = a.performance.totalSent;
            bVal = b.performance.totalSent;
            break;
          default:
            return 0;
        }

        if (query.sortOrder === 'desc') {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return templates.slice(startIndex, endIndex);
  }

  async findById(id: string): Promise<MessageTemplate | null> {
    const data = this.db.readSync(this.dataFile);
    const templates: MessageTemplate[] = data.templates || [];
    return templates.find(template => template.id === id) || null;
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<MessageTemplate> {
    const data = this.db.readSync(this.dataFile);
    const templates: MessageTemplate[] = data.templates || [];

    // Extract variables from content
    const variables = this.extractVariables(createTemplateDto.content);

    const newTemplate: MessageTemplate = {
      id: uuidv4(),
      name: createTemplateDto.name,
      subject: createTemplateDto.subject,
      content: createTemplateDto.content,
      category: createTemplateDto.category,
      tags: createTemplateDto.tags || [],
      variables,
      isActive: createTemplateDto.isActive !== undefined ? createTemplateDto.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performance: {
        totalSent: 0,
        totalResponses: 0,
        responseRate: 0,
        totalConnections: 0,
        connectionRate: 0,
        avgResponseTime: 0,
        lastUsed: '',
      },
    };

    templates.push(newTemplate);
    this.db.writeSync(this.dataFile, { ...data, templates });

    return newTemplate;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<MessageTemplate | null> {
    const data = this.db.readSync(this.dataFile);
    const templates: MessageTemplate[] = data.templates || [];
    const templateIndex = templates.findIndex(template => template.id === id);

    if (templateIndex === -1) {
      return null;
    }

    const existingTemplate = templates[templateIndex];
    
    // Update variables if content changed
    let variables = existingTemplate.variables;
    if (updateTemplateDto.content && updateTemplateDto.content !== existingTemplate.content) {
      variables = this.extractVariables(updateTemplateDto.content);
    }

    const updatedTemplate: MessageTemplate = {
      ...existingTemplate,
      ...updateTemplateDto,
      variables,
      updatedAt: new Date().toISOString(),
    };

    templates[templateIndex] = updatedTemplate;
    this.db.writeSync(this.dataFile, { ...data, templates });

    return updatedTemplate;
  }

  async delete(id: string): Promise<boolean> {
    const data = this.db.readSync(this.dataFile);
    const templates: MessageTemplate[] = data.templates || [];
    const templateIndex = templates.findIndex(template => template.id === id);

    if (templateIndex === -1) {
      return false;
    }

    templates.splice(templateIndex, 1);
    this.db.writeSync(this.dataFile, { ...data, templates });

    return true;
  }

  async getPerformanceMetrics(id: string): Promise<any | null> {
    const template = await this.findById(id);
    if (!template) {
      return null;
    }

    const data = this.db.readSync(this.dataFile);
    const usage: TemplateUsageTracking[] = data.templateUsage || [];
    
    // Get usage data for this template
    const templateUsage = usage.filter(u => u.templateId === id);
    
    // Calculate additional metrics
    const last30Days = templateUsage.filter(u => {
      const usageDate = new Date(u.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return usageDate >= thirtyDaysAgo;
    });

    const last7Days = templateUsage.filter(u => {
      const usageDate = new Date(u.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return usageDate >= sevenDaysAgo;
    });

    return {
      ...template.performance,
      usage30Days: last30Days.length,
      usage7Days: last7Days.length,
      usageByAction: {
        sent: templateUsage.filter(u => u.action === 'sent').length,
        responses: templateUsage.filter(u => u.action === 'response_received').length,
        connections: templateUsage.filter(u => u.action === 'connection_accepted').length,
      },
      dailyUsage: this.calculateDailyUsage(templateUsage),
    };
  }

  async trackUsage(id: string, trackingData: any): Promise<MessageTemplate | null> {
    const data = this.db.readSync(this.dataFile);
    const templates: MessageTemplate[] = data.templates || [];
    const usage: TemplateUsageTracking[] = data.templateUsage || [];
    
    const templateIndex = templates.findIndex(template => template.id === id);
    if (templateIndex === -1) {
      return null;
    }

    const template = templates[templateIndex];
    const now = new Date().toISOString();

    // Add usage tracking record
    const usageRecord: TemplateUsageTracking = {
      templateId: id,
      timestamp: now,
      action: trackingData.action || 'sent',
      responseTime: trackingData.responseTime,
    };

    usage.push(usageRecord);

    // Update template performance metrics
    const updatedPerformance = { ...template.performance };
    updatedPerformance.lastUsed = now;

    switch (trackingData.action) {
      case 'sent':
        updatedPerformance.totalSent += 1;
        break;
      case 'response_received':
        updatedPerformance.totalResponses += 1;
        if (trackingData.responseTime) {
          updatedPerformance.avgResponseTime = 
            (updatedPerformance.avgResponseTime * (updatedPerformance.totalResponses - 1) + trackingData.responseTime) / 
            updatedPerformance.totalResponses;
        }
        break;
      case 'connection_accepted':
        updatedPerformance.totalConnections += 1;
        break;
    }

    // Recalculate rates
    if (updatedPerformance.totalSent > 0) {
      updatedPerformance.responseRate = (updatedPerformance.totalResponses / updatedPerformance.totalSent) * 100;
      updatedPerformance.connectionRate = (updatedPerformance.totalConnections / updatedPerformance.totalSent) * 100;
    }

    const updatedTemplate: MessageTemplate = {
      ...template,
      performance: updatedPerformance,
      updatedAt: now,
    };

    templates[templateIndex] = updatedTemplate;
    this.db.writeSync(this.dataFile, { ...data, templates, templateUsage: usage });

    return updatedTemplate;
  }

  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  private calculateDailyUsage(usage: TemplateUsageTracking[]): any {
    const dailyUsage: { [key: string]: number } = {};
    
    usage.forEach(u => {
      const date = new Date(u.timestamp).toISOString().split('T')[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    return dailyUsage;
  }
}