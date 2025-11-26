import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface CompleteTaskResponse {
  task: Task;
  user: { xp: number; level: number };
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
}

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto & { userId: string }): Promise<Task> {
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe tarefa similar hoje
    const existingTask = await this.taskModel.findOne({
      userId: new Types.ObjectId(createTaskDto.userId),
      text: createTaskDto.text,
      date: today
    }).exec();

    if (existingTask) {
      throw new BadRequestException('Tarefa similar já existe para hoje');
    }

    // Verificar limite diário de XP
    const todayTasks = await this.taskModel.find({
      userId: new Types.ObjectId(createTaskDto.userId),
      date: today
    }).exec();

    const todayXP = todayTasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
    if (todayXP + createTaskDto.xp > 400) {
      throw new BadRequestException('Limite diário de XP atingido (400XP)');
    }

    const createdTask = new this.taskModel({
      ...createTaskDto,
      userId: new Types.ObjectId(createTaskDto.userId),
      date: createTaskDto.date || today
    });
    return createdTask.save();
  }

  async findAllByUser(userId: string, date?: string): Promise<Task[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (date) {
      query.date = date;
    } else {
      const today = new Date().toISOString().split('T')[0];
      query.date = today;
    }

    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
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

  async completeTask(id: string): Promise<CompleteTaskResponse> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (task.completed) {
      throw new BadRequestException('Task already completed');
    }

    // Verificar limite diário de XP antes de completar
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = await this.taskModel.find({
      userId: task.userId,
      date: today,
      completed: true
    }).exec();

    const todayXP = todayTasks.reduce((sum, t) => sum + t.xp, 0);
    if (todayXP + task.xp > 400) {
      throw new BadRequestException('Limite diário de XP atingido (400XP)');
    }

    // Atualizar tarefa como concluída
    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    // Simular resposta do usuário (em produção, isso viria do serviço de usuários)
    const userResponse = {
      xp: todayXP + task.xp,
      level: Math.floor((todayXP + task.xp) / 1000) + 1
    };

    return {
      task,
      user: userResponse,
      leveledUp: false,
      currentStreak: 1
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async getUserStats(userId: string, date: string): Promise<any> {
    const tasks = await this.taskModel.find({
      userId: new Types.ObjectId(userId),
      date: date
    }).exec();

    const completed = tasks.filter(task => task.completed).length;
    const totalXP = tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + task.xp, 0);

    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
      completionRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
      totalXP,
      xpByType: {
        highImpact: 0,
        mediumImpact: 0,
        lowImpact: 0
      }
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
      type: { $in: ['health', 'basic'] }
    }).exec();
  }
}