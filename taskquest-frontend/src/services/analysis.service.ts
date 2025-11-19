import api from './api';

export const analysisService = {
  async getUserAnalysis() {
    const response = await api.get('/analysis');
    return response.data;
  },

  async getProgressStats() {
    const response = await api.get('/progress/stats');
    return response.data;
  },

  async getWeeklyReport() {
    const response = await api.get('/analysis/weekly');
    return response.data;
  }
};