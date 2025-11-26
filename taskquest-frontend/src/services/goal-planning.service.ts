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
}

export const goalPlanningService = {
  async createGoalPlan(planData: CreateGoalPlanDto): Promise<GoalPlan> {
    const response = await api.post('/goals/plan', planData);
    return response.data;
  },

  async getGoalPlan(): Promise<GoalPlan> {
    const response = await api.get('/goals/plan');
    return response.data;
  },

  async getDailyTasks(): Promise<any[]> {
    const response = await api.get('/goals/plan/daily-tasks');
    return response.data;
  },

  async completeDailyTask(taskId: string): Promise<GoalPlan> {
    const response = await api.put(`/goals/plan/daily-tasks/${taskId}/complete`);
    return response.data;
  },

  async getPlanProgress(): Promise<any> {
    const response = await api.get('/goals/plan/progress');
    return response.data;
  },
};