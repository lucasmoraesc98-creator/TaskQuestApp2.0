// services/settings.service.ts
export interface UserGoals {
  incomeSources: string[];
  workChallenges: string[];
  healthChallenges: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  currentFocus: string;
  currentAnnualIncome?: number;
  desiredAnnualIncome?: number;
}

// Chave para salvar no localStorage
const USER_GOALS_KEY = 'user-goals';

export const settingsService = {
  async getUserGoals(): Promise<UserGoals> {
    try {
      const savedGoals = localStorage.getItem(USER_GOALS_KEY);
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        console.log('📥 Objetivos recuperados do localStorage:', goals);
        return goals;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar objetivos:', error);
    }
    
    // Retorna objeto vazio se não encontrar nada salvo
    return {
      incomeSources: [],
      workChallenges: [],
      healthChallenges: [],
      shortTermGoals: [],
      longTermGoals: [],
      currentFocus: '',
    };
  },

  async updateUserGoals(goals: UserGoals): Promise<void> {
    try {
      console.log('💾 Salvando objetivos no localStorage:', goals);
      localStorage.setItem(USER_GOALS_KEY, JSON.stringify(goals));
      console.log('✅ Objetivos salvos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar objetivos:', error);
      throw error;
    }
  },

  async getAISuggestions(): Promise<any> {
    // Mock implementation - será substituído por IA real
    return {
      analysis: "Baseado em seus objetivos, recomendo focar em desenvolvimento de skills técnicas e networking. Suas metas financeiras mostram que você está buscando crescimento profissional consistente.",
      tasks: [
        {
          id: '1',
          title: 'Estudar TypeScript por 45min',
          description: 'Aprender conceitos avançados de TypeScript para melhorar suas habilidades de desenvolvimento',
          xp: 100,
          priority: 'high' as const,
          estimatedTime: 45,
          relatedGoal: 'Desenvolvimento Profissional'
        },
        {
          id: '2', 
          title: 'Fazer 30min de exercício cardiovascular',
          description: 'Melhorar saúde cardiovascular e energia para produtividade',
          xp: 100,
          priority: 'medium' as const,
          estimatedTime: 30,
          relatedGoal: 'Saúde'
        },
        {
          id: '3',
          title: 'Planejar metas da semana',
          description: 'Organizar tarefas e prioridades para a semana que vem',
          xp: 100,
          priority: 'high' as const,
          estimatedTime: 20,
          relatedGoal: 'Organização'
        }
      ]
    };
  },

  async chatWithAI(message: string): Promise<any> {
    // Mock implementation
    return {
      response: `Entendi sua mensagem: "${message}". Como assistente de IA, posso ajudar você a planejar suas tarefas e objetivos baseado nas configurações que você definiu.`
    };
  },
};