import { taskService, Task } from './task.service';

const BASIC_TASKS_CONFIG = [
  {
    text: '💧 Beber 2L de água',
    description: 'Manter-se hidratado durante o dia',
    xp: 20,
    type: 'health' as const,
  },
  {
    text: '🏃 Exercício físico - 30min',
    description: 'Atividade física para manter a saúde',
    xp: 20,
    type: 'health' as const,
  },
  {
    text: '📖 Ler 5 páginas de livro',
    description: 'Desenvolvimento pessoal através da leitura',
    xp: 20,
    type: 'health' as const,
  },
  {
    text: '🍎 3 refeições balanceadas',
    description: 'Manter alimentação saudável durante o dia',
    xp: 20,
    type: 'health' as const,
  },
  {
    text: '🧠 Meditar 10 minutos',
    description: 'Praticar mindfulness para saúde mental',
    xp: 20,
    type: 'health' as const,
  }
];

export const dailyTasksService = {
  async initializeDailyTasks(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = await taskService.getTasks(today);
      
      // Verificar se as tarefas básicas já existem
      const existingBasicTasks = todayTasks.filter(task => 
        task.type === 'health'
      );
      
      if (existingBasicTasks.length < BASIC_TASKS_CONFIG.length) {
        console.log('🔄 Inicializando tarefas diárias básicas...');
        
        for (const taskConfig of BASIC_TASKS_CONFIG) {
          const exists = existingBasicTasks.some(task => 
            task.text === taskConfig.text
          );
          
          if (!exists) {
            await taskService.createTask({
              text: taskConfig.text,
              xp: taskConfig.xp,
              type: taskConfig.type,
              reason: taskConfig.description,
            });
          }
        }

        console.log('✅ Tarefas básicas diárias inicializadas com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar tarefas diárias:', error);
    }
  },

  async resetCompletedTasks(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tasks = await taskService.getTasks(today);
      
      // Resetar tarefas de saúde completadas
      const resetPromises = tasks
        .filter(task => task.type === 'health' && task.completed)
        .map(task => 
          taskService.updateTask(task._id, { 
            completed: false 
          })
        );
      
      await Promise.all(resetPromises);
      console.log('🔄 Tarefas diárias resetadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao resetar tarefas:', error);
    }
  },

  getBasicTasksConfig() {
    return BASIC_TASKS_CONFIG;
  },

  calculateDailyXP(tasks: Task[]): number {
    return tasks
      .filter(task => task.completed)
      .reduce((total, task) => total + task.xp, 0);
  },

  canEarnMoreXP(tasks: Task[], newTaskXP: number = 0): boolean {
    const currentXP = this.calculateDailyXP(tasks);
    return currentXP + newTaskXP <= 400; // Limite diário de XP
  }
};