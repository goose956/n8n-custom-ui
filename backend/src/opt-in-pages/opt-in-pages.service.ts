import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import {
  CreateOptInPageDto,
  UpdateOptInPageDto,
  OptInPageResponseDto,
  ABTestDto,
  EmailIntegrationDto,
  OptInPage,
} from './dto/opt-in-pages.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OptInPagesService {
  private readonly collectionName = 'optInPages';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getAllOptInPages(filters: {
    page: number;
    limit: number;
    status?: string;
    campaign?: string;
  }): Promise<{
    data: OptInPageResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const data = this.db.readSync();
    let optInPages: OptInPage[] = data[this.collectionName] || [];

    // Apply filters
    if (filters.status) {
      optInPages = optInPages.filter(page => page.status === filters.status);
    }

    if (filters.campaign) {
      optInPages = optInPages.filter(page => 
        page.campaignName?.toLowerCase().includes(filters.campaign.toLowerCase())
      );
    }

    const total = optInPages.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedPages = optInPages.slice(startIndex, endIndex);

    return {
      data: paginatedPages.map(this.mapToResponseDto),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getOptInPageById(id: string): Promise<OptInPageResponseDto | null> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const optInPage = optInPages.find(page => page.id === id);

    if (!optInPage) {
      return null;
    }

    return this.mapToResponseDto(optInPage);
  }

  async createOptInPage(createDto: CreateOptInPageDto): Promise<OptInPageResponseDto> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];

    const newOptInPage: OptInPage = {
      id: uuidv4(),
      ...createDto,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analytics: {
        views: 0,
        conversions: 0,
        conversionRate: 0,
        uniqueVisitors: 0,
      },
      abTests: [],
    };

    optInPages.push(newOptInPage);
    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return this.mapToResponseDto(newOptInPage);
  }

  async updateOptInPage(
    id: string,
    updateDto: UpdateOptInPageDto,
  ): Promise<OptInPageResponseDto | null> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const pageIndex = optInPages.findIndex(page => page.id === id);

    if (pageIndex === -1) {
      return null;
    }

    const updatedPage = {
      ...optInPages[pageIndex],
      ...updateDto,
      updatedAt: new Date().toISOString(),
    };

    optInPages[pageIndex] = updatedPage;
    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return this.mapToResponseDto(updatedPage);
  }

  async deleteOptInPage(id: string): Promise<boolean> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const pageIndex = optInPages.findIndex(page => page.id === id);

    if (pageIndex === -1) {
      return false;
    }

    optInPages.splice(pageIndex, 1);
    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return true;
  }

  async createABTest(id: string, abTestDto: ABTestDto): Promise<OptInPageResponseDto> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const pageIndex = optInPages.findIndex(page => page.id === id);

    if (pageIndex === -1) {
      throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
    }

    const newABTest = {
      id: uuidv4(),
      ...abTestDto,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      results: {
        variantA: { views: 0, conversions: 0, conversionRate: 0 },
        variantB: { views: 0, conversions: 0, conversionRate: 0 },
      },
    };

    optInPages[pageIndex].abTests = optInPages[pageIndex].abTests || [];
    optInPages[pageIndex].abTests.push(newABTest);
    optInPages[pageIndex].updatedAt = new Date().toISOString();

    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return this.mapToResponseDto(optInPages[pageIndex]);
  }

  async updateABTest(
    pageId: string,
    testId: string,
    updateDto: Partial<ABTestDto>,
  ): Promise<OptInPageResponseDto> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const pageIndex = optInPages.findIndex(page => page.id === pageId);

    if (pageIndex === -1) {
      throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
    }

    const testIndex = optInPages[pageIndex].abTests.findIndex(test => test.id === testId);
    
    if (testIndex === -1) {
      throw new HttpException('A/B test not found', HttpStatus.NOT_FOUND);
    }

    optInPages[pageIndex].abTests[testIndex] = {
      ...optInPages[pageIndex].abTests[testIndex],
      ...updateDto,
    };
    optInPages[pageIndex].updatedAt = new Date().toISOString();

    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return this.mapToResponseDto(optInPages[pageIndex]);
  }

  async getOptInPageAnalytics(id: string): Promise<any> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const optInPage = optInPages.find(page => page.id === id);

    if (!optInPage) {
      throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
    }

    // Generate mock analytics data
    const analytics = {
      ...optInPage.analytics,
      dailyStats: this.generateDailyStats(30),
      topSources: [
        { source: 'Direct', visitors: 150, conversions: 25 },
        { source: 'Social Media', visitors: 120, conversions: 18 },
        { source: 'Email', visitors: 80, conversions: 15 },
        { source: 'Search', visitors: 60, conversions: 12 },
      ],
      deviceBreakdown: {
        desktop: 60,
        mobile: 35,
        tablet: 5,
      },
    };

    return analytics;
  }

  async setupEmailIntegration(
    id: string,
    emailIntegrationDto: EmailIntegrationDto,
  ): Promise<OptInPageResponseDto> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const pageIndex = optInPages.findIndex(page => page.id === id);

    if (pageIndex === -1) {
      throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
    }

    // Encrypt API key if provided
    if (emailIntegrationDto.apiKey) {
      const encryptedApiKey = await this.cryptoService.getApiKey(
        'email_integration',
        emailIntegrationDto.apiKey,
      );
      emailIntegrationDto.apiKey = encryptedApiKey;
    }

    optInPages[pageIndex].emailIntegration = {
      ...emailIntegrationDto,
      isActive: true,
      lastSync: new Date().toISOString(),
    };
    optInPages[pageIndex].updatedAt = new Date().toISOString();

    data[this.collectionName] = optInPages;
    this.db.writeSync(data);

    return this.mapToResponseDto(optInPages[pageIndex]);
  }

  async testEmailIntegration(
    id: string,
    testEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    const data = this.db.readSync();
    const optInPages: OptInPage[] = data[this.collectionName] || [];
    const optInPage = optInPages.find(page => page.id === id);

    if (!optInPage) {
      throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
    }

    if (!optInPage.emailIntegration) {
      throw new HttpException('No email integration configured', HttpStatus.BAD_REQUEST);
    }

    try {
      // Simulate email service integration test
      const success = await this.simulateEmailServiceTest(
        optInPage.emailIntegration,
        testEmail,
      );

      if (success) {
        return {
          success: true,
          message: 'Email integration test successful',
        };
      } else {
        return {
          success: false,
          message: 'Email integration test failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Email integration test failed: ${error.message}`,
      };
    }
  }

  private async simulateEmailServiceTest(
    integration: any,
    testEmail: string,
  ): Promise<boolean> {
    // Simulate API call to email service
    const delay = Math.random() * 1000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate 90% success rate
    return Math.random() > 0.1;
  }

  private generateDailyStats(days: number): any[] {
    const stats = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const views = Math.floor(Math.random() * 100) + 20;
      const conversions = Math.floor(views * (Math.random() * 0.1 + 0.02));

      stats.push({
        date: date.toISOString().split('T')[0],
        views,
        conversions,
        conversionRate: conversions / views,
      });
    }

    return stats;
  }

  private mapToResponseDto(optInPage: OptInPage): OptInPageResponseDto {
    const dto = { ...optInPage };

    // Remove sensitive information from email integration
    if (dto.emailIntegration?.apiKey) {
      dto.emailIntegration.apiKey = '***encrypted***';
    }

    return dto;
  }
}
