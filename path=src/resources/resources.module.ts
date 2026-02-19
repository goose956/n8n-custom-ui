import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  imports: [],
  controllers: [ResourcesController],
  providers: [ResourcesService, DatabaseService],
  exports: [ResourcesService],
})
export class ResourcesModule {}