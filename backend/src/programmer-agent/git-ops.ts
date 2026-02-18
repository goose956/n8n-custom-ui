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

  /** Rollback to a previous git snapshot -- SAFE file-level rollback (does NOT reset the entire project) */
  rollback(commitHash: string, touchedFiles?: string[]): { success: boolean; filesReverted: number; error?: string } {
    try {
      // Get list of files changed between snapshot and HEAD
      const diffOutput = execSync(`git diff --name-only ${commitHash} HEAD`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 15000 });
      const changedFiles = diffOutput.trim().split('\n').filter(f => f.trim());

      // If we know which files the agent touched, only revert THOSE files
      // This prevents reverting improvements to the service itself or other unrelated files
      const filesToRevert = touchedFiles && touchedFiles.length > 0
        ? changedFiles.filter(f => touchedFiles.some(tf => f.endsWith(tf) || tf.endsWith(f) || f === tf))
        : changedFiles;

      if (filesToRevert.length === 0) {
        return { success: true, filesReverted: 0 };
      }

      // Revert only the specific files to their state at the snapshot commit
      // This is SAFE -- it only touches the files we specify, not the entire project
      const fileList = filesToRevert.map(f => `"${f}"`).join(' ');
      execSync(`git checkout ${commitHash} -- ${fileList}`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });

      // Check for files that were created after the snapshot (not in snapshot) -- these should be deleted
      for (const file of filesToRevert) {
        try {
          execSync(`git show ${commitHash}:${file}`, { cwd: this.projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 5000 });
        } catch {
          // File didn't exist at snapshot time -- delete it
          const absPath = path.join(this.projectRoot, file);
          if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
            this.logger.debug(`Deleted file that didn't exist at snapshot: ${file}`);
          }
        }
      }

      return { success: true, filesReverted: filesToRevert.length };
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
