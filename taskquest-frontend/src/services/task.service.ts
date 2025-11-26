import api from './api';

export interface Task {
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
  createdAt: string;
  updatedAt: string;
  aiData?: {
    reason?: string;
    suggestionType?: string;
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

export interface UpdateTaskDto {
  text?: string;
  xp?: number;
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
  user: { xp: number; level: number };
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
}

export const taskService = {
  async getTasks(date?: string): Promise<Task[]> {
    try {
      const response = await api.get('/tasks', { params: { date } });
      console.log('📥 Tarefas carregadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    try {
      console.log('🔄 Criando tarefa:', taskData);
      const payload = {
        ...taskData,
        date: taskData.date || new Date().toISOString().split('T')[0]
      };
      
      // Se tiver reason mas não tiver aiData, mover reason para aiData
      if (taskData.reason && !taskData.aiData) {
        payload.aiData = { reason: taskData.reason };
        delete payload.reason;
      }
      
      const response = await api.post('/tasks', payload);
      console.log('✅ Tarefa criada com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar task:', error);
      throw error;
    }
  },

  async updateTask(id: string, taskData: UpdateTaskDto): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async completeTask(id: string): Promise<CompleteTaskResponse> {
    try {
      const response = await api.put(`/tasks/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`);
      console.log('🗑️ Tarefa deletada com sucesso');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async getTodayStats(): Promise<any> {
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
        streak: 0
      };
    }
  },

  async getDailyXPLimit(): Promise<number> {
    return 400;
  }
};