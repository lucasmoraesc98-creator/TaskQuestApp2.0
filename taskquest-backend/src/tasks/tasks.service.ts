import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProgressService } from '../progress/progress.service';
import { DailyTasksService } from './daily-tasks.service';

export interface CompleteTaskResponse {
  task: Task;
  user: { xp: number; level: number; totalXP: number };
  leveledUp?: boolean;
  newLevel?: number;
  currentStreak?: number;
}

export interface TodayStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  totalXP: number;
  xpByType: {
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
  };
  dailyXPLimit: number;
  xpEarnedToday: number;
}

const DAILY_XP_LIMIT = 400;
const AI_TASK_XP = 100;
const BASIC_TASK_XP = 20;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private progressService: ProgressService,
    private dailyTasksService: DailyTasksService, // ✅ CORRIGIDO: Injeção correta
  ) {}

  // ✅ MÉTODO CORRIGIDO: Buscar apenas as 3 daily tasks prioritárias
  async getTodaysPriorityTasks(userId: string): Promise<Task[]> {
    return this.dailyTasksService.getTodaysPriorityTasks(userId);
  }

  // ✅ MÉTODO CORRIGIDO: Limpar TODAS as tarefas do usuário
  async deleteAllUserTasks(userId: string): Promise<void> {
    this.logger.log(`🧹 LIMPANDO TODAS as tarefas do usuário: ${userId}`);
    
    try {
      const result = await this.taskModel.deleteMany({ 
        userId: new Types.ObjectId(userId) 
      }).exec();
      
      this.logger.log(`✅ ${result.deletedCount} tarefas REMOVIDAS do usuário ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar tarefas do usuário ${userId}:`, error);
      throw new Error('Falha ao limpar tarefas antigas');
    }
  }

  // ✅ MÉTODO CORRIGIDO: Limpar apenas tarefas básicas (20xp)
  async deleteBasicTasks(userId: string): Promise<void> {
    this.logger.log(`🧹 Limpando tarefas básicas do usuário: ${userId}`);
    
    try {
      const result = await this.taskModel.deleteMany({ 
        userId: new Types.ObjectId(userId),
        xp: BASIC_TASK_XP,
        type: { $ne: 'ai_suggestion' }
      }).exec();
      
      this.logger.log(`✅ ${result.deletedCount} tarefas básicas removidas`);
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar tarefas básicas:`, error);
    }
  }

  async create(createTaskDto: CreateTaskDto & { userId: string }): Promise<Task> {
    const today = new Date().toISOString().split('T')[0];
    
    if (createTaskDto.type !== 'health') {
      const existingTask = await this.taskModel.findOne({
        userId: new Types.ObjectId(createTaskDto.userId),
        text: createTaskDto.text,
        date: today
      }).exec();

      if (existingTask) {
        throw new BadRequestException('Tarefa similar já existe para hoje');
      }
    }

    const createdTask = new this.taskModel({
      ...createTaskDto,
      userId: new Types.ObjectId(createTaskDto.userId),
      date: createTaskDto.date || today
    });
    return createdTask.save();
  }

  // ✅ MÉTODO COMPLETAMENTE CORRIGIDO: findAllByUser
  async findAllByUser(userId: string, date?: string): Promise<Task[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (date) {
      query.date = date;
    } else {
      const today = new Date().toISOString().split('T')[0];
      query.date = today;
    }

    // Buscar todas as tasks
    const allTasks = await this.taskModel.find(query).sort({ createdAt: -1 }).exec();

    // Separar daily tasks das outras tasks
    const dailyTasks = allTasks.filter(task => task.type === 'goal_daily');
    const otherTasks = allTasks.filter(task => task.type !== 'goal_daily');

    // Se há daily tasks, pegar apenas as 3 prioritárias
    let priorityDailyTasks: Task[] = [];
    if (dailyTasks.length > 0) {
      priorityDailyTasks = await this.dailyTasksService.getTodaysPriorityTasks(userId);
    }

    // Combinar tasks prioritárias com outras tasks
    const combinedTasks = [...priorityDailyTasks, ...otherTasks];

    // Definir a prioridade dos tipos
    const typePriority = {
      'goal_extreme': 1,
      'goal_hard': 2,
      'goal_medium': 3,
      'plan_review': 4,
      'health': 5,
      'goal_daily': 6,
      'custom': 7,
      'basic': 8
    };

    // Ordenar em memória pela prioridade do tipo
    return combinedTasks.sort((a, b) => {
      const priorityA = typePriority[a.type] || 10;
      const priorityB = typePriority[b.type] || 10;
      return priorityA - priorityB;
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const existingTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    
    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return existingTask;
  }
// Adicione este método à sua TasksService existente
async deleteGoalTasks(userId: string): Promise<void> {
  this.logger.log(`🧹 Limpando tasks de goals do usuário ${userId}`);
  
  try {
    await this.taskModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type: { 
        $in: ['goal_extreme', 'goal_hard', 'goal_medium', 'goal_easy', 'goal_daily'] 
      }
    });
    
    this.logger.log('✅ Tasks de goals removidas com sucesso');
  } catch (error) {
    this.logger.error('❌ Erro ao limpar tasks de goals:', error);
    throw error;
  }
}

 async completeTask(id: string): Promise<CompleteTaskResponse> {
  const task = await this.taskModel.findById(id).exec();
  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }

  // ✅ VERIFICAR: Task já está completada?
  if (task.completed) {
    throw new BadRequestException('Task already completed');
  }

  // ✅ VERIFICAR: Limite diário de XP
  const today = new Date().toISOString().split('T')[0];
  const todayStats = await this.getUserStats(task.userId.toString(), today);
  
  if (todayStats.xpEarnedToday + task.xp > DAILY_XP_LIMIT) {
    throw new BadRequestException(`Limite diário de XP atingido (${DAILY_XP_LIMIT}XP)`);
  }

  try {
    // ✅ ATUALIZAR task como concluída
    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    // ✅ ADICIONAR XP ao usuário
    const progressResult = await this.progressService.addXP(task.userId.toString(), task.xp);

    return {
      task: task.toObject(), // ✅ GARANTIR que retornamos um objeto simples
      user: {
        xp: progressResult.newXP,
        level: progressResult.newLevel,
        totalXP: progressResult.totalXP
      },
      leveledUp: progressResult.leveledUp,
      newLevel: progressResult.newLevel,
      currentStreak: progressResult.currentStreak
    };
  } catch (error) {
    // ✅ REVERTER em caso de erro
    task.completed = false;
    task.completedAt = undefined;
    await task.save();
    throw error;
  }
}
  async remove(id: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async getUserStats(userId: string, date: string): Promise<TodayStats> {
    const tasks = await this.taskModel.find({
      userId: new Types.ObjectId(userId),
      date: date
    }).exec();

    const completedTasks = tasks.filter(task => task.completed);
    const totalXP = completedTasks.reduce((sum, task) => sum + task.xp, 0);

    const xpByType = {
      highImpact: completedTasks.filter(t => t.xp === AI_TASK_XP).reduce((sum, t) => sum + t.xp, 0),
      mediumImpact: completedTasks.filter(t => t.xp === 50).reduce((sum, t) => sum + t.xp, 0),
      lowImpact: completedTasks.filter(t => t.xp === BASIC_TASK_XP).reduce((sum, t) => sum + t.xp, 0)
    };

    return {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.length - completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      totalXP,
      xpByType,
      dailyXPLimit: DAILY_XP_LIMIT,
      xpEarnedToday: totalXP
    };
  }

  async getTodayTasksStats(userId: string): Promise<TodayStats> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserStats(userId, today);
  }

  async resetDailyTasks(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await this.taskModel.deleteMany({
      userId: new Types.ObjectId(userId),
      date: today,
      type: 'health'
    }).exec();
  }

  async initializeBasicTasks(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const basicTasks = [
      {
        text: '💧 Beber 2L de água',
        xp: BASIC_TASK_XP,
        type: 'health',
        reason: 'Manter-se hidratado durante o dia'
      },
      {
        text: '🏃 Exercício físico - 30min',
        xp: BASIC_TASK_XP,
        type: 'health', 
        reason: 'Atividade física para manter a saúde'
      },
      {
        text: '📖 Ler 5 páginas de um livro',
        xp: BASIC_TASK_XP,
        type: 'health',
        reason: 'Desenvolvimento pessoal através da leitura'
      },
      {
        text: '🍎 3 refeições balanceadas',
        xp: BASIC_TASK_XP,
        type: 'health',
        reason: 'Manter alimentação saudável durante o dia'
      },
      {
        text: '🧠 Meditar 10 minutos',
        xp: BASIC_TASK_XP,
        type: 'health',
        reason: 'Praticar mindfulness para saúde mental'
      }
    ];

    await this.taskModel.deleteMany({
      userId: new Types.ObjectId(userId),
      date: today,
      type: 'health'
    }).exec();

    for (const taskData of basicTasks) {
      await this.create({
        ...taskData,
        userId,
        date: today
      });
    }
    
    this.logger.log(`✅ ${basicTasks.length} tarefas básicas CRIADAS para o usuário ${userId}`);
  }
}