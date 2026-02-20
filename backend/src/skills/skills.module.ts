import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillRunnerService } from './skill-runner.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillRunnerService],
  exports: [SkillRunnerService],
})
export class SkillsModule {}
