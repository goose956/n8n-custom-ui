import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, DatabaseService, CryptoService],
  exports: [LeadsService],
})
export class LeadsModule {}