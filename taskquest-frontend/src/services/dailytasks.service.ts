// taskquest-frontend/src/services/dailytasks.service.ts
import { taskService } from './task.service';

export const dailyTasksService = {
  async initializeDailyTasks(): Promise<void> {
    try {
      await taskService.initializeBasicTasks();
      console.log('✅ Tarefas básicas inicializadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar tarefas básicas:', error);
    }
  },
};