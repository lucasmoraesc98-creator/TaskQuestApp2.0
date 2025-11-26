import { Controller, Get, UseGuards, Request, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedAIService } from './unified-ai.service';
import { DeepSeekAIService } from './deepseek-ai.service'; // ✅ Adicione esta importação

@ApiTags('ai')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(
    private readonly unifiedAIService: UnifiedAIService,
    private readonly mixtralAI: DeepSeekAIService, // ✅ Adicione esta injeção
  ) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Obter recomendações personalizadas baseadas no plano anual' })
  async getRecommendations(@Request() req) {
    return this.unifiedAIService.generatePersonalizedRecommendations(req.user._id);
  }

  @Get('test-mixtral')
  @ApiOperation({ summary: 'Testar conexão com Mixtral AI' })
  async testMixtralConnection() {
    return this.mixtralAI.testConnection();
  }
}