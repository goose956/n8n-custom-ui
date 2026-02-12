import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ChatRequest {
  message: string;
  apiProvider: string;
  model?: string;
  pageContent: string;
  pageTitle: string;
  pageType: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      if (!this.db.exists()) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(this.db.dbPath, 'utf-8'));
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name === provider);

      if (!keyEntry) {
        return null;
      }

      return this.cryptoService.decrypt(keyEntry.value);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, apiProvider, model, pageContent, pageTitle, pageType } = request;

    const apiKey = this.getApiKey(apiProvider);
    if (!apiKey) {
      return {
        success: false,
        error: `API key for "${apiProvider}" not found or not configured`,
      };
    }

    // Route to appropriate provider
    switch (apiProvider.toLowerCase()) {
      case 'openai':
        return this.sendToOpenAI(apiKey, message, model || 'gpt-4', pageContent, pageTitle, pageType);
      case 'openrouter':
        return this.sendToOpenRouter(apiKey, message, pageContent, pageTitle, pageType);
      case 'make':
        return this.sendToMake(apiKey, message, pageContent, pageTitle, pageType);
      case 'zapier':
        return this.sendToZapier(apiKey, message, pageContent, pageTitle, pageType);
      default:
        return {
          success: false,
          error: `Unknown API provider: ${apiProvider}`,
        };
    }
  }

  private async sendToOpenAI(
    apiKey: string,
    message: string,
    model: string,
    pageContent: string,
    pageTitle: string,
    pageType: string,
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = `CRITICAL: You MUST respond with ONLY valid JSON. Do not include any explanation, comments, or text outside the JSON object. The JSON should be the updated page content.
Current page content: ${pageContent}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const assistantMessage = response.data.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        return {
          success: false,
          error: 'No response from OpenAI',
        };
      }

      return {
        success: true,
        message: assistantMessage,
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            success: false,
            error: 'OpenAI API key is invalid (401 Unauthorized)',
          };
        }
        return {
          success: false,
          error: `OpenAI API error: ${error.response?.status} - ${error.response?.statusText || error.message}`,
        };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `OpenAI request failed: ${errorMessage}`,
      };
    }
  }

  private async sendToOpenRouter(
    apiKey: string,
    message: string,
    pageContent: string,
    pageTitle: string,
    pageType: string,
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = `CRITICAL: You MUST respond with ONLY valid JSON. Do not include any explanation, comments, or text outside the JSON object. The JSON should be the updated page content.
Current page content: ${pageContent}`;

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'n8n Surface',
          },
          timeout: 30000,
        },
      );

      const assistantMessage = response.data.choices?.[0]?.message?.content;
      if (!assistantMessage) {
        return {
          success: false,
          error: 'No response from OpenRouter',
        };
      }

      return {
        success: true,
        message: assistantMessage,
      };
    } catch (error) {
      console.error('OpenRouter chat error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            success: false,
            error: 'OpenRouter API key is invalid (401 Unauthorized)',
          };
        }
        return {
          success: false,
          error: `OpenRouter API error: ${error.response?.status} - ${error.response?.statusText || error.message}`,
        };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `OpenRouter request failed: ${errorMessage}`,
      };
    }
  }

  private async sendToMake(
    apiKey: string,
    message: string,
    pageContent: string,
    pageTitle: string,
    pageType: string,
  ): Promise<ChatResponse> {
    // Make.com is primarily for automation, not chat
    // For now, return a message indicating limited chat support
    try {
      return {
        success: true,
        message: `[Make.com Integration] Received your request for page "${pageTitle}". 
Make.com is primarily used for automation workflows rather than direct chat. 
Please use the OpenAI or OpenRouter integration for AI-powered chat assistance.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Make.com request failed: ${errorMessage}`,
      };
    }
  }

  private async sendToZapier(
    apiKey: string,
    message: string,
    pageContent: string,
    pageTitle: string,
    pageType: string,
  ): Promise<ChatResponse> {
    // Zapier is primarily for automation, not chat
    // For now, return a message indicating limited chat support
    try {
      return {
        success: true,
        message: `[Zapier Integration] Received your request for page "${pageTitle}". 
Zapier is primarily used for automation workflows rather than direct chat. 
Please use the OpenAI or OpenRouter integration for AI-powered chat assistance.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Zapier request failed: ${errorMessage}`,
      };
    }
  }
}
