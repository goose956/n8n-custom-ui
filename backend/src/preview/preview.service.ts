import { Injectable, Logger, OnModuleDestroy } from'@nestjs/common';
import * as fs from'fs';
import * as path from'path';
import * as os from'os';
import * as crypto from'crypto';

/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('vite') as {
 createServer: (opts: any) => Promise<any>;
};
// @ts-ignore -- moduleResolution incompatibility
const reactPlugin = require('@vitejs/plugin-react');
const react = typeof reactPlugin ==='function' ? reactPlugin : reactPlugin.default;

type ViteDevServer = { listen(): Promise<any>; close(): Promise<any> };
type Plugin = { name: string; resolveId?: Function; load?: Function };

interface PreviewSession {
 id: string;
 port: number;
 tmpDir: string;
 server: ViteDevServer;
 entryFile: string;
 componentName: string;
}

/**
 * Preview service using Vite's **programmatic API** (createServer).
 *
 * Unlike spawning vite as a child process, this runs Vite in-process --
 * no spawn, no taskkill, no Windows process issues.
 *
 * - User files written to temp dir
 * - node_modules symlinked from frontend/
 * - Stub plugins are real JS objects (no vite.config.ts string templating)
 * - Vite HMR picks up file changes automatically
 */
@Injectable()
export class PreviewService implements OnModuleDestroy {
 private readonly logger = new Logger(PreviewService.name);
 private readonly frontendRoot: string;
 private readonly sessions = new Map<string, PreviewSession>();
 private nextPort = 5200;

 constructor() {
 this.frontendRoot = path.resolve(__dirname,'..','..','..','frontend');
 }

 async onModuleDestroy() {
 for (const [id] of this.sessions) {
 await this.stop(id);
 }
 }

 /* ------------------------------------------------------------------ */
 /* Start */
 /* ------------------------------------------------------------------ */

 async start(req: {
 files: { path: string; content: string }[];
 entryFile: string;
 componentName: string;
 primaryColor?: string;
 }): Promise<{ sessionId: string; port: number }> {
 const sessionId = crypto.randomBytes(8).toString('hex');
 const port = this.nextPort++;
 if (this.nextPort > 5299) this.nextPort = 5200;

 const tmpDir = path.join(os.tmpdir(),`preview-${sessionId}`);
 const primaryColor = req.primaryColor ||'#667eea';
 const entryFile = this.normalizePath(req.entryFile);

 fs.mkdirSync(path.join(tmpDir,'src','components'), { recursive: true });

 // Symlink node_modules from frontend (junction on Windows)
 const nmSource = path.join(this.frontendRoot,'node_modules');
 const nmTarget = path.join(tmpDir,'node_modules');
 try {
 fs.symlinkSync(nmSource, nmTarget,'junction');
 } catch {
 try { fs.symlinkSync(nmSource, nmTarget,'dir'); } catch (e2) {
 this.logger.error('Could not symlink node_modules', e2);
 throw new Error('Failed to symlink node_modules');
 }
 }

 // Write files
 this.writeUserFiles(tmpDir, req.files);
 this.writeIndexHtml(tmpDir);
 this.writeMainTsx(tmpDir, entryFile, req.componentName, primaryColor);

 // Create Vite server using programmatic API -- no child process
 this.logger.warn(`[DEBUG] start() called -- sessionId=${sessionId} port=${port}`);
 this.logger.warn(`[DEBUG] tmpDir = ${tmpDir}`);
 this.logger.warn(`[DEBUG] entryFile = ${entryFile}`);
 this.logger.warn(`[DEBUG] componentName = ${req.componentName}`);
 this.logger.warn(`[DEBUG] files received: ${req.files.map(f => f.path).join(',')}`);
 this.logger.warn(`[DEBUG] frontendRoot = ${this.frontendRoot}`);
 this.logger.warn(`[DEBUG] node_modules symlink: ${nmSource} -> ${nmTarget}`);

 // List what was written
 const writtenFiles = this.listFilesRecursive(tmpDir);
 this.logger.warn(`[DEBUG] Files in tmpDir after write:\n${writtenFiles.join('\n')}`);

 // Read the generated main.tsx for debugging
 const mainContent = fs.readFileSync(path.join(tmpDir,'src','main.tsx'),'utf-8');
 this.logger.warn(`[DEBUG] Generated main.tsx (first 500 chars):\n${mainContent.substring(0, 500)}`);

 const server = await createServer({
 root: tmpDir,
 configFile: false,
 plugins: [
 react(),
 this.stubMissingLocals(),
 this.stubMissingPackages(tmpDir),
 this.stubMissingIcons(tmpDir),
 ],
 server: {
 port,
 strictPort: true,
 host:'0.0.0.0',
 cors: true,
 hmr: true,
 },
 resolve: {
 extensions: ['.tsx','.ts','.jsx','.js'],
 },
 define: {
'import.meta.env.VITE_API_URL': JSON.stringify(''),
 },
 logLevel:'info',
 });

 await server.listen();
 this.logger.warn(`[DEBUG] [OK] Vite server.listen() completed -- http://localhost:${port}`);

 const session: PreviewSession = {
 id: sessionId, port, tmpDir, server,
 entryFile, componentName: req.componentName,
 };
 this.sessions.set(sessionId, session);
 return { sessionId, port };
 }

