import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Task } from '../tasks/schemas/task.schema';
import { User } from '../users/schemas/user.schema';
import { Progress } from '../progress/schemas/progress.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Progress.name) private progressModel: Model<Progress>,
  ) {}

  async analyzeUserBehavior(userId: string) {
    const tasks = await this.taskModel.find({ userId });
    const user = await this.userModel.findById(userId);
    const progress = await this.progressModel.findOne({ userId });

    const analysis = {
      mostProductiveTime: this.calculateProductiveTime(tasks),
      taskCompletionRate: this.calculateCompletionRate(tasks),
      preferredTaskTypes: this.analyzeTaskTypes(tasks),
      consistencyScore: this.calculateConsistency(tasks),
      weeklyProgress: await this.calculateWeeklyProgress(userId),
      performanceScore: this.calculatePerformanceScore(tasks, progress),
      suggestions: [],
    };

    // Análise avançada com sugestões personalizadas
    if (tasks.length > 0) {
      const highXPTasks = tasks.filter(t => t.xp >= 50 && t.completed);
      const lowXPTasks = tasks.filter(t => t.xp === 10 && t.completed);

      if (highXPTasks.length === 0) {
        analysis.suggestions.push("💡 Tente adicionar mais tarefas de alto impacto (50+ XP) para progredir mais rápido");
      }

      if (lowXPTasks.length > highXPTasks.length * 2) {
        analysis.suggestions.push("🎯 Equilibre tarefas pequenas com atividades mais significativas");
      }

      const completionTimes = this.analyzeCompletionTimes(tasks);
      if (completionTimes.afternoon > completionTimes.morning * 2) {
        analysis.suggestions.push("🌅 Você parece ser mais produtivo à tarde. Que tal agendar tarefas importantes nesse período?");
      }

      // Análise baseada no progresso
      if (progress && progress.dailyXP >= 300) {
        analysis.suggestions.push("🔥 Excelente produtividade hoje! Você está próximo do limite diário de XP");
      }

      if (analysis.consistencyScore < 50) {
        analysis.suggestions.push("📅 Tente manter uma rotina mais consistente para melhorar seus resultados a longo prazo");
      }
    }

    // Atualiza última análise do usuário
    await this.userModel.findByIdAndUpdate(userId, {
      lastAnalysis: new Date(),
    });

    return analysis;
  }

  private calculateProductiveTime(tasks: Task[]): string {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return 'indefinido';

    const hours = completedTasks.map(t => {
      const date = t.completedAt || (t as any).createdAt;
      return new Date(date).getHours();
    });
    
    const morning = hours.filter(h => h >= 6 && h < 12).length;
    const afternoon = hours.filter(h => h >= 12 && h < 18).length;
    const evening = hours.filter(h => h >= 18 && h < 24).length;

    if (morning >= afternoon && morning >= evening) return 'manhã';
    if (afternoon >= morning && afternoon >= evening) return 'tarde';
    return 'noite';
  }

  private calculateCompletionRate(tasks: Task[]): number {
    const completed = tasks.filter(t => t.completed).length;
    return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  }

  private analyzeTaskTypes(tasks: Task[]): any {
    const completedTasks = tasks.filter(t => t.completed);
    
    return {
      highImpact: {
        total: tasks.filter(t => t.xp >= 100).length,
        completed: completedTasks.filter(t => t.xp >= 100).length,
        percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.xp >= 100).length / tasks.length) * 100) : 0
      },
      mediumImpact: {
        total: tasks.filter(t => t.xp === 50).length,
        completed: completedTasks.filter(t => t.xp === 50).length,
        percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.xp === 50).length / tasks.length) * 100) : 0
      },
      lowImpact: {
        total: tasks.filter(t => t.xp === 10).length,
        completed: completedTasks.filter(t => t.xp === 10).length,
        percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.xp === 10).length / tasks.length) * 100) : 0
      },
    };
  }

  private calculateConsistency(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length < 2) return 0;
    
    const dates = completedTasks.map(t => {
      const date = t.completedAt || (t as any).createdAt;
      return new Date(date).toDateString();
    });
    
    const uniqueDays = new Set(dates).size;
    const totalDays = Math.min(7, Math.ceil((new Date().getTime() - new Date(Math.min(...dates.map(d => new Date(d).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    return Math.round((uniqueDays / totalDays) * 100);
  }

  private analyzeCompletionTimes(tasks: Task[]): any {
    const completedTasks = tasks.filter(t => t.completed);
    return completedTasks.reduce((acc, task) => {
      const date = task.completedAt || (task as any).createdAt;
      const hour = new Date(date).getHours();
      if (hour >= 6 && hour < 12) acc.morning++;
      else if (hour >= 12 && hour < 18) acc.afternoon++;
      else acc.evening++;
      return acc;
    }, { morning: 0, afternoon: 0, evening: 0 });
  }

  private async calculateWeeklyProgress(userId: string): Promise<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyTasks = await this.taskModel.find({
      userId,
      createdAt: { $gte: oneWeekAgo }
    });

    const completedWeekly = weeklyTasks.filter(t => t.completed);
    const weeklyXP = completedWeekly.reduce((sum, task) => sum + task.xp, 0);

    return {
      tasksCompleted: completedWeekly.length,
      totalXP: weeklyXP,
      averageDailyTasks: Math.round(completedWeekly.length / 7),
      averageDailyXP: Math.round(weeklyXP / 7)
    };
  }

  private calculatePerformanceScore(tasks: Task[], progress: any): number {
    if (tasks.length === 0) return 0;

    let score = 0;
    
    // Pontuação baseada na taxa de conclusão (40%)
    const completionRate = this.calculateCompletionRate(tasks);
    score += (completionRate * 0.4);

    // Pontuação baseada na consistência (30%)
    const consistency = this.calculateConsistency(tasks);
    score += (consistency * 0.3);

    // Pontuação baseada no balanceamento de tarefas (20%)
    const taskTypes = this.analyzeTaskTypes(tasks);
    const balanceScore = 100 - Math.abs(taskTypes.highImpact.percentage - 20) - 
                         Math.abs(taskTypes.mediumImpact.percentage - 30) - 
                         Math.abs(taskTypes.lowImpact.percentage - 50);
    score += (Math.max(0, balanceScore) * 0.2);

    // Pontuação baseada no progresso (10%)
    if (progress && progress.dailyXP > 0) {
      const progressScore = Math.min(100, (progress.dailyXP / 350) * 100);
      score += (progressScore * 0.1);
    }

    return Math.round(Math.min(100, score));
  }

  async getUserProgress(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const tasks = await this.taskModel.find({ userId });
    const completedTasks = tasks.filter(t => t.completed);
    const progress = await this.progressModel.findOne({ userId });

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === today);
    const todayCompleted = todayTasks.filter(t => t.completed);

    return {
      level: user.level,
      xp: user.xp,
      totalTasks: tasks.length,
      totalCompleted: completedTasks.length,
      todayTasks: todayTasks.length,
      todayCompleted: todayCompleted.length,
      todayXP: todayCompleted.reduce((sum, task) => sum + task.xp, 0),
      streak: progress?.streak || 0,
      dailyXP: progress?.dailyXP || 0,
      dailyXPRemaining: progress ? Math.max(0, 350 - progress.dailyXP) : 350
    };
  }

  async getTaskDistribution(userId: string): Promise<any> {
    const tasks = await this.taskModel.find({ userId });
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        finance: { assigned: 0, completed: 0, percentage: 0 },
        health: { assigned: 0, completed: 0, percentage: 0 },
        steps: { assigned: 0, completed: 0, percentage: 0 },
        totalTasks: 0,
        completionRate: 0,
        balanceScore: 0,
        suggestions: []
      };
    }

    const financeTasks = tasks.filter(task => task.xp === 100);
    const healthTasks = tasks.filter(task => task.xp === 50);
    const stepTasks = tasks.filter(task => task.xp === 10);

    const financeCompleted = financeTasks.filter(task => task.completed).length;
    const healthCompleted = healthTasks.filter(task => task.completed).length;
    const stepCompleted = stepTasks.filter(task => task.completed).length;

    const distribution = {
      finance: {
        assigned: financeTasks.length,
        completed: financeCompleted,
        percentage: Math.round((financeTasks.length / totalTasks) * 100)
      },
      health: {
        assigned: healthTasks.length,
        completed: healthCompleted,
        percentage: Math.round((healthTasks.length / totalTasks) * 100)
      },
      steps: {
        assigned: stepTasks.length,
        completed: stepCompleted,
        percentage: Math.round((stepTasks.length / totalTasks) * 100)
      },
      totalTasks: totalTasks,
      completionRate: Math.round((tasks.filter(t => t.completed).length / totalTasks) * 100)
    };

    // Calcula score de equilíbrio (0-100)
    const balanceScore = this.calculateBalanceScore(distribution);
    distribution['balanceScore'] = balanceScore;

    // Gera sugestões personalizadas
    distribution['suggestions'] = this.generateBalanceSuggestions(distribution);

    return distribution;
  }

  private calculateBalanceScore(current: any): number {
    const idealDistribution = { finance: 10, health: 30, steps: 60 };
    let score = 100;
    
    // Penaliza desvios da distribuição ideal
    const financeDeviation = Math.abs(current.finance.percentage - idealDistribution.finance);
    const healthDeviation = Math.abs(current.health.percentage - idealDistribution.health);
    const stepsDeviation = Math.abs(current.steps.percentage - idealDistribution.steps);
    
    score -= (financeDeviation + healthDeviation + stepsDeviation) / 3;
    
    // Bônus por taxa de conclusão alta
    if (current.completionRate > 80) score += 10;
    if (current.completionRate > 90) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateBalanceSuggestions(distribution: any): string[] {
    const suggestions = [];
    const { finance, health, steps, completionRate } = distribution;

    // Sugestões baseadas na distribuição
    if (finance.percentage > 20) {
      suggestions.push("🎯 Muitas tarefas financeiras - Considere focar em 1-2 tarefas de alto impacto por dia em vez de várias");
    } else if (finance.percentage < 5) {
      suggestions.push("💰 Poucas tarefas financeiras - Adicione mais atividades que gerem retorno financeiro ou profissional");
    }

    if (health.percentage > 45) {
      suggestions.push("❤️ Excelente foco em saúde! - Mantenha esse equilíbrio para produtividade sustentável");
    } else if (health.percentage < 20) {
      suggestions.push("💪 Mais cuidado com a saúde - Atividades físicas e mentais melhoram energia e foco");
    }

    if (steps.percentage > 80) {
      suggestions.push("🌱 Muitas pequenas tarefas - Combine micro-tarefas em atividades mais significativas");
    } else if (steps.percentage < 45) {
      suggestions.push("✅ Poucos hábitos diários - Pequenos passos consistentes criam progresso duradouro");
    }

    // Sugestões baseadas na taxa de conclusão
    if (completionRate < 50) {
      suggestions.push("📉 Baixa taxa de conclusão - Tarefas podem estar muito complexas. Quebre em partes menores");
    } else if (completionRate > 85) {
      suggestions.push("🚀 Excelente execução! - Você está dominando seu fluxo de trabalho");
    }

    // Sugestão de equilíbrio geral
    if (distribution.balanceScore >= 80) {
      suggestions.push("🎉 Distribuição equilibrada! - Seu mix de tarefas está otimizado para produtividade sustentável");
    } else {
      suggestions.push("⚖️ Busque melhor equilíbrio - Alinhe suas tarefas com a proporção ideal: 10% financeiro, 30% saúde, 60% pequenos passos");
    }

    return suggestions;
  }

  private async calculateStreak(userId: string): Promise<number> {
    const tasks = await this.taskModel.find({ userId, completed: true });
    const dates = [...new Set(tasks.map(t => 
      new Date(t.completedAt).toDateString()
    ))].sort().reverse();

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < dates.length; i++) {
      const taskDate = new Date(dates[i]);
      if (this.isConsecutiveDay(currentDate, taskDate)) {
        streak++;
        currentDate = taskDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private isConsecutiveDay(date1: Date, date2: Date): boolean {
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  }
}