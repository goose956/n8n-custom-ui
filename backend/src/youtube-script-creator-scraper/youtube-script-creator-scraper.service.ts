import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ScrapeRequest {
  urls: string[];
  options?: {
    maxItems?: number;
    [key: string]: any;
  };
}

interface ScrapeResponse {
  success: boolean;
  runId?: string;
  error?: string;
}

interface StatusResponse {
  success: boolean;
  status?: string;
  data?: any;
  error?: string;
}

interface ResultsResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

@Injectable()
export class YoutubeScriptCreatorScraperService {
  private readonly logger = new Logger(YoutubeScriptCreatorScraperService.name);

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
      this.logger.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  private async runApifyActor(actorId: string, input: Record<string, any>): Promise<any> {
    const token = this.getApiKey('apify');
    if (!token) throw new Error('Apify API key not configured. Add it in Settings > API Keys.');

    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      input,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { waitForFinish: 120 },
        timeout: 130_000,
      },
    );
    return runResponse.data?.data;
  }

  private async getApifyResults(datasetId: string): Promise<any[]> {
    const token = this.getApiKey('apify');
    if (!token) throw new Error('Apify API key not configured');

    const results = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { format: 'json' },
      timeout: 15_000,
    });
    return results.data || [];
  }

  async runScraper(request: ScrapeRequest): Promise<ScrapeResponse> {
    try {
      if (!request.urls || request.urls.length === 0) {
        return { success: false, error: 'At least one URL is required' };
      }

      const input: Record<string, any> = {
        startUrls: request.urls.map(url => ({ url })),
        resultsLimit: request.options?.maxItems || 100,
      };

      const runData = await this.runApifyActor('clockworks/tiktok-scraper', input);

      if (!runData?.id) {
        return { success: false, error: 'Failed to start scraper run' };
      }

      // Store run info in db.json
      const data = this.db.readSync();
      if (!data.youtubeScriptCreatorScraperRuns) data.youtubeScriptCreatorScraperRuns = {};

      data.youtubeScriptCreatorScraperRuns[runData.id] = {
        id: runData.id,
        status: runData.status,
        startedAt: new Date().toISOString(),
        urls: request.urls,
        options: request.options || {},
        defaultDatasetId: runData.defaultDatasetId,
      };
      this.db.writeSync(data);

      return { success: true, runId: runData.id };
    } catch (error) {
      this.logger.error('Scraper run error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getStatus(runId: string): Promise<StatusResponse> {
    try {
      const token = this.getApiKey('apify');
      if (!token) return { success: false, error: 'Apify API key not configured' };

      const response = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15_000,
      });

      const runData = response.data?.data;
      if (!runData) return { success: false, error: 'Run not found' };

      // Update local DB
      const data = this.db.readSync();
      if (data.youtubeScriptCreatorScraperRuns?.[runId]) {
        data.youtubeScriptCreatorScraperRuns[runId].status = runData.status;
        data.youtubeScriptCreatorScraperRuns[runId].updatedAt = new Date().toISOString();
        if (runData.finishedAt) data.youtubeScriptCreatorScraperRuns[runId].finishedAt = runData.finishedAt;
        this.db.writeSync(data);
      }

      return {
        success: true,
        status: runData.status,
        data: {
          id: runData.id,
          status: runData.status,
          startedAt: runData.startedAt,
          finishedAt: runData.finishedAt,
          stats: runData.stats,
        },
      };
    } catch (error) {
      this.logger.error('Status check error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getResults(runId: string): Promise<ResultsResponse> {
    try {
      const data = this.db.readSync();
      const runInfo = data.youtubeScriptCreatorScraperRuns?.[runId];
      if (!runInfo) return { success: false, error: 'Run not found in database' };

      let datasetId = runInfo.defaultDatasetId;
      if (!datasetId) {
        const token = this.getApiKey('apify');
        if (!token) return { success: false, error: 'Apify API key not configured' };

        const response = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15_000,
        });
        datasetId = response.data?.data?.defaultDatasetId;
        if (!datasetId) return { success: false, error: 'No dataset available for this run' };

        data.youtubeScriptCreatorScraperRuns[runId].defaultDatasetId = datasetId;
        this.db.writeSync(data);
      }

      const results = await this.getApifyResults(datasetId);
      return { success: true, data: results };
    } catch (error) {
      this.logger.error('Results retrieval error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