 /* ------------------------------------------------------------------ */
 /* Update */
 /* ------------------------------------------------------------------ */

 async update(req: {
 sessionId: string;
 files: { path: string; content: string }[];
 entryFile: string;
 componentName: string;
 primaryColor?: string;
 }): Promise<void> {
 const session = this.sessions.get(req.sessionId);
 if (!session) throw new Error(`Session ${req.sessionId} not found`);

 const entryFile = this.normalizePath(req.entryFile);
 const primaryColor = req.primaryColor ||'#667eea';

 this.writeUserFiles(session.tmpDir, req.files);

 if (entryFile !== session.entryFile || req.componentName !== session.componentName) {
 this.writeMainTsx(session.tmpDir, entryFile, req.componentName, primaryColor);
 session.entryFile = entryFile;
 session.componentName = req.componentName;
 }
 // Vite HMR picks up the file changes automatically
 }

 /* ------------------------------------------------------------------ */
 /* Stop */
 /* ------------------------------------------------------------------ */

 async stop(sessionId: string): Promise<void> {
 const session = this.sessions.get(sessionId);
 if (!session) return;

 try { await session.server.close(); } catch {}

 setTimeout(() => {
 try {
 const nmLink = path.join(session.tmpDir,'node_modules');
 if (fs.existsSync(nmLink)) fs.unlinkSync(nmLink);
 fs.rmSync(session.tmpDir, { recursive: true, force: true });
 } catch {}
 }, 1000);

 this.sessions.delete(sessionId);
 this.logger.log(`Preview ${sessionId} stopped`);
 }

 /* ================================================================== */
 /* File helpers */
 /* ================================================================== */

