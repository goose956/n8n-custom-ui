import { Module } from '@nestjs/common';
import { ProgrammerAgentService } from './programmer-agent.service';
import { ProgrammerAgentController } from './programmer-agent.controller';

@Module({
  controllers: [ProgrammerAgentController],
  providers: [ProgrammerAgentService],
})
export class ProgrammerAgentModule {}
