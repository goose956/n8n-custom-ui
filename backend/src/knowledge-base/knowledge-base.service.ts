import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ─────────────────────────────────────────────────────────
export interface KBSource {
  type: 'pdf' | 'docx' | 'txt' | 'url' | 'text';
  filename?: string;
  url?: string;
  uploadedAt: string;
  pageCount?: number;
}

export interface KBChunk {
  id: string;
  text: string;
  sourceIndex: number;
  pageNumber?: number;
  tokenCount: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  sources: KBSource[];
  chunks: KBChunk[];
  totalChunks: number;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

// ── Chunking helpers ──────────────────────────────────────────────
const TARGET_CHUNK_TOKENS = 400;
const OVERLAP_TOKENS = 50;

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function chunkText(
  text: string,
  sourceIndex: number,
  pageNumber?: number,
): KBChunk[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: KBChunk[] = [];
  let buf: string[] = [];
  let bufTokens = 0;

  for (const sentence of sentences) {
    const st = estimateTokens(sentence);
    if (bufTokens + st > TARGET_CHUNK_TOKENS && buf.length > 0) {
      const chunkText = buf.join(' ').trim();
      if (chunkText.length > 20) {
        chunks.push({
          id: `chk_${Date.now()}_${chunks.length}_${Math.random().toString(36).substr(2, 4)}`,
          text: chunkText,
          sourceIndex,
          pageNumber,
          tokenCount: estimateTokens(chunkText),
        });
      }
      // Keep last few sentences as overlap
      const overlapSentences: string[] = [];
      let overlapCount = 0;
      for (let i = buf.length - 1; i >= 0 && overlapCount < OVERLAP_TOKENS; i--) {
        overlapSentences.unshift(buf[i]);
        overlapCount += estimateTokens(buf[i]);
      }
      buf = [...overlapSentences];
      bufTokens = overlapCount;
    }
    buf.push(sentence);
    bufTokens += st;
  }
  // Flush remaining
  if (buf.length > 0) {
    const chunkText = buf.join(' ').trim();
    if (chunkText.length > 20) {
      chunks.push({
        id: `chk_${Date.now()}_${chunks.length}_${Math.random().toString(36).substr(2, 4)}`,
        text: chunkText,
        sourceIndex,
        pageNumber,
        tokenCount: estimateTokens(chunkText),
      });
    }
  }
  return chunks;
}

// ── Simple keyword relevance scorer ───────────────────────────────
function scoreChunk(chunk: KBChunk, query: string): number {
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const chunkLower = chunk.text.toLowerCase();

  let score = 0;
  for (const word of queryWords) {
    const regex = new RegExp(`\\b${word}`, 'gi');
    const matches = chunkLower.match(regex);
    if (matches) score += matches.length;
  }
  // Boost shorter chunks that are very relevant (higher density)
  if (chunk.tokenCount > 0) {
    score = score / Math.sqrt(chunk.tokenCount);
  }
  return score;
}

// ── Service ───────────────────────────────────────────────────────
@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly uploadsDir: string;

