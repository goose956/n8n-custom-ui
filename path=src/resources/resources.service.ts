import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateResourceDto, UpdateResourceDto, ResourceQueryDto } from './dto/resources.dto';
import { v4 as uuidv4 } from 'uuid';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'book' | 'tutorial' | 'documentation' | 'tool';
  category: string;
  url: string;
  thumbnailUrl?: string;
  author?: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  rating?: number;
  reviews?: number;
  isFree: boolean;
  price?: number;
  language: string;
  lastUpdated: Date;
  createdAt: Date;
  isActive: boolean;
  completionRate?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
  externalMetadata?: any;
}

interface ResourcesDatabase {
  resources: LearningResource[];
  metadata: {
    totalResources: number;
    lastUpdated: Date;
    categories: string[];
    tags: string[];
  };
}

@Injectable()
export class ResourcesService {
  private readonly dbFile = 'learning-resources.json';

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  private async getDatabase(): Promise<ResourcesDatabase> {
    try {
      const data = await this.db.readSync(this.dbFile);
      return data || {
        resources: [],
        metadata: {
          totalResources: 0,
          lastUpdated: new Date(),
          categories: [],
          tags: [],
        },
      };
    } catch (error) {
      return {
        resources: [],
        metadata: {
          totalResources: 0,
          lastUpdated: new Date(),
          categories: [],
          tags: [],
        },
      };
    }
  }

  private async saveDatabase(data: ResourcesDatabase): Promise<void> {
    data.metadata.lastUpdated = new Date();
    data.metadata.totalResources = data.resources.length;
    
    // Update categories and tags
    const categories = new Set<string>();
    const tags = new Set<string>();
    
    data.resources.forEach(resource => {
      categories.add(resource.category);
      resource.tags.forEach(tag => tags.add(tag));
    });
    
    data.metadata.categories = Array.from(categories);
    data.metadata.tags = Array.from(tags);
    
    await this.db.writeSync(this.dbFile, data);
  }

