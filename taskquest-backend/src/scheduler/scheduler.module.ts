import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [GoalsModule, TasksModule], // ✅ GoalsModule fornece GoalToTaskConverterService
  providers: [SchedulerService],
})
export class SchedulerModule {}