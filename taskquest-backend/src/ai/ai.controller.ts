import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'; // Removido Get
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggestions')
  @ApiOperation({ summary: 'Gerar sugestões de tarefas usando IA (com rotação)' })
  @ApiResponse({ status: 200, description: 'Sugestões geradas com sucesso' })
  async generateRotatedSuggestions(
    @Request() req,
    @Body() body: { count?: number },
  ) {
    const user = req.user;
    return this.aiService.generateRotatedSuggestions(
      user._id, 
      user.goals || [], 
      user.challenges || [], 
      body.count || 3
    );
  }

  @Post('personalized-tasks')
  @ApiOperation({ summary: 'Gerar tarefas personalizadas (método legado)' })
  async generatePersonalizedTasks(
    @Request() req,
    @Body() body: { goals: string[]; challenges: string[] },
  ) {
    return this.aiService.generatePersonalizedTasks(
      req.user._id,
      body.goals,
      body.challenges
    );
  }

  @Post('analyze-distribution')
  @ApiOperation({ summary: 'Analisar distribuição de tarefas' })
  async analyzeDistribution(@Body() body: { tasks: any[] }) {
    return this.aiService.analyzeTaskDistribution(body.tasks);
  }

  @Post('test-openai')
  @ApiOperation({ summary: 'Testar chave da OpenAI' })
  async testOpenAI(@Body() body: { apiKey: string }) {
    const isValid = await this.aiService.testOpenAIKey(body.apiKey);
    return { valid: isValid };
  }
}