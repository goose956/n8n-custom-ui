import { Module } from '@nestjs/common';
import { AnalyticsApiController } from './analytics-api.controller';
import { AnalyticsApiService } from './analytics-api.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [AnalyticsApiController],
  providers: [AnalyticsApiService, DatabaseService, CryptoService],
  exports: [AnalyticsApiService]
})
export class AnalyticsApiModule {}
