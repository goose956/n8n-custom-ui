import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

/* ─── Types ────────────────────────────────────────────────────────── */

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  url: string;
  permalink: string;
  score: number;
  numComments: number;
  createdAt: string;
  flair?: string;
}

export interface MonitoredPost {
  id: string;
  platform: 'reddit';
  postId: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  postedAt: string;
  discoveredAt: string;
  relevanceScore: number;
  relevanceReason: string;
  status: 'new' | 'drafted' | 'reviewed' | 'posted' | 'skipped';
  draftReply: string;
  notes: string;
  keywords: string[];
}

export interface MonitorKeyword {
  id: string;
  term: string;
  subreddits: string[];
  enabled: boolean;
  createdAt: string;
}

export interface ScanResult {
  postsFound: number;
  newPosts: number;
  duplicatesSkipped: number;
  keywords: string[];
}

/* ─── Service ──────────────────────────────────────────────────────── */

@Injectable()
export class SocialMonitorService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /* ─── Keywords ────────────────────────────────────────────────── */

  async getKeywords(): Promise<MonitorKeyword[]> {
    const data = this.loadData();
    return data.socialMonitor?.keywords || [];
  }

  async addKeyword(term: string, subreddits: string[]): Promise<MonitorKeyword> {
    const data = this.loadData();
    if (!data.socialMonitor) data.socialMonitor = { keywords: [], posts: [] };

    const keyword: MonitorKeyword = {
      id: `kw_${Date.now()}`,
      term: term.toLowerCase().trim(),
      subreddits: subreddits.map(s => s.toLowerCase().replace(/^r\//, '').trim()),
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    data.socialMonitor.keywords.push(keyword);
    this.saveData(data);
    return keyword;
  }

  async deleteKeyword(id: string): Promise<boolean> {
    const data = this.loadData();
    if (!data.socialMonitor?.keywords) return false;
    const idx = data.socialMonitor.keywords.findIndex((k: MonitorKeyword) => k.id === id);
    if (idx === -1) return false;
    data.socialMonitor.keywords.splice(idx, 1);
    this.saveData(data);
    return true;
  }

  async toggleKeyword(id: string): Promise<MonitorKeyword | null> {
    const data = this.loadData();
    const kw = (data.socialMonitor?.keywords || []).find((k: MonitorKeyword) => k.id === id);
    if (!kw) return null;
    kw.enabled = !kw.enabled;
    this.saveData(data);
    return kw;
  }

  /* ─── Posts ───────────────────────────────────────────────────── */

  async getPosts(filters?: { status?: string; minScore?: number; subreddit?: string }): Promise<MonitoredPost[]> {
    const data = this.loadData();
    let posts: MonitoredPost[] = data.socialMonitor?.posts || [];

    if (filters?.status) {
      posts = posts.filter(p => p.status === filters.status);
    }
    if (filters?.minScore !== undefined) {
      posts = posts.filter(p => p.relevanceScore >= filters.minScore!);
    }
    if (filters?.subreddit) {
      posts = posts.filter(p => p.subreddit.toLowerCase() === filters.subreddit!.toLowerCase());
    }

    // Sort by relevance score desc, then by date
    return posts.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }

  async updatePostStatus(postId: string, status: MonitoredPost['status']): Promise<MonitoredPost | null> {
    const data = this.loadData();
    const post = (data.socialMonitor?.posts || []).find((p: MonitoredPost) => p.id === postId);
    if (!post) return null;
    post.status = status;
    this.saveData(data);
    return post;
  }

  async updateDraftReply(postId: string, draftReply: string): Promise<MonitoredPost | null> {
    const data = this.loadData();
    const post = (data.socialMonitor?.posts || []).find((p: MonitoredPost) => p.id === postId);
    if (!post) return null;
    post.draftReply = draftReply;
    if (post.status === 'new') post.status = 'drafted';
    this.saveData(data);
    return post;
  }

  async updateNotes(postId: string, notes: string): Promise<MonitoredPost | null> {
    const data = this.loadData();
    const post = (data.socialMonitor?.posts || []).find((p: MonitoredPost) => p.id === postId);
    if (!post) return null;
    post.notes = notes;
    this.saveData(data);
    return post;
  }

  async deletePost(postId: string): Promise<boolean> {
    const data = this.loadData();
    if (!data.socialMonitor?.posts) return false;
    const idx = data.socialMonitor.posts.findIndex((p: MonitoredPost) => p.id === postId);
    if (idx === -1) return false;
    data.socialMonitor.posts.splice(idx, 1);
    this.saveData(data);
    return true;
  }

  /* ─── Scan Reddit via Apify ──────────────────────────────────── */

  async scanReddit(): Promise<ScanResult> {
    const data = this.loadData();
    const keywords: MonitorKeyword[] = (data.socialMonitor?.keywords || []).filter((k: MonitorKeyword) => k.enabled);

    if (keywords.length === 0) {
      return { postsFound: 0, newPosts: 0, duplicatesSkipped: 0, keywords: [] };
    }

    // Get Apify API token
    const apifyToken = this.getApifyToken(data);
    if (!apifyToken) {
      throw new Error('Apify API token not configured. Add it in Settings → Integration Keys.');
    }

    const existingPostIds = new Set(
      (data.socialMonitor?.posts || []).map((p: MonitoredPost) => p.postId),
    );

    let totalFound = 0;
    let newPosts = 0;
    let duplicatesSkipped = 0;
    const keywordsUsed: string[] = [];

    for (const kw of keywords) {
      keywordsUsed.push(kw.term);

      try {
        // Build search URLs for Apify Reddit Scraper
        const searchUrls = kw.subreddits.length > 0
          ? kw.subreddits.map(sub => `https://www.reddit.com/r/${sub}/search/?q=${encodeURIComponent(kw.term)}&restrict_sr=1&sort=new&t=week`)
          : [`https://www.reddit.com/search/?q=${encodeURIComponent(kw.term)}&sort=new&t=week`];

        // Run Apify Reddit Scraper Lite actor (pay-per-result, no subscription needed)
        const runResponse = await axios.post(
          'https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/runs',
          {
            startUrls: searchUrls.map(url => ({ url })),
            maxItems: 25,
            maxPostCount: 25,
            maxComments: 0,
            skipComments: true,
            sort: 'new',
            time: 'week',
            searchPosts: true,
            searchComments: false,
            searchCommunities: false,
            searchUsers: false,
          },
          {
            headers: { 'Authorization': `Bearer ${apifyToken}` },
            params: { waitForFinish: 120 },
            timeout: 130000,
          },
        );

        const datasetId = runResponse.data?.data?.defaultDatasetId;
        if (!datasetId) continue;

        // Fetch results from dataset
        const resultsResponse = await axios.get(
          `https://api.apify.com/v2/datasets/${datasetId}/items`,
          {
            headers: { 'Authorization': `Bearer ${apifyToken}` },
            params: { format: 'json' },
            timeout: 15000,
          },
        );

        const items = resultsResponse.data || [];
        totalFound += items.length;

        for (const item of items) {
          // Skip non-post items (comments, communities, users)
          if (item.dataType && item.dataType !== 'post') continue;

          const postId = item.id || item.parsedId || `reddit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          if (existingPostIds.has(postId)) {
            duplicatesSkipped++;
            continue;
          }

          // Calculate a basic relevance score
          const relevance = this.calculateRelevance(item, kw.term);

          // Map fields from Reddit Scraper Lite output format
          const communityRaw = item.parsedCommunityName || item.communityName || item.category || '';
          const subreddit = communityRaw.replace(/^r\//, '').trim() || 'unknown';

          const post: MonitoredPost = {
            id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            platform: 'reddit',
            postId,
            subreddit,
            title: item.title || '',
            body: (item.body || item.selftext || item.text || '').slice(0, 2000),
            author: item.username || item.author || 'unknown',
            url: item.url || `https://reddit.com${item.permalink || ''}`,
            score: item.upVotes || item.score || item.numberOfUpvotes || 0,
            numComments: item.numberOfComments || item.numComments || 0,
            postedAt: item.createdAt || item.created || new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            relevanceScore: relevance.score,
            relevanceReason: relevance.reason,
            status: 'new',
            draftReply: '',
            notes: '',
            keywords: [kw.term],
          };

          if (!data.socialMonitor) data.socialMonitor = { keywords: [], posts: [] };
          if (!data.socialMonitor.posts) data.socialMonitor.posts = [];
          data.socialMonitor.posts.push(post);
          existingPostIds.add(postId);
          newPosts++;
        }
      } catch (err) {
        console.error(`Failed to scan for keyword "${kw.term}":`, err instanceof Error ? err.message : err);
      }
    }

    // Keep only last 500 posts
    if (data.socialMonitor?.posts?.length > 500) {
      data.socialMonitor.posts = data.socialMonitor.posts
        .sort((a: MonitoredPost, b: MonitoredPost) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime())
        .slice(0, 500);
    }

    this.saveData(data);

    return { postsFound: totalFound, newPosts, duplicatesSkipped, keywords: keywordsUsed };
  }

  /* ─── AI Draft Reply ─────────────────────────────────────────── */

  async generateDraftReply(postId: string, context?: string): Promise<{ reply: string } | null> {
    const data = this.loadData();
    const post = (data.socialMonitor?.posts || []).find((p: MonitoredPost) => p.id === postId);
    if (!post) return null;

    // Try to get an AI key (OpenRouter → OpenAI → Claude)
    const aiKey = this.getAIKey(data);
    if (!aiKey) {
      throw new Error('No AI API key configured. Add OpenRouter, OpenAI, or Claude key in Settings.');
    }

    const systemPrompt = `You are helping draft a helpful Reddit reply. The goal is to be genuinely helpful and provide value. 
If the user has a tool or resource that's relevant, mention it naturally — never as a hard sell. 
Keep the tone conversational, authentic, and Reddit-appropriate. 
Don't use corporate language. Be concise — Reddit values brevity.
Don't start with "Great question!" or similar.
${context ? `\nAdditional context about what we offer: ${context}` : ''}`;

    const userPrompt = `r/${post.subreddit} — "${post.title}"

${post.body ? `Post body: ${post.body.slice(0, 1000)}` : '(no body text)'}

Draft a helpful reply to this post. Be genuinely useful first, and only mention our tool if it's actually relevant.`;

    try {
      let reply = '';
      const startTime = Date.now();

      if (aiKey.provider === 'openrouter') {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'anthropic/claude-sonnet-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
        }, {
          headers: { 'Authorization': `Bearer ${aiKey.key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        });
        reply = res.data.choices?.[0]?.message?.content || '';
        await this.trackCost('openrouter', 'anthropic/claude-sonnet-4', res.data.usage?.prompt_tokens || 0, res.data.usage?.completion_tokens || 0, Date.now() - startTime, 'social-monitor');
      } else if (aiKey.provider === 'openai') {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
        }, {
          headers: { 'Authorization': `Bearer ${aiKey.key}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        });
        reply = res.data.choices?.[0]?.message?.content || '';
        await this.trackCost('openai', 'gpt-4o', res.data.usage?.prompt_tokens || 0, res.data.usage?.completion_tokens || 0, Date.now() - startTime, 'social-monitor');
      } else if (aiKey.provider === 'claude') {
        const res = await axios.post('https://api.anthropic.com/v1/messages', {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }, {
          headers: {
            'x-api-key': aiKey.key,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          timeout: 30000,
        });
        reply = res.data.content?.[0]?.text || '';
        await this.trackCost('claude', 'claude-sonnet-4-20250514', res.data.usage?.input_tokens || 0, res.data.usage?.output_tokens || 0, Date.now() - startTime, 'social-monitor');
      }

      if (reply) {
        post.draftReply = reply;
        if (post.status === 'new') post.status = 'drafted';
        this.saveData(data);
      }

      return { reply };
    } catch (err: any) {
      const apiMsg = err?.response?.data?.error?.message || err?.response?.data?.message || '';
      const msg = apiMsg || (err instanceof Error ? err.message : String(err));
      console.error('Social monitor AI draft error:', err?.response?.status, msg);
      throw new Error(`AI draft failed: ${msg}`);
    }
  }

  /* ─── Stats ──────────────────────────────────────────────────── */

  async getStats() {
    const data = this.loadData();
    const posts: MonitoredPost[] = data.socialMonitor?.posts || [];
    const keywords: MonitorKeyword[] = data.socialMonitor?.keywords || [];

    const byStatus = {
      new: posts.filter(p => p.status === 'new').length,
      drafted: posts.filter(p => p.status === 'drafted').length,
      reviewed: posts.filter(p => p.status === 'reviewed').length,
      posted: posts.filter(p => p.status === 'posted').length,
      skipped: posts.filter(p => p.status === 'skipped').length,
    };

    const subreddits = [...new Set(posts.map(p => p.subreddit))];
    const avgRelevance = posts.length > 0
      ? parseFloat((posts.reduce((s, p) => s + p.relevanceScore, 0) / posts.length).toFixed(1))
      : 0;

    return {
      totalPosts: posts.length,
      activeKeywords: keywords.filter(k => k.enabled).length,
      totalKeywords: keywords.length,
      byStatus,
      subreddits,
      avgRelevance,
      highOpportunities: posts.filter(p => p.relevanceScore >= 7 && p.status === 'new').length,
    };
  }

  /* ─── Helpers ────────────────────────────────────────────────── */

  private calculateRelevance(item: any, keyword: string): { score: number; reason: string } {
    let score = 5; // baseline
    const reasons: string[] = [];
    const title = (item.title || '').toLowerCase();
    const body = (item.body || item.selftext || item.text || '').toLowerCase();
    const kw = keyword.toLowerCase();

    // Title contains keyword = high relevance
    if (title.includes(kw)) {
      score += 2;
      reasons.push('keyword in title');
    }

    // Body contains keyword
    if (body.includes(kw)) {
      score += 1;
      reasons.push('keyword in body');
    }

    // Question posts are great engagement opportunities
    if (title.includes('?') || title.startsWith('how') || title.startsWith('what') || title.startsWith('looking for') || title.startsWith('anyone')) {
      score += 2;
      reasons.push('question post');
    }

    // Help/advice posts
    if (title.includes('help') || title.includes('advice') || title.includes('recommend') || title.includes('suggestion')) {
      score += 1;
      reasons.push('seeking help');
    }

    // Low comment count = less competition
    const comments = item.numberOfComments || item.numComments || 0;
    if (comments < 5) {
      score += 1;
      reasons.push('low competition');
    } else if (comments > 50) {
      score -= 1;
      reasons.push('very crowded');
    }

    // Higher upvotes = more visibility
    const upvotes = item.numberOfUpvotes || item.score || item.upVotes || 0;
    if (upvotes > 10) {
      score += 1;
      reasons.push('good traction');
    }

    // Recent posts are better
    const createdAt = new Date(item.createdAt || item.created || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 6) {
      score += 1;
      reasons.push('very fresh');
    } else if (hoursOld > 72) {
      score -= 1;
      reasons.push('older post');
    }

    return {
      score: Math.max(1, Math.min(10, score)),
      reason: reasons.length > 0 ? reasons.join(', ') : 'baseline match',
    };
  }

  private getApifyToken(data: any): string | null {
    const apiKeys = data.apiKeys || [];
    const apifyEntry = apiKeys.find((k: any) => k.name === 'apify');
    if (!apifyEntry) return null;
    try {
      return this.cryptoService.decrypt(apifyEntry.value);
    } catch {
      return null;
    }
  }

  private getAIKey(data: any): { provider: string; key: string } | null {
    const apiKeys = data.apiKeys || [];
    for (const provider of ['openrouter', 'openai', 'claude']) {
      const entry = apiKeys.find((k: any) => k.name === provider);
      if (entry) {
        try {
          return { provider, key: this.cryptoService.decrypt(entry.value) };
        } catch { /* skip */ }
      }
    }
    return null;
  }

  private loadData(): any {
    try {
      if (!this.db.exists()) return {};
      return JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
    } catch {
      return {};
    }
  }

  private saveData(data: any): void {
    fs.writeFileSync(this.db.dbPath, JSON.stringify(data, null, 2));
  }

  private async trackCost(provider: string, model: string, tokensIn: number, tokensOut: number, duration: number, module: string): Promise<void> {
    const rates: Record<string, [number, number]> = {
      'gpt-4o-mini': [0.15, 0.60], 'gpt-4o': [2.50, 10.00], 'gpt-3.5-turbo': [0.50, 1.50],
      'gpt-4': [30.00, 60.00], 'google/gemini-2.0-flash-001': [0.10, 0.40],
      'anthropic/claude-sonnet-4': [3.00, 15.00], 'claude-sonnet-4-20250514': [3.00, 15.00], 'openai/gpt-4o': [2.50, 10.00],
    };
    const [inR, outR] = rates[model] || [1.00, 3.00];
    const cost = (tokensIn * inR + tokensOut * outR) / 1_000_000;
    await this.analyticsService.trackApiUsage({
      provider: provider as any, endpoint: '/chat/completions', model, tokensIn, tokensOut, cost, duration, statusCode: 200, success: true, module,
    }).catch(() => {});
  }
}
