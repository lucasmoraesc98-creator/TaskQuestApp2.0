import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';

import { User } from '../users/schemas/user.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiApiKey: string;
  private suggestionRotation = new Map<string, any>();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  // **SISTEMA DE ROTAÇÃO DE SUGESTÕES**
  async generateRotatedSuggestions(userId: string, goals: string[], challenges: string[], count: number = 3) {
    const rotationKey = `${userId}-${goals.join(',')}-${challenges.join(',')}`;
    
    // Inicializa rotação
    let rotation = this.suggestionRotation.get(rotationKey);
    if (!rotation) {
      rotation = {
        usedSuggestions: new Set(),
        rotationIndex: 0,
        maxRotations: 3,
      };
      this.suggestionRotation.set(rotationKey, rotation);
    }

    // Se já usou todas as rotações, reinicia
    if (rotation.rotationIndex >= rotation.maxRotations) {
      this.logger.log(`🔄 Reiniciando rotação de sugestões para usuário: ${userId}`);
      rotation.usedSuggestions.clear();
      rotation.rotationIndex = 0;
    }

    // Gera sugestões únicas
    let suggestions = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (suggestions.length < count && attempts < maxAttempts) {
      const newBatch = await this.generateHighQualitySuggestions(goals, challenges, count * 2);
      
      // Filtra sugestões já usadas
      const uniqueSuggestions = newBatch.filter(suggestion => 
        !rotation.usedSuggestions.has(this.getSuggestionHash(suggestion))
      );

      suggestions.push(...uniqueSuggestions.slice(0, count - suggestions.length));
      attempts++;
    }

    // Se não conseguiu sugestões suficientes, limpa o histórico
    if (suggestions.length < count) {
      this.logger.log('🔄 Limpando histórico por falta de sugestões novas');
      rotation.usedSuggestions.clear();
      suggestions = await this.generateHighQualitySuggestions(goals, challenges, count);
    }

    // Marca as sugestões como usadas
    suggestions.forEach(suggestion => {
      rotation.usedSuggestions.add(this.getSuggestionHash(suggestion));
    });

    rotation.rotationIndex++;
    
    this.logger.log(`🎯 Rodada ${rotation.rotationIndex}/${rotation.maxRotations} - ${suggestions.length} sugestões para usuário: ${userId}`);
    
    return suggestions;
  }

  // **MÉTODO: Cria hash único para cada sugestão**
  private getSuggestionHash(suggestion: any): string {
    return `${suggestion.text}-${suggestion.xp}`.toLowerCase().replace(/\s+/g, '-');
  }

  // **MÉTODO PRINCIPAL: Gera sugestões de alta qualidade**
  async generateHighQualitySuggestions(goals: string[], challenges: string[], count: number = 3) {
    // Se IA habilitada, tenta gerar sugestões avançadas
    if (this.openaiApiKey) {
      try {
        const prompt = this.buildHighQualityPrompt(goals, challenges, count);
        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 500,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`,
              },
            },
          ),
        );

        const suggestions = this.parseAIResponse(response.data);
        if (suggestions && suggestions.length >= count) {
          return this.shuffleArray(suggestions).slice(0, count);
        }
      } catch (error) {
        this.logger.warn('IA avançada falhou, usando método aprimorado:', error);
      }
    }
    
    // Fallback: método aprimorado baseado em objetivos
    const suggestions = this.getEnhancedGoalBasedSuggestions(goals, challenges, count * 2);
    return this.shuffleArray(suggestions).slice(0, count);
  }

  // **MÉTODO: Embaralha array para variedade**
  private shuffleArray(array: any[]) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // **MÉTODO: Prompt aprimorado para a IA**
  private buildHighQualityPrompt(goals: string[], challenges: string[], count: number): string {
    return `Como um especialista em psicologia da produtividade e coach executivo, gere EXATAMENTE ${count} sugestões de tarefas ALTAMENTE PERSONALIZADAS e EFICAZES.

CONTEXTO DO USUÁRIO:
- OBJETIVOS PRINCIPAIS: ${goals.join(', ')}
- DESAFIOS ATUAIS: ${challenges.join(', ')}

DIRETRIZES PARA AS SUGESTÕES:
1. Cada sugestão deve ser ESPECÍFICA, ACIONÁVEL e ter IMPACTO MENSURÁVEL
2. Baseie-se em princípios de psicologia comportamental e produtividade científica
3. Considere os desafios específicos do usuário para criar soluções práticas
4. Explique o BENEFÍCIO COMPORTAMENTAL ou PSICOLÓGICO de cada tarefa
5. Use técnicas comprovadas (Pomodoro, Time Blocking, Habit Stacking, etc.)

FORMATO REQUERIDO (JSON):
{
    "suggestions": [
        {
            "text": "Tarefa específica e acionável",
            "xp": 100,
            "type": "IMPACTO FINANCEIRO/SAÚDE/PEQUENO PASSO",
            "reason": "Explicação detalhada do benefício psicológico/comportamental baseada em pesquisas"
        }
    ]
}

Gere EXATAMENTE ${count} sugestões diversificadas e de alto impacto:`;
  }

  // **MÉTODO: Parse da resposta da IA**
  private parseAIResponse(response: any): any[] {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      // Tenta parsear como JSON
      const parsed = JSON.parse(content);
      return parsed.suggestions || [];
    } catch (error) {
      // Fallback: extrai tarefas do texto
      return this.extractTasksFromText(response.choices[0]?.message?.content || '');
    }
  }

  private extractTasksFromText(text: string): any[] {
    const tasks = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('XP') || line.includes('xp') || line.includes('+')) {
        const xpMatch = line.match(/(\d+)XP/i) || line.match(/\+(\d+)/);
        const xp = xpMatch ? parseInt(xpMatch[1]) : 10;
        
        // Extrai o texto da tarefa
        const taskText = line.replace(/\(.*?XP.*?\)/gi, '')
                            .replace(/\+?\d+XP/gi, '')
                            .replace(/\d+XP/gi, '')
                            .trim();
        
        if (taskText && taskText.length > 5) {
          tasks.push({
            text: taskText,
            xp: xp,
            type: this.classifyTaskType(xp),
            reason: "Sugerido pela IA baseado em seus objetivos"
          });
        }
      }
    });

    return tasks.length > 0 ? tasks : this.getDefaultSuggestions();
  }

  private classifyTaskType(xp: number): string {
    if (xp >= 100) return "IMPACTO FINANCEIRO";
    if (xp >= 50) return "IMPACTO SAÚDE";
    return "PEQUENO PASSO";
  }

  private getDefaultSuggestions(): any[] {
    return [
      {
        text: "Revisar e atualizar metas trimestrais",
        xp: 100,
        type: "IMPACTO FINANCEIRO",
        reason: "Manter metas atualizadas aumenta chances de sucesso em 40%"
      },
      {
        text: "Fazer 30 minutos de atividade física",
        xp: 50,
        type: "IMPACTO SAÚDE", 
        reason: "Exercícios regulares melhoram produtividade e energia"
      },
      {
        text: "Organizar espaço de trabalho",
        xp: 10,
        type: "PEQUENO PASSO",
        reason: "Ambiente organizado reduz distrações e estresse"
      }
    ];
  }

  // **MÉTODO: Sugestões baseadas em objetivos (EXPANDIDO)**
  private getEnhancedGoalBasedSuggestions(goals: string[], challenges: string[], count: number = 6): any[] {
    const allSuggestions = [];
    
    // Mapeamento expandido de objetivos para sugestões
    const goalMappings = {
      'financeiro': [
        {
          text: "Implementar sistema de orçamento 50/30/20 para o próximo mês",
          xp: 100,
          type: "IMPACTO FINANCEIRO",
          reason: "Baseado no princípio de alocação consciente de recursos - comprovado para reduzir estresse financeiro em 40%"
        },
        {
          text: "Realizar auditoria de assinaturas e cancelar 1 serviço não essencial",
          xp: 50,
          type: "IMPACTO FINANCEIRO",
          reason: "Redução de custos recorrentes libera recursos para objetivos prioritários"
        }
      ],
      
      'saúde': [
        {
          text: "Implementar técnica Pomodoro com pausas ativas de 5min a cada 25min",
          xp: 50,
          type: "IMPACTO SAÚDE", 
          reason: "Melhora a circulação sanguínea e reduz fadiga mental - aumenta produtividade em 25%"
        },
        {
          text: "Preparar lanches proteicos para a semana para evitar picos de açúcar",
          xp: 50,
          type: "IMPACTO SAÚDE",
          reason: "Estabiliza níveis de energia e evita o 'crash' pós-almoço que prejudica a produtividade"
        }
      ],
      
      'aprender': [
        {
          text: "Praticar técnica de aprendizagem ativa Feynman por 30min em novo tópico",
          xp: 50,
          type: "IMPACTO SAÚDE",
          reason: "Aprendizagem ativa aumenta retenção em 70% comparado à leitura passiva"
        }
      ],
      
      'produtividade': [
        {
          text: "Implementar ritual matinal de 15min com planejamento e intenção do dia",
          xp: 10,
          type: "PEQUENO PASSO", 
          reason: "Rituais matinais estabelecem tom produtivo e reduzem decisões fatigantes"
        }
      ]
    };

    // Mapeamento de desafios para soluções
    const challengeMappings = {
      'tempo': [
        {
          text: "Aplicar técnica Time Blocking para agendar tarefas prioritárias primeiro",
          xp: 10,
          type: "PEQUENO PASSO",
          reason: "Defesa proativa do tempo previne urgências e reduz estresse por prazos"
        }
      ],
      'foco': [
        {
          text: "Configurar ambiente de trabalho com iluminação adequada e sem notificações",
          xp: 10,
          type: "PEQUENO PASSO",
          reason: "Ambiente otimizado reduz custo cognitivo de resistir a distrações em 60%"
        }
      ]
    };

    // Coleta sugestões baseadas em objetivos
    goals.forEach(goal => {
      const goalLower = goal.toLowerCase();
      Object.keys(goalMappings).forEach(key => {
        if (goalLower.includes(key)) {
          allSuggestions.push(...goalMappings[key]);
        }
      });
    });

    // Coleta sugestões baseadas em desafios
    challenges.forEach(challenge => {
      const challengeLower = challenge.toLowerCase();
      Object.keys(challengeMappings).forEach(key => {
        if (challengeLower.includes(key)) {
          allSuggestions.push(...challengeMappings[key]);
        }
      });
    });

    // Remove duplicatas
    const uniqueSuggestions = allSuggestions.filter((s, index, self) =>
      index === self.findIndex((t) => t.text === s.text)
    );

    // Se não houver sugestões suficientes, completa com sugestões avançadas
    if (uniqueSuggestions.length < count) {
      const advancedSuggestions = this.getAdvancedDefaultSuggestions();
      uniqueSuggestions.push(...advancedSuggestions);
    }

    return this.shuffleArray(uniqueSuggestions).slice(0, count);
  }

  private getAdvancedDefaultSuggestions(): any[] {
    return [
      {
        text: "Realizar revisão semanal de progresso com ajuste de estratégias",
        xp: 100,
        type: "IMPACTO FINANCEIRO",
        reason: "Reflexão sistemática aumenta taxa de sucesso em objetivos em 3x segundo estudos de desempenho"
      },
      {
        text: "Praticar exercícios de respiração 4-7-8 por 5min antes de tarefas complexas",
        xp: 50,
        type: "IMPACTO SAÚDE",
        reason: "Ativa sistema nervoso parassimpático - reduz cortisol e melhora tomada de decisão em 30%"
      }
    ];
  }

  // **NOVO MÉTODO: Análise de distribuição de tarefas**
  analyzeTaskDistribution(tasks: any[]) {
    const totalTasks = tasks.length;
    if (totalTasks === 0) {
      return {
        finance: { assigned: 0, completed: 0, percentage: 0 },
        health: { assigned: 0, completed: 0, percentage: 0 },
        steps: { assigned: 0, completed: 0, percentage: 0 },
        totalTasks: 0,
        completionRate: 0,
        balanceScore: 0,
        suggestions: []
      };
    }

    // Calcula distribuição por tipo
    const financeTasks = tasks.filter(task => task.xp === 100);
    const healthTasks = tasks.filter(task => task.xp === 50);
    const stepTasks = tasks.filter(task => task.xp === 10);

    const financeCompleted = financeTasks.filter(task => task.completed).length;
    const healthCompleted = healthTasks.filter(task => task.completed).length;
    const stepCompleted = stepTasks.filter(task => task.completed).length;

    const distribution = {
      finance: {
        assigned: financeTasks.length,
        completed: financeCompleted,
        percentage: Math.round((financeTasks.length / totalTasks) * 100)
      },
      health: {
        assigned: healthTasks.length,
        completed: healthCompleted,
        percentage: Math.round((healthTasks.length / totalTasks) * 100)
      },
      steps: {
        assigned: stepTasks.length,
        completed: stepCompleted,
        percentage: Math.round((stepTasks.length / totalTasks) * 100)
      },
      totalTasks: totalTasks,
      completionRate: Math.round((tasks.filter(t => t.completed).length / totalTasks) * 100)
    };

    // Calcula score de equilíbrio (0-100)
    const balanceScore = this.calculateBalanceScore(distribution);
    distribution['balanceScore'] = balanceScore;

    // Gera sugestões personalizadas
    distribution['suggestions'] = this.generateBalanceSuggestions(distribution);

    return distribution;
  }

  // **MÉTODO: Calcula score de equilíbrio**
  private calculateBalanceScore(current: any): number {
    const idealDistribution = { finance: 10, health: 30, steps: 60 };
    let score = 100;
    
    // Penaliza desvios da distribuição ideal
    const financeDeviation = Math.abs(current.finance.percentage - idealDistribution.finance);
    const healthDeviation = Math.abs(current.health.percentage - idealDistribution.health);
    const stepsDeviation = Math.abs(current.steps.percentage - idealDistribution.steps);
    
    score -= (financeDeviation + healthDeviation + stepsDeviation) / 3;
    
    // Bônus por taxa de conclusão alta
    if (current.completionRate > 80) score += 10;
    if (current.completionRate > 90) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // **MÉTODO: Gera sugestões de equilíbrio**
  private generateBalanceSuggestions(distribution: any): string[] {
    const suggestions = [];
    const { finance, health, steps, completionRate } = distribution;

    // Sugestões baseadas na distribuição
    if (finance.percentage > 20) {
      suggestions.push("🎯 <strong>Muitas tarefas financeiras</strong> - Considere focar em 1-2 tarefas de alto impacto por dia em vez de várias");
    } else if (finance.percentage < 5) {
      suggestions.push("💰 <strong>Poucas tarefas financeiras</strong> - Adicione mais atividades que gerem retorno financeiro ou profissional");
    }

    if (health.percentage > 45) {
      suggestions.push("❤️ <strong>Excelente foco em saúde!</strong> - Mantenha esse equilíbrio para produtividade sustentável");
    } else if (health.percentage < 20) {
      suggestions.push("💪 <strong>Mais cuidado com a saúde</strong> - Atividades físicas e mentais melhoram energia e foco");
    }

    if (steps.percentage > 80) {
      suggestions.push("🌱 <strong>Muitas pequenas tarefas</strong> - Combine micro-tarefas em atividades mais significativas");
    } else if (steps.percentage < 45) {
      suggestions.push("✅ <strong>Poucos hábitos diários</strong> - Pequenos passos consistentes criam progresso duradouro");
    }

    // Sugestões baseadas na taxa de conclusão
    if (completionRate < 50) {
      suggestions.push("📉 <strong>Baixa taxa de conclusão</strong> - Tarefas podem estar muito complexas. Quebre em partes menores");
    } else if (completionRate > 85) {
      suggestions.push("🚀 <strong>Excelente execução!</strong> - Você está dominando seu fluxo de trabalho");
    }

    // Sugestão de equilíbrio geral
    if (distribution.balanceScore >= 80) {
      suggestions.push("🎉 <strong>Distribuição equilibrada!</strong> - Seu mix de tarefas está otimizado para produtividade sustentável");
    } else {
      suggestions.push("⚖️ <strong>Busque melhor equilíbrio</strong> - Alinhe suas tarefas com a proporção ideal: 10% financeiro, 30% saúde, 60% pequenos passos");
    }

    return suggestions;
  }

  // **MÉTODO: Para compatibilidade**
  async generatePersonalizedTasks(userId: string, userGoals: string[], currentChallenges: string[]) {
    return this.generateRotatedSuggestions(userId, userGoals, currentChallenges, 3);
  }

  // **MÉTODO: Testar chave da OpenAI**
  async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
          },
        ),
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}