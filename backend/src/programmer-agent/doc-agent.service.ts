import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../shared/database.service';

/**
 * Documentation Agent — scans the project and maintains a living knowledge base
 * that the coder agent reads at the start of each session to understand:
 *  - Architecture decisions (frameworks, patterns, styling conventions)
 *  - File inventory (what each file does, key exports, last-modified)
 *  - Established patterns (API call patterns, component structure, routing)
 *  - Past failures (known gotchas, broken import paths, things to avoid)
 *  - Component relationships (imports, dependency graph)
 *
 * The output is a structured ProjectKnowledge object that can be serialized
 * and injected into agent prompts to avoid rediscovering context each session.
 */

// --- Types ---

export interface FileEntry {
  path: string;
  type: 'component' | 'page' | 'service' | 'config' | 'util' | 'style' | 'type' | 'other';
  description: string;
  exports: string[];
  imports: string[];
  linesOfCode: number;
  lastModified: string;
}

export interface PatternEntry {
  name: string;
  description: string;
  example: string;
  files: string[];
}

export interface GotchaEntry {
  id: string;
  description: string;
  resolution: string;
  addedAt: string;
}

export interface ProjectKnowledge {
  generatedAt: string;
  projectName: string;
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    uiLibrary: string;
    styling: string;
    stateManagement: string;
    apiPattern: string;
  };
  conventions: {
    importRules: string[];
    componentStructure: string;
    apiCallPattern: string;
    fileNaming: string;
    typeDefinitions: string;
  };
  fileInventory: FileEntry[];
  patterns: PatternEntry[];
  gotchas: GotchaEntry[];
  summary: string;
}

