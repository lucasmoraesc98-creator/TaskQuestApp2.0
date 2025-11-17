import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProgressService } from '../progress/progress.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private progressService: ProgressService,
    private tasksService: TasksService,
  ) {}

  // Executa todos os dias à meia-noite
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReset() {
    this.logger.log('🔄 Iniciando reset diário de progresso...');
    
    try {
      // Aqui você precisaria obter todos os usuários
      // Por enquanto é um placeholder
      this.logger.log('✅ Reset diário concluído');
    } catch (error) {
      this.logger.error('❌ Erro no reset diário:', error);
    }
  }
}