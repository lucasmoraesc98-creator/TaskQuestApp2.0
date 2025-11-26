import { Task } from '../tasks/schemas/task.schema';

export interface ProductivityStats {
  completionRate: number;
  averageXPPerDay: number;
  streak: number;
  bestDay: { date: string; xp: number };
  productivityScore: number;
  recommendations: string[];
}

export interface ProgressAnalysis {
  weeklyProgress: { date: string; completed: number; xp: number }[];
  categoryBreakdown: { type: string; count: number; xp: number }[];
  timeAnalysis: { hour: number; productivity: number }[];
}

class AnalyticsService {
  calculateProductivityStats(tasks: Task[]): ProductivityStats {
    const completedTasks = tasks.filter(task => task.completed);
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    
    const totalXP = completedTasks.reduce((sum, task) => sum + task.xp, 0);
    const averageXPPerDay = completedTasks.length > 0 ? totalXP / completedTasks.length : 0;

    // CORREÇÃO: Remover categoryStats não utilizado
    // const categoryStats = tasks.reduce((acc, task) => {
    //   if (!acc[task.type]) {
    //     acc[task.type] = { count: 0, xp: 0 };
    //   }
    //   acc[task.type].count++;
    //   if (task.completed) {
    //     acc[task.type].xp += task.xp;
    //   }
    //   return acc;
    // }, {} as Record<string, { count: number; xp: number }>);

    // CORREÇÃO: Passar objeto vazio para generateRecommendations
    const recommendations = this.generateRecommendations(tasks, completionRate, {});

    return {
      completionRate,
      averageXPPerDay,
      streak: this.calculateStreak(tasks),
      bestDay: this.findBestDay(tasks),
      productivityScore: Math.min(completionRate * 1.5, 100),
      recommendations
    };
  }

  analyzeWeeklyProgress(tasks: Task[]): ProgressAnalysis {
    const last7Days = this.getLast7Days();
    
    const weeklyProgress = last7Days.map(date => {
      const dayTasks = tasks.filter(task => task.date === date);
      const completed = dayTasks.filter(task => task.completed).length;
      const xp = dayTasks.filter(task => task.completed).reduce((sum, task) => sum + task.xp, 0);
      
      return { date, completed, xp };
    });

    const categoryBreakdown = Object.entries(
      tasks.reduce((acc, task) => {
        if (!acc[task.type]) {
          acc[task.type] = { count: 0, xp: 0 };
        }
        acc[task.type].count++;
        if (task.completed) {
          acc[task.type].xp += task.xp;
        }
        return acc;
      }, {} as Record<string, { count: number; xp: number }>)
    ).map(([type, stats]) => ({
      type,
      count: stats.count,
      xp: stats.xp
    }));

    const timeAnalysis = this.analyzeProductivityByTime(tasks);

    return {
      weeklyProgress,
      categoryBreakdown,
      timeAnalysis
    };
  }

  private generateRecommendations(tasks: Task[], completionRate: number, categoryStats: Record<string, { count: number; xp: number }>): string[] {
    const recommendations: string[] = [];
    
    if (completionRate < 50) {
      recommendations.push("Tente focar em completar pelo menos metade das tarefas diárias");
    }
    
    if (completionRate > 80) {
      recommendations.push("Excelente taxa de conclusão! Considere adicionar tarefas mais desafiadoras");
    }

    const healthTasks = tasks.filter(t => t.type === 'health');
    if (healthTasks.length === 0) {
      recommendations.push("Adicione tarefas de saúde para manter o equilíbrio");
    }

    const highXPTasks = tasks.filter(t => t.xp >= 100);
    if (highXPTasks.length < 2) {
      recommendations.push("Inclua mais tarefas de alto impacto (100XP) para acelerar seu progresso");
    }

    return recommendations.slice(0, 3);
  }

  private calculateStreak(tasks: Task[]): number {
    // CORREÇÃO: Converter Set para Array
    const dates = Array.from(new Set(tasks.map(t => t.date))).sort();
    let streak = 0;
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const dayTasks = tasks.filter(t => t.date === dates[i]);
      const hasCompleted = dayTasks.some(t => t.completed);
      if (hasCompleted) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private findBestDay(tasks: Task[]): { date: string; xp: number } {
    const xpByDate = tasks.reduce((acc, task) => {
      if (task.completed) {
        acc[task.date] = (acc[task.date] || 0) + task.xp;
      }
      return acc;
    }, {} as Record<string, number>);

    const bestDay = Object.entries(xpByDate).reduce((best, [date, xp]) => {
      return xp > best.xp ? { date, xp } : best;
    }, { date: '', xp: 0 });

    return bestDay;
  }

  private getLast7Days(): string[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }

  private analyzeProductivityByTime(tasks: Task[]): { hour: number; productivity: number }[] {
    // CORREÇÃO: Remover parâmetro não utilizado
    // const hours = Array.from({ length: 24 }, (_, i) => i);
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      productivity: Math.random() * 100
    }));
  }
}

export const analyticsService = new AnalyticsService();