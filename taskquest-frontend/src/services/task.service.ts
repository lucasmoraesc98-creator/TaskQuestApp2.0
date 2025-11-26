import api from './api';


export interface Task {
  _id: string;
  userId: string;
  text: string;
  description?: string;
  xp: number;
  type: string;
  priority?: string;
  completed: boolean;
  completedAt?: string;
  date: string;
  reason?: string;
  aiData?: {
    deadline?: string;
    priority?: string;
    estimatedMinutes?: number;
    easyGoalId?: string;
    mediumGoalId?: string;
    hardGoalId?: string;
    extremeGoalId?: string;
    goalType?: 'easy' | 'medium' | 'hard' | 'extreme' | 'review';
    fromAnnualPlan?: boolean;
    suggestionType?: string;
    reason?: string;
  };
}

export interface CreateTaskDto {
  text: string;
  xp: number;
  completed?: boolean;
  date?: string;
  type?: string;
  reason?: string;
  aiData?: {
    reason?: string;
    suggestionType?: string;
  };
}

export interface CompleteTaskResponse {
  task: Task;
  user: { 
    xp: number; 
    level: number;
    totalXP: number;
  };
  leveledUp?: boolean;
  newLevel?: number;
  currentStreak?: number;
}

export interface TodayStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  totalXP: number;
  xpByType: {
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
  };
  dailyXPLimit: number;
  xpEarnedToday: number;
}

export const taskService = {
  async getTasks(date?: string): Promise<Task[]> {
    try {
      const response = await api.get('/tasks', { params: { date } });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    try {
      const payload = {
        ...taskData,
        date: taskData.date || new Date().toISOString().split('T')[0]
      };
      
      const response = await api.post('/tasks', payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar task:', error);
      throw error;
    }
  },

  async updateTask(id: string, taskData: any): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

// No método completeTask, adicione logs para debug
async completeTask(taskId: string): Promise<CompleteTaskResponse> {
  console.log(`🔄 [TASK SERVICE] Completando task: ${taskId}`);
  
  try {
    const response = await api.put(`/tasks/${taskId}/complete`);
    console.log(`✅ [TASK SERVICE] Task completada com sucesso:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ [TASK SERVICE] Erro ao completar task:`, error);
    throw error;
  }
},

  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async getTodayStats(): Promise<TodayStats> {
    try {
      const response = await api.get('/tasks/today-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        completed: 0,
        total: 0,
        totalXP: 0,
        completionRate: 0,
        pending: 0,
        dailyXPLimit: 400,
        xpEarnedToday: 0,
        xpByType: {
          highImpact: 0,
          mediumImpact: 0,
          lowImpact: 0
        }
      };
    }
  },

  async initializeBasicTasks(): Promise<void> {
    try {
      await api.post('/tasks/initialize-basic');
    } catch (error) {
      console.error('Error initializing basic tasks:', error);
    }
  },

  async getDailyXPLimit(): Promise<number> {
    return 400;
  }
};