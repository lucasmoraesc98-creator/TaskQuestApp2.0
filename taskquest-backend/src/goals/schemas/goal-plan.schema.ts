import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GoalPlanDocument = GoalPlan & Document;

class Goal {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  category?: string;

  @Prop({ required: true })
  deadline: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 0 })
  xpValue: number;

  // Para hard goals
  @Prop()
  hardGoalId?: string;

  // Para medium goals  
  @Prop()
  mediumGoalId?: string;
}

class DailyTask {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  easyGoalId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: 100 })
  xpValue: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  completedAt?: Date;
}

@Schema({ timestamps: true })
export class GoalPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  vision: string;

  @Prop({ type: [Goal] })
  hardGoals: Goal[];

  @Prop({ type: [Goal] })
  mediumGoals: Goal[];

  @Prop({ type: [Goal] })
  easyGoals: Goal[];

  @Prop({ type: [DailyTask] })
  dailyTasks: DailyTask[];

  @Prop({ default: 0 })
  overallProgress: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop({ default: () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }})
  endDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const GoalPlanSchema = SchemaFactory.createForClass(GoalPlan);