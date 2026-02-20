import { Module } from '@nestjs/common';
import { TranscriptionsController } from './transcriptions.controller';
import { TranscriptionsService } from './transcriptions.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService, DatabaseService],
})
export class TranscriptionsModule {}
