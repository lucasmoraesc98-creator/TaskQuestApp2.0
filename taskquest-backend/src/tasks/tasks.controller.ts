import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
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
  @ApiOperation({ summary: 'Marcar tarefa como concluída' })
  async complete(@Param('id') id: string) {
    return this.tasksService.completeTask(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir tarefa' })
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Post('reset-daily')
  @ApiOperation({ summary: 'Resetar tarefas do dia' })
  async resetDaily(@Request() req) {
    return this.tasksService.resetDailyTasks(req.user._id);
  }
}
