import { Injectable } from'@nestjs/common';
import { promises as fs } from'fs';
import * as fsSync from'fs';
import { DatabaseService } from'../shared/database.service';
import { CryptoService } from'../shared/crypto.service';
import axios from'axios';

export interface StripeProduct {
 id: string;
 app_id: number;
 name: string;
 description: string;
 stripe_product_id?: string;
 prices: StripePrice[];
 created_at: string;
 updated_at: string;
}

export interface StripePrice {
 id: string;
 amount: number; // in pence/cents
 currency: string; //'gbp','usd', etc.
 interval?: string; //'month','year', or null for one-time
 label: string; // e.g. "Monthly", "Yearly", "One-time"
 stripe_price_id?: string;
}

export interface StripeCustomer {
 id: string;
 app_id: number;
 email: string;
 stripe_customer_id: string;
 created_at: string;
}

export interface StripePayment {
 id: string;
 app_id: number;
 product_id: string;
 price_id: string;
 customer_email: string;
 stripe_session_id: string;
 stripe_payment_intent?: string;
 status:'pending' |'completed' |'failed' |'refunded';
 amount: number;
 currency: string;
 created_at: string;
}

@Injectable()
export class StripeService {
 constructor(
 private readonly db: DatabaseService,
 private readonly cryptoService: CryptoService,
 ) {}

 // --- Helpers ------------------------------------------------------

 private async getStripeKey(): Promise<string | null> {
 try {
 if (!this.db.exists()) return null;
 const data = JSON.parse(fsSync.readFileSync(this.db.dbPath,'utf-8'));
 const keyEntry = (data.apiKeys || []).find((k: any) => k.name ==='stripe');
 if (!keyEntry) return null;
 return this.cryptoService.decrypt(keyEntry.value);
 } catch {
 return null;
 }
 }

 private async readDatabase(): Promise<any> {
 try {
 const data = await fs.readFile(this.db.dbPath,'utf-8');
 return JSON.parse(data);
 } catch {
 return {};
 }
 }

 private async writeDatabase(data: any): Promise<void> {
 await fs.writeFile(this.db.dbPath, JSON.stringify(data, null, 2));
 }

 // --- Products & Prices -------------------------------------------

 async getProducts(appId?: number): Promise<{ success: boolean; data: StripeProduct[]; message: string }> {
 const db = await this.readDatabase();
 let products: StripeProduct[] = db.stripe_products || [];
 if (appId) {
 products = products.filter(p => p.app_id === appId);
 }
 return { success: true, data: products, message:`Found ${products.length} products` };
 }

 async createProduct(appId: number, name: string, description: string, prices: StripePrice[]): Promise<{ success: boolean; data?: StripeProduct; message: string }> {
 const db = await this.readDatabase();
 if (!db.stripe_products) db.stripe_products = [];

 const product: StripeProduct = {
 id:`prod_${Date.now()}`,
 app_id: appId,
 name,
 description,
 prices: prices.map((p, i) => ({
 ...p,
 id: p.id ||`price_${Date.now()}_${i}`,
 })),
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 };

 // Sync to Stripe if key is configured
 const stripeKey = await this.getStripeKey();
 if (stripeKey) {
 try {
 const stripeProduct = await this.createStripeProduct(stripeKey, name, description);
 product.stripe_product_id = stripeProduct.id;

 // Create prices in Stripe
 for (const price of product.prices) {
 const stripePrice = await this.createStripePrice(stripeKey, stripeProduct.id, price);
 price.stripe_price_id = stripePrice.id;
 }
 } catch (err) {
 console.error('Failed to sync product to Stripe:', err);
 // Still save locally even if Stripe sync fails
 }
 }

 db.stripe_products.push(product);
 await this.writeDatabase(db);
 return { success: true, data: product, message:'Product created' };
 }

 async updateProduct(productId: string, updates: Partial<StripeProduct>): Promise<{ success: boolean; data?: StripeProduct; message: string }> {
 const db = await this.readDatabase();
 if (!db.stripe_products) return { success: false, message:'No products found' };

 const idx = db.stripe_products.findIndex((p: StripeProduct) => p.id === productId);
 if (idx === -1) return { success: false, message:'Product not found' };

 const product = db.stripe_products[idx];
 if (updates.name !== undefined) product.name = updates.name;
 if (updates.description !== undefined) product.description = updates.description;
 if (updates.prices !== undefined) product.prices = updates.prices;
 product.updated_at = new Date().toISOString();

 db.stripe_products[idx] = product;
 await this.writeDatabase(db);
 return { success: true, data: product, message:'Product updated' };
 }

