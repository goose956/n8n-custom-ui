import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaigns.dto';
import { v4 as uuidv4 } from 'uuid';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: {
    jobTitles: string[];
    industries: string[];
    locations: string[];
    companySize?: string;
  };
  messageTemplate: string;
  linkedInCampaignId?: string;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  connected: number;
  clickThrough: number;
  conversionRate: number;
  responseRate: number;
  connectionRate: number;
  lastSyncAt?: Date;
}

interface DatabaseData {
  campaigns: Campaign[];
}

@Injectable()
export class CampaignsService {
  private readonly collectionName = 'campaigns';

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  private getDefaultMetrics(): CampaignMetrics {
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      replied: 0,
      connected: 0,
      clickThrough: 0,
      conversionRate: 0,
      responseRate: 0,
      connectionRate: 0,
    };
  }

  private ensureDatabase(): DatabaseData {
    const data = this.db.readSync();
    if (!data.campaigns) {
      data.campaigns = [];
      this.db.writeSync(data);
    }
    return data;
  }

  async getAllCampaigns(query: CampaignQueryDto) {
    const data = this.ensureDatabase();
    let campaigns = [...data.campaigns];

    // Apply filters
    if (query.status) {
      campaigns = campaigns.filter(campaign => campaign.status === query.status);
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      campaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm) ||
        (campaign.description && campaign.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (query.sortBy) {
      campaigns.sort((a, b) => {
        const aValue = a[query.sortBy];
        const bValue = b[query.sortBy];
        
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

    const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

    return {
      data: paginatedCampaigns,
      meta: {
        total: campaigns.length,
        page,
        limit,
        totalPages: Math.ceil(campaigns.length / limit),
      },
    };
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    const data = this.ensureDatabase();
    return data.campaigns.find(campaign => campaign.id === id) || null;
  }

  async getCampaignMetrics(id: string): Promise<CampaignMetrics | null> {
    const campaign = await this.getCampaignById(id);
    return campaign ? campaign.metrics : null;
  }

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const data = this.ensureDatabase();

    // Validate required fields
    if (!createCampaignDto.name || !createCampaignDto.messageTemplate) {
      throw new HttpException(
        'Name and message template are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for duplicate name
    const existingCampaign = data.campaigns.find(
      campaign => campaign.name.toLowerCase() === createCampaignDto.name.toLowerCase()
    );

    if (existingCampaign) {
      throw new HttpException(
        'Campaign with this name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const newCampaign: Campaign = {
      id: uuidv4(),
      name: createCampaignDto.name,
      description: createCampaignDto.description,
      status: createCampaignDto.status || 'draft',
      targetAudience: createCampaignDto.targetAudience,
      messageTemplate: createCampaignDto.messageTemplate,
      budget: createCampaignDto.budget,
      startDate: createCampaignDto.startDate ? new Date(createCampaignDto.startDate) : new Date(),
      endDate: createCampaignDto.endDate ? new Date(createCampaignDto.endDate) : undefined,
      metrics: this.getDefaultMetrics(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.campaigns.push(newCampaign);
    this.db.writeSync(data);

    return newCampaign;
  }

  async updateCampaign(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign | null> {
    const data = this.ensureDatabase();
    const campaignIndex = data.campaigns.findIndex(campaign => campaign.id === id);

    if (campaignIndex === -1) {
      return null;
    }

    // Check for duplicate name (excluding current campaign)
    if (updateCampaignDto.name) {
      const existingCampaign = data.campaigns.find(
        (campaign, index) =>
          index !== campaignIndex &&
          campaign.name.toLowerCase() === updateCampaignDto.name.toLowerCase()
      );

      if (existingCampaign) {
        throw new HttpException(
          'Campaign with this name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    const existingCampaign = data.campaigns[campaignIndex];
    const updatedCampaign: Campaign = {
      ...existingCampaign,
      ...updateCampaignDto,
      id: existingCampaign.id, // Ensure ID doesn't change
      metrics: existingCampaign.metrics, // Preserve metrics
      createdAt: existingCampaign.createdAt, // Preserve creation date
      updatedAt: new Date(),
      startDate: updateCampaignDto.startDate
        ? new Date(updateCampaignDto.startDate)
        : existingCampaign.startDate,
      endDate: updateCampaignDto.endDate
        ? new Date(updateCampaignDto.endDate)
        : existingCampaign.endDate,
    };

    data.campaigns[campaignIndex] = updatedCampaign;
    this.db.writeSync(data);

    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const data = this.ensureDatabase();
    const campaignIndex = data.campaigns.findIndex(campaign => campaign.id === id);

    if (campaignIndex === -1) {
      return false;
    }

    data.campaigns.splice(campaignIndex, 1);
    this.db.writeSync(data);

    return true;
  }

  async syncCampaignWithLinkedIn(id: string): Promise<Campaign | null> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) {
      return null;
    }

    try {
      // Get LinkedIn API key
      const apiKey = this.crypto.getApiKey('linkedin');
      if (!apiKey) {
        throw new HttpException(
          'LinkedIn API key not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Simulate LinkedIn API call to get campaign metrics
      const linkedInMetrics = await this.fetchLinkedInCampaignMetrics(
        campaign.linkedInCampaignId || campaign.id,
        apiKey,
      );

      // Update campaign metrics
      const updatedMetrics: CampaignMetrics = {
        ...campaign.metrics,
        ...linkedInMetrics,
        responseRate: linkedInMetrics.sent > 0 
          ? (linkedInMetrics.replied / linkedInMetrics.sent) * 100 
          : 0,
        connectionRate: linkedInMetrics.sent > 0 
          ? (linkedInMetrics.connected / linkedInMetrics.sent) * 100 
          : 0,
        conversionRate: linkedInMetrics.opened > 0 
          ? (linkedInMetrics.replied / linkedInMetrics.opened) * 100 
          : 0,
        lastSyncAt: new Date(),
      };

      const data = this.ensureDatabase();
      const campaignIndex = data.campaigns.findIndex(c => c.id === id);
      
      if (campaignIndex !== -1) {
        data.campaigns[campaignIndex].metrics = updatedMetrics;
        data.campaigns[campaignIndex].updatedAt = new Date();
        this.db.writeSync(data);
        
        return data.campaigns[campaignIndex];
      }

      return null;
    } catch (error) {
      throw new HttpException(
        `Failed to sync with LinkedIn: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async fetchLinkedInCampaignMetrics(
    campaignId: string,
    apiKey: string,
  ): Promise<Partial<CampaignMetrics>> {
    // Simulate LinkedIn API call
    // In a real implementation, you would make HTTP requests to LinkedIn's API
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return simulated metrics based on campaign ID for consistency
    const baseMetrics = {
      sent: Math.floor(Math.random() * 1000) + 100,
      delivered: 0,
      opened: 0,
      replied: 0,
      connected: 0,
      clickThrough: 0,
    };

    baseMetrics.delivered = Math.floor(baseMetrics.sent * (0.85 + Math.random() * 0.1));
    baseMetrics.opened = Math.floor(baseMetrics.delivered * (0.3 + Math.random() * 0.2));
    baseMetrics.replied = Math.floor(baseMetrics.opened * (0.1 + Math.random() * 0.1));
    baseMetrics.connected = Math.floor(baseMetrics.sent * (0.15 + Math.random() * 0.1));
    baseMetrics.clickThrough = Math.floor(baseMetrics.opened * (0.05 + Math.random() * 0.05));

    return baseMetrics;
  }
}