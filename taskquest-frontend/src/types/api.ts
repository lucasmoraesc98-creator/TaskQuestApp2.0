export interface User {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  dailyXP: number;
  currentStreak: number;
  goals: string[];
  challenges: string[];
  preferences: {
    morningPerson: boolean;
    likesExercise: boolean;
    worksFromHome: boolean;
  };
  productivityStyle: string;
  lastActive?: string;
  lastAnalysis?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xp: number;
  type: 'standard' | 'ai_suggestion' | 'health';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  createdAt: string;
  completedAt?: string;
  userId: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  goals?: string[];
  challenges?: string[];
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  xp: number;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  relatedGoal: string;
  analysis: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface UserGoals {
  incomeSources: string[];
  workChallenges: string[];
  healthChallenges: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  currentFocus: string;
  desiredAnnualIncome?: number;
  currentAnnualIncome?: number;
}