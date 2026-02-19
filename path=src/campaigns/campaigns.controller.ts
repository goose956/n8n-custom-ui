import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaigns.dto';

@Controller('api/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllCampaigns(@Query() query: CampaignQueryDto) {
    try {
      return await this.campaignsService.getAllCampaigns(query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve campaigns',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string) {
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
        'Failed to retrieve campaign',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/metrics')
  async getCampaignMetrics(@Param('id') id: string) {
    try {
      const metrics = await this.campaignsService.getCampaignMetrics(id);
      if (!metrics) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return metrics;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve campaign metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto) {
    try {
      return await this.campaignsService.createCampaign(createCampaignDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create campaign',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
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
        'Failed to update campaign',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteCampaign(@Param('id') id: string) {
    try {
      const result = await this.campaignsService.deleteCampaign(id);
      if (!result) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Campaign deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete campaign',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/sync')
  async syncCampaignMetrics(@Param('id') id: string) {
    try {
      const metrics = await this.campaignsService.syncCampaignWithLinkedIn(id);
      if (!metrics) {
        throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      }
      return metrics;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to sync campaign metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}