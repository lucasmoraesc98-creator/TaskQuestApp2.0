import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './schemas/task.schema';
import { GoalPlanDocument } from '../goals/schemas/goal-plan.schema';

@Injectable()
export class DailyTasksService {
  private readonly logger = new Logger(DailyTasksService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  // ✅ CORRIGIDO: Tipagem simplificada
  async getTodaysPriorityTasks(userId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar todas as tasks do tipo goal_daily não concluídas
    const allDailyTasks = await this.taskModel.find({
      userId: new Types.ObjectId(userId),
      type: 'goal_daily',
      completed: false,
      date: { $lte: today }
    }).exec();

    this.logger.log(`📊 Encontradas ${allDailyTasks.length} daily tasks para usuário ${userId}`);

    // Ordenar por prioridade (prazo + prioridade)
    const prioritizedTasks = this.prioritizeTasksByDeadline(allDailyTasks);

    // Retornar apenas as 3 mais prioritárias
    return prioritizedTasks.slice(0, 3);
  }

  // ✅ CORRIGIDO: Usando tipo Task diretamente
  private prioritizeTasksByDeadline(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      const aDeadline = a.aiData?.deadline;
      const bDeadline = b.aiData?.deadline;

      // 1. Tasks sem prazo vão para o final
      if (!aDeadline && !bDeadline) return 0;
      if (!aDeadline) return 1;
      if (!bDeadline) return -1;

      // 2. Comparar prazos (mais próximos primeiro)
      const aDate = new Date(aDeadline).getTime();
      const bDate = new Date(bDeadline).getTime();
      const deadlineDiff = aDate - bDate;

      if (deadlineDiff !== 0) return deadlineDiff;

      // 3. Se mesmo prazo, priorizar por prioridade (high > medium > low)
      const priorityWeight = { high: 1, medium: 2, low: 3 };
      const aPriority = a.aiData?.priority || 'medium';
      const bPriority = b.aiData?.priority || 'medium';
      
      return priorityWeight[aPriority] - priorityWeight[bPriority];
    });
  }

  // ✅ VERIFICAR se existem daily tasks para hoje
  async hasTodaysDailyTasks(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    const count = await this.taskModel.countDocuments({
      userId: new Types.ObjectId(userId),
      type: 'goal_daily',
      date: today,
      completed: false
    });

    return count > 0;
  }

  // ✅ CORRIGIDO: Adicionado parâmetro userId
  async createTodaysPriorityTasks(userId: string, goalPlan: GoalPlanDocument): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Remover daily tasks antigas não concluídas
    await this.taskModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type: 'goal_daily',
      date: today,
      completed: false
    });

    // Buscar easy goals do trimestre atual
    const currentQuarter = goalPlan.currentQuarter || 1;
    const quarterData = goalPlan.quarters?.[currentQuarter];
    
    if (!quarterData || !quarterData.easyGoals) {
      this.logger.warn(`❌ Nenhum dado do trimestre ${currentQuarter} encontrado`);
      return;
    }

    const easyGoals = quarterData.easyGoals;
    const todaysTasks = this.selectTodaysTasksFromEasyGoals(easyGoals, today, userId);

    if (todaysTasks.length > 0) {
      await this.taskModel.insertMany(todaysTasks);
      this.logger.log(`✅ ${todaysTasks.length} daily tasks criadas para hoje`);
    }
  }

  // ✅ CORRIGIDO: Adicionado parâmetro userId
  private selectTodaysTasksFromEasyGoals(easyGoals: any[], today: string, userId: string): any[] {
    const allTasks: any[] = [];

    // Coletar todas as daily tasks das easy goals
    for (const easyGoal of easyGoals) {
      if (easyGoal.dailyTasks && Array.isArray(easyGoal.dailyTasks)) {
        for (const dailyTask of easyGoal.dailyTasks) {
          const taskDeadline = typeof dailyTask === 'object' ? dailyTask.deadline : null;
          
          // Só incluir tasks com prazos futuros ou hoje
          if (!taskDeadline || new Date(taskDeadline) >= new Date(today)) {
            allTasks.push({
              userId: new Types.ObjectId(userId), // ✅ Usando userId passado como parâmetro
              text: typeof dailyTask === 'object' ? dailyTask.title : dailyTask,
              description: typeof dailyTask === 'object' ? dailyTask.description : `Progresso em: ${easyGoal.title}`,
              xp: 100,
              type: 'goal_daily',
              date: today,
              completed: false,
              aiData: {
                easyGoalId: easyGoal.id,
                deadline: taskDeadline,
                priority: typeof dailyTask === 'object' ? dailyTask.priority : 'medium',
                estimatedMinutes: typeof dailyTask === 'object' ? dailyTask.estimatedMinutes : 45,
                fromAnnualPlan: true
              }
            });
          }
        }
      }
    }

    // Ordenar por prazo (mais próximos primeiro) e selecionar top 3
    return allTasks
      .sort((a, b) => {
        const aDate = new Date(a.aiData.deadline || '9999-12-31').getTime();
        const bDate = new Date(b.aiData.deadline || '9999-12-31').getTime();
        return aDate - bDate;
      })
      .slice(0, 3);
  }

  // ✅ ATUALIZAR trimestre automaticamente
  async checkAndUpdateQuarter(goalPlan: GoalPlanDocument): Promise<boolean> {
    const now = new Date();
    const currentQuarter = goalPlan.currentQuarter || 1;
    
    // Verificar se o trimestre atual acabou
    const quarterData = goalPlan.quarters?.[currentQuarter];
    if (quarterData && quarterData.endDate) {
      const quarterEnd = new Date(quarterData.endDate);
      
      if (now > quarterEnd) {
        // Avançar para o próximo trimestre
        const nextQuarter = currentQuarter + 1;
        
        if (goalPlan.quarters?.[nextQuarter]) {
          goalPlan.currentQuarter = nextQuarter;
          await goalPlan.save();
          
          this.logger.log(`🔄 Usuário ${goalPlan.userId} avançou para o trimestre ${nextQuarter}`);
          return true;
        } else {
          this.logger.log(`🎉 Usuário ${goalPlan.userId} completou todos os trimestres!`);
        }
      }
    }
    
    return false;
  }
}