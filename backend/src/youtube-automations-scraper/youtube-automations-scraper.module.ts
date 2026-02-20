import { Module } from '@nestjs/common';
import { YoutubeAutomationsScraperController } from './youtube-automations-scraper.controller';
import { YoutubeAutomationsScraperService } from './youtube-automations-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [YoutubeAutomationsScraperController],
  providers: [YoutubeAutomationsScraperService],
  exports: [YoutubeAutomationsScraperService],
})
export class YoutubeAutomationsScraperModule {}
