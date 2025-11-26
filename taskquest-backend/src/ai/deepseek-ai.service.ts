import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GoalPlanDocument } from '../goals/schemas/goal-plan.schema';

@Injectable()
export class DeepSeekAIService {
  private readonly logger = new Logger(DeepSeekAIService.name);
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';
  private model: string = 'deepseek-chat';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY não encontrada no .env - Obtenha em: https://platform.deepseek.com/api_keys');
    }

    this.logger.log('🔧 DeepSeek AI Configurado - Abordagem Trimestral');
  }

  // ✅ MÉTODO PRINCIPAL: Plano Anual Estratégico
  async generateStrategicAnnualPlan(userData: any): Promise<any> {
    this.logger.log('🚀 GERANDO PLANO ANUAL ESTRATÉGICO...');

    const prompt = this.buildStrategicAnnualPrompt(userData);
    this.logger.log(`📝 Prompt (${prompt.length} caracteres)`);

    try {
      const result = await this.generateWithDeepSeek(prompt);
      
      // ✅ VALIDAÇÃO SIMPLIFICADA
      this.validateAnnualStructure(result);
      
      this.logger.log(`✅ PLANO GERADO: ${result.hardGoals?.length || 0} metas anuais`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ ERRO: ${error.message}`);
      throw new Error(`Falha ao gerar plano estratégico: ${error.message}`);
    }
  }

  // ✅ MÉTODO PARA FEEDBACK - USANDO O MESMO FORMATO
  async generatePlanWithFeedback(
    userData: any,
    feedback: string,
    currentPlan: any
  ): Promise<any> {
    this.logger.log('🔄 GERANDO PLANO REVISADO COM FEEDBACK...');

    const prompt = this.buildFeedbackPrompt(userData, feedback, currentPlan);

    try {
      const result = await this.generateWithDeepSeek(prompt);
      this.logger.log(`✅ PLANO REVISADO GERADO: ${result.hardGoals?.length || 0} metas`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ ERRO: ${error.message}`);
      throw new Error(`Falha ao gerar plano com feedback: ${error.message}`);
    }
  }

  // ✅ MÉTODO: Ajustar plano existente com feedback
  async adjustGoalPlan(existingPlan: GoalPlanDocument, feedback: string, userContext?: string): Promise<any> {
    this.logger.log('🔄 Ajustando plano anual com feedback...');

    try {
      const prompt = this.buildAdjustmentPrompt(existingPlan, feedback, userContext);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.model,
            messages: [
              {
                role: "system",
                content: "Você é um especialista em planejamento estratégico e ajuste de metas. Sua tarefa é ajustar um plano anual existente com base no feedback do usuário, mantendo a estrutura de trimestres e a relação entre metas EXTREME, HARD, MEDIUM e EASY."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 60000,
          }
        )
      );

      const content = response.data.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia do serviço de IA');
      }

      // Extrair o JSON da resposta
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      const adjustedPlan = JSON.parse(jsonString);

      this.logger.log('✅ Plano ajustado com sucesso com IA');
      return adjustedPlan;
    } catch (error) {
      this.logger.error('Erro ao ajustar plano com IA:', error);
      throw new Error('Falha ao ajustar plano com IA');
    }
  }

  // ✅ ALIAS para compatibilidade com PlanAdjustmentService
  async generateAdjustedPlan(prompt: string): Promise<any> {
    this.logger.log('🔄 Gerando plano ajustado via prompt...');
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.model,
            messages: [
              {
                role: "system",
                content: "Você é um especialista em planejamento estratégico. Retorne APENAS JSON válido."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 60000,
          }
        )
      );

      const content = response.data.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia do serviço de IA');
      }

      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      const adjustedPlan = JSON.parse(jsonString);

      this.logger.log('✅ Plano ajustado gerado com sucesso');
      return adjustedPlan;
    } catch (error) {
      this.logger.error('Erro ao gerar plano ajustado:', error);
      throw new Error('Falha ao gerar plano ajustado com IA');
    }
  }

  private buildAdjustmentPrompt(existingPlan: GoalPlanDocument, feedback: string, userContext?: string): string {
    const hoursPerWeek = existingPlan.hoursPerWeek || 10;

    return `Ajuste o plano anual existente com base no feedback do usuário.

## DADOS DO USUÁRIO:
- Visão: "${existingPlan.vision}"
- Horas/Semana: ${hoursPerWeek}h
- Objetivos: ${existingPlan.goals?.join(', ')}

## CONTEXTO ADICIONAL DO USUÁRIO:
${userContext || 'Não fornecido'}

## FEEDBACK DO USUÁRIO:
"${feedback}"

## PLANO ATUAL (JSON):
${JSON.stringify({
  strategicAnalysis: existingPlan.strategicAnalysis,
  hardGoals: existingPlan.hardGoals,
  mediumGoals: existingPlan.mediumGoals,
  easyGoals: existingPlan.easyGoals,
  quarters: existingPlan.quarters,
}, null, 2)}

## INSTRUÇÕES:
- Mantenha a estrutura de 4 trimestres
- Ajuste APENAS as partes problemáticas mencionadas no feedback
- MANTENHA as partes que estão boas
- PRESERVE a relação entre metas (EXTREME → HARD → MEDIUM → EASY)
- Ajuste prazos e descrições se necessário
- Foco em objetivos REALIZÁVEIS com ${hoursPerWeek}h/semana

## EXEMPLOS DE AJUSTES:
- Se o usuário disse "preciso ganhar massa, não perder", ajuste as metas de fitness para ganho muscular
- Se o usuário corrigiu dados (peso, BF, etc.), recalcule as metas baseadas nos dados corretos
- Se o usuário quer mais foco em uma área, redistribua as metas

## FORMATO DE RESPOSTA:
Retorne APENAS o JSON completo do plano ajustado, no mesmo formato do plano atual.

PLANO AJUSTADO (JSON):`;
  }

  private async generateWithDeepSeek(prompt: string): Promise<any> {
    try {
      this.logger.log('🔄 Processando com DeepSeek...');

      const requestData = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em planejamento estratégico. SEMPRE retorne JSON válido e bem formatado sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
        response_format: { type: 'json_object' }
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 600000,
          },
        ),
      );

      if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
        throw new Error('Resposta vazia do DeepSeek');
      }

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage?.total_tokens;
      
      this.logger.log(`📥 Resposta recebida: ${tokensUsed} tokens usados`);
      return this.parseAIResponse(content);
      
    } catch (error: any) {
      this.logger.error(`❌ Erro na API DeepSeek: ${error.message}`);
      
      if (error.response?.status === 429) {
        throw new Error('Limite de taxa excedido. Tente novamente em alguns segundos.');
      } else if (error.response?.status === 401) {
        throw new Error('API Key do DeepSeek inválida.');
      } else if (error.response?.status === 400) {
        if (error.message.includes('length')) {
          throw new Error('Objetivos muito longos. Tente ser mais conciso nos objetivos e visão.');
        }
        throw new Error('Prompt muito longo. Tente reduzir os objetivos.');
      }
      
      throw error;
    }
  }

  private parseAIResponse(content: string): any {
    try {
      let jsonString = content.trim();
      
      // Extrair JSON de code blocks se existir
      const jsonCodeBlock = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (jsonCodeBlock) {
        jsonString = jsonCodeBlock[1].trim();
      }

      // Limpar e validar
      jsonString = this.cleanAndValidateJson(jsonString);
      
      const parsed = JSON.parse(jsonString);
      
      // ✅ GARANTIR que temos easyGoals e mediumGoals (necessários para o sistema)
      if (!parsed.easyGoals) parsed.easyGoals = [];
      if (!parsed.mediumGoals) parsed.mediumGoals = [];
      
      return parsed;
      
    } catch (error) {
      this.logger.error(`❌ Erro no parse do JSON: ${error.message}`);
      throw new Error(`Resposta da IA em formato inválido: ${error.message}`);
    }
  }

  private cleanAndValidateJson(jsonString: string): string {
    jsonString = jsonString.replace(/\/\/.*$/gm, '');
    jsonString = jsonString.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    jsonString = jsonString.replace(/'([^']+)'(?=\s*:)/g, '"$1"');
    jsonString = jsonString.replace(/(?<!\\)'([^']*?[^\\])?'/g, '"$1"');
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
    jsonString = jsonString.replace(/(?<!\\)\\n/g, '\\\\n');
    
    return jsonString.trim();
  }

  private validateAnnualStructure(parsed: any): void {
    const required = ['hardGoals'];
    
    for (const field of required) {
      if (!parsed[field] || !Array.isArray(parsed[field])) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    if (parsed.hardGoals.length === 0) throw new Error('Nenhuma HARD goal gerada');
  }

  // ✅ PROMPT SIMPLIFICADO E OTIMIZADO
  private buildStrategicAnnualPrompt(userData: any): string {
    const currentYear = new Date().getFullYear();
    const userGoals = userData.goals || [];
    const hoursPerWeek = userData.hoursPerWeek || 10;
    const vision = userData.vision || 'Não definida';

    return `Crie um plano anual estratégico baseado nestes dados:

VISÃO: "${vision}"
HORAS/SEMANA: ${hoursPerWeek}h
OBJETIVOS: ${userGoals.join(', ')}

## FORMATO REQUERIDO - ATUALIZADO:

{
  "strategicAnalysis": "Análise estratégica concisa",
  "hardGoals": [
    {
      "id": "hard-1",
      "title": "Meta anual 1",
      "description": "Descrição SMART",
      "category": "career|finance|health|skills|relationships",
      "deadline": "${currentYear}-12-31",
      "xpValue": 1000,
      "progress": 0
    }
  ],
  "mediumGoals": [
    {
      "id": "medium-1-1", 
      "title": "Meta trimestral 1",
      "description": "Descrição específica",
      "hardGoalId": "hard-1",
      "deadline": "${currentYear}-03-31",
      "xpValue": 300,
      "progress": 0
    }
  ],
  "easyGoals": [
    {
      "id": "easy-1-1-1",
      "title": "Meta semanal 1",
      "description": "Ação executável",
      "mediumGoalId": "medium-1-1",
      "deadline": "${currentYear}-01-31",
      "xpValue": 100,
      "progress": 0,
      "dailyTasks": [
        {
          "id": "daily-1-1-1",
          "title": "Tarefa diária específica 1",
          "description": "Descrição detalhada da tarefa",
          "estimatedMinutes": 30,
          "priority": "high"
        },
        {
          "id": "daily-1-1-2", 
          "title": "Tarefa diária específica 2",
          "description": "Descrição detalhada da tarefa",
          "estimatedMinutes": 45,
          "priority": "medium"
        },
        {
          "id": "daily-1-1-3",
          "title": "Tarefa diária específica 3", 
          "description": "Descrição detalhada da tarefa",
          "estimatedMinutes": 60,
          "priority": "low"
        }
      ]
    }
  ]
}

INSTRUÇÕES CRÍTICAS:
- Cada EASY goal DEVE ter EXATAMENTE 3 dailyTasks
- Daily tasks devem ser REALIZÁVEIS em 30-60 minutos
- Foco em objetivos REALIZÁVEIS com ${hoursPerWeek}h/semana
- Metas devem cobrir TODOS os objetivos do usuário

RETORNE APENAS JSON:`;
  }

  // ✅ PROMPT PARA FEEDBACK
  private buildFeedbackPrompt(userData: any, feedback: string, currentPlan: any): string {
    return `Revise este plano anual com base no feedback:

PLANO ATUAL:
${JSON.stringify(currentPlan, null, 2).substring(0, 2000)}

FEEDBACK DO USUÁRIO: "${feedback}"

DADOS DO USUÁRIO:
- Visão: "${userData.vision}"
- Horas/Semana: ${userData.hoursPerWeek}h
- Objetivos: ${userData.goals?.join(', ')}

INSTRUÇÕES:
1. Mantenha a estrutura JSON original
2. Ajuste com base no feedback
3. Mantenha realisticidade com ${userData.hoursPerWeek}h/semana
4. Foco em resultados práticos

RETORNE O PLANO REVISADO EM JSON:`;
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const requestData = {
        model: this.model,
        messages: [{ role: 'user', content: 'Responda em JSON: {"status": "ok", "message": "DeepSeek funcionando"}' }],
        max_tokens: 50,
        stream: false,
        response_format: { type: 'json_object' }
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/completions`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000,
          },
        ),
      );

      return {
        success: true,
        message: '✅ DeepSeek conectado',
        details: {
          model: this.model,
          tokens_used: response.data.usage?.total_tokens,
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Falha na conexão com DeepSeek',
        details: {
          error: error.message,
          setup_instructions: [
            '1. Obtenha API key em: https://platform.deepseek.com/api_keys',
            '2. Adicione DEEPSEEK_API_KEY no .env',
            '3. Recarregue a aplicação'
          ]
        }
      };
    }
  }
}