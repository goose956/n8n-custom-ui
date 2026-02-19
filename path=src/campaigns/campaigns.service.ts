import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  Campaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
  CampaignStatus,
  CampaignType,
} from './dto/campaigns.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  private readonly campaignsCollection = 'campaigns';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getAllCampaigns(filters: {
    status?: string;
    limit: number;
    offset: number;
  }): Promise<{
    campaigns: CampaignResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const data = this.db.readSync();
      let campaigns: Campaign[] = data[this.campaignsCollection] || [];

      // Apply status filter
      if (filters.status) {
        campaigns = campaigns.filter(
          (campaign) => campaign.status === filters.status,
        );
      }

      // Sort by creation date (newest first)
      campaigns.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const total = campaigns.length;
      const paginatedCampaigns = campaigns.slice(
        filters.offset,
        filters.offset + filters.limit,
      );

      return {
        campaigns: paginatedCampaigns.map(this.mapToResponseDto),
        total,
        limit: filters.limit,
        offset: filters.offset,
      };
    } catch (error) {
      this.logger.error('Failed to fetch campaigns', error);
      throw error;
    }
  }

  async getCampaignById(id: string): Promise<CampaignResponseDto | null> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const campaign = campaigns.find((c) => c.id === id);

      return campaign ? this.mapToResponseDto(campaign) : null;
    } catch (error) {
      this.logger.error(`Failed to fetch campaign with id ${id}`, error);
      throw error;
    }
  }

  async createCampaign(
    createCampaignDto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    try {
      const now = new Date().toISOString();
      const campaign: Campaign = {
        id: uuidv4(),
        name: createCampaignDto.name,
        description: createCampaignDto.description || '',
        type: createCampaignDto.type,
        status: CampaignStatus.DRAFT,
        targetAudience: createCampaignDto.targetAudience || {},
        messageSequence: createCampaignDto.messageSequence || [],
        settings: {
          dailyLimit: createCampaignDto.settings?.dailyLimit || 50,
          delayBetweenActions: createCampaignDto.settings?.delayBetweenActions || 30,
          workingHours: createCampaignDto.settings?.workingHours || {
            start: '09:00',
            end: '17:00',
            timezone: 'UTC',
          },
          weekends: createCampaignDto.settings?.weekends || false,
          ...createCampaignDto.settings,
        },
        statistics: {
          totalSent: 0,
          totalReplies: 0,
          totalConnections: 0,
          totalViews: 0,
          conversionRate: 0,
        },
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        completedAt: null,
      };

      const data = this.db.readSync();
      if (!data[this.campaignsCollection]) {
        data[this.campaignsCollection] = [];
      }
      data[this.campaignsCollection].push(campaign);
      this.db.writeSync(data);

      this.logger.log(`Created campaign: ${campaign.name} (${campaign.id})`);
      return this.mapToResponseDto(campaign);
    } catch (error) {
      this.logger.error('Failed to create campaign', error);
      throw error;
    }
  }

  async updateCampaign(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto | null> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const campaignIndex = campaigns.findIndex((c) => c.id === id);

      if (campaignIndex === -1) {
        return null;
      }

      const existingCampaign = campaigns[campaignIndex];
      const updatedCampaign: Campaign = {
        ...existingCampaign,
        ...updateCampaignDto,
        id: existingCampaign.id, // Ensure ID cannot be changed
        createdAt: existingCampaign.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString(),
        settings: {
          ...existingCampaign.settings,
          ...updateCampaignDto.settings,
        },
        statistics: existingCampaign.statistics, // Preserve statistics unless explicitly updating
      };

      campaigns[campaignIndex] = updatedCampaign;
      this.db.writeSync(data);

      this.logger.log(`Updated campaign: ${updatedCampaign.name} (${id})`);
      return this.mapToResponseDto(updatedCampaign);
    } catch (error) {
      this.logger.error(`Failed to update campaign with id ${id}`, error);
      throw error;
    }
  }

  async deleteCampaign(id: string): Promise<boolean> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const initialLength = campaigns.length;
      const filteredCampaigns = campaigns.filter((c) => c.id !== id);

      if (filteredCampaigns.length === initialLength) {
        return false; // Campaign not found
      }

      data[this.campaignsCollection] = filteredCampaigns;
      this.db.writeSync(data);

      this.logger.log(`Deleted campaign with id: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete campaign with id ${id}`, error);
      throw error;
    }
  }

  async startCampaign(id: string): Promise<CampaignResponseDto | null> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const campaignIndex = campaigns.findIndex((c) => c.id === id);

      if (campaignIndex === -1) {
        return null;
      }

      const campaign = campaigns[campaignIndex];
      
      // Validate campaign can be started
      if (campaign.status === CampaignStatus.ACTIVE) {
        throw new Error('Campaign is already active');
      }

      if (!campaign.messageSequence || campaign.messageSequence.length === 0) {
        throw new Error('Campaign must have at least one message to start');
      }

      campaign.status = CampaignStatus.ACTIVE;
      campaign.startedAt = new Date().toISOString();
      campaign.updatedAt = new Date().toISOString();

      this.db.writeSync(data);

      // Here you would integrate with LinkedIn automation service
      await this.initializeLinkedInAutomation(campaign);

      this.logger.log(`Started campaign: ${campaign.name} (${id})`);
      return this.mapToResponseDto(campaign);
    } catch (error) {
      this.logger.error(`Failed to start campaign with id ${id}`, error);
      throw error;
    }
  }

  async pauseCampaign(id: string): Promise<CampaignResponseDto | null> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const campaignIndex = campaigns.findIndex((c) => c.id === id);

      if (campaignIndex === -1) {
        return null;
      }

      const campaign = campaigns[campaignIndex];
      
      if (campaign.status !== CampaignStatus.ACTIVE) {
        throw new Error('Only active campaigns can be paused');
      }

      campaign.status = CampaignStatus.PAUSED;
      campaign.updatedAt = new Date().toISOString();

      this.db.writeSync(data);

      this.logger.log(`Paused campaign: ${campaign.name} (${id})`);
      return this.mapToResponseDto(campaign);
    } catch (error) {
      this.logger.error(`Failed to pause campaign with id ${id}`, error);
      throw error;
    }
  }

  async stopCampaign(id: string): Promise<CampaignResponseDto | null> {
    try {
      const data = this.db.readSync();
      const campaigns: Campaign[] = data[this.campaignsCollection] || [];
      const campaignIndex = campaigns.findIndex((c) => c.id === id);

      if (campaignIndex === -1) {
        return null;
      }

      const campaign = campaigns[campaignIndex];
      
      if (![CampaignStatus.ACTIVE, CampaignStatus.PAUSED].includes(campaign.status)) {
        throw new Error('Only active or paused campaigns can be stopped');
      }

      campaign.status = CampaignStatus.COMPLETED;
      campaign.completedAt = new Date().toISOString();
      campaign.updatedAt = new Date().toISOString();

      this.db.writeSync(data);

      this.logger.log(`Stopped campaign: ${campaign.name} (${id})`);
      return this.mapToResponseDto(campaign);
    } catch (error) {
      this.logger.error(`Failed to stop campaign with id ${id}`, error);
      throw error;
    }
  }

  private async initializeLinkedInAutomation(campaign: Campaign): Promise<void> {
    try {
      // Get LinkedIn API credentials
      const apiKey = await this.cryptoService.getApiKey('linkedin');
      
      // Here you would implement the LinkedIn automation initialization
      // This is where you'd connect to LinkedIn's API or your automation service
      this.logger.log(`Initializing LinkedIn automation for campaign: ${campaign.id}`);
      
      // Example: Send campaign data to LinkedIn automation service
      // await this.linkedInService.initializeCampaign(campaign, apiKey);
      
    } catch (error) {
      this.logger.error(`Failed to initialize LinkedIn automation for campaign ${campaign.id}`, error);
      throw error;
    }
  }

  private mapToResponseDto(campaign: Campaign): CampaignResponseDto {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      messageSequence: campaign.messageSequence,
      settings: campaign.settings,
      statistics: campaign.statistics,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    };
  }
}