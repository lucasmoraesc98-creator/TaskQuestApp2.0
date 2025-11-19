import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      if (progress && progress.dailyXP >= 300) {
        analysis.suggestions.push("🔥 Excelente produtividade hoje! Você está próximo do limite diário de XP");
      }

      if (analysis.consistencyScore < 50) {
        analysis.suggestions.push("📅 Tente manter uma rotina mais consistente para melhorar seus resultados a longo prazo");
      }
    }

    return analysis;
  }

  async getUserAnalysis(userId: string) {
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
    const weeklyData = this.groupTasksByWeek(tasks);
    const consistency = this.calculateConsistencyScore(weeklyData);
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

  // ========== MÉTODOS AUXILIARES PRIVADOS ==========

  private calculateProductiveTime(tasks: Task[]): string {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return 'indefinido';

    const hours = completedTasks.map(t => {
      const date = t.completedAt || (t as any).createdAt;
      return new Date(date).getHours();
    });

    const hourCounts: { [key: number]: number } = {};
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostFrequentHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[Number(a)] > hourCounts[Number(b)] ? a : b
    );

    return `${mostFrequentHour}h`;
  }

  private calculateCompletionRate(tasks: any[]): number {
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

  private calculateTrend(weeklyData: any[]): number {
    if (weeklyData.length < 2) return 0;
    
    const recent = weeklyData.slice(-2);
    const trendValue = ((recent[1].completionRate - recent[0].completionRate) / recent[0].completionRate) * 100;
    return Math.round(isFinite(trendValue) ? trendValue : 0);
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

  private calculateAverageCompletion(weeklyData: any[]): number {
    if (weeklyData.length === 0) return 0;
    const average = weeklyData.reduce((sum, week) => sum + week.completionRate, 0) / weeklyData.length;
    return Math.round(average);
  }

  private getTopCategory(tasks: any[]): string {
    const categories = tasks.reduce((acc: Record<string, number>, task) => {
      const type = task.type || 'Geral';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

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
    return uniqueDays > 0 ? Math.round((tasks.length / uniqueDays) * 100) / 100 : 0;
  }

  private findPeakHours(tasks: any[]) {
    const hours = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    tasks.forEach(task => {
      const hour = new Date(task.createdAt).getHours();
      if (hour >= 6 && hour < 12) hours.morning++;
      else if (hour >= 12 && hour < 18) hours.afternoon++;
      else if (hour >= 18 && hour < 22) hours.evening++;
      else hours.night++;
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
    return tasks.reduce((acc: Record<string, number>, task) => {
      const type = task.type || 'Geral';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
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

  // Métodos adicionais para compatibilidade
  async getUserProgress(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const tasks = await this.taskModel.find({ userId });
    const completedTasks = tasks.filter(t => t.completed);
    
    // Calcular tarefas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(t => 
      new Date(t.createdAt) >= today
    );
    const todayCompleted = todayTasks.filter(t => t.completed);
    
    const progress = await this.progressModel.findOne({ userId });

    return {
      level: user?.level || 1,
      xp: user?.xp || 0,
      totalTasks: tasks.length,
      totalCompleted: completedTasks.length,
      todayTasks: todayTasks.length,
      todayCompleted: todayCompleted.length,
      todayXP: todayCompleted.reduce((sum, task) => sum + task.xp, 0),
      streak: progress?.currentStreak || 0,
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
}