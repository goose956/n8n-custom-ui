import { Global, Module } from'@nestjs/common';
import { APP_INTERCEPTOR } from'@nestjs/core';
import { AnalyticsService } from'./analytics.service';
import { AnalyticsController } from'./analytics.controller';
import { ContactController } from'./contact.controller';
import { ErrorLoggingInterceptor } from'./error-logging.interceptor';

@Global()
@Module({
 providers: [
 AnalyticsService,
 {
 provide: APP_INTERCEPTOR,
 useClass: ErrorLoggingInterceptor,
 },
 ],
 controllers: [AnalyticsController, ContactController],
 exports: [AnalyticsService],
})
export class AnalyticsModule {}
