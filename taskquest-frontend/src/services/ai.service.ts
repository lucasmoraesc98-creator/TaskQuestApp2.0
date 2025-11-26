import api from './api';

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  reason: string;
  relatedEasyGoalId?: string;
}

export const aiService = {
  async getRecommendations(): Promise<AIRecommendation[]> {
    try {
      const response = await api.get('/ai/recommendations');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter recomendações da IA:', error);
      // Fallback para recomendações genéricas
      return this.getGenericRecommendations();
    }
  },

  async getGenericRecommendations(): Promise<AIRecommendation[]> {
    return [
      {
        id: 'fallback-1',
        title: 'Revisar progresso do plano anual',
        description: 'Analise seu progresso atual e ajuste as metas se necessário',
        xp: 100,
        type: 'ai_suggestion',
        estimatedMinutes: 30,
        priority: 'medium',
        category: 'planning',
        reason: 'Revisão regular mantém o foco no plano anual'
      },
      {
        id: 'fallback-2',
        title: 'Estudar tópico relacionado às metas',
        description: 'Dedique tempo para aprender algo que avance em direção aos seus objetivos',
        xp: 100,
        type: 'ai_suggestion', 
        estimatedMinutes: 45,
        priority: 'high',
        category: 'learning',
        reason: 'Aprendizado contínuo é essencial para o crescimento'
      },
      {
        id: 'fallback-3',
        title: 'Praticar habilidade específica',
        description: 'Exercite uma habilidade prática relacionada às suas metas profissionais',
        xp: 100,
        type: 'ai_suggestion',
        estimatedMinutes: 40,
        priority: 'high',
        category: 'practice',
        reason: 'Prática consistente desenvolve competências'
      }
    ];
  }
};