import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoalPlan, GoalPlanDocument } from '../goals/schemas/goal-plan.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Progress, ProgressDocument } from '../progress/schemas/progress.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class ResetService {
  private readonly logger = new Logger(ResetService.name);

  constructor(
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlanDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(User.name) private userModel: Model<Document>,
  ) {}

  async resetUserAccount(userId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`🔄 RESET COMPLETO DA CONTA para usuário: ${userId}`);
    
    try {
      const userObjectId = new Types.ObjectId(userId);

      // ✅ 1. Remover TODOS os planos anuais
      const plansResult = await this.goalPlanModel.deleteMany({ userId: userObjectId });
      this.logger.log(`✅ ${plansResult.deletedCount} planos removidos`);

      // ✅ 2. Remover TODAS as tasks
      const tasksResult = await this.taskModel.deleteMany({ userId: userObjectId });
      this.logger.log(`✅ ${tasksResult.deletedCount} tasks removidas`);

      // ✅ 3. Resetar progresso (ou criar novo se não existir)
      await this.progressModel.findOneAndUpdate(
        { userId: userObjectId },
        {
          $set: {
            xp: 0,
            level: 1,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null
          }
        },
        { upsert: true, new: true }
      );
      this.logger.log('✅ Progresso resetado para zero');

      // ✅ 4. Resetar informações do usuário (mantendo apenas email e senha)
      await this.userModel.findByIdAndUpdate(userId, {
        $set: {
          vision: '',
          goals: [],
          challenges: [],
          tools: [],
          skills: [],
          hoursPerWeek: 10,
          productivityStyle: 'balanced',
          preferences: {
            worksFromHome: false,
            morningPerson: false
          },
          // Mantém: name, email, password
        }
      });
      this.logger.log('✅ Informações do usuário resetadas');

      // ✅ 5. Criar tarefas básicas iniciais
      await this.createInitialBasicTasks(userId);

      this.logger.log(`🎉 CONTA RESETADA COMPLETAMENTE para usuário: ${userId}`);

      return {
        success: true,
        message: 'Conta resetada com sucesso! Você agora é um novo usuário. Suas tarefas básicas foram recriadas.'
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao resetar conta: ${error.message}`);
      throw new Error(`Falha ao resetar conta: ${error.message}`);
    }
  }

  private async createInitialBasicTasks(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const basicTasks = [
      {
        userId: new Types.ObjectId(userId),
        text: '💧 Beber 2L de água',
        xp: 20,
        type: 'health',
        reason: 'Manter-se hidratado durante o dia',
        date: today,
        completed: false
      },
      {
        userId: new Types.ObjectId(userId),
        text: '🏃 Exercício físico - 30min',
        xp: 20,
        type: 'health', 
        reason: 'Atividade física para manter a saúde',
        date: today,
        completed: false
      },
      {
        userId: new Types.ObjectId(userId),
        text: '📖 Ler 5 páginas de um livro',
        xp: 20,
        type: 'health',
        reason: 'Desenvolvimento pessoal através da leitura',
        date: today,
        completed: false
      },
      {
        userId: new Types.ObjectId(userId),
        text: '🍎 3 refeições balanceadas',
        xp: 20,
        type: 'health',
        reason: 'Manter alimentação saudável durante o dia',
        date: today,
        completed: false
      },
      {
        userId: new Types.ObjectId(userId),
        text: '🧠 Meditar 10 minutos',
        xp: 20,
        type: 'health',
        reason: 'Praticar mindfulness para saúde mental',
        date: today,
        completed: false
      }
    ];

    await this.taskModel.insertMany(basicTasks);
    this.logger.log(`✅ ${basicTasks.length} tarefas básicas criadas`);
  }
}