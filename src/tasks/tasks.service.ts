import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Task } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

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

  async completeTask(id: string): Promise<Task> {
    const task = await this.taskModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          completed: true, 
          completedAt: new Date() 
        } 
      },
      { new: true },
    );

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return task;
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
}