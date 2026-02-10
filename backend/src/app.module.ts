import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { ApiKeysModule } from './api-keys/api-keys.module';

@Module({
  imports: [HealthModule, SettingsModule, WorkflowsModule, ApiKeysModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
