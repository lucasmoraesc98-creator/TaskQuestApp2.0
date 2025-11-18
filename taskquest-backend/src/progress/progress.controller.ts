import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common'; // Removido Put
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Obter progresso do usuário' })
  async getProgress(@Request() req) {
    return this.progressService.getProgress(req.user._id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas detalhadas de progresso' })
  async getProgressStats(@Request() req) {
    return this.progressService.getProgressStats(req.user._id);
  }

  @Post('add-xp')
  @ApiOperation({ summary: 'Adicionar XP ao usuário' })
  @ApiResponse({ status: 200, description: 'XP adicionado com sucesso' })
  @ApiResponse({ status: 400, description: 'Limite diário de XP atingido' })
  async addXP(@Request() req, @Body() body: { xp: number }) {
    return this.progressService.addXP(req.user._id, body.xp);
  }

  @Post('reset-daily')
  @ApiOperation({ summary: 'Resetar progresso diário' })
  async resetDaily(@Request() req) {
    return this.progressService.resetDailyProgress(req.user._id);
  }

  @Post('reset-all')
  @ApiOperation({ summary: 'Resetar todo o progresso (demo)' })
  async resetAll(@Request() req) {
    return this.progressService.resetAllProgress(req.user._id);
  }

  @Post('fix-xp')
  @ApiOperation({ summary: 'Corrigir dados de XP corrompidos' })
  async fixXP(@Request() req) {
    return this.progressService.fixCorruptedXPData(req.user._id);
  }

  @Post('reset-daily-complete')
  @ApiOperation({ summary: 'Resetar completamente o dia (tasks + progresso)' })
  async resetDailyComplete(@Request() req) {
    await this.progressService.resetDailyProgress(req.user._id);
    return {
      message: 'Dia resetado completamente',
      progress: await this.progressService.getProgress(req.user._id)
    };
  }
}