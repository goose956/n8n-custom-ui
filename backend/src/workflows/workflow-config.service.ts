import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const DB_FILE = path.join(__dirname, '../../db.json');

interface WorkflowFieldConfig {
  nodeId: string;
  nodeType: string;
  fieldName: string;
  value: string | number | boolean;
}

export interface WorkflowConfig {
  workflowId: string;
  workflowName: string;
  fields: WorkflowFieldConfig[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkflowConfigService {
  private loadDb(): any {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { workflowConfigs: [] };
      }
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!data.workflowConfigs) {
        data.workflowConfigs = [];
      }
      return data;
    } catch {
      return { workflowConfigs: [] };
    }
  }

  private saveDb(data: any): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save workflow config: ${message}`);
    }
  }

  async getWorkflowConfig(workflowId: string): Promise<WorkflowConfig | null> {
    const data = this.loadDb();
    const config = data.workflowConfigs?.find((c: WorkflowConfig) => c.workflowId === workflowId);
    return config || null;
  }

  async saveWorkflowConfig(workflowId: string, workflowName: string, fields: WorkflowFieldConfig[]): Promise<{ config: WorkflowConfig, n8nUpdate: boolean, n8nError?: string }> {
        // --- Auto-add missing AI Agent dependencies if needed ---
        // This logic will only add default nodes if the AI Agent node is present and missing required inputs
        try {
          const settingsPath = path.join(__dirname, '../../db.json');
          const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          const n8nUrl = settingsData.n8nUrl;
          const n8nApiKey = settingsData.n8nApiKey;
          const workflowRes = await axios.get(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
            headers: { 'X-N8N-API-KEY': n8nApiKey },
          });
          const workflow = workflowRes.data.data;
          const agentNode = workflow.nodes.find((n: any) => n.type === '@n8n/n8n-nodes-langchain.agent');
          if (agentNode) {
            // Add chat model if missing
            if (!agentNode.parameters.chatModel) {
              // Add OpenAI Chat node if not present
              let chatNode = workflow.nodes.find((n: any) => n.type === '@n8n/n8n-nodes-langchain.chatOpenAI');
              if (!chatNode) {
                chatNode = {
                  parameters: {
                    model: 'gpt-3.5-turbo',
                    apiKey: 'YOUR_OPENAI_API_KEY',
                  },
                  type: '@n8n/n8n-nodes-langchain.chatOpenAI',
                  typeVersion: 1,
                  position: [agentNode.position[0] + 100, agentNode.position[1] - 100],
                  id: 'openai-chat-1',
                  name: 'OpenAI Chat',
                };
                workflow.nodes.push(chatNode);
              }
              agentNode.parameters.chatModel = chatNode.id;
              if (!workflow.connections[chatNode.name]) {
                workflow.connections[chatNode.name] = { main: [[{ node: agentNode.name, type: 'chatModel', index: 0 }]] };
              }
            }
            // Add tools if missing
            if (!agentNode.parameters.tools || agentNode.parameters.tools.length === 0) {
              let toolsNode = workflow.nodes.find((n: any) => n.type === '@n8n/n8n-nodes-langchain.tools');
              if (!toolsNode) {
                toolsNode = {
                  parameters: {
                    toolType: 'search',
                  },
                  type: '@n8n/n8n-nodes-langchain.tools',
                  typeVersion: 1,
                  position: [agentNode.position[0] + 100, agentNode.position[1]],
                  id: 'tools-1',
                  name: 'Tools',
                };
                workflow.nodes.push(toolsNode);
              }
              agentNode.parameters.tools = [toolsNode.id];
              if (!workflow.connections[toolsNode.name]) {
                workflow.connections[toolsNode.name] = { main: [[{ node: agentNode.name, type: 'tools', index: 0 }]] };
              }
            }
            // Add memory if missing
            if (!agentNode.parameters.memory) {
              let memoryNode = workflow.nodes.find((n: any) => n.type === '@n8n/n8n-nodes-langchain.memory');
              if (!memoryNode) {
                memoryNode = {
                  parameters: {
                    memoryType: 'buffer',
                  },
                  type: '@n8n/n8n-nodes-langchain.memory',
                  typeVersion: 1,
                  position: [agentNode.position[0] + 100, agentNode.position[1] + 100],
                  id: 'memory-1',
                  name: 'Memory',
                };
                workflow.nodes.push(memoryNode);
              }
              agentNode.parameters.memory = memoryNode.id;
              if (!workflow.connections[memoryNode.name]) {
                workflow.connections[memoryNode.name] = { main: [[{ node: agentNode.name, type: 'memory', index: 0 }]] };
              }
            }
            // Save updated workflow to n8n
            await axios.put(`${n8nUrl}/api/v1/workflows/${workflowId}`, workflow, {
              headers: { 'X-N8N-API-KEY': n8nApiKey },
            });
          }
        } catch (autoAddErr) {
          console.error('Auto-add AI Agent dependencies failed:', autoAddErr);
        }
    const data = this.loadDb();
    if (!data.workflowConfigs) {
      data.workflowConfigs = [];
    }
    const existingIndex = data.workflowConfigs.findIndex((c: WorkflowConfig) => c.workflowId === workflowId);
    const now = new Date().toISOString();
    const config: WorkflowConfig = {
      workflowId,
      workflowName,
      fields,
      createdAt: existingIndex >= 0 ? data.workflowConfigs[existingIndex].createdAt : now,
      updatedAt: now,
    };
    if (existingIndex >= 0) {
      data.workflowConfigs[existingIndex] = config;
    } else {
      data.workflowConfigs.push(config);
    }
    this.saveDb(data);

    // --- Push merged workflow to n8n ---
    let n8nUpdate = false;
    let n8nError = undefined;
    try {
      const settingsPath = path.join(__dirname, '../../db.json');
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const n8nUrl = settingsData.n8nUrl;
      const n8nApiKey = settingsData.n8nApiKey;
      const workflowRes = await axios.get(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
        headers: { 'X-N8N-API-KEY': n8nApiKey },
      });
      const workflow = workflowRes.data.data;
      console.log('Loaded workflow from n8n:', JSON.stringify(workflow, null, 2));
      for (const field of fields) {
        console.log('Processing field:', field);
        const node = workflow.nodes.find((n: any) => n.id === field.nodeId);
        if (node) {
          console.log(`Found node for nodeId ${field.nodeId}:`, node);
          if (!node.parameters) node.parameters = {};
          node.parameters[field.fieldName] = field.value;
          console.log(`Set node.parameters[${field.fieldName}] =`, field.value);
        } else {
          console.warn(`No node found for nodeId ${field.nodeId}`);
        }
      }
      console.log('Updated workflow to send to n8n:', JSON.stringify(workflow, null, 2));
      await axios.put(`${n8nUrl}/api/v1/workflows/${workflowId}`, workflow, {
        headers: { 'X-N8N-API-KEY': n8nApiKey },
      });
      n8nUpdate = true;
    } catch (err: any) {
      n8nUpdate = false;
      if (err && typeof err === 'object') {
        if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
          n8nError = err.response.data.message;
        } else if ('message' in err) {
          n8nError = err.message;
        } else {
          n8nError = String(err);
        }
      } else {
        n8nError = String(err);
      }
      console.error('Failed to update workflow in n8n:', n8nError);
    }

    return { config, n8nUpdate, n8nError };
  }

  async deleteWorkflowConfig(workflowId: string): Promise<boolean> {
    const data = this.loadDb();
    const index = data.workflowConfigs?.findIndex((c: WorkflowConfig) => c.workflowId === workflowId);
    
    if (index >= 0) {
      data.workflowConfigs.splice(index, 1);
      this.saveDb(data);
      return true;
    }
    return false;
  }

  async getAllWorkflowConfigs(): Promise<WorkflowConfig[]> {
    const data = this.loadDb();
    return data.workflowConfigs || [];
  }

  // Merge saved config values with workflow data
  mergeConfigWithWorkflow(workflow: any, config: WorkflowConfig | null): any {
    if (!config || !config.fields || config.fields.length === 0) {
      return workflow;
    }

    const merged = JSON.parse(JSON.stringify(workflow));

    for (const field of config.fields) {
      const node = merged.nodes?.find((n: any) => n.id === field.nodeId);
      if (node) {
        if (!node.parameters) {
          node.parameters = {};
        }
        node.parameters[field.fieldName] = field.value;
      }
    }

    return merged;
  }
}
