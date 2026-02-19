import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { v4 as uuidv4 } from 'uuid';

export interface LinkedinProfile {
  id: string;
  profileUrl: string;
  name?: string;
  headline?: string;
  location?: string;
  summary?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  connectionCount?: number;
  followerCount?: number;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  languages?: string[];
  certifications?: Certification[];
  recommendations?: Recommendation[];
  status: 'pending' | 'scraping' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  duration: string;
  description?: string;
  startYear?: string;
  endYear?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Recommendation {
  id: string;
  recommenderName: string;
  recommenderTitle: string;
  relationship: string;
  text: string;
  date?: string;
}

export interface ScrapingJob {
  id: string;
  profileUrls: string[];
  options: {
    includeConnections?: boolean;
    includeExperience?: boolean;
    includeEducation?: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalProfiles: number;
  completedProfiles: number;
  failedProfiles: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class LinkedinProfileScraperService {
  private readonly logger = new Logger(LinkedinProfileScraperService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getScrapedProfiles(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ profiles: LinkedinProfile[]; total: number }> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      let profiles = data.profiles || [];

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        profiles = profiles.filter((profile: LinkedinProfile) =>
          profile.name?.toLowerCase().includes(searchLower) ||
          profile.headline?.toLowerCase().includes(searchLower) ||
          profile.profileUrl.toLowerCase().includes(searchLower)
        );
      }

      // Filter by status
      if (status) {
        profiles = profiles.filter((profile: LinkedinProfile) => profile.status === status);
      }

      const total = profiles.length;
      const startIndex = (page - 1) * limit;
      const paginatedProfiles = profiles.slice(startIndex, startIndex + limit);

      return { profiles: paginatedProfiles, total };
    } catch (error) {
      this.logger.error('Error fetching scraped profiles:', error);
      return { profiles: [], total: 0 };
    }
  }

