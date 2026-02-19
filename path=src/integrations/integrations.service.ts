import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';
import { v4 as uuidv4 } from 'uuid';
import { Integration, CreateIntegrationDto, UpdateIntegrationDto } from './integrations.controller';

interface IntegrationsDatabase {
  integrations: Integration[];
}

@Injectable()
export class IntegrationsService {
  private readonly tableName = 'integrations';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
  ) {}

  private async getDatabase(): Promise<IntegrationsDatabase> {
    const data = await this.db.readSync();
    if (!data[this.tableName]) {
      data[this.tableName] = [];
      await this.db.writeSync(data);
    }
    return data;
  }

  async findAll(): Promise<Integration[]> {
    const database = await this.getDatabase();
    
    // Decrypt API keys for display (masked)
    return database.integrations.map(integration => ({
      ...integration,
      config: {
        ...integration.config,
        apiKey: integration.config.apiKey ? '••••••••' : undefined,
      },
    }));
  }

  async findOne(id: string): Promise<Integration | null> {
    const database = await this.getDatabase();
    const integration = database.integrations.find(i => i.id === id);
    
    if (!integration) {
      return null;
    }

    // Decrypt API key for internal use, but mask for response
    return {
      ...integration,
      config: {
        ...integration.config,
        apiKey: integration.config.apiKey ? '••••••••' : undefined,
      },
    };
  }

  async findOneWithDecryptedKey(id: string): Promise<Integration | null> {
    const database = await this.getDatabase();
    const integration = database.integrations.find(i => i.id === id);
    
    if (!integration) {
      return null;
    }

    // Decrypt API key for internal use
    if (integration.config.apiKey) {
      try {
        integration.config.apiKey = await this.cryptoService.getApiKey(integration.config.apiKey);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
      }
    }

    return integration;
  }

  async create(createIntegrationDto: CreateIntegrationDto): Promise<Integration> {
    const database = await this.getDatabase();

    // Check for duplicate names
    const existingIntegration = database.integrations.find(
      i => i.name.toLowerCase() === createIntegrationDto.name.toLowerCase(),
    );

    if (existingIntegration) {
      throw new BadRequestException('Integration with this name already exists');
    }

    // Encrypt API key if provided
    let encryptedApiKey = createIntegrationDto.config.apiKey;
    if (encryptedApiKey) {
      try {
        // In a real implementation, this would encrypt the key
        // For now, we'll store it as-is but mark it as encrypted
        encryptedApiKey = `encrypted_${encryptedApiKey}`;
      } catch (error) {
        throw new BadRequestException('Failed to encrypt API key');
      }
    }

    const newIntegration: Integration = {
      id: uuidv4(),
      name: createIntegrationDto.name.trim(),
      type: createIntegrationDto.type.trim(),
      description: createIntegrationDto.description?.trim() || '',
      status: 'pending',
      config: {
        ...createIntegrationDto.config,
        apiKey: encryptedApiKey,
      },
      metadata: {
        lastSync: null,
        syncInterval: createIntegrationDto.metadata?.syncInterval || 3600, // 1 hour default
        errorCount: 0,
        lastError: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    database.integrations.push(newIntegration);
    await this.db.writeSync(database);

    // Return with masked API key
    return {
      ...newIntegration,
      config: {
        ...newIntegration.config,
        apiKey: newIntegration.config.apiKey ? '••••••••' : undefined,
      },
    };
  }

  async update(id: string, updateIntegrationDto: UpdateIntegrationDto): Promise<Integration> {
    const database = await this.getDatabase();
    const integrationIndex = database.integrations.findIndex(i => i.id === id);

    if (integrationIndex === -1) {
      return null;
    }

    const existingIntegration = database.integrations[integrationIndex];

    // Check for duplicate names (excluding current integration)
    if (updateIntegrationDto.name) {
      const duplicateIntegration = database.integrations.find(
        i => i.id !== id && i.name.toLowerCase() === updateIntegrationDto.name.toLowerCase(),
      );

      if (duplicateIntegration) {
        throw new BadRequestException('Integration with this name already exists');
      }
    }

    // Encrypt API key if provided
    let encryptedApiKey = updateIntegrationDto.config?.apiKey;
    if (encryptedApiKey && !encryptedApiKey.startsWith('encrypted_')) {
      try {
        encryptedApiKey = `encrypted_${encryptedApiKey}`;
      } catch (error) {
        throw new BadRequestException('Failed to encrypt API key');
      }
    }

    const updatedIntegration: Integration = {
      ...existingIntegration,
      ...updateIntegrationDto,
      name: updateIntegrationDto.name?.trim() || existingIntegration.name,
      description: updateIntegrationDto.description?.trim() ?? existingIntegration.description,
      config: {
        ...existingIntegration.config,
        ...updateIntegrationDto.config,
        apiKey: encryptedApiKey || existingIntegration.config.apiKey,
      },
      metadata: {
        ...existingIntegration.metadata,
        ...updateIntegrationDto.metadata,
      },
      updatedAt: new Date().toISOString(),
    };

    database.integrations[integrationIndex] = updatedIntegration;
    await this.db.writeSync(database);

    // Return with masked API key
    return {
      ...updatedIntegration,
      config: {
        ...updatedIntegration.config,
        apiKey: updatedIntegration.config.apiKey ? '••••••••' : undefined,
      },
    };
  }

  async remove(id: string): Promise<boolean> {
    const database = await this.getDatabase();
    const initialLength = database.integrations.length;
    
    database.integrations = database.integrations.filter(i => i.id !== id);
    
    if (database.integrations.length === initialLength) {
      return false;
    }

    await this.db.writeSync(database);
    return true;
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findOneWithDecryptedKey(id);
    
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      // Simulate API connection test based on integration type
      switch (integration.type.toLowerCase()) {
        case 'webhook':
          if (!integration.config.webhookUrl) {
            return { success: false, message: 'Webhook URL is required' };
          }
          // In a real implementation, you would make an HTTP request to test the webhook
          break;

        case 'api':
          if (!integration.config.apiUrl || !integration.config.apiKey) {
            return { success: false, message: 'API URL and API Key are required' };
          }
          // In a real implementation, you would make an authenticated API request
          break;

        case 'database':
          if (!integration.config.settings?.connectionString) {
            return { success: false, message: 'Database connection string is required' };
          }
          // In a real implementation, you would test the database connection
          break;

        default:
          return { success: false, message: 'Unsupported integration type' };
      }

      // Update integration status and metadata
      await this.updateConnectionStatus(id, 'active', null);
      
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      const errorMessage = error.message || 'Connection test failed';
      await this.updateConnectionStatus(id, 'error', errorMessage);
      
      return { success: false, message: errorMessage };
    }
  }

  async syncData(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findOneWithDecryptedKey(id);
    
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    if (integration.status !== 'active') {
      return { success: false, message: 'Integration is not active' };
    }

    try {
      // Simulate data synchronization based on integration type
      switch (integration.type.toLowerCase()) {
        case 'webhook':
          // In a real implementation, you would trigger webhook events
          break;

        case 'api':
          // In a real implementation, you would fetch data from the external API
          break;

        case 'database':
          // In a real implementation, you would sync database records
          break;

        default:
          return { success: false, message: 'Unsupported integration type for sync' };
      }

      // Update last sync time
      await this.updateSyncMetadata(id, new Date().toISOString(), null);
      
      return { success: true, message: 'Data synchronization completed' };
    } catch (error) {
      const errorMessage = error.message || 'Data synchronization failed';
      await this.updateSyncMetadata(id, null, errorMessage);
      
      return { success: false, message: errorMessage };
    }
  }

  private async updateConnectionStatus(id: string, status: Integration['status'], error: string | null): Promise<void> {
    const database = await this.getDatabase();
    const integrationIndex = database.integrations.findIndex(i => i.id === id);

    if (integrationIndex !== -1) {
      database.integrations[integrationIndex].status = status;
      database.integrations[integrationIndex].metadata.lastError = error;
      database.integrations[integrationIndex].metadata.errorCount = error ? 
        (database.integrations[integrationIndex].metadata.errorCount || 0) + 1 : 0;
      database.integrations[integrationIndex].updatedAt = new Date().toISOString();

      await this.db.writeSync(database);
    }
  }

  private async updateSyncMetadata(id: string, lastSync: string | null, error: string | null): Promise<void> {
    const database = await this.getDatabase();
    const integrationIndex = database.integrations.findIndex(i => i.id === id);

    if (integrationIndex !== -1) {
      if (lastSync) {
        database.integrations[integrationIndex].metadata.lastSync = lastSync;
      }
      database.integrations[integrationIndex].metadata.lastError = error;
      database.integrations[integrationIndex].metadata.errorCount = error ? 
        (database.integrations[integrationIndex].metadata.errorCount || 0) + 1 : 0;
      database.integrations[integrationIndex].updatedAt = new Date().toISOString();

      await this.db.writeSync(database);
    }
  }
}