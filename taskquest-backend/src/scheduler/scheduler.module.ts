import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ProgressModule } from '../progress/progress.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ProgressModule,
    TasksModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}