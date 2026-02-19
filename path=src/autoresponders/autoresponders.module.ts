import { Module } from '@nestjs/common';
import { AutorespondersController } from './autoresponders.controller';
import { AutorespondersService } from './autoresponders.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [AutorespondersController],
  providers: [AutorespondersService, DatabaseService, CryptoService],
  exports: [AutorespondersService],
})
export class AutorespondersModule {}