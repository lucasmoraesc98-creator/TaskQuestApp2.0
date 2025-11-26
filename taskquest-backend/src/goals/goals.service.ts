import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoalPlan, GoalPlanDocument } from './schemas/goal-plan.schema';
import { CreateGoalPlanDto } from './dto/create-goal-plan.dto';
import { DeepSeekAIService } from '../ai/deepseek-ai.service';
import { TasksService } from '../tasks/tasks.service';
import { ProgressService } from '../progress/progress.service';
import { GoalToTaskConverterService } from './goal-to-task.converter.service';

interface ExtendedDailyTask {
  taskId?: string;
  isConfirmed?: boolean;
  confirmedAt?: Date;
  feedbackHistory?: any[];
  completed?: boolean;
  status?: string;
}

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
    private deepseekAI: DeepSeekAIService,
    private goalToTaskConverter: GoalToTaskConverterService,
    private tasksService: TasksService,
    private progressService: ProgressService,
  ) {}

  // ✅ MÉTODO ADICIONADO: Encontrar plano por ID
  async findById(planId: string): Promise<GoalPlanDocument> {
    const plan = await this.goalPlanModel.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return plan;
  }

  // ✅ MÉTODO ADICIONADO: Converter plano para tasks
  async convertGoalPlanToTasks(goalPlan: GoalPlanDocument): Promise<void> {
    await this.goalToTaskConverter.convertGoalPlanToTasks(goalPlan);
  }

  async cleanupOldUserData(userId: string): Promise<void> {
    this.logger.log(`🧹 Limpando dados antigos do usuário: ${userId}`);
    
    try {
      // Deletar planos antigos
      await this.goalPlanModel.deleteMany({ 
        userId: new Types.ObjectId(userId) 
      });
      
      this.logger.log('✅ Dados antigos removidos com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao limpar dados antigos:', error);
      throw new Error('Falha ao limpar dados antigos');
    }
  }
  
  async createGoalPlan(userId: string, createGoalPlanDto: CreateGoalPlanDto): Promise<GoalPlanDocument> {
    this.logger.log(`🔍 createGoalPlan iniciado para usuário: ${userId}`);
    
    try {
      const existingPlan = await this.goalPlanModel.findOne({ 
        userId: new Types.ObjectId(userId), 
        isActive: true 
      });

      if (existingPlan) {
        this.logger.warn('❌ Usuário já tem plano ativo');
        throw new BadRequestException('Já existe um plano ativo');
      }

      this.logger.log('🤖 Chamando IA para gerar plano...');
      const aiPlan = await this.deepseekAI.generateStrategicAnnualPlan({
        vision: createGoalPlanDto.vision,
        goals: createGoalPlanDto.goals,
        challenges: createGoalPlanDto.challenges,
        tools: createGoalPlanDto.tools || [],
        skills: createGoalPlanDto.skills || [],
        hoursPerWeek: createGoalPlanDto.hoursPerWeek || 10,
      });
      this.logger.log(`✅ IA respondeu com ${aiPlan.hardGoals?.length || 0} metas HARD`);

      // ✅ CORREÇÃO CRÍTICA: Garantir que temos EASY Goals suficientes
      // Se a IA gerou poucas EASY goals, complementar com base nas MEDIUM goals
      let easyGoals = aiPlan.easyGoals || [];
      const mediumGoals = aiPlan.mediumGoals || [];
      
      if (easyGoals.length < mediumGoals.length * 2) {
        this.logger.log(`🔧 Complementando EASY Goals - IA gerou apenas ${easyGoals.length}, precisamos de pelo menos ${mediumGoals.length * 4}`);
        const complementaryEasyGoals = this.generateComplementaryEasyGoals(mediumGoals, easyGoals);
        easyGoals = [...easyGoals, ...complementaryEasyGoals];
        this.logger.log(`✅ Total de EASY Goals após complementação: ${easyGoals.length}`);
      }

      // ✅ CORREÇÃO: Gerar daily tasks APENAS para visualização no plano (preview)
      const dailyTasks = this.generateDailyTasksPreview(easyGoals);
      this.logger.log(`📅 ${dailyTasks.length} tarefas diárias de preview geradas`);

      const goalPlan = new this.goalPlanModel({
        userId: new Types.ObjectId(userId), // ✅ Deve ser ObjectId
        vision: createGoalPlanDto.vision,
        goals: createGoalPlanDto.goals,
        challenges: createGoalPlanDto.challenges,
        tools: createGoalPlanDto.tools || [],
        skills: createGoalPlanDto.skills || [],
        hoursPerWeek: createGoalPlanDto.hoursPerWeek || 10,
        hardGoals: aiPlan.hardGoals || [],
        mediumGoals: mediumGoals,
        easyGoals: easyGoals, // ✅ Usar as EASY goals complementadas
        dailyTasks: dailyTasks,
        overallProgress: 0,
        isActive: false,
        isConfirmed: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        strategicAnalysis: aiPlan.strategicAnalysis,
        coverageAnalysis: aiPlan.coverageAnalysis,
        // ✅ ADICIONAR EXTREME GOALS (objetivos do usuário)
        extremeGoals: this.createExtremeGoalsFromUserGoals(createGoalPlanDto.goals),
      });

      const savedPlan = await goalPlan.save();
      this.logger.log(`✅ Plano salvo com ID: ${savedPlan._id}`);
      
      return savedPlan;
      
    } catch (error) {
      this.logger.error(`❌ Erro em createGoalPlan: ${error.message}`);
      this.logger.error(`🔍 Stack: ${error.stack}`);
      throw new BadRequestException(`Falha ao criar plano: ${error.message}`);
    }
  }

  // ✅ NOVO MÉTODO: Gerar EASY Goals complementares baseadas nas MEDIUM Goals
  private generateComplementaryEasyGoals(mediumGoals: any[], existingEasyGoals: any[]): any[] {
    const complementaryEasyGoals: any[] = [];
    const existingEasyGoalTitles = new Set(existingEasyGoals.map(eg => eg.title?.toLowerCase()));

    mediumGoals.forEach((mediumGoal, index) => {
      const mediumGoalId = mediumGoal.id || `medium-${index + 1}`;
      
      // Gerar 4 EASY goals por MEDIUM goal (uma para cada semana do mês)
      for (let week = 1; week <= 4; week++) {
        const weekTitle = `Semana ${week} - ${mediumGoal.title}`;
        
        // Só adicionar se não existir uma EASY goal similar
        if (!existingEasyGoalTitles.has(weekTitle.toLowerCase())) {
          complementaryEasyGoals.push({
            id: `easy-${mediumGoalId}-week-${week}`,
            title: weekTitle,
            description: this.generateEasyGoalDescription(mediumGoal, week),
            mediumGoalId: mediumGoalId,
            category: mediumGoal.category || 'general',
            deadline: this.calculateWeekDeadline(week),
            xpValue: 100,
            priority: 'medium',
            estimatedHours: 5,
            specificActions: this.generateWeeklyActions(mediumGoal, week),
            status: 'pending',
            progress: 0
          });
        }
      }
    });

    this.logger.log(`🔧 Geradas ${complementaryEasyGoals.length} EASY Goals complementares`);
    return complementaryEasyGoals;
  }

  // ✅ NOVO MÉTODO: Gerar descrição para EASY Goal baseada na MEDIUM Goal
  private generateEasyGoalDescription(mediumGoal: any, week: number): string {
    const actions = {
      1: `Iniciar implementação: ${mediumGoal.title}. Foco em planejamento e preparação.`,
      2: `Desenvolvimento ativo: ${mediumGoal.title}. Execução das principais atividades.`,
      3: `Aprofundamento: ${mediumGoal.title}. Refinamento e ajustes necessários.`,
      4: `Consolidação: ${mediumGoal.title}. Revisão e preparação para o próximo mês.`
    };

    return actions[week as keyof typeof actions] || `Semana ${week} de implementação: ${mediumGoal.title}`;
  }

  // ✅ NOVO MÉTODO: Gerar ações semanais específicas
  private generateWeeklyActions(mediumGoal: any, week: number): string[] {
    const baseActions = [
      `Revisar progresso da meta "${mediumGoal.title}"`,
      `Ajustar planejamento conforme necessário`,
      `Documentar aprendizados e desafios`
    ];

    const weeklySpecificActions = {
      1: [
        `Definir metas específicas para a semana`,
        `Organizar recursos e ferramentas necessárias`,
        `Estabelecer métricas de acompanhamento`
      ],
      2: [
        `Executar atividades principais planejadas`,
        `Monitorar progresso diariamente`,
        `Resolver obstáculos identificados`
      ],
      3: [
        `Otimizar processos em andamento`,
        `Validar resultados parciais`,
        `Preparar ajustes para a semana final`
      ],
      4: [
        `Consolidar resultados da semana`,
        `Preparar relatório de progresso mensal`,
        `Planejar ações para o próximo mês`
      ]
    };

    return [...(weeklySpecificActions[week as keyof typeof weeklySpecificActions] || baseActions), ...baseActions];
  }

  // ✅ NOVO MÉTODO: Calcular deadline da semana
  private calculateWeekDeadline(week: number): string {
    const now = new Date();
    const deadline = new Date(now.getTime() + (week * 7 * 24 * 60 * 60 * 1000));
    return deadline.toISOString().split('T')[0];
  }

  // ✅ MÉTODO: Ajustar plano existente com feedback
  async adjustGoalPlan(userId: string, feedback: string, userContext?: string): Promise<GoalPlanDocument> {
    this.logger.log(`🔄 Ajustando plano anual para usuário: ${userId} com feedback`);
    
    try {
      const currentPlan = await this.getGoalPlan(userId);
      
      if (!currentPlan) {
        throw new NotFoundException('Plano não encontrado');
      }

      // ✅ Salvar estado anterior para histórico
      const previousState = {
        strategicAnalysis: currentPlan.strategicAnalysis,
        hardGoals: currentPlan.hardGoals,
        mediumGoals: currentPlan.mediumGoals,
        easyGoals: currentPlan.easyGoals,
        quarters: currentPlan.quarters,
      };

      this.logger.log('🔄 Chamando IA para ajustar plano...');
      
      // ✅ Usar o método adjustGoalPlan do DeepSeekAIService
      const adjustedPlan = await this.deepseekAI.adjustGoalPlan(
        currentPlan,
        feedback,
        userContext
      );

      this.logger.log(`✅ IA ajustou plano com ${adjustedPlan.hardGoals?.length || 0} metas HARD`);

      // ✅ CORREÇÃO: Garantir que as EASY Goals ajustadas também sejam suficientes
      let adjustedEasyGoals = adjustedPlan.easyGoals || [];
      const adjustedMediumGoals = adjustedPlan.mediumGoals || [];
      
      if (adjustedEasyGoals.length < adjustedMediumGoals.length * 2) {
        this.logger.log(`🔧 Complementando EASY Goals após ajuste - IA gerou apenas ${adjustedEasyGoals.length}`);
        const complementaryEasyGoals = this.generateComplementaryEasyGoals(adjustedMediumGoals, adjustedEasyGoals);
        adjustedEasyGoals = [...adjustedEasyGoals, ...complementaryEasyGoals];
      }

      // ✅ Atualizar plano existente com os dados ajustados
      currentPlan.strategicAnalysis = adjustedPlan.strategicAnalysis || currentPlan.strategicAnalysis;
      currentPlan.hardGoals = adjustedPlan.hardGoals || currentPlan.hardGoals;
      currentPlan.mediumGoals = adjustedPlan.mediumGoals || currentPlan.mediumGoals;
      currentPlan.easyGoals = adjustedEasyGoals; // ✅ Usar EASY goals complementadas
      
      // ✅ Atualizar trimestres se fornecidos
      if (adjustedPlan.quarters) {
        currentPlan.quarters = adjustedPlan.quarters;
      }

      // ✅ Atualizar histórico de feedback
      currentPlan.feedbackHistory = currentPlan.feedbackHistory || [];
      currentPlan.feedbackHistory.push({
        feedback,
        userContext,
        adjustedAt: new Date(),
        adjustmentsMade: ['Plano ajustado com base no feedback'],
        previousState
      });

      currentPlan.needsAdjustment = false;
      currentPlan.adjustmentReason = undefined;

      // ✅ Se o plano estava ativo, precisamos regerar as tasks
      if (currentPlan.isActive) {
        await this.goalToTaskConverter.convertGoalPlanToTasks(currentPlan);
        this.logger.log('✅ Tasks regeneradas para plano ajustado');
      }

      const savedPlan = await currentPlan.save();
      this.logger.log('✅ Plano ajustado com sucesso');
      
      return savedPlan;
      
    } catch (error) {
      this.logger.error(`❌ Erro ao ajustar plano: ${error.message}`);
      throw new BadRequestException(`Falha ao ajustar plano: ${error.message}`);
    }
  }

  // ✅ MÉTODO: Criar Extreme Goals a partir dos objetivos do usuário
  private createExtremeGoalsFromUserGoals(goals: string[]): any[] {
    const currentYear = new Date().getFullYear();
    
    return goals.map((goal, index) => ({
      id: `extreme-${index + 1}`,
      title: goal,
      description: `Objetivo principal do usuário: ${goal}`,
      category: this.categorizeGoal(goal),
      deadline: `${currentYear}-12-31T00:00:00.000Z`,
      xpValue: 2000,
      progress: 0
    }));
  }

  async createStrategicPlan(userId: string, createGoalPlanDto: CreateGoalPlanDto): Promise<GoalPlanDocument> {
    // Gerar plano anual estratégico (sem detalhes diários)
    const strategicPlan = await this.deepseekAI.generateStrategicAnnualPlan({
      vision: createGoalPlanDto.vision,
      goals: createGoalPlanDto.goals,
      challenges: createGoalPlanDto.challenges,
      tools: createGoalPlanDto.tools || [],
      skills: createGoalPlanDto.skills || [],
      hoursPerWeek: createGoalPlanDto.hoursPerWeek || 10,
    });
    
    // Salvar plano anual
    const goalPlan = new this.goalPlanModel({
      userId: new Types.ObjectId(userId),
      vision: createGoalPlanDto.vision,
      goals: createGoalPlanDto.goals,
      challenges: createGoalPlanDto.challenges,
      tools: createGoalPlanDto.tools || [],
      skills: createGoalPlanDto.skills || [],
      hoursPerWeek: createGoalPlanDto.hoursPerWeek || 10,
      ...strategicPlan,
      planType: 'strategic_annual',
      currentQuarter: 1, // Começar no trimestre 1
      isActive: false
    });

    return await goalPlan.save();
  }

  private categorizeGoal(goal: string): string {
    const lowerGoal = goal.toLowerCase();
    if (lowerGoal.includes('carreira') || lowerGoal.includes('profissional') || lowerGoal.includes('trabalho')) {
      return 'career';
    } else if (lowerGoal.includes('financeiro') || lowerGoal.includes('dinheiro') || lowerGoal.includes('renda')) {
      return 'finance';
    } else if (lowerGoal.includes('saúde') || lowerGoal.includes('físic') || lowerGoal.includes('mental')) {
      return 'health';
    } else if (lowerGoal.includes('habilidade') || lowerGoal.includes('aprender') || lowerGoal.includes('curso')) {
      return 'skills';
    } else {
      return 'relationships';
    }
  }

  async confirmAnnualPlan(userId: string): Promise<GoalPlanDocument> {
    this.logger.log(`✅ Confirmando plano anual para usuário: ${userId}`);
    
    const goalPlan = await this.goalPlanModel.findOne({ 
      userId: new Types.ObjectId(userId),
      isActive: false 
    });

    if (!goalPlan) {
      throw new NotFoundException('Plano não encontrado ou já confirmado');
    }
    
    // ✅ CORREÇÃO CRÍTICA: LIMPAR TODAS AS TAREFAS ANTIGAS
    await this.tasksService.deleteAllUserTasks(userId);
    this.logger.log(`✅ TODAS as tarefas antigas removidas ao confirmar plano`);
    
    goalPlan.isConfirmed = true;
    goalPlan.isActive = true;
    goalPlan.confirmedAt = new Date();
    
    // ✅ CONVERTER PLANO EM TASKS (incluindo daily tasks)
    await this.goalToTaskConverter.convertGoalPlanToTasks(goalPlan);
    
    const savedPlan = await goalPlan.save();
    this.logger.log(`✅ Plano confirmado e convertido em tasks`);
    
    return savedPlan;
  }

  async getGoalPlan(userId: string): Promise<GoalPlanDocument> {
    this.logger.log(`🔍 Buscando plano ativo para usuário: ${userId}`);
    
    try {
      // ✅ PRIMEIRO: Buscar plano ativo
      let goalPlan = await this.goalPlanModel.findOne({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
      });

      // ✅ SEGUNDO: Se não encontrar ativo, buscar o mais recente (ativo ou não)
      if (!goalPlan) {
        this.logger.log(`ℹ️ Nenhum plano ativo encontrado, buscando o mais recente...`);
        goalPlan = await this.goalPlanModel
          .findOne({ userId: new Types.ObjectId(userId) })
          .sort({ createdAt: -1 });
      }

      if (!goalPlan) {
        this.logger.error(`❌ Nenhum plano encontrado para usuário: ${userId}`);
        throw new NotFoundException('Nenhum plano encontrado');
      }

      this.logger.log(`✅ Plano encontrado: ${goalPlan._id} (Ativo: ${goalPlan.isActive})`);
      return goalPlan;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar plano: ${error.message}`);
      throw error;
    }
  }

  // ✅ ADICIONE este método para buscar o plano mais recente
  async findLatestByUserId(userId: string): Promise<GoalPlanDocument> {
    this.logger.log(`🔍 Buscando plano mais recente para usuário: ${userId}`);
    
    const goalPlan = await this.goalPlanModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });

    if (!goalPlan) {
      throw new NotFoundException('Nenhum plano encontrado para este usuário');
    }

    return goalPlan;
  }

  async getDailyTasks(userId: string): Promise<any[]> {
    const goalPlan = await this.getGoalPlan(userId);
    const today = new Date().toISOString().split('T')[0];

    return goalPlan.dailyTasks
      .filter(task => task.date === today)
      .slice(0, 3);
  }

  async completeDailyTask(userId: string, taskId: string): Promise<any> {
    const goalPlan = await this.getGoalPlan(userId);
    
    const task = (goalPlan.dailyTasks as ExtendedDailyTask[]).find(t => t.taskId === taskId);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Se a tarefa tem um taskId real, completar via TasksService
    if (task.taskId) {
      await this.tasksService.completeTask(task.taskId);
    } else {
      // Adicionar XP diretamente se não tiver taskId
      await this.progressService.addXP(userId, 100);
    }

    task.completed = true;
    task.status = 'completed';
    (task as any).completedAt = new Date();

    goalPlan.overallProgress = this.calculateProgress(goalPlan);
    await goalPlan.save();

    return { 
      message: 'Tarefa concluída com sucesso', 
      xp: 100,
      task: task
    };
  }

  // ✅ CORREÇÃO: Processar feedback usando o método existente
  async processPlanFeedback(userId: string, feedback: string): Promise<GoalPlanDocument> {
    this.logger.log(`💬 Processando feedback do usuário: ${userId}`);
    
    try {
      const currentPlan = await this.getGoalPlan(userId);
      
      // ✅ CORREÇÃO: Usar o método generatePlanWithFeedback
      const userData = {
        vision: currentPlan.vision,
        goals: currentPlan.goals || [],
        challenges: currentPlan.challenges || [],
        tools: currentPlan.tools || [],
        skills: currentPlan.skills || [],
        hoursPerWeek: currentPlan.hoursPerWeek || 10
      };

      this.logger.log('🔄 Chamando IA para gerar NOVO plano com feedback...');
      
      const revisedPlan = await this.deepseekAI.generatePlanWithFeedback(
        userData,
        feedback,
        {
          hardGoals: currentPlan.hardGoals,
          mediumGoals: currentPlan.mediumGoals,
          easyGoals: currentPlan.easyGoals,
          strategicAnalysis: currentPlan.strategicAnalysis
        }
      );

      this.logger.log(`✅ IA gerou NOVO plano com ${revisedPlan.hardGoals?.length || 0} metas HARD`);

      // ✅ CORREÇÃO: Garantir EASY Goals suficientes no plano revisado
      let revisedEasyGoals = revisedPlan.easyGoals || [];
      const revisedMediumGoals = revisedPlan.mediumGoals || [];
      
      if (revisedEasyGoals.length < revisedMediumGoals.length * 2) {
        this.logger.log(`🔧 Complementando EASY Goals no plano revisado`);
        const complementaryEasyGoals = this.generateComplementaryEasyGoals(revisedMediumGoals, revisedEasyGoals);
        revisedEasyGoals = [...revisedEasyGoals, ...complementaryEasyGoals];
      }

      // ✅ CRIAR NOVO PLANO (não atualizar o existente)
      const newGoalPlan = new this.goalPlanModel({
        userId: new Types.ObjectId(userId),
        vision: currentPlan.vision,
        goals: currentPlan.goals,
        challenges: currentPlan.challenges,
        tools: currentPlan.tools,
        skills: currentPlan.skills,
        hoursPerWeek: currentPlan.hoursPerWeek,
        // ✅ MANTER EXTREME GOALS ORIGINAIS (objetivos do usuário)
        extremeGoals: currentPlan.extremeGoals || this.createExtremeGoalsFromUserGoals(currentPlan.goals),
        hardGoals: revisedPlan.hardGoals || [],
        mediumGoals: revisedPlan.mediumGoals || [],
        easyGoals: revisedEasyGoals, // ✅ Usar EASY goals complementadas
        dailyTasks: this.generateDailyTasksPreview(revisedEasyGoals),
        overallProgress: 0,
        isActive: false,
        isConfirmed: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        strategicAnalysis: revisedPlan.strategicAnalysis,
        coverageAnalysis: revisedPlan.coverageAnalysis,
        // ✅ Adicionar histórico de feedback
        feedbackHistory: [
          ...(currentPlan.feedbackHistory || []),
          {
            feedback,
            timestamp: new Date(),
            previousPlanId: currentPlan._id,
            revisedGoals: revisedPlan.hardGoals?.length || 0
          }
        ]
      });

      const savedPlan = await newGoalPlan.save();
      this.logger.log('✅ NOVO plano criado com sucesso via feedback');
      
      return savedPlan;
      
    } catch (error) {
      this.logger.error('❌ Erro ao processar feedback:', error);
      throw new BadRequestException(`Falha ao processar feedback: ${error.message}`);
    }
  }

  // ✅ MÉTODO: Reconfirmar plano após feedback
  async reconfirmPlanAfterFeedback(userId: string): Promise<GoalPlanDocument> {
    this.logger.log(`🔄 Reconfirmando plano após feedback para usuário: ${userId}`);
    
    const goalPlan = await this.getGoalPlan(userId);
    
    if (goalPlan.isActive) {
      throw new BadRequestException('Plano já está ativo');
    }

    // ✅ Limpar tarefas antigas
    await this.tasksService.deleteAllUserTasks(userId);
    
    // ✅ Converter o plano revisado em tasks
    await this.goalToTaskConverter.convertGoalPlanToTasks(goalPlan);
    
    // ✅ Reativar plano
    goalPlan.isActive = true;
    goalPlan.isConfirmed = true;
    goalPlan.confirmedAt = new Date();
    
    const savedPlan = await goalPlan.save();
    this.logger.log('✅ Plano reativado com sucesso após feedback');
    
    return savedPlan;
  }

  private generateDailyTasksPreview(easyGoals: any[]): any[] {
    const today = new Date().toISOString().split('T')[0];
    const previewTasks = [];

    // ✅ CORREÇÃO: Mostrar mais tarefas no preview (até 6)
    const previewEasyGoals = easyGoals.slice(0, 6);

    for (const goal of previewEasyGoals) {
      const dailyTaskDescription = goal.dailyTasks && goal.dailyTasks.length > 0 
        ? goal.dailyTasks[0]
        : `Implementar: ${goal.specificActions?.[0] || goal.title}`;

      previewTasks.push({
        id: `preview-${goal.id}`,
        title: goal.title,
        description: goal.description,
        easyGoalId: goal.id,
        date: today,
        xpValue: 100,
        completed: false,
        status: 'pending',
        taskId: null,
        isPreview: true
      });
    }

    return previewTasks;
  }

  async getPlanProgress(userId: string): Promise<any> {
    const goalPlan = await this.getGoalPlan(userId);

    const completedTasks = goalPlan.dailyTasks.filter((t: any) => t.completed).length;
    const totalTasks = goalPlan.dailyTasks.length;

    return {
      overallProgress: goalPlan.overallProgress,
      daily: {
        completed: completedTasks,
        total: totalTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      extremeGoals: (goalPlan.extremeGoals || []).map((extremeGoal: any) => ({
        ...extremeGoal,
        progress: this.calculateExtremeGoalProgress(extremeGoal, goalPlan)
      })),
      hardGoals: (goalPlan.hardGoals || []).map((hardGoal: any) => ({
        ...hardGoal,
        progress: this.calculateHardGoalProgress(hardGoal, goalPlan)
      }))
    };
  }

  private calculateExtremeGoalProgress(extremeGoal: any, goalPlan: GoalPlanDocument): number {
    const relatedHardGoals = (goalPlan.hardGoals || []).filter((hardGoal: any) => 
      hardGoal.extremeGoalId === extremeGoal.id
    );
    
    if (relatedHardGoals.length === 0) return 0;
    
    const totalProgress = relatedHardGoals.reduce((sum: number, hardGoal: any) => {
      return sum + this.calculateHardGoalProgress(hardGoal, goalPlan);
    }, 0);
    
    return Math.round(totalProgress / relatedHardGoals.length);
  }

  private calculateHardGoalProgress(hardGoal: any, goalPlan: GoalPlanDocument): number {
    const completedMediumGoals = (goalPlan.mediumGoals || []).filter((medium: any) => 
      medium.hardGoalId === hardGoal.id && 
      goalPlan.dailyTasks.some((task: any) => 
        task.easyGoalId && task.completed && 
        (goalPlan.easyGoals || []).some((easy: any) => 
          easy.id === task.easyGoalId && easy.mediumGoalId === medium.id
        )
      )
    ).length;

    return (goalPlan.mediumGoals || []).filter((medium: any) => medium.hardGoalId === hardGoal.id).length > 0 ? 
      Math.round((completedMediumGoals / (goalPlan.mediumGoals || []).filter((medium: any) => medium.hardGoalId === hardGoal.id).length) * 100) : 0;
  }

  private calculateProgress(goalPlan: GoalPlanDocument): number {
    const completed = goalPlan.dailyTasks.filter((t: any) => t.completed).length;
    const total = goalPlan.dailyTasks.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}