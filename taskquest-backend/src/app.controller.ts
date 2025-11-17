import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check da API',
    description: 'Endpoint para verificar se a API está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando corretamente',
    schema: {
      example: {
        message: 'TaskQuest API está online! 🚀',
        timestamp: '2024-01-15T10:30:00.000Z',
        version: '1.0.0',
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Status de saúde da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde retornado com sucesso',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 3600,
        memory: {
          used: '45.2 MB',
          total: '512 MB',
        },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  // Redirecionamento opcional para a documentação
  @Get('api')
  @Redirect('/docs', 301)
  redirectToDocs() {}
}