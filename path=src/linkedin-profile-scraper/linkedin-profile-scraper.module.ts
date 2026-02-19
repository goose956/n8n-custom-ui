import { Module } from '@nestjs/common';
import { LinkedinProfileScraperController } from './linkedin-profile-scraper.controller';
import { LinkedinProfileScraperService } from './linkedin-profile-scraper.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  imports: [],
  controllers: [LinkedinProfileScraperController],
  providers: [
    LinkedinProfileScraperService,
    DatabaseService,
    CryptoService,
  ],
  exports: [LinkedinProfileScraperService],
})
export class LinkedinProfileScraperModule {}