@Injectable()
export class DocAgentService {
  private readonly logger = new Logger(DocAgentService.name);
  private readonly projectRoot: string;
  private knowledgeCache: ProjectKnowledge | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly db: DatabaseService) {
    this.projectRoot = path.resolve(__dirname, '..', '..', '..');
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /** Get project knowledge — cached for 5 minutes to avoid rescanning */
  getProjectKnowledge(forceRefresh = false): ProjectKnowledge {
    const now = Date.now();
    if (!forceRefresh && this.knowledgeCache && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      return this.knowledgeCache;
    }

    this.logger.log('Scanning project to build knowledge base...');
    const knowledge = this.buildKnowledge();
    this.knowledgeCache = knowledge;
    this.cacheTimestamp = now;
    return knowledge;
  }

  /** Get a compact prompt-ready summary (for injecting into coder agent prompts) */
  getPromptContext(): string {
    const k = this.getProjectKnowledge();
    const sections: string[] = [];

    // Architecture overview
    sections.push(`## Project Architecture
- Frontend: ${k.architecture.frontend}
- Backend: ${k.architecture.backend}
- UI: ${k.architecture.uiLibrary} (${k.architecture.styling})
- API Pattern: ${k.architecture.apiPattern}
- Database: ${k.architecture.database}`);

    // Conventions
    sections.push(`## Conventions
${k.conventions.importRules.map(r => `- ${r}`).join('\n')}
- Components: ${k.conventions.componentStructure}
- API calls: ${k.conventions.apiCallPattern}
- Types: ${k.conventions.typeDefinitions}
- Naming: ${k.conventions.fileNaming}`);

    // Key files (limit to 30 most relevant)
    const keyFiles = k.fileInventory
      .filter(f => f.type !== 'other' && f.type !== 'style')
      .slice(0, 30);
    if (keyFiles.length > 0) {
      sections.push(`## Key Files (${k.fileInventory.length} total)
${keyFiles.map(f => `- \`${f.path}\` (${f.type}) — ${f.description}${f.exports.length > 0 ? ` [exports: ${f.exports.slice(0, 3).join(', ')}]` : ''}`).join('\n')}`);
    }

    // Patterns
    if (k.patterns.length > 0) {
      sections.push(`## Established Patterns
${k.patterns.map(p => `- **${p.name}**: ${p.description}`).join('\n')}`);
    }

    // Gotchas
    if (k.gotchas.length > 0) {
      sections.push(`## Known Gotchas (AVOID these mistakes)
${k.gotchas.map(g => `- ⚠️ ${g.description} → ${g.resolution}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /** Record a gotcha (past failure) so the agent doesn't repeat it */
  addGotcha(description: string, resolution: string): void {
    const gotchas = this.loadGotchas();
    const id = `gotcha-${Date.now()}`;
    gotchas.push({ id, description, resolution, addedAt: new Date().toISOString() });
    // Keep only last 50 gotchas
    const trimmed = gotchas.slice(-50);
    this.saveGotchas(trimmed);
    // Invalidate cache
    this.knowledgeCache = null;
    this.logger.log(`Added gotcha: ${description}`);
  }

  /** Get all gotchas */
  getGotchas(): GotchaEntry[] {
    return this.loadGotchas();
  }

  /** Clear a gotcha by id */
  removeGotcha(id: string): boolean {
    const gotchas = this.loadGotchas();
    const filtered = gotchas.filter(g => g.id !== id);
    if (filtered.length < gotchas.length) {
      this.saveGotchas(filtered);
      this.knowledgeCache = null;
      return true;
    }
    return false;
  }

  // =========================================================================
  // KNOWLEDGE BUILDER
  // =========================================================================

  private buildKnowledge(): ProjectKnowledge {
    const startTime = Date.now();

    // Scan file inventory
    const fileInventory = this.scanFiles();

    // Detect patterns from scanned files
    const patterns = this.detectPatterns(fileInventory);

    // Load persisted gotchas
    const gotchas = this.loadGotchas();

    // Detect architecture
    const architecture = this.detectArchitecture(fileInventory);

    // Detect conventions from existing code
    const conventions = this.detectConventions(fileInventory);

    // Build summary
    const componentCount = fileInventory.filter(f => f.type === 'component' || f.type === 'page').length;
    const serviceCount = fileInventory.filter(f => f.type === 'service').length;
    const totalLines = fileInventory.reduce((sum, f) => sum + f.linesOfCode, 0);

    const summary = `Project has ${fileInventory.length} files (${totalLines.toLocaleString()} lines): ${componentCount} components/pages, ${serviceCount} services. ${patterns.length} patterns detected, ${gotchas.length} known gotchas.`;

    this.logger.log(`Knowledge base built in ${Date.now() - startTime}ms — ${fileInventory.length} files scanned`);

    return {
      generatedAt: new Date().toISOString(),
      projectName: 'SaaS Factory',
      architecture,
      conventions,
      fileInventory,
      patterns,
      gotchas,
      summary,
    };
  }

  // =========================================================================
  // FILE SCANNER
  // =========================================================================

  private scanFiles(): FileEntry[] {
    const entries: FileEntry[] = [];

    const scanDir = (dir: string, relPrefix: string) => {
      try {
        const items = fs.readdirSync(path.join(this.projectRoot, dir), { withFileTypes: true });
        for (const item of items) {
          if (item.name === 'node_modules' || item.name === 'dist' || item.name === '.git' || item.name === 'build') continue;

          const relPath = `${relPrefix}/${item.name}`;
          if (item.isDirectory()) {
            scanDir(`${dir}/${item.name}`, relPath);
          } else if (/\.(ts|tsx|js|jsx)$/.test(item.name) && !item.name.endsWith('.d.ts')) {
            const fullPath = path.join(this.projectRoot, dir, item.name);
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const stat = fs.statSync(fullPath);
              entries.push({
                path: relPath.replace(/^\//, ''),
                type: this.classifyFile(relPath, content),
                description: this.describeFile(relPath, content),
                exports: this.extractExports(content),
                imports: this.extractImports(content),
                linesOfCode: content.split('\n').length,
                lastModified: stat.mtime.toISOString(),
              });
            } catch {
              // Skip unreadable files
            }
          }
        }
      } catch {
        // Skip unreadable directories
      }
    };

    // Scan frontend and backend source
    scanDir('frontend/src', 'frontend/src');
    scanDir('backend/src', 'backend/src');

    return entries;
  }

  private classifyFile(filePath: string, content: string): FileEntry['type'] {
    if (/\.service\.ts$/.test(filePath)) return 'service';
    if (/\.controller\.ts$/.test(filePath)) return 'service';
    if (/\.module\.ts$/.test(filePath)) return 'config';
    if (/config\//.test(filePath) || /\.config\./.test(filePath)) return 'config';
    if (/types?\//.test(filePath) || /\.types?\.ts$/.test(filePath)) return 'type';
    if (/utils?\//.test(filePath) || /helpers?\//.test(filePath)) return 'util';
    if (/\.css$/.test(filePath) || /\.scss$/.test(filePath)) return 'style';
    if (/Page\.tsx$/.test(filePath) || /pages?\//.test(filePath)) return 'page';
    if (/\.tsx$/.test(filePath) && content.includes('export')) return 'component';
    return 'other';
  }

  private describeFile(filePath: string, content: string): string {
    // Try to extract description from comments or JSDoc at the top
    const headerComment = content.match(/^\s*(?:\/\*\*[\s\S]*?\*\/|\/\/.*)/);
    if (headerComment) {
      const cleaned = headerComment[0]
        .replace(/\/\*\*|\*\/|\/\/|\*/g, '')
        .trim()
        .split('\n')[0]
        .trim();
      if (cleaned.length > 10 && cleaned.length < 200) return cleaned;
    }

    // Infer from filename
    const name = path.basename(filePath, path.extname(filePath));
    const parts = name.replace(/([A-Z])/g, ' $1').replace(/[_.-]/g, ' ').trim();

    // Check for React component
    if (/\.tsx$/.test(filePath) && content.includes('export')) {
      const mainExport = content.match(/export\s+(?:default\s+)?function\s+(\w+)/);
      if (mainExport) return `React component: ${mainExport[1]}`;
    }

    // Check for NestJS
    if (content.includes('@Controller')) return `API controller: ${parts}`;
    if (content.includes('@Injectable')) return `Injectable service: ${parts}`;
    if (content.includes('@Module')) return `NestJS module: ${parts}`;

    return parts;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|class|const|interface|type|enum)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }
    return exports.slice(0, 10); // Limit to 10
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.*?)['"]/g);
    for (const match of importMatches) {
      // Only include local imports (relative paths)
      if (match[1].startsWith('.')) {
        imports.push(match[1]);
      }
    }
    return imports.slice(0, 15);
  }

  // =========================================================================
  // PATTERN DETECTION
  // =========================================================================

  private detectPatterns(files: FileEntry[]): PatternEntry[] {
    const patterns: PatternEntry[] = [];

    // Detect API call pattern
    const componentsWithFetch = files.filter(f =>
      f.type === 'component' || f.type === 'page'
    );
    if (componentsWithFetch.length > 0) {
      // Read a sample component to detect API pattern
      const sample = componentsWithFetch[0];
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, sample.path), 'utf-8');
        if (content.includes('API.') || content.includes("import { API }")) {
          patterns.push({
            name: 'API Config Object',
            description: 'Components import API from config/api.ts and use named properties (API.apps, API.chat, etc.)',
            example: "import { API } from '../config/api'; fetch(API.apps)",
            files: [sample.path],
          });
        }
        if (content.includes('API_BASE')) {
          patterns.push({
            name: 'API_BASE Pattern',
            description: "Components use const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''",
            example: "const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';",
            files: [sample.path],
          });
        }
      } catch { /* skip */ }
    }

    // Detect MUI styling pattern
    const muiFiles = files.filter(f =>
      (f.type === 'component' || f.type === 'page') && f.imports.some(i => i.includes('@mui'))
    );
    if (muiFiles.length > 0) {
      patterns.push({
        name: 'MUI sx Prop Styling',
        description: 'All styling uses the MUI sx prop — no CSS files, no styled-components',
        example: '<Box sx={{ display: "flex", gap: 2, p: 3 }}>',
        files: muiFiles.slice(0, 3).map(f => f.path),
      });
    }

    // Detect members area pattern
    const membersFiles = files.filter(f => f.path.includes('members/'));
    if (membersFiles.length > 0) {
      patterns.push({
        name: 'Members Area Structure',
        description: `Members area has ${membersFiles.length} files under frontend/src/components/members/`,
        example: 'Each page is a named export, wrapped in MembersLayout, with tabs for navigation',
        files: membersFiles.slice(0, 5).map(f => f.path),
      });
    }

    // Detect NestJS service pattern
    const controllers = files.filter(f => f.path.includes('.controller.'));
    const services = files.filter(f => f.path.includes('.service.'));
    if (controllers.length > 0 && services.length > 0) {
      patterns.push({
        name: 'NestJS Module Pattern',
        description: `Backend uses NestJS with ${controllers.length} controllers and ${services.length} services. Each feature has a module, controller, and service.`,
        example: 'module.ts imports controller + service; controller delegates to service',
        files: controllers.slice(0, 3).map(f => f.path),
      });
    }

    // Detect shared module pattern
    const sharedFiles = files.filter(f => f.path.includes('shared/'));
    if (sharedFiles.length > 0) {
      patterns.push({
        name: 'Shared Services',
        description: `Shared utilities in backend/src/shared/: ${sharedFiles.map(f => path.basename(f.path)).join(', ')}`,
        example: 'import { DatabaseService } from "../shared/database.service"',
        files: sharedFiles.map(f => f.path),
      });
    }

    return patterns;
  }

  // =========================================================================
  // ARCHITECTURE + CONVENTION DETECTION
  // =========================================================================

  private detectArchitecture(files: FileEntry[]): ProjectKnowledge['architecture'] {
    const hasReact = files.some(f => f.imports.some(i => i === 'react'));
    const hasMUI = files.some(f => f.path.includes('@mui') || files.some(ff => ff.imports.some(i => i.includes('@mui'))));
    const hasNest = files.some(f => f.path.includes('.module.ts'));

    // Check for database
    let database = 'JSON file (db.json)';
    try {
      if (fs.existsSync(path.join(this.projectRoot, 'database', 'schema.sql'))) {
        database = 'SQLite with JSON fallback (database/schema.sql + backend/db.json)';
      }
    } catch { /* ignore */ }

    return {
      frontend: hasReact ? 'React 18 + TypeScript + Vite 5' : 'Unknown',
      backend: hasNest ? 'NestJS 10 + TypeScript' : 'Unknown Node.js',
      database,
      uiLibrary: hasMUI ? 'Material-UI 5 (@mui/material)' : 'Unknown',
      styling: 'sx prop (inline MUI system styles, no CSS files)',
      stateManagement: 'React hooks (useState, useEffect, useCallback)',
      apiPattern: 'fetch() with API config object from config/api.ts',
    };
  }

  private detectConventions(files: FileEntry[]): ProjectKnowledge['conventions'] {
    // Read api.ts to check the API pattern
    let apiCallPattern = "import { API } from '../config/api'; fetch(API.endpointName)";
    try {
      const apiTs = fs.readFileSync(path.join(this.projectRoot, 'frontend', 'src', 'config', 'api.ts'), 'utf-8');
      if (apiTs.includes('API_BASE')) {
        apiCallPattern = "import { API } from '../config/api'; — API is an object with named endpoint URLs (API.apps, API.chat, etc.)";
      }
    } catch { /* ignore */ }

    return {
      importRules: [
        "MUI: import { Component } from '@mui/material'",
        "Icons: import IconName from '@mui/icons-material/IconName'",
        "React: import { useState, useEffect } from 'react'",
        "API: import { API } from '../config/api' (adjust depth for path)",
        "Types: define interfaces INLINE — do NOT import from ../../types/",
        "No external packages except react, @mui/material, @mui/icons-material, react-router-dom",
      ],
      componentStructure: 'Functional components with named exports: export function ComponentName()',
      apiCallPattern,
      fileNaming: 'PascalCase for components (DashboardPage.tsx), kebab-case for services (database.service.ts)',
      typeDefinitions: 'Define interfaces inline in the component file — do NOT create separate type files',
    };
  }

  // =========================================================================
  // GOTCHA PERSISTENCE (stored in db.json)
  // =========================================================================

  private loadGotchas(): GotchaEntry[] {
    try {
      if (!this.db.exists()) return [];
      const data = this.db.readSync();
      return data.agentGotchas || [];
    } catch {
      return [];
    }
  }

  private saveGotchas(gotchas: GotchaEntry[]): void {
    try {
      if (!this.db.exists()) return;
      const data = this.db.readSync();
      data.agentGotchas = gotchas;
      this.db.writeSync(data);
    } catch (err) {
      this.logger.warn(`Failed to save gotchas: ${err}`);
    }
  }
}
