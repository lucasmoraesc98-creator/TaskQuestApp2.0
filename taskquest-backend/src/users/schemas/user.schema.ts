import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  xp: number;

  @Prop({
    type: {
      morningPerson: { type: Boolean, default: true },
      likesExercise: { type: Boolean, default: true },
      worksFromHome: { type: Boolean, default: false },
    },
    default: {},
  })
  preferences: {
    morningPerson: boolean;
    likesExercise: boolean;
    worksFromHome: boolean;
  };

  @Prop({ type: [String], default: [] })
  goals: string[];

  @Prop({ type: [String], default: [] })
  challenges: string[];

  @Prop({ default: 'balanced' })
  productivityStyle: string;

  @Prop({ type: Date, default: null })
  lastAnalysis: Date;

  @Prop({ default: Date.now })
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);