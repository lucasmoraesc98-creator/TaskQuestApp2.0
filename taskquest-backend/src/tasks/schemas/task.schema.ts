import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ required: true })
  xp: number;

  @Prop({ required: true })
  type: string;

  @Prop({ default: '' })
  reason: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop()
  completedAt: Date;

  // Campos automáticos do timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);