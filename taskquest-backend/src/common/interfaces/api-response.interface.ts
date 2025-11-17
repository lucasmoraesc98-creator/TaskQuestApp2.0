import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  error?: string;
}

export class LoginResponse {
  @ApiProperty({
    description: 'JWT token para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '507f1f77bcf86cd799439011',
      name: 'João Silva',
      email: 'joao@taskquest.com',
      level: 1,
      xp: 0,
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
  };
}

export class LevelUpResponse {
  @ApiProperty({ example: 2 })
  level: number;

  @ApiProperty({ example: 150 })
  xp: number;

  @ApiProperty({ example: 1 })
  levelsGained: number;

  @ApiProperty({
    example: '🎵 Playlist de foco exclusiva',
    nullable: true,
  })
  reward?: string;
}