 async deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
 const db = await this.readDatabase();
 if (!db.stripe_products) return { success: false, message:'No products found' };

 const initialLength = db.stripe_products.length;
 db.stripe_products = db.stripe_products.filter((p: StripeProduct) => p.id !== productId);

 if (db.stripe_products.length === initialLength) {
 return { success: false, message:'Product not found' };
 }

 await this.writeDatabase(db);
 return { success: true, message:'Product deleted' };
 }

 // --- Checkout Sessions ------------------------------------------

 async createCheckoutSession(
 appId: number,
 priceId: string,
 successUrl: string,
 cancelUrl: string,
 customerEmail?: string,
 ): Promise<{ success: boolean; url?: string; sessionId?: string; message: string }> {
 const stripeKey = await this.getStripeKey();
 if (!stripeKey) {
 return { success: false, message:'Stripe API key not configured. Add it in Settings.' };
 }

 // Find the product/price
 const db = await this.readDatabase();
 const products: StripeProduct[] = db.stripe_products || [];
 let targetPrice: StripePrice | null = null;
 let targetProduct: StripeProduct | null = null;

 for (const product of products) {
 if (product.app_id !== appId) continue;
 const found = product.prices.find(p => p.id === priceId);
 if (found) {
 targetPrice = found;
 targetProduct = product;
 break;
 }
 }

 if (!targetPrice || !targetProduct) {
 return { success: false, message:'Price not found' };
 }

 // If no Stripe price ID yet, create one on the fly
 if (!targetPrice.stripe_price_id) {
 try {
 if (!targetProduct.stripe_product_id) {
 const sp = await this.createStripeProduct(stripeKey, targetProduct.name, targetProduct.description);
 targetProduct.stripe_product_id = sp.id;
 }
 const stripePrice = await this.createStripePrice(stripeKey, targetProduct.stripe_product_id!, targetPrice);
 targetPrice.stripe_price_id = stripePrice.id;
 await this.writeDatabase(db);
 } catch (err: any) {
 return { success: false, message:`Failed to create Stripe price: ${err.message}` };
 }
 }

 try {
 const params: any = {
'mode': targetPrice.interval ?'subscription' :'payment',
'line_items[0][price]': targetPrice.stripe_price_id!,
'line_items[0][quantity]':'1',
'success_url': successUrl,
'cancel_url': cancelUrl,
 };

 if (customerEmail) {
 params['customer_email'] = customerEmail;
 }

 const response = await axios.post(
'https://api.stripe.com/v1/checkout/sessions',
 new URLSearchParams(params).toString(),
 {
 headers: {
'Authorization':`Bearer ${stripeKey}`,
'Content-Type':'application/x-www-form-urlencoded',
 },
 timeout: 15000,
 },
 );

 // Store payment record
 if (!db.stripe_payments) db.stripe_payments = [];
 const payment: StripePayment = {
 id:`pay_${Date.now()}`,
 app_id: appId,
 product_id: targetProduct.id,
 price_id: priceId,
 customer_email: customerEmail ||'',
 stripe_session_id: response.data.id,
 status:'pending',
 amount: targetPrice.amount,
 currency: targetPrice.currency,
 created_at: new Date().toISOString(),
 };
 db.stripe_payments.push(payment);
 await this.writeDatabase(db);

 return {
 success: true,
 url: response.data.url,
 sessionId: response.data.id,
 message:'Checkout session created',
 };
 } catch (err: any) {
 const detail = err?.response?.data?.error?.message || err.message;
 return { success: false, message:`Stripe checkout failed: ${detail}` };
 }
 }

 // --- Webhooks -----------------------------------------------------

 async handleWebhook(event: any): Promise<{ success: boolean; message: string }> {
 try {
 const db = await this.readDatabase();
 if (!db.stripe_payments) db.stripe_payments = [];

 switch (event.type) {
 case'checkout.session.completed': {
 const session = event.data.object;
 const payment = db.stripe_payments.find(
 (p: StripePayment) => p.stripe_session_id === session.id,
 );
 if (payment) {
 payment.status ='completed';
 payment.stripe_payment_intent = session.payment_intent;
 } else {
 // Payment created externally, record it
 db.stripe_payments.push({
 id:`pay_${Date.now()}`,
 app_id: 0,
 product_id:'',
 price_id:'',
 customer_email: session.customer_details?.email ||'',
 stripe_session_id: session.id,
 stripe_payment_intent: session.payment_intent,
 status:'completed',
 amount: session.amount_total,
 currency: session.currency,
 created_at: new Date().toISOString(),
 });
 }
 break;
 }
 case'payment_intent.payment_failed': {
 const intent = event.data.object;
 const payment = db.stripe_payments.find(
 (p: StripePayment) => p.stripe_payment_intent === intent.id,
 );
 if (payment) {
 payment.status ='failed';
 }
 break;
 }
 }

 await this.writeDatabase(db);
 return { success: true, message:`Webhook ${event.type} processed` };
 } catch (err: any) {
 return { success: false, message:`Webhook error: ${err.message}` };
 }
 }

 // --- Payments -----------------------------------------------------

 async getPayments(appId?: number): Promise<{ success: boolean; data: StripePayment[]; message: string }> {
 const db = await this.readDatabase();
 let payments: StripePayment[] = db.stripe_payments || [];
 if (appId) {
 payments = payments.filter(p => p.app_id === appId);
 }
 // Sort newest first
 payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
 return { success: true, data: payments, message:`Found ${payments.length} payments` };
 }

 // --- Stripe API Helpers ------------------------------------------

 private async createStripeProduct(stripeKey: string, name: string, description: string): Promise<any> {
 const response = await axios.post(
'https://api.stripe.com/v1/products',
 new URLSearchParams({ name, description }).toString(),
 {
 headers: {
'Authorization':`Bearer ${stripeKey}`,
'Content-Type':'application/x-www-form-urlencoded',
 },
 timeout: 10000,
 },
 );
 return response.data;
 }

 private async createStripePrice(stripeKey: string, productId: string, price: StripePrice): Promise<any> {
 const params: Record<string, string> = {
'product': productId,
'unit_amount': String(price.amount),
'currency': price.currency,
 };

 if (price.interval) {
 params['recurring[interval]'] = price.interval;
 }

 const response = await axios.post(
'https://api.stripe.com/v1/prices',
 new URLSearchParams(params).toString(),
 {
 headers: {
'Authorization':`Bearer ${stripeKey}`,
'Content-Type':'application/x-www-form-urlencoded',
 },
 timeout: 10000,
 },
 );
 return response.data;
 }

 // --- Test Connection ----------------------------------------------

 async testConnection(): Promise<{ success: boolean; message: string }> {
 const stripeKey = await this.getStripeKey();
 if (!stripeKey) {
 return { success: false, message:'Stripe API key not configured' };
 }

 try {
 const response = await axios.get('https://api.stripe.com/v1/balance', {
 headers: {
'Authorization':`Bearer ${stripeKey}`,
 },
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
 } catch (err: any) {
 if (err?.response?.status === 401) {
 return { success: false, message:'Stripe API key is invalid (401 Unauthorized)' };
 }
 const detail = err?.response?.data?.error?.message || err.message;
 return { success: false, message:`Stripe test failed: ${detail}` };
 }
 }

 // --- Sync products to Stripe --------------------------------------

 async syncToStripe(appId: number): Promise<{ success: boolean; message: string; synced: number }> {
 const stripeKey = await this.getStripeKey();
 if (!stripeKey) {
 return { success: false, message:'Stripe API key not configured', synced: 0 };
 }

 const db = await this.readDatabase();
 const products: StripeProduct[] = (db.stripe_products || []).filter((p: StripeProduct) => p.app_id === appId);
 let synced = 0;

 for (const product of products) {
 try {
 if (!product.stripe_product_id) {
 const sp = await this.createStripeProduct(stripeKey, product.name, product.description);
 product.stripe_product_id = sp.id;
 }

 for (const price of product.prices) {
 if (!price.stripe_price_id) {
 const sp = await this.createStripePrice(stripeKey, product.stripe_product_id!, price);
 price.stripe_price_id = sp.id;
 }
 }

 synced++;
 } catch (err) {
 console.error(`Failed to sync product ${product.name}:`, err);
 }
 }

 await this.writeDatabase(db);
 return { success: true, message:`Synced ${synced} of ${products.length} products to Stripe`, synced };
 }
}
