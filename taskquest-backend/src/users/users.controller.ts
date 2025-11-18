import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common'; // Removido Param
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'; // Removido ApiResponse
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

  @Get('profile/ai')
  @ApiOperation({ summary: 'Obter perfil do usuário para IA' })
  async getProfileForAI(@Request() req) {
    return this.usersService.getUserProfileForAI(req.user._id);
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

  @Put('goals')
  @ApiOperation({ summary: 'Atualizar objetivos do usuário' })
  async updateGoals(@Request() req, @Body() body: { goals: string[] }) {
    const user = await this.usersService.updateUserGoals(req.user._id, body.goals);
    return this.sanitizeUser(user);
  }

  @Put('challenges')
  @ApiOperation({ summary: 'Atualizar desafios do usuário' })
  async updateChallenges(@Request() req, @Body() body: { challenges: string[] }) {
    const user = await this.usersService.updateUserChallenges(req.user._id, body.challenges);
    return this.sanitizeUser(user);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Atualizar preferências do usuário' })
  async updatePreferences(@Request() req, @Body() body: { preferences: any }) {
    const user = await this.usersService.updateUserPreferences(req.user._id, body.preferences);
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