import { Module } from '@nestjs/common';
import { ContentSourcesController } from './content-sources.controller';
import { ContentSourcesService } from './content-sources.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  imports: [],
  controllers: [ContentSourcesController],
  providers: [
    ContentSourcesService,
    DatabaseService,
    CryptoService,
  ],
  exports: [ContentSourcesService],
})
export class ContentSourcesModule {}
