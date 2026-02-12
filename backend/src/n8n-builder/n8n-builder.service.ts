import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

// ─── Comprehensive n8n Node Registry ───────────────────────────────────────────

export interface N8nNodeDef {
  type: string;
  displayName: string;
  group: 'trigger' | 'action' | 'flow' | 'transform' | 'ai' | 'output' | 'credential';
  description: string;
  /** Common parameter names */
  commonParams: string[];
}

export const N8N_NODE_REGISTRY: N8nNodeDef[] = [
  // ── Triggers ──
  { type: 'n8n-nodes-base.webhook', displayName: 'Webhook', group: 'trigger', description: 'Starts workflow on incoming HTTP request', commonParams: ['httpMethod', 'path', 'responseMode', 'responseData'] },
  { type: 'n8n-nodes-base.scheduleTrigger', displayName: 'Schedule Trigger', group: 'trigger', description: 'Triggers workflow on a cron schedule', commonParams: ['rule'] },
  { type: 'n8n-nodes-base.manualTrigger', displayName: 'Manual Trigger', group: 'trigger', description: 'Start workflow manually', commonParams: [] },
  { type: 'n8n-nodes-base.emailReadImap', displayName: 'Email Trigger (IMAP)', group: 'trigger', description: 'Triggers when a new email is received', commonParams: ['host', 'port', 'user', 'password', 'mailbox'] },
  { type: 'n8n-nodes-base.formTrigger', displayName: 'Form Trigger', group: 'trigger', description: 'Triggers on form submission', commonParams: ['formTitle', 'formFields'] },
  { type: 'n8n-nodes-base.chatTrigger', displayName: 'Chat Trigger', group: 'trigger', description: 'Starts workflow from chat message', commonParams: [] },

  // ── HTTP / API ──
  { type: 'n8n-nodes-base.httpRequest', displayName: 'HTTP Request', group: 'action', description: 'Make HTTP requests to any API', commonParams: ['method', 'url', 'authentication', 'headers', 'body', 'queryParameters'] },
  { type: 'n8n-nodes-base.respondToWebhook', displayName: 'Respond to Webhook', group: 'output', description: 'Send response back to webhook caller', commonParams: ['respondWith', 'responseBody', 'responseCode', 'responseHeaders'] },

  // ── Data Transform ──
  { type: 'n8n-nodes-base.set', displayName: 'Edit Fields (Set)', group: 'transform', description: 'Set or modify data fields', commonParams: ['mode', 'assignments'] },
  { type: 'n8n-nodes-base.code', displayName: 'Code', group: 'transform', description: 'Run custom JavaScript or Python code', commonParams: ['language', 'jsCode', 'pythonCode'] },
  { type: 'n8n-nodes-base.functionItem', displayName: 'Function Item', group: 'transform', description: 'Run JS function for each item', commonParams: ['functionCode'] },
  { type: 'n8n-nodes-base.itemLists', displayName: 'Item Lists', group: 'transform', description: 'Split, concatenate, or sort lists', commonParams: ['operation', 'fieldToSplitOut'] },
  { type: 'n8n-nodes-base.splitInBatches', displayName: 'Split In Batches', group: 'transform', description: 'Process items in batches', commonParams: ['batchSize'] },
  { type: 'n8n-nodes-base.aggregate', displayName: 'Aggregate', group: 'transform', description: 'Aggregate items into a single item', commonParams: ['aggregate'] },
  { type: 'n8n-nodes-base.removeDuplicates', displayName: 'Remove Duplicates', group: 'transform', description: 'Remove duplicate items', commonParams: ['compare', 'fieldsToCompareBy'] },
  { type: 'n8n-nodes-base.sort', displayName: 'Sort', group: 'transform', description: 'Sort items by field', commonParams: ['sortFieldsUi'] },
  { type: 'n8n-nodes-base.limit', displayName: 'Limit', group: 'transform', description: 'Limit number of items', commonParams: ['maxItems'] },
  { type: 'n8n-nodes-base.dateTime', displayName: 'Date & Time', group: 'transform', description: 'Manipulate date and time values', commonParams: ['action', 'date', 'format'] },
  { type: 'n8n-nodes-base.crypto', displayName: 'Crypto', group: 'transform', description: 'Hash, encrypt, or generate random values', commonParams: ['action', 'type', 'value'] },
  { type: 'n8n-nodes-base.html', displayName: 'HTML', group: 'transform', description: 'Extract or generate HTML', commonParams: ['operation', 'sourceData'] },
  { type: 'n8n-nodes-base.xml', displayName: 'XML', group: 'transform', description: 'Convert between XML and JSON', commonParams: ['mode', 'dataFieldName'] },
  { type: 'n8n-nodes-base.markdown', displayName: 'Markdown', group: 'transform', description: 'Convert between Markdown and HTML', commonParams: ['mode', 'markdown', 'html'] },

  // ── Flow Control ──
  { type: 'n8n-nodes-base.if', displayName: 'IF', group: 'flow', description: 'Route items based on condition', commonParams: ['conditions'] },
  { type: 'n8n-nodes-base.switch', displayName: 'Switch', group: 'flow', description: 'Route items to different outputs', commonParams: ['mode', 'rules'] },
  { type: 'n8n-nodes-base.merge', displayName: 'Merge', group: 'flow', description: 'Merge data from multiple inputs', commonParams: ['mode', 'joinMode', 'mergeByFields'] },
  { type: 'n8n-nodes-base.wait', displayName: 'Wait', group: 'flow', description: 'Pause execution for a duration or until event', commonParams: ['resume', 'amount', 'unit'] },
  { type: 'n8n-nodes-base.noOp', displayName: 'No Operation', group: 'flow', description: 'Do nothing (useful as placeholder)', commonParams: [] },
  { type: 'n8n-nodes-base.executeWorkflow', displayName: 'Execute Workflow', group: 'flow', description: 'Run another workflow as sub-workflow', commonParams: ['source', 'workflowId'] },
  { type: 'n8n-nodes-base.errorTrigger', displayName: 'Error Trigger', group: 'trigger', description: 'Triggers when workflow errors occur', commonParams: [] },
  { type: 'n8n-nodes-base.stopAndError', displayName: 'Stop and Error', group: 'flow', description: 'Stop workflow and throw error', commonParams: ['errorMessage'] },
  { type: 'n8n-nodes-base.filter', displayName: 'Filter', group: 'flow', description: 'Filter items based on conditions', commonParams: ['conditions'] },

  // ── Databases ──
  { type: 'n8n-nodes-base.postgres', displayName: 'Postgres', group: 'action', description: 'Read, insert, update, or delete in PostgreSQL', commonParams: ['operation', 'query', 'table'] },
  { type: 'n8n-nodes-base.mySql', displayName: 'MySQL', group: 'action', description: 'Interact with MySQL databases', commonParams: ['operation', 'query', 'table'] },
  { type: 'n8n-nodes-base.mongoDb', displayName: 'MongoDB', group: 'action', description: 'Interact with MongoDB', commonParams: ['operation', 'collection', 'query'] },
  { type: 'n8n-nodes-base.redis', displayName: 'Redis', group: 'action', description: 'Read/write Redis keys', commonParams: ['operation', 'key'] },

  // ── Files & Storage ──
  { type: 'n8n-nodes-base.readWriteFile', displayName: 'Read/Write File', group: 'action', description: 'Read or write files to disk', commonParams: ['operation', 'fileName', 'fileContent'] },
  { type: 'n8n-nodes-base.spreadsheetFile', displayName: 'Spreadsheet File', group: 'transform', description: 'Read/write CSV/XLS/XLSX files', commonParams: ['operation', 'fileFormat'] },
  { type: 'n8n-nodes-base.ftp', displayName: 'FTP', group: 'action', description: 'Upload/download files via FTP', commonParams: ['operation', 'host', 'path'] },
  { type: 'n8n-nodes-base.s3', displayName: 'AWS S3', group: 'action', description: 'Upload/download files from S3', commonParams: ['operation', 'bucketName', 'fileName'] },

  // ── Communication ──
  { type: 'n8n-nodes-base.slack', displayName: 'Slack', group: 'action', description: 'Send messages, manage channels in Slack', commonParams: ['resource', 'operation', 'channel', 'text'] },
  { type: 'n8n-nodes-base.discord', displayName: 'Discord', group: 'action', description: 'Send messages to Discord', commonParams: ['resource', 'operation', 'webhookUri', 'content'] },
  { type: 'n8n-nodes-base.telegram', displayName: 'Telegram', group: 'action', description: 'Send messages via Telegram bot', commonParams: ['resource', 'operation', 'chatId', 'text'] },
  { type: 'n8n-nodes-base.emailSend', displayName: 'Send Email', group: 'action', description: 'Send emails via SMTP', commonParams: ['fromEmail', 'toEmail', 'subject', 'text', 'html'] },
  { type: 'n8n-nodes-base.gmail', displayName: 'Gmail', group: 'action', description: 'Send and manage Gmail messages', commonParams: ['resource', 'operation', 'sendTo', 'subject', 'message'] },
  { type: 'n8n-nodes-base.microsoftTeams', displayName: 'Microsoft Teams', group: 'action', description: 'Send messages to Teams channels', commonParams: ['resource', 'operation', 'teamId', 'channelId', 'message'] },

  // ── CRM & Productivity ──
  { type: 'n8n-nodes-base.googleSheets', displayName: 'Google Sheets', group: 'action', description: 'Read, append, update Google Sheets', commonParams: ['operation', 'sheetId', 'range', 'values'] },
  { type: 'n8n-nodes-base.googleDrive', displayName: 'Google Drive', group: 'action', description: 'Manage files on Google Drive', commonParams: ['resource', 'operation', 'fileId'] },
  { type: 'n8n-nodes-base.googleCalendar', displayName: 'Google Calendar', group: 'action', description: 'Manage calendar events', commonParams: ['resource', 'operation', 'calendarId'] },
  { type: 'n8n-nodes-base.notion', displayName: 'Notion', group: 'action', description: 'Manage Notion databases and pages', commonParams: ['resource', 'operation', 'databaseId', 'pageId'] },
  { type: 'n8n-nodes-base.airtable', displayName: 'Airtable', group: 'action', description: 'Read/write Airtable records', commonParams: ['operation', 'application', 'table'] },
  { type: 'n8n-nodes-base.hubspot', displayName: 'HubSpot', group: 'action', description: 'Manage HubSpot CRM contacts, deals', commonParams: ['resource', 'operation'] },
  { type: 'n8n-nodes-base.salesforce', displayName: 'Salesforce', group: 'action', description: 'Manage Salesforce objects', commonParams: ['resource', 'operation'] },
  { type: 'n8n-nodes-base.jira', displayName: 'Jira', group: 'action', description: 'Create and manage Jira issues', commonParams: ['resource', 'operation', 'project', 'issueType'] },
  { type: 'n8n-nodes-base.trello', displayName: 'Trello', group: 'action', description: 'Manage Trello boards, lists, and cards', commonParams: ['resource', 'operation'] },
  { type: 'n8n-nodes-base.asana', displayName: 'Asana', group: 'action', description: 'Manage Asana tasks and projects', commonParams: ['resource', 'operation'] },

  // ── E-commerce ──
  { type: 'n8n-nodes-base.stripe', displayName: 'Stripe', group: 'action', description: 'Manage Stripe payments, customers', commonParams: ['resource', 'operation'] },
  { type: 'n8n-nodes-base.shopify', displayName: 'Shopify', group: 'action', description: 'Manage Shopify orders, products', commonParams: ['resource', 'operation'] },
  { type: 'n8n-nodes-base.wooCommerce', displayName: 'WooCommerce', group: 'action', description: 'Manage WooCommerce store', commonParams: ['resource', 'operation'] },

  // ── AI / LangChain ──
  { type: '@n8n/n8n-nodes-langchain.agent', displayName: 'AI Agent', group: 'ai', description: 'AI agent with tool use capability', commonParams: ['text', 'options'] },
  { type: '@n8n/n8n-nodes-langchain.chainLlm', displayName: 'Basic LLM Chain', group: 'ai', description: 'Simple LLM chain for text generation', commonParams: ['prompt', 'messages'] },
  { type: '@n8n/n8n-nodes-langchain.chainSummarization', displayName: 'Summarization Chain', group: 'ai', description: 'Summarize long text', commonParams: ['options'] },
  { type: '@n8n/n8n-nodes-langchain.chainRetrievalQa', displayName: 'Question and Answer Chain', group: 'ai', description: 'Answer questions from a knowledge base', commonParams: ['query'] },
  { type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', displayName: 'OpenAI Chat Model', group: 'ai', description: 'OpenAI GPT chat model sub-node', commonParams: ['model', 'options'] },
  { type: '@n8n/n8n-nodes-langchain.lmChatAnthropic', displayName: 'Anthropic Chat Model', group: 'ai', description: 'Anthropic Claude chat model sub-node', commonParams: ['model', 'options'] },
  { type: '@n8n/n8n-nodes-langchain.lmChatOllama', displayName: 'Ollama Chat Model', group: 'ai', description: 'Ollama local LLM sub-node', commonParams: ['model', 'baseUrl'] },
  { type: '@n8n/n8n-nodes-langchain.memoryBufferWindow', displayName: 'Window Buffer Memory', group: 'ai', description: 'Keeps last N messages in memory', commonParams: ['sessionKey', 'contextWindowLength'] },
  { type: '@n8n/n8n-nodes-langchain.toolCode', displayName: 'Custom Code Tool', group: 'ai', description: 'Define custom tool via code', commonParams: ['name', 'description', 'jsCode'] },
  { type: '@n8n/n8n-nodes-langchain.toolHttpRequest', displayName: 'HTTP Request Tool', group: 'ai', description: 'Tool that makes HTTP requests', commonParams: ['name', 'description', 'method', 'url'] },
  { type: '@n8n/n8n-nodes-langchain.toolCalculator', displayName: 'Calculator Tool', group: 'ai', description: 'Tool for math calculations', commonParams: [] },
  { type: '@n8n/n8n-nodes-langchain.toolWikipedia', displayName: 'Wikipedia Tool', group: 'ai', description: 'Tool to search Wikipedia', commonParams: [] },
  { type: '@n8n/n8n-nodes-langchain.outputParserStructured', displayName: 'Structured Output Parser', group: 'ai', description: 'Parse LLM output into structured JSON', commonParams: ['jsonSchema'] },
  { type: '@n8n/n8n-nodes-langchain.vectorStoreInMemory', displayName: 'In-Memory Vector Store', group: 'ai', description: 'Store embeddings in memory', commonParams: ['mode'] },
  { type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi', displayName: 'OpenAI Embeddings', group: 'ai', description: 'Generate text embeddings with OpenAI', commonParams: ['model', 'options'] },
  { type: '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter', displayName: 'Recursive Character Text Splitter', group: 'ai', description: 'Split text by character count recursively', commonParams: ['chunkSize', 'chunkOverlap'] },
];

// ─── Workflow JSON Structure Reference ─────────────────────────────────────────

export interface N8nWorkflowJson {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  settings?: {
    executionOrder?: 'v1';
    saveManualExecutions?: boolean;
    callerPolicy?: string;
    errorWorkflow?: string;
  };
  pinData?: Record<string, any>;
  staticData?: any;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, { id: string; name: string }>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
}

export interface N8nConnection {
  [outputType: string]: Array<Array<{ node: string; type: string; index: number }>>;
}

// ─── Validation ────────────────────────────────────────────────────────────────

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  nodeName?: string;
  message: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    nodeCount: number;
    connectionCount: number;
    triggerCount: number;
    knownNodeTypes: number;
    unknownNodeTypes: string[];
  };
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

export interface BuilderChatRequest {
  message: string;
  apiProvider: string;
  model?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentWorkflow?: any;
}

export interface BuilderChatResponse {
  success: boolean;
  message?: string;
  workflow?: any;
  error?: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class N8nBuilderService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      if (!this.db.exists()) return null;
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name === provider);
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Node Registry Queries
  // ─────────────────────────────────────────────────────────────────────────────

  getAvailableNodes(): N8nNodeDef[] {
    return N8N_NODE_REGISTRY;
  }

  getNodesByGroup(group: string): N8nNodeDef[] {
    return N8N_NODE_REGISTRY.filter((n) => n.group === group);
  }

  searchNodes(query: string): N8nNodeDef[] {
    const q = query.toLowerCase();
    return N8N_NODE_REGISTRY.filter(
      (n) =>
        n.displayName.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Workflow Validation
  // ─────────────────────────────────────────────────────────────────────────────

  validateWorkflow(workflowJson: any): ValidationResult {
    const issues: ValidationIssue[] = [];

    // ── Basic structure checks ──
    if (!workflowJson || typeof workflowJson !== 'object') {
      return {
        valid: false,
        issues: [{ severity: 'error', message: 'Workflow JSON must be a valid object' }],
        stats: { nodeCount: 0, connectionCount: 0, triggerCount: 0, knownNodeTypes: 0, unknownNodeTypes: [] },
      };
    }

    if (!workflowJson.name || typeof workflowJson.name !== 'string') {
      issues.push({ severity: 'warning', message: 'Workflow should have a "name" property', fix: 'Add a "name" string field' });
    }

    if (!Array.isArray(workflowJson.nodes)) {
      issues.push({ severity: 'error', message: '"nodes" must be an array', fix: 'Add a "nodes" array with at least one node' });
      return {
        valid: false,
        issues,
        stats: { nodeCount: 0, connectionCount: 0, triggerCount: 0, knownNodeTypes: 0, unknownNodeTypes: [] },
      };
    }

    if (workflowJson.nodes.length === 0) {
      issues.push({ severity: 'error', message: 'Workflow has no nodes', fix: 'Add at least one trigger node and one action node' });
    }

    // ── Node validation ──
    const nodeNames = new Set<string>();
    const nodeIds = new Set<string>();
    const unknownTypes: string[] = [];
    let triggerCount = 0;
    const knownTypes = new Set(N8N_NODE_REGISTRY.map((n) => n.type));

    for (const node of workflowJson.nodes) {
      // Required fields
      if (!node.name) {
        issues.push({ severity: 'error', nodeId: node.id, message: `Node missing "name" field`, fix: 'Every node needs a unique name' });
      }
      if (!node.type) {
        issues.push({ severity: 'error', nodeId: node.id, nodeName: node.name, message: `Node "${node.name || '?'}" missing "type" field` });
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        issues.push({ severity: 'warning', nodeId: node.id, nodeName: node.name, message: `Node "${node.name || '?'}" has invalid position`, fix: 'Position should be [x, y] number array' });
      }
      if (node.typeVersion === undefined) {
        issues.push({ severity: 'warning', nodeId: node.id, nodeName: node.name, message: `Node "${node.name || '?'}" missing typeVersion`, fix: 'Add typeVersion (usually 1 or 2)' });
      }
      if (!node.parameters || typeof node.parameters !== 'object') {
        issues.push({ severity: 'warning', nodeId: node.id, nodeName: node.name, message: `Node "${node.name || '?'}" missing parameters object`, fix: 'Add "parameters": {} even if empty' });
      }

      // Duplicate names
      if (node.name && nodeNames.has(node.name)) {
        issues.push({ severity: 'error', nodeId: node.id, nodeName: node.name, message: `Duplicate node name "${node.name}"`, fix: 'Each node must have a unique name' });
      }
      if (node.name) nodeNames.add(node.name);

      // Duplicate IDs
      if (node.id && nodeIds.has(node.id)) {
        issues.push({ severity: 'error', nodeId: node.id, nodeName: node.name, message: `Duplicate node ID "${node.id}"` });
      }
      if (node.id) nodeIds.add(node.id);

      // Check type is known
      if (node.type && !knownTypes.has(node.type)) {
        unknownTypes.push(node.type);
        issues.push({ severity: 'info', nodeId: node.id, nodeName: node.name, message: `Node type "${node.type}" is not in the built-in registry (may still be valid if you have the package installed)` });
      }

      // Trigger detection
      if (node.type && (node.type.includes('Trigger') || node.type.includes('trigger') || node.type === 'n8n-nodes-base.webhook')) {
        triggerCount++;
      }
    }

    // Should have at least one trigger
    if (triggerCount === 0 && workflowJson.nodes.length > 0) {
      issues.push({ severity: 'warning', message: 'Workflow has no trigger node. It will only be executable manually.', fix: 'Add a trigger node (Webhook, Schedule, Manual Trigger, etc.) to start the workflow automatically' });
    }

    // ── Connections validation ──
    let connectionCount = 0;
    if (workflowJson.connections && typeof workflowJson.connections === 'object') {
      for (const [sourceName, outputs] of Object.entries(workflowJson.connections)) {
        if (!nodeNames.has(sourceName)) {
          issues.push({ severity: 'error', message: `Connection references unknown source node "${sourceName}"`, fix: `Ensure node "${sourceName}" exists in the nodes array` });
        }
        if (outputs && typeof outputs === 'object') {
          for (const [outputType, destinations] of Object.entries(outputs as any)) {
            if (Array.isArray(destinations)) {
              for (const destGroup of destinations) {
                if (Array.isArray(destGroup)) {
                  for (const dest of destGroup) {
                    connectionCount++;
                    if (dest.node && !nodeNames.has(dest.node)) {
                      issues.push({ severity: 'error', message: `Connection references unknown target node "${dest.node}"`, fix: `Ensure node "${dest.node}" exists in the nodes array` });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else if (workflowJson.nodes.length > 1) {
      issues.push({ severity: 'warning', message: 'Workflow has multiple nodes but no connections', fix: 'Add a "connections" object to wire nodes together' });
    }

    // ── Settings validation ──
    if (workflowJson.settings) {
      if (workflowJson.settings.executionOrder && workflowJson.settings.executionOrder !== 'v1') {
        issues.push({ severity: 'info', message: 'executionOrder should be "v1" for modern n8n versions' });
      }
    }

    const hasErrors = issues.some((i) => i.severity === 'error');

    return {
      valid: !hasErrors,
      issues,
      stats: {
        nodeCount: workflowJson.nodes?.length || 0,
        connectionCount,
        triggerCount,
        knownNodeTypes: workflowJson.nodes?.filter((n: any) => knownTypes.has(n.type)).length || 0,
        unknownNodeTypes: [...new Set(unknownTypes)],
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AI-Powered Chat
  // ─────────────────────────────────────────────────────────────────────────────

  private buildSystemPrompt(currentWorkflow?: any): string {
    const nodeList = N8N_NODE_REGISTRY.map(
      (n) => `  - ${n.type} (${n.displayName}): ${n.description}`,
    ).join('\n');

    const example = JSON.stringify(
      {
        name: 'Example Webhook to Slack',
        nodes: [
          {
            id: 'webhook-1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [250, 300],
            parameters: { httpMethod: 'POST', path: 'incoming', responseMode: 'lastNode' },
          },
          {
            id: 'set-1',
            name: 'Format Message',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [470, 300],
            parameters: {
              mode: 'manual',
              assignments: {
                assignments: [
                  { id: 'a1', name: 'slackMessage', value: '={{ $json.body.text }}', type: 'string' },
                ],
              },
            },
          },
          {
            id: 'slack-1',
            name: 'Send Slack Message',
            type: 'n8n-nodes-base.slack',
            typeVersion: 2.2,
            position: [690, 300],
            parameters: { resource: 'message', operation: 'post', channel: '#general', text: '={{ $json.slackMessage }}' },
            credentials: { slackApi: { id: 'cred-1', name: 'Slack Account' } },
          },
        ],
        connections: {
          Webhook: { main: [[{ node: 'Format Message', type: 'main', index: 0 }]] },
          'Format Message': { main: [[{ node: 'Send Slack Message', type: 'main', index: 0 }]] },
        },
        settings: { executionOrder: 'v1' },
      },
      null,
      2,
    );

    let prompt = `You are an expert n8n workflow builder assistant. You create, explain, validate, and improve n8n workflow JSON files that can be directly imported into n8n.

CRITICAL RULES:
1. When asked to create or modify a workflow, ALWAYS respond with valid JSON wrapped in a \`\`\`json code block.
2. Every workflow MUST have:
   - "name" (string)
   - "nodes" (array of node objects)
   - "connections" (object mapping source node names to outputs)
   - "settings" (object, at minimum { "executionOrder": "v1" })
3. Every node MUST have: id, name, type, typeVersion, position ([x,y]), parameters
4. Node names must be unique. Use descriptive names.
5. Connections use the SOURCE NODE NAME as key, with "main" output type.
6. Position nodes on a grid – typically 220px apart horizontally, triggers start at [250, 300].
7. Use expressions like {{ $json.fieldName }} for referencing data between nodes.
8. For sub-nodes (AI tools, memory, embeddings), use "ai_tool", "ai_memory", "ai_outputParser", "ai_languageModel" as connection types instead of "main".

AVAILABLE NODE TYPES:
${nodeList}

EXAMPLE WORKFLOW:
\`\`\`json
${example}
\`\`\`

WHEN RESPONDING:
- If the user asks for a workflow, produce the COMPLETE valid JSON.
- If the user asks a question, answer it clearly and concisely, referencing specific node types.
- If the request is ambiguous, ask a clarifying question before building.
- If you see ways to improve a workflow, suggest them.
- When validating, list each issue with severity (error/warning/info).
- You may also reference credentials objects if nodes require them, using placeholder IDs.
- ALWAYS place the workflow JSON in a \`\`\`json code block so it can be parsed.
`;

    if (currentWorkflow) {
      prompt += `\n\nThe user currently has this workflow loaded:\n\`\`\`json\n${JSON.stringify(currentWorkflow, null, 2)}\n\`\`\`\nModify it if asked, or reference it when answering questions.\n`;
    }

    return prompt;
  }

  async chat(request: BuilderChatRequest): Promise<BuilderChatResponse> {
    const { message, apiProvider, model, conversationHistory, currentWorkflow } = request;

    const apiKey = this.getApiKey(apiProvider);
    if (!apiKey) {
      return {
        success: false,
        error: `API key for "${apiProvider}" not found. Please add it in Settings → API Keys.`,
      };
    }

    const systemPrompt = this.buildSystemPrompt(currentWorkflow);

    // Build messages array with history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      // Keep last 20 messages for context
      const recentHistory = conversationHistory.slice(-20);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    switch (apiProvider.toLowerCase()) {
      case 'openai':
        return this.sendToOpenAI(apiKey, messages, model || 'gpt-4');
      case 'openrouter':
        return this.sendToOpenRouter(apiKey, messages);
      default:
        return {
          success: false,
          error: `Provider "${apiProvider}" is not supported for workflow building. Please use OpenAI or OpenRouter.`,
        };
    }
  }

  private async sendToOpenAI(
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
    model: string,
  ): Promise<BuilderChatResponse> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages,
          temperature: 0.4,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        return { success: false, error: 'No response from OpenAI' };
      }

      // Try to extract workflow JSON from the response
      const workflow = this.extractWorkflowFromResponse(content);

      return {
        success: true,
        message: content,
        workflow: workflow || undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'OpenAI API key is invalid (401)' };
        }
        return { success: false, error: `OpenAI error: ${error.response?.status} - ${error.response?.statusText || error.message}` };
      }
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `OpenAI request failed: ${msg}` };
    }
  }

  private async sendToOpenRouter(
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<BuilderChatResponse> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-4o',
          messages,
          temperature: 0.4,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'n8n Surface Workflow Builder',
          },
          timeout: 60000,
        },
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        return { success: false, error: 'No response from OpenRouter' };
      }

      const workflow = this.extractWorkflowFromResponse(content);

      return {
        success: true,
        message: content,
        workflow: workflow || undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'OpenRouter API key is invalid (401)' };
        }
        return { success: false, error: `OpenRouter error: ${error.response?.status} - ${error.response?.statusText || error.message}` };
      }
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `OpenRouter request failed: ${msg}` };
    }
  }

  /**
   * Attempt to extract valid n8n workflow JSON from an AI response.
   * The AI is instructed to wrap JSON in ```json blocks.
   */
  private extractWorkflowFromResponse(text: string): any | null {
    // Try to find ```json ... ``` block
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        if (parsed && parsed.nodes && Array.isArray(parsed.nodes)) {
          return parsed;
        }
      } catch {
        // Failed to parse – fall through
      }
    }

    // Try to find any large JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*"nodes"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.nodes && Array.isArray(parsed.nodes)) {
          return parsed;
        }
      } catch {
        // Failed to parse
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Template generation — quick-start workflows
  // ─────────────────────────────────────────────────────────────────────────────

  generateTemplate(templateId: string): N8nWorkflowJson | null {
    const templates: Record<string, N8nWorkflowJson> = {
      'webhook-to-slack': {
        name: 'Webhook to Slack Notification',
        nodes: [
          { id: 'node-1', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [250, 300], parameters: { httpMethod: 'POST', path: 'webhook-slack', responseMode: 'lastNode' } },
          { id: 'node-2', name: 'Send to Slack', type: 'n8n-nodes-base.slack', typeVersion: 2.2, position: [470, 300], parameters: { resource: 'message', operation: 'post', channel: '#notifications', text: '={{ $json.body.message }}' }, credentials: { slackApi: { id: 'cred-1', name: 'Slack Account' } } },
          { id: 'node-3', name: 'Respond', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [690, 300], parameters: { respondWith: 'json', responseBody: '={{ JSON.stringify({ status: "sent" }) }}' } },
        ],
        connections: { Webhook: { main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]] }, 'Send to Slack': { main: [[{ node: 'Respond', type: 'main', index: 0 }]] } },
        settings: { executionOrder: 'v1' },
      },
      'schedule-email': {
        name: 'Scheduled Email Report',
        nodes: [
          { id: 'node-1', name: 'Schedule', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [250, 300], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 9 * * 1' }] } } },
          { id: 'node-2', name: 'Fetch Data', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [470, 300], parameters: { method: 'GET', url: 'https://api.example.com/report' } },
          { id: 'node-3', name: 'Format Report', type: 'n8n-nodes-base.code', typeVersion: 2, position: [690, 300], parameters: { language: 'javaScript', jsCode: 'const data = $input.all();\nreturn [{ json: { subject: "Weekly Report", body: JSON.stringify(data, null, 2) } }];' } },
          { id: 'node-4', name: 'Send Email', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [910, 300], parameters: { fromEmail: 'reports@example.com', toEmail: 'team@example.com', subject: '={{ $json.subject }}', text: '={{ $json.body }}' } },
        ],
        connections: { Schedule: { main: [[{ node: 'Fetch Data', type: 'main', index: 0 }]] }, 'Fetch Data': { main: [[{ node: 'Format Report', type: 'main', index: 0 }]] }, 'Format Report': { main: [[{ node: 'Send Email', type: 'main', index: 0 }]] } },
        settings: { executionOrder: 'v1' },
      },
      'ai-chatbot': {
        name: 'AI Chatbot with Memory',
        nodes: [
          { id: 'node-1', name: 'Chat Trigger', type: 'n8n-nodes-base.chatTrigger', typeVersion: 1, position: [250, 300], parameters: {} },
          { id: 'node-2', name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent', typeVersion: 1.7, position: [550, 300], parameters: { options: {} } },
          { id: 'node-3', name: 'OpenAI Model', type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', typeVersion: 1.2, position: [550, 500], parameters: { model: 'gpt-4o-mini', options: {} } },
          { id: 'node-4', name: 'Memory', type: '@n8n/n8n-nodes-langchain.memoryBufferWindow', typeVersion: 1.3, position: [750, 500], parameters: { sessionKey: 'chat_history', contextWindowLength: 10 } },
        ],
        connections: {
          'Chat Trigger': { main: [[{ node: 'AI Agent', type: 'main', index: 0 }]] },
          'OpenAI Model': { ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]] },
          Memory: { ai_memory: [[{ node: 'AI Agent', type: 'ai_memory', index: 0 }]] },
        },
        settings: { executionOrder: 'v1' },
      },
      'form-to-sheets': {
        name: 'Form Submission to Google Sheets',
        nodes: [
          { id: 'node-1', name: 'Form Trigger', type: 'n8n-nodes-base.formTrigger', typeVersion: 2.2, position: [250, 300], parameters: { formTitle: 'Contact Form', formFields: { values: [{ fieldLabel: 'Name', fieldType: 'text', requiredField: true }, { fieldLabel: 'Email', fieldType: 'email', requiredField: true }, { fieldLabel: 'Message', fieldType: 'textarea' }] } } },
          { id: 'node-2', name: 'Append to Sheets', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5, position: [470, 300], parameters: { operation: 'appendOrUpdate', documentId: { value: 'YOUR_SHEET_ID' }, sheetName: { value: 'Sheet1' } }, credentials: { googleSheetsOAuth2Api: { id: 'cred-1', name: 'Google Sheets account' } } },
        ],
        connections: { 'Form Trigger': { main: [[{ node: 'Append to Sheets', type: 'main', index: 0 }]] } },
        settings: { executionOrder: 'v1' },
      },
    };

    return templates[templateId] || null;
  }

  getTemplateList(): Array<{ id: string; name: string; description: string; nodeCount: number }> {
    return [
      { id: 'webhook-to-slack', name: 'Webhook → Slack', description: 'Receive HTTP webhook and send Slack notification', nodeCount: 3 },
      { id: 'schedule-email', name: 'Scheduled Email Report', description: 'Weekly report via cron schedule with email delivery', nodeCount: 4 },
      { id: 'ai-chatbot', name: 'AI Chatbot with Memory', description: 'Chat Trigger + AI Agent + OpenAI + Memory', nodeCount: 4 },
      { id: 'form-to-sheets', name: 'Form → Google Sheets', description: 'n8n form submission saved to Google Sheets', nodeCount: 2 },
    ];
  }
}
