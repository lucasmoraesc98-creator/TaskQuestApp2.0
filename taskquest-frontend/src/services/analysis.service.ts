// src/services/analysis.service.ts
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

// src/services/books.service.ts
export const booksService = {
  async getBookSuggestions(category: string) {
    const response = await api.get('/integrations/books', { 
      params: { category } 
    });
    return response.data;
  },

  async saveBookRecommendation(bookData: any) {
    const response = await api.post('/integrations/books/save', bookData);
    return response.data;
  }
};

// src/services/settings.service.ts
export const settingsService = {
  async updateProfile(profileData: any) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  async updatePreferences(preferences: any) {
    const response = await api.put('/users/preferences', { preferences });
    return response.data;
  },

  async updateGoals(goals: string[]) {
    const response = await api.put('/users/goals', { goals });
    return response.data;
  }
};