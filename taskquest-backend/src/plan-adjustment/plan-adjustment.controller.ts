import { Controller, Post, Body, Param, UseGuards, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanAdjustmentService } from './plan-adjustment.service';
import { GoalsService } from '../goals/goals.service';
import { GoalToTaskConverterService } from '../goals/goal-to-task.converter.service';
import { AdjustPlanDto } from './dto/ajust-plan.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/schemas/user.schema'; // ✅ ADICIONAR

@Controller('plan-adjustment')
@UseGuards(JwtAuthGuard)
export class PlanAdjustmentController {
  private readonly logger = new Logger(PlanAdjustmentController.name);

  constructor(
    private planAdjustmentService: PlanAdjustmentService,
    private goalsService: GoalsService,
    private goalToTaskConverter: GoalToTaskConverterService,
  ) {}

  @Post(':id/adjust')
  async adjustPlan(
    @Param('id') planId: string,
    @Body() adjustPlanDto: AdjustPlanDto,
    @GetUser() user: User, // ✅ CORRIGIDO: User em vez de any
  ) {
    this.logger.log(`🔄 Usuário ${user._id} solicitando ajuste do plano ${planId}`); // ✅ CORRIGIDO: user._id

    try {
      const plan = await this.goalsService.findById(planId);
      
      if (!plan) {
        throw new NotFoundException('Plano não encontrado');
      }

      if (plan.userId.toString() !== user._id.toString()) { // ✅ CORRIGIDO: user._id
        throw new UnauthorizedException('Não autorizado');
      }

      // ... restante do código mantido igual ...
      // ✅ CORREÇÃO: Salvar estado anterior completo para histórico
      const previousState = {
        strategicAnalysis: plan.strategicAnalysis,
        quarters: plan.quarters,
        extremeGoals: plan.extremeGoals,
        hardGoals: plan.hardGoals,
        mediumGoals: plan.mediumGoals,
        easyGoals: plan.easyGoals,
        dailyTasks: plan.dailyTasks,
      };

      // ✅ CORREÇÃO: Gerar plano ajustado mantendo a estrutura completa
      const adjustedPlan = await this.planAdjustmentService.adjustGoalPlan(
        plan,
        adjustPlanDto.feedback,
        adjustPlanDto.userContext
      );

      // ✅ NOVA LÓGICA: Identificar metas removidas ANTES de atualizar o plano
      const adjustedGoalIds = await this.goalToTaskConverter.identifyAdjustedGoals(
        { ...plan.toObject() } as any,
        adjustedPlan
      );

      this.logger.log(`🔍 Metas ajustadas identificadas: ${JSON.stringify(adjustedGoalIds)}`);

      // ✅ CORREÇÃO CRÍTICA: Atualizar apenas os campos estratégicos
      plan.strategicAnalysis = adjustedPlan.strategicAnalysis || plan.strategicAnalysis;
      
      // ✅ CORREÇÃO: Atualizar metas mantendo a estrutura hierárquica
      if (adjustedPlan.quarters) {
        plan.quarters = adjustedPlan.quarters;
      }
      
      if (adjustedPlan.extremeGoals) {
        plan.extremeGoals = adjustedPlan.extremeGoals;
      }
      
      if (adjustedPlan.hardGoals) {
        plan.hardGoals = adjustedPlan.hardGoals;
      }
      
      if (adjustedPlan.mediumGoals) {
        plan.mediumGoals = adjustedPlan.mediumGoals;
      }
      
      if (adjustedPlan.easyGoals) {
        plan.easyGoals = adjustedPlan.easyGoals;
      }
      
      // ✅ CORREÇÃO: Atualizar histórico
      if (!plan.feedbackHistory) {
        plan.feedbackHistory = [];
      }
      
      plan.feedbackHistory.push({
        feedback: adjustPlanDto.feedback,
        userContext: adjustPlanDto.userContext,
        adjustedAt: new Date(),
        adjustmentsMade: ['Plano ajustado com base no feedback'],
        previousState
      });

      plan.needsAdjustment = false;
      plan.adjustmentReason = undefined;

      // ✅ SALVAR o plano atualizado
      await plan.save();
      this.logger.log(`💾 Plano salvo com sucesso: ${plan._id}`);

      // ✅ CORREÇÃO CRÍTICA: Se o plano está ativo, limpar APENAS as tasks afetadas e regenerar
      if (plan.isActive) {
        this.logger.log('🔄 Processando tasks após ajuste do plano...');
        
        try {
          // ✅ NOVA LÓGICA: Limpar APENAS as tasks relacionadas às metas removidas
          await this.goalToTaskConverter.cleanupAdjustedPlanTasks(
            user._id.toString(), // ✅ CORRIGIDO: user._id
            adjustedGoalIds
          );

          // ✅ Depois criar as novas tasks
          await this.goalsService.convertGoalPlanToTasks(plan);
          
          this.logger.log('✅ Tasks atualizadas seletivamente com sucesso');
        } catch (taskError) {
          this.logger.error(`❌ Erro ao processar tasks: ${taskError.message}`);
          // Não lançar erro aqui para não quebrar o ajuste do plano
        }
      } else {
        this.logger.log('ℹ️ Plano não está ativo, pulando regeneração de tasks');
      }

      this.logger.log(`✅ Plano ${planId} ajustado com sucesso`);

      return {
        success: true,
        message: 'Plano ajustado com sucesso',
        plan: plan
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao ajustar plano: ${error.message}`);
      throw error;
    }
  }

  @Post(':id/request-adjustment')
  async requestAdjustment(
    @Param('id') planId: string,
    @Body() body: { reason: string },
    @GetUser() user: User, // ✅ CORRIGIDO: User em vez de any
  ) {
    try {
      const plan = await this.goalsService.findById(planId);
      
      if (!plan) {
        throw new NotFoundException('Plano não encontrado');
      }

      if (plan.userId.toString() !== user._id.toString()) { // ✅ CORRIGIDO: user._id
        throw new UnauthorizedException('Não autorizado');
      }

      plan.needsAdjustment = true;
      plan.adjustmentReason = body.reason;
      await plan.save();

      return {
        success: true,
        message: 'Solicitação de ajuste registrada'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao solicitar ajuste: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO CORRIGIDO: Ajustar plano atual sem precisar do ID
  @Post('adjust-current')
  async adjustCurrentPlan(
    @Body() adjustPlanDto: AdjustPlanDto,
    @GetUser() user: User, // ✅ CORRIGIDO: User em vez de any
  ) {
    this.logger.log(`🔄 Usuário ${user._id} solicitando ajuste do plano atual`); // ✅ CORRIGIDO: user._id

    try {
      // ✅ CORREÇÃO: Buscar plano de forma mais robusta
      let plan;
      try {
        // Primeiro tenta buscar plano ativo ou mais recente
        plan = await this.goalsService.getGoalPlan(user._id.toString()); // ✅ CORRIGIDO: user._id
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar plano: ${error.message}`);
        throw new NotFoundException('Nenhum plano encontrado. Crie um plano anual primeiro.');
      }

      if (!plan) {
        this.logger.error(`❌ Nenhum plano encontrado para usuário ${user._id}`); // ✅ CORRIGIDO: user._id
        throw new NotFoundException('Nenhum plano encontrado. Crie um plano anual primeiro.');
      }

      this.logger.log(`📋 Plano encontrado: ${plan._id} (Ativo: ${plan.isActive}, Confirmado: ${plan.isConfirmed})`);

      // ✅ DEBUG: Log detalhado do plano
      this.logger.debug(`📊 Detalhes do plano: 
        - Extreme Goals: ${plan.extremeGoals?.length || 0}
        - Hard Goals: ${plan.hardGoals?.length || 0} 
        - Medium Goals: ${plan.mediumGoals?.length || 0}
        - Easy Goals: ${plan.easyGoals?.length || 0}
        - Daily Tasks: ${plan.dailyTasks?.length || 0}`);

      // ✅ CORREÇÃO: Salvar estado anterior completo para histórico
      const previousState = {
        strategicAnalysis: plan.strategicAnalysis,
        quarters: plan.quarters,
        extremeGoals: plan.extremeGoals,
        hardGoals: plan.hardGoals,
        mediumGoals: plan.mediumGoals,
        easyGoals: plan.easyGoals,
        dailyTasks: plan.dailyTasks,
      };

      // ✅ CORREÇÃO: Gerar plano ajustado mantendo a estrutura completa
      const adjustedPlan = await this.planAdjustmentService.adjustGoalPlan(
        plan,
        adjustPlanDto.feedback,
        adjustPlanDto.userContext
      );

      // ✅ NOVA LÓGICA: Identificar metas removidas ANTES de atualizar o plano
      const adjustedGoalIds = await this.goalToTaskConverter.identifyAdjustedGoals(
        { ...plan.toObject() } as any,
        adjustedPlan
      );

      this.logger.log(`🔍 Metas ajustadas identificadas: ${JSON.stringify(adjustedGoalIds)}`);

      // ✅ CORREÇÃO CRÍTICA: Atualizar apenas os campos estratégicos
      plan.strategicAnalysis = adjustedPlan.strategicAnalysis || plan.strategicAnalysis;
      
      // ✅ CORREÇÃO: Atualizar metas mantendo a estrutura hierárquica
      if (adjustedPlan.quarters) {
        plan.quarters = adjustedPlan.quarters;
      }
      
      if (adjustedPlan.extremeGoals) {
        plan.extremeGoals = adjustedPlan.extremeGoals;
      }
      
      if (adjustedPlan.hardGoals) {
        plan.hardGoals = adjustedPlan.hardGoals;
      }
      
      if (adjustedPlan.mediumGoals) {
        plan.mediumGoals = adjustedPlan.mediumGoals;
      }
      
      if (adjustedPlan.easyGoals) {
        plan.easyGoals = adjustedPlan.easyGoals;
      }
      
      // ✅ CORREÇÃO: Atualizar histórico
      if (!plan.feedbackHistory) {
        plan.feedbackHistory = [];
      }
      
      plan.feedbackHistory.push({
        feedback: adjustPlanDto.feedback,
        userContext: adjustPlanDto.userContext,
        adjustedAt: new Date(),
        adjustmentsMade: ['Plano ajustado com base no feedback'],
        previousState
      });

      plan.needsAdjustment = false;
      plan.adjustmentReason = undefined;

      // ✅ SALVAR o plano atualizado
      await plan.save();
      this.logger.log(`💾 Plano salvo com sucesso: ${plan._id}`);

      // ✅ CORREÇÃO CRÍTICA: Se o plano está ativo, limpar APENAS as tasks afetadas e regenerar
      if (plan.isActive) {
        this.logger.log('🔄 Processando tasks após ajuste do plano...');
        
        try {
          // ✅ NOVA LÓGICA: Limpar APENAS as tasks relacionadas às metas removidas
          await this.goalToTaskConverter.cleanupAdjustedPlanTasks(
            user._id.toString(), // ✅ CORRIGIDO: user._id
            adjustedGoalIds
          );

          // ✅ Depois criar as novas tasks
          await this.goalsService.convertGoalPlanToTasks(plan);
          
          this.logger.log('✅ Tasks atualizadas seletivamente com sucesso');
        } catch (taskError) {
          this.logger.error(`❌ Erro ao processar tasks: ${taskError.message}`);
          // Não lançar erro aqui para não quebrar o ajuste do plano
        }
      } else {
        this.logger.log('ℹ️ Plano não está ativo, pulando regeneração de tasks');
      }

      this.logger.log(`✅ Plano atual ajustado com sucesso para usuário ${user._id}`); // ✅ CORRIGIDO: user._id

      return {
        success: true,
        message: 'Plano ajustado com sucesso',
        plan: plan
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao ajustar plano atual: ${error.message}`);
      this.logger.error(`🔍 Stack trace: ${error.stack}`);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Falha ao ajustar plano: ${error.message}`);
    }
  }
}