import { Module } from '@nestjs/common';
import { LinkedinAnalyticsScraperController } from './linkedin-analytics-scraper.controller';
import { LinkedinAnalyticsScraperService } from './linkedin-analytics-scraper.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [LinkedinAnalyticsScraperController],
  providers: [
    LinkedinAnalyticsScraperService,
    DatabaseService,
    CryptoService
  ],
  exports: [
    LinkedinAnalyticsScraperService,
    LinkedinAnalyticsScraperController
  ]
})
export class LinkedinAnalyticsScraperModule {}