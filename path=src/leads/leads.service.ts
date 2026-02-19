import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/leads.dto';

export interface Lead {
  id: string;
  linkedInId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  profileUrl?: string;
  connectionDegree?: string;
  engagementStatus: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'converted';
  lastContactDate?: string;
  notes?: string;
  tags: string[];
  leadSource: 'manual' | 'linkedin_search' | 'linkedin_import' | 'referral' | 'other';
  leadScore?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class LeadsService {
  private readonly collectionName = 'leads';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getLeads(query: LeadQueryDto): Promise<{ leads: Lead[]; total: number }> {
    const data = this.db.readSync();
    let leads: Lead[] = data[this.collectionName] || [];

    // Apply filters
    if (query.engagementStatus) {
      leads = leads.filter(lead => lead.engagementStatus === query.engagementStatus);
    }

    if (query.company) {
      leads = leads.filter(lead => 
        lead.company?.toLowerCase().includes(query.company.toLowerCase())
      );
    }

    if (query.jobTitle) {
      leads = leads.filter(lead => 
        lead.jobTitle?.toLowerCase().includes(query.jobTitle.toLowerCase())
      );
    }

    if (query.location) {
      leads = leads.filter(lead => 
        lead.location?.toLowerCase().includes(query.location.toLowerCase())
      );
    }

    if (query.leadSource) {
      leads = leads.filter(lead => lead.leadSource === query.leadSource);
    }

    if (query.tags) {
      const searchTags = query.tags.split(',').map(tag => tag.trim().toLowerCase());
      leads = leads.filter(lead => 
        searchTags.some(tag => 
          lead.tags.some(leadTag => leadTag.toLowerCase().includes(tag))
        )
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      leads = leads.filter(lead => 
        lead.fullName.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm) ||
        lead.jobTitle?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    leads.sort((a, b) => {
      let aValue = a[sortField as keyof Lead];
      let bValue = b[sortField as keyof Lead];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    const total = leads.length;

    // Apply pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    leads = leads.slice(startIndex, endIndex);

    return { leads, total };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    return leads.find(lead => lead.id === id) || null;
  }

  async createLead(createLeadDto: CreateLeadDto): Promise<Lead> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];

    // Check for duplicate LinkedIn profile or email
    if (createLeadDto.linkedInId) {
      const existingLead = leads.find(lead => lead.linkedInId === createLeadDto.linkedInId);
      if (existingLead) {
        throw new Error('Lead with this LinkedIn profile already exists');
      }
    }

    if (createLeadDto.email) {
      const existingLead = leads.find(lead => lead.email === createLeadDto.email);
      if (existingLead) {
        throw new Error('Lead with this email already exists');
      }
    }

    const newLead: Lead = {
      id: this.generateId(),
      linkedInId: createLeadDto.linkedInId,
      firstName: createLeadDto.firstName,
      lastName: createLeadDto.lastName,
      fullName: `${createLeadDto.firstName} ${createLeadDto.lastName}`,
      email: createLeadDto.email,
      company: createLeadDto.company,
      jobTitle: createLeadDto.jobTitle,
      location: createLeadDto.location,
      profileUrl: createLeadDto.profileUrl,
      connectionDegree: createLeadDto.connectionDegree,
      engagementStatus: createLeadDto.engagementStatus || 'new',
      lastContactDate: createLeadDto.lastContactDate,
      notes: createLeadDto.notes,
      tags: createLeadDto.tags || [],
      leadSource: createLeadDto.leadSource || 'manual',
      leadScore: createLeadDto.leadScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.push(newLead);
    data[this.collectionName] = leads;
    this.db.writeSync(data);

    return newLead;
  }

  async updateLead(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead | null> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    const leadIndex = leads.findIndex(lead => lead.id === id);

    if (leadIndex === -1) {
      return null;
    }

    // Check for duplicate LinkedIn profile or email (excluding current lead)
    if (updateLeadDto.linkedInId) {
      const existingLead = leads.find(lead => 
        lead.linkedInId === updateLeadDto.linkedInId && lead.id !== id
      );
      if (existingLead) {
        throw new Error('Lead with this LinkedIn profile already exists');
      }
    }

    if (updateLeadDto.email) {
      const existingLead = leads.find(lead => 
        lead.email === updateLeadDto.email && lead.id !== id
      );
      if (existingLead) {
        throw new Error('Lead with this email already exists');
      }
    }

    const updatedLead: Lead = {
      ...leads[leadIndex],
      ...updateLeadDto,
      fullName: updateLeadDto.firstName && updateLeadDto.lastName 
        ? `${updateLeadDto.firstName} ${updateLeadDto.lastName}`
        : leads[leadIndex].fullName,
      updatedAt: new Date().toISOString(),
    };

    leads[leadIndex] = updatedLead;
    data[this.collectionName] = leads;
    this.db.writeSync(data);

    return updatedLead;
  }

  async updateEngagementStatus(
    id: string,
    engagementStatus: string,
    notes?: string,
  ): Promise<Lead | null> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    const leadIndex = leads.findIndex(lead => lead.id === id);

    if (leadIndex === -1) {
      return null;
    }

    const updatedLead: Lead = {
      ...leads[leadIndex],
      engagementStatus: engagementStatus as Lead['engagementStatus'],
      lastContactDate: new Date().toISOString(),
      notes: notes || leads[leadIndex].notes,
      updatedAt: new Date().toISOString(),
    };

    leads[leadIndex] = updatedLead;
    data[this.collectionName] = leads;
    this.db.writeSync(data);

    return updatedLead;
  }

  async getLeadsByEngagementStatus(status: Lead['engagementStatus']): Promise<Lead[]> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    return leads.filter(lead => lead.engagementStatus === status);
  }

  async getLeadsByCompany(company: string): Promise<Lead[]> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    return leads.filter(lead => 
      lead.company?.toLowerCase().includes(company.toLowerCase())
    );
  }

  async searchLeads(searchTerm: string): Promise<Lead[]> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return leads.filter(lead => 
      lead.fullName.toLowerCase().includes(lowerSearchTerm) ||
      lead.email?.toLowerCase().includes(lowerSearchTerm) ||
      lead.company?.toLowerCase().includes(lowerSearchTerm) ||
      lead.jobTitle?.toLowerCase().includes(lowerSearchTerm) ||
      lead.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  }

  async getEngagementStats(): Promise<{
    totalLeads: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const data = this.db.readSync();
    const leads: Lead[] = data[this.collectionName] || [];

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    leads.forEach(lead => {
      byStatus[lead.engagementStatus] = (byStatus[lead.engagementStatus] || 0) + 1;
      bySource[lead.leadSource] = (bySource[lead.leadSource] || 0) + 1;
    });

    return {
      totalLeads: leads.length,
      byStatus,
      bySource,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}