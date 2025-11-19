import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Progress, ProgressSchema } from '../progress/schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: User.name, schema: UserSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}