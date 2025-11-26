import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/schemas/user.schema'; // Ajuste o caminho conforme sua estrutura
import { GetUser } from '../auth/decorators/get-user.decorator'; // Ajuste o caminho

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name); // Logger adicionado

  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  @ApiResponse({ status: 201, description: 'Tarefa criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Limite diário atingido ou tarefa duplicada' })
  async create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create({
      ...createTaskDto,
      userId: req.user._id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas do usuário' })
  @ApiQuery({ name: 'date', required: false, description: 'Data no formato YYYY-MM-DD' })
  async findAll(@Request() req, @Query('date') date?: string) {
    return this.tasksService.findAllByUser(req.user._id, date);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas do usuário' })
  @ApiQuery({ name: 'date', required: false, description: 'Data no formato YYYY-MM-DD' })
  async getStats(@Request() req, @Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.tasksService.getUserStats(req.user._id, targetDate);
  }

  @Get('today-stats')
  @ApiOperation({ summary: 'Obter estatísticas de hoje' })
  async getTodayStats(@Request() req) {
    return this.tasksService.getTodayTasksStats(req.user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter tarefa específica' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Marcar tarefa como concluída e ganhar XP' })
  @ApiResponse({ status: 200, description: 'Tarefa concluída e XP adicionado' })
  @ApiResponse({ status: 400, description: 'Limite diário de XP atingido' })
  async complete(@Param('id') id: string) {
    return this.tasksService.completeTask(id);
  }

  @Put('health/:id/complete')
  async completeHealthTask(
    @Param('id') taskId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(`🏥 Completando tarefa de saúde ${taskId} para usuário ${user._id}`);
    return this.tasksService.completeTask(taskId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir tarefa' })
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Post('reset-daily')
  @ApiOperation({ summary: 'Resetar tarefas do dia' })
  async resetDaily(@Request() req) {
    await this.tasksService.resetDailyTasks(req.user._id);
    return { message: 'Tarefas do dia resetadas com sucesso' };
  }

  @Post('initialize-basic')
  @ApiOperation({ summary: 'Inicializar tarefas básicas do dia' })
  async initializeBasicTasks(@Request() req) {
    await this.tasksService.initializeBasicTasks(req.user._id);
    return { message: 'Tarefas básicas inicializadas com sucesso' };
  }
}