import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    },
    REWARDS: {
      5: "📚 Acesso à biblioteca premium",
      10: "🎵 Playlist de foco exclusiva", 
      15: "☕ Desconto em cafeterias",
      20: "📖 E-book de produtividade",
      25: "🎯 Sessão de planejamento",
      30: "🚀 Curso avançado",
      50: "🏆 Mentorização pessoal"
    }
  };

  async getProgress(userId: string) {
    let progress = await this.progressModel.findOne({ userId });
    
    if (!progress) {
      progress = await this.progressModel.create({ userId });
    }

    // Calcula XP necessário para o próximo level
    const xpForNextLevel = this.calculateRequiredXP(progress.level);
    const xpForCurrentLevel = progress.level > 1 ? this.calculateRequiredXP(progress.level - 1) : 0;
    const xpProgress = ((progress.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    return {
      ...progress.toObject(),
      xpForNextLevel,
      xpProgress: Math.round(xpProgress),
      dailyXPRemaining: Math.max(0, this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP - progress.dailyXP),
      nextReward: this.getNextReward(progress.level + 1)
    };
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

  async addXP(userId: string, xpToAdd: number): Promise<{ 
    progress: any; 
    leveledUp: boolean; 
    levelsGained: number;
    newLevel: number;
    reward?: string;
  }> {
    const progress = await this.getProgress(userId);
    
    // Verifica limite diário de XP
    if ((progress.dailyXP + xpToAdd) > this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP) {
      throw new BadRequestException(`Limite diário de ${this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP} XP atingido`);
    }

    let newXP = progress.xp + xpToAdd;
    let newLevel = progress.level;
    let leveledUp = false;
    let levelsGained = 0;
    let reward = null;

    // Calcula quantos níveis o usuário deve subir
    while (newXP >= this.calculateRequiredXP(newLevel)) {
      newXP -= this.calculateRequiredXP(newLevel);
      newLevel++;
      leveledUp = true;
      levelsGained++;
      
      // Verifica se há recompensa para este nível
      if (this.LEVELS_CONFIG.REWARDS[newLevel]) {
        reward = this.LEVELS_CONFIG.REWARDS[newLevel];
      }
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
      newLevel,
      reward
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

  // Obtém a próxima recompensa
  private getNextReward(currentLevel: number): string | null {
    const rewardLevels = Object.keys(this.LEVELS_CONFIG.REWARDS).map(Number).sort((a, b) => a - b);
    const nextRewardLevel = rewardLevels.find(level => level > currentLevel);
    return nextRewardLevel ? this.LEVELS_CONFIG.REWARDS[nextRewardLevel] : null;
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

  // Obtém estatísticas de progresso
  async getProgressStats(userId: string) {
    const progress = await this.getProgress(userId);
    
    return {
      level: progress.level,
      xp: progress.xp,
      dailyXP: progress.dailyXP,
      dailyXPRemaining: Math.max(0, this.LEVELS_CONFIG.DAILY_LIMITS.MAX_XP - progress.dailyXP),
      completedToday: progress.completedToday,
      totalCompleted: progress.totalCompleted,
      streak: progress.streak,
      xpForNextLevel: this.calculateRequiredXP(progress.level),
      xpProgress: ((progress.xp - (progress.level > 1 ? this.calculateRequiredXP(progress.level - 1) : 0)) / 
                  (this.calculateRequiredXP(progress.level) - (progress.level > 1 ? this.calculateRequiredXP(progress.level - 1) : 0))) * 100,
      nextReward: this.getNextReward(progress.level)
    };
  }
}