import { Module } from '@nestjs/common';
import { ThumbnailsController } from './thumbnails.controller';
import { ThumbnailsService } from './thumbnails.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  controllers: [ThumbnailsController],
  providers: [ThumbnailsService, DatabaseService],
})
export class ThumbnailsModule {}
