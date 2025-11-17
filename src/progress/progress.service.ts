import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress } from './schemas/progress.schema';

@Injectable()
export class ProgressService {
  constructor(@InjectModel(Progress.name) private progressModel: Model<Progress>) {}

  // Configurações do sistema de level
  private readonly LEVELS_CONFIG = {
    BASE_XP: 1000,
    XP_INCREMENT: 100,
    DAILY_LIMITS: {
      MAX_XP: 350,
      MAX_TASKS: 15
    }
  };

  async getProgress(userId: string) {
    let progress = await this.progressModel.findOne({ userId });
    
    if (!progress) {
      progress = await this.progressModel.create({ userId });
    }

    return progress;
  }

  async updateProgress(userId: string, updates: any) {
    const progress = await this.progressModel.findOneAndUpdate(
      { userId },
      { $set: { ...updates, lastActive: new Date() } },
      { new: true, upsert: true }
    );

    if (!progress) {
      throw new NotFoundException('Progresso não encontrado');
    }

    return progress;
  }

  async addXP(userId: string, xpToAdd: number) {
    const progress = await this.getProgress(userId);
    
    // Verifica limite diário de XP
    if ((progress.dailyXP + xpToAdd) > this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP) {
      throw new Error(`Limite diário de ${this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP} XP atingido`);
    }

    let newXP = progress.xp + xpToAdd;
    let newLevel = progress.level;
    let leveledUp = false;
    let levelsGained = 0;

    // Calcula quantos níveis o usuário deve subir
    while (newXP >= this.calculateRequiredXP(newLevel)) {
      newXP -= this.calculateRequiredXP(newLevel);
      newLevel++;
      leveledUp = true;
      levelsGained++;
    }

    const updatedProgress = await this.progressModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          level: newLevel,
          xp: newXP,
          dailyXP: progress.dailyXP + xpToAdd,
          completedToday: progress.completedToday + 1,
          totalCompleted: progress.totalCompleted + 1,
          lastActive: new Date(),
        }
      },
      { new: true }
    );

    return {
      progress: updatedProgress,
      leveledUp,
      levelsGained,
      newLevel
    };
  }

  async resetDailyProgress(userId: string) {
    return this.progressModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          completedToday: 0,
          dailyXP: 0,
          lastReset: new Date(),
        }
      },
      { new: true }
    );
  }

  async resetAllProgress(userId: string) {
    return this.progressModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          level: 1,
          xp: 0,
          completedToday: 0,
          totalCompleted: 0,
          dailyXP: 0,
          streak: 0,
          lastReset: new Date(),
        }
      },
      { new: true }
    );
  }

  // **MÉTODO CORRIGIDO**: Cálculo de XP necessário por nível
  calculateRequiredXP(level: number): number {
    // XP necessário para o PRÓXIMO nível (nível atual + 1)
    // Nível 1 → 1000 XP para o nível 2
    // Nível 2 → 1100 XP para o nível 3  
    return this.LEVELS_CONFIG.BASE_XP + ((level - 1) * this.LEVELS_CONFIG.XP_INCREMENT);
  }

  // Corrige dados de XP/level inconsistentes
  async fixCorruptedXPData(userId: string) {
    const progress = await this.getProgress(userId);
    
    let correctedLevel = 1;
    let correctedXP = progress.xp;
    let requiredXP = this.calculateRequiredXP(correctedLevel);

    // Recalcula o nível correto baseado no XP total
    while (correctedXP >= requiredXP) {
      correctedXP -= requiredXP;
      correctedLevel++;
      requiredXP = this.calculateRequiredXP(correctedLevel);
    }

    // Se houve correção, atualiza os dados
    if (correctedLevel !== progress.level || correctedXP !== progress.xp) {
      return this.progressModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            level: correctedLevel,
            xp: correctedXP,
          }
        },
        { new: true }
      );
    }

    return progress;
  }
}