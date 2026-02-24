import { Module } from '@nestjs/common';
import { ScheduledWorkflowsController } from './scheduled-workflows.controller';
import { ScheduledWorkflowsService } from './scheduled-workflows.service';

@Module({
  controllers: [ScheduledWorkflowsController],
  providers: [ScheduledWorkflowsService],
  exports: [ScheduledWorkflowsService],
})
export class ScheduledWorkflowsModule {}
