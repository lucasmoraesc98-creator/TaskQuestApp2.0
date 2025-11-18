import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateUserProfile(id: string, profileData: any): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          goals: profileData.goals || [],
          challenges: profileData.challenges || [],
          preferences: profileData.preferences || {
            morningPerson: true,
            likesExercise: true,
            worksFromHome: false,
          },
          productivityStyle: profileData.productivityStyle || 'balanced',
          lastActive: new Date(),
        },
      },
      { new: true },
    );
  }

  async updateUserProgress(id: string, progressData: any): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          level: progressData.level,
          xp: progressData.xp,
          lastActive: new Date(),
        },
      },
      { new: true },
    );
  }

  async updateUserGoals(id: string, goals: string[]): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          goals: goals,
          lastActive: new Date(),
        },
      },
      { new: true },
    );
  }

  async updateUserChallenges(id: string, challenges: string[]): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          challenges: challenges,
          lastActive: new Date(),
        },
      },
      { new: true },
    );
  }

  async updateUserPreferences(id: string, preferences: any): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          preferences: {
            morningPerson: preferences.morningPerson ?? true,
            likesExercise: preferences.likesExercise ?? true,
            worksFromHome: preferences.worksFromHome ?? false,
          },
          lastActive: new Date(),
        },
      },
      { new: true },
    );
  }

  async getUserProfileForAI(id: string): Promise<any> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      goals: user.goals,
      challenges: user.challenges,
      preferences: user.preferences,
      productivityStyle: user.productivityStyle,
      level: user.level,
      lastAnalysis: user.lastAnalysis,
    };
  }
}