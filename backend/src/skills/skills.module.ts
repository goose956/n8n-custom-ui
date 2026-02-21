import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillRunnerService } from './skill-runner.service';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillRunnerService, PromptBuilderService],
  exports: [SkillRunnerService],
})
export class SkillsModule {}
