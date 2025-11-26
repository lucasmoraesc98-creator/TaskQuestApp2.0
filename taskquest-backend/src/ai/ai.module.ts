import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AIController } from './ai.controller';
import { UnifiedAIService } from './unified-ai.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { GoalPlan, GoalPlanSchema } from '../goals/schemas/goal-plan.schema';
import { DeepSeekAIService } from './deepseek-ai.service'; // ✅ Importe
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: GoalPlan.name, schema: GoalPlanSchema }
    ]),
  ],
  controllers: [AIController],
  providers: [UnifiedAIService, DeepSeekAIService], // ✅ APENAS UnifiedAIService
  exports: [UnifiedAIService, DeepSeekAIService],
})
export class AIModule {}