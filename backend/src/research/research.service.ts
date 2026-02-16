import { Injectable } from'@nestjs/common';
import * as crypto from'crypto';
import axios from'axios';
import { CryptoService } from'../shared/crypto.service';
import { DatabaseService } from'../shared/database.service';
import { AnalyticsService } from'../analytics/analytics.service';

// --- Types ---------------------------------------------------------------------

export interface ResearchProject {
 id: string;
 projectId: number | null;
 name: string;
 query: string;
 status:'idle' |'searching' |'analyzing' |'complete' |'failed';
 searchResults: SearchResult[];
 analysis: string;
 summary: string;
 keyFindings: string[];
 sources: Source[];
 createdAt: string;
 updatedAt: string;
 error?: string;
}

export interface SearchResult {
 title: string;
 url: string;
 description: string;
 age?: string;
}

export interface Source {
 title: string;
 url: string;
 relevance: string;
}

export interface ResearchSettings {
 defaultProjectId: number | null;
 searchCount: number;
 analysisDepth:'brief' |'standard' |'deep';
 claudeModel: string;
}

// --- Service -------------------------------------------------------------------

@Injectable()
export class ResearchService {
 constructor(
 private readonly cryptoService: CryptoService,
 private readonly db: DatabaseService,
 private readonly analyticsService: AnalyticsService,
 ) {}

 private readDb(): any {
 return this.db.readSync();
 }

 private writeDb(data: any): void {
 this.db.writeSync(data);
 }

 private getResearchProjects(): ResearchProject[] {
 const data = this.readDb();
 return data.researchProjects || [];
 }

 private saveResearchProjects(projects: ResearchProject[]): void {
 const data = this.readDb();
 data.researchProjects = projects;
 this.writeDb(data);
 }

 private getSettings(): ResearchSettings {
 const data = this.readDb();
 return data.researchSettings || {
 defaultProjectId: null,
 searchCount: 10,
 analysisDepth:'standard',
 claudeModel:'claude-sonnet-4-20250514',
 };
 }

 private saveSettings(settings: ResearchSettings): void {
 const data = this.readDb();
 data.researchSettings = settings;
 this.writeDb(data);
 }

 private getApiKey(name: string): string | null {
 try {
 const data = this.readDb();
 const apiKeys = data.apiKeys || [];
 const key = apiKeys.find((k: any) => k.name.toLowerCase() === name.toLowerCase());
 if (!key) return null;
 return this.cryptoService.decrypt(key.value);
 } catch {
 return null;
 }
 }

 // --- Public Methods ----------------------------------------------------------

 async getAllProjects(projectId?: number | null): Promise<{ success: boolean; data: ResearchProject[] }> {
 let projects = this.getResearchProjects();
 if (projectId !== undefined && projectId !== null) {
 projects = projects.filter((p) => p.projectId === projectId);
 }
 return { success: true, data: projects };
 }

 async getProject(id: string): Promise<{ success: boolean; data?: ResearchProject; message?: string }> {
 const projects = this.getResearchProjects();
 const project = projects.find((p) => p.id === id);
 if (!project) return { success: false, message:'Research not found' };
 return { success: true, data: project };
 }

 async getStats(projectId?: number | null): Promise<{ success: boolean; data: any }> {
 let projects = this.getResearchProjects();
 if (projectId !== undefined && projectId !== null) {
 projects = projects.filter((p) => p.projectId === projectId);
 }
 return {
 success: true,
 data: {
 total: projects.length,
 complete: projects.filter((p) => p.status ==='complete').length,
 inProgress: projects.filter((p) => p.status ==='searching' || p.status ==='analyzing').length,
 failed: projects.filter((p) => p.status ==='failed').length,
 totalSources: projects.reduce((sum, p) => sum + (p.sources?.length || 0), 0),
 },
 };
 }

 async getResearchSettings(): Promise<{ success: boolean; data: ResearchSettings }> {
 return { success: true, data: this.getSettings() };
 }

 async updateResearchSettings(settings: Partial<ResearchSettings>): Promise<{ success: boolean; data: ResearchSettings }> {
 const current = this.getSettings();
 const updated = { ...current, ...settings };
 this.saveSettings(updated);
 return { success: true, data: updated };
 }

 // --- Create Research ---------------------------------------------------------

 async createResearch(query: string, name?: string, projectId?: number | null): Promise<{ success: boolean; data: ResearchProject; message: string }> {
 const settings = this.getSettings();
 const id = crypto.randomBytes(8).toString('hex');
 const project: ResearchProject = {
 id,
 projectId: projectId !== undefined ? projectId : settings.defaultProjectId,
 name: name || query.slice(0, 80),
 query,
 status:'idle',
 searchResults: [],
 analysis:'',
 summary:'',
 keyFindings: [],
 sources: [],
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 };

 const projects = this.getResearchProjects();
 projects.unshift(project);
 this.saveResearchProjects(projects);

 return { success: true, data: project, message:'Research created' };
 }

 // --- Run Research (Search + Analyze) -----------------------------------------

