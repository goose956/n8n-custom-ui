import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

/**
 * File I/O and codebase search utilities for the coder agent.
 * Extracted from ProgrammerAgentService for maintainability.
 */
export class CodeTools {
  private readonly logger = new Logger('CodeTools');
  private readonly projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || path.resolve(__dirname, '..', '..', '..');
  }

  /** Read a file from disk, resolving relative to the project root */
  readFile(filePath: string): string | null {
    let safePath = filePath.replace(/^\/+/, '').replace(/^\\+/, '');
    if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
    const absPath = path.resolve(this.projectRoot, safePath);
    if (!absPath.startsWith(this.projectRoot)) return null;
    try {
      return fs.readFileSync(absPath, 'utf-8');
    } catch {
      this.logger.debug(`Could not read file: ${filePath}`);
      return null;
    }
  }

  /** List files in a directory recursively */
  listDirectory(dirPath: string): string[] {
    const absDir = path.resolve(this.projectRoot, dirPath);
    if (!absDir.startsWith(this.projectRoot)) return [];
    try {
      return fs.readdirSync(absDir, { recursive: true }).map(f => f.toString());
    } catch {
      this.logger.debug(`Could not list directory: ${dirPath}`);
      return [];
    }
  }

  /** Write a file to disk safely */
  writeFile(filePath: string, content: string): { success: boolean; error?: string } {
    let safePath = filePath.replace(/^\/+/, '').replace(/^\\+/, '');
    if (safePath.startsWith('src/')) safePath = 'frontend/' + safePath;
    const absPath = path.resolve(this.projectRoot, safePath);
    if (!absPath.startsWith(this.projectRoot)) {
      return { success: false, error: 'Path outside project root' };
    }
    try {
      const dir = path.dirname(absPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(absPath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Search the codebase for a pattern using git grep (with manual fallback) */
  searchCodebase(query: string, options?: { includePattern?: string; isRegex?: boolean; maxResults?: number }): { matches: { file: string; line: number; text: string }[]; totalMatches: number } {
    const maxResults = options?.maxResults || 50;
    const matches: { file: string; line: number; text: string }[] = [];

    try {
      const isRegex = options?.isRegex ?? false;
      const grepFlag = isRegex ? '-E' : '-F';
      const includeArg = options?.includePattern ? `-- "${options.includePattern}"` : '-- "*.ts" "*.tsx" "*.js" "*.jsx" "*.json" "*.css"';
      const escapedQuery = query.replace(/"/g, '\\"');

      const cmd = `git grep -n -i ${grepFlag} "${escapedQuery}" ${includeArg}`;
      const output = execSync(cmd, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 15000, maxBuffer: 5 * 1024 * 1024 });

      const lines = output.trim().split('\n').filter(l => l.trim());
      for (const line of lines.slice(0, maxResults)) {
        const match = line.match(/^(.+?):(\d+):(.*)$/);
        if (match) {
          matches.push({ file: match[1], line: parseInt(match[2]), text: match[3].trim().slice(0, 200) });
        }
      }
      return { matches, totalMatches: lines.length };
    } catch (err: any) {
      if (err.status === 1) return { matches: [], totalMatches: 0 };

      // Fallback: manual recursive search
      try {
        const allFiles = this.listDirectory('frontend/src').concat(this.listDirectory('backend/src'));
        for (const filePath of allFiles) {
          if (matches.length >= maxResults) break;
          if (!/\.(ts|tsx|js|jsx|json|css)$/.test(filePath)) continue;
          const content = this.readFile(filePath);
          if (!content) continue;
          const fileLines = content.split('\n');
          for (let i = 0; i < fileLines.length; i++) {
            if (matches.length >= maxResults) break;
            if (fileLines[i].toLowerCase().includes(query.toLowerCase())) {
              matches.push({ file: filePath, line: i + 1, text: fileLines[i].trim().slice(0, 200) });
            }
          }
        }
        return { matches, totalMatches: matches.length };
      } catch {
        this.logger.warn(`Codebase search failed for query: ${query}`);
        return { matches: [], totalMatches: 0 };
      }
    }
  }

  /** Generate a unified diff between old and new content */
  generateDiff(oldContent: string, newContent: string, filePath: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

    let i = 0, j = 0;
    let hunkStart = -1;
    let hunkLines: string[] = [];
    const flushHunk = () => {
      if (hunkLines.length > 0) {
        const addCount = hunkLines.filter(l => l.startsWith('+')).length;
        const delCount = hunkLines.filter(l => l.startsWith('-')).length;
        const ctxCount = hunkLines.filter(l => l.startsWith(' ')).length;
        diff.push(`@@ -${hunkStart + 1},${delCount + ctxCount} +${hunkStart + 1},${addCount + ctxCount} @@`);
        diff.push(...hunkLines);
        hunkLines = [];
        hunkStart = -1;
      }
    };

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        if (hunkLines.length > 0) {
          hunkLines.push(` ${oldLines[i]}`);
          const trailingCtx = hunkLines.slice(-3).every(l => l.startsWith(' '));
          if (trailingCtx && hunkLines.length > 6) flushHunk();
        }
        i++; j++;
      } else {
        if (hunkStart === -1) {
          hunkStart = Math.max(0, i - 3);
          for (let c = Math.max(0, i - 3); c < i; c++) {
            hunkLines.push(` ${oldLines[c]}`);
          }
        }
        if (i < oldLines.length && (j >= newLines.length || oldLines[i] !== newLines[j])) {
          hunkLines.push(`-${oldLines[i]}`);
          i++;
        }
        if (j < newLines.length && (i >= oldLines.length || oldLines[i] !== newLines[j])) {
          hunkLines.push(`+${newLines[j]}`);
          j++;
        }
      }
    }
    flushHunk();

    return diff.length > 2 ? diff.join('\n') : '(no changes)';
  }
}
