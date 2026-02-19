import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CreateResourceDto, UpdateResourceDto, ResourceFilterDto } from './dto/resources.dto';
import { v4 as uuidv4 } from 'uuid';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'course' | 'tutorial' | 'template' | 'guide';
  url?: string;
  content?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  author: string;
  rating: number;
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  prerequisites?: string[];
  relatedResources?: string[];
}

interface ResourcesDatabase {
  resources: LearningResource[];
  categories: string[];
  lastUpdated: Date;
}

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
  private readonly dbFile = 'learning-resources.json';

  constructor(private readonly db: DatabaseService) {}

  private getDefaultDatabase(): ResourcesDatabase {
    return {
      resources: [],
      categories: [
        'LinkedIn Automation',
        'Lead Generation',
        'Sales Strategy',
        'Content Creation',
        'Profile Optimization',
        'Networking',
        'Analytics & Reporting',
        'API Integration',
        'Best Practices',
        'Compliance & Safety'
      ],
      lastUpdated: new Date(),
    };
  }

  private async getDatabase(): Promise<ResourcesDatabase> {
    try {
      const data = await this.db.readSync(this.dbFile);
      return data || this.getDefaultDatabase();
    } catch (error) {
      this.logger.warn(`Failed to read database, using default: ${error.message}`);
      return this.getDefaultDatabase();
    }
  }

  private async saveDatabase(data: ResourcesDatabase): Promise<void> {
    try {
      data.lastUpdated = new Date();
      await this.db.writeSync(this.dbFile, data);
    } catch (error) {
      this.logger.error(`Failed to save database: ${error.message}`);
      throw error;
    }
  }

  async getAllResources(filterDto: ResourceFilterDto = {}): Promise<{
    resources: LearningResource[];
    total: number;
    page: number;
    limit: number;
    categories: string[];
  }> {
    const database = await this.getDatabase();
    let resources = database.resources.filter(resource => resource.isActive);

    // Apply filters
    if (filterDto.category) {
      resources = resources.filter(r => 
        r.category.toLowerCase() === filterDto.category.toLowerCase()
      );
    }

    if (filterDto.type) {
      resources = resources.filter(r => r.type === filterDto.type);
    }

    if (filterDto.difficulty) {
      resources = resources.filter(r => r.difficulty === filterDto.difficulty);
    }

    if (filterDto.tags) {
      const searchTags = Array.isArray(filterDto.tags) ? filterDto.tags : [filterDto.tags];
      resources = resources.filter(r => 
        searchTags.some(tag => r.tags.includes(tag))
      );
    }

    if (filterDto.featured !== undefined) {
      resources = resources.filter(r => r.isFeatured === filterDto.featured);
    }

    if (filterDto.minRating) {
      resources = resources.filter(r => r.rating >= filterDto.minRating);
    }

    // Apply sorting
    if (filterDto.sortBy) {
      resources.sort((a, b) => {
        const order = filterDto.sortOrder === 'desc' ? -1 : 1;
        
        switch (filterDto.sortBy) {
          case 'title':
            return order * a.title.localeCompare(b.title);
          case 'createdAt':
            return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'rating':
            return order * (a.rating - b.rating);
          case 'viewCount':
            return order * (a.viewCount - b.viewCount);
          case 'difficulty':
            const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
            return order * (difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
          default:
            return 0;
        }
      });
    } else {
      // Default sort by featured first, then by rating
      resources.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.rating - a.rating;
      });
    }

    // Apply pagination
    const page = Math.max(1, filterDto.page || 1);
    const limit = Math.min(100, Math.max(1, filterDto.limit || 20));
    const startIndex = (page - 1) * limit;
    const paginatedResources = resources.slice(startIndex, startIndex + limit);

    return {
      resources: paginatedResources,
      total: resources.length,
      page,
      limit,
      categories: database.categories,
    };
  }

  async getResourceById(id: string): Promise<LearningResource | null> {
    const database = await this.getDatabase();
    const resource = database.resources.find(r => r.id === id && r.isActive);
    
    if (resource) {
      // Increment view count
      resource.viewCount += 1;
      await this.saveDatabase(database);
    }
    
    return resource || null;
  }

  async createResource(createResourceDto: CreateResourceDto): Promise<LearningResource> {
    const database = await this.getDatabase();
    
    const newResource: LearningResource = {
      id: uuidv4(),
      title: createResourceDto.title,
      description: createResourceDto.description,
      category: createResourceDto.category,
      type: createResourceDto.type,
      url: createResourceDto.url,
      content: createResourceDto.content,
      tags: createResourceDto.tags || [],
      difficulty: createResourceDto.difficulty,
      estimatedTime: createResourceDto.estimatedTime,
      author: createResourceDto.author,
      rating: 0,
      viewCount: 0,
      downloadCount: 0,
      isActive: true,
      isFeatured: createResourceDto.isFeatured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      prerequisites: createResourceDto.prerequisites || [],
      relatedResources: createResourceDto.relatedResources || [],
    };

    database.resources.push(newResource);
    
    // Add new category if it doesn't exist
    if (!database.categories.includes(createResourceDto.category)) {
      database.categories.push(createResourceDto.category);
    }
    
    await this.saveDatabase(database);
    
    this.logger.log(`Created new resource: ${newResource.title} (${newResource.id})`);
    return newResource;
  }

  async updateResource(id: string, updateResourceDto: UpdateResourceDto): Promise<LearningResource | null> {
    const database = await this.getDatabase();
    const resourceIndex = database.resources.findIndex(r => r.id === id);
    
    if (resourceIndex === -1) {
      return null;
    }

    const existingResource = database.resources[resourceIndex];
    const updatedResource: LearningResource = {
      ...existingResource,
      ...updateResourceDto,
      id: existingResource.id, // Ensure ID cannot be changed
      createdAt: existingResource.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    database.resources[resourceIndex] = updatedResource;
    
    // Add new category if it doesn't exist
    if (updateResourceDto.category && !database.categories.includes(updateResourceDto.category)) {
      database.categories.push(updateResourceDto.category);
    }
    
    await this.saveDatabase(database);
    
    this.logger.log(`Updated resource: ${updatedResource.title} (${updatedResource.id})`);
    return updatedResource;
  }

  async getResourcesByCategory(category: string): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    return database.resources
      .filter(r => r.isActive && r.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.rating - a.rating;
      });
  }

  async searchResources(searchTerm: string): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    const term = searchTerm.toLowerCase();
    
    return database.resources
      .filter(r => r.isActive && (
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.tags.some(tag => tag.toLowerCase().includes(term)) ||
        r.category.toLowerCase().includes(term) ||
        r.author.toLowerCase().includes(term)
      ))
      .sort((a, b) => {
        // Prioritize title matches
        const aTitle = a.title.toLowerCase().includes(term);
        const bTitle = b.title.toLowerCase().includes(term);
        
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        
        // Then by featured status
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        
        // Finally by rating
        return b.rating - a.rating;
      });
  }

  async incrementDownloadCount(id: string): Promise<boolean> {
    const database = await this.getDatabase();
    const resource = database.resources.find(r => r.id === id && r.isActive);
    
    if (resource) {
      resource.downloadCount += 1;
      await this.saveDatabase(database);
      return true;
    }
    
    return false;
  }

  async updateRating(id: string, rating: number): Promise<boolean> {
    if (rating < 0 || rating > 5) {
      return false;
    }
    
    const database = await this.getDatabase();
    const resource = database.resources.find(r => r.id === id && r.isActive);
    
    if (resource) {
      resource.rating = rating;
      await this.saveDatabase(database);
      return true;
    }
    
    return false;
  }

  async getPopularResources(limit: number = 10): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    
    return database.resources
      .filter(r => r.isActive)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  async getFeaturedResources(): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    
    return database.resources
      .filter(r => r.isActive && r.isFeatured)
      .sort((a, b) => b.rating - a.rating);
  }

  async getResourceStats(): Promise<{
    totalResources: number;
    totalViews: number;
    totalDownloads: number;
    averageRating: number;
    resourcesByCategory: Record<string, number>;
    resourcesByType: Record<string, number>;
  }> {
    const database = await this.getDatabase();
    const activeResources = database.resources.filter(r => r.isActive);
    
    const totalViews = activeResources.reduce((sum, r) => sum + r.viewCount, 0);
    const totalDownloads = activeResources.reduce((sum, r) => sum + r.downloadCount, 0);
    const totalRating = activeResources.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = activeResources.length > 0 ? totalRating / activeResources.length : 0;
    
    const resourcesByCategory = activeResources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const resourcesByType = activeResources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalResources: activeResources.length,
      totalViews,
      totalDownloads,
      averageRating: Math.round(averageRating * 100) / 100,
      resourcesByCategory,
      resourcesByType,
    };
  }
}