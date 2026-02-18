import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ScrapeLinkedinProfileRequest {
  profileUrls: string[];
  includeSkills?: boolean;
  includeEducation?: boolean;
  includeExperience?: boolean;
  includeRecommendations?: boolean;
}

interface ScrapeResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: any;
  error?: string;
}

interface SavedProfile {
  id: string;
  profileUrl: string;
  data: any;
  scrapedAt: string;
}

@Injectable()
export class LinkedinScraperService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === provider.toLowerCase());
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  private async runApifyActor(actorId: string, input: Record<string, any>): Promise<any[]> {
    const token = this.getApiKey('apify');
    if (!token) throw new Error('Apify API key not configured');
    
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      input,
      { 
        headers: { 'Authorization': `Bearer ${token}` }, 
        params: { waitForFinish: 120 }, 
        timeout: 130000 
      }
    );
    
    const datasetId = runResponse.data?.data?.defaultDatasetId;
    if (!datasetId) throw new Error('No dataset returned from Apify');
    
    const results = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
      headers: { 'Authorization': `Bearer ${token}` }, 
      params: { format: 'json' }, 
      timeout: 15000 
    });
    return results.data || [];
  }

  private validateProfileUrls(urls: string[]): boolean {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return false;
    }

    return urls.every(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
      } catch {
        return false;
      }
    });
  }

  async scrapeLinkedinProfiles(request: ScrapeLinkedinProfileRequest): Promise<ScrapeResponse> {
    try {
      if (!this.validateProfileUrls(request.profileUrls)) {
        return {
          success: false,
          error: 'Invalid LinkedIn profile URLs provided'
        };
      }

      const input = {
        startUrls: request.profileUrls.map(url => ({ url })),
        includeSkills: request.includeSkills ?? true,
        includeEducation: request.includeEducation ?? true,
        includeExperience: request.includeExperience ?? true,
        includeRecommendations: request.includeRecommendations ?? false,
        maxRequestRetries: 3,
        maxRequestsPerCrawl: request.profileUrls.length * 2
      };

      console.log('Starting LinkedIn profile scraping with Apify...');
      const results = await this.runApifyActor('curious_coder/linkedin-profile-scraper', input);

      if (!results || results.length === 0) {
        return {
          success: false,
          error: 'No profile data returned from scraper'
        };
      }

      // Save scraped profiles to database
      const savedProfiles = [];
      for (const profile of results) {
        if (profile && profile.url) {
          const savedProfile = await this.saveProfile(profile.url, profile);
          savedProfiles.push(savedProfile);
        }
      }

      console.log(`Successfully scraped ${results.length} LinkedIn profiles`);

      return {
        success: true,
        data: savedProfiles
      };

    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during scraping'
      };
    }
  }

  private async saveProfile(profileUrl: string, profileData: any): Promise<SavedProfile> {
    const data = this.db.readSync();
    const profiles = data.linkedinProfiles || [];
    
    const savedProfile: SavedProfile = {
      id: uuidv4(),
      profileUrl,
      data: profileData,
      scrapedAt: new Date().toISOString()
    };

    // Check if profile already exists and update it
    const existingIndex = profiles.findIndex((p: SavedProfile) => p.profileUrl === profileUrl);
    if (existingIndex >= 0) {
      profiles[existingIndex] = savedProfile;
    } else {
      profiles.push(savedProfile);
    }

    data.linkedinProfiles = profiles;
    this.db.writeSync(data);

    return savedProfile;
  }

  async getSavedProfiles(): Promise<SavedProfile[]> {
    try {
      const data = this.db.readSync();
      return data.linkedinProfiles || [];
    } catch (error) {
      console.error('Error retrieving saved profiles:', error);
      return [];
    }
  }

  async getSavedProfile(id: string): Promise<SavedProfile | null> {
    try {
      const data = this.db.readSync();
      const profiles = data.linkedinProfiles || [];
      return profiles.find((p: SavedProfile) => p.id === id) || null;
    } catch (error) {
      console.error('Error retrieving saved profile:', error);
      return null;
    }
  }

  async deleteSavedProfile(id: string): Promise<boolean> {
    try {
      const data = this.db.readSync();
      const profiles = data.linkedinProfiles || [];
      const initialLength = profiles.length;
      
      data.linkedinProfiles = profiles.filter((p: SavedProfile) => p.id !== id);
      
      if (data.linkedinProfiles.length < initialLength) {
        this.db.writeSync(data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting saved profile:', error);
      return false;
    }
  }

  async analyzeProfile(id: string): Promise<AnalysisResponse> {
    try {
      const profile = await this.getSavedProfile(id);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      const openaiKey = this.getApiKey('openai');
      if (!openaiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured'
        };
      }

      const profileSummary = this.createProfileSummary(profile.data);

      const prompt = `Analyze this LinkedIn profile and provide insights:

Profile Data:
${profileSummary}

Please provide:
1. Professional Summary
2. Key Skills Analysis
3. Experience Highlights
4. Education Background
5. Career Progression Analysis
6. Potential Opportunities
7. Overall Rating (1-10)

Format as JSON with these keys: professionalSummary, keySkills, experienceHighlights, education, careerProgression, opportunities, overallRating`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional recruiter and career analyst. Provide detailed, constructive analysis of LinkedIn profiles.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      let analysis;
      try {
        analysis = JSON.parse(response.data.choices[0].message.content);
      } catch {
        analysis = {
          error: 'Failed to parse analysis response',
          rawResponse: response.data.choices[0].message.content
        };
      }

      // Save analysis to profile
      const data = this.db.readSync();
      const profiles = data.linkedinProfiles || [];
      const profileIndex = profiles.findIndex((p: SavedProfile) => p.id === id);
      
      if (profileIndex >= 0) {
        profiles[profileIndex].analysis = analysis;
        profiles[profileIndex].analyzedAt = new Date().toISOString();
        data.linkedinProfiles = profiles;
        this.db.writeSync(data);
      }

      return {
        success: true,
        analysis
      };

    } catch (error) {
      console.error('Profile analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  private createProfileSummary(profileData: any): string {
    const summary = [];

    if (profileData.fullName) {
      summary.push(`Name: ${profileData.fullName}`);
    }

    if (profileData.headline) {
      summary.push(`Headline: ${profileData.headline}`);
    }

    if (profileData.location) {
      summary.push(`Location: ${profileData.location}`);
    }

    if (profileData.summary) {
      summary.push(`Summary: ${profileData.summary}`);
    }

    if (profileData.experience && Array.isArray(profileData.experience)) {
      summary.push(`Experience: ${profileData.experience.length} positions`);
      profileData.experience.slice(0, 3).forEach((exp: any, index: number) => {
        summary.push(`  ${index + 1}. ${exp.title} at ${exp.company} (${exp.duration || 'N/A'})`);
      });
    }

    if (profileData.education && Array.isArray(profileData.education)) {
      summary.push(`Education: ${profileData.education.length} entries`);
      profileData.education.slice(0, 2).forEach((edu: any, index: number) => {
        summary.push(`  ${index + 1}. ${edu.degree || edu.fieldOfStudy || 'Degree'} at ${edu.school}`);
      });
    }

    if (profileData.skills && Array.isArray(profileData.skills)) {
      const skillNames = profileData.skills.slice(0, 10).map((skill: any) => skill.name || skill).join(', ');
      summary.push(`Top Skills: ${skillNames}`);
    }

    return summary.join('\n');
  }
}