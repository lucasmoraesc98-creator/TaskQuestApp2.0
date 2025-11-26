import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async generateAnnualPlan(userId: string): Promise<any> {
    this.logger.log(`🎯 Gerando plano anual para usuário: ${userId}`);
    
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      const plan = await this.generatePlanWithDeepSeek(user);
      return plan;
    } catch (error) {
      this.logger.error('Erro ao gerar plano anual:', error);
      return this.generateLocalAnnualPlan();
    }
  }

  async getAnnualPlan(userId: string): Promise<any> {
    // CORREÇÃO: Mantido userId para compatibilidade
    this.logger.log(`📋 Obtendo plano anual para usuário: ${userId}`);
    return this.generateLocalAnnualPlan();
  }

  async chatAboutPlan(userId: string, message: string, currentPlan: any): Promise<{ suggestedChanges: string[] }> {
    // CORREÇÃO: Mantidos todos os parâmetros para compatibilidade
    this.logger.log(`💬 Chat sobre plano - Usuário: ${userId}, Mensagem: ${message}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      suggestedChanges: [
        "Ajustar prazos para metas mais realistas",
        "Adicionar mais atividades práticas",
        "Incluir métricas de progresso mensal"
      ]
    };
  }

  async confirmAnnualPlan(userId: string): Promise<void> {
    // CORREÇÃO: Mantido userId para compatibilidade
    this.logger.log(`✅ Plano anual confirmado para usuário: ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getDailyTasks(userId: string): Promise<any[]> {
    // CORREÇÃO: Mantido userId para compatibilidade
    this.logger.log(`📝 Obtendo tarefas diárias para usuário: ${userId}`);
    return [
      {
        id: '1',
        title: 'Estudar conceitos básicos',
        description: 'Revisar fundamentos por 30min',
        date: new Date().toISOString().split('T')[0],
        xpValue: 100,
        completed: false
      },
      {
        id: '2', 
        title: 'Praticar exercícios',
        description: 'Fazer 2 exercícios práticos',
        date: new Date().toISOString().split('T')[0],
        xpValue: 100,
        completed: false
      }
    ];
  }

  private async generatePlanWithDeepSeek(user: any): Promise<any> {
    try {
      const prompt = this.buildAnnualPlanPrompt(user);
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.configService.get('DEEPSEEK_API_KEY')}`,
            },
          },
        ),
      );

      return this.parseAnnualPlanResponse(response.data);
    } catch (error) {
      this.logger.warn('DeepSeek falhou, usando plano local');
      return this.generateLocalAnnualPlan();
    }
  }

  private buildAnnualPlanPrompt(user: any): string {
    return `Como especialista em planejamento estratégico, crie um plano anual detalhado em JSON.

DADOS DO USUÁRIO:
- Nome: ${user.name}
- Objetivos: ${user.goals?.join(', ') || 'Não definidos'}
- Desafios: ${user.challenges?.join(', ') || 'Não definidos'}
- Ferramentas: ${user.tools?.join(', ') || 'Não definidos'}

ESTRUTURA REQUERIDA:
{
  "vision": "Visão geral inspiradora",
  "hardGoals": [
    {
      "id": "hard-1",
      "title": "Meta anual principal",
      "description": "Descrição detalhada",
      "deadline": "2024-12-31",
      "xpValue": 500,
      "mediumGoals": [
        {
          "id": "medium-1-1",
          "title": "Meta trimestral",
          "description": "Descrição",
          "deadline": "2024-03-31", 
          "hardGoalId": "hard-1",
          "xpValue": 150,
          "easyGoals": [
            {
              "id": "easy-1-1-1",
              "title": "Meta mensal",
              "description": "Descrição",
              "deadline": "2024-01-31",
              "mediumGoalId": "medium-1-1",
              "xpValue": 50,
              "dailyTasks": []
            }
          ]
        }
      ]
    }
  ],
  "timeline": {
    "quarters": [
      {
        "name": "Q1 2024",
        "focus": "Foco principal",
        "months": [
          {
            "name": "Janeiro",
            "easyGoals": ["Meta 1", "Meta 2"],
            "milestones": ["Marco importante"]
          }
        ]
      }
    ]
  },
  "confirmationStatus": "pending"
}

Gere um plano REALISTA e PERSONALIZADO:`;
  }

  private parseAnnualPlanResponse(response: any): any {
    try {
      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Erro ao parsear resposta da IA');
      return this.generateLocalAnnualPlan();
    }
  }

  private generateLocalAnnualPlan(): any {
    return {
      vision: "Desenvolver habilidades técnicas e construir um portfólio sólido para avançar na carreira em tecnologia",
      hardGoals: [
        {
          id: "hard-1",
          title: "Dominar desenvolvimento full-stack",
          description: "Aprender e aplicar tecnologias modernas de frontend e backend através de projetos práticos",
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          xpValue: 500,
          progress: 0,
          mediumGoals: [
            {
              id: "medium-1-1",
              title: "Aprender React e TypeScript",
              description: "Dominar os fundamentos e padrões avançados de React e TypeScript",
              deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              hardGoalId: "hard-1",
              xpValue: 150,
              progress: 0,
              easyGoals: [
                {
                  id: "easy-1-1-1",
                  title: "Completar tutorial de React",
                  description: "Seguir tutorial oficial e criar primeira aplicação",
                  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  mediumGoalId: "medium-1-1",
                  xpValue: 50,
                  progress: 0,
                  dailyTasks: []
                }
              ]
            }
          ]
        }
      ],
      timeline: {
        quarters: [
          {
            name: "Q1 2024",
            focus: "Fundamentos e primeiros projetos",
            months: [
              {
                name: "Janeiro",
                easyGoals: ["Configurar ambiente", "Primeiro projeto React"],
                milestones: ["Ambiente configurado", "Primeira app funcionando"]
              }
            ]
          }
        ]
      },
      confirmationStatus: "pending"
    };
  }
}