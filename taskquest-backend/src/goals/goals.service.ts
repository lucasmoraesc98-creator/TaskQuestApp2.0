import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoalPlan, GoalPlanDocument } from './schemas/goal-plan.schema';
import { CreateGoalPlanDto } from './dto/create-goal-plan.dto';
import { SimpleAIService } from '../ai/simple-ai.service';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
    private simpleAI: SimpleAIService,
  ) {}

  async createGoalPlan(userId: string, createGoalPlanDto: CreateGoalPlanDto): Promise<GoalPlanDocument> {
    // Verificar se já existe plano ativo
    const existingPlan = await this.goalPlanModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      isActive: true 
    });

    if (existingPlan) {
      throw new BadRequestException('Já existe um plano ativo');
    }

    try {
      // Gerar plano com IA (simples)
      const aiPlan = await this.simpleAI.generateYearlyPlan(createGoalPlanDto);
      
      // Gerar tarefas diárias iniciais
      const dailyTasks = this.generateDailyTasks(aiPlan.easyGoals);

      const goalPlan = new this.goalPlanModel({
        userId: new Types.ObjectId(userId),
        vision: createGoalPlanDto.vision,
        hardGoals: aiPlan.hardGoals,
        mediumGoals: aiPlan.mediumGoals,
        easyGoals: aiPlan.easyGoals,
        dailyTasks: dailyTasks,
        overallProgress: 0,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      return await goalPlan.save();
    } catch (error) {
      this.logger.error('Erro ao criar plano:', error);
      throw new BadRequestException('Falha ao criar plano');
    }
  }

  async getGoalPlan(userId: string): Promise<GoalPlanDocument> {
    const goalPlan = await this.goalPlanModel.findOne({ 
      userId: new Types.ObjectId(userId),
      isActive: true 
    });

    if (!goalPlan) {
      throw new NotFoundException('Plano não encontrado');
    }

    return goalPlan;
  }

  async getDailyTasks(userId: string): Promise<any[]> {
    const goalPlan = await this.getGoalPlan(userId);
    const today = new Date().toISOString().split('T')[0];

    // Retornar tarefas de hoje
    return goalPlan.dailyTasks
      .filter(task => task.date === today)
      .slice(0, 3);
  }

  async completeDailyTask(userId: string, taskId: string): Promise<GoalPlanDocument> {
    const goalPlan = await this.getGoalPlan(userId);
    
    const task = goalPlan.dailyTasks.find(t => t.id === taskId);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    task.completed = true;
    task.status = 'completed';
    task.completedAt = new Date();

    // Recalcular progresso
    goalPlan.overallProgress = this.calculateProgress(goalPlan);

    return await goalPlan.save();
  }

  async getPlanProgress(userId: string): Promise<any> {
    const goalPlan = await this.getGoalPlan(userId);

    const completedTasks = goalPlan.dailyTasks.filter(t => t.completed).length;
    const totalTasks = goalPlan.dailyTasks.length;

    return {
      overallProgress: goalPlan.overallProgress,
      daily: {
        completed: completedTasks,
        total: totalTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    };
  }

  private generateDailyTasks(easyGoals: any[]): any[] {
    const today = new Date().toISOString().split('T')[0];
    
    return easyGoals.slice(0, 3).map((goal, index) => ({
      id: `task-${today}-${index}`,
      title: `Trabalhar em: ${goal.title}`,
      description: goal.description,
      easyGoalId: goal.id,
      date: today,
      xpValue: 100,
      completed: false,
      status: 'pending'
    }));
  }

  private calculateProgress(goalPlan: GoalPlanDocument): number {
    const completed = goalPlan.dailyTasks.filter(t => t.completed).length;
    const total = goalPlan.dailyTasks.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}