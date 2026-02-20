import { Module } from '@nestjs/common';
import { YoutubeAutomaterScraperController } from './youtube-automater-scraper.controller';
import { YoutubeAutomaterScraperService } from './youtube-automater-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [YoutubeAutomaterScraperController],
  providers: [YoutubeAutomaterScraperService],
  exports: [YoutubeAutomaterScraperService],
})
export class YoutubeAutomaterScraperModule {}
