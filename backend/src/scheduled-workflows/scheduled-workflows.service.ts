import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import * as crypto from 'crypto';

export interface DataSource {
  fileName: string;
  columns: string[];
  rowCount: number;
  rows: string[][];
}

export interface ScheduledWorkflow {
  id: string;
  app_id: number;
  name: string;
  description: string;
  prompt: string;
  schedule: 'daily' | 'weekly' | 'monitor';
  enabled: boolean;
  runTime?: string;       // HH:mm e.g. "09:00"
  dayOfWeek?: number;     // 0 = Sunday, 1 = Monday … 6 = Saturday (used for weekly)
  dataSource?: DataSource;
  lastRun?: string;
  lastStatus?: 'success' | 'error';
  processedRows?: number;
  totalRows?: number;
  createdAt: string;
}

@Injectable()
export class ScheduledWorkflowsService {
  private readonly logger = new Logger(ScheduledWorkflowsService.name);

  constructor(private readonly db: DatabaseService) {}

  private getAll(): ScheduledWorkflow[] {
    const data = this.db.readSync();
    return data.scheduledWorkflows || [];
  }

  private saveAll(workflows: ScheduledWorkflow[]): void {
    const data = this.db.readSync();
    data.scheduledWorkflows = workflows;
    this.db.writeSync(data);
  }

  async list(appId?: number): Promise<{ success: boolean; workflows: ScheduledWorkflow[] }> {
    let workflows = this.getAll();
    if (appId) workflows = workflows.filter(w => w.app_id === appId);
    return { success: true, workflows };
  }

  async getOne(id: string): Promise<{ success: boolean; workflow?: ScheduledWorkflow; message?: string }> {
    const wf = this.getAll().find(w => w.id === id);
    if (!wf) return { success: false, message: 'Not found' };
    return { success: true, workflow: wf };
  }

  async create(body: {
    name: string;
    description?: string;
    prompt: string;
    schedule: 'daily' | 'weekly' | 'monitor';
    app_id?: number;
    runTime?: string;
    dayOfWeek?: number;
    dataSource?: DataSource;
  }): Promise<{ success: boolean; workflow: ScheduledWorkflow }> {
    const workflows = this.getAll();
    const wf: ScheduledWorkflow = {
      id: 'swf_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      app_id: body.app_id || 1,
      name: body.name,
      description: body.description || '',
      prompt: body.prompt,
      schedule: body.schedule,
      enabled: true,
      runTime: body.runTime || '09:00',
      dayOfWeek: body.dayOfWeek ?? (body.schedule === 'weekly' ? 1 : undefined),
      dataSource: body.dataSource,
      createdAt: new Date().toISOString(),
    };
    workflows.push(wf);
    this.saveAll(workflows);
    this.logger.log(`Created scheduled workflow: ${wf.name} (${wf.schedule})`);
    return { success: true, workflow: wf };
  }

  async update(id: string, body: Partial<ScheduledWorkflow>): Promise<{ success: boolean; workflow?: ScheduledWorkflow; message?: string }> {
    const workflows = this.getAll();
    const idx = workflows.findIndex(w => w.id === id);
    if (idx === -1) return { success: false, message: 'Not found' };

    const allowed = ['name', 'description', 'prompt', 'schedule', 'enabled', 'runTime', 'dayOfWeek', 'dataSource', 'lastRun', 'lastStatus', 'processedRows', 'totalRows'] as const;
    for (const key of allowed) {
      if ((body as any)[key] !== undefined) (workflows[idx] as any)[key] = (body as any)[key];
    }
    this.saveAll(workflows);
    this.logger.log(`Updated scheduled workflow: ${workflows[idx].name}`);
    return { success: true, workflow: workflows[idx] };
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const workflows = this.getAll();
    const filtered = workflows.filter(w => w.id !== id);
    if (filtered.length === workflows.length) return { success: false };
    this.saveAll(filtered);
    this.logger.log(`Deleted scheduled workflow: ${id}`);
    return { success: true };
  }
}
