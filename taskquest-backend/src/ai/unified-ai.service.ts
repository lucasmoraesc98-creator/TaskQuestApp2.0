import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoalPlan, GoalPlanDocument } from '../goals/schemas/goal-plan.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class UnifiedAIService {
  private readonly logger = new Logger(UnifiedAIService.name);
  private apiKey: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.apiKey = this.configService.get<string>('HF_TOKEN');
    this.baseUrl = 'https://router.huggingface.co';
  }

  // ✅ MÉTODO UNIFICADO: Gerar recomendações baseadas no plano anual atual
  async generatePersonalizedRecommendations(userId: string): Promise<any[]> {
    this.logger.log(`🎯 Gerando recomendações personalizadas para usuário: ${userId}`);
    
    try {
      // Buscar plano anual ativo
      const goalPlan = await this.goalPlanModel.findOne({
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      if (!goalPlan) {
        this.logger.log('ℹ️  Nenhum plano ativo encontrado, gerando recomendações genéricas');
        return this.generateGenericRecommendations();
      }

      // Buscar dados do usuário
      const user = await this.userModel.findById(userId);
      
      // Gerar recomendações contextualizadas
      const prompt = this.buildRecommendationsPrompt(goalPlan, user);
      
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `${this.baseUrl}/models/mistralai/Mistral-7B-Instruct-v0.2`,
            {
              inputs: prompt,
              parameters: {
                max_new_tokens: 1500,
                temperature: 0.8,
                top_p: 0.9,
              },
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
              },
              timeout: 30000,
            },
          ),
        );

        return this.parseRecommendationsResponse(response.data, goalPlan);
      } catch (apiError) {
        this.logger.warn('⚠️  API da IA indisponível, usando recomendações baseadas no plano');
        return this.generatePlanBasedRecommendations(goalPlan);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao gerar recomendações:', error);
      return this.generateGenericRecommendations();
    }
  }

  private buildRecommendationsPrompt(goalPlan: GoalPlanDocument, user: any): string {
    const today = new Date().toISOString().split('T')[0];
    const completedTasks = goalPlan.dailyTasks.filter((task: any) => task.completed).length;
    const totalTasks = goalPlan.dailyTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `
COM BASE NO PLANO ANUAL DO USUÁRIO, GERE 3 RECOMENDAÇÕES PERSONALIZADAS DE TAREFAS PARA HOJE (${today}).

CONTEXTO DO PLANO ANUAL:
- Visão: ${goalPlan.vision}
- Progresso Geral: ${progress}%
- Metas HARD Ativas: ${goalPlan.hardGoals.length}
- Tarefas Concluídas: ${completedTasks}/${totalTasks}

METAS HARD EM ANDAMENTO:
${goalPlan.hardGoals.map((goal: any) => 
  `- ${goal.title} (${goal.progress || 0}% completo): ${goal.description}`
).join('\n')}

METAS EASY DA SEMANA:
${goalPlan.easyGoals.slice(0, 5).map((goal: any) => 
  `- ${goal.title} (Vence: ${new Date(goal.deadline).toLocaleDateString('pt-BR')})`
).join('\n')}

PREFERÊNCIAS DO USUÁRIO:
- Estilo de Produtividade: ${user?.productivityStyle || 'balanced'}
- Trabalha em Casa: ${user?.preferences?.worksFromHome ? 'Sim' : 'Não'}
- Pessoa Matutina: ${user?.preferences?.morningPerson ? 'Sim' : 'Não'}

REQUISITOS DAS RECOMENDAÇÕES:
1. Cada recomendação deve avançar pelo menos uma EASY goal específica
2. Tarefas devem ser realizáveis em 30-60 minutos
3. Variedade entre aprendizado, prática e planejamento
4. Considerar progresso atual e próximos passos lógicos
5. Incluir estimativa de tempo e prioridade

FORMATO DE RESPOSTA (JSON):
{
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Título específico e acionável",
      "description": "Descrição detalhada explicando como esta tarefa avança o plano anual",
      "relatedEasyGoalId": "easy-x-x-x",
      "estimatedMinutes": 45,
      "priority": "high|medium|low",
      "category": "learning|execution|planning|review",
      "reason": "Explicação clara de como isso contribui para as metas anuais"
    }
  ]
}

GERE RECOMENDAÇÕES REALISTAS E PERSONALIZADAS:
`;
  }

  private parseRecommendationsResponse(response: any, goalPlan: GoalPlanDocument): any[] {
    try {
      if (!response || !response[0] || !response[0].generated_text) {
        throw new Error('Resposta da IA vazia');
      }

      const content = response[0].generated_text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Estrutura de recomendações inválida');
      }

      // Adicionar XP e tipo padrão
      return parsed.recommendations.map((rec: any) => ({
        ...rec,
        xp: 100, // XP padrão para recomendações da IA
        type: 'ai_suggestion'
      }));

    } catch (error) {
      this.logger.error('❌ Erro ao parsear recomendações:', error);
      return this.generatePlanBasedRecommendations(goalPlan);
    }
  }

  private generatePlanBasedRecommendations(goalPlan: GoalPlanDocument): any[] {
    const today = new Date().toISOString().split('T')[0];
    const availableEasyGoals = goalPlan.easyGoals.slice(0, 3);

    return availableEasyGoals.map((goal: any, index: number) => ({
      id: `rec-${today}-${index + 1}`,
      title: `Trabalhar em: ${goal.title}`,
      description: `Progresso em direção à meta: ${goal.description}`,
      relatedEasyGoalId: goal.id,
      estimatedMinutes: 45,
      priority: 'high',
      category: 'execution',
      reason: `Esta tarefa avança diretamente na meta "${goal.title}" do seu plano anual`,
      xp: 100,
      type: 'ai_suggestion'
    }));
  }

  private generateGenericRecommendations(): any[] {
    return [
      {
        id: 'rec-generic-1',
        title: 'Revisar e planejar próxima semana',
        description: 'Dedique 30 minutos para revisar o progresso da semana e planejar os próximos passos',
        estimatedMinutes: 30,
        priority: 'medium',
        category: 'planning',
        reason: 'Planejamento semanal é essencial para manter o foco nas metas de longo prazo',
        xp: 100,
        type: 'ai_suggestion'
      },
      {
        id: 'rec-generic-2',
        title: 'Aprender uma nova habilidade relacionada aos objetivos',
        description: 'Estude por 45 minutos sobre um tópico que avance em direção às suas metas principais',
        estimatedMinutes: 45,
        priority: 'high',
        category: 'learning',
        reason: 'Aprendizado contínuo é fundamental para o crescimento profissional',
        xp: 100,
        type: 'ai_suggestion'
      },
      {
        id: 'rec-generic-3',
        title: 'Conectar-se com pessoa da área',
        description: 'Envie uma mensagem para alguém que possa ajudar em seus objetivos profissionais',
        estimatedMinutes: 20,
        priority: 'low',
        category: 'networking',
        reason: 'Networking estratégico acelera o alcance de metas profissionais',
        xp: 100,
        type: 'ai_suggestion'
      }
    ];
  }
}