import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ScrapeProfileRequest {
  profileUrls: string[];
  recordCount?: number;
}

interface ScrapeProfileResponse {
  success: boolean;
  data?: any[];
  count?: number;
  error?: string;
}

interface LinkedInProfile {
  fullName?: string;
  headline?: string;
  location?: string;
  profileUrl?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  connections?: string;
  about?: string;
  imgUrl?: string;
}

@Injectable()
export class LinkedInService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === provider.toLowerCase());

      if (!keyEntry) {
        return null;
      }

      return this.cryptoService.decrypt(keyEntry.value);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  private async runApifyActor(actorId: string, input: Record<string, any>): Promise<any[]> {
    const token = this.getApiKey('apify');
    if (!token) {
      throw new Error('Apify API key not configured');
    }

    try {
      const runResponse = await axios.post(
        `https://api.apify.com/v2/acts/${actorId}/runs`,
        input,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { waitForFinish: 120 },
          timeout: 130000,
        },
      );

      const datasetId = runResponse.data?.data?.defaultDatasetId;
      if (!datasetId) {
        throw new Error('No dataset returned from Apify');
      }

      const results = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { format: 'json' },
        timeout: 15000,
      });

      return results.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Apify API error: ${error.response?.data?.error?.message || error.response?.statusText || error.message}`);
      }
      throw error;
    }
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

  private saveScrapingResults(profiles: LinkedInProfile[]): void {
    try {
      const data = this.db.readSync();
      if (!data.linkedinProfiles) {
        data.linkedinProfiles = [];
      }

      const existingUrls = new Set(data.linkedinProfiles.map((p: any) => p.profileUrl));
      const newProfiles = profiles.filter(profile => !existingUrls.has(profile.profileUrl));

      data.linkedinProfiles.push(...newProfiles.map(profile => ({
        ...profile,
        scrapedAt: new Date().toISOString(),
      })));

      this.db.writeSync(data);
    } catch (error) {
      console.error('Failed to save scraping results:', error);
    }
  }

  async scrapeLinkedInProfiles(request: ScrapeProfileRequest): Promise<ScrapeProfileResponse> {
    try {
      const { profileUrls, recordCount = 10 } = request;

      // Validate input
      if (!this.validateProfileUrls(profileUrls)) {
        return {
          success: false,
          error: 'Invalid LinkedIn profile URLs provided. Please provide valid LinkedIn profile URLs.',
        };
      }

      if (recordCount < 1 || recordCount > 100) {
        return {
          success: false,
          error: 'Record count must be between 1 and 100.',
        };
      }

      // Limit URLs based on record count
      const urlsToProcess = profileUrls.slice(0, recordCount);

      // Prepare Apify actor input
      const actorInput = {
        startUrls: urlsToProcess.map(url => ({ url })),
        maxRequestsPerCrawl: recordCount,
        includeUnlistedData: true,
        includeCertifications: true,
        includeSkills: true,
        includeAccomplishments: true,
        includeTestimonialsAndQuotes: false,
        includeExperiences: true,
        includeEducations: true,
        proxy: {
          useApifyProxy: true,
        },
      };

      // Run the LinkedIn profile scraper
      const results = await this.runApifyActor('curious_coder/linkedin-profile-scraper', actorInput);

      if (!results || results.length === 0) {
        return {
          success: false,
          error: 'No profile data could be scraped. The profiles might be private or the URLs might be invalid.',
        };
      }

      // Process and clean the results
      const processedProfiles: LinkedInProfile[] = results.map(profile => ({
        fullName: profile.fullName || profile.name || 'N/A',
        headline: profile.headline || 'N/A',
        location: profile.location || 'N/A',
        profileUrl: profile.url || profile.profileUrl || 'N/A',
        experience: profile.experience || [],
        education: profile.education || [],
        skills: profile.skills || [],
        connections: profile.connections || 'N/A',
        about: profile.about || profile.summary || 'N/A',
        imgUrl: profile.imgUrl || profile.profilePicture || '',
      }));

      // Save results to database
      this.saveScrapingResults(processedProfiles);

      return {
        success: true,
        data: processedProfiles,
        count: processedProfiles.length,
      };

    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profiles',
      };
    }
  }
}