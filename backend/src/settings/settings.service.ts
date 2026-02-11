import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

const DB_FILE = path.join(__dirname, '../../db.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';

interface SettingsDto {
  n8nUrl: string;
  n8nApiKey: string;
}

@Injectable()
export class SettingsService {
  private encryptionKey: Buffer;

  constructor() {
    // Create a deterministic key from the encryption key
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(ENCRYPTION_KEY)
      .digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async saveSettings(settings: SettingsDto): Promise<{ success: boolean; message: string }> {
    try {
      const encryptedApiKey = this.encrypt(settings.n8nApiKey);

      // Read existing data first to preserve apps, pages, etc.
      let existingData: any = {};
      if (fs.existsSync(DB_FILE)) {
        existingData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      }

      const data = {
        ...existingData,
        n8nUrl: settings.n8nUrl,
        n8nApiKey: encryptedApiKey,
        lastUpdated: new Date().toISOString(),
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return { success: true, message: 'Settings saved successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to save settings: ${message}` };
    }
  }

  async loadSettings(): Promise<{ n8nUrl: string; n8nApiKey?: string } | null> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        n8nUrl: data.n8nUrl,
        // Don't return the actual API key to frontend
      };
    } catch (error) {
      return null;
    }
  }

  async testN8nConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: false, message: 'No settings saved' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const decryptedApiKey = this.decrypt(data.n8nApiKey);

      const response = await axios.get(`${data.n8nUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': decryptedApiKey,
        },
        timeout: 5000,
      });

      return { success: true, message: `Connected successfully! Found ${response.data.data.length} workflows` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Connection failed: ${message}` };
    }
  }

  async getWorkflows(): Promise<{ success: boolean; workflows?: any[]; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: false, message: 'No settings saved' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const decryptedApiKey = this.decrypt(data.n8nApiKey);

      const response = await axios.get(`${data.n8nUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': decryptedApiKey,
        },
        timeout: 5000,
      });

      return { 
        success: true, 
        workflows: response.data.data,
        message: `Found ${response.data.data.length} workflows`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to fetch workflows: ${message}` };
    }
  }

  async testIntegrationKey(service: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: false, message: 'No API keys saved yet' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const apiKeys = data.apiKeys || [];
      
      const keyEntry = apiKeys.find((k: any) => k.name === service);
      if (!keyEntry) {
        return { success: false, message: `${service} API key not found or not configured` };
      }

      const apiKey = this.decrypt(keyEntry.value);

      // Test based on service type
      switch (service.toLowerCase()) {
        case 'openai':
          return await this.testOpenAIKey(apiKey);
        case 'openrouter':
          return await this.testOpenRouterKey(apiKey);
        case 'make':
          return await this.testMakeKey(apiKey);
        case 'zapier':
          return await this.testZapierKey(apiKey);
        default:
          return { success: false, message: `Unknown service: ${service}` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Test failed: ${message}` };
    }
  }

  private async testOpenAIKey(apiKey: string): Promise<{ success: boolean; message: string; models?: string[] }> {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      const models = response.data.data?.map((m: any) => m.id) || [];
      const modelCount = models.length;
      
      return { 
        success: true, 
        message: `OpenAI API key is valid! Found ${modelCount} available models.`,
        models: models 
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, message: 'OpenAI API key is invalid (401 Unauthorized)' };
        }
        return { success: false, message: `OpenAI test failed: ${error.response?.status} - ${error.response?.statusText}` };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `OpenAI test failed: ${message}` };
    }
  }

  private async testOpenRouterKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      const data = response.data.data || response.data;
      const status = data.status || 'active';
      return { success: true, message: `OpenRouter API key is valid! Status: ${status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, message: 'OpenRouter API key is invalid (401 Unauthorized)' };
        }
        return { success: false, message: `OpenRouter test failed: ${error.response?.status}` };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `OpenRouter test failed: ${message}` };
    }
  }

  private async testMakeKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://www.make.com/api/v1/validate-token', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      return { success: true, message: `Make.com API key is valid!` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, message: 'Make.com API key is invalid (401 Unauthorized)' };
        }
        return { success: false, message: `Make.com test failed: ${error.response?.status}` };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Make.com test failed: ${message}` };
    }
  }

  private async testZapierKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get('https://zapier.com/api/v1/user', {
        headers: {
          'X-API-Key': apiKey,
        },
        timeout: 5000,
      });

      const data = response.data.data || response.data;
      return { success: true, message: `Zapier API key is valid!` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, message: 'Zapier API key is invalid (401 Unauthorized)' };
        }
        return { success: false, message: `Zapier test failed: ${error.response?.status}` };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Zapier test failed: ${message}` };
    }
  }

  // Sync versions for use in other services
  loadSettingsSync(): any | null {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }

  decryptSync(text: string): string {
    return this.decrypt(text);
  }

  encryptSync(text: string): string {
    return this.encrypt(text);
  }
}
