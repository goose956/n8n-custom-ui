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
} from '@nestjs/common';
import { OptInPagesService } from './opt-in-pages.service';
import {
  CreateOptInPageDto,
  UpdateOptInPageDto,
  OptInPageResponseDto,
  ABTestDto,
  EmailIntegrationDto,
} from './dto/opt-in-pages.dto';

@Controller('api/members/opt-in-pages')
export class OptInPagesController {
  constructor(private readonly optInPagesService: OptInPagesService) {}

  @Get()
  async getAllOptInPages(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('campaign') campaign?: string,
  ): Promise<{
    data: OptInPageResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      return await this.optInPagesService.getAllOptInPages({
        page: Number(page),
        limit: Number(limit),
        status,
        campaign,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve opt-in pages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getOptInPageById(@Param('id') id: string): Promise<OptInPageResponseDto> {
    try {
      const optInPage = await this.optInPagesService.getOptInPageById(id);
      if (!optInPage) {
        throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
      }
      return optInPage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve opt-in page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createOptInPage(
    @Body() createOptInPageDto: CreateOptInPageDto,
  ): Promise<OptInPageResponseDto> {
    try {
      return await this.optInPagesService.createOptInPage(createOptInPageDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create opt-in page',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateOptInPage(
    @Param('id') id: string,
    @Body() updateOptInPageDto: UpdateOptInPageDto,
  ): Promise<OptInPageResponseDto> {
    try {
      const updatedPage = await this.optInPagesService.updateOptInPage(
        id,
        updateOptInPageDto,
      );
      if (!updatedPage) {
        throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
      }
      return updatedPage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update opt-in page',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteOptInPage(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const deleted = await this.optInPagesService.deleteOptInPage(id);
      if (!deleted) {
        throw new HttpException('Opt-in page not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Opt-in page deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete opt-in page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/ab-test')
  async createABTest(
    @Param('id') id: string,
    @Body() abTestDto: ABTestDto,
  ): Promise<OptInPageResponseDto> {
    try {
      return await this.optInPagesService.createABTest(id, abTestDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create A/B test',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/ab-test/:testId')
  async updateABTest(
    @Param('id') id: string,
    @Param('testId') testId: string,
    @Body() abTestDto: Partial<ABTestDto>,
  ): Promise<OptInPageResponseDto> {
    try {
      return await this.optInPagesService.updateABTest(id, testId, abTestDto);
    } catch (error) {
      throw new HttpException(
        'Failed to update A/B test',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/analytics')
  async getOptInPageAnalytics(@Param('id') id: string): Promise<any> {
    try {
      return await this.optInPagesService.getOptInPageAnalytics(id);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/email-integration')
  async setupEmailIntegration(
    @Param('id') id: string,
    @Body() emailIntegrationDto: EmailIntegrationDto,
  ): Promise<OptInPageResponseDto> {
    try {
      return await this.optInPagesService.setupEmailIntegration(
        id,
        emailIntegrationDto,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to setup email integration',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/test-email')
  async testEmailIntegration(
    @Param('id') id: string,
    @Body() testData: { email: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.optInPagesService.testEmailIntegration(id, testData.email);
    } catch (error) {
      throw new HttpException(
        'Failed to test email integration',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
