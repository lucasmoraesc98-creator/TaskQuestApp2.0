export interface AIData {
  reason?: string;
  suggestionType?: string;
  easyGoalId?: string;
  fromAnnualPlan?: boolean;
}

export interface TaskWithAIData {
  _id: string;
  userId: string;
  text: string;
  description?: string;
  completed: boolean;
  xp: number;
  type: string;
  reason?: string;
  date: string;
  completedAt?: Date;
  priority: string;
  aiData?: AIData;
  createdAt: Date;
  updatedAt: Date;
}