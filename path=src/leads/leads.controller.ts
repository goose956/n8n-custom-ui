import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/leads.dto';

@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getAllLeads(@Query() query: LeadQueryDto) {
    try {
      return await this.leadsService.getAllLeads(query);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch leads',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getLeadById(@Param('id') id: string) {
    try {
      const lead = await this.leadsService.getLeadById(id);
      if (!lead) {
        throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
      }
      return lead;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch lead',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createLead(@Body(ValidationPipe) createLeadDto: CreateLeadDto) {
    try {
      return await this.leadsService.createLead(createLeadDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create lead',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateLead(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLeadDto: UpdateLeadDto,
  ) {
    try {
      const updatedLead = await this.leadsService.updateLead(id, updateLeadDto);
      if (!updatedLead) {
        throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
      }
      return updatedLead;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update lead',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/sync-linkedin')
  async syncWithLinkedIn(@Param('id') id: string) {
    try {
      return await this.leadsService.syncWithLinkedIn(id);
    } catch (error) {
      throw new HttpException(
        'Failed to sync with LinkedIn',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: string; notes?: string },
  ) {
    try {
      const updatedLead = await this.leadsService.updateLeadStatus(
        id,
        statusDto.status,
        statusDto.notes,
      );
      if (!updatedLead) {
        throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
      }
      return updatedLead;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update lead status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}