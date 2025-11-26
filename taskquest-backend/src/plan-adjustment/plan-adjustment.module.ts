import { Module } from '@nestjs/common';
import { PlanAdjustmentController } from './plan-adjustment.controller';
import { PlanAdjustmentService } from './plan-adjustment.service';
import { GoalsModule } from '../goals/goals.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [GoalsModule, AIModule],
  controllers: [PlanAdjustmentController],
  providers: [PlanAdjustmentService],
  exports: [PlanAdjustmentService],
})
export class PlanAdjustmentModule {}