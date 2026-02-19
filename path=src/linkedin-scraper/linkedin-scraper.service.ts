import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import * as crypto from 'crypto';

export interface ScrapingJob {
  id: string;
  profileUrl: string;
  jobName: string;
  extractFields: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: ProfileData;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ProfileData {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[];
  connections?: number;
  profileImageUrl?: string;
  contactInfo?: ContactInfo;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface EducationItem {
  school: string;
  degree?: string;
  field?: string;
  duration: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
}

export interface ScrapingJobQuery {
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LinkedinScraperService {
  private readonly dataFile = 'linkedin-scraping-jobs.json';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService
  ) {}

  async getScrapingJobs(query: ScrapingJobQuery = {}): Promise<ScrapingJob[]> {
    const data = this.db.readSync(this.dataFile);
    let jobs: ScrapingJob[] = data.jobs || [];

    // Filter by status
    if (query.status) {
      jobs = jobs.filter(job => job.status === query.status);
    }

    // Sort by priority and creation date
    jobs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return jobs.slice(offset, offset + limit);
  }

  async getScrapingJobById(id: string): Promise<ScrapingJob | null> {
    const data = this.db.readSync(this.dataFile);
    const jobs: ScrapingJob[] = data.jobs || [];
    
    return jobs.find(job => job.id === id) || null;
  }

  async createScrapingJob(jobDto: any): Promise<ScrapingJob> {
    const data = this.db.readSync(this.dataFile);
    const jobs: ScrapingJob[] = data.jobs || [];

    // Check for duplicate profile URL in pending/processing jobs
    const existingJob = jobs.find(job => 
      job.profileUrl === jobDto.profileUrl && 
      ['pending', 'processing'].includes(job.status)
    );

    if (existingJob) {
      throw new HttpException(
        'A scraping job for this profile is already in progress',
        HttpStatus.CONFLICT
      );
    }

    const newJob: ScrapingJob = {
      id: crypto.randomUUID(),
      profileUrl: jobDto.profileUrl,
      jobName: jobDto.jobName || `LinkedIn Profile - ${new Date().toISOString()}`,
      extractFields: jobDto.extractFields || [
        'name', 'headline', 'location', 'about', 
        'experience', 'education', 'skills', 'connections'
      ],
      priority: jobDto.priority || 'medium',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    jobs.push(newJob);
    data.jobs = jobs;
    this.db.writeSync(this.dataFile, data);

    return newJob;
  }

  async processScrapingJob(id: string): Promise<ScrapingJob> {
    const data = this.db.readSync(this.dataFile);
    const jobs: ScrapingJob[] = data.jobs || [];
    
    const jobIndex = jobs.findIndex(job => job.id === id);
    if (jobIndex === -1) {
      throw new HttpException('Scraping job not found', HttpStatus.NOT_FOUND);
    }

    const job = jobs[jobIndex];
    
    if (job.status === 'processing') {
      throw new HttpException('Job is already being processed', HttpStatus.CONFLICT);
    }

    if (job.status === 'completed') {
      throw new HttpException('Job has already been completed', HttpStatus.CONFLICT);
    }

    // Update job status to processing
    job.status = 'processing';
    job.startedAt = new Date();
    job.updatedAt = new Date();
    
    jobs[jobIndex] = job;
    data.jobs = jobs;
    this.db.writeSync(this.dataFile, data);

    try {
      // Simulate scraping process
      const profileData = await this.scrapeLinkedInProfile(job.profileUrl, job.extractFields);
      
      // Update job with results
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.result = profileData;
      
    } catch (error) {
      // Handle scraping error
      job.retryCount++;
      job.updatedAt = new Date();
      job.error = error.message;
      
      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
      } else {
        job.status = 'pending'; // Will be retried later
      }
    }

    jobs[jobIndex] = job;
    data.jobs = jobs;
    this.db.writeSync(this.dataFile, data);

    return job;
  }

  async getScrapingStats(): Promise<any> {
    const data = this.db.readSync(this.dataFile);
    const jobs: ScrapingJob[] = data.jobs || [];

    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      successRate: 0,
      averageProcessingTime: 0
    };

    if (stats.total > 0) {
      stats.successRate = (stats.completed / (stats.completed + stats.failed)) * 100;
    }

    // Calculate average processing time for completed jobs
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.startedAt && j.completedAt);
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        return sum + (new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime());
      }, 0);
      stats.averageProcessingTime = totalTime / completedJobs.length / 1000; // in seconds
    }

    return stats;
  }

  private async scrapeLinkedInProfile(profileUrl: string, extractFields: string[]): Promise<ProfileData> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // In a real implementation, this would use LinkedIn API or web scraping
    // For now, we'll return mock data based on the profile URL
    const mockProfile: ProfileData = {
      name: "John Doe",
      headline: "Senior Software Engineer at Tech Company",
      location: "San Francisco, CA",
      about: "Experienced software engineer with a passion for building scalable web applications and leading development teams.",
      experience: [
        {
          title: "Senior Software Engineer",
          company: "Tech Company Inc.",
          duration: "2021 - Present",
          location: "San Francisco, CA",
          description: "Lead development of microservices architecture and mentor junior developers."
        },
        {
          title: "Software Engineer",
          company: "Startup Solutions",
          duration: "2019 - 2021",
          location: "Remote",
          description: "Developed full-stack web applications using React and Node.js."
        }
      ],
      education: [
        {
          school: "University of Technology",
          degree: "Bachelor of Science",
          field: "Computer Science",
          duration: "2015 - 2019"
        }
      ],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker"],
      connections: 500,
      profileImageUrl: "https://example.com/profile-image.jpg",
      contactInfo: {
        email: "john.doe@example.com",
        website: "https://johndoe.dev"
      }
    };

    // Filter results based on requested fields
    const filteredProfile: ProfileData = {};
    extractFields.forEach(field => {
      if (mockProfile[field] !== undefined) {
        filteredProfile[field] = mockProfile[field];
      }
    });

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('LinkedIn scraping failed: Rate limit exceeded');
    }

    return filteredProfile;
  }
}