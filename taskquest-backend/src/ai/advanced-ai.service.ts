import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateGoalPlanDto } from '../goals/dto/create-goal-plan.dto';
import { GoalPlan } from '../goals/schemas/goal-plan.schema';

@Injectable()
export class AdvancedAIService {
  private readonly logger = new Logger(AdvancedAIService.name);
  private deepSeekApiKey: string;
  private deepSeekBaseUrl = 'https://api.deepseek.com/v1';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.deepSeekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || 'sk-e04eb6265ba24000ab6f23e7244ed39c';
  }

  async generateHierarchicalPlan(userData: CreateGoalPlanDto): Promise<any> {
    const prompt = this.buildHierarchicalPrompt(userData);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.deepSeekBaseUrl}/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em planejamento estratégico e produtividade. 
                Sua tarefa é decompor objetivos anuais em um plano hierárquico de HARD → MEDIUM → EASY goals.
                HARD: Objetivos anuais (3-5)
                MEDIUM: Objetivos mensais (3-5 por HARD goal)  
                EASY: Objetivos semanais (4-5 por MEDIUM goal)`
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.deepSeekApiKey}`,
            },
          },
        ),
      );

      return this.parseHierarchicalResponse(response.data);
    } catch (error) {
      this.logger.error('Erro ao gerar plano hierárquico com DeepSeek:', error);
      return this.generateFallbackPlan(userData);
    }
  }

  async generateDailyTasks(goalPlan: any): Promise<any[]> {
    const prompt = this.buildDailyTasksPrompt(goalPlan);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.deepSeekBaseUrl}/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em produtividade. Gere 3 tarefas diárias específicas e acionáveis baseadas no plano de metas do usuário.`
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 2000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.deepSeekApiKey}`,
            },
          },
        ),
      );

      return this.parseDailyTasksResponse(response.data, goalPlan);
    } catch (error) {
      this.logger.error('Erro ao gerar tarefas diárias com DeepSeek:', error);
      return this.generateFallbackDailyTasks(goalPlan);
    }
  }

  private buildHierarchicalPrompt(userData: CreateGoalPlanDto): string {
    return `
CRIE UM PLANO HIERÁRQUICO DE 1 ANO:

VISÃO DO USUÁRIO: ${userData.vision}
OBJETIVOS: ${userData.goals.join(', ')}
DESAFIOS: ${userData.challenges.join(', ')}
FERRAMENTAS: ${userData.tools?.join(', ') || 'Não especificadas'}
HORAS SEMANAIS DISPONÍVEIS: ${userData.hoursPerWeek || 'Não especificado'}

ESTRUTURA REQUERIDA:

HARD GOALS (Anuais - 3 a 5 objetivos):
- Cada HARD goal deve ser ambicioso mas realizável em 1 ano
- Focar nos objetivos principais do usuário
- Incluir métricas claras de sucesso

MEDIUM GOALS (Mensais - 3 a 5 por HARD goal):
- Cada MEDIUM goal deve contribuir diretamente para um HARD goal
- Ser realizável em 1 mês
- Ter entregas concretas

EASY GOALS (Semanais - 4 a 5 por MEDIUM goal):
- Cada EASY goal deve ser específico e acionável
- Realizável em 1 semana
- Ter passos claros e mensuráveis

FORMATO DE RESPOSTA (JSON):
{
  "hardGoals": [
    {
      "id": "hard-1",
      "title": "Título do objetivo anual",
      "description": "Descrição detalhada com métricas",
      "category": "categoria",
      "deadline": "2024-12-31",
      "xpValue": 500
    }
  ],
  "mediumGoals": [
    {
      "id": "medium-1-1", 
      "title": "Título do objetivo mensal",
      "description": "Descrição detalhada",
      "hardGoalId": "hard-1",
      "deadline": "2024-01-31",
      "xpValue": 150
    }
  ],
  "easyGoals": [
    {
      "id": "easy-1-1-1",
      "title": "Título do objetivo semanal", 
      "description": "Descrição detalhada e acionável",
      "mediumGoalId": "medium-1-1",
      "deadline": "2024-01-07",
      "xpValue": 50
    }
  ]
}
`;
  }

  private buildDailyTasksPrompt(goalPlan: any): string {
    const today = new Date().toISOString().split('T')[0];
    
    return `
GERE 3 TAREFAS DIÁRIAS PARA HOJE (${today}):

CONTEXTO DO PLANO:
Visão: ${goalPlan.vision}
Progresso Geral: ${goalPlan.overallProgress}%

HARD GOALS EM ANDAMENTO:
${goalPlan.hardGoals.map((goal: any) => 
  `- ${goal.title} (${goal.progress}% completo)`
).join('\n')}

EASY GOALS DA SEMANA:
${goalPlan.easyGoals.filter((goal: any) => {
  const goalDate = new Date(goal.deadline);
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return goalDate >= today && goalDate <= nextWeek;
}).map((goal: any) => 
  `- ${goal.title} (Vence: ${new Date(goal.deadline).toLocaleDateString()})`
).join('\n')}

REQUISITOS DAS TAREFAS:
1. Cada tarefa deve contribuir para pelo menos um EASY goal
2. Tarefas devem ser realizáveis em 30-60 minutos cada
3. Variedade entre aprendizado, prática e planejamento
4. Considerar progresso atual e próximos passos lógicos
5. Incluir estimativa de tempo e prioridade

FORMATO (JSON):
{
  "dailyTasks": [
    {
      "id": "daily-${today}-1",
      "title": "Título da tarefa específica",
      "description": "Descrição detalhada e acionável",
      "easyGoalId": "easy-x-x-x",
      "date": "${today}",
      "xpValue": 100,
      "estimatedMinutes": 45,
      "priority": "high"
    }
  ]
}
`;
  }

  private parseHierarchicalResponse(response: any): any {
    try {
      const content = response.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      
      // Validar estrutura básica
      if (!parsed.hardGoals || !parsed.mediumGoals || !parsed.easyGoals) {
        throw new Error('Estrutura de resposta inválida');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Erro ao parsear resposta hierárquica:', error);
      throw new Error('Resposta da IA em formato inválido');
    }
  }

  private parseDailyTasksResponse(response: any, goalPlan: any): any[] {
    try {
      const content = response.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      
      if (!parsed.dailyTasks || !Array.isArray(parsed.dailyTasks)) {
        throw new Error('Estrutura de tarefas diárias inválida');
      }

      return parsed.dailyTasks.map((task: any) => ({
        ...task,
        completed: false,
        status: 'pending'
      }));
    } catch (error) {
      this.logger.error('Erro ao parsear tarefas diárias:', error);
      throw error;
    }
  }

  private generateFallbackPlan(userData: CreateGoalPlanDto): any {
    this.logger.log('Usando plano fallback...');
    
    const hardGoals = userData.goals.slice(0, 3).map((goal, index) => ({
      id: `hard-${index + 1}`,
      title: goal,
      description: `Objetivo anual: ${goal}. ${userData.vision}`,
      category: 'development',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      xpValue: 500
    }));

    const mediumGoals = [];
    const easyGoals = [];

    // Gerar estrutura hierárquica básica
    hardGoals.forEach(hardGoal => {
      for (let i = 1; i <= 3; i++) {
        const mediumGoalId = `medium-${hardGoal.id}-${i}`;
        mediumGoals.push({
          id: mediumGoalId,
          title: `Meta mensal ${i} para ${hardGoal.title}`,
          description: `Progresso mensal em direção a ${hardGoal.title}`,
          hardGoalId: hardGoal.id,
          deadline: new Date(Date.now() + 30 * i * 24 * 60 * 60 * 1000),
          xpValue: 150
        });

        for (let j = 1; j <= 4; j++) {
          easyGoals.push({
            id: `easy-${mediumGoalId}-${j}`,
            title: `Tarefa semanal ${j} para meta mensal ${i}`,
            description: `Progresso semanal específico e acionável`,
            mediumGoalId: mediumGoalId,
            deadline: new Date(Date.now() + 7 * j * 24 * 60 * 60 * 1000),
            xpValue: 50
          });
        }
      }
    });

    return { hardGoals, mediumGoals, easyGoals };
  }

  private generateFallbackDailyTasks(goalPlan: any): any[] {
    const today = new Date().toISOString().split('T')[0];
    const availableEasyGoals = goalPlan.easyGoals.slice(0, 3);

    return availableEasyGoals.map((goal: any, index: number) => ({
      id: `daily-${today}-${index + 1}`,
      title: `Trabalhar em: ${goal.title}`,
      description: `Progresso diário em direção a: ${goal.description}`,
      easyGoalId: goal.id,
      date: today,
      xpValue: 100,
      estimatedMinutes: 45,
      priority: 'high',
      completed: false,
      status: 'pending'
    }));
  }
}