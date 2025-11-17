import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('behavior')
  @ApiOperation({ summary: 'Analisar comportamento do usuário' })
  async analyzeBehavior(@Request() req) {
    return this.analysisService.analyzeUserBehavior(req.user._id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Obter progresso do usuário' })
  async getProgress(@Request() req) {
    return this.analysisService.getUserProgress(req.user._id);
  }
}
