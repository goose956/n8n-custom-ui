import { Module } from '@nestjs/common';
import { TwitterAutomationAppScraperController } from './twitter-automation-app-scraper.controller';
import { TwitterAutomationAppScraperService } from './twitter-automation-app-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TwitterAutomationAppScraperController],
  providers: [TwitterAutomationAppScraperService],
  exports: [TwitterAutomationAppScraperService],
})
export class TwitterAutomationAppScraperModule {}
