import { Module } from '@nestjs/common';
import { AutoResponseTemplatesController } from './auto-response-templates.controller';
import { AutoResponseTemplatesService } from './auto-response-templates.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [AutoResponseTemplatesController],
  providers: [AutoResponseTemplatesService, DatabaseService, CryptoService],
  exports: [AutoResponseTemplatesService],
})
export class AutoResponseTemplatesModule {}
