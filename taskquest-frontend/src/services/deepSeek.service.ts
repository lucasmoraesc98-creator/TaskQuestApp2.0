// taskquest-frontend/src/services/deepSeek.service.ts
import api from './api';

export interface AnnualPlan {
  vision: string;
  hardGoals: HardGoal[];
  timeline: {
    quarters: Quarter[];
  };
  confirmationStatus: 'pending' | 'reviewing' | 'confirmed';
}

export interface HardGoal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  xpValue: number;
  mediumGoals: MediumGoal[];
  progress: number;
}

export interface MediumGoal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  hardGoalId: string;
  xpValue: number;
  easyGoals: EasyGoal[];
  progress: number;
}

export interface EasyGoal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  mediumGoalId: string;
  xpValue: number;
  dailyTasks: DailyTask[];
  progress: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  date: string;
  xpValue: number;
  completed: boolean;
}

export interface Quarter {
  name: string;
  months: Month[];
  focus: string;
}

export interface Month {
  name: string;
  easyGoals: string[];
  milestones: string[];
}

export const deepSeekService = {
  async generateAnnualPlan(userId: string): Promise<AnnualPlan> {
    try {
      const response = await api.post('/ai/generate-annual-plan', { userId });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar plano anual:', error);
      throw error;
    }
  },

  async getAnnualPlan(userId: string): Promise<AnnualPlan> {
    try {
      const response = await api.get(`/ai/annual-plan/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar plano anual:', error);
      throw error;
    }
  },

  async chatAboutPlan(userId: string, message: string, currentPlan: AnnualPlan | null): Promise<{ suggestedChanges: string[] }> {
    try {
      const response = await api.post('/ai/chat-about-plan', {
        userId,
        message,
        currentPlan
      });
      return response.data;
    } catch (error) {
      console.error('Erro no chat com IA:', error);
      throw error;
    }
  },

  async confirmAnnualPlan(userId: string): Promise<void> {
    try {
      await api.post('/ai/confirm-annual-plan', { userId });
    } catch (error) {
      console.error('Erro ao confirmar plano:', error);
      throw error;
    }
  },

  async getDailyTasks(userId: string): Promise<DailyTask[]> {
    try {
      const response = await api.get(`/ai/daily-tasks/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tarefas diárias:', error);
      throw error;
    }
  }
};