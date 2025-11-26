// auth.service.ts - Versão corrigida para nova API
import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  // Adicione estas propriedades para o planejamento
  vision?: string;
  goals?: string[];
  challenges?: string[];
  tools?: string[];
  hoursPerWeek?: number;
  preferences?: {
    morningPerson: boolean;
    likesExercise: boolean;
    worksFromHome: boolean;
  };
  productivityStyle?: string;
  lastActive?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface ResetResponse {
  success: boolean;
  message: string;
}

export const authService = {
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentando login...', loginData.email);
      const response = await api.post<AuthResponse>('/auth/login', loginData);
      console.log('✅ Login response:', response.data);
      
      if (response.data.success && response.data.token) {
        // ✅ Salvar token e usuário no localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Token e usuário salvos no localStorage');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Falha no login');
    }
  },

  async resetUser(): Promise<ResetResponse> {
    try {
      console.log('🔄 Solicitando reset do usuário...');
      const response = await api.post<ResetResponse>('/auth/reset');
      console.log('✅ Reset response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no reset:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Falha ao resetar usuário');
    }
  },

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('👤 Tentando registrar...', registerData.email);
      const response = await api.post<AuthResponse>('/auth/register', registerData);
      console.log('✅ Register response:', response.data);
      
      if (response.data.success && response.data.token) {
        // ✅ Salvar token e usuário no localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Token e usuário salvos no localStorage');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no registro:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Falha no registro');
    }
  },

  async getProfile(): Promise<User> {
    try {
      console.log('👤 Buscando perfil do usuário...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ Nenhum token encontrado');
        throw new Error('Usuário não autenticado');
      }

      console.log('🔐 Token disponível, fazendo requisição...');
      const response = await api.get<ProfileResponse>('/auth/profile');
      console.log('✅ Profile response:', response.data);
      
      if (response.data.success && response.data.user) {
        // ✅ Atualizar usuário no localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Falha ao carregar perfil');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar perfil:', error.response?.data || error.message);
      
      // ✅ Se for erro 401, limpar dados inválidos
      if (error.response?.status === 401) {
        console.log('🔄 Token inválido, limpando dados...');
        this.logout();
      }
      
      throw new Error(error.response?.data?.message || 'Falha ao carregar perfil');
    }
  },

  // ✅ NOVO MÉTODO: Validar token e obter perfil
  async validateToken(): Promise<User> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ Nenhum token encontrado para validar');
        throw new Error('Token não encontrado');
      }

      console.log('🔐 Validando token...');
      const user = await this.getProfile();
      console.log('✅ Token válido, usuário:', user.email);
      return user;
    } catch (error: any) {
      console.error('❌ Token inválido:', error.message);
      this.logout();
      throw error;
    }
  },

  // ✅ MÉTODO MELHORADO: Logout com limpeza completa
  logout(): void {
    console.log('🚪 Fazendo logout...');
    
    // Limpar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpar sessionStorage também, por segurança
    sessionStorage.clear();
    
    console.log('✅ Logout concluído - dados limpos');
    
    // ✅ Redirecionar para login (opcional - depende da sua implementação)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  // ✅ MÉTODO AUXILIAR: Obter usuário atual do localStorage
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário do localStorage:', error);
      return null;
    }
  },

  // ✅ MÉTODO AUXILIAR: Verificar se está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    
    return !!(token && user);
  },

  // ✅ MÉTODO AUXILIAR: Obter token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
};

export default authService;