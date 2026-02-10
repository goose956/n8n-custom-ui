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
      const data = {
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
