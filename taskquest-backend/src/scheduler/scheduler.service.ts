import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TasksService } from '../tasks/tasks.service';
import { GoalPlan, GoalPlanDocument } from '../goals/schemas/goal-plan.schema';
import { GoalToTaskConverterService } from '../goals/goal-to-task.converter.service';
import { DailyTasksService } from '../tasks/daily-tasks.service'; // ✅ ADICIONADO

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
    private tasksService: TasksService,
    private goalToTaskConverter: GoalToTaskConverterService,
    private dailyTasksService: DailyTasksService, // ✅ ADICIONADO
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleDailyReset() {
    this.logger.log('🔄 Iniciando atualização diária de tasks...');
    
    try {
      const activePlans = await this.goalPlanModel.find({ 
        isActive: true,
        isConfirmed: true 
      }).exec();
      
      this.logger.log(`📊 Encontrados ${activePlans.length} planos ativos`);

      for (const plan of activePlans) {
        try {
          // ✅ CORRIGIDO: Usando dailyTasksService injetado
          const quarterUpdated = await this.dailyTasksService.checkAndUpdateQuarter(plan);
          
          if (quarterUpdated) {
            this.logger.log(`🔄 Novo trimestre iniciado para usuário ${plan.userId}`);
          }

          // ✅ CORRIGIDO: Usando dailyTasksService injetado
          const hasTodaysTasks = await this.dailyTasksService.hasTodaysDailyTasks(plan.userId.toString());
          
          if (!hasTodaysTasks) {
            await this.dailyTasksService.createTodaysPriorityTasks(plan.userId.toString(), plan);
            this.logger.log(`✅ Novas daily tasks criadas para usuário: ${plan.userId}`);
          } else {
            this.logger.log(`✅ Usuário ${plan.userId} já tem daily tasks para hoje`);
          }

        } catch (error) {
          this.logger.error(`❌ Erro ao processar usuário ${plan.userId}:`, error);
        }
      }
      
      this.logger.log('✅ Atualização diária concluída');
    } catch (error) {
      this.logger.error('❌ Erro na atualização diária:', error);
    }
  }
}