import { Controller, Post, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResetService } from './reset.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/schemas/user.schema';

@Controller('reset')
@UseGuards(JwtAuthGuard)
export class ResetController {
  private readonly logger = new Logger(ResetController.name);

  constructor(private readonly resetService: ResetService) {}

  @Post('account')
  async resetAccount(@GetUser() user: User) {
    this.logger.log(`🔄 Solicitando reset completo da conta para: ${user._id}`);
    
    try {
      const result = await this.resetService.resetUserAccount(user._id.toString());
      
      return {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro no reset da conta: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // Rota de teste sem guard para verificar se o módulo está funcionando
  @Post('test')
  async test() {
    return { message: 'Reset module is working!' };
  }
}