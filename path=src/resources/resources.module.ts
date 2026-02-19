import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [ResourcesController],
  providers: [
    ResourcesService,
    DatabaseService,
    CryptoService,
  ],
  exports: [ResourcesService],
})
export class ResourcesModule {}