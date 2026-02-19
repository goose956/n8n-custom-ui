import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
} from './dto/campaigns.dto';

@Controller('api/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async getAllCampaigns(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{
    campaigns: CampaignResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const offsetNum = offset ? parseInt(offset) : 0;
      
      return await this.campaignsService.getAllCampaigns({
        status,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch campaigns: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string): Promise<CampaignResponseDto> {
    try {
      const campaign = await this.campaignsService.getCampaignById(id);
      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return campaign;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch campaign: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createCampaign(
    @Body() createCampaignDto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    try {
      return await this.campaignsService.createCampaign(createCampaignDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create campaign: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    try {
      const updatedCampaign = await this.campaignsService.updateCampaign(
        id,
        updateCampaignDto,
      );
      if (!updatedCampaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return updatedCampaign;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update campaign: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteCampaign(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const success = await this.campaignsService.deleteCampaign(id);
      if (!success) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Campaign deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete campaign: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/start')
  async startCampaign(@Param('id') id: string): Promise<CampaignResponseDto> {
    try {
      const campaign = await this.campaignsService.startCampaign(id);
      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return campaign;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to start campaign: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/pause')
  async pauseCampaign(@Param('id') id: string): Promise<CampaignResponseDto> {
    try {
      const campaign = await this.campaignsService.pauseCampaign(id);
      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return campaign;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to pause campaign: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/stop')
  async stopCampaign(@Param('id') id: string): Promise<CampaignResponseDto> {
    try {
      const campaign = await this.campaignsService.stopCampaign(id);
      if (!campaign) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return campaign;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to stop campaign: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}