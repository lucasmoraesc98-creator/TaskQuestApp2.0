import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService, { User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ INICIALIZAÇÃO MELHORADA
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...');
        
        // Tentar validar token existente
        if (authService.isAuthenticated()) {
          console.log('🔐 Token encontrado, validando...');
          const userData = await authService.validateToken();
          setUser(userData);
          console.log('✅ Autenticação inicializada com sucesso');
        } else {
          console.log('🔐 Nenhuma sessão ativa encontrada');
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        // Não fazer logout automático, apenas manter como não autenticado
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando login...');
      
      const response = await authService.login({ email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('✅ Login realizado com sucesso');
      } else {
        throw new Error(response.message || 'Falha no login');
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      console.log('👤 Iniciando registro...');
      
      const response = await authService.register({ name, email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('✅ Registro realizado com sucesso');
      } else {
        throw new Error(response.message || 'Falha no registro');
      }
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Iniciando logout...');
    authService.logout();
    setUser(null);
    console.log('✅ Logout concluído');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};