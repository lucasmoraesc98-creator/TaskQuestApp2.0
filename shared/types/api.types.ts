// Tipos compartilhados entre frontend e backend
export interface User {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  preferences: UserPreferences;
  goals: string[];
  challenges: string[];
  productivityStyle: string;
  lastAnalysis: Date | null;
  lastActive: Date;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  morningPerson: boolean;
  likesExercise: boolean;
  worksFromHome: boolean;
}

export interface Task {
  _id: string;
  userId: string;
  text: string;
  completed: boolean;
  xp: number;
  type: TaskType;
  reason?: string;
  date: string;
  completedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export type TaskType = 'ai_suggestion' | 'health' | 'basic' | 'custom';

export interface CreateTaskDto {
  text: string;
  xp: number;
  completed?: boolean;
  date?: string;
  type?: TaskType;
  aiData?: {
    reason?: string;
    suggestionType?: string;
  };
}