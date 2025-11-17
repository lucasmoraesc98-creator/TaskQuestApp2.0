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
          goals: profileData.goals,
          challenges: profileData.challenges,
          preferences: profileData.preferences,
          productivityStyle: profileData.productivityStyle,
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
}
