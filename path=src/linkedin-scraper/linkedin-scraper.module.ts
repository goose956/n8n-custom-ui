import { Module } from '@nestjs/common';
import { LinkedinScraperController } from './linkedin-scraper.controller';
import { LinkedinScraperService } from './linkedin-scraper.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  imports: [],
  controllers: [LinkedinScraperController],
  providers: [
    LinkedinScraperService,
    DatabaseService,
    CryptoService
  ],
  exports: [LinkedinScraperService]
})
export class LinkedinScraperModule {}