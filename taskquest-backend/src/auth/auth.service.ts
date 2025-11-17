import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Verifica se usuário já existe
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cria usuário
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      level: 1,
      xp: 0,
      preferences: {
        morningPerson: true,
        likesExercise: true,
        worksFromHome: false,
      },
      goals: [],
      challenges: [],
    });

    const token = this.generateToken(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Encontra usuário
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }

  private generateToken(user: User): string {
    const payload = { 
      sub: user._id, 
      email: user.email,
      name: user.name 
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User): any {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async validateUser(payload: any): Promise<User> {
    return await this.userModel.findById(payload.sub);
  }
}
