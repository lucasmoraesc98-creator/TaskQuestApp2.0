import api from './api';

export interface AnnualPlan {
  _id: string;
  userId: string;
  vision: string;
  extremeGoals: any[];
  hardGoals: any[];
  mediumGoals: any[];
  easyGoals: any[];
  dailyTasks: any[];
  overallProgress: number;
  isActive: boolean;
  isConfirmed: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  strategicAnalysis?: string;
  analysis?: string;
  hierarchyExplanation?: string;
}

export interface CreatePlanData {
  vision: string;
  goals: string[];
  challenges: string[];
  tools?: string[];
  hoursPerWeek?: number;
}

export interface AdjustPlanData {
  feedback: string;
  userContext?: string;
  specificIssues?: string[];
}

export const annualPlanService = {
  async activatePlan(): Promise<{ success: boolean; message: string; plan: AnnualPlan }> {
    const response = await api.post('/goals/annual-plan/activate');
    return response.data;
  },

  async generateAnnualPlan(planData: CreatePlanData): Promise<AnnualPlan> {
    const response = await api.post('/goals/annual-plan/generate', planData, {
      timeout: 300000 // 5 minutos
    });
    return response.data.data;
  },

 async getCurrentPlan(): Promise<AnnualPlan> {
  try {
    const response = await api.get('/goals/annual-plan/current');
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar plano atual:', error);
    if (error.response?.status === 404) {
      // Retornar null em vez de lançar erro para facilitar o tratamento
      throw new Error('Nenhum plano encontrado');
    }
    throw error;
  }
},

  async sendFeedback(feedback: string, currentPlan: any): Promise<AnnualPlan> {
    const response = await api.post('/goals/annual-plan/feedback', {
      feedback,
      currentPlan
    }, {
      timeout: 90000 // 1.5 minutos
    });
    return response.data.data;
  },

  async confirmPlan(): Promise<AnnualPlan> {
    const response = await api.post('/goals/annual-plan/confirm');
    return response.data.data;
  },

  async getDailyTasks(): Promise<any[]> {
    const response = await api.get('/goals/daily-tasks');
    return response.data.data;
  },

  async completeDailyTask(taskId: string): Promise<any> {
    const response = await api.put(`/goals/daily-tasks/${taskId}/complete`);
    return response.data.data;
  },

  async reconfirmPlanAfterFeedback(): Promise<{ success: boolean; message: string; plan: AnnualPlan }> {
    const response = await api.post('/goals/annual-plan/reconfirm-after-feedback');
    return response.data;
  },

  async getPlanProgress(): Promise<any> {
    const response = await api.get('/goals/annual-plan/progress');
    return response.data.data;
  },

  async resetAccount(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/reset/account');
    return response.data;
  },

  async confirmReset(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/reset/confirm');
    return response.data;
  },
// ✅ MÉTODO CORRIGIDO: Ajustar plano atual sem precisar do ID
async adjustCurrentPlan(adjustData: AdjustPlanData): Promise<AnnualPlan> {
  try {
    console.log('🔄 [FRONTEND] Enviando solicitação de ajuste do plano atual...', adjustData);
    
    const response = await api.post('/plan-adjustment/adjust-current', adjustData, {
      timeout: 120000
    });
    
    console.log('✅ [FRONTEND] Resposta do ajuste do plano:', response.data);
    
    if (!response.data.plan) {
      throw new Error('Resposta do servidor não contém o plano ajustado');
    }
    
    return response.data.plan;
  } catch (error: any) {
    console.error('❌ [FRONTEND] Erro no serviço adjustCurrentPlan:', error);
    
    // ✅ CORREÇÃO: Log detalhado do erro
    if (error.response) {
      console.error('📊 [FRONTEND] Detalhes da resposta de erro:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message
      });
    }
    
    if (error.response?.status === 404) {
      throw new Error('Plano não encontrado. Crie um plano anual primeiro.');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Erro ao ajustar plano');
  }
},

// ✅ NOVO MÉTODO: Debug dos planos do usuário
async debugUserPlans(): Promise<any> {
  try {
    console.log('🐛 [FRONTEND] Solicitando debug dos planos do usuário...');
    const response = await api.get('/goals/debug/user-plans');
    return response.data;
  } catch (error: any) {
    console.error('❌ [FRONTEND] Erro no debug:', error);
    throw error;
  }
},
  async resetAnnualPlan(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/goals/annual-plan/reset');
    return response.data;
  },

  // ✅ MÉTODO ALTERNATIVO para teste rápido (opcional)
  async quickTestPlan(planData: CreatePlanData): Promise<AnnualPlan> {
    const response = await api.post('/goals/plan', planData, {
      timeout: 120000 // 2 minutos para teste rápido
    });
    return response.data.data;
  },

  // ✅ MÉTODO CORRIGIDO: Ajustar plano existente
  async adjustPlan(planId: string, adjustData: AdjustPlanData): Promise<AnnualPlan> {
    const response = await api.post(`/plan-adjustment/${planId}/adjust`, adjustData, {
      timeout: 120000 // 2 minutos
    });
    return response.data.plan; // ✅ CORREÇÃO: Retorna apenas o plan, não o objeto completo
  },
};