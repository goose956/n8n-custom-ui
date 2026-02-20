import { Module } from '@nestjs/common';
import { YoutubeContentAppScraperController } from './youtube-content-app-scraper.controller';
import { YoutubeContentAppScraperService } from './youtube-content-app-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [YoutubeContentAppScraperController],
  providers: [YoutubeContentAppScraperService],
  exports: [YoutubeContentAppScraperService],
})
export class YoutubeContentAppScraperModule {}