  async getAllResources(query: ResourceQueryDto): Promise<{
    resources: LearningResource[];
    total: number;
    page: number;
    limit: number;
    categories: string[];
    tags: string[];
  }> {
    const database = await this.getDatabase();
    let resources = database.resources.filter(resource => resource.isActive);

    // Apply filters
    if (query.category) {
      resources = resources.filter(resource => 
        resource.category.toLowerCase() === query.category.toLowerCase()
      );
    }

    if (query.type) {
      resources = resources.filter(resource => resource.type === query.type);
    }

    if (query.difficulty) {
      resources = resources.filter(resource => resource.difficulty === query.difficulty);
    }

    if (query.isFree !== undefined) {
      resources = resources.filter(resource => resource.isFree === query.isFree);
    }

    if (query.language) {
      resources = resources.filter(resource => 
        resource.language.toLowerCase() === query.language.toLowerCase()
      );
    }

    if (query.tags) {
      const searchTags = Array.isArray(query.tags) ? query.tags : [query.tags];
      resources = resources.filter(resource =>
        searchTags.some(tag => 
          resource.tags.some(resourceTag => 
            resourceTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      resources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        resource.author?.toLowerCase().includes(searchTerm) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (query.sortBy) {
      resources.sort((a, b) => {
        let aValue, bValue;
        
        switch (query.sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'rating':
            aValue = a.rating || 0;
            bValue = b.rating || 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'lastUpdated':
            aValue = new Date(a.lastUpdated).getTime();
            bValue = new Date(b.lastUpdated).getTime();
            break;
          default:
            return 0;
        }

        if (query.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        }
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedResources = resources.slice(startIndex, startIndex + limit);

    return {
      resources: paginatedResources,
      total: resources.length,
      page,
      limit,
      categories: database.metadata.categories,
      tags: database.metadata.tags,
    };
  }

  async getResourceById(id: string): Promise<LearningResource | null> {
    const database = await this.getDatabase();
    return database.resources.find(resource => resource.id === id && resource.isActive) || null;
  }

  async createResource(createResourceDto: CreateResourceDto): Promise<LearningResource> {
    const database = await this.getDatabase();
    
    // Check for duplicate URLs
    const existingResource = database.resources.find(
      resource => resource.url === createResourceDto.url && resource.isActive
    );
    
    if (existingResource) {
      throw new Error('Resource with this URL already exists');
    }

    const newResource: LearningResource = {
      id: uuidv4(),
      ...createResourceDto,
      createdAt: new Date(),
      lastUpdated: new Date(),
      isActive: true,
      tags: createResourceDto.tags || [],
      rating: createResourceDto.rating || 0,
      reviews: createResourceDto.reviews || 0,
      language: createResourceDto.language || 'en',
    };

    // Fetch external metadata if URL is provided
    if (newResource.url && !newResource.thumbnailUrl) {
      try {
        const metadata = await this.fetchResourceMetadata(newResource.url);
        newResource.externalMetadata = metadata;
        if (metadata.thumbnail) {
          newResource.thumbnailUrl = metadata.thumbnail;
        }
      } catch (error) {
        // Continue without external metadata if fetch fails
        console.warn('Failed to fetch external metadata:', error.message);
      }
    }

    database.resources.push(newResource);
    await this.saveDatabase(database);
    
    return newResource;
  }

  async updateResource(id: string, updateResourceDto: UpdateResourceDto): Promise<LearningResource | null> {
    const database = await this.getDatabase();
    const resourceIndex = database.resources.findIndex(
      resource => resource.id === id && resource.isActive
    );

    if (resourceIndex === -1) {
      return null;
    }

    const existingResource = database.resources[resourceIndex];
    
    // Check for duplicate URLs if URL is being updated
    if (updateResourceDto.url && updateResourceDto.url !== existingResource.url) {
      const duplicateResource = database.resources.find(
        resource => resource.url === updateResourceDto.url && resource.isActive && resource.id !== id
      );
      
      if (duplicateResource) {
        throw new Error('Resource with this URL already exists');
      }
    }

    const updatedResource: LearningResource = {
      ...existingResource,
      ...updateResourceDto,
      id,
      lastUpdated: new Date(),
      tags: updateResourceDto.tags || existingResource.tags,
    };

    database.resources[resourceIndex] = updatedResource;
    await this.saveDatabase(database);
    
    return updatedResource;
  }

  async deleteResource(id: string): Promise<boolean> {
    const database = await this.getDatabase();
    const resourceIndex = database.resources.findIndex(
      resource => resource.id === id && resource.isActive
    );

    if (resourceIndex === -1) {
      return false;
    }

    // Soft delete - mark as inactive
    database.resources[resourceIndex].isActive = false;
    database.resources[resourceIndex].lastUpdated = new Date();
    
    await this.saveDatabase(database);
    return true;
  }

  async createBulkResources(resources: CreateResourceDto[]): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    const createdResources: LearningResource[] = [];
    const existingUrls = new Set(
      database.resources
        .filter(r => r.isActive)
        .map(r => r.url)
    );

    for (const resourceDto of resources) {
      if (existingUrls.has(resourceDto.url)) {
        continue; // Skip duplicates
      }

      const newResource: LearningResource = {
        id: uuidv4(),
        ...resourceDto,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: true,
        tags: resourceDto.tags || [],
        rating: resourceDto.rating || 0,
        reviews: resourceDto.reviews || 0,
        language: resourceDto.language || 'en',
      };

      database.resources.push(newResource);
      createdResources.push(newResource);
      existingUrls.add(newResource.url);
    }

    await this.saveDatabase(database);
    return createdResources;
  }

  async getResourcesByCategory(category: string): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    return database.resources.filter(
      resource => 
        resource.isActive && 
        resource.category.toLowerCase() === category.toLowerCase()
    );
  }

  async searchResources(searchTerm: string): Promise<LearningResource[]> {
    const database = await this.getDatabase();
    const term = searchTerm.toLowerCase();
    
    return database.resources.filter(resource =>
      resource.isActive && (
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term) ||
        resource.author?.toLowerCase().includes(term) ||
        resource.category.toLowerCase().includes(term) ||
        resource.tags.some(tag => tag.toLowerCase().includes(term))
      )
    );
  }

  private async fetchResourceMetadata(url: string): Promise<any> {
    try {
      // Use crypto service to get API key for external services if needed
      const apiKey = await this.crypto.getApiKey('METADATA_SERVICE');
      
      // This would typically call an external metadata service
      // For now, return a placeholder structure
      return {
        title: null,
        description: null,
        thumbnail: null,
        domain: new URL(url).hostname,
        fetchedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
  }

  async getResourceStats(): Promise<{
    totalResources: number;
    resourcesByCategory: Record<string, number>;
    resourcesByType: Record<string, number>;
    resourcesByDifficulty: Record<string, number>;
    freeResources: number;
    paidResources: number;
    averageRating: number;
  }> {
    const database = await this.getDatabase();
    const activeResources = database.resources.filter(r => r.isActive);

    const stats = {
      totalResources: activeResources.length,
      resourcesByCategory: {} as Record<string, number>,
      resourcesByType: {} as Record<string, number>,
      resourcesByDifficulty: {} as Record<string, number>,
      freeResources: 0,
      paidResources: 0,
      averageRating: 0,
    };

    let totalRating = 0;
    let ratedResourcesCount = 0;

    activeResources.forEach(resource => {
      // Count by category
      stats.resourcesByCategory[resource.category] = 
        (stats.resourcesByCategory[resource.category] || 0) + 1;

      // Count by type
      stats.resourcesByType[resource.type] = 
        (stats.resourcesByType[resource.type] || 0) + 1;

      // Count by difficulty
      stats.resourcesByDifficulty[resource.difficulty] = 
        (stats.resourcesByDifficulty[resource.difficulty] || 0) + 1;

      // Count free vs paid
      if (resource.isFree) {
        stats.freeResources++;
      } else {
        stats.paidResources++;
      }

      // Calculate average rating
      if (resource.rating && resource.rating > 0) {
        totalRating += resource.rating;
        ratedResourcesCount++;
      }
    });

    stats.averageRating = ratedResourcesCount > 0 ? totalRating / ratedResourcesCount : 0;

    return stats;
  }
}