import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { GoalPlan, GoalPlanSchema } from './schemas/goal-plan.schema';
import { AuthModule } from '../auth/auth.module';
import { DeepSeekAIService } from '../ai/deepseek-ai.service';
import { TasksModule } from '../tasks/tasks.module';
import { ProgressModule } from '../progress/progress.module';
import { GoalToTaskConverterService } from './goal-to-task.converter.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema'; // ✅ Importação do Task

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: GoalPlan.name, schema: GoalPlanSchema },
      { name: Task.name, schema: TaskSchema } // ✅ Já estava correto
    ]),
    TasksModule,
    ProgressModule,
    AuthModule,
  ],
  controllers: [GoalsController],
  providers: [
    GoalsService, 
    DeepSeekAIService, 
    GoalToTaskConverterService
  ],
  exports: [
    GoalsService, 
    MongooseModule,
    GoalToTaskConverterService
  ],
})
export class GoalsModule {}