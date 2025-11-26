// taskquest-backend/src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './schemas/task.schema';
import { ProgressModule } from '../progress/progress.module';
import { DailyTasksService } from './daily-tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    ProgressModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, DailyTasksService],
  exports: [TasksService, DailyTasksService],
})
export class TasksModule {}