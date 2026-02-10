import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

@Injectable()
export class WorkflowsService {
  constructor(private readonly settingsService: SettingsService) {}

  async getWorkflows() {
    try {
      const settings = this.settingsService.loadSettingsSync();
      
      if (!settings) {
        return { success: false, message: 'No settings configured', workflows: [] };
      }

      const decryptedApiKey = this.settingsService.decryptSync(settings.n8nApiKey);
      
      const response = await axios.get(`${settings.n8nUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': decryptedApiKey,
        },
        timeout: 5000,
      });

      return {
        success: true,
        workflows: response.data.data || [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to fetch workflows: ${message}`,
        workflows: [],
      };
    }
  }

  async triggerWorkflow(workflowId: string, data?: Record<string, any>) {
    try {
      const settings = this.settingsService.loadSettingsSync();
      
      if (!settings) {
        return { success: false, message: 'No settings configured' };
      }

      const decryptedApiKey = this.settingsService.decryptSync(settings.n8nApiKey);
      
      const response = await axios.post(
        `${settings.n8nUrl}/api/v1/workflows/${workflowId}/execute`,
        { data: data || {} },
        {
          headers: {
            'X-N8N-API-KEY': decryptedApiKey,
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        message: 'Workflow triggered successfully',
        executionId: response.data.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to trigger workflow: ${message}`,
      };
    }
  }
}
