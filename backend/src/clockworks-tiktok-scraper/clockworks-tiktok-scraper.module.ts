import { Module } from '@nestjs/common';
import { ClockworksTiktokScraperService } from './clockworks-tiktok-scraper.service';
import { ClockworksTiktokScraperController } from './clockworks-tiktok-scraper.controller';

@Module({
  controllers: [ClockworksTiktokScraperController],
  providers: [ClockworksTiktokScraperService],
})
export class ClockworksTiktokScraperModule {}