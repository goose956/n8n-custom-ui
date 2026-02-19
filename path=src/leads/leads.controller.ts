import { Controller, Get, Post, Put, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/leads.dto';

@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getLeads(@Query() query: LeadQueryDto) {
    try {
      return await this.leadsService.getLeads(query);
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
  async createLead(@Body() createLeadDto: CreateLeadDto) {
    try {
      return await this.leadsService.createLead(createLeadDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create lead',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateLead(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
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
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/engagement')
  async updateEngagementStatus(
    @Param('id') id: string,
    @Body() body: { engagementStatus: string; notes?: string },
  ) {
    try {
      const updatedLead = await this.leadsService.updateEngagementStatus(
        id,
        body.engagementStatus,
        body.notes,
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
        'Failed to update engagement status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}