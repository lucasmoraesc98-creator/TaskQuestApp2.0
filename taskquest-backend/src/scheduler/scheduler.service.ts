import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProgressService } from '../progress/progress.service';
import { TasksService } from '../tasks/tasks.service'; // CORREÇÃO: Importar TasksService

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private progressService: ProgressService,
    private tasksService: TasksService, // CORREÇÃO: Usar TasksService
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

  // Executa a cada hora para verificar tarefas pendentes
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyTasks() {
    this.logger.log('⏰ Verificando tarefas pendentes...');
    
    try {
      // Lógica para notificar usuários sobre tarefas pendentes
      this.logger.log('✅ Verificação horária concluída');
    } catch (error) {
      this.logger.error('❌ Erro na verificação horária:', error);
    }
  }
}