 private normalizePath(p: string): string {
 let n = p.replace(/\\/g,'/').replace(/^\.\//,'');
 for (const prefix of ['frontend/src/components/','src/components/']) {
 if (n.startsWith(prefix)) { n = n.slice(prefix.length); break; }
 }
 return n;
 }

 private sanitize(content: string): string {
 let c = content;
 // Strip AI artifact fences / delimiters (===FILE:...===, ===END_FILE===,```tsx, etc.)
 c = c.replace(/^===\s*(?:FILE|END_FILE|END)\s*[:.]?.*===\s*\n?/gim,'');
 c = c.replace(/^```(?:tsx|jsx|typescript|ts|javascript|js)?\s*\n?/gm,'');
 c = c.replace(/^```\s*$/gm,'');
 c = c.replace(/^(?:===|---|\+\+\+)[^\n]*\n?/gm,'');
 return c.trim() +'\n';
 }

 private rewriteIconBarrels(content: string): string {
 return content.replace(
 /import\s*\{([^}]+)\}\s*from\s*['"]@mui\/icons-material['"]\s*;?/g,
 (_match, imports: string) =>
 imports
 .split(',')
 .map(s => s.trim())
 .filter(Boolean)
 .map(name => {
 const parts = name.split(/\s+as\s+/);
 const orig = parts[0].trim();
 const alias = parts.length > 1 ? parts[1].trim() : orig;
 return`import ${alias} from'@mui/icons-material/${orig}';`;
 })
 .join('\n'),
 );
 }

 /** Scan JSX for MUI icon usage that isn't imported and auto-add imports */
 private addMissingIconImports(content: string): string {
 // Common MUI icon names (PascalCase, typically used as <IconName /> in JSX)
 const knownIcons = new Set([
'AccountCircle','Add','Analytics','ArrowBack','ArrowDownward','ArrowForward','ArrowUpward',
'Assignment','AttachMoney','Badge','BarChart','Bookmark','Build','CalendarToday','Cancel',
'Chat','Check','CheckCircle','ChevronLeft','ChevronRight','Close','Cloud','Code','Comment',
'ContentCopy','Dashboard','DateRange','Delete','Description','Download','Edit','Email',
'Error','Event','ExpandMore','Favorite','FavoriteBorder','FilterList','Flag','Folder',
'Group','Help','History','Home','Image','Info','Insights','Language','Launch','Link',
'List','LocalOffer','LocationOn','Lock','Login','Logout','Mail','Menu','MonetizationOn',
'MoreVert','Notifications','OpenInNew','People','Person','PersonAdd','Phone','PhotoCamera',
'PieChart','PlayArrow','Public','Publish','Refresh','Remove','Report','SaveAlt','Save',
'Schedule','School','Science','Search','Security','Send','Settings','Share','ShoppingCart',
'Speed','Star','StarBorder','Support','SupportAgent','ThumbUp','Timeline','Timer',
'TrendingDown','TrendingUp','Upload','Verified','Visibility','VisibilityOff','Warning',
'Work','Layers','Category','Inventory','Storage','Tune','AutoAwesome','Lightbulb',
 ]);
 // Collect all already-imported identifiers
 const importedNames = new Set<string>();
 const importRe = /import\s+(\w+)\s+from\s+['"]@mui\/icons-material\/\w+['"]/g;
 let m: RegExpExecArray | null;
 while ((m = importRe.exec(content)) !== null) importedNames.add(m[1]);
 // Also check barrel-style (shouldn't exist after rewrite, but just in case)
 const barrelRe = /import\s*\{([^}]+)\}\s*from\s*['"]@mui\/icons-material['"]/g;
 while ((m = barrelRe.exec(content)) !== null) {
 for (const n of m[1].split(',')) {
 const name = n.trim().split(/\s+as\s+/).pop()?.trim();
 if (name) importedNames.add(name);
 }
 }
 // Find JSX usage: <IconName or <IconName> pattern
 const jsxRe = /<([A-Z][a-zA-Z]+)\s/g;
 const missing = new Set<string>();
 while ((m = jsxRe.exec(content)) !== null) {
 const name = m[1];
 if (knownIcons.has(name) && !importedNames.has(name)) missing.add(name);
 }
 if (missing.size === 0) return content;
 // Insert missing imports after last existing import
 this.logger.warn(`[PREVIEW] Auto-adding missing icon imports: ${[...missing].join(',')}`);
 const newImports = [...missing].map(n =>`import ${n} from'@mui/icons-material/${n}';`).join('\n');
 const lastImportIdx = content.lastIndexOf('\nimport');
 if (lastImportIdx >= 0) {
 const eol = content.indexOf('\n', lastImportIdx + 1);
 return content.slice(0, eol) +'\n' + newImports + content.slice(eol);
 }
 return newImports +'\n' + content;
 }

 private writeUserFiles(tmpDir: string, files: { path: string; content: string }[]) {
 for (const file of files) {
 const normalized = this.normalizePath(file.path);
 const filePath = path.join(tmpDir,'src','components', normalized);
 fs.mkdirSync(path.dirname(filePath), { recursive: true });
 let content = this.sanitize(file.content);
 content = this.rewriteIconBarrels(content);
 content = this.addMissingIconImports(content);
 fs.writeFileSync(filePath, content,'utf-8');
 this.logger.warn(`[DEBUG] Wrote file: ${filePath} (${content.length} bytes, first 120: ${content.substring(0, 120).replace(/\n/g,'↵')})`);
 }
 }

 /** Recursively list all files in a directory (for debug logging) */
 private listFilesRecursive(dir: string, prefix =''): string[] {
 const results: string[] = [];
 try {
 for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
 const rel = prefix ? prefix +'/' + entry.name : entry.name;
 if (entry.name ==='node_modules') { results.push(rel +'/ (symlink)'); continue; }
 if (entry.isDirectory()) {
 results.push(...this.listFilesRecursive(path.join(dir, entry.name), rel));
 } else {
 results.push(rel);
 }
 }
 } catch {}
 return results;
 }

 private writeIndexHtml(tmpDir: string) {
 fs.writeFileSync(path.join(tmpDir,'index.html'),`<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
 <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
 <style>
 *{margin:0;padding:0;box-sizing:border-box}
 body{font-family:'Inter',-apple-system,sans-serif;background:#fff}
 #root{min-height:100vh}
 #__debug_overlay{position:fixed;bottom:0;left:0;right:0;max-height:50vh;overflow:auto;background:#1e1e2e;color:#f38ba8;font-family:'Courier New',monospace;font-size:12px;padding:12px;z-index:99999;border-top:3px solid #f38ba8;white-space:pre-wrap;word-break:break-all}
 #__debug_overlay .title{color:#fab387;font-weight:bold;margin-bottom:4px}
 </style>
 <title>Preview</title>
</head>
<body>
 <div id="root"></div>
 <div id="__debug_overlay" style="display:none"></div>
 <script>
 // DEBUG: Catch all errors and show them on-screen
 var __dbg = document.getElementById('__debug_overlay');
 var __logs = [];
 function __showError(label, msg) {
 __logs.push('<div class="title">[' + label +']</div><div>' + msg +'</div><hr style="border-color:#45475a;margin:6px 0">');
 __dbg.innerHTML = __logs.join('');
 __dbg.style.display ='block';
 __dbg.scrollTop = __dbg.scrollHeight;
 }
 window.addEventListener('error', function(e) {
 __showError('JS ERROR', e.message +'\n' + (e.filename ||'') +':' + (e.lineno ||'') +':' + (e.colno ||'') +'\n' + (e.error && e.error.stack ? e.error.stack :''));
 });
 window.addEventListener('unhandledrejection', function(e) {
 var msg = e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) :'Unknown rejection';
 __showError('UNHANDLED PROMISE', msg);
 });
 // Also intercept console.error
 var _origConsoleError = console.error;
 console.error = function() {
 _origConsoleError.apply(console, arguments);
 var args = Array.from(arguments).map(function(a) { return typeof a ==='object' ? JSON.stringify(a, null, 2) : String(a); });
 __showError('console.error', args.join(''));
 };
 console.log('[PREVIEW DEBUG] index.html loaded, error overlay installed');
 </script>
 <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,'utf-8');
 }

 private writeMainTsx(tmpDir: string, entryFile: string, componentName: string, color: string) {
 const importPath ='./components/' + entryFile.replace(/\.(tsx|jsx|ts|js)$/,'');
 fs.writeFileSync(path.join(tmpDir,'src','main.tsx'),`
console.log('[PREVIEW DEBUG] main.tsx executing...');
console.log('[PREVIEW DEBUG] import path: ${importPath}');

import React from'react';
import ReactDOM from'react-dom/client';
import { createTheme, ThemeProvider, CssBaseline } from'@mui/material';
import { MemoryRouter } from'react-router-dom';

console.log('[PREVIEW DEBUG] React loaded:', typeof React);
console.log('[PREVIEW DEBUG] ReactDOM loaded:', typeof ReactDOM);

let _Mod: any;
try {
 _Mod = await import('${importPath}');
 console.log('[PREVIEW DEBUG] Module loaded. Keys:', Object.keys(_Mod));
 console.log('[PREVIEW DEBUG] Module.default type:', typeof _Mod.default);
} catch (err: any) {
 console.error('[PREVIEW DEBUG] [X] FAILED to import component module:', err.message, err.stack);
 document.getElementById('root')!.innerHTML ='<div style="padding:32px;font-family:monospace;color:red"><h2>Import Error</h2><pre>' + (err.stack || err.message) +'</pre></div>';
 throw err;
}

const _M = _Mod as any;

function _resolve(): React.ComponentType<any> {
 if (typeof _M.default ==='function') { console.log('[PREVIEW DEBUG] Using default export'); return _M.default; }
 if (typeof _M['${componentName}'] ==='function') { console.log('[PREVIEW DEBUG] Using named export: ${componentName}'); return _M['${componentName}']; }
 for (const k of Object.keys(_M)) {
 if (typeof _M[k] ==='function' && /^[A-Z]/.test(k)) { console.log('[PREVIEW DEBUG] Using first PascalCase export:', k); return _M[k]; }
 }
 console.error('[PREVIEW DEBUG] [X] No renderable component found! Module keys:', Object.keys(_M));
 return () => React.createElement('div', {style:{padding:32,fontFamily:'monospace',color:'red'}},'No renderable component found. Module exports:' + Object.keys(_M).join(','));
}

const Component = _resolve();
console.log('[PREVIEW DEBUG] Resolved component:', Component?.name || Component);

// -- Error Boundary --------------------------------------------------
// Catches async render crashes (e.g. after fetch data arrives with
// an unexpected shape) so the preview shows an error instead of going blank.
class PreviewErrorBoundary extends React.Component<
 { children: React.ReactNode },
 { error: Error | null }
> {
 state = { error: null as Error | null };
 static getDerivedStateFromError(error: Error) { return { error }; }
 componentDidCatch(error: Error, info: any) {
 console.error('[PREVIEW] Component crashed:', error.message, info?.componentStack);
 }
 render() {
 if (this.state.error) {
 return React.createElement('div', {
 style: { padding: 32, fontFamily: "'Inter', monospace", color:'#d32f2f', maxWidth: 720, margin:'40px auto' }
 },
 React.createElement('h2', { style: { marginBottom: 12 } },'Preview Render Error'),
 React.createElement('pre', {
 style: { background:'#fef2f2', padding: 16, borderRadius: 8, fontSize: 13, whiteSpace:'pre-wrap', wordBreak:'break-word', border:'1px solid #fecaca' }
 }, this.state.error.message +'\\n\\n' + (this.state.error.stack ||'')),
 React.createElement('button', {
 onClick: () => this.setState({ error: null }),
 style: { marginTop: 16, padding:'8px 20px', border:'none', borderRadius: 6, background:'#1976d2', color:'#fff', cursor:'pointer', fontSize: 14 }
 },'Retry')
 );
 }
 return this.props.children;
 }
}

// -- Stub ALL fetch calls --------------------------------------------
// Return rich mock data covering the most common property-access patterns
// so components don't crash when accessing data.activities, data.stats, etc.
const _realFetch = window.fetch.bind(window);
const _cdnHosts = ['fonts.googleapis','unpkg.com','cdnjs.cloudflare','cdn.jsdelivr'];

// Deep safe-access Proxy: any property path returns a sensible default
// instead of throwing "Cannot read properties of undefined".
// Also handles React rendering: Symbol.iterator yields nothing so React
// treats unknown proxy values as empty rather than "Objects are not valid as React child".
function _safeProxy(obj: any): any {
 if (obj === null || obj === undefined) obj = {};
 if (typeof obj !=='object') return obj;
 return new Proxy(Array.isArray(obj) ? [...obj] : { ...obj }, {
 get(target: any, prop: string | symbol, receiver: any) {
 // Symbol handling -- critical for React rendering and coercion
 if (typeof prop ==='symbol') {
 // First check if the target already has this symbol (e.g. arrays have Symbol.iterator)
 const real = Reflect.get(target, prop, receiver);
 if (real !== undefined) return real;
 // For plain objects that LACK Symbol.iterator, provide an empty generator
 // so React treats them as empty iterables instead of crashing with
 // "Objects are not valid as React child"
 if (prop === Symbol.iterator) return function*() {};
 // Allow coercion to primitive (template literals, string concat, etc.)
 if (prop === Symbol.toPrimitive) return () =>'';
 return real;
 }
 if (prop ==='toJSON') return () => target;
 if (prop ==='then') return undefined; // never be thenable
 // If the property exists, return it (wrapped if object)
 if (prop in target) {
 const v = target[prop];
 if (v !== null && typeof v ==='object') return _safeProxy(v);
 return v;
 }
 // Array methods on non-arrays -> act as empty array
 if (['map','filter','forEach','reduce','find','some','every','flat','flatMap',
'slice','splice','concat','includes','indexOf','join','keys','values',
'entries','sort','reverse','push','pop','shift','unshift'].includes(prop as string)) {
 return ([] as any)[prop].bind([]);
 }
 if (prop ==='length') return target.length ?? 0;
 if (prop ==='toString' || prop ==='valueOf') return () =>'';
 // Unknown property -> return another safe proxy (so chained access never throws)
 return _safeProxy({});
 }
 });
}

const _mockData = {
 // top-level arrays
 data: [], items: [], results: [], tickets: [], members: [],
 activities: [], posts: [], comments: [], orders: [], invoices: [],
 transactions: [], logs: [], events: [], tasks: [], scripts: [],
 records: [], entries: [], notifications: [], messages: [], users: [],
 visitors: [], errors: [], executions: [], apiUsage: [],
 // stats / metrics
 stats: { totalViews: 128, totalLikes: 47, totalShares: 23, totalComments: 12,
 views: 128, likes: 47, shares: 23, comments: 12,
 revenue: 1250, users: 89, sessions: 342, engagementRate: 4.7 },
 metrics: { views: 128, likes: 47, shares: 23, comments: 12 },
 analytics: { views: 128, likes: 47, shares: 23, comments: 12, engagementRate: 4.7 },
 dashboard: { activities: [], stats: { totalViews: 128, totalLikes: 47, totalShares: 23 } },
 // profile / user
 profile: { id: 1, firstName:'Jane', lastName:'Doe', name:'Jane Doe',
 email:'jane@example.com', avatar:'', phone:'', bio:'',
 socialMediaLinks: [], socialLinks: [], username:'janedoe' },
 user: { id: 1, firstName:'Jane', lastName:'Doe', name:'Jane Doe',
 email:'jane@example.com', role:'member', avatar:'', plan:'pro' },
 // settings -- deeply nested so any sub-property access works
 settings: { theme:'light', notifications: true, language:'en', timezone:'UTC',
 privacy: { dataSharing: false, profileVisibility:'public', activityTracking: true },
 email: { marketing: true, updates: true, digest:'weekly' },
 security: { twoFactor: false, loginAlerts: true, sessionTimeout: 30 },
 display: { compactMode: false, showAvatar: true, darkMode: false },
 dataSharing: false, profileVisibility:'public' },
 // pagination / meta
 success: true, ok: true, total: 0, count: 0, page: 1, pages: 1, hasMore: false,
 firstName:'Jane', lastName:'Doe', name:'Jane Doe', email:'jane@example.com',
 socialMediaLinks: [],
 // billing
 billing: { plan:'Pro', status:'active', nextBillingDate:'2026-03-01', history: [] },
 subscription: { plan:'Pro', status:'active', interval:'monthly', amount: 29 },
 paymentHistory: [], billingHistory: [],
};

(window as any).fetch = function(input: any, init?: any) {
 const url = typeof input ==='string' ? input : input?.url ||'';
 // Pass through CDN requests and real backend API calls (admin panel)
 if (_cdnHosts.some(h => url.includes(h))) return _realFetch(input, init);
 if (url.includes('localhost:3000') || url.startsWith('/api/')) {
 // Real backend call -- rewrite relative /api/ to absolute
 const absUrl = url.startsWith('/api/') ?'http://localhost:3000' + url : url;
 return _realFetch(absUrl, init).then(function(resp: any) {
 // If the endpoint doesn't exist (404) or server error, fall back to mock data
 if (!resp.ok) {
 console.warn('[PREVIEW] Backend returned', resp.status,'for', absUrl,'-- falling back to mock data');
 const _seg2 = url.replace(/\\/+$/,'').split('/').pop()?.replace(/\\?.*/,'') ||'';
 const _val2 = (_mockData as any)[_seg2];
 const _body2 = _val2 !== undefined ? _val2 : [];
 return { ok: true, status: 200, json: () => Promise.resolve(_safeProxy(_body2)), text: () => Promise.resolve(JSON.stringify(_body2)), clone: function() { return this; } };
 }
 // Wrap .json() to auto-unwrap { success, data } envelope and apply _safeProxy
 const origJson = resp.json.bind(resp);
 resp.json = function() {
 return origJson().then(function(body: any) {
 // If response has { data: ... }, return data directly so code like visitors.map() works
 if (body && typeof body ==='object' &&'data' in body && !Array.isArray(body)) {
 return _safeProxy(body.data);
 }
 return _safeProxy(body);
 });
 };
 return resp;
 }).catch(function(err: any) {
 console.warn('[PREVIEW] Backend fetch failed:', absUrl, err.message);
 // Fallback to mock data on network error
 const _seg = url.replace(/\\/+$/,'').split('/').pop()?.replace(/\\?.*/,'') ||'';
 const _val = (_mockData as any)[_seg];
 const _body = _val !== undefined ? _val : [];
 return { ok: true, status: 200, json: () => Promise.resolve(_safeProxy(_body)), text: () => Promise.resolve(JSON.stringify(_body)), clone: function() { return this; } };
 });
 }
 const _seg = url.replace(/\\/+$/,'').split('/').pop()?.replace(/\\?.*/,'') ||'';
 const _val = (_mockData as any)[_seg];
 const _body = _val !== undefined ? _val : _mockData;
 console.log('[PREVIEW] Stubbed fetch:', url,'-> key:', _seg,'-> isArray:', Array.isArray(_body));
 // Wrap response.json() result in _safeProxy so nested property access never throws
 const _jsonStr = JSON.stringify(_body);
 return Promise.resolve({
 ok: true, status: 200, statusText:'OK',
 headers: new Headers({'Content-Type':'application/json' }),
 json: () => Promise.resolve(_safeProxy(JSON.parse(_jsonStr))),
 text: () => Promise.resolve(_jsonStr),
 clone: function() { return this; },
 } as any);
} as typeof fetch;

const theme = createTheme({
 palette: { primary: { main:'${color}' } },
 typography: { fontFamily: "'Inter', -apple-system, sans-serif" },
 shape: { borderRadius: 8 },
});

console.log('[PREVIEW DEBUG] About to render...');
try {
 const root = ReactDOM.createRoot(document.getElementById('root')!);
 root.render(
 React.createElement(PreviewErrorBoundary, null,
 React.createElement(MemoryRouter, null,
 React.createElement(ThemeProvider, { theme },
 React.createElement(CssBaseline),
 React.createElement(Component)
 )
 )
 )
 );
 console.log('[PREVIEW DEBUG] [OK] render() called successfully');
} catch (err: any) {
 console.error('[PREVIEW DEBUG] [X] Render error:', err.message, err.stack);
 document.getElementById('root')!.innerHTML ='<div style="padding:32px;font-family:monospace;color:red"><h2>Render Error</h2><pre>' + (err.stack || err.message) +'</pre></div>';
}
`,'utf-8');
 }

 /* ================================================================== */
 /* Vite plugins (real JS objects -- no string templating!) */
 /* ================================================================== */

 /** Stub any relative import that doesn't resolve to a real file */
 private stubMissingLocals(): Plugin {
 // Use a Map to store metadata keyed by hash -- avoids putting ../ in virtual
 // module IDs which the browser resolves before sending the request.
 const stubMeta = new Map<string, { source: string; names: string[] }>();
 return {
 name:'stub-missing-locals',
 resolveId(source: string, importer: string | undefined) {
 if (!source.startsWith('.') || !importer) return null;
 if (importer.includes('node_modules')) return null;
 const dir = path.dirname(importer);
 const base = path.resolve(dir, source);
 const exts = ['','.tsx','.ts','.jsx','.js','/index.tsx','/index.ts','/index.js'];
 for (const ext of exts) {
 try { if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return null; } catch {}
 }
 // Parse the importer to discover what named exports it needs
 const needed = parseNamedImports(importer, source);
 const hash = crypto.createHash('md5').update(source +'|' + importer).digest('hex').slice(0, 12);
 stubMeta.set(hash, { source, names: needed });
 console.log(`[stub-missing-locals] Stubbing: ${source} (from ${importer}) needed=[${needed.join(',')}] -> \0stub:${hash}`);
 return'\0stub:' + hash;
 },
 load(id: string) {
 if (!id.startsWith('\0stub:')) return null;
 const hash = id.slice('\0stub:'.length);
 const meta = stubMeta.get(hash);
 if (!meta) return null;
 return makeStubModule(meta.source, meta.names);
 },
 };
 }

 /** Stub npm packages that aren't installed (next, firebase, etc.) */
 private stubMissingPackages(tmpDir: string): Plugin {
 // Use a Map -- avoids putting slashes (e.g. next/router) in virtual module IDs
 // which can confuse browser URL resolution.
 const pkgMeta = new Map<string, { source: string; names: string[] }>();
 return {
 name:'stub-missing-packages',
 resolveId(source: string, importer: string | undefined) {
 if (!importer || source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;
 if (importer.includes('node_modules')) return null;
 // Allow known-good packages
 if (/^(react|react-dom|@mui|@emotion|recharts|axios|vite|@vitejs)/.test(source)) return null;
 // Check if installed
 const pkgName = source.startsWith('@') ? source.split('/').slice(0, 2).join('/') : source.split('/')[0];
 const pkgDir = path.join(tmpDir,'node_modules', pkgName);
 if (fs.existsSync(pkgDir)) return null;
 const needed = parseNamedImports(importer, source);
 const hash = crypto.createHash('md5').update(source +'|' + (importer ||'')).digest('hex').slice(0, 12);
 pkgMeta.set(hash, { source, names: needed });
 console.log(`[stub-missing-packages] Stubbing: ${source} (from ${importer}) needed=[${needed.join(',')}] -> \0pkg-stub:${hash}`);
 return'\0pkg-stub:' + hash;
 },
 load(id: string) {
 if (!id.startsWith('\0pkg-stub:')) return null;
 const hash = id.slice('\0pkg-stub:'.length);
 const meta = pkgMeta.get(hash);
 if (!meta) return null;
 const { source, names } = meta;
 // next/router, next/navigation
 if (source ==='next/router' || source ==='next/navigation') {
 return`export function useRouter() { return { pathname:'/', push() {}, replace() {}, query: {}, asPath:'/' }; }
export function usePathname() { return'/'; }
export function useSearchParams() { return new URLSearchParams(); }
export default { pathname:'/', push() {}, replace() {} };`;
 }
 if (source ==='next/link') {
 return`import React from'react';
export default function Link(props) { return React.createElement('a', { href: props.href ||'#', style: props.style }, props.children); }`;
 }
 if (source ==='next/image') {
 return`import React from'react';
export default function Image(props) { return React.createElement('img', { src: props.src, alt: props.alt ||'', width: props.width, height: props.height, style: props.style }); }`;
 }
 return makeStubModule(source, names);
 },
 };
 }

 /** Stub @mui/icons-material icons that don't exist */
 private stubMissingIcons(tmpDir: string): Plugin {
 return {
 name:'stub-missing-icons',
 resolveId(source: string, importer: string | undefined) {
 if (!source.startsWith('@mui/icons-material/')) return null;
 if (importer && importer.includes('node_modules')) return null;
 const icon = source.replace('@mui/icons-material/','');
 const iconDir = path.join(tmpDir,'node_modules','@mui','icons-material');
 const candidates = [
 path.join(iconDir,'esm', icon +'.js'),
 path.join(iconDir, icon +'.js'),
 path.join(iconDir, icon,'index.js'),
 ];
 for (const c of candidates) {
 try { if (fs.existsSync(c)) return null; } catch {}
 }
 console.log(`[stub-missing-icons] Stubbing icon: ${icon}`);
 return'\0icon-stub:' + icon;
 },
 load(id: string) {
 if (!id.startsWith('\0icon-stub:')) return null;
 const name = id.replace('\0icon-stub:','');
 const snake = name.replace(/([A-Z])/g,'_$1').toLowerCase().replace(/^_/,'');
 return`import React from'react';
var ${name} = React.forwardRef(function(p, r) {
 return React.createElement('span', Object.assign({}, p, { ref: r, className:'material-icons' + (p.className ||''),
 style: Object.assign({ fontSize: 24 }, p.style || {}) }),'${snake}');
});
${name}.muiName ='SvgIcon';
export default ${name};`;
 },
 };
 }
}

/* -- Shared helpers (outside class for use in plugins) --- */

/** Read an importer file and extract the named imports it pulls from`source` */
function parseNamedImports(importerPath: string, source: string): string[] {
 const names: string[] = [];
 try {
 const code = fs.readFileSync(importerPath,'utf-8');
 // Escape special regex chars in the module specifier
 const esc = source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const re = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${esc}['"]`,'g');
 let m: RegExpExecArray | null;
 while ((m = re.exec(code)) !== null) {
 for (const token of m[1].split(',')) {
 const trimmed = token.trim().split(/\s+as\s+/)[0].trim();
 if (trimmed && !names.includes(trimmed)) names.push(trimmed);
 }
 }
 } catch { /* importer might be a virtual module -- ignore */ }
 return names;
}

function makeStubModule(source: string, requestedExports: string[] = []): string {
 let raw = source.split('/').pop() ||'Stub';
 raw = raw.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9]/g,'') ||'Stub';
 const name = raw.charAt(0).toUpperCase() + raw.slice(1);

 // Static well-known exports
 const builtins = new Set([
'default', name,
'API_BASE_URL','API','useAuth','useRouter','usePathname',
'UserProfile','User','MemberSettings','AppConfig',
 ]);

 // Generate an export for each requested name that isn't already covered
 const extras = requestedExports
 .filter(n => n && !builtins.has(n))
 .map(n => {
 // Heuristic: guess the shape from the name
 if (/^use[A-Z]/.test(n)) return`export var ${n} = function() { return {}; };`;
 if (/^[A-Z]/.test(n) && !/^(?:API|URL|ID)/.test(n))
 return`export function ${n}(props) { return React.createElement('div', null, props && props.children ? props.children :'${n}'); }`;
 if (/routes|paths|links|menu|nav|items|list|tabs/i.test(n)) return`export var ${n} = [];`;
 if (/config|settings|options|theme|colors|palette|context/i.test(n)) return`export var ${n} = {};`;
 if (/count|total|size|length|index|page/i.test(n)) return`export var ${n} = 0;`;
 if (/enabled|visible|active|open|loading|disabled/i.test(n)) return`export var ${n} = false;`;
 if (/url|path|name|title|label|key|token|id/i.test(n)) return`export var ${n} ='';`;
 return`export var ${n} = {};`;
 })
 .join('\n');

 return`import React from'react';
export default function ${name}(props) {
 return React.createElement('div', {
 style: { padding: 12, border:'1px dashed #ddd', borderRadius: 8, margin: 8,
 color:'#bbb', fontSize: 12, fontFamily:'monospace', textAlign:'center' }
 }, props && props.children ? props.children :'${name}');
}
export { ${name} };
export var API_BASE_URL ='/api';
export var API ='/api';
export var useAuth = function() { return { user: { id: 1, firstName:'Jane', lastName:'Doe', email:'jane@example.com' }, isAuthenticated: true, token:'preview' }; };
export var useRouter = function() { return { pathname:'/', push() {}, replace() {}, back() {}, query: {} }; };
export var usePathname = function() { return'/'; };
export var UserProfile = {};
export var User = {};
export var MemberSettings = {};
export var AppConfig = {};
${extras}
`;
}
