<<<<<<< Updated upstream
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> Stashed changes
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';


// Interface para o retorno do addXP
export interface LevelUpResult {
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
  currentStreak: number;
}

// Type assertion para o modelo - SOLUÇÃO DEFINITIVA
type ProgressModelType = Model<ProgressDocument> & {
  create(doc: Partial<Progress>): Promise<ProgressDocument>;
  findOne(query: any): Promise<ProgressDocument | null>;
};


@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: ProgressModelType,
  ) {}

<<<<<<< Updated upstream
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
=======
  async getProgress(userId: string): Promise<ProgressDocument> {
>>>>>>> Stashed changes
    let progress = await this.progressModel.findOne({ userId });
    
    if (!progress) {
      progress = await this.createInitialProgress(userId);
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

<<<<<<< Updated upstream
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
=======
  private async createInitialProgress(userId: string): Promise<ProgressDocument> {
    // SOLUÇÃO: Usando create com tipagem explícita
    const progressData: Partial<Progress> = {
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
    
    const result = await this.progressModel.create(progressData);
    return result;
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
>>>>>>> Stashed changes

    // Atualizar estatísticas diárias
    await this.updateDailyStats(progress, today, xp);

    // Verificar level up
    const levelResult = this.calculateLevelUp(progress);

    await progress.save();

    return {
<<<<<<< Updated upstream
      progress: updatedProgress,
      leveledUp,
      levelsGained,
      newLevel,
      reward
=======
      leveledUp: levelResult.leveledUp,
      levelsGained: levelResult.levelsGained,
      newLevel: progress.level,
      currentStreak: progress.currentStreak,
>>>>>>> Stashed changes
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
    // Encontrar ou criar estatísticas do dia
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

    // Calcular XP diário total
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
    return Math.floor(totalXP / 1000) + 1;
  }

  async resetDailyProgress(userId: string): Promise<ProgressDocument> {
    const progress = await this.getProgress(userId);
    const today = new Date().toISOString().split('T')[0];
    
    // Mantém o streak, apenas reseta estatísticas diárias
    progress.dailyStats = progress.dailyStats.filter(stat => 
      stat.date !== today
    );
    progress.dailyXP = 0;
    
    return progress.save();
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

<<<<<<< Updated upstream
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
=======
  async resetAllProgress(userId: string): Promise<ProgressDocument> {
>>>>>>> Stashed changes
    const progress = await this.getProgress(userId);
    
    // Reseta tudo, mas mantém o userId
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

<<<<<<< Updated upstream
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
=======
  async fixCorruptedXPData(userId: string): Promise<ProgressDocument> {
    const progress = await this.getProgress(userId);
    
    // Corrige possíveis inconsistências
    if (progress.xp < 0) progress.xp = 0;
    if (progress.totalXP < 0) progress.totalXP = 0;
    if (progress.level < 1) progress.level = 1;
    if (progress.currentStreak < 0) progress.currentStreak = 0;
    if (progress.longestStreak < 0) progress.longestStreak = 0;
    if (progress.tasksCompleted < 0) progress.tasksCompleted = 0;
    
    // Recalcula level baseado no totalXP
    const correctLevel = this.calculateLevel(progress.totalXP);
    if (progress.level !== correctLevel) {
      progress.level = correctLevel;
    }
    
    return progress.save();
  }
}

>>>>>>> Stashed changes
