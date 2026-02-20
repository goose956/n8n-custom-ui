import { Injectable } from'@nestjs/common';
import * as fs from'fs';
import axios from'axios';
import { CryptoService } from'../shared/crypto.service';
import { DatabaseService } from'../shared/database.service';
import { AnalyticsService } from'../analytics/analytics.service';

interface ChatRequest {
 message: string;
 apiProvider: string;
 model?: string;
 mode?: string;
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
 private readonly analyticsService: AnalyticsService,
 ) {}

 private getApiKey(provider: string): string | null {
 try {
 const data = this.db.readSync();
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

 private getProgrammerPrompt(pageContent: string): string {
 return`You are a page functionality architect. You add interactive and functional elements to web pages.
You MUST respond with ONLY a valid JSON object -- a partial patch to merge into the page's content_json.
Do NOT return the entire page. Return ONLY the keys being added or modified.

AVAILABLE FUNCTIONAL ELEMENTS you can add:

CONTACT FORM:
{"contact_form": {"headline": "Get In Touch", "subheading": "We'd love to hear from you", "fields": [{"type": "text", "label": "Full Name", "placeholder": "John Doe"}, {"type": "email", "label": "Email", "placeholder": "john@example.com"}, {"type": "textarea", "label": "Message", "placeholder": "Tell us more...", "rows": 4}], "submit_text": "Send Message"}}

NEWSLETTER SIGNUP:
{"newsletter": {"headline": "Stay Updated", "subheading": "Get the latest news and updates", "placeholder": "Enter your email", "button_text": "Subscribe"}}

TESTIMONIALS:
{"testimonials": [{"quote": "Amazing product!", "author": "Jane Smith", "title": "CEO, TechCo", "avatar": ""}]}

FAQ SECTION:
{"faq": [{"question": "How does it work?", "answer": "Simply sign up and..."}], "faq_headline": "Frequently Asked Questions"}

STATISTICS/COUNTERS:
{"stats": [{"value": "10K+", "label": "Active Users"}, {"value": "99.9%", "label": "Uptime"}, {"value": "24/7", "label": "Support"}]}

CALL TO ACTION:
{"cta": {"headline": "Ready to Get Started?", "subheading": "Join thousands of happy customers", "button_text": "Start Free Trial"}}
OR
{"cta_footer": {"headline": "Transform Your Business", "subheading": "Start your journey today", "button_text": "Get Started"}}

NAVIGATION BAR:
{"nav": {"brand": "MyApp", "links": [{"label": "Home"}, {"label": "Features"}, {"label": "Pricing"}, {"label": "Contact"}], "cta": "Sign Up"}}

HERO SECTION:
{"hero": {"badge": "NEW", "headline": "Build Something Amazing", "subheading": "The all-in-one platform for your business", "cta_button": {"text": "Get Started", "secondary_text": "Learn More"}}}

FEATURES GRID:
{"features_section": {"title": "Why Choose Us", "subtitle": "Everything you need", "items": [{"icon": "", "title": "Fast", "description": "Lightning fast performance"}, {"icon": "", "title": "Secure", "description": "Enterprise-grade security"}]}}

COMPARISON TABLE:
{"comparison": {"headline": "How We Compare", "columns": ["Feature", "Us", "Competitor A"], "rows": [["Speed", "[OK]", "[X]"], ["Support", "[OK]", "[OK]"]]}}

SOCIAL PROOF:
{"social_proof": {"title": "Trusted by thousands", "items": [{"metric": "10K+", "label": "Users", "icon": ""}, {"metric": "50M+", "label": "Transactions", "icon": ""}]}}

PRICING PLANS:
{"pricing": {"plans": [{"name": "Starter", "price": "$9/mo", "features": ["5 Projects", "10GB Storage"], "cta_button": "Choose Plan"}, {"name": "Pro", "price": "$29/mo", "badge": "Popular", "highlighted": true, "features": ["Unlimited Projects", "100GB Storage", "Priority Support"], "cta_button": "Choose Plan"}]}}

RULES:
- Return ONLY a valid JSON patch -- no explanation, no markdown, no code fences
- Only include keys being added or modified
- CRITICAL: For arrays, return the COMPLETE array when modifying existing items
- Set a key to null to remove/delete a section
- You can combine multiple sections in one response
- When asked to modify existing content, preserve all existing items and only change what was requested

Current page content for reference:
${pageContent}`;
 }

 async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
 const { message, apiProvider, model, mode, pageContent, pageTitle, pageType } = request;

 const apiKey = this.getApiKey(apiProvider);
 if (!apiKey) {
 return {
 success: false,
 error:`API key for "${apiProvider}" not found or not configured`,
 };
 }

 // Route to appropriate provider
 switch (apiProvider.toLowerCase()) {
 case'openai':
 return this.sendToOpenAI(apiKey, message, model ||'gpt-4', pageContent, pageTitle, pageType, mode);
 case'openrouter':
 return this.sendToOpenRouter(apiKey, message, pageContent, pageTitle, pageType, mode);
 case'make':
 return this.sendToMake(apiKey, message, pageContent, pageTitle, pageType);
 case'zapier':
 return this.sendToZapier(apiKey, message, pageContent, pageTitle, pageType);
 default:
 return {
 success: false,
 error:`Unknown API provider: ${apiProvider}`,
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
 mode?: string,
 ): Promise<ChatResponse> {
 try {
 const startTime = Date.now();
 const systemPrompt = mode ==='programmer' ? this.getProgrammerPrompt(pageContent) :`You are a page content editor. The user will ask you to change something on their page.
You MUST respond with ONLY a valid JSON object containing ONLY the keys/fields that need to change -- a partial patch.
Do NOT return the entire page. Only return the specific keys being modified.
If the user asks to change a headline inside "hero", return {"hero": {"headline": "New Headline"}}.

STYLING RULE: When the user asks to change a visual style (colour, font size, font weight, etc.) of a text field, convert that field into a styled-text object with a "text" key holding the original text and CSS property keys for the styles.
Supported CSS keys: color, fontSize, fontWeight, fontStyle, textDecoration, backgroundColor, textTransform, letterSpacing, opacity.
Examples:
- "make the headline orange" -> {"hero": {"headline": {"text": "Our Story", "color": "orange"}}}
- "make the subheading bold and red" -> {"hero": {"subheading": {"text": "Original text here", "fontWeight": "bold", "color": "red"}}}
- "change the CTA headline font size to 2rem" -> {"cta": {"headline": {"text": "Original text", "fontSize": "2rem"}}}
IMPORTANT: Always preserve the original text value -- only add/change the CSS properties requested. If the field is already a styled-text object, keep existing style keys and only update the ones the user asked to change.
If the user asks to change the TEXT content (not styling), return a plain string as before.

CRITICAL RULE FOR ARRAYS: When modifying an array (e.g. courses, plans, stats, features, items), you MUST return the COMPLETE array with ALL items -- not just the changed one.
For example, if there are 3 courses and the user asks to change the title of the first one, return ALL 3 courses with only the first one's title changed.
If you return only 1 item in an array that originally had 3, the other 2 will be lost.
When the user asks to REMOVE an item from an array, return the COMPLETE array WITHOUT that item.

REMOVAL RULE: When the user asks to remove or delete an entire section/key (e.g. "remove the contact form", "delete the newsletter section"), set that key to null.
Examples:
- "remove the contact form" -> {"contact_form": null}
- "delete the stats section" -> {"stats": null}
- "remove the CTA" -> {"cta": null}
Do NOT set it to an empty object {} -- use null to signal deletion.

Nested objects should include only the changed sub-keys.
Do NOT include any explanation, markdown, or text outside the JSON object.

Current page content for reference:
${pageContent}`;

 const response = await axios.post(
'https://api.openai.com/v1/chat/completions',
 {
 model: model,
 messages: [
 {
 role:'system',
 content: systemPrompt,
 },
 {
 role:'user',
 content: message,
 },
 ],
 temperature: 0.5,
 max_tokens: 1500,
 },
 {
 headers: {
'Authorization':`Bearer ${apiKey}`,
'Content-Type':'application/json',
 },
 timeout: 30000,
 },
 );

 const assistantMessage = response.data.choices?.[0]?.message?.content;
 const tokensIn = response.data.usage?.prompt_tokens || 0;
 const tokensOut = response.data.usage?.completion_tokens || 0;
 await this.trackCost('openai', model, tokensIn, tokensOut, Date.now() - startTime,'chat');
 if (!assistantMessage) {
 return {
 success: false,
 error:'No response from OpenAI',
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
 error:'OpenAI API key is invalid (401 Unauthorized). Check your key in Settings.',
 };
 }
 if (error.response?.status === 429) {
 return {
 success: false,
 error:'OpenAI rate limit reached (429). Please wait a moment and try again, or check your OpenAI billing/plan.',
 };
 }
 if (error.response?.status === 400) {
 const detail = error.response?.data?.error?.message || error.message;
 return {
 success: false,
 error:`OpenAI rejected the request: ${detail}`,
 };
 }
 return {
 success: false,
 error:`OpenAI API error: ${error.response?.status} - ${error.response?.statusText || error.message}`,
 };
 }
 const errorMessage = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 error:`OpenAI request failed: ${errorMessage}`,
 };
 }
 }

 private async sendToOpenRouter(
 apiKey: string,
 message: string,
 pageContent: string,
 pageTitle: string,
 pageType: string,
 mode?: string,
 ): Promise<ChatResponse> {
 try {
 const startTime = Date.now();
 const systemPrompt = mode ==='programmer' ? this.getProgrammerPrompt(pageContent) :`You are a page content editor. The user will ask you to change something on their page.
You MUST respond with ONLY a valid JSON object containing ONLY the keys/fields that need to change -- a partial patch.
Do NOT return the entire page. Only return the specific keys being modified.
If the user asks to change a headline inside "hero", return {"hero": {"headline": "New Headline"}}.

STYLING RULE: When the user asks to change a visual style (colour, font size, font weight, etc.) of a text field, convert that field into a styled-text object with a "text" key holding the original text and CSS property keys for the styles.
Supported CSS keys: color, fontSize, fontWeight, fontStyle, textDecoration, backgroundColor, textTransform, letterSpacing, opacity.
Examples:
- "make the headline orange" -> {"hero": {"headline": {"text": "Our Story", "color": "orange"}}}
- "make the subheading bold and red" -> {"hero": {"subheading": {"text": "Original text here", "fontWeight": "bold", "color": "red"}}}
- "change the CTA headline font size to 2rem" -> {"cta": {"headline": {"text": "Original text", "fontSize": "2rem"}}}
IMPORTANT: Always preserve the original text value -- only add/change the CSS properties requested. If the field is already a styled-text object, keep existing style keys and only update the ones the user asked to change.
If the user asks to change the TEXT content (not styling), return a plain string as before.

CRITICAL RULE FOR ARRAYS: When modifying an array (e.g. courses, plans, stats, features, items), you MUST return the COMPLETE array with ALL items -- not just the changed one.
For example, if there are 3 courses and the user asks to change the title of the first one, return ALL 3 courses with only the first one's title changed.
If you return only 1 item in an array that originally had 3, the other 2 will be lost.
When the user asks to REMOVE an item from an array, return the COMPLETE array WITHOUT that item.

REMOVAL RULE: When the user asks to remove or delete an entire section/key (e.g. "remove the contact form", "delete the newsletter section"), set that key to null.
Examples:
- "remove the contact form" -> {"contact_form": null}
- "delete the stats section" -> {"stats": null}
- "remove the CTA" -> {"cta": null}
Do NOT set it to an empty object {} -- use null to signal deletion.

Nested objects should include only the changed sub-keys.
Do NOT include any explanation, markdown, or text outside the JSON object.

Current page content for reference:
${pageContent}`;

 const response = await axios.post(
'https://openrouter.ai/api/v1/chat/completions',
 {
 model:'google/gemini-2.0-flash-001',
 messages: [
 {
 role:'system',
 content: systemPrompt,
 },
 {
 role:'user',
 content: message,
 },
 ],
 temperature: 0.7,
 },
 {
 headers: {
'Authorization':`Bearer ${apiKey}`,
'Content-Type':'application/json',
'HTTP-Referer':'http://localhost:3000',
'X-Title':'n8n Surface',
 },
 timeout: 30000,
 },
 );

 const assistantMessage = response.data.choices?.[0]?.message?.content;
 const tokensIn = response.data.usage?.prompt_tokens || 0;
 const tokensOut = response.data.usage?.completion_tokens || 0;
 await this.trackCost('openrouter','google/gemini-2.0-flash-001', tokensIn, tokensOut, Date.now() - startTime,'chat');
 if (!assistantMessage) {
 return {
 success: false,
 error:'No response from OpenRouter',
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
 error:'OpenRouter API key is invalid (401 Unauthorized)',
 };
 }
 return {
 success: false,
 error:`OpenRouter API error: ${error.response?.status} - ${error.response?.statusText || error.message}`,
 };
 }
 const errorMessage = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 error:`OpenRouter request failed: ${errorMessage}`,
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
 message:`[Make.com Integration] Received your request for page "${pageTitle}". 
Make.com is primarily used for automation workflows rather than direct chat. 
Please use the OpenAI or OpenRouter integration for AI-powered chat assistance.`,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 error:`Make.com request failed: ${errorMessage}`,
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
 message:`[Zapier Integration] Received your request for page "${pageTitle}". 
Zapier is primarily used for automation workflows rather than direct chat. 
Please use the OpenAI or OpenRouter integration for AI-powered chat assistance.`,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 error:`Zapier request failed: ${errorMessage}`,
 };
 }
 }

 private async trackCost(provider: string, model: string, tokensIn: number, tokensOut: number, duration: number, module: string): Promise<void> {
 const rates: Record<string, [number, number]> = {
'gpt-4o-mini': [0.15, 0.60],'gpt-4o': [2.50, 10.00],'gpt-3.5-turbo': [0.50, 1.50],
'gpt-4': [30.00, 60.00],'google/gemini-2.0-flash-001': [0.10, 0.40],
'anthropic/claude-sonnet-4': [3.00, 15.00],'claude-sonnet-4-20250514': [3.00, 15.00],'openai/gpt-4o': [2.50, 10.00],
 };
 const [inRate, outRate] = rates[model] || [1.00, 3.00];
 const cost = (tokensIn * inRate + tokensOut * outRate) / 1_000_000;
 await this.analyticsService.trackApiUsage({
 provider: provider as any, endpoint:'/chat/completions', model, tokensIn, tokensOut, cost, duration, statusCode: 200, success: true, module,
 }).catch(() => {});
 }
}
