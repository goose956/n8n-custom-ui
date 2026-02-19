import { Module } from '@nestjs/common';
import { EngagementReportsController } from './engagement-reports.controller';
import { EngagementReportsService } from './engagement-reports.service';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

@Module({
  controllers: [EngagementReportsController],
  providers: [EngagementReportsService, DatabaseService, CryptoService],
  exports: [EngagementReportsService],
})
export class EngagementReportsModule {}