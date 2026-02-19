import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/templates.dto';
import { v4 as uuidv4 } from 'uuid';

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  category?: string;
}

interface TemplatesDatabase {
  templates: MessageTemplate[];
}

@Injectable()
export class TemplatesService {
  private readonly fileName = 'templates.json';

  constructor(private readonly db: DatabaseService) {}

  private getDatabase(): TemplatesDatabase {
    const data = this.db.readSync(this.fileName);
    return data || { templates: [] };
  }

  private saveDatabase(data: TemplatesDatabase): void {
    this.db.writeSync(this.fileName, data);
  }

  async findAll(): Promise<MessageTemplate[]> {
    const database = this.getDatabase();
    return database.templates.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async findById(id: string): Promise<MessageTemplate | null> {
    const database = this.getDatabase();
    const template = database.templates.find(t => t.id === id);
    return template || null;
  }

  async findByType(type: string): Promise<MessageTemplate[]> {
    const database = this.getDatabase();
    return database.templates.filter(t => t.type === type && t.isActive);
  }

  async findByCategory(category: string): Promise<MessageTemplate[]> {
    const database = this.getDatabase();
    return database.templates.filter(t => t.category === category && t.isActive);
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<MessageTemplate> {
    const database = this.getDatabase();
    
    // Extract variables from content using {{variable}} pattern
    const variables = this.extractVariables(createTemplateDto.content);
    
    const newTemplate: MessageTemplate = {
      id: uuidv4(),
      name: createTemplateDto.name,
      subject: createTemplateDto.subject || '',
      content: createTemplateDto.content,
      type: createTemplateDto.type,
      variables,
      isActive: createTemplateDto.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: createTemplateDto.createdBy,
      tags: createTemplateDto.tags || [],
      category: createTemplateDto.category,
    };

    database.templates.push(newTemplate);
    this.saveDatabase(database);
    
    return newTemplate;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<MessageTemplate | null> {
    const database = this.getDatabase();
    const templateIndex = database.templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return null;
    }

    const existingTemplate = database.templates[templateIndex];
    
    // Extract variables from updated content if content is being updated
    const variables = updateTemplateDto.content 
      ? this.extractVariables(updateTemplateDto.content)
      : existingTemplate.variables;

    const updatedTemplate: MessageTemplate = {
      ...existingTemplate,
      ...updateTemplateDto,
      variables,
      updatedAt: new Date().toISOString(),
    };

    database.templates[templateIndex] = updatedTemplate;
    this.saveDatabase(database);
    
    return updatedTemplate;
  }

  async delete(id: string): Promise<boolean> {
    const database = this.getDatabase();
    const templateIndex = database.templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return false;
    }

    database.templates.splice(templateIndex, 1);
    this.saveDatabase(database);
    
    return true;
  }

  async duplicate(id: string): Promise<MessageTemplate | null> {
    const template = await this.findById(id);
    if (!template) {
      return null;
    }

    const duplicatedTemplate: CreateTemplateDto = {
      name: `${template.name} (Copy)`,
      subject: template.subject,
      content: template.content,
      type: template.type,
      isActive: false, // Set as inactive by default
      createdBy: template.createdBy,
      tags: template.tags,
      category: template.category,
    };

    return this.create(duplicatedTemplate);
  }

  async toggleActive(id: string): Promise<MessageTemplate | null> {
    const database = this.getDatabase();
    const template = database.templates.find(t => t.id === id);
    
    if (!template) {
      return null;
    }

    template.isActive = !template.isActive;
    template.updatedAt = new Date().toISOString();
    
    this.saveDatabase(database);
    return template;
  }

  private extractVariables(content: string): string[] {
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

  async searchTemplates(query: string): Promise<MessageTemplate[]> {
    const database = this.getDatabase();
    const searchTerm = query.toLowerCase();
    
    return database.templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.content.toLowerCase().includes(searchTerm) ||
      template.subject.toLowerCase().includes(searchTerm) ||
      template.category?.toLowerCase().includes(searchTerm) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  async getTemplatesByTag(tag: string): Promise<MessageTemplate[]> {
    const database = this.getDatabase();
    return database.templates.filter(template => 
      template.tags?.includes(tag) && template.isActive
    );
  }

  async getAllTags(): Promise<string[]> {
    const database = this.getDatabase();
    const allTags = database.templates
      .flatMap(template => template.tags || [])
      .filter((tag, index, array) => array.indexOf(tag) === index);
    
    return allTags.sort();
  }

  async getAllCategories(): Promise<string[]> {
    const database = this.getDatabase();
    const categories = database.templates
      .map(template => template.category)
      .filter((category, index, array) => 
        category && array.indexOf(category) === index
      ) as string[];
    
    return categories.sort();
  }
}