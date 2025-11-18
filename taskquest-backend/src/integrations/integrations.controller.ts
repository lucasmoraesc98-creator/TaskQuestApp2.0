import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'; // Removido Request
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'; // Removido ApiResponse
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('books')
  @ApiOperation({ summary: 'Obter recomendações de livros' })
  async getBooks(@Query('limit') limit: number = 5) {
    return this.integrationsService.getBookRecommendations(limit);
  }

  @Get('productivity-tips')
  @ApiOperation({ summary: 'Obter dicas de produtividade' })
  async getProductivityTips(@Query('limit') limit: number = 3) {
    return this.integrationsService.getProductivityTips(limit);
  }

  @Post('openai/test')
  @ApiOperation({ summary: 'Testar chave da OpenAI' })
  async testOpenAI(@Body() body: { apiKey: string }) {
    const isValid = await this.integrationsService.testOpenAIKey(body.apiKey);
    return { valid: isValid };
  }
}