 private isOpenAIModel(model: string): boolean {
 return model.startsWith('gpt-');
 }

 async runResearch(id: string, modelOverride?: string): Promise<{ success: boolean; data?: ResearchProject; message: string }> {
 const braveKey = this.getApiKey('brave');
 const effectiveModel = modelOverride || this.getSettings().claudeModel;
 const useOpenAI = this.isOpenAIModel(effectiveModel);
 const aiKey = useOpenAI ? this.getApiKey('openai') : this.getApiKey('claude');

 if (!braveKey) {
 return { success: false, message:'Brave Search API key not found. Add one named "brave" in Settings > Integrations.' };
 }
 if (!aiKey) {
 const provider = useOpenAI ?'OpenAI' :'Claude';
 const keyName = useOpenAI ?'openai' :'claude';
 return { success: false, message:`${provider} API key not found. Add one named "${keyName}" in Settings > Integrations.` };
 }

 const projects = this.getResearchProjects();
 const idx = projects.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Research not found' };

 const project = projects[idx];
 const settings = this.getSettings();
 // Allow per-request model override
 if (modelOverride) {
 settings.claudeModel = modelOverride;
 }

 // Step 1: Search with Brave
 projects[idx] = { ...project, status:'searching', updatedAt: new Date().toISOString() };
 this.saveResearchProjects(projects);

 try {
 const searchResponse = await axios.get('https://api.search.brave.com/res/v1/web/search', {
 params: {
 q: project.query,
 count: settings.searchCount,
 },
 headers: {
'Accept':'application/json',
'Accept-Encoding':'gzip',
'X-Subscription-Token': braveKey,
 },
 timeout: 30000,
 });

 const webResults = searchResponse.data.web?.results || [];
 const searchResults: SearchResult[] = webResults.map((r: any) => ({
 title: r.title ||'',
 url: r.url ||'',
 description: r.description ||'',
 age: r.age ||'',
 }));

 projects[idx] = {
 ...projects[idx],
 searchResults,
 status:'analyzing',
 updatedAt: new Date().toISOString(),
 };
 this.saveResearchProjects(projects);

 // Step 2: Analyze with AI (Claude or OpenAI)
 const depthGuide = {
 brief:'Provide a concise 2-3 paragraph summary.',
 standard:'Provide a thorough analysis with sections, key findings, and actionable insights.',
 deep:'Provide an in-depth comprehensive analysis with detailed sections, data points, comparisons, key findings, recommendations, and potential opportunities.',
 };

 const analysisPrompt =`Research Query: "${project.query}"

Here are the search results I found:

${searchResults.map((r, i) =>`${i + 1}. **${r.title}**
 URL: ${r.url}
 ${r.description}
`).join('\n')}

${depthGuide[settings.analysisDepth]}

Return your response as valid JSON with these fields:
- "summary": A clear executive summary (2-4 sentences)
- "analysis": Full analysis in HTML format using <h3>, <p>, <ul>, <li>, <strong>, <em> tags. No <html>/<head>/<body> wrappers.
- "keyFindings": Array of 3-8 key findings (short strings)
- "sources": Array of the most relevant sources, each with "title", "url", and "relevance" (one-line explanation of why it's relevant)`;

 let responseText ='';
 const maxTokens = settings.analysisDepth ==='deep' ? 4096 : settings.analysisDepth ==='standard' ? 2048 : 1024;

 if (useOpenAI) {
 // OpenAI path
 const openaiResponse = await axios.post(
'https://api.openai.com/v1/chat/completions',
 {
 model: effectiveModel,
 max_tokens: maxTokens,
 messages: [
 { role:'system', content:'You are a research analyst. Respond with valid JSON only, no markdown fences.' },
 { role:'user', content: analysisPrompt },
 ],
 temperature: 0.5,
 },
 {
 headers: {
'Authorization':`Bearer ${aiKey}`,
'Content-Type':'application/json',
 },
 timeout: 120000,
 },
 );

 const oTokIn = openaiResponse.data.usage?.prompt_tokens || 0;
 const oTokOut = openaiResponse.data.usage?.completion_tokens || 0;
 const oRates: Record<string, [number,number]> = {'gpt-4': [30,60],'gpt-4o': [2.5,10],'gpt-4o-mini': [0.15,0.6] };
 const [oIn, oOut] = oRates[effectiveModel] || [2.5,10];
 await this.analyticsService.trackApiUsage({
 provider:'openai' as any, endpoint:'/chat/completions', model: effectiveModel,
 tokensIn: oTokIn, tokensOut: oTokOut, cost: (oTokIn * oIn + oTokOut * oOut) / 1_000_000,
 duration: 0, statusCode: 200, success: true, module:'research',
 }).catch(() => {});

 responseText = openaiResponse.data.choices?.[0]?.message?.content ||'';
 } else {
 // Claude path
 const claudeResponse = await axios.post(
'https://api.anthropic.com/v1/messages',
 {
 model: settings.claudeModel,
 max_tokens: maxTokens,
 messages: [
 { role:'user', content: analysisPrompt },
 ],
 },
 {
 headers: {
'x-api-key': aiKey,
'anthropic-version':'2023-06-01',
'Content-Type':'application/json',
 },
 timeout: 120000,
 },
 );

 const cTokIn = claudeResponse.data.usage?.input_tokens || 0;
 const cTokOut = claudeResponse.data.usage?.output_tokens || 0;
 const cRates: Record<string, [number,number]> = {'claude-sonnet-4-20250514': [3,15],'claude-3-5-sonnet-20241022': [3,15] };
 const [cIn, cOut] = cRates[settings.claudeModel] || [3,15];
 await this.analyticsService.trackApiUsage({
 provider:'anthropic' as any, endpoint:'/messages', model: settings.claudeModel,
 tokensIn: cTokIn, tokensOut: cTokOut, cost: (cTokIn * cIn + cTokOut * cOut) / 1_000_000,
 duration: 0, statusCode: 200, success: true, module:'research',
 }).catch(() => {});

 responseText = claudeResponse.data.content?.[0]?.text ||'';
 }
 // Extract JSON from response (might be wrapped in```json blocks)
 const jsonMatch = responseText.match(/\{[\s\S]*\}/);
 if (!jsonMatch) {
 throw new Error('Failed to parse Claude response as JSON');
 }

 const result = JSON.parse(jsonMatch[0]);

 const updatedProject: ResearchProject = {
 ...projects[idx],
 summary: result.summary ||'',
 analysis: result.analysis ||'',
 keyFindings: result.keyFindings || [],
 sources: result.sources || [],
 status:'complete',
 updatedAt: new Date().toISOString(),
 };

 projects[idx] = updatedProject;
 this.saveResearchProjects(projects);

 return { success: true, data: updatedProject, message:'Research complete' };
 } catch (error: any) {
 const errorMsg = error.response?.data?.error?.message || error.message ||'Research failed';
 projects[idx] = { ...projects[idx], status:'failed', error: errorMsg, updatedAt: new Date().toISOString() };
 this.saveResearchProjects(projects);
 return { success: false, message:`Research failed: ${errorMsg}` };
 }
 }

