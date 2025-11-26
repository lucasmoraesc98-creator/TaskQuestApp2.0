import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalPlanDto } from './dto/create-goal-plan.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { GoalPlan } from './schemas/goal-plan.schema';
import { Model, Types } from 'mongoose';
import { TasksService } from '../tasks/tasks.service';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  private readonly logger = new Logger(GoalsController.name);

  constructor(
    private readonly goalsService: GoalsService,
    @InjectModel(GoalPlan.name) private goalPlanModel: Model<GoalPlan>,
    private tasksService: TasksService,
  ) {}

  // ✅ ROTA ESPECÍFICA PARA O FRONTEND - AnnualPlanPage.tsx
  @Post('annual-plan/generate')
  async generateAnnualPlan(
    @GetUser() user: User,
    @Body() createGoalPlanDto: CreateGoalPlanDto,
  ) {
    this.logger.log(`🎯 Gerando plano anual via rota específica para usuário: ${user._id}`);
    
    try {
      const goalPlan = await this.goalsService.createGoalPlan(
        user._id.toString(),
        createGoalPlanDto,
      );
      
      return {
        success: true,
        message: 'Plano anual gerado com sucesso',
        data: goalPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar plano anual: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // ✅ ROTA PARA CONFIRMAR PLANO (também usada pelo frontend)
  @Post('annual-plan/confirm')
  async confirmAnnualPlan(@GetUser() user: User) {
    this.logger.log(`✅ Confirmando plano anual para usuário: ${user._id}`);
    
    try {
      const confirmedPlan = await this.goalsService.confirmAnnualPlan(user._id.toString());
      
      return {
        success: true,
        message: 'Plano anual confirmado com sucesso',
        data: confirmedPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao confirmar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // ✅ ROTA PARA OBTER PLANO ATUAL
  @Get('annual-plan/current')
  async getCurrentPlan(@GetUser() user: User) {
    try {
      const goalPlan = await this.goalsService.getGoalPlan(user._id.toString());
      return {
        success: true,
        data: goalPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // ✅ ROTA PARA FEEDBACK (usada pelo frontend)
  @Post('annual-plan/feedback')
  async processPlanFeedback(
    @GetUser() user: User,
    @Body() body: { feedback: string; currentPlan?: any },
  ) {
    this.logger.log(`💬 Processando feedback do usuário: ${user._id}`);
    
    try {
      const revisedPlan = await this.goalsService.processPlanFeedback(
        user._id.toString(),
        body.feedback,
      );
      
      return {
        success: true,
        message: 'Feedback processado com sucesso',
        data: revisedPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar feedback: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // ✅ ROTA PARA RECONFIRMAR APÓS FEEDBACK
  @Post('annual-plan/reconfirm-after-feedback')
  async reconfirmPlanAfterFeedback(@GetUser() user: User) {
    this.logger.log(`🔄 Reconfirmando plano após feedback para: ${user._id}`);
    
    try {
      const reconfirmedPlan = await this.goalsService.reconfirmPlanAfterFeedback(
        user._id.toString(),
      );
      
      return {
        success: true,
        message: 'Plano reconfirmado com sucesso',
        data: reconfirmedPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao reconfirmar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
// ✅ NOVA ROTA: Ajustar plano anual com feedback
  @Post('annual-plan/adjust')
  async adjustAnnualPlan(
    @GetUser() user: User,
    @Body() body: { feedback: string },
  ) {
    this.logger.log(`💬 Ajustando plano anual com feedback para usuário: ${user._id}`);
    
    try {
      const adjustedPlan = await this.goalsService.adjustGoalPlan(
        user._id.toString(),
        body.feedback,
      );
      
      return {
        success: true,
        message: 'Plano anual ajustado com sucesso',
        data: adjustedPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao ajustar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
  // ✅ ROTA PARA ATIVAR PLANO (se necessário)
  @Post('annual-plan/activate')
  async activatePlan(@GetUser() user: User) {
    this.logger.log(`🚀 Ativando plano anual para usuário: ${user._id}`);
    
    try {
      // Esta rota pode ser um alias para confirmAnnualPlan
      const activatedPlan = await this.goalsService.confirmAnnualPlan(user._id.toString());
      
      return {
        success: true,
        message: 'Plano anual ativado com sucesso',
        data: activatedPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao ativar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  
  // ✅ ROTA PARA PROGRESSO DO PLANO
  @Get('annual-plan/progress')
  async getPlanProgress(@GetUser() user: User) {
    try {
      const progress = await this.goalsService.getPlanProgress(user._id.toString());
      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar progresso: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // Rotas originais mantidas para compatibilidade
  @Post('plan')
  async createGoalPlan(
    @GetUser() user: User,
    @Body() createGoalPlanDto: CreateGoalPlanDto,
  ) {
    this.logger.log(`📝 Criando plano anual para usuário: ${user._id}`);
    
    try {
      const goalPlan = await this.goalsService.createGoalPlan(
        user._id.toString(),
        createGoalPlanDto,
      );
      
      return {
        success: true,
        message: 'Plano anual criado com sucesso',
        data: goalPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
// ✅ NOVO ENDPOINT: Debug para verificar todos os planos do usuário
@Get('debug/user-plans')
async debugUserPlans(@GetUser() user: User) {
  this.logger.log(`🐛 [DEBUG] Solicitando debug de planos para usuário: ${user._id}`);
  
  try {
    const plans = await this.goalPlanModel.find({ 
      userId: new Types.ObjectId(user._id.toString()) 
    }).sort({ createdAt: -1 });

    return {
      success: true,
      userId: user._id,
      totalPlans: plans.length,
      plans: plans.map(p => ({
        id: p._id,
        isActive: p.isActive,
        isConfirmed: p.isConfirmed,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        vision: p.vision,
        extremeGoals: p.extremeGoals?.length || 0,
        hardGoals: p.hardGoals?.length || 0,
        mediumGoals: p.mediumGoals?.length || 0,
        easyGoals: p.easyGoals?.length || 0,
        dailyTasks: p.dailyTasks?.length || 0,
      }))
    };
  } catch (error) {
    this.logger.error(`❌ [DEBUG] Erro no debug: ${error.message}`);
    throw new BadRequestException(`Erro no debug: ${error.message}`);
  }
}
  @Get('plan')
  async getGoalPlan(@GetUser() user: User) {
    try {
      const goalPlan = await this.goalsService.getGoalPlan(user._id.toString());
      return {
        success: true,
        data: goalPlan,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar plano: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-tasks')
  async getDailyTasks(@GetUser() user: User) {
    try {
      const dailyTasks = await this.goalsService.getDailyTasks(user._id.toString());
      return {
        success: true,
        data: dailyTasks,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar tarefas diárias: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Post('annual-plan/reset')
async resetAnnualPlan(@GetUser() user: User) {
  this.logger.log(`🔄 RESETANDO plano anual para usuário: ${user._id}`);
  
  try {
    // Buscar plano ativo
    const activePlan = await this.goalPlanModel.findOne({
      userId: new Types.ObjectId(user._id.toString()),
      isActive: true
    });

    if (!activePlan) {
      return {
        success: true,
        message: 'Nenhum plano ativo encontrado para resetar',
      };
    }

    // ✅ 1. Desativar o plano atual
    activePlan.isActive = false;
    activePlan.isConfirmed = false;
    await activePlan.save();

    // ✅ 2. Limpar TODAS as tasks do usuário (incluindo as do plano)
    await this.tasksService.deleteAllUserTasks(user._id.toString());

    // ✅ 3. Recriar apenas as tarefas básicas de saúde
    await this.tasksService.initializeBasicTasks(user._id.toString());

    this.logger.log(`✅ Plano anual resetado com sucesso para usuário: ${user._id}`);

    return {
      success: true,
      message: 'Plano anual resetado com sucesso! Você pode criar um novo plano agora.',
    };
  } catch (error) {
    this.logger.error(`❌ Erro ao resetar plano anual: ${error.message}`);
    throw new BadRequestException(`Falha ao resetar plano: ${error.message}`);
  }
}

  @Put('daily-tasks/:taskId/complete')
  async completeDailyTask(
    @GetUser() user: User,
    @Param('taskId') taskId: string,
  ) {
    try {
      const result = await this.goalsService.completeDailyTask(
        user._id.toString(),
        taskId,
      );
      return {
        success: true,
        message: 'Tarefa concluída com sucesso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao completar tarefa: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Post('cleanup')
  async cleanupOldData(@GetUser() user: User) {
    this.logger.log(`🧹 Limpando dados antigos do usuário: ${user._id}`);
    
    try {
      await this.goalsService.cleanupOldUserData(user._id.toString());
      
      return {
        success: true,
        message: 'Dados antigos removidos com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar dados: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}