import { Module } from '@nestjs/common';
import { AppPlannerService } from './app-planner.service';
import { AppPlannerController } from './app-planner.controller';

@Module({
  controllers: [AppPlannerController],
  providers: [AppPlannerService],
})
export class AppPlannerModule {}
