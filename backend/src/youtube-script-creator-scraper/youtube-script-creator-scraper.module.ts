import { Module } from '@nestjs/common';
import { YoutubeScriptCreatorScraperController } from './youtube-script-creator-scraper.controller';
import { YoutubeScriptCreatorScraperService } from './youtube-script-creator-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [YoutubeScriptCreatorScraperController],
  providers: [YoutubeScriptCreatorScraperService],
  exports: [YoutubeScriptCreatorScraperService],
})
export class YoutubeScriptCreatorScraperModule {}
