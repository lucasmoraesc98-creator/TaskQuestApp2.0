import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Endpoint raiz da API' })
  @ApiResponse({ status: 200, description: 'API está funcionando' })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check da aplicação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status de saúde da aplicação',
    schema: {
      example: {
        status: 'OK',
        timestamp: '2024-01-15T10:30:00.000Z',
        service: 'TaskQuest Backend',
        version: '1.0.0',
        uptime: 3600,
        database: 'connected'
      }
    }
  })
  healthCheck(): object {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'TaskQuest Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      database: 'connected'
    };
  }

  @Get('protected-test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Endpoint protegido para teste de autenticação' })
  @ApiResponse({ status: 200, description: 'Acesso permitido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  protectedTest(): object {
    return {
      message: 'Você tem acesso a esta rota protegida!',
      timestamp: new Date().toISOString()
    };
  }
}