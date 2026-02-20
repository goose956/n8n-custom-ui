import { Module } from '@nestjs/common';
import { PinterestUpdaterScraperController } from './pinterest-updater-scraper.controller';
import { PinterestUpdaterScraperService } from './pinterest-updater-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PinterestUpdaterScraperController],
  providers: [PinterestUpdaterScraperService],
  exports: [PinterestUpdaterScraperService],
})
export class PinterestUpdaterScraperModule {}
