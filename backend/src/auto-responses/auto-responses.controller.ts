import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { AutoResponsesService } from './auto-responses.service';
import {
  CreateAutoResponseDto,
  UpdateAutoResponseDto,
  AutoResponseQueryDto,
} from './dto/auto-responses.dto';

@Controller('api/auto-responses-api')
export class AutoResponsesController {
  constructor(private readonly autoResponsesService: AutoResponsesService) {}

  @Get()
  async getAllAutoResponses(@Query() query: AutoResponseQueryDto) {
    return this.autoResponsesService.getAllAutoResponses(query);
  }

  @Get('stats')
  async getAutoResponseStats(@Query('userId') userId?: string) {
    return this.autoResponsesService.getAutoResponseStats(userId);
  }

  @Get('metrics')
  async getConversionMetrics(
    @Query('templateId') templateId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.autoResponsesService.getConversionMetrics({
      templateId,
      userId,
      startDate,
      endDate,
    });
  }

  @Get('sent-responses')
  async getSentResponses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
    @Query('templateId') templateId?: string,
  ) {
    return this.autoResponsesService.getSentResponses({
      page: Number(page),
      limit: Number(limit),
      userId,
      templateId,
    });
  }

  @Get(':id')
  async getAutoResponseById(@Param('id') id: string) {
    const autoResponse = await this.autoResponsesService.getAutoResponseById(id);
    if (!autoResponse) {
      throw new NotFoundException('Auto response template not found');
    }
    return autoResponse;
  }

  @Post()
  async createAutoResponse(
    @Body(ValidationPipe) createAutoResponseDto: CreateAutoResponseDto,
  ) {
    return this.autoResponsesService.createAutoResponse(createAutoResponseDto);
  }

  @Post(':id/test')
  async testAutoResponse(
    @Param('id') id: string,
    @Body('testRecipient') testRecipient: string,
  ) {
    if (!testRecipient) {
      throw new BadRequestException('Test recipient is required');
    }
    return this.autoResponsesService.testAutoResponse(id, testRecipient);
  }

  @Post(':id/duplicate')
  async duplicateAutoResponse(@Param('id') id: string) {
    return this.autoResponsesService.duplicateAutoResponse(id);
  }

  @Put(':id')
  async updateAutoResponse(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAutoResponseDto: UpdateAutoResponseDto,
  ) {
    const updatedAutoResponse = await this.autoResponsesService.updateAutoResponse(
      id,
      updateAutoResponseDto,
    );
    if (!updatedAutoResponse) {
      throw new NotFoundException('Auto response template not found');
    }
    return updatedAutoResponse;
  }

  @Put(':id/status')
  async updateAutoResponseStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive',
  ) {
    if (!status || !['active', 'inactive'].includes(status)) {
      throw new BadRequestException('Valid status is required (active/inactive)');
    }
    return this.autoResponsesService.updateAutoResponseStatus(id, status);
  }

  @Delete(':id')
  async deleteAutoResponse(@Param('id') id: string) {
    const deleted = await this.autoResponsesService.deleteAutoResponse(id);
    if (!deleted) {
      throw new NotFoundException('Auto response template not found');
    }
    return { message: 'Auto response template deleted successfully' };
  }

  @Delete('sent-responses/:id')
  async deleteSentResponse(@Param('id') id: string) {
    const deleted = await this.autoResponsesService.deleteSentResponse(id);
    if (!deleted) {
      throw new NotFoundException('Sent response record not found');
    }
    return { message: 'Sent response record deleted successfully' };
  }
}