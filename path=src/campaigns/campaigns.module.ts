import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, DatabaseService, CryptoService],
  exports: [CampaignsService],
})
export class CampaignsModule {}