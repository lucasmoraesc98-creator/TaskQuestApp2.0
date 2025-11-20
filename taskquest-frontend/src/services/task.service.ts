import api from './api';

export interface Task {
  _id: string;
  title: string;
  description: string;
  xp: number;
  type: 'ai_suggestion' | 'health' | 'basic';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  completed: boolean;
  createdAt: string;
  category?: string;
  dailyReset?: boolean;
}

export const taskService = {
  async getTasks(date?: string): Promise<Task[]> {
    try {
      const response = await api.get('/tasks', { params: { date } });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Mock data for development
      return [
        {
          _id: '1',
          title: '💧 Beber 2L de água',
          description: 'Manter-se hidratado durante o dia',
          xp: 20,
          type: 'health',
          priority: 'medium',
          estimatedTime: 0,
          completed: false,
          createdAt: new Date().toISOString(),
          dailyReset: true
        },
        {
          _id: '2',
          title: 'Estudar TypeScript por 45min',
          description: 'Aprender conceitos avançados de TypeScript',
          xp: 100,
          type: 'ai_suggestion',
          priority: 'high',
          estimatedTime: 45,
          completed: false,
          createdAt: new Date().toISOString()
        }
      ];
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      // Mock response for development
      return {
        _id: Math.random().toString(36).substr(2, 9),
        title: taskData.title || '',
        description: taskData.description || '',
        xp: taskData.xp || 0,
        type: taskData.type || 'basic',
        priority: taskData.priority || 'medium',
        estimatedTime: taskData.estimatedTime || 0,
        completed: false,
        createdAt: new Date().toISOString(),
        ...taskData
      };
    }
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async completeTask(id: string): Promise<{task: Task; user: {xp: number; level: number}}> {
    try {
      const response = await api.put(`/tasks/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      // Mock response for development
      const mockTask = await this.getTasks().then(tasks => tasks.find(t => t._id === id));
      if (!mockTask) throw new Error('Task not found');
      
      return {
        task: { ...mockTask, completed: true },
        user: { xp: 100, level: 1 }
      };
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },

  async getTodayStats(): Promise<any> {
    try {
      const response = await api.get('/tasks/today-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Mock stats for development
      return {
        completed: 2,
        total: 5,
        totalXP: 140,
        completionRate: 40,
        pending: 3,
        dailyXPLimit: 400,
        xpEarnedToday: 140
      };
    }
  },

  async getDailyXPLimit(): Promise<number> {
    return 400; // XP diário limite
  }
};