import { Module } from'@nestjs/common';
import { PageAgentService } from'./page-agent.service';
import { PageAgentController } from'./page-agent.controller';

@Module({
 controllers: [PageAgentController],
 providers: [PageAgentService],
})
export class PageAgentModule {}
