import { Injectable } from'@nestjs/common';
import * as fs from'fs';
import * as path from'path';
import * as crypto from'crypto';
import axios from'axios';
import { CryptoService } from'../shared/crypto.service';
import { DatabaseService } from'../shared/database.service';
import { AnalyticsService } from'../analytics/analytics.service';

const SITEMAP_DIR = path.join(__dirname,'../../public');

// --- Types ---------------------------------------------------------------------

export interface BlogPost {
 id: string;
 projectId: number | null;
 keyword: string;
 title: string;
 slug: string;
 content: string;
 excerpt: string;
 status:'queued' |'generating' |'draft' |'scheduled' |'published' |'failed';
 length:'short' |'medium' |'long';
 wordCount: number;
 scheduledAt: string | null;
 publishedAt: string | null;
 createdAt: string;
 updatedAt: string;
 tags: string[];
 metaDescription: string;
 error?: string;
 featuredImage?: string; // DALL-E generated hero image URL path (e.g. /blog-images/slug.png)
 views?: number; // Visitor view count
 // LLM optimization fields
 structuredData?: object; // JSON-LD schema.org data
 faqSchema?: { q: string; a: string }[]; // FAQ structured data
 tldr?: string; // Quick summary for AI citation
 keyTakeaways?: string[]; // Bullet-point facts for AI extraction
 citations?: string[]; // Source references
}

export interface BlogSettings {
 frequency:'manual' |'daily' |'weekly' |'biweekly' |'monthly';
 defaultLength:'short' |'medium' |'long';
 defaultStatus:'draft' |'published';
 projectId: number | null;
 autoGenerateTitle: boolean;
}

// --- Service -------------------------------------------------------------------

