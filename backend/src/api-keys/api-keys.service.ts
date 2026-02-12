import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ApiKey {
  name: string;
  value: string;
  createdAt: string;
  lastUsed?: string;
}

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  async saveApiKey(name: string, value: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!name || !value) {
        return { success: false, message: 'API key name and value are required' };
      }

      let data: any = { n8nUrl: '', n8nApiKey: '', apiKeys: [] as ApiKey[] };
      if (this.db.exists()) {
        data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      }

      if (!data.apiKeys) {
        data.apiKeys = [];
      }

      // Remove existing key with same name
      data.apiKeys = (data.apiKeys as ApiKey[]).filter((k: ApiKey) => k.name !== name);

      // Add new key
      const newKey: ApiKey = {
        name,
        value: this.cryptoService.encrypt(value),
        createdAt: new Date().toISOString(),
      };
      (data.apiKeys as ApiKey[]).push(newKey);

      fs.writeFileSync(this.db.dbPath, JSON.stringify(data, null, 2));
      return { success: true, message: `API key "${name}" saved successfully` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to save API key: ${message}` };
    }
  }

  async getApiKeys(): Promise<{ success: boolean; keys: any[]; message: string }> {
    try {
      if (!this.db.exists()) {
        return { success: true, keys: [], message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      const keys = (data.apiKeys || []).map((k: ApiKey) => ({
        name: k.name,
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
      }));

      return { success: true, keys, message: `Found ${keys.length} API keys` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, keys: [], message: `Failed to fetch API keys: ${message}` };
    }
  }

  /**
   * Get a masked preview of an API key (safe for frontend display).
   * Shows first 4 and last 4 characters only.
   */
  async getApiKeyMasked(name: string): Promise<{ success: boolean; value?: string; message: string }> {
    try {
      if (!this.db.exists()) {
        return { success: false, message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      const apiKey = (data.apiKeys || []).find((k: ApiKey) => k.name === name);

      if (!apiKey) {
        return { success: false, message: `API key "${name}" not found` };
      }

      const decryptedValue = this.cryptoService.decrypt(apiKey.value);
      const masked = decryptedValue.length > 8
        ? decryptedValue.slice(0, 4) + '••••••••' + decryptedValue.slice(-4)
        : '••••••••';
      return { success: true, value: masked, message: 'API key retrieved (masked)' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to retrieve API key: ${message}` };
    }
  }

  /**
   * Get the full decrypted API key value. 
   * FOR INTERNAL SERVER-SIDE USE ONLY — never expose via HTTP endpoint.
   */
  async getApiKeyDecrypted(name: string): Promise<string | null> {
    try {
      if (!this.db.exists()) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      const apiKey = (data.apiKeys || []).find((k: ApiKey) => k.name === name);

      if (!apiKey) {
        return null;
      }

      return this.cryptoService.decrypt(apiKey.value);
    } catch (error) {
      console.error(`Failed to decrypt API key "${name}":`, error);
      return null;
    }
  }

  async deleteApiKey(name: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.db.exists()) {
        return { success: false, message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      const initialLength = (data.apiKeys || []).length;

      data.apiKeys = (data.apiKeys || []).filter((k: ApiKey) => k.name !== name);

      if (data.apiKeys.length === initialLength) {
        return { success: false, message: `API key "${name}" not found` };
      }

      fs.writeFileSync(this.db.dbPath, JSON.stringify(data, null, 2));
      return { success: true, message: `API key "${name}" deleted successfully` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to delete API key: ${message}` };
    }
  }
}
