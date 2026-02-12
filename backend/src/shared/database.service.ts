import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';

/**
 * Consistent database path resolution for all services.
 * Always resolves to backend/db.json relative to the project root.
 */
@Injectable()
export class DatabaseService {
  readonly dbPath: string;

  constructor() {
    // __dirname at runtime is backend/dist/shared, so ../../db.json → backend/db.json
    this.dbPath = path.join(__dirname, '../../db.json');
  }

  /** Synchronous read — for use in methods that are already sync. */
  readSync(): any {
    try {
      if (!fs.existsSync(this.dbPath)) return {};
      return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  /** Synchronous write. */
  writeSync(data: any): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  /** Async read — preferred for new code. */
  async read(): Promise<any> {
    try {
      const content = await fsp.readFile(this.dbPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /** Async write — preferred for new code. */
  async write(data: any): Promise<void> {
    await fsp.writeFile(this.dbPath, JSON.stringify(data, null, 2));
  }

  /** Check if DB file exists. */
  exists(): boolean {
    return fs.existsSync(this.dbPath);
  }
}
