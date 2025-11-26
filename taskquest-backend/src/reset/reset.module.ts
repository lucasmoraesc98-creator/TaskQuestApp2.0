import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResetService } from './reset.service';
import { ResetController } from './reset.controller';
import { GoalPlan, GoalPlanSchema } from '../goals/schemas/goal-plan.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoalPlan.name, schema: GoalPlanSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: User.name, schema: UserSchema }
    ]),
     AuthModule,
  ],
  providers: [ResetService],
  controllers: [ResetController],
  exports: [ResetService]
})
export class ResetModule {}