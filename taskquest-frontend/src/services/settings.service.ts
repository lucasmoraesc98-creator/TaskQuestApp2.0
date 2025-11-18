// src/services/settings.service.ts
import api from './api';

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
  },

  async updateChallenges(challenges: string[]) {
    const response = await api.put('/users/challenges', { challenges });
    return response.data;
  }
};