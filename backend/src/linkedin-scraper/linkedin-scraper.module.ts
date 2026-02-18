import { Module } from '@nestjs/common';
import { LinkedinScraperService } from './linkedin-scraper.service';
import { LinkedinScraperController } from './linkedin-scraper.controller';

@Module({
  controllers: [LinkedinScraperController],
  providers: [LinkedinScraperService],
  exports: [LinkedinScraperService],
})
export class LinkedinScraperModule {}