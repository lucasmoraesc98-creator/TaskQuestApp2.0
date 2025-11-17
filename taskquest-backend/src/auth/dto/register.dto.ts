import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: ['Aprender programação', 'Fazer exercícios'] })
  @IsOptional()
  goals?: string[];

  @ApiProperty({ required: false, example: ['Falta de tempo', 'Procrastinação'] })
  @IsOptional()
  challenges?: string[];
}
