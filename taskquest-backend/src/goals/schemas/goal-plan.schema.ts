import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GoalPlanDocument = GoalPlan & Document & {
  createdAt: Date;
  updatedAt: Date;
}; // ✅ CORREÇÃO: Adicionar createdAt e updatedAt ao tipo

@Schema({ timestamps: true })
export class GoalPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  vision: string;

  @Prop({ type: [String], default: [] })
  goals: string[];

  @Prop({ type: [String], default: [] })
  challenges: string[];

  @Prop({ type: [String], default: [] })
  tools: string[];

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: 10 })
  hoursPerWeek: number;

  // ✅ NOVA ESTRUTURA: Planos trimestrais
  @Prop({ type: Object, default: {} })
  quarters: {
    [quarter: number]: {
      quarter: number;
      startDate: Date;
      endDate: Date;
      hardGoals: any[];
      mediumGoals: any[];
      easyGoals: any[];
      isCompleted: boolean;
      progress: number;
    };
  };

  @Prop({ default: 1 })
  currentQuarter: number;

  @Prop({ type: [Object], default: [] })
  extremeGoals: any[];

  @Prop({ type: [Object], default: [] })
  hardGoals: any[];

  @Prop({ type: [Object], default: [] })
  mediumGoals: any[];

  @Prop({ type: [Object], default: [] })
  easyGoals: any[];

  @Prop({ type: [Object], default: [] })
  dailyTasks: any[];

  @Prop({ default: 0 })
  overallProgress: number;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isConfirmed: boolean;

  @Prop({ type: Date })
  confirmedAt: Date;

  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ default: '' })
  strategicAnalysis: string;

  @Prop({ default: '' })
  coverageAnalysis: string;

  // ✅ ATUALIZADO: Histórico de feedback com estrutura melhorada
  @Prop({ type: [Object], default: [] })
  feedbackHistory: {
    feedback: string;
    userContext?: string;
    adjustedAt: Date;
    adjustmentsMade: string[];
    previousState?: any;
  }[];

  @Prop({ default: false })
  needsAdjustment: boolean;

  @Prop({ type: String })
  adjustmentReason?: string;

  @Prop({ default: 'annual' })
  planType: string;

  // ✅ ADICIONADO: Campos de timestamp explicitamente
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const GoalPlanSchema = SchemaFactory.createForClass(GoalPlan);