import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../tasks/schemas/task.schema';
import { GoalPlan, GoalPlanDocument } from './schemas/goal-plan.schema';

// Interfaces para tipagem correta
interface DailyTask {
  id?: string;
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: string;
}

interface EasyGoal {
  id: string;
  title: string;
  description: string;
  mediumGoalId?: string;
  dailyTasks?: (DailyTask | string)[];
  deadline?: string;
}

interface MediumGoal {
  id: string;
  title: string;
  description: string;
  hardGoalId?: string;
  deadline?: string;
}

interface HardGoal {
  id: string;
  title: string;
  description: string;
  category?: string;
  deadline?: string;
  extremeGoalId?: string;
}

interface ExtremeGoal {
  id: string;
  title: string;
  description: string;
  category?: string;
  deadline?: string;
}

@Injectable()
export class GoalToTaskConverterService {
  private readonly logger = new Logger(GoalToTaskConverterService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
  ) {}

  async convertGoalPlanToTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const userId = goalPlan.userId;
    this.logger.log(`🔄 Convertendo plano em tasks para usuário: ${userId}`);

    try {
      // ✅ CORREÇÃO CRÍTICA: Sempre limpar todas as tasks de goals antes de criar novas
      await this.cleanupOldPlanTasks(userId.toString());

      // ✅ CORREÇÃO: Criar tasks para cada nível do plano na ordem hierárquica
      await this.createExtremeTasks(goalPlan);
      await this.createHardTasks(goalPlan);
      await this.createMediumTasks(goalPlan);
      await this.createEasyTasks(goalPlan);
      await this.createDailyTasks(goalPlan);

      this.logger.log(`✅ Plano convertido em tasks para usuário: ${userId}`);
      this.logger.log(`📊 Resumo: ${(goalPlan.extremeGoals || []).length} extreme, ${(goalPlan.hardGoals || []).length} hard, ${(goalPlan.mediumGoals || []).length} medium, ${(goalPlan.easyGoals || []).length} easy`);
    } catch (error) {
      this.logger.error(`❌ Erro ao converter plano em tasks:`, error);
      throw error;
    }
  }

  // ✅ CORREÇÃO CRÍTICA: Método para limpar tasks específicas após ajuste do plano
  async cleanupAdjustedPlanTasks(userId: string, adjustedGoalIds: {
    removedExtremeGoalIds?: string[];
    removedHardGoalIds?: string[];
    removedMediumGoalIds?: string[];
    removedEasyGoalIds?: string[];
  }): Promise<void> {
    this.logger.log(`🧹 Limpando tasks específicas após ajuste do plano para usuário: ${userId}`);
    
    try {
      const conditions: any[] = [];
      const userIdObj = new Types.ObjectId(userId);

      // ✅ Remover tasks baseadas nos IDs de metas que foram removidas/alteradas
      if (adjustedGoalIds.removedExtremeGoalIds && adjustedGoalIds.removedExtremeGoalIds.length > 0) {
        conditions.push({
          userId: userIdObj,
          type: 'goal_extreme',
          'aiData.goalId': { $in: adjustedGoalIds.removedExtremeGoalIds }
        });
      }

      if (adjustedGoalIds.removedHardGoalIds && adjustedGoalIds.removedHardGoalIds.length > 0) {
        conditions.push({
          userId: userIdObj,
          type: 'goal_hard',
          'aiData.goalId': { $in: adjustedGoalIds.removedHardGoalIds }
        });
      }

      if (adjustedGoalIds.removedMediumGoalIds && adjustedGoalIds.removedMediumGoalIds.length > 0) {
        conditions.push({
          userId: userIdObj,
          type: 'goal_medium',
          'aiData.goalId': { $in: adjustedGoalIds.removedMediumGoalIds }
        });
      }

      if (adjustedGoalIds.removedEasyGoalIds && adjustedGoalIds.removedEasyGoalIds.length > 0) {
        conditions.push({
          userId: userIdObj,
          type: 'goal_easy',
          'aiData.goalId': { $in: adjustedGoalIds.removedEasyGoalIds }
        });

        // ✅ CORREÇÃO CRÍTICA: Também remover daily tasks associadas às easy goals removidas
        conditions.push({
          userId: userIdObj,
          type: 'goal_daily',
          'aiData.easyGoalId': { $in: adjustedGoalIds.removedEasyGoalIds }
        });
      }

      if (conditions.length > 0) {
        const deleteResult = await this.taskModel.deleteMany({
          $or: conditions
        }).exec();
        
        this.logger.log(`✅ ${deleteResult.deletedCount} tasks específicas removidas após ajuste do plano`);
      } else {
        this.logger.log('ℹ️ Nenhuma task específica para remover após ajuste do plano');
      }
    } catch (error) {
      this.logger.error('❌ Erro ao limpar tasks específicas após ajuste:', error);
      throw error;
    }
  }

  // ✅ MÉTODO ORIGINAL: Limpar todas as tasks de goals (usado na conversão inicial)
  private async cleanupOldPlanTasks(userId: string): Promise<void> {
    this.logger.log(`🧹 Limpando TODAS as tasks antigas do plano para usuário: ${userId}`);
    
    const result = await this.taskModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type: { 
        $in: ['goal_extreme', 'goal_hard', 'goal_medium', 'goal_easy', 'goal_daily'] 
      }
    }).exec();
    
    this.logger.log(`✅ ${result.deletedCount} tasks de goals removidas`);
  }

  // ✅ NOVO MÉTODO: Identificar quais metas foram alteradas/removidas durante o ajuste
  async identifyAdjustedGoals(
    previousPlan: GoalPlanDocument, 
    adjustedPlan: GoalPlanDocument
  ): Promise<{
    removedExtremeGoalIds: string[];
    removedHardGoalIds: string[];
    removedMediumGoalIds: string[];
    removedEasyGoalIds: string[];
  }> {
    const previousExtremeIds = (previousPlan.extremeGoals as ExtremeGoal[] || []).map(g => g.id);
    const adjustedExtremeIds = (adjustedPlan.extremeGoals as ExtremeGoal[] || []).map(g => g.id);
    
    const previousHardIds = (previousPlan.hardGoals as HardGoal[] || []).map(g => g.id);
    const adjustedHardIds = (adjustedPlan.hardGoals as HardGoal[] || []).map(g => g.id);
    
    const previousMediumIds = (previousPlan.mediumGoals as MediumGoal[] || []).map(g => g.id);
    const adjustedMediumIds = (adjustedPlan.mediumGoals as MediumGoal[] || []).map(g => g.id);
    
    const previousEasyIds = (previousPlan.easyGoals as EasyGoal[] || []).map(g => g.id);
    const adjustedEasyIds = (adjustedPlan.easyGoals as EasyGoal[] || []).map(g => g.id);

    const removedExtremeGoalIds = previousExtremeIds.filter(id => !adjustedExtremeIds.includes(id));
    const removedHardGoalIds = previousHardIds.filter(id => !adjustedHardIds.includes(id));
    const removedMediumGoalIds = previousMediumIds.filter(id => !adjustedMediumIds.includes(id));
    const removedEasyGoalIds = previousEasyIds.filter(id => !adjustedEasyIds.includes(id));

    this.logger.log(`🔍 Metas removidas no ajuste: ${removedExtremeGoalIds.length} extreme, ${removedHardGoalIds.length} hard, ${removedMediumGoalIds.length} medium, ${removedEasyGoalIds.length} easy`);

    return {
      removedExtremeGoalIds,
      removedHardGoalIds,
      removedMediumGoalIds,
      removedEasyGoalIds
    };
  }

  private async createExtremeTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const extremeGoals = goalPlan.extremeGoals as ExtremeGoal[] || [];
    
    if (extremeGoals.length === 0) {
      this.logger.warn('⚠️ Nenhuma meta EXTREME encontrada para converter');
      return;
    }

    const extremeTasks = extremeGoals.map(goal => ({
      userId: goalPlan.userId,
      text: goal.title,
      description: goal.description || `Objetivo principal: ${goal.title}`,
      xp: 2000,
      type: 'goal_extreme',
      date: new Date().toISOString().split('T')[0],
      reason: `Objetivo EXTREME: ${goalPlan.vision}`,
      completed: false,
      aiData: {
        goalId: goal.id,
        category: goal.category || 'general',
        deadline: goal.deadline || goalPlan.endDate
      }
    }));

    await this.taskModel.insertMany(extremeTasks);
    this.logger.log(`✅ ${extremeTasks.length} tarefas EXTREME criadas`);
  }

  private async createHardTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const hardGoals = goalPlan.hardGoals as HardGoal[] || [];
    
    if (hardGoals.length === 0) {
      this.logger.warn('⚠️ Nenhuma meta HARD encontrada para converter');
      return;
    }

    const hardTasks = hardGoals.map(goal => ({
      userId: goalPlan.userId,
      text: goal.title,
      description: goal.description || `Meta anual: ${goal.title}`,
      xp: 1000,
      type: 'goal_hard',
      date: new Date().toISOString().split('T')[0],
      reason: `Meta HARD do plano anual`,
      completed: false,
      aiData: {
        goalId: goal.id,
        extremeGoalId: goal.extremeGoalId,
        category: goal.category || 'general',
        deadline: goal.deadline || goalPlan.endDate
      }
    }));

    await this.taskModel.insertMany(hardTasks);
    this.logger.log(`✅ ${hardTasks.length} tarefas HARD criadas`);
  }

  private async createMediumTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const mediumGoals = goalPlan.mediumGoals as MediumGoal[] || [];
    
    if (mediumGoals.length === 0) {
      this.logger.warn('⚠️ Nenhuma meta MEDIUM encontrada para converter');
      return;
    }

    const mediumTasks = mediumGoals.map(goal => ({
      userId: goalPlan.userId,
      text: goal.title,
      description: goal.description || `Meta trimestral: ${goal.title}`,
      xp: 300,
      type: 'goal_medium',
      date: new Date().toISOString().split('T')[0],
      reason: `Meta MEDIUM que leva às metas HARD`,
      completed: false,
      aiData: {
        goalId: goal.id,
        hardGoalId: goal.hardGoalId,
        deadline: goal.deadline || this.calculateQuarterEndDate()
      }
    }));

    await this.taskModel.insertMany(mediumTasks);
    this.logger.log(`✅ ${mediumTasks.length} tarefas MEDIUM criadas`);
  }

  private async createEasyTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const easyGoals = goalPlan.easyGoals as EasyGoal[] || [];
    
    if (easyGoals.length === 0) {
      this.logger.error('❌ Nenhuma meta EASY encontrada - CRÍTICO: Sem easy goals não há daily tasks!');
      return;
    }

    const easyTasks = easyGoals.map(goal => ({
      userId: goalPlan.userId,
      text: goal.title,
      description: goal.description || `Meta semanal: ${goal.title}`,
      xp: 100,
      type: 'goal_easy',
      date: new Date().toISOString().split('T')[0],
      reason: `Meta EASY semanal do plano`,
      completed: false,
      aiData: {
        goalId: goal.id,
        mediumGoalId: goal.mediumGoalId,
        deadline: goal.deadline || this.calculateWeekEndDate(),
        hasDailyTasks: !!(goal.dailyTasks && goal.dailyTasks.length > 0)
      }
    }));

    await this.taskModel.insertMany(easyTasks);
    this.logger.log(`✅ ${easyTasks.length} tarefas EASY criadas (base para daily tasks)`);
  }

  private async createDailyTasks(goalPlan: GoalPlanDocument): Promise<void> {
    const easyGoals = goalPlan.easyGoals as EasyGoal[] || [];
    
    if (easyGoals.length === 0) {
      this.logger.error('❌ Nenhuma easy goal encontrada - impossível criar daily tasks');
      return;
    }

    const dailyTasks = [];
    const today = new Date();

    // ✅ CORREÇÃO CRÍTICA: Criar daily tasks para os próximos 7 dias
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + dayOffset);
      const dateString = taskDate.toISOString().split('T')[0];

      // Para cada EASY goal, criar uma daily task para este dia
      for (const easyGoal of easyGoals) {
        const dailyTaskData = this.getDailyTaskForEasyGoal(easyGoal, dayOffset);
        
        dailyTasks.push({
          userId: goalPlan.userId,
          text: dailyTaskData.title,
          description: dailyTaskData.description,
          xp: 100,
          type: 'goal_daily',
          date: dateString,
          reason: `Tarefa diária para: ${easyGoal.title}`,
          completed: false,
          aiData: {
            easyGoalId: easyGoal.id,
            mediumGoalId: easyGoal.mediumGoalId,
            estimatedMinutes: dailyTaskData.estimatedMinutes,
            priority: dailyTaskData.priority,
            dayOfWeek: dayOffset,
            date: dateString
          }
        });
      }
    }

    if (dailyTasks.length > 0) {
      await this.taskModel.insertMany(dailyTasks);
      this.logger.log(`✅ ${dailyTasks.length} daily tasks criadas para a semana`);
    } else {
      this.logger.error('❌ Nenhuma daily task foi criada - verifique as easy goals');
    }
  }

  private getDailyTaskForEasyGoal(easyGoal: EasyGoal, dayOffset: number): { 
    title: string; 
    description: string; 
    estimatedMinutes: number; 
    priority: string 
  } {
    // ✅ CORREÇÃO: Lógica melhorada para gerar daily tasks a partir das easy goals
    if (easyGoal.dailyTasks && Array.isArray(easyGoal.dailyTasks) && easyGoal.dailyTasks.length > 0) {
      const taskIndex = dayOffset % easyGoal.dailyTasks.length;
      const dailyTask = easyGoal.dailyTasks[taskIndex];
      
      if (typeof dailyTask === 'string') {
        return {
          title: dailyTask,
          description: `Implementar: ${easyGoal.title}`,
          estimatedMinutes: 45,
          priority: 'medium'
        };
      } else {
        return {
          title: dailyTask.title || `Trabalhar em: ${easyGoal.title}`,
          description: dailyTask.description || easyGoal.description || `Ação diária para: ${easyGoal.title}`,
          estimatedMinutes: dailyTask.estimatedMinutes || 45,
          priority: dailyTask.priority || 'medium'
        };
      }
    } else {
      // ✅ CORREÇÃO: Daily tasks padrão baseadas na easy goal
      const dailyActions = [
        `Implementar ações para: ${easyGoal.title}`,
        `Progresso em: ${easyGoal.title}`,
        `Revisão e ajuste: ${easyGoal.title}`,
        `Prática de: ${easyGoal.title}`,
        `Desenvolvimento: ${easyGoal.title}`,
        `Aplicação: ${easyGoal.title}`,
        `Consolidação: ${easyGoal.title}`
      ];
      
      const actionIndex = dayOffset % dailyActions.length;
      
      return {
        title: dailyActions[actionIndex],
        description: easyGoal.description || `Tarefa diária relacionada a: ${easyGoal.title}`,
        estimatedMinutes: 45,
        priority: 'medium'
      };
    }
  }

  private calculateQuarterEndDate(): string {
    const now = new Date();
    const currentMonth = now.getMonth();
    let quarterEndMonth = 2; // Março
    
    if (currentMonth >= 3 && currentMonth <= 5) quarterEndMonth = 5; // Junho
    else if (currentMonth >= 6 && currentMonth <= 8) quarterEndMonth = 8; // Setembro
    else if (currentMonth >= 9 && currentMonth <= 11) quarterEndMonth = 11; // Dezembro
    
    const quarterEnd = new Date(now.getFullYear(), quarterEndMonth + 1, 0);
    return quarterEnd.toISOString().split('T')[0];
  }

  private calculateWeekEndDate(): string {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    return weekEnd.toISOString().split('T')[0];
  }

  // ✅ CORREÇÃO: Método para atualizar daily tasks diariamente
  async refreshDailyTasks(userId: string): Promise<void> {
    this.logger.log(`🔄 Atualizando daily tasks para usuário: ${userId}`);
    
    try {
      // Remover daily tasks antigas (do passado)
      const deleteResult = await this.taskModel.deleteMany({
        userId: new Types.ObjectId(userId),
        type: 'goal_daily',
        date: { $lt: new Date().toISOString().split('T')[0] }
      }).exec();

      this.logger.log(`🧹 ${deleteResult.deletedCount} daily tasks antigas removidas`);

      // Buscar plano ativo do usuário
      const goalPlan = await this.goalPlanModel.findOne({
        userId: new Types.ObjectId(userId),
        isActive: true
      }).exec();

      if (goalPlan) {
        // Recriar daily tasks para os próximos dias
        await this.createDailyTasks(goalPlan);
        this.logger.log('✅ Daily tasks atualizadas com sucesso');
      } else {
        this.logger.warn('⚠️ Nenhum plano ativo encontrado para atualizar daily tasks');
      }
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar daily tasks:', error);
      throw error;
    }
  }

  // ✅ NOVO MÉTODO: Verificar se o plano tem estrutura completa para gerar tasks
  validatePlanStructure(goalPlan: GoalPlanDocument): boolean {
    const hasExtremeGoals = goalPlan.extremeGoals && goalPlan.extremeGoals.length > 0;
    const hasHardGoals = goalPlan.hardGoals && goalPlan.hardGoals.length > 0;
    const hasMediumGoals = goalPlan.mediumGoals && goalPlan.mediumGoals.length > 0;
    const hasEasyGoals = goalPlan.easyGoals && goalPlan.easyGoals.length > 0;

    if (!hasEasyGoals) {
      this.logger.error('❌ Plano não contém easy goals - impossível gerar daily tasks');
      return false;
    }

    this.logger.log(`📊 Validação do plano: ${hasExtremeGoals ? '✅' : '❌'} extreme, ${hasHardGoals ? '✅' : '❌'} hard, ${hasMediumGoals ? '✅' : '❌'} medium, ${hasEasyGoals ? '✅' : '❌'} easy`);
    
    return hasEasyGoals; // O mínimo necessário são easy goals para daily tasks
  }
}