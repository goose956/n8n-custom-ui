import { Controller, Get, Post, Param } from '@nestjs/common';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  error?: string;
}

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'n8n Custom UI Backend is running',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check health of all services: backend, frontend, n8n
   */
  @Get('api/health/status')
  async fullStatus() {
    const checks = await Promise.all([
      this.checkService('backend', 'http://localhost:3000'),
      this.checkService('frontend', 'http://localhost:5173'),
      this.checkService('n8n', 'http://localhost:5678'),
    ]);

    const allOnline = checks.every((c) => c.status === 'online');

    return {
      overall: allOnline ? 'healthy' : 'degraded',
      services: checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restart a service via pm2 (if pm2 is managing the processes)
   */
  @Post('api/health/restart/:service')
  async restartService(@Param('service') service: string) {
    const pm2Names: Record<string, string> = {
      backend: 'n8n-backend',
      frontend: 'n8n-frontend',
      n8n: 'n8n-engine',
    };

    const pm2Name = pm2Names[service];
    if (!pm2Name) {
      return { success: false, error: `Unknown service "${service}". Use: backend, frontend, n8n` };
    }

    try {
      // Try pm2 first
      await execAsync(`pm2 restart ${pm2Name}`);
      return {
        success: true,
        message: `Service "${service}" restart triggered via pm2`,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // pm2 not available or service not managed by pm2
      return {
        success: false,
        error: `Could not restart "${service}". Make sure pm2 is running (pm2 start ecosystem.config.js)`,
        hint: 'Run: npm install -g pm2 && pm2 start ecosystem.config.js',
      };
    }
  }

  private async checkService(name: string, url: string): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await axios.get(url, { timeout: 5000 });
      return {
        name,
        url,
        status: 'online',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name,
        url,
        status: 'offline',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}
