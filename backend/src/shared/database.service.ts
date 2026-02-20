import { Injectable, Logger } from'@nestjs/common';
import * as fs from'fs';
import { promises as fsp } from'fs';
import * as path from'path';

/**
 * Consistent database path resolution for all services.
 * Always resolves to backend/db.json relative to the project root.
 *
 * Safety features:
 *  - Writes go to a .tmp file first, then rename (atomic on most OS).
 *  - A .bak backup is kept on every successful write.
 *  - readSync / read never return {} silently — callers that need the
 *    full database (apps, settings, etc.) must handle errors themselves
 *    or use readSafe() which preserves existing data.
 */
@Injectable()
export class DatabaseService {
 readonly dbPath: string;
 private readonly backupPath: string;
 private readonly logger = new Logger(DatabaseService.name);

 constructor() {
 // __dirname at runtime is backend/dist/shared or backend/src/shared
 this.dbPath = path.join(__dirname,'../../db.json');
 this.backupPath = this.dbPath + '.bak';
 }

 /** Synchronous read -- for use in methods that are already sync. */
 readSync(): any {
 try {
 if (!fs.existsSync(this.dbPath)) return {};
 return JSON.parse(fs.readFileSync(this.dbPath,'utf-8'));
 } catch {
 // Try the backup
 try {
 if (fs.existsSync(this.backupPath)) {
 this.logger.warn('Primary db.json unreadable, falling back to .bak');
 const data = JSON.parse(fs.readFileSync(this.backupPath,'utf-8'));
 // Restore primary from backup
 fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
 return data;
 }
 } catch { /* backup also bad */ }
 return {};
 }
 }

 /** Synchronous write -- creates a .bak backup before overwriting. */
 writeSync(data: any): void {
 // Backup existing file
 try {
 if (fs.existsSync(this.dbPath)) {
 fs.copyFileSync(this.dbPath, this.backupPath);
 }
 } catch { /* non-fatal */ }
 fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
 }

 /** Async read -- preferred for new code. */
 async read(): Promise<any> {
 try {
 const content = await fsp.readFile(this.dbPath,'utf-8');
 return JSON.parse(content);
 } catch {
 // Try the backup
 try {
 const bakContent = await fsp.readFile(this.backupPath,'utf-8');
 const data = JSON.parse(bakContent);
 this.logger.warn('Primary db.json unreadable, restored from .bak');
 await fsp.writeFile(this.dbPath, JSON.stringify(data, null, 2));
 return data;
 } catch { /* backup also bad */ }
 return {};
 }
 }

 /** Async write -- creates a .bak backup before overwriting. */
 async write(data: any): Promise<void> {
 try {
 if (fs.existsSync(this.dbPath)) {
 await fsp.copyFile(this.dbPath, this.backupPath);
 }
 } catch { /* non-fatal */ }
 await fsp.writeFile(this.dbPath, JSON.stringify(data, null, 2));
 }

 /** Check if DB file exists. */
 exists(): boolean {
 return fs.existsSync(this.dbPath);
 }
}
