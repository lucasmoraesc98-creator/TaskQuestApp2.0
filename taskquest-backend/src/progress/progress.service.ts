// taskquest-backend/src/progress/progress.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';

export interface LevelUpResult {
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
  newXP: number;
  totalXP: number;
  currentStreak: number;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async getProgress(userId: string): Promise<ProgressDocument> {
    let progress = await this.progressModel.findOne({ userId });
    
    if (!progress) {
      progress = await this.createInitialProgress(userId);
    }

    return progress;
  }

  private async createInitialProgress(userId: string): Promise<ProgressDocument> {
    const progressData = {
      userId,
      level: 1,
      xp: 0,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      tasksCompleted: 0,
      dailyXP: 0,
      lastActivity: new Date(),
      dailyStats: [],
    };
    
    const progress = new this.progressModel(progressData);
    return progress.save();
  }

  async addXP(userId: string, xp: number): Promise<LevelUpResult> {
    const progress = await this.getProgress(userId);
    const today = new Date().toISOString().split('T')[0];
    
    // Atualizar streak
    await this.updateStreak(progress, today);

    // Adicionar XP
    progress.xp += xp;
    progress.totalXP += xp;
    progress.tasksCompleted += 1;
    progress.lastActivity = new Date();

    // Atualizar estatísticas diárias
    await this.updateDailyStats(progress, today, xp);

    // Verificar level up
    const levelResult = this.calculateLevelUp(progress);

    await progress.save();

    return {
      leveledUp: levelResult.leveledUp,
      levelsGained: levelResult.levelsGained,
      newLevel: progress.level,
      newXP: progress.xp,
      totalXP: progress.totalXP,
      currentStreak: progress.currentStreak,
    };
  }

  private async updateStreak(progress: ProgressDocument, today: string): Promise<void> {
    const lastActivity = progress.lastActivity ? 
      new Date(progress.lastActivity).toISOString().split('T')[0] : null;
    
    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActivity === yesterdayStr) {
        // Consecutivo - aumenta o streak
        progress.currentStreak += 1;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }
      } else if (lastActivity && lastActivity !== today) {
        // Não consecutivo - reseta para 1
        progress.currentStreak = 1;
      } else {
        // Primeira atividade - inicia streak
        progress.currentStreak = 1;
      }
    }
  }

  private async updateDailyStats(progress: ProgressDocument, today: string, xp: number): Promise<void> {
    const todayStats = progress.dailyStats.find(stat => stat.date === today);
    
    if (todayStats) {
      todayStats.xpEarned += xp;
      todayStats.tasksCompleted += 1;
    } else {
      progress.dailyStats.push({
        date: today,
        xpEarned: xp,
        tasksCompleted: 1,
      });
    }

    progress.dailyXP = progress.dailyStats
      .filter(stat => stat.date === today)
      .reduce((sum, stat) => sum + stat.xpEarned, 0);
  }

  private calculateLevelUp(progress: ProgressDocument): { leveledUp: boolean; levelsGained: number } {
    const newLevel = this.calculateLevel(progress.totalXP);
    const oldLevel = progress.level;
    
    if (newLevel > oldLevel) {
      progress.level = newLevel;
      return {
        leveledUp: true,
        levelsGained: newLevel - oldLevel,
      };
    }
    
    return {
      leveledUp: false,
      levelsGained: 0,
    };
  }

  private calculateLevel(totalXP: number): number {
  // 1000 XP por level (nível 1: 0-999, nível 2: 1000-1999, etc)
  return Math.floor(totalXP / 1000) + 1;
}

private calculateXPProgress(totalXP: number, level: number): number {
  const xpForCurrentLevel = (level - 1) * 1000;
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  return (xpInCurrentLevel / 1000) * 100;
}

  async getProgressStats(userId: string): Promise<any> {
    const progress = await this.getProgress(userId);
    const today = new Date().toISOString().split('T')[0];
    
    const todayStats = progress.dailyStats.find(stat => stat.date === today) || {
      xpEarned: 0,
      tasksCompleted: 0,
    };

    const xpToNextLevel = Math.max(0, (progress.level * 1000) - progress.totalXP);

    return {
      level: progress.level,
      xp: progress.xp,
      totalXP: progress.totalXP,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      tasksCompleted: progress.tasksCompleted,
      dailyXP: progress.dailyXP,
      todayStats,
      xpToNextLevel,
    };
  }

  // MÉTODOS QUE ESTAVAM FALTANDO - ADICIONADOS
  async resetDailyProgress(userId: string): Promise<ProgressDocument> {
    const progress = await this.getProgress(userId);
    const today = new Date().toISOString().split('T')[0];
    
    progress.dailyStats = progress.dailyStats.filter(stat => 
      stat.date !== today
    );
    progress.dailyXP = 0;
    
    return progress.save();
  }

  async resetAllProgress(userId: string): Promise<ProgressDocument> {
    const progress = await this.getProgress(userId);
    
    progress.level = 1;
    progress.xp = 0;
    progress.totalXP = 0;
    progress.currentStreak = 0;
    progress.longestStreak = 0;
    progress.tasksCompleted = 0;
    progress.dailyXP = 0;
    progress.dailyStats = [];
    progress.lastActivity = new Date();
    
    return progress.save();
  }

  async fixCorruptedXPData(userId: string): Promise<ProgressDocument> {
    const progress = await this.getProgress(userId);
    
    if (progress.xp < 0) progress.xp = 0;
    if (progress.totalXP < 0) progress.totalXP = 0;
    if (progress.level < 1) progress.level = 1;
    if (progress.currentStreak < 0) progress.currentStreak = 0;
    if (progress.longestStreak < 0) progress.longestStreak = 0;
    if (progress.tasksCompleted < 0) progress.tasksCompleted = 0;
    
    const correctLevel = this.calculateLevel(progress.totalXP);
    if (progress.level !== correctLevel) {
      progress.level = correctLevel;
    }
    
    return progress.save();
  }
}