import { Module } from '@nestjs/common';
import { ChatAgentsController } from './chat-agents.controller';
import { ChatAgentsService } from './chat-agents.service';
import { SharedModule } from '../shared/shared.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [SharedModule, KnowledgeBaseModule],
  controllers: [ChatAgentsController],
  providers: [ChatAgentsService],
  exports: [ChatAgentsService],
})
export class ChatAgentsModule {}
