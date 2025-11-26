// taskquest-frontend/src/types/task.ts
export interface Task {
  _id: string;
  userId: string;
  text: string;
  description?: string;
  completed: boolean;
  xp: number;
  type: 'ai_suggestion' | 'health' | 'custom' | 'basic';
  reason?: string;
  date: string;
  completedAt?: Date;
  createdAt: string;
  updatedAt: string;
  aiData?: {
    reason?: string;
    suggestionType?: string;
    easyGoalId?: string;
  };
}

export interface AISuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  category: string;
}