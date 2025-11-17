import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário atual' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user._id);
    return this.sanitizeUser(user);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.updateUser(req.user._id, updateUserDto);
    return this.sanitizeUser(user);
  }

  @Put('profile/ai')
  @ApiOperation({ summary: 'Atualizar perfil para IA' })
  async updateAIProfile(@Request() req, @Body() profileData: any) {
    const user = await this.usersService.updateUserProfile(req.user._id, profileData);
    return this.sanitizeUser(user);
  }

  @Put('progress')
  @ApiOperation({ summary: 'Atualizar progresso do usuário' })
  async updateProgress(@Request() req, @Body() progressData: any) {
    const user = await this.usersService.updateUserProgress(req.user._id, progressData);
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any): any {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return userObj;
  }
}
