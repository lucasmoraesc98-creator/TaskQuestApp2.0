import api from './api';

export interface GoalPlan {
  _id: string;
  userId: string;
  vision: string;
  hardGoals: any[];
  mediumGoals: any[];
  easyGoals: any[];
  dailyTasks: any[];
  overallProgress: number;
  isActive: boolean;
  isConfirmed: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPlanDto {
  vision: string;
  goals: string[];
  challenges: string[];
  tools?: string[];
  hoursPerWeek?: number;
  skills?: string[]; // ✅ ADICIONAR SKILLS
}
export interface CreateGoalPlanDto {
  vision: string;
  goals: string[];
  challenges: string[];
  tools?: string[];
  hoursPerWeek?: number;
}

export const goalPlanningService = {
  async createGoalPlan(planData: CreateGoalPlanDto): Promise<GoalPlan> {
    const response = await api.post('/goals/annual-plan/generate', planData);
    return response.data;
  },

  async getGoalPlan(): Promise<GoalPlan> {
    const response = await api.get('/goals/annual-plan/current');
    return response.data;
  },

  async getDailyTasks(): Promise<any[]> {
    const response = await api.get('/goals/daily-tasks');
    return response.data;
  },

  async completeDailyTask(taskId: string): Promise<any> {
    const response = await api.put(`/goals/daily-tasks/${taskId}/complete`);
    return response.data;
  },

  async getPlanProgress(): Promise<any> {
    const response = await api.get('/goals/progress');
    return response.data;
  },

  async sendFeedback(feedback: string, currentPlan: any): Promise<GoalPlan> {
    const response = await api.post('/goals/annual-plan/feedback', {
      feedback,
      currentPlan
    });
    return response.data;
  },

  async confirmPlan(): Promise<GoalPlan> {
    const response = await api.post('/goals/annual-plan/confirm');
    return response.data;
  },
};