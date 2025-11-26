import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeepSeekAIService {
  private readonly logger = new Logger(DeepSeekAIService.name);
  private apiKey: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    this.baseUrl = this.configService.get<string>('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1');
  }

  async generateYearlyPlan(userData: any): Promise<any> {
    // Se não tiver API key, usar fallback imediatamente
    if (!this.apiKey || this.apiKey === 'sua-api-key-aqui') {
      this.logger.warn('⚠️ API Key não configurada, usando fallback local');
      return this.generateLocalPlan(userData);
    }

    const prompt = this.buildYearlyPlanPrompt(userData);
    
    try {
      this.logger.log('🌐 Chamando DeepSeek API para gerar plano anual...');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em planejamento estratégico e produtividade. 
                Crie um plano anual detalhado baseado nos objetivos do usuário.`
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            stream: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 30000,
          },
        ),
      );

      this.logger.log('✅ Resposta recebida da DeepSeek');
      return this.parsePlanResponse(response.data);
      
    } catch (error: any) {
      this.logger.error('❌ Erro ao chamar DeepSeek:', error.response?.data || error.message);
      this.logger.log('🔄 Usando fallback local...');
      return this.generateLocalPlan(userData);
    }
  }

  private buildYearlyPlanPrompt(userData: any): string {
    return `
CRIE UM PLANO ANUAL DETALHADO PARA O USUÁRIO:

VISÃO PRINCIPAL: ${userData.vision}

OBJETIVOS ESPECÍFICOS:
${userData.goals.map((goal: string, i: number) => `${i+1}. ${goal}`).join('\n')}

DESAFIOS: ${userData.challenges.join(', ')}
FERRAMENTAS DISPONÍVEIS: ${userData.tools?.join(', ') || 'Nenhuma especificada'}
HORAS/SEMANA: ${userData.hoursPerWeek || 'Não especificado'}

---

CRIE UM PLANO COM ESTA ESTRUTURA:

1. METAS HARD (Anuais - 3-5 objetivos principais)
2. METAS MEDIUM (Mensais - 3-4 por meta HARD)  
3. METAS EASY (Semanais - 4-5 por meta MEDIUM)

FORMATO DE RESPOSTA (JSON VÁLIDO):
{
  "hardGoals": [...],
  "mediumGoals": [...],
  "easyGoals": [...]
}
`;
  }

  private parsePlanResponse(response: any): any {
    try {
      const content = response.choices[0]?.message?.content;
      
      // Tenta extrair JSON se houver texto adicional
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      
      const parsed = JSON.parse(jsonString);
      
      // Valida estrutura básica
      if (!parsed.hardGoals || !Array.isArray(parsed.hardGoals)) {
        throw new Error('Estrutura de metas HARD inválida');
      }
      
      this.logger.log(`📊 Plano gerado: ${parsed.hardGoals.length} HARD, ${parsed.mediumGoals?.length || 0} MEDIUM, ${parsed.easyGoals?.length || 0} EASY`);
      
      return parsed;
      
    } catch (error) {
      this.logger.error('❌ Erro ao parsear resposta da IA:', error);
      throw new Error('Resposta da IA em formato inválido');
    }
  }

  private generateLocalPlan(userData: any): any {
    this.logger.log('🔄 Gerando plano local (fallback)...');
    
    const primaryTool = userData.tools?.[0] || 'tecnologias escolhidas';
    const primaryGoal = userData.goals?.[0] || 'seus objetivos';

    const hardGoals = [
      {
        id: 'hard-1',
        title: `Dominar ${primaryTool} e aplicar em projetos reais`,
        description: `Desenvolver proficiência em ${primaryTool} através de projetos práticos que demonstrem competência profissional para ${userData.vision}`,
        category: 'career',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        successMetrics: [
          '3 projetos completos no portfolio',
          'Capacidade de resolver problemas complexos',
          'Compreensão dos conceitos avançados'
        ],
        xpValue: 500,
        progress: 0
      },
      {
        id: 'hard-2',
        title: 'Estabelecer presença profissional e networking',
        description: 'Construir uma rede de contatos profissionais e presença online que abra oportunidades de carreira e colaboração',
        category: 'career',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        successMetrics: [
          'Perfil LinkedIn otimizado com 500+ conexões',
          'Participação em 3 comunidades técnicas',
          'Contribuições para projetos open source'
        ],
        xpValue: 500,
        progress: 0
      },
      {
        id: 'hard-3',
        title: 'Desenvolver habilidades de resolução de problemas',
        description: 'Aprimorar a capacidade de analisar, decompor e resolver problemas complexos de forma sistemática e eficiente',
        category: 'skills',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        successMetrics: [
          'Resolução de 50+ problemas complexos',
          'Participação em hackathons ou competições',
          'Feedback positivo sobre abordagem de problemas'
        ],
        xpValue: 500,
        progress: 0
      }
    ];

    const mediumGoals = [
      // Mês 1-3: Fundamentos
      {
        id: 'medium-1-1',
        title: `Aprender fundamentos de ${primaryTool}`,
        description: `Compreender os conceitos básicos e criar primeiros projetos em ${primaryTool}`,
        hardGoalId: 'hard-1',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        month: 1,
        deliverables: [
          'Ambiente de desenvolvimento configurado',
          'Primeiro projeto tutorial concluído',
          'Documentação de aprendizado'
        ],
        xpValue: 150,
        progress: 0
      },
      {
        id: 'medium-1-2',
        title: 'Estabecer base de conhecimento teórico',
        description: 'Desenvolver compreensão sólida dos conceitos teóricos por trás das tecnologias',
        hardGoalId: 'hard-1',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        month: 2,
        deliverables: [
          'Revisão de documentação oficial',
          'Resumo de conceitos-chave',
          'Mapa mental do ecossistema'
        ],
        xpValue: 150,
        progress: 0
      },
      {
        id: 'medium-1-3',
        title: 'Criar projeto pessoal inicial',
        description: 'Desenvolver primeiro projeto independente aplicando conceitos aprendidos',
        hardGoalId: 'hard-1',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        month: 3,
        deliverables: [
          'Projeto funcional no GitHub',
          'Documentação do projeto',
          'Demonstração do projeto'
        ],
        xpValue: 150,
        progress: 0
      },
      // Mês 4-6: Aprofundamento
      {
        id: 'medium-2-1',
        title: 'Avançar para conceitos intermediários',
        description: `Explorar funcionalidades avançadas e padrões de ${primaryTool}`,
        hardGoalId: 'hard-1',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        month: 4,
        deliverables: [
          'Projeto com arquitetura mais complexa',
          'Implementação de padrões avançados',
          'Otimização de performance'
        ],
        xpValue: 150,
        progress: 0
      }
    ];

    const easyGoals = [
      // Semana 1-2: Configuração e Fundamentos
      {
        id: 'easy-1-1-1',
        title: 'Configurar ambiente de desenvolvimento',
        description: 'Instalar e configurar todas as ferramentas necessárias para começar',
        mediumGoalId: 'medium-1-1',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        week: 1,
        actions: [
          'Instalar IDE/editor',
          'Configurar versionamento (Git)',
          'Instalar dependências principais'
        ],
        xpValue: 50,
        category: 'setup',
        progress: 0
      },
      {
        id: 'easy-1-1-2',
        title: 'Completar tutorial introdutório',
        description: 'Seguir um tutorial passo a passo para entender o básico',
        mediumGoalId: 'medium-1-1',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        week: 2,
        actions: [
          'Escolher tutorial adequado',
          'Codificar junto com o tutorial',
          'Fazer anotações do aprendizado'
        ],
        xpValue: 50,
        category: 'learning',
        progress: 0
      },
      {
        id: 'easy-1-2-1',
        title: 'Revisar documentação oficial',
        description: 'Estudar a documentação para compreensão teórica',
        mediumGoalId: 'medium-1-2',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        week: 3,
        actions: [
          'Ler guia de introdução',
          'Explorar exemplos de código',
          'Criar resumo dos conceitos'
        ],
        xpValue: 50,
        category: 'theory',
        progress: 0
      },
      {
        id: 'easy-1-3-1',
        title: 'Planejar primeiro projeto',
        description: 'Definir escopo e requisitos do projeto inicial',
        mediumGoalId: 'medium-1-3',
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        week: 4,
        actions: [
          'Brainstorm de ideias',
          'Definir funcionalidades',
          'Criar protótipo no papel'
        ],
        xpValue: 50,
        category: 'planning',
        progress: 0
      }
    ];

    return {
      hardGoals,
      mediumGoals,
      easyGoals
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'sua-api-key-aqui') {
      return false;
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }),
      );
      return true;
    } catch (error) {
      this.logger.error('❌ Falha na conexão com DeepSeek:', error.message);
      return false;
    }
  }
}