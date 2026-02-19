import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ScraperRequest {
  profiles?: string[];
  hashtags?: string[];
  searchTerms?: string[];
  maxItems?: number;
  maxRequestRetries?: number;
  maxScrollWaitTime?: number;
  resultsPerPage?: number;
}

interface ScraperRunResponse {
  success: boolean;
  runId?: string;
  error?: string;
}

interface ScraperResultsResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

interface ScraperStatusResponse {
  success: boolean;
  status?: string;
  runDetails?: any;
  error?: string;
}

@Injectable()
export class ClockworksTiktokScraperService {
  private readonly actorId = 'clockworks/tiktok-scraper';

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

  async runTiktokScraper(input: ScraperRequest): Promise<ScraperRunResponse> {
    try {
      const token = this.getApiKey('apify');
      if (!token) {
        return {
          success: false,
          error: 'Apify API key not configured. Please add your Apify API key to continue.',
        };
      }

      // Validate input
      if (!input.profiles && !input.hashtags && !input.searchTerms) {
        return {
          success: false,
          error: 'At least one of profiles, hashtags, or searchTerms must be provided',
        };
      }

      // Prepare input for the TikTok scraper
      const scraperInput = {
        profiles: input.profiles || [],
        hashtags: input.hashtags || [],
        searchTerms: input.searchTerms || [],
        maxItems: input.maxItems || 20,
        maxRequestRetries: input.maxRequestRetries || 3,
        maxScrollWaitTime: input.maxScrollWaitTime || 10,
        resultsPerPage: input.resultsPerPage || 20,
      };

      const runResponse = await axios.post(
        `https://api.apify.com/v2/acts/${this.actorId}/runs`,
        scraperInput,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const runId = runResponse.data?.data?.id;
      if (!runId) {
        return {
          success: false,
          error: 'Failed to get run ID from Apify response',
        };
      }

      // Store run information in database
      const data = this.db.readSync();
      if (!data.tiktokScraperRuns) {
        data.tiktokScraperRuns = [];
      }

      data.tiktokScraperRuns.push({
        runId,
        input: scraperInput,
        status: 'RUNNING',
        createdAt: new Date().toISOString(),
      });

      this.db.writeSync(data);

      return {
        success: true,
        runId,
      };
    } catch (error) {
      console.error('Failed to run TikTok scraper:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        if (statusCode === 401) {
          return {
            success: false,
            error: 'Invalid Apify API key. Please check your configuration.',
          };
        } else if (statusCode === 402) {
          return {
            success: false,
            error: 'Insufficient Apify account balance. Please top up your account.',
          };
        } else {
          return {
            success: false,
            error: `Apify API error: ${errorMessage}`,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to start TikTok scraper. Please try again.',
      };
    }
  }

  async getScraperResults(runId: string): Promise<ScraperResultsResponse> {
    try {
      const token = this.getApiKey('apify');
      if (!token) {
        return {
          success: false,
          error: 'Apify API key not configured',
        };
      }

      // Get run details to check status
      const runResponse = await axios.get(
        `https://api.apify.com/v2/acts/${this.actorId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      const runData = runResponse.data?.data;
      if (!runData) {
        return {
          success: false,
          error: 'Run not found',
        };
      }

      if (runData.status !== 'SUCCEEDED') {
        return {
          success: false,
          error: `Scraper run is not completed. Current status: ${runData.status}`,
        };
      }

      const datasetId = runData.defaultDatasetId;
      if (!datasetId) {
        return {
          success: false,
          error: 'No dataset available for this run',
        };
      }

      // Get the results from the dataset
      const resultsResponse = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            format: 'json',
          },
          timeout: 15000,
        }
      );

      const results = resultsResponse.data || [];

      // Update run status in database
      const data = this.db.readSync();
      if (data.tiktokScraperRuns) {
        const runIndex = data.tiktokScraperRuns.findIndex((r: any) => r.runId === runId);
        if (runIndex !== -1) {
          data.tiktokScraperRuns[runIndex].status = runData.status;
          data.tiktokScraperRuns[runIndex].completedAt = new Date().toISOString();
          data.tiktokScraperRuns[runIndex].resultCount = results.length;
          this.db.writeSync(data);
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Failed to get TikTok scraper results:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        if (statusCode === 404) {
          return {
            success: false,
            error: 'Run not found or dataset not available',
          };
        } else {
          return {
            success: false,
            error: `Apify API error: ${errorMessage}`,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to retrieve scraper results. Please try again.',
      };
    }
  }

  async getScraperStatus(runId: string): Promise<ScraperStatusResponse> {
    try {
      const token = this.getApiKey('apify');
      if (!token) {
        return {
          success: false,
          error: 'Apify API key not configured',
        };
      }

      const runResponse = await axios.get(
        `https://api.apify.com/v2/acts/${this.actorId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      const runData = runResponse.data?.data;
      if (!runData) {
        return {
          success: false,
          error: 'Run not found',
        };
      }

      // Update run status in database
      const data = this.db.readSync();
      if (data.tiktokScraperRuns) {
        const runIndex = data.tiktokScraperRuns.findIndex((r: any) => r.runId === runId);
        if (runIndex !== -1) {
          data.tiktokScraperRuns[runIndex].status = runData.status;
          if (runData.finishedAt) {
            data.tiktokScraperRuns[runIndex].completedAt = runData.finishedAt;
          }
          this.db.writeSync(data);
        }
      }

      return {
        success: true,
        status: runData.status,
        runDetails: {
          id: runData.id,
          status: runData.status,
          startedAt: runData.startedAt,
          finishedAt: runData.finishedAt,
          stats: runData.stats,
          meta: runData.meta,
          options: runData.options,
        },
      };
    } catch (error) {
      console.error('Failed to get TikTok scraper status:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        if (statusCode === 404) {
          return {
            success: false,
            error: 'Run not found',
          };
        } else {
          return {
            success: false,
            error: `Apify API error: ${errorMessage}`,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to retrieve scraper status. Please try again.',
      };
    }
  }
}