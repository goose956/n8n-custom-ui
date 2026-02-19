import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';
import { v4 as uuidv4 } from 'uuid';

export interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'database' | 'file' | 'email';
  provider: string;
  configuration: {
    endpoint?: string;
    apiKey?: string;
    credentials?: any;
    settings?: any;
  };
  status: 'active' | 'inactive' | 'error';
  syncStatus: {
    lastSync: Date | null;
    nextSync: Date | null;
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    isRunning: boolean;
    lastError: string | null;
    successCount: number;
    errorCount: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
    description?: string;
  };
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly dataKey = 'integrations';

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  async getAllIntegrations(): Promise<Integration[]> {
    try {
      const data = this.db.readSync();
      const integrations = data[this.dataKey] || [];
      
      // Decrypt sensitive data before returning
      return integrations.map(integration => this.decryptIntegrationSecrets(integration));
    } catch (error) {
      this.logger.error('Failed to retrieve integrations', error.stack);
      throw new Error('Failed to retrieve integrations');
    }
  }

  async getIntegrationById(id: string): Promise<Integration | null> {
    try {
      const data = this.db.readSync();
      const integrations = data[this.dataKey] || [];
      const integration = integrations.find(int => int.id === id);
      
      return integration ? this.decryptIntegrationSecrets(integration) : null;
    } catch (error) {
      this.logger.error(`Failed to retrieve integration ${id}`, error.stack);
      throw new Error('Failed to retrieve integration');
    }
  }

  async getSyncStatus(id: string): Promise<any | null> {
    try {
      const integration = await this.getIntegrationById(id);
      if (!integration) return null;

      return {
        id: integration.id,
        name: integration.name,
        status: integration.status,
        syncStatus: integration.syncStatus,
        lastSync: integration.syncStatus.lastSync,
        nextSync: integration.syncStatus.nextSync,
        isRunning: integration.syncStatus.isRunning,
      };
    } catch (error) {
      this.logger.error(`Failed to get sync status for ${id}`, error.stack);
      throw new Error('Failed to get sync status');
    }
  }

  async createIntegration(createDto: CreateIntegrationDto): Promise<Integration> {
    try {
      const data = this.db.readSync();
      const integrations = data[this.dataKey] || [];

      // Check for duplicate names
      if (integrations.some(int => int.name === createDto.name)) {
        throw new Error('Integration with this name already exists');
      }

      const newIntegration: Integration = {
        id: uuidv4(),
        name: createDto.name,
        type: createDto.type,
        provider: createDto.provider,
        configuration: this.encryptConfiguration(createDto.configuration),
        status: 'inactive',
        syncStatus: {
          lastSync: null,
          nextSync: this.calculateNextSync(createDto.syncFrequency || 'manual'),
          frequency: createDto.syncFrequency || 'manual',
          isRunning: false,
          lastError: null,
          successCount: 0,
          errorCount: 0,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createDto.createdBy || 'system',
          tags: createDto.tags || [],
          description: createDto.description,
        },
      };

      integrations.push(newIntegration);
      data[this.dataKey] = integrations;
      this.db.writeSync(data);

      this.logger.log(`Created integration: ${newIntegration.name} (${newIntegration.id})`);
      
      // Test connection if requested
      if (createDto.testConnection) {
        await this.testConnection(newIntegration.id);
      }

      return this.decryptIntegrationSecrets(newIntegration);
    } catch (error) {
      this.logger.error('Failed to create integration', error.stack);
      throw error;
    }
  }

  async updateIntegration(id: string, updateDto: UpdateIntegrationDto): Promise<Integration | null> {
    try {
      const data = this.db.readSync();
      const integrations = data[this.dataKey] || [];
      const index = integrations.findIndex(int => int.id === id);

      if (index === -1) return null;

      const existingIntegration = integrations[index];

      // Check for name conflicts if name is being updated
      if (updateDto.name && updateDto.name !== existingIntegration.name) {
        if (integrations.some(int => int.name === updateDto.name && int.id !== id)) {
          throw new Error('Integration with this name already exists');
        }
      }

      const updatedIntegration: Integration = {
        ...existingIntegration,
        name: updateDto.name || existingIntegration.name,
        type: updateDto.type || existingIntegration.type,
        provider: updateDto.provider || existingIntegration.provider,
        configuration: updateDto.configuration 
          ? this.encryptConfiguration(updateDto.configuration)
          : existingIntegration.configuration,
        syncStatus: {
          ...existingIntegration.syncStatus,
          frequency: updateDto.syncFrequency || existingIntegration.syncStatus.frequency,
          nextSync: updateDto.syncFrequency 
            ? this.calculateNextSync(updateDto.syncFrequency)
            : existingIntegration.syncStatus.nextSync,
        },
        metadata: {
          ...existingIntegration.metadata,
          updatedAt: new Date(),
          tags: updateDto.tags || existingIntegration.metadata.tags,
          description: updateDto.description !== undefined 
            ? updateDto.description 
            : existingIntegration.metadata.description,
        },
      };

      integrations[index] = updatedIntegration;
      data[this.dataKey] = integrations;
      this.db.writeSync(data);

      this.logger.log(`Updated integration: ${updatedIntegration.name} (${id})`);
      return this.decryptIntegrationSecrets(updatedIntegration);
    } catch (error) {
      this.logger.error(`Failed to update integration ${id}`, error.stack);
      throw error;
    }
  }

  async updateIntegrationStatus(id: string, status: 'active' | 'inactive' | 'error'): Promise<Integration | null> {
    try {
      const data = this.db.readSync();
      const integrations = data[this.dataKey] || [];
      const index = integrations.findIndex(int => int.id === id);

      if (index === -1) return null;

      integrations[index].status = status;
      integrations[index].metadata.updatedAt = new Date();

      data[this.dataKey] = integrations;
      this.db.writeSync(data);

      this.logger.log(`Updated integration status: ${id} -> ${status}`);
      return this.decryptIntegrationSecrets(integrations[index]);
    } catch (error) {
      this.logger.error(`Failed to update integration status ${id}`, error.stack);
      throw error;
    }
  }

  async triggerSync(id: string): Promise<any | null> {
    try {
      const integration = await this.getIntegrationById(id);
      if (!integration) return null;

      if (integration.status !== 'active') {
        throw new Error('Integration must be active to trigger sync');
      }

      if (integration.syncStatus.isRunning) {
        throw new Error('Sync is already running for this integration');
      }

      // Update sync status to running
      await this.updateSyncStatus(id, { isRunning: true, lastError: null });

      // Simulate sync process based on integration type
      const syncResult = await this.performSync(integration);

      // Update sync status based on result
      await this.updateSyncStatus(id, {
        isRunning: false,
        lastSync: new Date(),
        nextSync: this.calculateNextSync(integration.syncStatus.frequency),
        successCount: syncResult.success ? integration.syncStatus.successCount + 1 : integration.syncStatus.successCount,
        errorCount: syncResult.success ? integration.syncStatus.errorCount : integration.syncStatus.errorCount + 1,
        lastError: syncResult.error || null,
      });

      this.logger.log(`Sync completed for integration ${id}: ${syncResult.success ? 'SUCCESS' : 'FAILED'}`);
      
      return {
        integrationId: id,
        success: syncResult.success,
        message: syncResult.message,
        timestamp: new Date(),
        recordsProcessed: syncResult.recordsProcessed || 0,
      };
    } catch (error) {
      // Update sync status to not running with error
      await this.updateSyncStatus(id, { 
        isRunning: false, 
        lastError: error.message,
        errorCount: (await this.getIntegrationById(id))?.syncStatus.errorCount + 1 || 1,
      });
      
      this.logger.error(`Sync failed for integration ${id}`, error.stack);
      throw error;
    }
  }

  private async updateSyncStatus(id: string, updates: Partial<Integration['syncStatus']>): Promise<void> {
    const data = this.db.readSync();
    const integrations = data[this.dataKey] || [];
    const index = integrations.findIndex(int => int.id === id);

    if (index !== -1) {
      integrations[index].syncStatus = { ...integrations[index].syncStatus, ...updates };
      integrations[index].metadata.updatedAt = new Date();
      data[this.dataKey] = integrations;
      this.db.writeSync(data);
    }
  }

  private async performSync(integration: Integration): Promise<{ success: boolean; message: string; error?: string; recordsProcessed?: number }> {
    try {
      // Get API key for external service calls
      const apiKey = await this.crypto.getApiKey(integration.provider);
      
      switch (integration.type) {
        case 'api':
          return await this.syncApiIntegration(integration, apiKey);
        case 'webhook':
          return await this.syncWebhookIntegration(integration);
        case 'database':
          return await this.syncDatabaseIntegration(integration);
        case 'file':
          return await this.syncFileIntegration(integration);
        case 'email':
          return await this.syncEmailIntegration(integration, apiKey);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      return {
        success: false,
        message: 'Sync failed',
        error: error.message,
      };
    }
  }

  private async syncApiIntegration(integration: Integration, apiKey: string): Promise<any> {
    // Simulate API sync
    const recordsProcessed = Math.floor(Math.random() * 100) + 1;
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      message: success ? `API sync completed successfully` : 'API sync failed',
      recordsProcessed,
      error: success ? undefined : 'Connection timeout',
    };
  }

  private async syncWebhookIntegration(integration: Integration): Promise<any> {
    // Simulate webhook sync
    const success = Math.random() > 0.05; // 95% success rate
    
    return {
      success,
      message: success ? 'Webhook sync completed' : 'Webhook sync failed',
      recordsProcessed: success ? Math.floor(Math.random() * 50) + 1 : 0,
      error: success ? undefined : 'Webhook endpoint unreachable',
    };
  }

  private async syncDatabaseIntegration(integration: Integration): Promise<any> {
    // Simulate database sync
    const recordsProcessed = Math.floor(Math.random() * 200) + 10;
    const success = Math.random() > 0.08; // 92% success rate
    
    return {
      success,
      message: success ? 'Database sync completed' : 'Database sync failed',
      recordsProcessed,
      error: success ? undefined : 'Database connection failed',
    };
  }

  private async syncFileIntegration(integration: Integration): Promise<any> {
    // Simulate file sync
    const recordsProcessed = Math.floor(Math.random() * 150) + 5;
    const success = Math.random() > 0.12; // 88% success rate
    
    return {
      success,
      message: success ? 'File sync completed' : 'File sync failed',
      recordsProcessed,
      error: success ? undefined : 'File not found or corrupted',
    };
  }

  private async syncEmailIntegration(integration: Integration, apiKey: string): Promise<any> {
    // Simulate email sync
    const recordsProcessed = Math.floor(Math.random() * 30) + 1;
    const success = Math.random() > 0.15; // 85% success rate
    
    return {
      success,
      message: success ? 'Email sync completed' : 'Email sync failed',
      recordsProcessed,
      error: success ? undefined : 'SMTP authentication failed',
    };
  }

  private async testConnection(id: string): Promise<boolean> {
    try {
      const integration = await this.getIntegrationById(id);
      if (!integration) return false;

      // Simulate connection test
      const connectionSuccess = Math.random() > 0.2; // 80% success rate

      if (connectionSuccess) {
        await this.updateIntegrationStatus(id, 'active');
        this.logger.log(`Connection test passed for integration ${id}`);
      } else {
        await this.updateIntegrationStatus(id, 'error');
        this.logger.warn(`Connection test failed for integration ${id}`);
      }

      return connectionSuccess;
    } catch (error) {
      this.logger.error(`Connection test error for integration ${id}`, error.stack);
      await this.updateIntegrationStatus(id, 'error');
      return false;
    }
  }

  private encryptConfiguration(config: any): any {
    if (!config) return config;

    const encryptedConfig = { ...config };
    
    // Encrypt sensitive fields
    if (encryptedConfig.apiKey) {
      encryptedConfig.apiKey = this.crypto.encrypt(encryptedConfig.apiKey);
    }
    if (encryptedConfig.credentials && typeof encryptedConfig.credentials === 'object') {
      encryptedConfig.credentials = this.crypto.encrypt(JSON.stringify(encryptedConfig.credentials));
    }

    return encryptedConfig;
  }

  private decryptIntegrationSecrets(integration: Integration): Integration {
    if (!integration.configuration) return integration;

    const decryptedIntegration = { ...integration };
    const decryptedConfig = { ...integration.configuration };

    try {
      // Decrypt sensitive fields
      if (decryptedConfig.apiKey && typeof decryptedConfig.apiKey === 'string') {
        decryptedConfig.apiKey = this.crypto.decrypt(decryptedConfig.apiKey);
      }
      if (decryptedConfig.credentials && typeof decryptedConfig.credentials === 'string') {
        decryptedConfig.credentials = JSON.parse(this.crypto.decrypt(decryptedConfig.credentials));
      }

      decryptedIntegration.configuration = decryptedConfig;
    } catch (error) {
      this.logger.warn(`Failed to decrypt secrets for integration ${integration.id}`, error.message);
    }

    return decryptedIntegration;
  }

  private calculateNextSync(frequency: string): Date | null {
    if (frequency === 'manual') return null;

    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth;
      default:
        return null;
    }
  }
}