  constructor(private readonly db: DatabaseService) {
    this.uploadsDir = path.join(__dirname, '../../public/kb-uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────
  private getAll(): KnowledgeBase[] {
    const data = this.db.readSync();
    return data.knowledgeBases || [];
  }

  private saveAll(kbs: KnowledgeBase[]): void {
    const data = this.db.readSync();
    data.knowledgeBases = kbs;
    this.db.writeSync(data);
  }

  list(): KnowledgeBase[] {
    return this.getAll().map((kb) => ({
      ...kb,
      chunks: [], // Don't send chunks in list view
    }));
  }

  getById(id: string): KnowledgeBase | undefined {
    return this.getAll().find((kb) => kb.id === id);
  }

  create(name: string, description: string): KnowledgeBase {
    const now = new Date().toISOString();
    const kb: KnowledgeBase = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      description,
      sources: [],
      chunks: [],
      totalChunks: 0,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    all.push(kb);
    this.saveAll(all);
    this.logger.log(`Created KB: ${kb.id} "${name}"`);
    return kb;
  }

  update(id: string, updates: Partial<Pick<KnowledgeBase, 'name' | 'description'>>): KnowledgeBase | null {
    const all = this.getAll();
    const idx = all.findIndex((kb) => kb.id === id);
    if (idx === -1) return null;
    if (updates.name) all[idx].name = updates.name;
    if (updates.description) all[idx].description = updates.description;
    all[idx].updatedAt = new Date().toISOString();
    this.saveAll(all);
    return all[idx];
  }

  delete(id: string): boolean {
    const all = this.getAll();
    const idx = all.findIndex((kb) => kb.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    this.saveAll(all);
    return true;
  }

  // ── Upload + Extract ──────────────────────────────────────────
  async addSource(
    kbId: string,
    type: KBSource['type'],
    content: Buffer | string,
    filename?: string,
    url?: string,
  ): Promise<{ chunks: number; tokens: number } | null> {
    const all = this.getAll();
    const kb = all.find((k) => k.id === kbId);
    if (!kb) return null;

    const sourceIndex = kb.sources.length;
    let extractedText = '';

    switch (type) {
      case 'pdf': {
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = (pdfParseModule as any).default || pdfParseModule;
        const result = await pdfParse(content as Buffer);
        extractedText = result.text;
        kb.sources.push({
          type: 'pdf',
          filename: filename || 'uploaded.pdf',
          uploadedAt: new Date().toISOString(),
          pageCount: result.numpages,
        });
        this.logger.log(`PDF extracted: ${result.numpages} pages, ${extractedText.length} chars`);
        break;
      }
      case 'docx': {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: content as Buffer });
        extractedText = result.value;
        kb.sources.push({
          type: 'docx',
          filename: filename || 'uploaded.docx',
          uploadedAt: new Date().toISOString(),
        });
        this.logger.log(`DOCX extracted: ${extractedText.length} chars`);
        break;
      }
      case 'txt': {
        extractedText = typeof content === 'string' ? content : content.toString('utf-8');
        kb.sources.push({
          type: 'txt',
          filename: filename || 'uploaded.txt',
          uploadedAt: new Date().toISOString(),
        });
        break;
      }
      case 'url': {
        // For URL scraping, caller should pass the scraped text as content
        extractedText = typeof content === 'string' ? content : content.toString('utf-8');
        kb.sources.push({
          type: 'url',
          url: url || '',
          uploadedAt: new Date().toISOString(),
        });
        break;
      }
      case 'text': {
        extractedText = typeof content === 'string' ? content : content.toString('utf-8');
        kb.sources.push({
          type: 'text',
          uploadedAt: new Date().toISOString(),
        });
        break;
      }
    }

    // Chunk the extracted text
    const newChunks = chunkText(extractedText, sourceIndex);
    kb.chunks.push(...newChunks);
    kb.totalChunks = kb.chunks.length;
    kb.totalTokens = kb.chunks.reduce((sum, c) => sum + c.tokenCount, 0);
    kb.updatedAt = new Date().toISOString();

    this.saveAll(all);
    this.logger.log(`KB ${kbId}: +${newChunks.length} chunks (${kb.totalChunks} total, ~${kb.totalTokens} tokens)`);

    return { chunks: newChunks.length, tokens: newChunks.reduce((s, c) => s + c.tokenCount, 0) };
  }

  // ── Remove a single source (and its chunks) ──────────────────
  removeSource(kbId: string, sourceIndex: number): boolean {
    const all = this.getAll();
    const kb = all.find((k) => k.id === kbId);
    if (!kb || sourceIndex >= kb.sources.length) return false;

    kb.sources.splice(sourceIndex, 1);
    kb.chunks = kb.chunks
      .filter((c) => c.sourceIndex !== sourceIndex)
      .map((c) => (c.sourceIndex > sourceIndex ? { ...c, sourceIndex: c.sourceIndex - 1 } : c));
    kb.totalChunks = kb.chunks.length;
    kb.totalTokens = kb.chunks.reduce((s, c) => s + c.tokenCount, 0);
    kb.updatedAt = new Date().toISOString();
    this.saveAll(all);
    return true;
  }

  // ── Query (ranked retrieval) ──────────────────────────────────
  query(kbId: string, question: string, topK = 8): KBChunk[] {
    const kb = this.getById(kbId);
    if (!kb || kb.chunks.length === 0) return [];

    const scored = kb.chunks
      .map((chunk) => ({ chunk, score: scoreChunk(chunk, question) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map((s) => s.chunk);
  }

  // ── Build context string for prompt injection ─────────────────
  buildContext(kbId: string, question: string, maxTokens = 4000): string {
    const chunks = this.query(kbId, question, 12);
    if (chunks.length === 0) return '';

    const lines: string[] = ['## Relevant Knowledge Base Context\n'];
    let tokenBudget = maxTokens;
    for (const chunk of chunks) {
      if (tokenBudget - chunk.tokenCount < 0) break;
      lines.push(chunk.text);
      lines.push('');
      tokenBudget -= chunk.tokenCount;
    }
    return lines.join('\n');
  }
}
