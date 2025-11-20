import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', loginData);
    return response.data;
  },

  async register(registerData: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', registerData);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};