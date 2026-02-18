import { LinkedinScraperModule } from'./linkedin-scraper/linkedin-scraper.module';
import { Module } from'@nestjs/common';
import { SharedModule } from'./shared/shared.module';
import { SettingsModule } from'./settings/settings.module';
import { HealthModule } from'./health/health.module';
import { WorkflowsModule } from'./workflows/workflows.module';
import { ApiKeysModule } from'./api-keys/api-keys.module';
import { AppsModule } from'./apps/apps.module';
import { PagesModule } from'./pages/pages.module';
import { ChatModule } from'./chat/chat.module';
import { AnalyticsModule } from'./analytics/analytics.module';
import { PageAgentModule } from'./page-agent/page-agent.module';
import { N8nBuilderModule } from'./n8n-builder/n8n-builder.module';
import { AppPlannerModule } from'./app-planner/app-planner.module';
import { BlogModule } from'./blog/blog.module';
import { ResearchModule } from'./research/research.module';
import { ProgrammerAgentModule } from'./programmer-agent/programmer-agent.module';
import { SocialMonitorModule } from'./social-monitor/social-monitor.module';
import { StripeModule } from'./stripe/stripe.module';
import { PreviewModule } from'./preview/preview.module';
import { FunnelsModule } from'./funnels/funnels.module';
import { MembersModule } from'./members/members.module';

@Module({
 imports: [
 LinkedinScraperModule,SharedModule, HealthModule, SettingsModule, WorkflowsModule, ApiKeysModule, AppsModule, PagesModule, ChatModule, AnalyticsModule, PageAgentModule, N8nBuilderModule, AppPlannerModule, BlogModule, ResearchModule, ProgrammerAgentModule, SocialMonitorModule, StripeModule, PreviewModule, FunnelsModule, MembersModule],
 controllers: [],
 providers: [],
})
export class AppModule {}
