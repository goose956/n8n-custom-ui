import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AppsModule } from './apps/apps.module';
import { PagesModule } from './pages/pages.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [HealthModule, SettingsModule, WorkflowsModule, ApiKeysModule, AppsModule, PagesModule, ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
