import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService, 
    private usersService: UsersService
  ){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
    });
  console.log('🔐 JWT Strategy inicializada');
    console.log('🔐 JWT Secret configurado:', !!configService.get<string>('JWT_SECRET'));
  }

  async validate(payload: any) {
    console.log('🔐 JWT Payload recebido:', payload);
    try {
      // Busque o usuário no banco de dados
      const user = await this.usersService.findById(payload.sub || payload._id);
      
      if (!user) {
        console.log('❌ Usuário não encontrado no banco');
        throw new UnauthorizedException('Usuário não encontrado');
      }
   console.log('✅ Usuário validado:', user._id);
      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        // inclua outras propriedades que você precisa
      };
    } catch (error) {
      console.log('❌ Erro na validação JWT:', error.message);
      throw new UnauthorizedException('Token inválido');
    }
  }
}