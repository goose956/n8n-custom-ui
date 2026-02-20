import { Module } from '@nestjs/common';
import { OptInPagesController } from './opt-in-pages.controller';
import { OptInPagesService } from './opt-in-pages.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [OptInPagesController],
  providers: [OptInPagesService, DatabaseService, CryptoService],
  exports: [OptInPagesService],
})
export class OptInPagesModule {}
