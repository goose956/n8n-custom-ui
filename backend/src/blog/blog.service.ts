import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

const SITEMAP_DIR = path.join(__dirname, '../../public');

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  projectId: number | null;
  keyword: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'queued' | 'generating' | 'draft' | 'scheduled' | 'published' | 'failed';
  length: 'short' | 'medium' | 'long';
  wordCount: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metaDescription: string;
  error?: string;
}

export interface BlogSettings {
  frequency: 'manual' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  defaultLength: 'short' | 'medium' | 'long';
  defaultStatus: 'draft' | 'published';
  projectId: number | null;
  autoGenerateTitle: boolean;
}

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BlogService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {
    // Ensure public dir exists for sitemap
    if (!fs.existsSync(SITEMAP_DIR)) {
      fs.mkdirSync(SITEMAP_DIR, { recursive: true });
    }
  }

  private readDb(): any {
    return this.db.readSync();
  }

  private writeDb(data: any): void {
    this.db.writeSync(data);
  }

  private getPosts(): BlogPost[] {
    const data = this.readDb();
    return data.blogPosts || [];
  }

  private savePosts(posts: BlogPost[]): void {
    const data = this.readDb();
    data.blogPosts = posts;
    this.writeDb(data);
  }

  private getSettings(): BlogSettings {
    const data = this.readDb();
    return data.blogSettings || {
      frequency: 'manual',
      defaultLength: 'medium',
      defaultStatus: 'draft',
      projectId: null,
      autoGenerateTitle: true,
    };
  }

  private saveSettings(settings: BlogSettings): void {
    const data = this.readDb();
    data.blogSettings = settings;
    this.writeDb(data);
  }

  private getOpenAiKey(): string | null {
    try {
      const data = this.readDb();
      const apiKeys = data.apiKeys || [];
      const openaiKey = apiKeys.find((k: any) => k.name.toLowerCase() === 'openai');
      if (!openaiKey) return null;
      return this.cryptoService.decrypt(openaiKey.value);
    } catch {
      return null;
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private getLengthGuide(length: 'short' | 'medium' | 'long'): { words: string; paragraphs: string } {
    switch (length) {
      case 'short': return { words: '400-600', paragraphs: '4-6' };
      case 'medium': return { words: '800-1200', paragraphs: '8-12' };
      case 'long': return { words: '1500-2500', paragraphs: '15-20' };
    }
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async getAllPosts(projectId?: number | null): Promise<{ success: boolean; data: BlogPost[] }> {
    let posts = this.getPosts();
    if (projectId !== undefined && projectId !== null) {
      posts = posts.filter((p) => p.projectId === projectId);
    }
    return { success: true, data: posts };
  }

  async getPost(id: string): Promise<{ success: boolean; data?: BlogPost; message?: string }> {
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) return { success: false, message: 'Post not found' };
    return { success: true, data: post };
  }

  async getStats(projectId?: number | null): Promise<{ success: boolean; data: any }> {
    let posts = this.getPosts();
    if (projectId !== undefined && projectId !== null) {
      posts = posts.filter((p) => p.projectId === projectId);
    }
    return {
      success: true,
      data: {
        total: posts.length,
        queued: posts.filter((p) => p.status === 'queued').length,
        generating: posts.filter((p) => p.status === 'generating').length,
        draft: posts.filter((p) => p.status === 'draft').length,
        scheduled: posts.filter((p) => p.status === 'scheduled').length,
        published: posts.filter((p) => p.status === 'published').length,
        failed: posts.filter((p) => p.status === 'failed').length,
        totalWords: posts.reduce((sum, p) => sum + (p.wordCount || 0), 0),
      },
    };
  }

  // ─── Per-project index ───────────────────────────────────────────────────────

  async getProjectIndex(): Promise<{ success: boolean; data: any[] }> {
    const posts = this.getPosts();
    const data = this.readDb();
    const apps = data.apps || [];

    // Group posts by projectId
    const projectMap: Record<string, BlogPost[]> = {};
    for (const post of posts) {
      const key = post.projectId != null ? String(post.projectId) : 'unassigned';
      if (!projectMap[key]) projectMap[key] = [];
      projectMap[key].push(post);
    }

    const index = apps.map((app: any) => {
      const appPosts = projectMap[String(app.id)] || [];
      return {
        projectId: app.id,
        projectName: app.name,
        projectSlug: app.slug,
        projectColor: app.primary_color,
        total: appPosts.length,
        queued: appPosts.filter((p: BlogPost) => p.status === 'queued').length,
        draft: appPosts.filter((p: BlogPost) => p.status === 'draft').length,
        published: appPosts.filter((p: BlogPost) => p.status === 'published').length,
        failed: appPosts.filter((p: BlogPost) => p.status === 'failed').length,
        totalWords: appPosts.reduce((sum: number, p: BlogPost) => sum + (p.wordCount || 0), 0),
      };
    });

    // Include unassigned if any
    const unassigned = projectMap['unassigned'] || [];
    if (unassigned.length > 0) {
      index.unshift({
        projectId: null,
        projectName: 'Unassigned',
        projectSlug: '',
        projectColor: '#999',
        total: unassigned.length,
        queued: unassigned.filter((p: BlogPost) => p.status === 'queued').length,
        draft: unassigned.filter((p: BlogPost) => p.status === 'draft').length,
        published: unassigned.filter((p: BlogPost) => p.status === 'published').length,
        failed: unassigned.filter((p: BlogPost) => p.status === 'failed').length,
        totalWords: unassigned.reduce((sum: number, p: BlogPost) => sum + (p.wordCount || 0), 0),
      });
    }

    return { success: true, data: index };
  }

  async getBlogSettings(): Promise<{ success: boolean; data: BlogSettings }> {
    return { success: true, data: this.getSettings() };
  }

  async updateBlogSettings(settings: Partial<BlogSettings>): Promise<{ success: boolean; data: BlogSettings }> {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.saveSettings(updated);
    return { success: true, data: updated };
  }

  // ─── Add keywords to queue ───────────────────────────────────────────────────

  async addKeywords(keywords: string[], length?: 'short' | 'medium' | 'long', projectId?: number | null): Promise<{ success: boolean; data: BlogPost[]; message: string }> {
    const posts = this.getPosts();
    const settings = this.getSettings();
    const articleLength = length || settings.defaultLength;
    const pid = projectId !== undefined ? projectId : settings.projectId;
    const newPosts: BlogPost[] = [];

    for (const keyword of keywords) {
      const trimmed = keyword.trim();
      if (!trimmed) continue;

      const id = crypto.randomBytes(8).toString('hex');
      const post: BlogPost = {
        id,
        projectId: pid,
        keyword: trimmed,
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'queued',
        length: articleLength,
        wordCount: 0,
        scheduledAt: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [trimmed],
        metaDescription: '',
      };
      newPosts.push(post);
      posts.push(post);
    }

    this.savePosts(posts);
    return { success: true, data: newPosts, message: `${newPosts.length} keyword(s) queued` };
  }

  // ─── Generate content with OpenAI ────────────────────────────────────────────

  async generatePost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
    const apiKey = this.getOpenAiKey();
    if (!apiKey) {
      return { success: false, message: 'OpenAI API key not found. Add one named "openai" in Settings > API Keys.' };
    }

    const posts = this.getPosts();
    const postIndex = posts.findIndex((p) => p.id === id);
    if (postIndex === -1) return { success: false, message: 'Post not found' };

    const post = posts[postIndex];
    const lengthGuide = this.getLengthGuide(post.length);

    // Mark as generating
    posts[postIndex] = { ...post, status: 'generating', updatedAt: new Date().toISOString() };
    this.savePosts(posts);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert blog writer. Write well-structured, engaging, SEO-optimized blog posts.
Return your response as valid JSON with these fields:
- "title": compelling blog post title
- "content": full article in HTML format with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. No <html>, <head>, <body> wrappers.
- "excerpt": 1-2 sentence summary (plain text)
- "metaDescription": SEO meta description (under 160 chars)
- "tags": array of 3-5 relevant tags

Guidelines:
- Target ${lengthGuide.words} words across ${lengthGuide.paragraphs} paragraphs
- Use proper heading hierarchy (h2 for sections, h3 for subsections)
- Include an engaging introduction and conclusion
- Make it informative, practical, and reader-friendly
- Naturally incorporate the keyword without overstuffing`,
            },
            {
              role: 'user',
              content: `Write a ${post.length} blog post about: "${post.keyword}"`,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      const settings = this.getSettings();

      const updatedPost: BlogPost = {
        ...posts[postIndex],
        title: result.title || `Article: ${post.keyword}`,
        slug: this.slugify(result.title || post.keyword),
        content: result.content || '',
        excerpt: result.excerpt || '',
        metaDescription: result.metaDescription || '',
        tags: result.tags || [post.keyword],
        wordCount: (result.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length,
        status: settings.defaultStatus === 'published' ? 'published' : 'draft',
        publishedAt: settings.defaultStatus === 'published' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      posts[postIndex] = updatedPost;
      this.savePosts(posts);

      // Regenerate sitemap if published
      if (updatedPost.status === 'published') {
        this.generateSitemap();
      }

      return { success: true, data: updatedPost, message: 'Post generated successfully' };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message || 'Generation failed';
      posts[postIndex] = { ...posts[postIndex], status: 'failed', error: errorMsg, updatedAt: new Date().toISOString() };
      this.savePosts(posts);
      return { success: false, message: `Generation failed: ${errorMsg}` };
    }
  }

  // ─── Bulk generate ───────────────────────────────────────────────────────────

  async generateAll(): Promise<{ success: boolean; message: string; results: { id: string; success: boolean; message: string }[] }> {
    const posts = this.getPosts();
    const queued = posts.filter((p) => p.status === 'queued' || p.status === 'failed');
    const results: { id: string; success: boolean; message: string }[] = [];

    for (const post of queued) {
      const result = await this.generatePost(post.id);
      results.push({ id: post.id, success: result.success, message: result.message });
      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return { success: true, message: `Processed ${results.length} posts`, results };
  }

  // ─── Update post (edit content, change status, etc.) ─────────────────────────

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<{ success: boolean; data?: BlogPost; message: string }> {
    const posts = this.getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'Post not found' };

    const wasPublished = posts[idx].status === 'published';
    const updated: BlogPost = {
      ...posts[idx],
      ...updates,
      id: posts[idx].id, // prevent id change
      updatedAt: new Date().toISOString(),
    };

    // If transitioning to published, set publishedAt
    if (updates.status === 'published' && !wasPublished) {
      updated.publishedAt = new Date().toISOString();
    }

    // Recalculate word count if content changed
    if (updates.content) {
      updated.wordCount = updates.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    }

    // Update slug if title changed
    if (updates.title) {
      updated.slug = this.slugify(updates.title);
    }

    posts[idx] = updated;
    this.savePosts(posts);

    // Regenerate sitemap on status change
    if (updates.status === 'published' || (wasPublished && updates.status && (updates.status as string) !== 'published')) {
      this.generateSitemap();
    }

    return { success: true, data: updated, message: 'Post updated' };
  }

  // ─── Delete post ─────────────────────────────────────────────────────────────

  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    const posts = this.getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'Post not found' };

    const wasPublished = posts[idx].status === 'published';
    posts.splice(idx, 1);
    this.savePosts(posts);

    if (wasPublished) this.generateSitemap();

    return { success: true, message: 'Post deleted' };
  }

  // ─── Bulk delete ─────────────────────────────────────────────────────────────

  async deletePosts(ids: string[]): Promise<{ success: boolean; message: string }> {
    let posts = this.getPosts();
    const hadPublished = posts.some((p) => ids.includes(p.id) && p.status === 'published');
    posts = posts.filter((p) => !ids.includes(p.id));
    this.savePosts(posts);
    if (hadPublished) this.generateSitemap();
    return { success: true, message: `${ids.length} post(s) deleted` };
  }

  // ─── Publish / Unpublish ─────────────────────────────────────────────────────

  async publishPost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
    return this.updatePost(id, { status: 'published', publishedAt: new Date().toISOString() });
  }

  async unpublishPost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
    return this.updatePost(id, { status: 'draft', publishedAt: null });
  }

  // ─── Sitemap Generation ──────────────────────────────────────────────────────

  generateSitemap(projectId?: number | null): { success: boolean; path: string; urls: number } {
    const allPosts = this.getPosts().filter((p) => p.status === 'published');
    const data = this.readDb();
    const apps = data.apps || [];

    // Group published posts by project
    const projectMap: Record<string, BlogPost[]> = {};
    for (const post of allPosts) {
      const key = post.projectId != null ? String(post.projectId) : 'unassigned';
      if (!projectMap[key]) projectMap[key] = [];
      projectMap[key].push(post);
    }

    // If specific project requested, only generate for that project
    const projectIds = projectId != null ? [String(projectId)] : Object.keys(projectMap);

    let totalUrls = 0;
    let combinedSitemap = '';

    for (const pid of projectIds) {
      const posts = projectMap[pid] || [];
      const app = apps.find((a: any) => String(a.id) === pid);
      const projectSlug = app?.slug || 'blog';

      const urls = posts.map((post) => {
        return `  <url>
    <loc>/${projectSlug}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      combinedSitemap += urls.join('\n') + '\n';
      totalUrls += posts.length;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${combinedSitemap}</urlset>`;

    const sitemapPath = path.join(SITEMAP_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

    return { success: true, path: sitemapPath, urls: totalUrls };
  }

  async getSitemap(): Promise<{ success: boolean; content?: string; postCount: number }> {
    const sitemapPath = path.join(SITEMAP_DIR, 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) {
      const result = this.generateSitemap();
      return { success: true, content: fs.readFileSync(sitemapPath, 'utf-8'), postCount: result.urls };
    }
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    const postCount = this.getPosts().filter((p) => p.status === 'published').length;
    return { success: true, content, postCount };
  }

  // ─── Retry failed ────────────────────────────────────────────────────────────

  async retryFailed(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
    const posts = this.getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'Post not found' };
    posts[idx] = { ...posts[idx], status: 'queued', error: undefined, updatedAt: new Date().toISOString() };
    this.savePosts(posts);
    return this.generatePost(id);
  }
}
