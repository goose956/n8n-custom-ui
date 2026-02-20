import { Injectable } from'@nestjs/common';
import * as fs from'fs';
import axios from'axios';
import { CryptoService } from'../shared/crypto.service';
import { DatabaseService } from'../shared/database.service';

interface SettingsDto {
 n8nUrl: string;
 n8nApiKey: string;
}

@Injectable()
export class SettingsService {
 constructor(
 private readonly cryptoService: CryptoService,
 private readonly db: DatabaseService,
 ) {}

 async saveSettings(settings: SettingsDto): Promise<{ success: boolean; message: string }> {
 try {
 const encryptedApiKey = this.cryptoService.encrypt(settings.n8nApiKey);

 // Read existing data first to preserve apps, pages, etc.
 const existingData: any = this.db.readSync();

 const data = {
 ...existingData,
 n8nUrl: settings.n8nUrl,
 n8nApiKey: encryptedApiKey,
 lastUpdated: new Date().toISOString(),
 };

 this.db.writeSync(data);
 return { success: true, message:'Settings saved successfully' };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Failed to save settings: ${message}` };
 }
 }

 async loadSettings(): Promise<{ n8nUrl: string; n8nApiKey?: string } | null> {
 try {
 const data = this.db.readSync();
 return {
 n8nUrl: data.n8nUrl,
 // Don't return the actual API key to frontend
 };
 } catch (error) {
 return null;
 }
 }

 async testN8nConnection(): Promise<{ success: boolean; message: string }> {
 try {
 const data = this.db.readSync();
 const decryptedApiKey = this.cryptoService.decrypt(data.n8nApiKey);

 const response = await axios.get(`${data.n8nUrl}/api/v1/workflows`, {
 headers: {
'X-N8N-API-KEY': decryptedApiKey,
 },
 timeout: 5000,
 });

 return { success: true, message:`Connected successfully! Found ${response.data.data.length} workflows` };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Connection failed: ${message}` };
 }
 }

 async getWorkflows(): Promise<{ success: boolean; workflows?: any[]; message: string }> {
 try {
 const data = this.db.readSync();
 const decryptedApiKey = this.cryptoService.decrypt(data.n8nApiKey);

 const response = await axios.get(`${data.n8nUrl}/api/v1/workflows`, {
 headers: {
'X-N8N-API-KEY': decryptedApiKey,
 },
 timeout: 5000,
 });

 return { 
 success: true, 
 workflows: response.data.data,
 message:`Found ${response.data.data.length} workflows`
 };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Failed to fetch workflows: ${message}` };
 }
 }

 async testIntegrationKey(service: string): Promise<{ success: boolean; message: string }> {
 try {
 const data = this.db.readSync();
 const apiKeys = data.apiKeys || [];
 
 const keyEntry = apiKeys.find((k: any) => k.name === service);
 if (!keyEntry) {
 return { success: false, message:`${service} API key not found or not configured` };
 }

 const apiKey = this.cryptoService.decrypt(keyEntry.value);

 // Test based on service type
 switch (service.toLowerCase()) {
 case'openai':
 return await this.testOpenAIKey(apiKey);
 case'openrouter':
 return await this.testOpenRouterKey(apiKey);
 case'claude':
 return await this.testClaudeKey(apiKey);
 case'brave':
 return await this.testBraveKey(apiKey);
 case'make':
 return await this.testMakeKey(apiKey);
 case'zapier':
 return await this.testZapierKey(apiKey);
 case'apify':
 return await this.testApifyKey(apiKey);
 case'stripe':
 return await this.testStripeKey(apiKey);
 default:
 return { success: false, message:`Unknown service: ${service}` };
 }
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Test failed: ${message}` };
 }
 }

 private async testOpenAIKey(apiKey: string): Promise<{ success: boolean; message: string; models?: string[] }> {
 try {
 const response = await axios.get('https://api.openai.com/v1/models', {
 headers: {
'Authorization':`Bearer ${apiKey}`,
 },
 timeout: 5000,
 });

 const models = response.data.data?.map((m: any) => m.id) || [];
 const modelCount = models.length;
 
 return { 
 success: true, 
 message:`OpenAI API key is valid! Found ${modelCount} available models.`,
 models: models 
 };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'OpenAI API key is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`OpenAI test failed: ${error.response?.status} - ${error.response?.statusText}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`OpenAI test failed: ${message}` };
 }
 }

 private async testOpenRouterKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
 headers: {
'Authorization':`Bearer ${apiKey}`,
 },
 timeout: 5000,
 });

 const data = response.data.data || response.data;
 const status = data.status ||'active';
 return { success: true, message:`OpenRouter API key is valid! Status: ${status}` };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'OpenRouter API key is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`OpenRouter test failed: ${error.response?.status}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`OpenRouter test failed: ${message}` };
 }
 }

 private async testBraveKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
 params: { q:'test', count: 1 },
 headers: {
'Accept':'application/json',
'Accept-Encoding':'gzip',
'X-Subscription-Token': apiKey,
 },
 timeout: 10000,
 });

 const resultCount = response.data.web?.results?.length || 0;
 return { success: true, message:`Brave Search API key is valid! Test query returned ${resultCount} result(s).` };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401 || error.response?.status === 403) {
 return { success: false, message:'Brave Search API key is invalid (Unauthorized). Check your key at https://brave.com/search/api/' };
 }
 if (error.response?.status === 429) {
 return { success: false, message:'Brave Search rate limit reached. The key is valid but you have hit the usage limit.' };
 }
 return { success: false, message:`Brave Search test failed: ${error.response?.status} - ${error.response?.statusText || error.message}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Brave Search test failed: ${message}` };
 }
 }

 private async testClaudeKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.post(
'https://api.anthropic.com/v1/messages',
 {
 model:'claude-3-haiku-20240307',
 max_tokens: 10,
 messages: [{ role:'user', content:'Say "ok"' }],
 },
 {
 headers: {
'x-api-key': apiKey,
'anthropic-version':'2023-06-01',
'Content-Type':'application/json',
 },
 timeout: 15000,
 },
 );

 return { success: true, message:'Claude API key is valid!' };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'Claude API key is invalid (401 Unauthorized)' };
 }
 if (error.response?.status === 403) {
 return { success: false, message:'Claude API key is forbidden (403). Check permissions.' };
 }
 return { success: false, message:`Claude test failed: ${error.response?.status} - ${error.response?.statusText || error.message}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Claude test failed: ${message}` };
 }
 }

 private async testMakeKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://www.make.com/api/v1/validate-token', {
 headers: {
'Authorization':`Bearer ${apiKey}`,
 },
 timeout: 5000,
 });

 return { success: true, message:`Make.com API key is valid!` };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'Make.com API key is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`Make.com test failed: ${error.response?.status}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Make.com test failed: ${message}` };
 }
 }

 private async testZapierKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://zapier.com/api/v1/user', {
 headers: {
'X-API-Key': apiKey,
 },
 timeout: 5000,
 });

 const data = response.data.data || response.data;
 return { success: true, message:`Zapier API key is valid!` };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'Zapier API key is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`Zapier test failed: ${error.response?.status}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Zapier test failed: ${message}` };
 }
 }

 private async testApifyKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://api.apify.com/v2/users/me', {
 headers: {
'Authorization':`Bearer ${apiKey}`,
 },
 timeout: 5000,
 });

 const username = response.data?.data?.username ||'unknown';
 return { success: true, message:`Apify API token is valid! Connected as: ${username}` };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'Apify API token is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`Apify test failed: ${error.response?.status} - ${error.response?.statusText}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Apify test failed: ${message}` };
 }
 }

 private async testStripeKey(apiKey: string): Promise<{ success: boolean; message: string }> {
 try {
 const response = await axios.get('https://api.stripe.com/v1/balance', {
 headers: {'Authorization':`Bearer ${apiKey}` },
 timeout: 5000,
 });
 const available = response.data.available || [];
 const balanceStr = available
 .map((b: any) =>`${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`)
 .join(',');
 return {
 success: true,
 message:`Stripe connected! ${available.length > 0 ?`Balance: ${balanceStr}` :'Account verified.'}`,
 };
 } catch (error) {
 if (axios.isAxiosError(error)) {
 if (error.response?.status === 401) {
 return { success: false, message:'Stripe API key is invalid (401 Unauthorized)' };
 }
 return { success: false, message:`Stripe test failed: ${error.response?.status} - ${error.response?.statusText}` };
 }
 const message = error instanceof Error ? error.message : String(error);
 return { success: false, message:`Stripe test failed: ${message}` };
 }
 }

 // Sync versions for use in other services
 loadSettingsSync(): any | null {
 try {
 return this.db.readSync();
 } catch {
 return null;
 }
 }

 decryptSync(text: string): string {
 return this.cryptoService.decrypt(text);
 }

 encryptSync(text: string): string {
 return this.cryptoService.encrypt(text);
 }
}
