import { Injectable } from'@nestjs/common';
import * as fs from'fs';
import { DatabaseService } from'../shared/database.service';

export interface Page {
 id: number;
 app_id: number;
 page_type: string;
 title: string;
 content_json?: Record<string, unknown>;
 created_at?: string;
 updated_at?: string;
}

interface DatabaseSchema {
 n8nUrl?: string;
 n8nApiKey?: string;
 apiKeys?: any[];
 apps?: any[];
 pages?: Page[];
}

@Injectable()
export class PagesService {
 constructor(private readonly db: DatabaseService) {}

 private readDatabase(): DatabaseSchema {
 const data = this.db.readSync();
 if (!data.pages) data.pages = [];
 return data;
 }

 private writeDatabase(data: DatabaseSchema): void {
 this.db.writeSync(data);
 }

 private getNextPageId(): number {
 const db = this.readDatabase();
 const pages = db.pages || [];
 return pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
 }

 create(createPageDto: { app_id: number; page_type: string; title: string; content_json?: Record<string, unknown> }): Page {
 const db = this.readDatabase();
 const nextId = this.getNextPageId();

 const page: Page = {
 id: nextId,
 app_id: createPageDto.app_id,
 page_type: createPageDto.page_type,
 title: createPageDto.title,
 content_json: createPageDto.content_json || {},
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 };

 if (!db.pages) {
 db.pages = [];
 }
 db.pages.push(page);
 this.writeDatabase(db);
 return page;
 }

 findAll(app_id?: number): Page[] {
 const db = this.readDatabase();
 const pages = db.pages || [];
 if (app_id) {
 return pages.filter((p) => p.app_id === app_id);
 }
 return pages;
 }

 findOne(id: number): Page | undefined {
 const db = this.readDatabase();
 const pages = db.pages || [];
 return pages.find((p) => p.id === id);
 }

 update(id: number, updatePageDto: Partial<Page>): Page | undefined {
 const db = this.readDatabase();
 const pages = db.pages || [];
 const pageIndex = pages.findIndex((p) => p.id === id);

 if (pageIndex === -1) return undefined;

 const updatedPage = {
 ...pages[pageIndex],
 ...updatePageDto,
 updated_at: new Date().toISOString(),
 };
 pages[pageIndex] = updatedPage;
 db.pages = pages;
 this.writeDatabase(db);
 return updatedPage;
 }

 delete(id: number): boolean {
 const db = this.readDatabase();
 const pages = db.pages || [];
 const initialLength = pages.length;

 db.pages = pages.filter((p) => p.id !== id);

 if (db.pages.length === initialLength) {
 return false;
 }

 this.writeDatabase(db);
 return true;
 }

 /**
  * Delete all pages matching a given app_id and page_type.
  * Returns the number of deleted pages.
  */
 deleteByAppAndType(app_id: number, page_type: string): number {
 const db = this.readDatabase();
 const pages = db.pages || [];
 const before = pages.length;

 db.pages = pages.filter(
 (p) => !(p.app_id === app_id && p.page_type === page_type),
 );

 const deleted = before - db.pages.length;
 if (deleted > 0) {
 this.writeDatabase(db);
 }
 return deleted;
 }
}
