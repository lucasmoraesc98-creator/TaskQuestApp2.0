import { taskService, Task } from './task.service';

const BASIC_TASKS_CONFIG = [
  {
    title: '💧 Beber 2L de água',
    description: 'Manter-se hidratado durante o dia',
    xp: 20,
    type: 'health' as const,
    priority: 'medium' as const,
    estimatedTime: 0,
    category: 'hydration'
  },
  {
    title: '🏃 Exercício físico - 30min',
    description: 'Atividade física para manter a saúde',
    xp: 20,
    type: 'health' as const,
    priority: 'high' as const,
    estimatedTime: 30,
    category: 'exercise'
  },
  {
    title: '📖 Ler 5 páginas de livro',
    description: 'Desenvolvimento pessoal através da leitura',
    xp: 20,
    type: 'health' as const,
    priority: 'medium' as const,
    estimatedTime: 15,
    category: 'reading'
  },
  {
    title: '🍎 3 refeições balanceadas',
    description: 'Manter alimentação saudável durante o dia',
    xp: 20,
    type: 'health' as const,
    priority: 'high' as const,
    estimatedTime: 0,
    category: 'nutrition'
  },
  {
    title: '🧠 Meditar 10 minutos',
    description: 'Praticar mindfulness para saúde mental',
    xp: 20,
    type: 'health' as const,
    priority: 'medium' as const,
    estimatedTime: 10,
    category: 'meditation'
  }
];

export const dailyTasksService = {
  async initializeDailyTasks(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = await taskService.getTasks(today);
      
      // Verificar se as tarefas básicas já existem
      const existingBasicTasks = todayTasks.filter(task => 
        task.type === 'health' && task.dailyReset
      );
      
      if (existingBasicTasks.length < BASIC_TASKS_CONFIG.length) {
        console.log('🔄 Inicializando tarefas diárias básicas...');
        
        for (const taskConfig of BASIC_TASKS_CONFIG) {
          const exists = existingBasicTasks.some(task => 
            task.title.includes(taskConfig.title.split(' ')[0]) // Match pelo emoji + primeira palavra
          );
          
          if (!exists) {
            await taskService.createTask({
              ...taskConfig,
              dailyReset: true
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
      
      // Resetar tarefas diárias completadas
      const resetPromises = tasks
        .filter(task => task.dailyReset && task.completed)
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