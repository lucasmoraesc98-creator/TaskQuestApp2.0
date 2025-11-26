import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { GoalPlan, GoalPlanSchema } from './schemas/goal-plan.schema';
import { SimpleAIService } from '../ai/simple-ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GoalPlan.name, schema: GoalPlanSchema }]),
    HttpModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService, SimpleAIService],
  exports: [GoalsService],
})
export class GoalsModule {}