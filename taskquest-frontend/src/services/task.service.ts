import api from './api';
import { Task, AISuggestion } from '../types/api';

export const taskService = {
  async getTasks(date?: string): Promise<Task[]> {
    const params = date ? { date } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getAISuggestions(count: number = 3): Promise<AISuggestion[]> {
    const response = await api.post('/ai/suggestions', { count });
    return response.data;
  }
  async getTodayStats(): Promise<any> {
    const response = await api.get('/tasks/today-stats');
    return response.data;
  },

  async getUserStats(date?: string): Promise<any> {
    const params = date ? { date } : {};
    const response = await api.get('/tasks/stats', { params });
    return response.data;
  }
};