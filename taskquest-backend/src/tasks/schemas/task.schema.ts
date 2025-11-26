import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop()
  description?: string;

  @Prop({ default: 20 })
  xp: number;

  @Prop({ 
    type: String, 
    enum: [
      'health', 
      'custom', 
      'basic', 
      'ai_suggestion',
      'goal_extreme',
      'goal_hard', 
      'goal_medium',
      'goal_easy',
      'goal_daily',
      'plan_review'
    ], 
    default: 'custom' 
  })
  type: string;

  @Prop({ default: 'medium' })
  priority: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true })
  date: string;

  @Prop()
  reason?: string;

  @Prop({ type: Object, default: {} })
  aiData?: {
    deadline?: string;
    priority?: string;
    estimatedMinutes?: number;
    easyGoalId?: string;
    mediumGoalId?: string;
    hardGoalId?: string;
    extremeGoalId?: string;
    goalType?: 'easy' | 'medium' | 'hard' | 'extreme' | 'review';
    fromAnnualPlan?: boolean;
    suggestionType?: string;
  };
}

export const TaskSchema = SchemaFactory.createForClass(Task);