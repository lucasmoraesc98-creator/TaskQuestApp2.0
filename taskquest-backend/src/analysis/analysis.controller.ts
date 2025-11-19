import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  @ApiOperation({ summary: 'Obter análise completa do usuário' })
  async getUserAnalysis(@Request() req) {
    return this.analysisService.getUserAnalysis(req.user._id);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Obter relatório semanal' })
  async getWeeklyReport(@Request() req) {
    return this.analysisService.getWeeklyReport(req.user._id);
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Obter métricas de produtividade' })
  async getProductivityMetrics(@Request() req) {
    return this.analysisService.getProductivityMetrics(req.user._id);
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Analisar distribuição de tarefas' })
  async getTaskDistribution(@Request() req) {
    return this.analysisService.analyzeTaskDistribution(req.user._id);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Obter tendências de progresso' })
  async getProgressTrends(@Request() req) {
    return this.analysisService.getProgressTrends(req.user._id);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Obter insights personalizados' })
  async getPersonalizedInsights(@Request() req) {
    return this.analysisService.getPersonalizedInsights(req.user._id);
  }
}