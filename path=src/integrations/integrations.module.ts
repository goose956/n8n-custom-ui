import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  imports: [],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, DatabaseService, CryptoService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}