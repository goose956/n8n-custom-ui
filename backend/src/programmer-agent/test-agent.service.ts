import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Test Agent — runs after the coder agent's build verification to validate
 * that generated pages/features actually work end-to-end.
 *
 * Three layers of testing:
 *  1. Static analysis  — code patterns (API calls, error handling, loading states)
 *  2. API smoke tests   — hit backend endpoints to verify they respond
 *  3. AI functional review — AI reads the code and confirms it fulfills the request
 *
 * The results are streamed back to the user via SSE so they see test status
 * before the final summary.
 */

// --- Types ---

export interface TestResult {
  id: string;
  category: 'static' | 'api-smoke' | 'functional';
  severity: 'pass' | 'warn' | 'fail';
  title: string;
  detail: string;
  file?: string;
  line?: number;
}

export interface TestReport {
  passed: number;
  warnings: number;
  failures: number;
  results: TestResult[];
  summary: string;
  durationMs: number;
}

/** Context required from the coder agent */
export interface TestAgentContext {
  /** The user's original request / message */
  userMessage: string;
  /** Files that were generated (new) */
  generatedFiles: { path: string; content: string; language: string; description?: string }[];
  /** Files that were modified */
  modifiedFiles: { path: string; content: string; language: string; description?: string }[];
  /** Call the AI with system + user prompt, returns content + tokensUsed */
  callAI: (model: string, system: string, user: string) => Promise<{ content: string; tokensUsed: number }>;
  /** The AI model to use for functional review */
  modelId: string;
  /** App ID (for API smoke tests with correct context) */
  appId?: number;
}

@Injectable()
export class TestAgentService {
  private readonly logger = new Logger(TestAgentService.name);
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..', '..', '..');
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Run the full test suite against generated/modified files.
   * Returns a TestReport with pass/warn/fail results.
   */
  async runTests(
    ctx: TestAgentContext,
    sendEvent?: (event: string, data: any) => void,
  ): Promise<TestReport & { tokensUsed: number }> {
    const start = Date.now();
    const allFiles = [...ctx.generatedFiles, ...ctx.modifiedFiles];
    let tokensUsed = 0;

    if (allFiles.length === 0) {
      return {
        passed: 0, warnings: 0, failures: 0, results: [],
        summary: 'No files to test', durationMs: 0, tokensUsed: 0,
      };
    }

    sendEvent?.('progress', { message: '🧪 Test agent: running static analysis...' });

    // Layer 1: Static analysis
    const staticResults = this.runStaticAnalysis(allFiles);

    // Layer 2: API smoke tests (only if backend files were created/modified)
    sendEvent?.('progress', { message: '🧪 Test agent: checking API endpoints...' });
    const backendFiles = allFiles.filter(f => f.path.startsWith('backend/'));
    const apiResults = backendFiles.length > 0
      ? this.runApiSmokeTests(backendFiles)
      : [];

    // Layer 3: AI functional review
    sendEvent?.('progress', { message: '🧪 Test agent: AI functional review...' });
    const { results: funcResults, tokensUsed: funcTokens } =
      await this.runFunctionalReview(ctx);
    tokensUsed += funcTokens;

    // Combine all results
    const allResults = [...staticResults, ...apiResults, ...funcResults];
    const passed = allResults.filter(r => r.severity === 'pass').length;
    const warnings = allResults.filter(r => r.severity === 'warn').length;
    const failures = allResults.filter(r => r.severity === 'fail').length;
    const durationMs = Date.now() - start;

    const summary = failures > 0
      ? `${failures} test(s) FAILED, ${warnings} warning(s), ${passed} passed (${durationMs}ms)`
      : warnings > 0
        ? `All tests passed with ${warnings} warning(s) (${durationMs}ms)`
        : `All ${passed} test(s) passed (${durationMs}ms)`;

    this.logger.log(`Test agent: ${summary}`);

    return { passed, warnings, failures, results: allResults, summary, durationMs, tokensUsed };
  }

  // =========================================================================
  // LAYER 1: STATIC ANALYSIS
  // =========================================================================

