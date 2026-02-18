import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

/**
 * Git operations for the coder agent — snapshot, rollback, and diff.
 * Extracted from ProgrammerAgentService to keep the God Object manageable.
 */
export class GitOps {
  private readonly logger = new Logger('GitOps');
  private readonly projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || path.resolve(__dirname, '..', '..', '..');
  }

  /** Create a git snapshot before the agent starts making changes */
  createSnapshot(label?: string): { success: boolean; commitHash?: string; error?: string } {
    try {
      // Initialize git if not already
      const gitDir = path.join(this.projectRoot, '.git');
      if (!fs.existsSync(gitDir)) {
        execSync('git init', { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe' });
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(gitignorePath, 'node_modules/\ndist/\n.env\n', 'utf-8');
        }
      }
      // Stage all changes
      execSync('git add -A', { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });
      // Commit with label
      const msg = `[coder-agent-snapshot] ${label || 'Before agent changes'} - ${new Date().toISOString()}`;
      try {
        execSync(`git commit -m "${msg}" --allow-empty`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });
      } catch {
        this.logger.debug('Nothing to commit (snapshot)');
      }
      // Get the commit hash
      const hash = execSync('git rev-parse HEAD', { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
      return { success: true, commitHash: hash };
    } catch (err) {
      this.logger.error(`Snapshot failed: ${err instanceof Error ? err.message : err}`);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Rollback to a previous git snapshot */
  rollback(commitHash: string): { success: boolean; filesReverted: number; error?: string } {
    try {
      const diffOutput = execSync(`git diff --name-only ${commitHash} HEAD`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 15000 });
      const changedFiles = diffOutput.trim().split('\n').filter(f => f.trim());
      execSync(`git reset --hard ${commitHash}`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });
      return { success: true, filesReverted: changedFiles.length };
    } catch (err) {
      this.logger.error(`Rollback failed: ${err instanceof Error ? err.message : err}`);
      return { success: false, filesReverted: 0, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Get the diff between current state and a snapshot */
  getDiff(commitHash: string): { success: boolean; diff: string; changedFiles: string[]; error?: string } {
    try {
      const diffOutput = execSync(`git diff ${commitHash} HEAD --stat`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 15000 });
      const nameOutput = execSync(`git diff --name-only ${commitHash} HEAD`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 15000 });
      const changedFiles = nameOutput.trim().split('\n').filter(f => f.trim());
      return { success: true, diff: diffOutput.trim(), changedFiles };
    } catch (err) {
      return { success: false, diff: '', changedFiles: [], error: err instanceof Error ? err.message : String(err) };
    }
  }
}