@Injectable()
export class BlogService {
 constructor(
 private readonly cryptoService: CryptoService,
 private readonly db: DatabaseService,
 private readonly analyticsService: AnalyticsService,
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
 frequency:'manual',
 defaultLength:'medium',
 defaultStatus:'draft',
 projectId: null,
 autoGenerateTitle: true,
 };
 }

 private saveSettings(settings: BlogSettings): void {
 const data = this.readDb();
 data.blogSettings = settings;
 this.writeDb(data);
 }

 private getAIProvider(): { provider: string; key: string; url: string; model: string } | null {
 try {
 const data = this.readDb();
 const apiKeys = data.apiKeys || [];

 // Try providers in order: OpenRouter > OpenAI > Claude
 const providers = [
 { name:'openrouter', url:'https://openrouter.ai/api/v1/chat/completions', model:'anthropic/claude-sonnet-4' },
 { name:'openai', url:'https://api.openai.com/v1/chat/completions', model:'gpt-4o-mini' },
 { name:'claude', url:'https://api.anthropic.com/v1/messages', model:'claude-sonnet-4-20250514' },
 ];

 for (const p of providers) {
 const entry = apiKeys.find((k: any) => k.name.toLowerCase() === p.name);
 if (entry) {
 try {
 const key = this.cryptoService.decrypt(entry.value);
 if (key) return { provider: p.name, key, url: p.url, model: p.model };
 } catch { /* skip */ }
 }
 }
 return null;
 } catch {
 return null;
 }
 }

 private async callAI(provider: { provider: string; key: string; url: string; model: string }, systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
 const startTime = Date.now();
 let tokensIn = 0, tokensOut = 0;

 if (provider.provider ==='claude') {
 const response = await axios.post(
 provider.url,
 {
 model: provider.model,
 max_tokens: 8000,
 system: systemPrompt,
 messages: [{ role:'user', content: userPrompt }],
 },
 {
 headers: {
'x-api-key': provider.key,
'anthropic-version':'2023-06-01',
'Content-Type':'application/json',
 },
 timeout: 180000,
 },
 );
 tokensIn = response.data.usage?.input_tokens || 0;
 tokensOut = response.data.usage?.output_tokens || 0;
 await this.trackCost(provider.provider, provider.model, tokensIn, tokensOut, Date.now() - startTime,'blog');
 return response.data.content[0].text;
 } else {
 const headers: any = {
 Authorization:`Bearer ${provider.key}`,
'Content-Type':'application/json',
 };
 if (provider.provider ==='openrouter') {
 headers['HTTP-Referer'] ='http://localhost:3000';
 }
 const body: any = {
 model: provider.model,
 messages: [
 { role:'system', content: systemPrompt },
 { role:'user', content: userPrompt },
 ],
 temperature: 0.7,
 max_tokens: 8000,
 };
 if (jsonMode) {
 body.response_format = { type:'json_object' };
 }
 const response = await axios.post(
 provider.url,
 body,
 { headers, timeout: 180000 },
 );
 tokensIn = response.data.usage?.prompt_tokens || 0;
 tokensOut = response.data.usage?.completion_tokens || 0;
 await this.trackCost(provider.provider, provider.model, tokensIn, tokensOut, Date.now() - startTime,'blog');
 return response.data.choices[0].message.content;
 }
 }

 /**
  * Generate a colourful abstract SVG hero image for a blog post.
  * Uses the existing AI text provider — no DALL-E key needed.
  * Saves the SVG to /public/blog-images/ and returns the URL path.
  */
 private async generateFeaturedImage(title: string, keyword: string): Promise<string | null> {
  const aiProvider = this.getAIProvider();
  if (!aiProvider) {
   console.log('[Blog] No AI provider — skipping featured image generation');
   return null;
  }

  try {
   const svgPrompt = `Create a beautiful, colourful abstract SVG illustration that represents the concept of "${keyword}".

RULES:
- Output ONLY the raw SVG code, nothing else — no markdown, no explanation, no code fences
- Use viewBox="0 0 1200 630" (blog hero aspect ratio)
- Use vibrant, modern colours with gradients (linearGradient/radialGradient in <defs>)
- Create abstract line art: flowing curves, geometric shapes, dots, waves, circles
- Style: modern, minimalist, artistic — think editorial illustration
- NO text, NO words, NO letters, NO numbers anywhere in the SVG
- Use at least 3-4 different vibrant colours (purples, blues, teals, oranges, pinks)
- Include some transparency (opacity) for depth
- Keep it abstract but loosely inspired by the topic
- Make it visually interesting with overlapping shapes and varied stroke widths
- Total SVG should be under 8KB`;

   const raw = await this.callAI(aiProvider, 'You are an SVG artist. Output only raw SVG code. No markdown, no code fences, no explanation.', svgPrompt, false);

   // Extract SVG from response (handle potential markdown wrapping)
   let svg = raw.trim();
   if (svg.startsWith('```')) {
    svg = svg.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/, '');
   }

   // Validate it looks like SVG
   if (!svg.startsWith('<svg') && !svg.startsWith('<?xml')) {
    const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
     svg = svgMatch[0];
    } else {
     console.error('[Blog] AI did not return valid SVG');
     return null;
    }
   }

   // Save SVG to file
   const imgDir = path.join(__dirname, '../../public/blog-images');
   if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
   }
   const filename = `${this.slugify(keyword)}-${Date.now()}.svg`;
   fs.writeFileSync(path.join(imgDir, filename), svg, 'utf-8');

   return `/blog-images/${filename}`;
  } catch (err: any) {
   console.error('[Blog] Featured image generation failed:', err.message);
   return null;
  }
 }

 private slugify(text: string): string {
 return text
 .toLowerCase()
 .replace(/[^a-z0-9]+/g,'-')
 .replace(/(^-|-$)/g,'');
 }

 private getLengthGuide(length:'short' |'medium' |'long'): { words: string; paragraphs: string } {
 switch (length) {
 case'short': return { words:'400-600', paragraphs:'4-6' };
 case'medium': return { words:'800-1200', paragraphs:'8-12' };
 case'long': return { words:'1500-2500', paragraphs:'15-20' };
 }
 }

 // --- Public Methods ----------------------------------------------------------

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
 if (!post) return { success: false, message:'Post not found' };
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
 queued: posts.filter((p) => p.status ==='queued').length,
 generating: posts.filter((p) => p.status ==='generating').length,
 draft: posts.filter((p) => p.status ==='draft').length,
 scheduled: posts.filter((p) => p.status ==='scheduled').length,
 published: posts.filter((p) => p.status ==='published').length,
 failed: posts.filter((p) => p.status ==='failed').length,
 totalWords: posts.reduce((sum, p) => sum + (p.wordCount || 0), 0),
 totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
 },
 };
 }

 // --- Per-project index -------------------------------------------------------

 async getProjectIndex(): Promise<{ success: boolean; data: any[] }> {
 const posts = this.getPosts();
 const data = this.readDb();
 const apps = data.apps || [];

 // Group posts by projectId
 const projectMap: Record<string, BlogPost[]> = {};
 for (const post of posts) {
 const key = post.projectId != null ? String(post.projectId) :'unassigned';
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
 queued: appPosts.filter((p: BlogPost) => p.status ==='queued').length,
 draft: appPosts.filter((p: BlogPost) => p.status ==='draft').length,
 published: appPosts.filter((p: BlogPost) => p.status ==='published').length,
 failed: appPosts.filter((p: BlogPost) => p.status ==='failed').length,
 totalWords: appPosts.reduce((sum: number, p: BlogPost) => sum + (p.wordCount || 0), 0),
 };
 });

 // Include unassigned if any
 const unassigned = projectMap['unassigned'] || [];
 if (unassigned.length > 0) {
 index.unshift({
 projectId: null,
 projectName:'Unassigned',
 projectSlug:'',
 projectColor:'#999',
 total: unassigned.length,
 queued: unassigned.filter((p: BlogPost) => p.status ==='queued').length,
 draft: unassigned.filter((p: BlogPost) => p.status ==='draft').length,
 published: unassigned.filter((p: BlogPost) => p.status ==='published').length,
 failed: unassigned.filter((p: BlogPost) => p.status ==='failed').length,
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

 // --- Add keywords to queue ---------------------------------------------------

 async addKeywords(keywords: string[], length?:'short' |'medium' |'long', projectId?: number | null): Promise<{ success: boolean; data: BlogPost[]; message: string }> {
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
 title:'',
 slug:'',
 content:'',
 excerpt:'',
 status:'queued',
 length: articleLength,
 wordCount: 0,
 scheduledAt: null,
 publishedAt: null,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 tags: [trimmed],
 metaDescription:'',
 };
 newPosts.push(post);
 posts.push(post);
 }

 this.savePosts(posts);
 return { success: true, data: newPosts, message:`${newPosts.length} keyword(s) queued` };
 }

 // --- Keyword Optimization & Suggestions --------------------------------------

 async suggestKeywords(seed: string): Promise<{ success: boolean; data?: { original: string; suggestions: { keyword: string; type: string; score: number; reason: string }[] }; message: string }> {
 const aiProvider = this.getAIProvider();
 if (!aiProvider) {
 return { success: false, message:'No AI API key found. Add an OpenRouter, OpenAI, or Claude key in Settings > Integration Keys.' };
 }

 const systemPrompt =`You are an expert in LLM/AI search optimization (AIO) and content strategy.

Your task: Given a seed topic or keyword, generate optimized keyword variations that are most likely to be surfaced and cited by Large Language Models (ChatGPT, Claude, Perplexity, Google AI Overviews).

LLMs HEAVILY favor content that answers these keyword patterns:
1. **Question keywords** (highest priority): "What is X?", "How to X?", "Why does X?", "When should you X?"
2. **Comparison keywords**: "X vs Y", "X compared to Y", "X or Y which is better"
3. **Definition keywords**: "X meaning", "X explained", "X definition"
4. **List/Ranking keywords**: "Best X for Y", "Top 10 X", "X alternatives"
5. **How-to/Process keywords**: "How to X step by step", "Guide to X", "X tutorial"
6. **Problem/Solution keywords**: "X not working", "How to fix X", "X troubleshooting"
7. **Specificity keywords**: Add year, numbers, context to make it citable (e.g. "best X in 2026", "X for beginners")

Return valid JSON with this structure:
{
 "suggestions": [
 {
 "keyword": "The optimized keyword phrase",
 "type": "question | comparison | definition | list | howto | problem | specific",
 "score": 85,
 "reason": "Brief explanation of why this keyword will perform well with LLMs"
 }
 ]
}

Rules:
- Generate exactly 8 suggestions covering different types
- Score from 1-100 based on estimated LLM citation likelihood
- Sort by score descending (best first)
- Keep keywords natural -- they should read like something a real person would type or ask
- Include the seed topic naturally in each suggestion
- Focus on keywords that generate CITABLE, DEFINITIVE content (not vague topics)`;

 const userPrompt =`Generate 8 LLM-optimized keyword variations for this seed topic: "${seed}"`;

 try {
 const raw = await this.callAI(aiProvider, systemPrompt, userPrompt);
 let jsonStr = raw.trim();
 if (jsonStr.startsWith('```')) {
 jsonStr = jsonStr.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 }
 const result = JSON.parse(jsonStr);
 return {
 success: true,
 data: {
 original: seed,
 suggestions: result.suggestions || [],
 },
 message:`${(result.suggestions || []).length} keyword suggestions generated`,
 };
 } catch (err: any) {
 return { success: false, message:`Failed to generate suggestions: ${err.message}` };
 }
 }

 // --- Generate content with OpenAI --------------------------------------------

 async generatePost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
 const aiProvider = this.getAIProvider();
 if (!aiProvider) {
 return { success: false, message:'No AI API key found. Add an OpenRouter, OpenAI, or Claude key in Settings > Integration Keys.' };
 }

 const posts = this.getPosts();
 const postIndex = posts.findIndex((p) => p.id === id);
 if (postIndex === -1) return { success: false, message:'Post not found' };

 const post = posts[postIndex];
 const lengthGuide = this.getLengthGuide(post.length);

 // Mark as generating
 posts[postIndex] = { ...post, status:'generating', updatedAt: new Date().toISOString() };
 this.savePosts(posts);

 try {
 const systemPrompt =`You are an expert content strategist who writes blog posts optimized for BOTH search engines AND Large Language Models (ChatGPT, Claude, Perplexity, etc.).

Your goal: create content that AI models will confidently cite, quote, and recommend to users who ask related questions.

Return your response as valid JSON with these fields:
- "title": Clear, specific, question-answering title. Avoid clickbait. LLMs prefer titles that directly state the topic.
- "content": Full article in HTML format (see structure rules below)
- "excerpt": 2-3 sentence factual summary. Written so an AI could use it as a direct answer.
- "metaDescription": SEO meta description under 160 chars, factual and specific
- "tags": array of 3-5 relevant tags
- "tldr": A single paragraph (3-5 sentences) that completely answers the core question. This is the #1 thing LLMs will extract and cite. Make it standalone, factual, and definitive.
- "keyTakeaways": Array of 5-8 concise factual bullet points. Each should be a self-contained statement an AI could quote directly. Use specific numbers, names, or facts -- avoid vague claims.
- "faqSchema": Array of 4-6 objects with "q" and "a" keys. Questions people actually ask about this topic. Answers should be 2-3 sentences, direct, and factual. LLMs heavily weight FAQ sections.
- "citations": Array of 2-4 reference descriptions (e.g. "According to Google's 2024 Search Quality Guidelines..." or "Based on W3C accessibility standards..."). These give LLMs confidence to cite your content.

HTML CONTENT STRUCTURE RULES (critical for LLM parsing):
1. Start with a <p> that directly defines/answers the topic in the first 2 sentences (LLMs weight the opening heavily)
2. Use <h2> for major sections, <h3> for subsections -- these become the "table of contents" LLMs use to find specific answers
3. Write EACH <h2> as a question or clear topic label (e.g. "What is X?", "How to do Y", "X vs Y: Key Differences")
4. After each heading, the first paragraph must directly answer that heading's question -- don't bury answers
5. Use definition patterns: "<p><strong>Term:</strong> definition...</p>" -- LLMs love extracting these
6. Use comparison tables with <table><thead><tr><th>...</th></tr></thead><tbody>... when comparing options
7. Use <ol> for step-by-step processes, <ul> for feature/benefit lists
8. Include specific numbers, dates, percentages, and named sources -- vague content gets ignored by LLMs
9. End with a "Summary" or "Conclusion" <h2> that restates key facts in 2-3 sentences
10. Add a "Frequently Asked Questions" <h2> section at the end with the FAQ items as <h3> sub-questions and <p> answers

DATA VISUALIZATION & IMAGES (critical for LLM + reader engagement):
11. Include at least ONE inline SVG chart or graph in the content. Use simple bar charts, pie charts, or comparison charts with <svg> elements. IMPORTANT: embed all data labels as <text> elements inside the SVG -- LLMs can read SVG text nodes even though they can't see the visual. Example:
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Description of chart data">
 <text x="10" y="20" font-size="14" font-weight="bold">Chart Title</text>
 <rect x="50" y="40" width="120" height="30" fill="#667eea"/><text x="55" y="60" fill="white" font-size="12">Label A: 60%</text>
 <rect x="50" y="80" width="80" height="30" fill="#764ba2"/><text x="55" y="100" fill="white" font-size="12">Label B: 40%</text>
</svg>
12. Include at least ONE data table (<table>) with real statistics, comparisons, or benchmarks relevant to the topic. Use <thead> and <tbody>. Add a <caption> describing the data -- LLMs read captions.
13. For any concept that benefits from a visual, add a <figure> with a descriptive placeholder and rich alt text + figcaption:
<figure>
 <div style="background:#f0f2ff;border:1px solid #ddd;border-radius:8px;padding:40px;text-align:center;color:#667eea;">
 <strong>[Suggested Image: detailed description of what image should show]</strong>
 </div>
 <figcaption>Detailed caption that fully describes what this image shows, including all key data points. LLMs read figcaption as a primary content source.</figcaption>
</figure>
The alt text and figcaption should be so descriptive that someone (or an LLM) could understand the full image content without seeing it.
14. Where relevant, include a "Key Statistics" or "By the Numbers" callout box:
<div style="background:#f8f9ff;border-left:4px solid #667eea;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
 <strong>Key Data Points:</strong>
 <ul><li>Stat 1: specific number</li><li>Stat 2: specific percentage</li></ul>
</div>

WHAT MAKES LLMs CITE YOUR CONTENT:
- Authoritative, definitive statements ("X is...", "The best approach is...")
- Specific data points and comparisons
- Data tables with real numbers (LLMs extract tabular data with high confidence)
- SVG charts with embedded text labels (machine-readable data visualization)
- Rich alt text and figcaptions (LLMs use these as primary content signals)
- Clear definitions that answer "What is X?"
- Step-by-step instructions ("How to X")
- Direct answers in the first sentence after a heading
- Structured, parseable HTML (not walls of text)

WHAT LLMs IGNORE:
- Fluffy intros ("In today's digital landscape...")
- Vague claims without specifics
- Pure opinion without supporting facts
- Content that takes 3 paragraphs to get to the point
- Marketing/sales language
- Images without alt text or captions (invisible to LLMs)

Target ${lengthGuide.words} words across ${lengthGuide.paragraphs} paragraphs.`;

 const userPrompt =`Write a ${post.length} blog post about: "${post.keyword}"

Remember: every heading should be answerable, every paragraph should lead with its key point, and the content should be structured so an AI model reading it can extract clear, citable facts. Include at least one SVG data chart with text labels, one comparison/data table, and image suggestions with rich alt text.`;

 const raw = await this.callAI(aiProvider, systemPrompt, userPrompt);

 // Parse JSON -- handle markdown code fences from Claude
 let jsonStr = raw.trim();
 if (jsonStr.startsWith('```')) {
 jsonStr = jsonStr.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 }
 const result = JSON.parse(jsonStr);

 const settings = this.getSettings();

 // Generate featured image with DALL-E (runs in parallel-safe manner, non-blocking on failure)
 let featuredImage: string | null = null;
 try {
  featuredImage = await this.generateFeaturedImage(result.title || post.keyword, post.keyword);
 } catch (imgErr) {
  console.error('[Blog] Image generation error (non-fatal):', imgErr);
 }

 // Build JSON-LD structured data
 const structuredData = {
'@context':'https://schema.org',
'@type':'Article',
 headline: result.title,
 description: result.metaDescription || result.excerpt,
 datePublished: new Date().toISOString(),
 dateModified: new Date().toISOString(),
 author: {'@type':'Organization', name:'SaaS Factory' },
 keywords: (result.tags || []).join(','),
 };

 // Build FAQ structured data if available
 let faqStructuredData = null;
 if (result.faqSchema && result.faqSchema.length > 0) {
 faqStructuredData = {
'@context':'https://schema.org',
'@type':'FAQPage',
 mainEntity: result.faqSchema.map((faq: any) => ({
'@type':'Question',
 name: faq.q,
 acceptedAnswer: {'@type':'Answer', text: faq.a },
 })),
 };
 }

 const updatedPost: BlogPost = {
 ...posts[postIndex],
 title: result.title ||`Article: ${post.keyword}`,
 slug: this.slugify(result.title || post.keyword),
 content: result.content ||'',
 excerpt: result.excerpt ||'',
 metaDescription: result.metaDescription ||'',
 tags: result.tags || [post.keyword],
 wordCount: (result.content ||'').replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length,
 status: settings.defaultStatus ==='published' ?'published' :'draft',
 publishedAt: settings.defaultStatus ==='published' ? new Date().toISOString() : null,
 updatedAt: new Date().toISOString(),
 // LLM optimization fields
 tldr: result.tldr ||'',
 keyTakeaways: result.keyTakeaways || [],
 faqSchema: result.faqSchema || [],
 citations: result.citations || [],
 structuredData: faqStructuredData
 ? [structuredData, faqStructuredData]
 : structuredData,
 ...(featuredImage ? { featuredImage } : {}),
 };

 posts[postIndex] = updatedPost;
 this.savePosts(posts);

 if (updatedPost.status ==='published') {
 this.generateSitemap();
 }

 return { success: true, data: updatedPost, message:'LLM-optimized post generated successfully' };
 } catch (error: any) {
 const errorMsg = error.response?.data?.error?.message || error.message ||'Generation failed';
 posts[postIndex] = { ...posts[postIndex], status:'failed', error: errorMsg, updatedAt: new Date().toISOString() };
 this.savePosts(posts);
 return { success: false, message:`Generation failed: ${errorMsg}` };
 }
 }

 // --- Bulk generate -----------------------------------------------------------

 async generateAll(ids?: string[]): Promise<{ success: boolean; message: string; results: { id: string; success: boolean; message: string }[] }> {
 const posts = this.getPosts();
 let queued: typeof posts;
 if (ids && ids.length > 0) {
 // Generate only the specified posts (regardless of status, as long as they're queued/failed)
 const idSet = new Set(ids);
 queued = posts.filter((p) => idSet.has(p.id) && (p.status ==='queued' || p.status ==='failed'));
 } else {
 queued = posts.filter((p) => p.status ==='queued' || p.status ==='failed');
 }
 const results: { id: string; success: boolean; message: string }[] = [];

 for (const post of queued) {
 const result = await this.generatePost(post.id);
 results.push({ id: post.id, success: result.success, message: result.message });
 // Small delay to avoid rate limits
 await new Promise((resolve) => setTimeout(resolve, 1500));
 }

 return { success: true, message:`Processed ${results.length} posts`, results };
 }

 // --- Update post (edit content, change status, etc.) -------------------------

 async updatePost(id: string, updates: Partial<BlogPost>): Promise<{ success: boolean; data?: BlogPost; message: string }> {
 const posts = this.getPosts();
 const idx = posts.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Post not found' };

 const wasPublished = posts[idx].status ==='published';
 const updated: BlogPost = {
 ...posts[idx],
 ...updates,
 id: posts[idx].id, // prevent id change
 updatedAt: new Date().toISOString(),
 };

 // If transitioning to published, set publishedAt
 if (updates.status ==='published' && !wasPublished) {
 updated.publishedAt = new Date().toISOString();
 }

 // Recalculate word count if content changed
 if (updates.content) {
 updated.wordCount = updates.content.replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length;
 }

 // Update slug if title changed
 if (updates.title) {
 updated.slug = this.slugify(updates.title);
 }

 posts[idx] = updated;
 this.savePosts(posts);

 // Regenerate sitemap on status change
 if (updates.status ==='published' || (wasPublished && updates.status && (updates.status as string) !=='published')) {
 this.generateSitemap();
 // Sync published posts into the blog-page template
 if (updated.projectId != null) {
 this.syncBlogPageContent(updated.projectId);
 }
 }

 return { success: true, data: updated, message:'Post updated' };
 }

 // --- Delete post -------------------------------------------------------------

 async deletePost(id: string): Promise<{ success: boolean; message: string }> {
 const posts = this.getPosts();
 const idx = posts.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Post not found' };

 const wasPublished = posts[idx].status ==='published';
 const projectId = posts[idx].projectId;
 posts.splice(idx, 1);
 this.savePosts(posts);

 if (wasPublished) {
 this.generateSitemap();
 if (projectId != null) this.syncBlogPageContent(projectId);
 }

 return { success: true, message:'Post deleted' };
 }

 // --- Bulk delete -------------------------------------------------------------

 async deletePosts(ids: string[]): Promise<{ success: boolean; message: string }> {
 let posts = this.getPosts();
 // Track which projects had published posts deleted
 const affectedProjectIds = new Set<number>();
 posts.forEach((p) => {
 if (ids.includes(p.id) && p.status ==='published' && p.projectId != null) {
 affectedProjectIds.add(p.projectId);
 }
 });
 const hadPublished = affectedProjectIds.size > 0;
 posts = posts.filter((p) => !ids.includes(p.id));
 this.savePosts(posts);
 if (hadPublished) {
 this.generateSitemap();
 affectedProjectIds.forEach((pid) => this.syncBlogPageContent(pid));
 }
 return { success: true, message:`${ids.length} post(s) deleted` };
 }

 // --- Sync published posts into the blog-page template ---------------------

 private syncBlogPageContent(projectId: number): void {
 try {
 const data = this.readDb();
 const pages: any[] = data.pages || [];
 const apps: any[] = data.apps || [];

 const app = apps.find((a: any) => a.id === projectId);
 if (!app) return;

 // Find the blog-page for this app
 const blogPageIdx = pages.findIndex(
 (p: any) => p.app_id === projectId && p.page_type ==='blog-page',
 );
 if (blogPageIdx === -1) return;

 // Get all published posts for this project, newest first
 const published = (data.blogPosts || [])
 .filter((p: BlogPost) => p.projectId === projectId && p.status ==='published')
 .sort(
 (a: BlogPost, b: BlogPost) =>
 new Date(b.publishedAt || b.createdAt).getTime() -
 new Date(a.publishedAt || a.createdAt).getTime(),
 );

 const existing = pages[blogPageIdx].content_json || {};
 const appName = app.name || app.slug ||'Team';

 // Map a BlogPost to the template card format
 const mapPost = (post: BlogPost) => ({
 title: post.title,
 excerpt: post.excerpt || post.metaDescription ||'',
 author: appName,
 date: post.publishedAt
 ? new Date(post.publishedAt).toISOString().split('T')[0]
 : new Date(post.createdAt).toISOString().split('T')[0],
 read_time:`${Math.max(1, Math.ceil((post.wordCount || 200) / 200))} min read`,
 category: (post.tags && post.tags[0]) ||'General',
 slug: post.slug,
 });

 // Newest post becomes the featured post; rest fill the grid
 const featured =
 published.length > 0
 ? { ...mapPost(published[0]), image_placeholder:'featured-post-hero.jpg' }
 : null;

 const gridPosts = published.slice(1).map(mapPost);

 // Collect unique categories from the published posts
 const cats = new Set<string>(['All']);
 for (const p of published) {
 if (p.tags) p.tags.forEach((t: string) => cats.add(t));
 }

 // Update content_json, preserving nav / hero / newsletter
 pages[blogPageIdx].content_json = {
 ...existing,
 featured_post: featured,
 posts: gridPosts,
 categories: cats.size > 1 ? Array.from(cats) : existing.categories || ['All'],
 };
 pages[blogPageIdx].updated_at = new Date().toISOString();

 data.pages = pages;
 this.writeDb(data);
 console.log(
`[Blog] Synced ${published.length} published post(s) into blog-page for project ${projectId}`,
 );
 } catch (err) {
 console.error('Failed to sync blog page content:', err);
 }
 }

 // --- Publish / Unpublish -----------------------------------------------------

 async publishPost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
 return this.updatePost(id, { status:'published', publishedAt: new Date().toISOString() });
 }

 async unpublishPost(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
 return this.updatePost(id, { status:'draft', publishedAt: null });
 }

 // --- Sitemap Generation ------------------------------------------------------

 generateSitemap(projectId?: number | null): { success: boolean; path: string; urls: number } {
 const allPosts = this.getPosts().filter((p) => p.status ==='published');
 const data = this.readDb();
 const apps = data.apps || [];

 // Group published posts by project
 const projectMap: Record<string, BlogPost[]> = {};
 for (const post of allPosts) {
 const key = post.projectId != null ? String(post.projectId) :'unassigned';
 if (!projectMap[key]) projectMap[key] = [];
 projectMap[key].push(post);
 }

 // If specific project requested, only generate for that project
 const projectIds = projectId != null ? [String(projectId)] : Object.keys(projectMap);

 let totalUrls = 0;
 let combinedSitemap ='';

 for (const pid of projectIds) {
 const posts = projectMap[pid] || [];
 const app = apps.find((a: any) => String(a.id) === pid);
 const projectSlug = app?.slug ||'blog';

 const urls = posts.map((post) => {
 return` <url>
 <loc>/${projectSlug}/blog/${post.slug}</loc>
 <lastmod>${post.updatedAt.split('T')[0]}</lastmod>
 <changefreq>weekly</changefreq>
 <priority>0.7</priority>
 </url>`;
 });

 combinedSitemap += urls.join('\n') +'\n';
 totalUrls += posts.length;
 }

 const sitemap =`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${combinedSitemap}</urlset>`;

 const sitemapPath = path.join(SITEMAP_DIR,'sitemap.xml');
 fs.writeFileSync(sitemapPath, sitemap,'utf-8');

 return { success: true, path: sitemapPath, urls: totalUrls };
 }

 async getSitemap(): Promise<{ success: boolean; content?: string; postCount: number }> {
 const sitemapPath = path.join(SITEMAP_DIR,'sitemap.xml');
 if (!fs.existsSync(sitemapPath)) {
 const result = this.generateSitemap();
 return { success: true, content: fs.readFileSync(sitemapPath,'utf-8'), postCount: result.urls };
 }
 const content = fs.readFileSync(sitemapPath,'utf-8');
 const postCount = this.getPosts().filter((p) => p.status ==='published').length;
 return { success: true, content, postCount };
 }

 // --- Retry failed ------------------------------------------------------------

 async retryFailed(id: string): Promise<{ success: boolean; data?: BlogPost; message: string }> {
 const posts = this.getPosts();
 const idx = posts.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Post not found' };
 posts[idx] = { ...posts[idx], status:'queued', error: undefined, updatedAt: new Date().toISOString() };
 this.savePosts(posts);
 return this.generatePost(id);
 }

 private async trackCost(provider: string, model: string, tokensIn: number, tokensOut: number, duration: number, module: string): Promise<void> {
 const rates: Record<string, [number, number]> = {
'gpt-4o-mini': [0.15, 0.60],'gpt-4o': [2.50, 10.00],'gpt-3.5-turbo': [0.50, 1.50],
'gpt-4': [30.00, 60.00],'google/gemini-2.0-flash-001': [0.10, 0.40],
'anthropic/claude-sonnet-4': [3.00, 15.00],'claude-sonnet-4-20250514': [3.00, 15.00],'openai/gpt-4o': [2.50, 10.00],
 };
 const [inR, outR] = rates[model] || [1.00, 3.00];
 const cost = (tokensIn * inR + tokensOut * outR) / 1_000_000;
 await this.analyticsService.trackApiUsage({
 provider: provider as any, endpoint:'/chat/completions', model, tokensIn, tokensOut, cost, duration, statusCode: 200, success: true, module,
 }).catch(() => {});
 }

 // --- Blog Visitor Tracking ---------------------------------------------------

 trackBlogView(postId: string, visitorIp: string, userAgent: string, referrer: string): { success: boolean } {
  const posts = this.getPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return { success: false };

  // Increment view count on the post
  posts[idx] = { ...posts[idx], views: (posts[idx].views || 0) + 1 };
  this.savePosts(posts);

  // Also track in analytics if the post has a projectId
  if (posts[idx].projectId != null) {
   this.analyticsService.trackPageView({
    app_id: posts[idx].projectId!,
    page_title: posts[idx].title,
    page_url: `/blog/${posts[idx].slug}`,
    visitor_id: this.hashVisitorId(visitorIp + (userAgent || '')),
    timestamp: new Date().toISOString(),
    referrer: referrer || '',
    user_agent: userAgent || '',
   }).catch(() => {});
  }

  return { success: true };
 }

 private hashVisitorId(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
 }

 getBlogViewStats(): { success: boolean; data: { id: string; slug: string; title: string; views: number }[] } {
  const posts = this.getPosts().filter((p) => p.status !== 'queued');
  return {
   success: true,
   data: posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title, views: p.views || 0 })),
  };
 }

 /**
  * Render a published blog post as a full HTML page with embedded visitor tracking.
  */
 renderPublicBlogPost(slug: string): { success: boolean; html?: string; message?: string } {
  const posts = this.getPosts();
  const post = posts.find((p) => p.slug === slug && p.status === 'published');
  if (!post) return { success: false, message: 'Post not found' };

  const featuredImgHtml = post.featuredImage
   ? `<img src="${post.featuredImage}" alt="${this.escapeHtml(post.title)}" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;margin-bottom:32px" />`
   : '';

  const tagsHtml = (post.tags || []).map((t) => `<span style="display:inline-block;background:#f0f2ff;color:#667eea;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;margin-right:6px">${this.escapeHtml(t)}</span>`).join('');

  const structuredDataScript = post.structuredData
   ? `<script type="application/ld+json">${JSON.stringify(post.structuredData)}</script>`
   : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>${this.escapeHtml(post.title)}</title>
 <meta name="description" content="${this.escapeHtml(post.metaDescription || post.excerpt || '')}">
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
 ${structuredDataScript}
 <style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',-apple-system,sans-serif;background:#fafbfc;color:#333;line-height:1.7}
  .container{max-width:780px;margin:0 auto;padding:40px 24px}
  .hero-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:20px}
  h1{font-size:2.2rem;font-weight:800;color:#1a1a2e;margin-bottom:12px;line-height:1.3}
  .excerpt{font-size:1.05rem;color:#666;font-style:italic;border-left:3px solid #667eea;padding:12px 16px;margin-bottom:28px;background:rgba(102,126,234,0.04);border-radius:0 8px 8px 0}
  .meta{font-size:0.82rem;color:#999;margin-bottom:24px}
  .content h2{font-size:1.4rem;font-weight:700;color:#1a1a2e;margin:28px 0 12px}
  .content h3{font-size:1.15rem;font-weight:700;color:#333;margin:20px 0 8px}
  .content p{font-size:0.96rem;line-height:1.8;color:#444;margin-bottom:16px}
  .content ul,.content ol{padding-left:24px;margin-bottom:16px}
  .content li{font-size:0.94rem;line-height:1.7;margin-bottom:4px}
  .content table{width:100%;border-collapse:collapse;margin:16px 0}
  .content th,.content td{padding:10px 14px;text-align:left;border:1px solid #e2e8f0;font-size:0.9rem}
  .content th{background:#f7f8fc;font-weight:700;color:#1a1a2e}
  .content svg{max-width:100%;height:auto;margin:16px 0}
  .content strong{font-weight:700}
  .content blockquote{border-left:3px solid #667eea;padding:8px 16px;margin:16px 0;color:#555;background:rgba(102,126,234,0.03);border-radius:0 8px 8px 0}
  .footer{text-align:center;padding:40px 0;color:#bbb;font-size:0.78rem;border-top:1px solid #eee;margin-top:48px}
 </style>
</head>
<body>
 <div class="container">
  ${featuredImgHtml}
  <h1>${this.escapeHtml(post.title)}</h1>
  <div class="hero-meta">${tagsHtml}</div>
  <div class="meta">${post.wordCount || 0} words &bull; ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
  ${post.excerpt ? `<div class="excerpt">${this.escapeHtml(post.excerpt)}</div>` : ''}
  <div class="content">${post.content}</div>
  <div class="footer">&copy; ${new Date().getFullYear()}</div>
 </div>
 <script>
  // Visitor tracking pixel
  (function(){
   var d={postId:"${post.id}"};
   var x=new XMLHttpRequest();
   x.open("POST","/api/blog/track-view",true);
   x.setRequestHeader("Content-Type","application/json");
   x.send(JSON.stringify(d));
  })();
 </script>
</body>
</html>`;

  return { success: true, html };
 }

 private escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
 }
}
