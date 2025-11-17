import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
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

  @Post('add-xp')
  @ApiOperation({ summary: 'Adicionar XP ao usuário' })
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
}