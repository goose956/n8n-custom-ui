import {
 Controller,
 Get,
 Post,
 Put,
 Delete,
 Body,
 Param,
 Query,
 HttpCode,
 Req,
} from'@nestjs/common';
import { StripeService } from'./stripe.service';
import { Request } from'express';

@Controller('api/stripe')
export class StripeController {
 constructor(private readonly stripeService: StripeService) {}

 // --- Products -----------------------------------------------------

 @Get('products')
 async getProducts(@Query('app_id') appId?: string) {
 return this.stripeService.getProducts(appId ? parseInt(appId) : undefined);
 }

 @Post('products')
 @HttpCode(201)
 async createProduct(
 @Body()
 body: {
 app_id: number;
 name: string;
 description: string;
 prices: Array<{
 id?: string;
 amount: number;
 currency: string;
 interval?: string;
 label: string;
 }>;
 },
 ) {
 return this.stripeService.createProduct(
 body.app_id,
 body.name,
 body.description,
 body.prices.map(p => ({ ...p, id: p.id ||`price_${Date.now()}` })),
 );
 }

 @Put('products/:id')
 async updateProduct(
 @Param('id') id: string,
 @Body() body: any,
 ) {
 return this.stripeService.updateProduct(id, body);
 }

 @Delete('products/:id')
 async deleteProduct(@Param('id') id: string) {
 return this.stripeService.deleteProduct(id);
 }

 // --- Checkout -----------------------------------------------------

 @Post('checkout')
 async createCheckout(
 @Body()
 body: {
 app_id: number;
 price_id: string;
 success_url: string;
 cancel_url: string;
 customer_email?: string;
 },
 ) {
 return this.stripeService.createCheckoutSession(
 body.app_id,
 body.price_id,
 body.success_url,
 body.cancel_url,
 body.customer_email,
 );
 }

 // --- Webhooks -----------------------------------------------------

 @Post('webhook')
 @HttpCode(200)
 async handleWebhook(@Req() req: Request) {
 // In production, verify the webhook signature with Stripe's signing secret
 const event = req.body;
 return this.stripeService.handleWebhook(event);
 }

 // --- Payments -----------------------------------------------------

 @Get('payments')
 async getPayments(@Query('app_id') appId?: string) {
 return this.stripeService.getPayments(appId ? parseInt(appId) : undefined);
 }

 // --- Sync & Test --------------------------------------------------

 @Post('sync/:appId')
 async syncToStripe(@Param('appId') appId: string) {
 return this.stripeService.syncToStripe(parseInt(appId));
 }

 @Get('test')
 async testConnection() {
 return this.stripeService.testConnection();
 }
}
