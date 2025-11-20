import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../tasks/schemas/task.schema';
import { Progress, ProgressDocument } from '../progress/schemas/progress.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getUserAnalysis(userId: string) {
    // Obter dados das últimas 4 semanas
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const tasks = await this.taskModel.find({
      userId,
      createdAt: { $gte: fourWeeksAgo }
    }).exec();

    const progress = await this.progressModel.findOne({ userId });
    if (!progress) {
      throw new Error('Progresso não encontrado');
    }
    
    // CORREÇÃO: Removida a variável 'user' não utilizada

    // Calcular métricas
    const completedTasks = tasks.filter(task => task.completed);
    const highImpactTasks = completedTasks.filter(task => task.xp === 100);
    const mediumImpactTasks = completedTasks.filter(task => task.xp === 50);
    const lowImpactTasks = completedTasks.filter(task => task.xp === 10);

    // Agrupar por semana
    const weeklyData = this.groupTasksByWeek(tasks);
    
    // Calcular tendência
    const trend = this.calculateTrend(weeklyData);

    return {
      productivity: this.calculateProductivityScore(tasks),
      consistency: this.calculateConsistencyScore(weeklyData),
      efficiency: this.calculateEfficiencyScore(tasks),
      growth: this.calculateGrowthScore(progress, weeklyData),
      completion: this.calculateCompletionRate(tasks),
      weeklyTrend: trend > 0 ? `+${trend}%` : `${trend}%`,
      streak: progress?.currentStreak || 0,
      averageCompletion: this.calculateAverageCompletion(weeklyData),
      topCategory: this.getTopCategory(tasks),
      taskDistribution: {
        highImpact: highImpactTasks.length,
        mediumImpact: mediumImpactTasks.length,
        lowImpact: lowImpactTasks.length,
      },
      weeklyProgress: weeklyData,
      insights: await this.getPersonalizedInsights(userId),
    };
  }

  async getWeeklyReport(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const tasks = await this.taskModel.find({
      userId,
      createdAt: { $gte: oneWeekAgo }
    }).exec();

    const completedTasks = tasks.filter(task => task.completed);
    const totalXP = completedTasks.reduce((sum, task) => sum + task.xp, 0);

    return {
      period: 'last_7_days',
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      totalXP,
      averageXPPerDay: totalXP / 7,
      dailyBreakdown: this.getDailyBreakdown(tasks),
      achievements: this.getWeeklyAchievements(completedTasks),
    };
  }

  async getProductivityMetrics(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await this.taskModel.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).exec();

    return {
      averageTasksPerDay: this.calculateAverageTasksPerDay(tasks),
      peakProductivityHours: this.findPeakHours(tasks),
      mostProductiveDay: this.findMostProductiveDay(tasks),
      taskCompletionTime: this.calculateAverageCompletionTime(tasks),
      focusScore: this.calculateFocusScore(tasks),
    };
  }

  async analyzeTaskDistribution(userId: string) {
    const tasks = await this.taskModel.find({ userId }).exec();
    
    const distribution = {
      byType: this.groupByType(tasks),
      byXP: this.groupByXP(tasks),
      byTimeOfDay: this.groupByTimeOfDay(tasks),
      byCompletionStatus: {
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
      }
    };

    return distribution;
  }

  async getProgressTrends(userId: string) {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const tasks = await this.taskModel.find({
      userId,
      createdAt: { $gte: twelveWeeksAgo }
    }).exec();

    const weeklyTrends = this.groupTasksByWeek(tasks, 12);
    
    return {
      weeklyTrends,
      momentum: this.calculateMomentum(weeklyTrends),
      prediction: this.predictNextWeek(weeklyTrends),
      seasonalPatterns: this.identifySeasonalPatterns(weeklyTrends),
    };
  }

  async getPersonalizedInsights(userId: string) {
    const tasks = await this.taskModel.find({ userId }).exec();
    const progress = await this.progressModel.findOne({ userId });

    const insights = [];

    // Insight 1: Baseado no horário de produtividade
    const peakHours = this.findPeakHours(tasks);
    if (peakHours.morning > peakHours.afternoon && peakHours.morning > peakHours.evening) {
      insights.push({
        type: 'schedule',
        title: 'Pessoa Matutina',
        message: 'Você é mais produtivo pela manhã. Tente agendar tarefas importantes neste período.',
        priority: 'high'
      });
    }

    // Insight 2: Baseado na consistência
    const consistency = this.calculateConsistencyScore(this.groupTasksByWeek(tasks));
    if (consistency < 50) {
      insights.push({
        type: 'consistency',
        title: 'Melhore sua Consistência',
        message: 'Tente manter uma rotina mais regular de tarefas para melhorar seu progresso.',
        priority: 'medium'
      });
    }

    // Insight 3: Baseado no tipo de tarefas
    const typeDistribution = this.groupByType(tasks);
    const totalTasks = Object.values(typeDistribution).reduce((sum: number, count: number) => sum + count, 0);
    
    if (totalTasks > 0) {
      const highImpactTasks = tasks.filter(t => t.xp === 100 && t.completed).length;
      const highImpactRatio = highImpactTasks / totalTasks;
      
      if (highImpactRatio < 0.2) {
        insights.push({
          type: 'impact',
          title: 'Foque em Tarefas de Alto Impacto',
          message: 'Priorize tarefas que dão mais XP para acelerar seu progresso.',
          priority: 'high'
        });
      }
    }

    // Insight 4: Baseado no streak atual
    if (progress && progress.currentStreak && progress.currentStreak >= 3) {
      insights.push({
        type: 'motivation',
        title: 'Streak em Andamento!',
        message: `Você está há ${progress.currentStreak} dias consecutivos. Mantenha o ritmo!`,
        priority: 'low'
      });
    }

    // Insight 5: Baseado no nível e progresso
    if (progress && progress.level > 5) {
      insights.push({
        type: 'achievement',
        title: 'Nível Avançado!',
        message: `Parabéns! Você alcançou o nível ${progress.level}. Continue evoluindo!`,
        priority: 'low'
      });
    }

    // Insight 6: Baseado na quantidade de tarefas completas
    const completedTasks = tasks.filter(t => t.completed).length;
    if (completedTasks >= 20) {
      insights.push({
        type: 'milestone',
        title: 'Produtividade Incrível!',
        message: `Você já completou ${completedTasks} tarefas. Excelente trabalho!`,
        priority: 'medium'
      });
    }

    return insights;
  }

  // Métodos auxiliares
  private groupTasksByWeek(tasks: any[], weeks: number = 4) {
    const result = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (i * 7));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= startDate && taskDate <= endDate;
      });

      const completed = weekTasks.filter(task => task.completed).length;
      
      result.push({
        week: `Semana ${weeks - i}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalTasks: weekTasks.length,
        completedTasks: completed,
        completionRate: weekTasks.length > 0 ? (completed / weekTasks.length) * 100 : 0,
        totalXP: weekTasks.filter(t => t.completed).reduce((sum, t) => sum + t.xp, 0),
      });
    }

    return result;
  }

  private calculateProductivityScore(tasks: any[]): number {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    
    if (total === 0) return 0;
    
    const completionRate = (completed / total) * 100;
    const averageXP = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xp, 0) / completed || 0;
    
    return Math.min(100, (completionRate * 0.7) + (averageXP * 0.3));
  }

  private calculateConsistencyScore(weeklyData: any[]): number {
    if (weeklyData.length === 0) return 0;
    
    const completionRates = weeklyData.map(week => week.completionRate);
    const average = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    
    // Penaliza variações grandes (menos consistência)
    const variance = completionRates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / completionRates.length;
    const consistency = Math.max(0, 100 - (variance / 2));
    
    return Math.round(consistency);
  }

  private calculateEfficiencyScore(tasks: any[]): number {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return 0;

    const totalXP = completedTasks.reduce((sum, t) => sum + t.xp, 0);
    const averageXPPerTask = totalXP / completedTasks.length;
    
    // Normaliza para escala 0-100 (considerando que XP máximo por tarefa é 100)
    return Math.min(100, averageXPPerTask);
  }

  private calculateGrowthScore(progress: any, weeklyData: any[]): number {
    if (!progress || weeklyData.length < 2) return 50;

    const recentWeeks = weeklyData.slice(-2);
    if (recentWeeks.length < 2) return 50;

    const growth = ((recentWeeks[1].completionRate - recentWeeks[0].completionRate) / recentWeeks[0].completionRate) * 100;
    
    return Math.min(100, Math.max(0, 50 + growth));
  }

  private calculateCompletionRate(tasks: any[]): number {
    const completed = tasks.filter(t => t.completed).length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }

  private calculateTrend(weeklyData: any[]): number {
    if (weeklyData.length < 2) return 0;
    
    const recent = weeklyData.slice(-2);
    const trendValue = ((recent[1].completionRate - recent[0].completionRate) / recent[0].completionRate) * 100;
    return Math.round(isFinite(trendValue) ? trendValue : 0);
  }

  private calculateAverageCompletion(weeklyData: any[]): number {
    if (weeklyData.length === 0) return 0;
    const average = weeklyData.reduce((sum, week) => sum + week.completionRate, 0) / weeklyData.length;
    return Math.round(average);
  }

  private getTopCategory(tasks: any[]): string {
    const categories = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.keys(categories).reduce((a, b) => 
      categories[a] > categories[b] ? a : b, 'Geral'
    );
    
    return topCategory;
  }

  private getDailyBreakdown(tasks: any[]) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const breakdown = days.map(day => ({ day, completed: 0, total: 0 }));

    tasks.forEach(task => {
      const dayIndex = new Date(task.createdAt).getDay();
      breakdown[dayIndex].total++;
      if (task.completed) {
        breakdown[dayIndex].completed++;
      }
    });

    return breakdown;
  }

  private getWeeklyAchievements(completedTasks: any[]) {
    const achievements = [];
    const totalXP = completedTasks.reduce((sum, task) => sum + task.xp, 0);

    if (completedTasks.length >= 10) {
      achievements.push('➕ 10+ tarefas concluídas');
    }
    if (totalXP >= 500) {
      achievements.push('⚡ 500+ XP conquistados');
    }
    if (completedTasks.some(task => task.xp === 100)) {
      achievements.push('🎯 Tarefas de alto impacto');
    }

    return achievements.length > 0 ? achievements : ['🌟 Semana de progresso constante'];
  }

  private calculateAverageTasksPerDay(tasks: any[]): number {
    const uniqueDays = new Set(tasks.map(task => new Date(task.createdAt).toDateString())).size;
    return uniqueDays > 0 ? tasks.length / uniqueDays : 0;
  }

  private findPeakHours(tasks: any[]) {
    const hours = { morning: 0, afternoon: 0, evening: 0 };
    
    tasks.forEach(task => {
      const hour = new Date(task.createdAt).getHours();
      if (hour >= 6 && hour < 12) hours.morning++;
      else if (hour >= 12 && hour < 18) hours.afternoon++;
      else hours.evening++;
    });

    return hours;
  }

  private findMostProductiveDay(tasks: any[]): string {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const productivity = [0, 0, 0, 0, 0, 0, 0];

    tasks.forEach(task => {
      const dayIndex = new Date(task.createdAt).getDay();
      productivity[dayIndex] += task.completed ? task.xp : 0;
    });

    const maxIndex = productivity.indexOf(Math.max(...productivity));
    return days[maxIndex];
  }

  private groupByType(tasks: any[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByXP(tasks: any[]) {
    return {
      high: tasks.filter(t => t.xp === 100).length,
      medium: tasks.filter(t => t.xp === 50).length,
      low: tasks.filter(t => t.xp === 10).length,
    };
  }

  private groupByTimeOfDay(tasks: any[]) {
    return this.findPeakHours(tasks);
  }

  private calculateAverageCompletionTime(tasks: any[]): number {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt && t.createdAt);
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime();
      const completed = new Date(task.completedAt).getTime();
      return sum + (completed - created);
    }, 0);

    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60)); // Retorna em horas
  }

  private calculateFocusScore(tasks: any[]): number {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return 0;
    
    const highImpactRatio = completedTasks.filter(t => t.xp === 100).length / completedTasks.length;
    return Math.round(highImpactRatio * 100);
  }

  private calculateMomentum(weeklyTrends: any[]): string {
    if (weeklyTrends.length < 2) return 'stable';
    
    const recent = weeklyTrends.slice(-3);
    const trend = recent[recent.length - 1].completionRate - recent[0].completionRate;
    
    if (trend > 10) return 'accelerating';
    if (trend > 5) return 'growing';
    if (trend > -5) return 'stable';
    if (trend > -10) return 'slowing';
    return 'declining';
  }

  private predictNextWeek(weeklyTrends: any[]): number {
    if (weeklyTrends.length < 2) return 50;
    
    const recent = weeklyTrends.slice(-4);
    const weights = [0.1, 0.2, 0.3, 0.4]; // Pesos para semanas mais recentes
    const weightedAverage = recent.reduce((sum, week, index) => 
      sum + (week.completionRate * weights[index]), 0);
    
    return Math.round(weightedAverage);
  }

  private identifySeasonalPatterns(weeklyTrends: any[]): string[] {
    const patterns = [];
    
    // Padrão simples: verifica se há tendência de fim de semana
    if (weeklyTrends.length >= 4) {
      const recentCompletion = weeklyTrends.slice(-4).map(w => w.completionRate);
      const variance = Math.max(...recentCompletion) - Math.min(...recentCompletion);
      
      if (variance > 30) {
        patterns.push('Padrão: Produtividade variável durante a semana');
      } else if (variance < 10) {
        patterns.push('Padrão: Consistência notável');
      }
    }

    return patterns.length > 0 ? patterns : ['Padrão: Progresso constante'];
  }
}