  private runStaticAnalysis(files: { path: string; content: string }[]): TestResult[] {
    const results: TestResult[] = [];
    let testId = 0;

    for (const file of files) {
      const isReact = /\.(tsx|jsx)$/.test(file.path);
      const isController = file.path.includes('.controller.');
      const isService = file.path.includes('.service.');
      const isFrontend = file.path.startsWith('frontend/');

      // --- Check: API calls should have error handling ---
      if (isFrontend && file.content.includes('fetch(')) {
        const hasTryCatch = file.content.includes('try') && file.content.includes('catch');
        const hasCatchMethod = file.content.includes('.catch(');
        if (!hasTryCatch && !hasCatchMethod) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'fail',
            title: 'API calls without error handling',
            detail: 'fetch() calls found but no try/catch or .catch() — API errors will crash the page silently',
            file: file.path,
          });
        } else {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'pass',
            title: 'API error handling present',
            detail: 'fetch() calls are wrapped in error handling',
            file: file.path,
          });
        }
      }

      // --- Check: Loading states for async data ---
      if (isReact && file.content.includes('fetch(')) {
        const hasLoading = /loading|isLoading|setLoading|Loading/i.test(file.content);
        if (!hasLoading) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: 'No loading state for API calls',
            detail: 'Page fetches data but has no loading indicator — user sees blank or stale data while waiting',
            file: file.path,
          });
        } else {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'pass',
            title: 'Loading state present',
            detail: 'Loading indicator found for async data fetching',
            file: file.path,
          });
        }
      }

      // --- Check: Empty state handling ---
      if (isReact && (file.content.includes('.map(') || file.content.includes('.filter('))) {
        const hasEmptyCheck = /\.length\s*[=!><]|no\s*data|no\s*results|empty/i.test(file.content);
        if (!hasEmptyCheck) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: 'No empty state handling',
            detail: 'Data is mapped/filtered but no empty state shown when array is empty',
            file: file.path,
          });
        }
      }

      // --- Check: Form validation ---
      if (isReact && file.content.includes('<form') || (isReact && file.content.includes('onSubmit'))) {
        const hasValidation = /required|validate|validation|\.trim\(\)|pattern=|minLength|maxLength/i.test(file.content);
        if (!hasValidation) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: 'Form without validation',
            detail: 'Form submission found but no input validation — bad data will reach the API',
            file: file.path,
          });
        }
      }

      // --- Check: Controller has route decorators ---
      if (isController) {
        const hasRoutes = /@(Get|Post|Put|Delete|Patch)\(/.test(file.content);
        if (!hasRoutes) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'fail',
            title: 'Controller has no route decorators',
            detail: 'NestJS controller file found but no @Get/@Post/@Put/@Delete decorators — no endpoints are exposed',
            file: file.path,
          });
        }
      }

      // --- Check: Service is @Injectable ---
      if (isService && !file.content.includes('@Injectable')) {
        results.push({
          id: `static-${++testId}`,
          category: 'static',
          severity: 'fail',
          title: 'Service missing @Injectable decorator',
          detail: 'NestJS service file without @Injectable() — dependency injection will fail at runtime',
          file: file.path,
        });
      }

      // --- Check: Hardcoded API URLs ---
      if (isFrontend) {
        const hardcodedUrls = file.content.match(/fetch\(\s*['"`](https?:\/\/[^'"`]+)['"`]/g);
        if (hardcodedUrls) {
          const nonLocal = hardcodedUrls.filter(u => !u.includes('localhost'));
          if (nonLocal.length > 0) {
            results.push({
              id: `static-${++testId}`,
              category: 'static',
              severity: 'warn',
              title: 'Hardcoded external API URL',
              detail: `fetch() uses hardcoded URL instead of API config — breaks if deployed to different domain`,
              file: file.path,
            });
          }
        }
      }

      // --- Check: Component exports ---
      if (isReact && !file.content.includes('export')) {
        results.push({
          id: `static-${++testId}`,
          category: 'static',
          severity: 'fail',
          title: 'React component not exported',
          detail: 'File has no export statement — component cannot be imported by other files',
          file: file.path,
        });
      }

      // --- Check: useEffect cleanup ---
      if (isReact && file.content.includes('useEffect')) {
        const hasInterval = file.content.includes('setInterval') || file.content.includes('setTimeout');
        const hasEventListener = file.content.includes('addEventListener');
        const hasCleanup = /return\s*\(\s*\)\s*=>/.test(file.content) || /return\s+function/.test(file.content);
        if ((hasInterval || hasEventListener) && !hasCleanup) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: 'useEffect missing cleanup',
            detail: 'setInterval/setTimeout/addEventListener used in useEffect but no cleanup function returned — causes memory leaks',
            file: file.path,
          });
        }
      }

      // --- Check: Key prop in .map() ---
      if (isReact && file.content.includes('.map(')) {
        const mapBlocks = file.content.match(/\.map\([^)]*\)\s*=>\s*[\s\S]*?(?=\.map\(|$)/g) || [];
        // Simplified check: if there's a .map() and no key= in JSX nearby, flag it
        const hasMap = file.content.includes('.map(');
        const hasKey = /key\s*=\s*\{/.test(file.content);
        if (hasMap && !hasKey) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: 'Missing key prop in .map()',
            detail: 'List rendering with .map() but no key prop — causes React re-render performance issues and warnings',
            file: file.path,
          });
        }
      }

      // --- Check: TypeScript 'any' overuse ---
      if (/\.tsx?$/.test(file.path)) {
        const anyCount = (file.content.match(/:\s*any\b/g) || []).length;
        if (anyCount > 5) {
          results.push({
            id: `static-${++testId}`,
            category: 'static',
            severity: 'warn',
            title: `Excessive 'any' types (${anyCount})`,
            detail: `${anyCount} uses of 'any' type — defeats TypeScript safety, consider proper typing`,
            file: file.path,
          });
        }
      }
    }

    return results;
  }

  // =========================================================================
  // LAYER 2: API SMOKE TESTS
  // =========================================================================

  private runApiSmokeTests(backendFiles: { path: string; content: string }[]): TestResult[] {
    const results: TestResult[] = [];
    let testId = 0;

    for (const file of backendFiles) {
      if (!file.path.includes('.controller.')) continue;

      // Extract the route prefix
      const controllerMatch = file.content.match(/@Controller\(\s*['"]([^'"]+)['"]\s*\)/);
      if (!controllerMatch) continue;
      const routePrefix = controllerMatch[1];

      // Extract GET endpoints (safe to smoke test)
      const getEndpoints: string[] = [];
      const getMatches = file.content.matchAll(/@Get\(\s*['"]?([^'")]*?)['"]?\s*\)/g);
      for (const match of getMatches) {
        const subRoute = match[1] || '';
        getEndpoints.push(`/${routePrefix}${subRoute ? '/' + subRoute : ''}`);
      }

      if (getEndpoints.length === 0) {
        results.push({
          id: `api-${++testId}`,
          category: 'api-smoke',
          severity: 'pass',
          title: `Controller ${routePrefix}: no GET endpoints to smoke test`,
          detail: 'Only POST/PUT/DELETE endpoints found — skipping smoke test (unsafe to call without body)',
          file: file.path,
        });
        continue;
      }

      // Try to hit each GET endpoint
      for (const endpoint of getEndpoints.slice(0, 5)) { // max 5 per controller
        try {
          const url = `http://localhost:3000${endpoint}`;
          const result = execSync(`curl -s -o NUL -w "%{http_code}" "${url}"`, {
            encoding: 'utf-8',
            timeout: 10_000,
            stdio: ['pipe', 'pipe', 'pipe'],
          }).trim();

          const statusCode = parseInt(result);
          if (statusCode >= 200 && statusCode < 400) {
            results.push({
              id: `api-${++testId}`,
              category: 'api-smoke',
              severity: 'pass',
              title: `GET ${endpoint} → ${statusCode}`,
              detail: 'Endpoint responds successfully',
              file: file.path,
            });
          } else if (statusCode === 404) {
            results.push({
              id: `api-${++testId}`,
              category: 'api-smoke',
              severity: 'fail',
              title: `GET ${endpoint} → 404 Not Found`,
              detail: 'Endpoint not registered — check module imports and controller registration in app.module.ts',
              file: file.path,
            });
          } else {
            results.push({
              id: `api-${++testId}`,
              category: 'api-smoke',
              severity: 'warn',
              title: `GET ${endpoint} → ${statusCode}`,
              detail: `Endpoint responded with unexpected status. May need auth or query params.`,
              file: file.path,
            });
          }
        } catch (err) {
          results.push({
            id: `api-${++testId}`,
            category: 'api-smoke',
            severity: 'warn',
            title: `GET ${endpoint} — connection failed`,
            detail: 'Could not reach the backend (is it running on port 3000?). Skipping smoke test.',
            file: file.path,
          });
        }
      }
    }

    return results;
  }

  // =========================================================================
  // LAYER 3: AI FUNCTIONAL REVIEW
  // =========================================================================

  private async runFunctionalReview(
    ctx: TestAgentContext,
  ): Promise<{ results: TestResult[]; tokensUsed: number }> {
    const results: TestResult[] = [];
    let tokensUsed = 0;
    const allFiles = [...ctx.generatedFiles, ...ctx.modifiedFiles];

    if (allFiles.length === 0) return { results, tokensUsed };

    // Build a compact file listing for the AI
    const fileListings = allFiles.map(f => {
      // Smart truncate to keep prompt manageable
      const maxLen = 4000;
      const content = f.content.length > maxLen
        ? f.content.slice(0, maxLen * 0.6) + '\n// ... truncated ...\n' + f.content.slice(-maxLen * 0.3)
        : f.content;
      return `### ${f.path}\n\`\`\`${f.language}\n${content}\n\`\`\``;
    }).join('\n\n');

    const systemPrompt = `You are a QA test agent. Your job is to verify generated code actually implements what the user asked for.

You do NOT compile or run the code — you READ it and verify:
1. Does the code actually implement the user's request? (not just scaffolding/stubs)
2. Are API integrations actually connected? (e.g., if they asked for a LinkedIn scraper, does the code actually call the Apify API?)
3. Does data flow end-to-end? (API call → state → render)
4. Are there missing pieces that would prevent the feature from working?
5. Is the user experience complete? (loading, errors, empty state, success feedback)

Return a JSON array of test results:
[
  {
    "severity": "pass" | "warn" | "fail",
    "title": "Short test name (5-10 words)",
    "detail": "One sentence explaining what you found",
    "file": "path/to/file.tsx"
  }
]

Rules:
- Return 3-8 test results (don't be exhaustive, focus on what matters)
- "pass" = this works correctly
- "warn" = works but could be improved
- "fail" = this will NOT work as the user expects — critical issue
- Be SPECIFIC: not "code looks good" but "Apify API call uses correct actor ID and handles response"
- Focus on FUNCTIONAL correctness, not style or naming
- Return ONLY the JSON array, no markdown fences or explanation`;

    const userPrompt = `## User's Request:
"${ctx.userMessage}"

## Generated/Modified Code:
${fileListings}

Run your functional verification tests against this code. Does it actually do what the user asked for?`;

    try {
      const result = await ctx.callAI(ctx.modelId, systemPrompt, userPrompt);
      tokensUsed += result.tokensUsed || 0;

      // Parse the AI response
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          severity: string;
          title: string;
          detail: string;
          file?: string;
        }>;

        for (let i = 0; i < parsed.length && i < 10; i++) {
          const t = parsed[i];
          const severity = ['pass', 'warn', 'fail'].includes(t.severity)
            ? (t.severity as 'pass' | 'warn' | 'fail')
            : 'warn';
          results.push({
            id: `func-${i + 1}`,
            category: 'functional',
            severity,
            title: t.title || 'Functional check',
            detail: t.detail || '',
            file: t.file,
          });
        }
      }
    } catch (err) {
      this.logger.warn('AI functional review failed: ' + err);
      results.push({
        id: 'func-error',
        category: 'functional',
        severity: 'warn',
        title: 'Functional review could not run',
        detail: `AI review failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }

    return { results, tokensUsed };
  }
}
