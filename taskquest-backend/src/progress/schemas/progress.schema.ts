import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Progress extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 0 })
  completedToday: number;

  @Prop({ default: 0 })
  totalCompleted: number;

  @Prop({ default: 0 })
  dailyXP: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop({ default: Date.now })
  lastActive: Date;

  @Prop({ type: Date })
  lastReset: Date;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);