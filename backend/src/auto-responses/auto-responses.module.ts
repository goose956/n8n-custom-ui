import { Module } from '@nestjs/common';
import { AutoResponsesController } from './auto-responses.controller';
import { AutoResponsesService } from './auto-responses.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [AutoResponsesController],
  providers: [AutoResponsesService, DatabaseService, CryptoService],
  exports: [AutoResponsesService],
})
export class AutoResponsesModule {}