import { Module } from '@nestjs/common';
import { ProgrammerAgentService } from './programmer-agent.service';
import { ProgrammerAgentController } from './programmer-agent.controller';
import { DocAgentService } from './doc-agent.service';
import { DocAgentController } from './doc-agent.controller';
import { TestAgentService } from './test-agent.service';

@Module({
  controllers: [ProgrammerAgentController, DocAgentController],
  providers: [ProgrammerAgentService, DocAgentService, TestAgentService],
  exports: [DocAgentService, TestAgentService],
})
export class ProgrammerAgentModule {}