  async getScrapedProfile(id: string): Promise<LinkedinProfile | null> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profiles = data.profiles || [];
      return profiles.find((profile: LinkedinProfile) => profile.id === id) || null;
    } catch (error) {
      this.logger.error('Error fetching scraped profile:', error);
      return null;
    }
  }

  async scrapeProfile(scrapeDto: {
    profileUrl: string;
    includeConnections?: boolean;
    includeExperience?: boolean;
    includeEducation?: boolean;
  }): Promise<LinkedinProfile> {
    try {
      const profileId = uuidv4();
      const now = new Date().toISOString();

      // Create new profile entry
      const newProfile: LinkedinProfile = {
        id: profileId,
        profileUrl: scrapeDto.profileUrl,
        status: 'pending',
        progress: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Save to database
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      data.profiles = data.profiles || [];
      
      // Check if profile already exists
      const existingIndex = data.profiles.findIndex(
        (profile: LinkedinProfile) => profile.profileUrl === scrapeDto.profileUrl
      );

      if (existingIndex >= 0) {
        // Update existing profile
        data.profiles[existingIndex] = {
          ...data.profiles[existingIndex],
          status: 'pending',
          progress: 0,
          updatedAt: now,
        };
        this.db.writeSync('linkedin-profiles.json', data);
        
        // Start scraping process
        this.startScrapingProcess(data.profiles[existingIndex].id, scrapeDto);
        return data.profiles[existingIndex];
      } else {
        // Add new profile
        data.profiles.push(newProfile);
        this.db.writeSync('linkedin-profiles.json', data);
        
        // Start scraping process
        this.startScrapingProcess(profileId, scrapeDto);
        return newProfile;
      }
    } catch (error) {
      this.logger.error('Error creating scraping job:', error);
      throw error;
    }
  }

  async scrapeBulkProfiles(bulkScrapeDto: {
    profileUrls: string[];
    includeConnections?: boolean;
    includeExperience?: boolean;
    includeEducation?: boolean;
  }): Promise<ScrapingJob> {
    try {
      const jobId = uuidv4();
      const now = new Date().toISOString();

      // Create scraping job
      const job: ScrapingJob = {
        id: jobId,
        profileUrls: bulkScrapeDto.profileUrls,
        options: {
          includeConnections: bulkScrapeDto.includeConnections,
          includeExperience: bulkScrapeDto.includeExperience,
          includeEducation: bulkScrapeDto.includeEducation,
        },
        status: 'pending',
        progress: 0,
        totalProfiles: bulkScrapeDto.profileUrls.length,
        completedProfiles: 0,
        failedProfiles: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Save job to database
      const jobData = this.db.readSync('scraping-jobs.json') || { jobs: [] };
      jobData.jobs = jobData.jobs || [];
      jobData.jobs.push(job);
      this.db.writeSync('scraping-jobs.json', jobData);

      // Create profile entries
      const profileData = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      profileData.profiles = profileData.profiles || [];

      for (const profileUrl of bulkScrapeDto.profileUrls) {
        const existingIndex = profileData.profiles.findIndex(
          (profile: LinkedinProfile) => profile.profileUrl === profileUrl
        );

        if (existingIndex >= 0) {
          // Update existing profile
          profileData.profiles[existingIndex] = {
            ...profileData.profiles[existingIndex],
            status: 'pending',
            progress: 0,
            updatedAt: now,
          };
        } else {
          // Add new profile
          const newProfile: LinkedinProfile = {
            id: uuidv4(),
            profileUrl,
            status: 'pending',
            progress: 0,
            createdAt: now,
            updatedAt: now,
          };
          profileData.profiles.push(newProfile);
        }
      }

      this.db.writeSync('linkedin-profiles.json', profileData);

      // Start bulk scraping process
      this.startBulkScrapingProcess(jobId);

      return job;
    } catch (error) {
      this.logger.error('Error creating bulk scraping job:', error);
      throw error;
    }
  }

  async cancelScraping(profileId: string): Promise<{ cancelled: boolean }> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profileIndex = data.profiles.findIndex(
        (profile: LinkedinProfile) => profile.id === profileId
      );

      if (profileIndex >= 0) {
        data.profiles[profileIndex].status = 'cancelled';
        data.profiles[profileIndex].updatedAt = new Date().toISOString();
        this.db.writeSync('linkedin-profiles.json', data);
        return { cancelled: true };
      }

      return { cancelled: false };
    } catch (error) {
      this.logger.error('Error cancelling scraping:', error);
      return { cancelled: false };
    }
  }

  async getScrapingStats(): Promise<{
    totalProfiles: number;
    pendingProfiles: number;
    scrapingProfiles: number;
    completedProfiles: number;
    failedProfiles: number;
    cancelledProfiles: number;
  }> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profiles = data.profiles || [];

      const stats = {
        totalProfiles: profiles.length,
        pendingProfiles: profiles.filter((p: LinkedinProfile) => p.status === 'pending').length,
        scrapingProfiles: profiles.filter((p: LinkedinProfile) => p.status === 'scraping').length,
        completedProfiles: profiles.filter((p: LinkedinProfile) => p.status === 'completed').length,
        failedProfiles: profiles.filter((p: LinkedinProfile) => p.status === 'failed').length,
        cancelledProfiles: profiles.filter((p: LinkedinProfile) => p.status === 'cancelled').length,
      };

      return stats;
    } catch (error) {
      this.logger.error('Error fetching scraping stats:', error);
      return {
        totalProfiles: 0,
        pendingProfiles: 0,
        scrapingProfiles: 0,
        completedProfiles: 0,
        failedProfiles: 0,
        cancelledProfiles: 0,
      };
    }
  }

  private async startScrapingProcess(
    profileId: string,
    scrapeOptions: {
      profileUrl: string;
      includeConnections?: boolean;
      includeExperience?: boolean;
      includeEducation?: boolean;
    }
  ): Promise<void> {
    // Simulate scraping process with delays
    setTimeout(async () => {
      await this.updateProfileStatus(profileId, 'scraping', 10);
      
      setTimeout(async () => {
        await this.updateProfileStatus(profileId, 'scraping', 30);
        
        setTimeout(async () => {
          await this.updateProfileStatus(profileId, 'scraping', 60);
          
          setTimeout(async () => {
            await this.updateProfileStatus(profileId, 'scraping', 90);
            
            setTimeout(async () => {
              // Complete the scraping with mock data
              await this.completeProfileScraping(profileId, scrapeOptions);
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 1000);
  }

  private async startBulkScrapingProcess(jobId: string): Promise<void> {
    // Simulate bulk scraping process
    setTimeout(async () => {
      const jobData = this.db.readSync('scraping-jobs.json') || { jobs: [] };
      const jobIndex = jobData.jobs.findIndex((job: ScrapingJob) => job.id === jobId);
      
      if (jobIndex >= 0) {
        jobData.jobs[jobIndex].status = 'processing';
        jobData.jobs[jobIndex].updatedAt = new Date().toISOString();
        this.db.writeSync('scraping-jobs.json', jobData);
        
        // Process each profile with delays
        for (let i = 0; i < jobData.jobs[jobIndex].profileUrls.length; i++) {
          setTimeout(async () => {
            const profileUrl = jobData.jobs[jobIndex].profileUrls[i];
            const profileData = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
            const profile = profileData.profiles.find((p: LinkedinProfile) => p.profileUrl === profileUrl);
            
            if (profile) {
              await this.completeProfileScraping(profile.id, { profileUrl });
              
              // Update job progress
              const currentJobData = this.db.readSync('scraping-jobs.json') || { jobs: [] };
              const currentJobIndex = currentJobData.jobs.findIndex((job: ScrapingJob) => job.id === jobId);
              if (currentJobIndex >= 0) {
                currentJobData.jobs[currentJobIndex].completedProfiles++;
                currentJobData.jobs[currentJobIndex].progress = Math.round(
                  (currentJobData.jobs[currentJobIndex].completedProfiles / currentJobData.jobs[currentJobIndex].totalProfiles) * 100
                );
                
                if (currentJobData.jobs[currentJobIndex].completedProfiles === currentJobData.jobs[currentJobIndex].totalProfiles) {
                  currentJobData.jobs[currentJobIndex].status = 'completed';
                }
                
                currentJobData.jobs[currentJobIndex].updatedAt = new Date().toISOString();
                this.db.writeSync('scraping-jobs.json', currentJobData);
              }
            }
          }, i * 3000); // 3 second delay between each profile
        }
      }
    }, 1000);
  }

  private async updateProfileStatus(
    profileId: string,
    status: LinkedinProfile['status'],
    progress: number
  ): Promise<void> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profileIndex = data.profiles.findIndex(
        (profile: LinkedinProfile) => profile.id === profileId
      );

      if (profileIndex >= 0) {
        data.profiles[profileIndex].status = status;
        data.profiles[profileIndex].progress = progress;
        data.profiles[profileIndex].updatedAt = new Date().toISOString();
        this.db.writeSync('linkedin-profiles.json', data);
      }
    } catch (error) {
      this.logger.error('Error updating profile status:', error);
    }
  }

  private async completeProfileScraping(
    profileId: string,
    scrapeOptions: { profileUrl: string }
  ): Promise<void> {
    try {
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profileIndex = data.profiles.findIndex(
        (profile: LinkedinProfile) => profile.id === profileId
      );

      if (profileIndex >= 0) {
        // Generate mock scraped data
        const mockData = this.generateMockProfileData(scrapeOptions.profileUrl);
        
        data.profiles[profileIndex] = {
          ...data.profiles[profileIndex],
          ...mockData,
          status: 'completed',
          progress: 100,
          scrapedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        this.db.writeSync('linkedin-profiles.json', data);
      }
    } catch (error) {
      this.logger.error('Error completing profile scraping:', error);
      
      // Mark as failed
      const data = this.db.readSync('linkedin-profiles.json') || { profiles: [] };
      const profileIndex = data.profiles.findIndex(
        (profile: LinkedinProfile) => profile.id === profileId
      );

      if (profileIndex >= 0) {
        data.profiles[profileIndex].status = 'failed';
        data.profiles[profileIndex].error = error.message || 'Unknown error';
        data.profiles[profileIndex].updatedAt = new Date().toISOString();
        this.db.writeSync('linkedin-profiles.json', data);
      }
    }
  }

  private generateMockProfileData(profileUrl: string): Partial<LinkedinProfile> {
    const profileName = profileUrl.split('/in/')[1]?.replace(/[^a-zA-Z0-9]/g, ' ') || 'Unknown User';
    
    return {
      name: this.capitalizeWords(profileName),
      headline: 'Software Engineer | Full Stack Developer | Tech Enthusiast',
      location: 'San Francisco Bay Area',
      summary: 'Passionate software engineer with 5+ years of experience in full-stack development. Experienced in React, Node.js, Python, and cloud technologies. Always eager to learn new technologies and solve complex problems.',
      profileImageUrl: `https://via.placeholder.com/150?text=${profileName.charAt(0).toUpperCase()}`,
      connectionCount: Math.floor(Math.random() * 500) + 100,
      followerCount: Math.floor(Math.random() * 1000) + 200,
      experience: [
        {
          id: uuidv4(),
          company: 'Tech Solutions Inc.',
          position: 'Senior Software Engineer',
          duration: '2021 - Present',
          location: 'San Francisco, CA',
          description: 'Lead development of scalable web applications using React and Node.js. Mentored junior developers and improved team productivity by 30%.',
          startDate: '2021-03',
          current: true,
        },
        {
          id: uuidv4(),
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          duration: '2019 - 2021',
          location: 'San Jose, CA',
          description: 'Built and maintained web applications using modern JavaScript frameworks. Collaborated with design and product teams to deliver user-friendly solutions.',
          startDate: '2019-06',
          endDate: '2021-03',
          current: false,
        },
      ],
      education: [
        {
          id: uuidv4(),
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          duration: '2015 - 2019',
          startYear: '2015',
          endYear: '2019',
        },
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'],
      languages: ['English (Native)', 'Spanish (Professional)'],
      certifications: [
        {
          id: uuidv4(),
          name: 'AWS Certified Developer',
          issuer: 'Amazon Web Services',
          issueDate: '2022-01',
          credentialId: 'AWS-123456',
        },
      ],
    };
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}