import api from './api';
import { LoginData, RegisterData, User } from '../types/api';

export const authService = {
  async login(loginData: LoginData) {
    const response = await api.post('/auth/login', loginData);
    return response.data;
  },

  async register(registerData: RegisterData) {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
