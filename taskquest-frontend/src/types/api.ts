export interface User {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
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
  user: any;
  task: any;
  _id: string;
  userId: string;
  text: string;
  completed: boolean;
  xp: number;
  type: string;
  reason?: string;
  date: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  text: string;
  xp: number;
  type: string;
  reason: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
