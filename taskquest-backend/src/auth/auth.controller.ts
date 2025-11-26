import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request,
  Put 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ NOVO ENDPOINT - PERFIL DO USUÁRIO
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  async getProfile(@Request() req) {
    try {
      console.log('🔍 Auth Profile - User ID:', req.user._id);
      
      // Buscar dados completos do usuário
      const user = await this.authService.validateUser({ sub: req.user._id });
      
      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      // Sanitizar usuário (remover senha)
      const userObj = user.toObject();
      delete userObj.password;

      return {
        success: true,
        user: userObj
      };
    } catch (error) {
      console.error('❌ Erro no profile:', error);
      return {
        success: false,
        message: 'Erro ao buscar perfil do usuário'
      };
    }
  }

  // ✅ ENDPOINT PARA RESETAR USUÁRIO (limpar plano antigo)
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resetar dados do usuário (limpar plano antigo)' })
  async resetUser(@Request() req) {
    return this.authService.resetUser(req.user._id);
  }
}