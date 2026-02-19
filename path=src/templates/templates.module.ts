import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, DatabaseService],
  exports: [TemplatesService],
})
export class TemplatesModule {}