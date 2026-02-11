import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../../db.json');

interface WorkflowIssue {
  type: 'missing_field' | 'missing_api_key' | 'warning';
  message: string;
  field?: string;
  apiKeyName?: string;
}

interface WorkflowValidation {
  workflowId: string;
  workflowName: string;
  isValid: boolean;
  issues: WorkflowIssue[];
}

@Injectable()
export class WorkflowValidationService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async validateWorkflow(workflow: any): Promise<WorkflowValidation> {
    const issues: WorkflowIssue[] = [];

    // Check for required workflow properties
    if (!workflow.name) {
      issues.push({
        type: 'missing_field',
        message: 'Workflow name is missing',
        field: 'name',
      });
    }

    // Parse workflow nodes to check for missing configuration
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      const apiKeys = this.loadApiKeysSync();
      const apiKeyNames = apiKeys.map((k: any) => k.name);

      // Map of node types to required fields
      const requiredFieldsMap: Record<string, string[]> = {
        'n8n-nodes-base.formTrigger': ['formTitle'],
        '@n8n/n8n-nodes-langchain.agent': ['prompt'],
        // Add more node types and their required fields here as needed
      };

      for (const node of workflow.nodes) {
        // Check for nodes without a name/title
        if (!node.name || node.name.trim() === '') {
          issues.push({
            type: 'missing_field',
            message: `Node (type: ${node.type}) is missing a title/name`,
            field: `${node.id}.name`,
          });
        }

        // Check for required fields by node type
        const requiredFields = requiredFieldsMap[node.type] || [];
        for (const field of requiredFields) {
          const value = node.parameters?.[field];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            issues.push({
              type: 'missing_field',
              message: `${node.name || node.type} is missing required "${field}".`,
              field: `${node.id}.${field}`,
            });
          }
        }

        // Check node parameters for common API key credential references
        if (node.parameters) {
          const params = JSON.stringify(node.parameters);
          
          // Look for patterns like "apiKey", "api_key", "credential", "token"
          const credentialPatterns = [
            /apiKey["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
            /api_key["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
            /credential["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
            /token["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
            /apiKeyValue["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
            /key["\']?\s*:\s*["\']?([^"\'}\],\s]+)/gi,
          ];

          for (const pattern of credentialPatterns) {
            let match;
            while ((match = pattern.exec(params)) !== null) {
              const referencedKey = match[1];
              // Check if this looks like a variable reference (not an actual value)
              if (referencedKey.includes('$') || referencedKey.includes('{{')) {
                // This is a variable reference, check if the referenced API key exists
                const cleanKey = referencedKey.replace(/[${}]/g, '').trim();
                if (cleanKey && !apiKeyNames.includes(cleanKey)) {
                  issues.push({
                    type: 'missing_api_key',
                    message: `API key "${cleanKey}" is referenced but not saved`,
                    apiKeyName: cleanKey,
                  });
                }
              }
            }

            // Check for empty/placeholder API key values
            if (params.includes('null') || params.includes('""') || params.includes("''")) {
              // Additional check for nodes that typically need credentials
              if (
                node.type.includes('http') ||
                node.type.includes('stripe') ||
                node.type.includes('api') ||
                node.type.includes('slack') ||
                node.type.includes('github') ||
                node.type.includes('openai')
              ) {
                if (!node.parameters?.authentication && !node.parameters?.apiKey && !node.parameters?.token) {
                  issues.push({
                    type: 'missing_field',
                    message: `${node.name || 'Node'} (${node.type}) is missing authentication/API key configuration`,
                    field: `${node.id}.authentication`,
                  });
                }
              }
            }
          }
        }

        // Check for nodes without required configuration
        if (node.type === 'n8n-nodes-base.http' && !node.parameters?.url) {
          issues.push({
            type: 'missing_field',
            message: `HTTP node "${node.name || 'Untitled'}" is missing URL configuration`,
            field: `${node.id}.url`,
          });
        }

        // Check for empty nodes (no parameters configured)
        if ((!node.parameters || Object.keys(node.parameters).length === 0) && 
            node.type !== 'n8n-nodes-base.start' &&
            node.type !== 'n8n-nodes-base.noOp') {
          issues.push({
            type: 'warning',
            message: `${node.name || 'Node'} appears to have no configuration`,
            field: `${node.id}.parameters`,
          });
        }
      }
    }

    // Check for disconnected nodes or incomplete connections
    if (workflow.connections && Object.keys(workflow.connections).length === 0 && 
        workflow.nodes && workflow.nodes.length > 1) {
      issues.push({
        type: 'warning',
        message: 'Workflow has no connections between nodes - workflow may not execute properly',
        field: 'connections',
      });
    }

    return {
      workflowId: workflow.id,
      workflowName: workflow.name || 'Untitled',
      isValid: issues.length === 0,
      issues: this.deduplicateIssues(issues),
    };
  }

  async validateAllWorkflows(workflows: any[]): Promise<WorkflowValidation[]> {
    return Promise.all(workflows.map(w => this.validateWorkflow(w)));
  }

  private deduplicateIssues(issues: WorkflowIssue[]): WorkflowIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.type}:${issue.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private loadApiKeysSync(): any[] {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return [];
      }
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return data.apiKeys || [];
    } catch {
      return [];
    }
  }
}
