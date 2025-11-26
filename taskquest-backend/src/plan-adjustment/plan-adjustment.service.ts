import { Injectable, Logger } from '@nestjs/common';
import { DeepSeekAIService } from '../ai/deepseek-ai.service';
import { GoalPlanDocument } from '../goals/schemas/goal-plan.schema';

@Injectable()
export class PlanAdjustmentService {
  private readonly logger = new Logger(PlanAdjustmentService.name);

  constructor(private deepSeekAIService: DeepSeekAIService) {}

  async generateAdjustmentPrompt(
    currentPlan: GoalPlanDocument, 
    feedback: string,
    userContext?: string
  ): Promise<string> {
    const hoursPerWeek = currentPlan.hoursPerWeek || 10;

    return `AJUSTE DE PLANO ANUAL - FEEDBACK DO USUÁRIO

## CONTEXTO ATUAL DO USUÁRIO:
${userContext || 'Não fornecido'}

## FEEDBACK SOBRE O PLANO ATUAL:
"${feedback}"

## PLANO ATUAL EXISTENTE (JSON):
${JSON.stringify({
  strategicAnalysis: currentPlan.strategicAnalysis,
  quarters: currentPlan.quarters,
  extremeGoals: currentPlan.extremeGoals,
  hardGoals: currentPlan.hardGoals,
  mediumGoals: currentPlan.mediumGoals,
  easyGoals: currentPlan.easyGoals,
}, null, 2)}

## INSTRUÇÕES CRÍTICAS PARA AJUSTE:

1. MANTENHA a estrutura de 4 trimestres
2. AJUSTE APENAS as partes problemáticas mencionadas no feedback
3. MANTENHA as partes que estão boas
4. PRESERVE a relação hierárquica entre metas (EXTREME → HARD → MEDIUM → EASY)
5. GARANTIR que cada EASY goal tenha dailyTasks executáveis
6. Foco em objetivos REALIZÁVEIS com ${hoursPerWeek}h/semana
7. MANTENHA a estrutura de IDs para preservar relações entre metas
8. SE o feedback não mencionar mudanças em certas áreas, MANTENHA essas áreas intactas

## EXEMPLOS DE AJUSTES:
- Se o usuário disse "preciso ganhar massa, não perder", ajuste APENAS as metas de fitness relacionadas
- Se o usuário corrigiu dados (peso, BF, etc.), recalcule APENAS as metas baseadas nos dados corretos
- Se o usuário quer mais foco em uma área, redistribua APENAS as metas dessa área específica

## FORMATO DE RESPOSTA:
Retorne APENAS o JSON completo do plano ajustado, no mesmo formato do plano atual, garantindo que TODAS as estruturas de metas estejam presentes.

PLANO AJUSTADO (JSON):`;
  }

  async adjustGoalPlan(
    currentPlan: GoalPlanDocument, 
    feedback: string, 
    userContext?: string
  ): Promise<any> {
    try {
      this.logger.log(`🔄 Ajustando plano para usuário ${currentPlan.userId} com feedback`);

      const prompt = await this.generateAdjustmentPrompt(currentPlan, feedback, userContext);
      
      const adjustedPlan = await this.deepSeekAIService.generateAdjustedPlan(prompt);
      
      // ✅ CORREÇÃO: Validar se o plano ajustado tem estrutura completa
      this.validateAdjustedPlanStructure(adjustedPlan);
      
      this.logger.log(`✅ Plano ajustado com sucesso para usuário ${currentPlan.userId}`);
      this.logger.log(`📊 Estrutura: ${adjustedPlan.extremeGoals?.length || 0} extreme, ${adjustedPlan.hardGoals?.length || 0} hard, ${adjustedPlan.mediumGoals?.length || 0} medium, ${adjustedPlan.easyGoals?.length || 0} easy`);
      
      return adjustedPlan;
    } catch (error) {
      this.logger.error('❌ Erro ao ajustar plano:', error);
      throw new Error('Falha ao ajustar plano com IA');
    }
  }

  private validateAdjustedPlanStructure(adjustedPlan: any): void {
    if (!adjustedPlan) {
      throw new Error('Plano ajustado está vazio');
    }

    // ✅ Validar que temos pelo menos a estrutura básica
    if (!adjustedPlan.hardGoals || !Array.isArray(adjustedPlan.hardGoals)) {
      throw new Error('Plano ajustado não contém hardGoals');
    }

    if (!adjustedPlan.mediumGoals || !Array.isArray(adjustedPlan.mediumGoals)) {
      throw new Error('Plano ajustado não contém mediumGoals');
    }

    if (!adjustedPlan.easyGoals || !Array.isArray(adjustedPlan.easyGoals)) {
      throw new Error('Plano ajustado não contém easyGoals - CRÍTICO: Sem easyGoals não há daily tasks!');
    }

    // ✅ Validar que temos easyGoals suficientes para gerar daily tasks
    if (adjustedPlan.easyGoals.length === 0) {
      throw new Error('Plano ajustado não contém nenhuma easyGoal - impossível gerar daily tasks');
    }

    this.logger.log(`✅ Estrutura do plano ajustado validada com sucesso`);
  }
}