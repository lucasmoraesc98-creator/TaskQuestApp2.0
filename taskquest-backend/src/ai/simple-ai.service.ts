import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SimpleAIService {
  private readonly logger = new Logger(SimpleAIService.name);
  private apiKey: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || 'sua-api-key-aqui';
  }

  async generateYearlyPlan(userData: any): Promise<any> {
    // Se não tem API key, usa fallback local
    if (!this.apiKey || this.apiKey === 'sua-api-key-aqui') {
      this.logger.log('🔄 Usando plano local (fallback)');
      return this.generateLocalPlan(userData);
    }

    try {
      this.logger.log('🌐 Tentando conectar com DeepSeek...');
      
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em planejamento. Retorne APENAS JSON.'
              },
              {
                role: 'user',
                content: `Crie um plano anual em JSON com hardGoals, mediumGoals, easyGoals para: ${JSON.stringify(userData)}`
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 15000,
          },
        ),
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.logger.error('❌ DeepSeek falhou, usando fallback local');
      return this.generateLocalPlan(userData);
    }
  }

  private parseResponse(response: any): any {
    try {
      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Erro ao parsear resposta da IA');
      return this.generateLocalPlan({});
    }
  }

  private generateLocalPlan(userData: any): any {
    this.logger.log('📝 Gerando plano local...');
    
    const vision = userData.vision || 'Alcançar objetivos profissionais';
    const primaryTool = userData.tools?.[0] || 'tecnologias';

    return {
      hardGoals: [
        {
          id: 'hard-1',
          title: `Dominar ${primaryTool} em 12 meses`,
          description: `Aprender e aplicar ${primaryTool} através de projetos práticos para ${vision}`,
          category: 'career',
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 500,
          progress: 0
        },
        {
          id: 'hard-2',
          title: 'Construir portfolio profissional',
          description: 'Desenvolver 3-5 projetos que demonstrem habilidades e conquistas',
          category: 'career', 
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 500,
          progress: 0
        }
      ],
      mediumGoals: [
        {
          id: 'medium-1-1',
          title: `Aprender fundamentos de ${primaryTool}`,
          description: `Compreender conceitos básicos e criar primeiros projetos em ${primaryTool}`,
          hardGoalId: 'hard-1',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 150,
          progress: 0
        },
        {
          id: 'medium-1-2', 
          title: 'Desenvolver projeto inicial',
          description: 'Criar primeiro projeto completo aplicando conhecimentos',
          hardGoalId: 'hard-1',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 150,
          progress: 0
        }
      ],
      easyGoals: [
        {
          id: 'easy-1-1-1',
          title: 'Configurar ambiente de desenvolvimento',
          description: 'Instalar e configurar ferramentas necessárias',
          mediumGoalId: 'medium-1-1',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 50,
          progress: 0
        },
        {
          id: 'easy-1-1-2',
          title: 'Completar tutorial introdutório', 
          description: 'Seguir tutorial passo a passo para entender o básico',
          mediumGoalId: 'medium-1-1',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          xpValue: 50,
          progress: 0
        }
      ]
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'sua-api-key-aqui') {
      return false;
    }

    try {
      await firstValueFrom(
        this.httpService.get('https://api.deepseek.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}