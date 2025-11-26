import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TasksService } from '../tasks/tasks.service'; // CORREÇÃO: Importar TasksService
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './schemas/task.schema';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    ProgressModule,
  ],
  controllers: [TasksController],
  providers: [TasksService], // CORREÇÃO: Usar TasksService
  exports: [TasksService], // CORREÇÃO: Usar TasksService
})
export class TasksModule {}