import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// SOLUÇÃO ALTERNATIVA: Definir _id explicitamente
export interface ProgressDocument extends Progress, Document<Types.ObjectId> {
  _id: Types.ObjectId;
}

@Schema()
export class DailyStat {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true, default: 0 })
  xpEarned: number;

  @Prop({ required: true, default: 0 })
  tasksCompleted: number;
}

@Schema()
export class Progress {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, default: 1 })
  level: number;

  @Prop({ required: true, default: 0 })
  xp: number;

  @Prop({ required: true, default: 0 })
  totalXP: number;

  @Prop({ required: true, default: 0 })
  currentStreak: number;

  @Prop({ required: true, default: 0 })
  longestStreak: number;

  @Prop({ required: true, default: 0 })
  tasksCompleted: number;

  @Prop({ required: true, default: 0 })
  dailyXP: number;

  @Prop({ required: true, default: Date.now })
  lastActivity: Date;

  @Prop({ type: [DailyStat], default: [] })
  dailyStats: DailyStat[];
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);