 // --- Delete ------------------------------------------------------------------

 async deleteResearch(id: string): Promise<{ success: boolean; message: string }> {
 let projects = this.getResearchProjects();
 const idx = projects.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Research not found' };
 projects.splice(idx, 1);
 this.saveResearchProjects(projects);
 return { success: true, message:'Research deleted' };
 }

 async deleteMultiple(ids: string[]): Promise<{ success: boolean; message: string }> {
 let projects = this.getResearchProjects();
 projects = projects.filter((p) => !ids.includes(p.id));
 this.saveResearchProjects(projects);
 return { success: true, message:`${ids.length} research(es) deleted` };
 }

 // --- Update ------------------------------------------------------------------

 async updateResearch(id: string, updates: Partial<ResearchProject>): Promise<{ success: boolean; data?: ResearchProject; message: string }> {
 const projects = this.getResearchProjects();
 const idx = projects.findIndex((p) => p.id === id);
 if (idx === -1) return { success: false, message:'Research not found' };

 const updated: ResearchProject = {
 ...projects[idx],
 ...updates,
 id: projects[idx].id,
 updatedAt: new Date().toISOString(),
 };
 projects[idx] = updated;
 this.saveResearchProjects(projects);
 return { success: true, data: updated, message:'Research updated' };
 }

 // --- Project Index -----------------------------------------------------------

 async getProjectIndex(): Promise<{ success: boolean; data: any[] }> {
 const projects = this.getResearchProjects();
 const data = this.readDb();
 const apps = data.apps || [];

 const projectMap: Record<string, ResearchProject[]> = {};
 for (const rp of projects) {
 const key = rp.projectId != null ? String(rp.projectId) :'unassigned';
 if (!projectMap[key]) projectMap[key] = [];
 projectMap[key].push(rp);
 }

 const index = apps.map((app: any) => {
 const appResearch = projectMap[String(app.id)] || [];
 return {
 projectId: app.id,
 projectName: app.name,
 projectColor: app.primary_color,
 total: appResearch.length,
 complete: appResearch.filter((r: ResearchProject) => r.status ==='complete').length,
 inProgress: appResearch.filter((r: ResearchProject) => r.status ==='searching' || r.status ==='analyzing').length,
 failed: appResearch.filter((r: ResearchProject) => r.status ==='failed').length,
 };
 });

 const unassigned = projectMap['unassigned'] || [];
 if (unassigned.length > 0) {
 index.unshift({
 projectId: null,
 projectName:'Unassigned',
 projectColor:'#999',
 total: unassigned.length,
 complete: unassigned.filter((r: ResearchProject) => r.status ==='complete').length,
 inProgress: unassigned.filter((r: ResearchProject) => r.status ==='searching' || r.status ==='analyzing').length,
 failed: unassigned.filter((r: ResearchProject) => r.status ==='failed').length,
 });
 }

 return { success: true, data: index };
 }
}
