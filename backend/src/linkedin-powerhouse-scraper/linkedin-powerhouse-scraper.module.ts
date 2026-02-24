import { Module } from '@nestjs/common';
import { LinkedinPowerhouseScraperController } from './linkedin-powerhouse-scraper.controller';
import { LinkedinPowerhouseScraperService } from './linkedin-powerhouse-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [LinkedinPowerhouseScraperController],
  providers: [LinkedinPowerhouseScraperService],
  exports: [LinkedinPowerhouseScraperService],
})
export class LinkedinPowerhouseScraperModule {}
