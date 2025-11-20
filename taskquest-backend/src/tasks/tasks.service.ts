import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Task } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private progressService: ProgressService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const today = new Date().toISOString().split('T')[0];

    // Verifica limite diário de tarefas
    const todayTasks = await this.taskModel.find({
      userId: createTaskDto.userId,
      date: today,
    });

    if (todayTasks.length >= 15) {
      throw new BadRequestException('Limite diário de 15 tarefas atingido');
    }

    // Verifica duplicatas
    const existingTask = todayTasks.find(
      task => task.text.toLowerCase() === createTaskDto.text.toLowerCase() && !task.completed
    );

    if (existingTask) {
      throw new BadRequestException('Esta tarefa já existe hoje');
    }

    const task = await this.taskModel.create(createTaskDto);
    return task;
  }

  async findAllByUser(userId: string, date?: string): Promise<Task[]> {
    const query: any = { userId };
    
    if (date) {
      query.date = date;
    } else {
      // Por padrão, retorna tarefas do dia atual
      query.date = new Date().toISOString().split('T')[0];
    }

    return this.taskModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskModel.findByIdAndUpdate(
      id,
      { $set: updateTaskDto },
      { new: true, runValidators: true },
    );

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return task;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Tarefa não encontrada');
    }
  }

  async completeTask(id: string): Promise<{ 
    task: Task; 
    leveledUp?: boolean; 
    levelsGained?: number; 
    newLevel?: number;
    currentStreak?: number;
  }> {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.completed) {
      throw new BadRequestException('Tarefa já está concluída');
    }

    // Marca a tarefa como concluída
    const updatedTask = await this.taskModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          completed: true, 
          completedAt: new Date() 
        } 
      },
      { new: true },
    );

    // Adiciona XP ao usuário
    try {
      const progressResult = await this.progressService.addXP(task.userId.toString(), task.xp);
      
      return {
        task: updatedTask,
        leveledUp: progressResult.leveledUp,
        levelsGained: progressResult.levelsGained,
        newLevel: progressResult.newLevel,
        currentStreak: progressResult.currentStreak
      };
    } catch (error) {
      // Se houver erro ao adicionar XP (limite diário), desfaz a conclusão da tarefa
      await this.taskModel.findByIdAndUpdate(
        id,
        { 
          $set: { 
            completed: false, 
            completedAt: null 
          } 
        }
      );
      throw new BadRequestException(error.message);
    }
  }

  async getUserStats(userId: string, date: string): Promise<any> {
    const tasks = await this.taskModel.find({ userId, date });
    const completedTasks = tasks.filter(task => task.completed);
    const xpEarned = completedTasks.reduce((sum, task) => sum + task.xp, 0);

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      xpEarned,
    };
  }

  async resetDailyTasks(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.taskModel.deleteMany({ userId, date: today });
  }

  async getTodayTasksStats(userId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await this.taskModel.find({ userId, date: today });
    const completedTasks = tasks.filter(task => task.completed);
    
    const xpByType = {
      highImpact: tasks.filter(t => t.xp === 100 && t.completed).length * 100,
      mediumImpact: tasks.filter(t => t.xp === 50 && t.completed).length * 50,
      lowImpact: tasks.filter(t => t.xp === 10 && t.completed).length * 10,
    };

    return {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.length - completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      totalXP: Object.values(xpByType).reduce((sum, xp) => sum + xp, 0),
      xpByType,
    };
  }
}