import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowValidationService } from './workflow-validation.service';
import { WorkflowConfigService } from './workflow-config.service';
import { SettingsModule } from '../settings/settings.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [SettingsModule, ApiKeysModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowValidationService, WorkflowConfigService],
})
export class WorkflowsModule {}
