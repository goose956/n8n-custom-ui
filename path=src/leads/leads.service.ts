import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/leads.dto';

export interface Lead {
  id: string;
  linkedinId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedinUrl?: string;
  profilePicture?: string;
  location?: string;
  industry?: string;
  connections?: number;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'rejected';
  source: 'linkedin' | 'manual' | 'imported';
  tags?: string[];
  notes?: string;
  lastContactDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  linkedinData?: {
    headline?: string;
    summary?: string;
    experience?: any[];
    education?: any[];
    skills?: string[];
    lastUpdated?: Date;
  };
}

export interface LeadsDatabase {
  leads: Lead[];
  lastId: number;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  private getDatabase(): LeadsDatabase {
    const data = this.db.readSync();
    if (!data.leads) {
      data.leads = [];
      data.lastId = 0;
      this.db.writeSync(data);
    }
    return data;
  }

  private generateId(): string {
    const data = this.getDatabase();
    data.lastId += 1;
    this.db.writeSync(data);
    return `lead_${data.lastId}`;
  }

  async getAllLeads(query: LeadQueryDto): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
  }> {
    const data = this.getDatabase();
    let leads = [...data.leads];

    // Filter by status
    if (query.status) {
      leads = leads.filter(lead => lead.status === query.status);
    }

    // Filter by source
    if (query.source) {
      leads = leads.filter(lead => lead.source === query.source);
    }

    // Search functionality
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      leads = leads.filter(lead =>
        lead.firstName.toLowerCase().includes(searchTerm) ||
        lead.lastName.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm) ||
        lead.position?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      leads = leads.filter(lead =>
        lead.tags && lead.tags.some(tag => query.tags.includes(tag))
      );
    }

    // Sort leads
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    leads.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedLeads = leads.slice(startIndex, endIndex);

    return {
      leads: paginatedLeads,
      total: leads.length,
      page,
      limit,
    };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const data = this.getDatabase();
    return data.leads.find(lead => lead.id === id) || null;
  }

  async createLead(createLeadDto: CreateLeadDto): Promise<Lead> {
    const data = this.getDatabase();
    
    // Check for duplicate email or LinkedIn URL
    if (createLeadDto.email) {
      const existingLead = data.leads.find(lead => lead.email === createLeadDto.email);
      if (existingLead) {
        throw new Error('Lead with this email already exists');
      }
    }

    if (createLeadDto.linkedinUrl) {
      const existingLead = data.leads.find(lead => lead.linkedinUrl === createLeadDto.linkedinUrl);
      if (existingLead) {
        throw new Error('Lead with this LinkedIn URL already exists');
      }
    }

    const now = new Date();
    const newLead: Lead = {
      id: this.generateId(),
      ...createLeadDto,
      status: createLeadDto.status || 'new',
      source: createLeadDto.source || 'manual',
      tags: createLeadDto.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    data.leads.push(newLead);
    this.db.writeSync(data);

    return newLead;
  }

  async updateLead(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead | null> {
    const data = this.getDatabase();
    const leadIndex = data.leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return null;
    }

    // Check for duplicate email or LinkedIn URL (excluding current lead)
    if (updateLeadDto.email) {
      const existingLead = data.leads.find(lead => 
        lead.email === updateLeadDto.email && lead.id !== id
      );
      if (existingLead) {
        throw new Error('Another lead with this email already exists');
      }
    }

    if (updateLeadDto.linkedinUrl) {
      const existingLead = data.leads.find(lead => 
        lead.linkedinUrl === updateLeadDto.linkedinUrl && lead.id !== id
      );
      if (existingLead) {
        throw new Error('Another lead with this LinkedIn URL already exists');
      }
    }

    const updatedLead = {
      ...data.leads[leadIndex],
      ...updateLeadDto,
      updatedAt: new Date(),
    };

    data.leads[leadIndex] = updatedLead;
    this.db.writeSync(data);

    return updatedLead;
  }

  async updateLeadStatus(id: string, status: string, notes?: string): Promise<Lead | null> {
    const data = this.getDatabase();
    const leadIndex = data.leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return null;
    }

    const updatedLead = {
      ...data.leads[leadIndex],
      status: status as Lead['status'],
      notes: notes || data.leads[leadIndex].notes,
      updatedAt: new Date(),
      lastContactDate: ['contacted', 'interested', 'qualified'].includes(status) 
        ? new Date() 
        : data.leads[leadIndex].lastContactDate,
    };

    data.leads[leadIndex] = updatedLead;
    this.db.writeSync(data);

    return updatedLead;
  }

  async syncWithLinkedIn(id: string): Promise<Lead | null> {
    const lead = await this.getLeadById(id);
    if (!lead || !lead.linkedinUrl) {
      return null;
    }

    try {
      // Get LinkedIn API key
      const apiKey = await this.cryptoService.getApiKey('LINKEDIN_API_KEY');
      if (!apiKey) {
        throw new Error('LinkedIn API key not found');
      }

      // Simulate LinkedIn API call (replace with actual LinkedIn API integration)
      const linkedinData = await this.fetchLinkedInProfile(lead.linkedinUrl, apiKey);
      
      const updateData: Partial<Lead> = {
        linkedinData: {
          ...linkedinData,
          lastUpdated: new Date(),
        },
        updatedAt: new Date(),
      };

      // Update profile data from LinkedIn if available
      if (linkedinData.firstName) updateData.firstName = linkedinData.firstName;
      if (linkedinData.lastName) updateData.lastName = linkedinData.lastName;
      if (linkedinData.company) updateData.company = linkedinData.company;
      if (linkedinData.position) updateData.position = linkedinData.position;
      if (linkedinData.location) updateData.location = linkedinData.location;
      if (linkedinData.industry) updateData.industry = linkedinData.industry;
      if (linkedinData.profilePicture) updateData.profilePicture = linkedinData.profilePicture;

      return await this.updateLead(id, updateData);
    } catch (error) {
      console.error('Failed to sync with LinkedIn:', error);
      throw new Error('Failed to sync with LinkedIn API');
    }
  }

  private async fetchLinkedInProfile(linkedinUrl: string, apiKey: string): Promise<any> {
    // This is a mock implementation. In a real application, you would:
    // 1. Extract the LinkedIn profile ID from the URL
    // 2. Make API calls to LinkedIn's API endpoints
    // 3. Handle authentication and rate limiting
    
    // Mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Senior Software Engineer at Tech Corp',
          summary: 'Experienced software engineer with 10+ years in full-stack development.',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          industry: 'Technology',
          connections: 500,
          profilePicture: 'https://example.com/profile.jpg',
          experience: [
            {
              title: 'Senior Software Engineer',
              company: 'Tech Corp',
              duration: '2020 - Present',
              location: 'San Francisco, CA',
            },
          ],
          education: [
            {
              school: 'University of California',
              degree: 'Bachelor of Science in Computer Science',
              years: '2008 - 2012',
            },
          ],
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        });
      }, 1000);
    });
  }

  async getLeadsByCompany(company: string): Promise<Lead[]> {
    const data = this.getDatabase();
    return data.leads.filter(lead => 
      lead.company && lead.company.toLowerCase().includes(company.toLowerCase())
    );
  }

  async getLeadsByStatus(status: Lead['status']): Promise<Lead[]> {
    const data = this.getDatabase();
    return data.leads.filter(lead => lead.status === status);
  }

  async addTagsToLead(id: string, tags: string[]): Promise<Lead | null> {
    const data = this.getDatabase();
    const leadIndex = data.leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return null;
    }

    const existingTags = data.leads[leadIndex].tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    data.leads[leadIndex] = {
      ...data.leads[leadIndex],
      tags: newTags,
      updatedAt: new Date(),
    };

    this.db.writeSync(data);
    return data.leads[leadIndex];
  }

  async removeTagsFromLead(id: string, tags: string[]): Promise<Lead | null> {
    const data = this.getDatabase();
    const leadIndex = data.leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      return null;
    }

    const existingTags = data.leads[leadIndex].tags || [];
    const filteredTags = existingTags.filter(tag => !tags.includes(tag));

    data.leads[leadIndex] = {
      ...data.leads[leadIndex],
      tags: filteredTags,
      updatedAt: new Date(),
    };

    this.db.writeSync(data);
    return data.leads[leadIndex];
  }
}