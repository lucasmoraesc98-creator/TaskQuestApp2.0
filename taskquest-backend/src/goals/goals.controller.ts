import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  
  // Endpoint de teste simples
  @Get('test')
  testEndpoint() {
    return { 
      success: true,
      message: '✅ Goals endpoint está funcionando!',
      timestamp: new Date().toISOString()
    };
  }

  // Endpoint simplificado para criar plano
  @Post('plan')
  createGoalPlan(@Request() req, @Body() body: any) {
    console.log('🎯 Recebendo requisição para criar plano...');
    console.log('👤 Usuário:', req.user?._id || req.user?.userId);
    console.log('📦 Dados recebidos:', body);
    
    // Retorna uma resposta SIMPLES de sucesso
    return {
      success: true,
      message: 'Plano criado com sucesso!',
      planId: 'mock-plan-' + Date.now(),
      vision: body.vision,
      user: req.user?._id || req.user?.userId,
      hardGoals: [
        {
          id: 'hard-1',
          title: `Dominar ${body.tools?.[0] || 'tecnologias'}`,
          description: `Meta anual baseada na visão: ${body.vision}`,
          xpValue: 500
        }
      ]
    };
  }
}