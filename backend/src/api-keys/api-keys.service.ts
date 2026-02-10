import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const DB_FILE = path.join(__dirname, '../../db.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';

interface ApiKey {
  name: string;
  value: string;
  createdAt: string;
  lastUsed?: string;
}

@Injectable()
export class ApiKeysService {
  private encryptionKey: Buffer;

  constructor() {
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

  async saveApiKey(name: string, value: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!name || !value) {
        return { success: false, message: 'API key name and value are required' };
      }

      let data = { n8nUrl: '', n8nApiKey: '', apiKeys: [] };
      if (fs.existsSync(DB_FILE)) {
        data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      }

      if (!data.apiKeys) {
        data.apiKeys = [];
      }

      // Remove existing key with same name
      data.apiKeys = data.apiKeys.filter((k: ApiKey) => k.name !== name);

      // Add new key
      data.apiKeys.push({
        name,
        value: this.encrypt(value),
        createdAt: new Date().toISOString(),
      });

      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return { success: true, message: `API key "${name}" saved successfully` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to save API key: ${message}` };
    }
  }

  async getApiKeys(): Promise<{ success: boolean; keys: any[]; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: true, keys: [], message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
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

  async getApiKey(name: string): Promise<{ success: boolean; value?: string; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: false, message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const apiKey = (data.apiKeys || []).find((k: ApiKey) => k.name === name);

      if (!apiKey) {
        return { success: false, message: `API key "${name}" not found` };
      }

      const decryptedValue = this.decrypt(apiKey.value);
      return { success: true, value: decryptedValue, message: 'API key retrieved' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to retrieve API key: ${message}` };
    }
  }

  async deleteApiKey(name: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { success: false, message: 'No API keys saved' };
      }

      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const initialLength = (data.apiKeys || []).length;

      data.apiKeys = (data.apiKeys || []).filter((k: ApiKey) => k.name !== name);

      if (data.apiKeys.length === initialLength) {
        return { success: false, message: `API key "${name}" not found` };
      }

      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return { success: true, message: `API key "${name}" deleted successfully` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to delete API key: ${message}` };
    }
  }
}
