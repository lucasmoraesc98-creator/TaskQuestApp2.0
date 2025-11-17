import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Task } from '../tasks/schemas/task.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async analyzeUserBehavior(userId: string) {
    const tasks = await this.taskModel.find({ userId });
    const user = await this.userModel.findById(userId);

    const analysis = {
      mostProductiveTime: this.calculateProductiveTime(tasks),
      taskCompletionRate: this.calculateCompletionRate(tasks),
      preferredTaskTypes: this.analyzeTaskTypes(tasks),
      consistencyScore: this.calculateConsistency(tasks),
      suggestions: [],
    };

    // Análise básica
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
    }

    // Atualiza última análise do usuário
    await this.userModel.findByIdAndUpdate(userId, {
      lastAnalysis: new Date(),
    });

    return analysis;
  }

  private calculateProductiveTime(tasks: Task[]): string {
    const completedTasks = tasks.filter(t => t.completed);
    const hours = completedTasks.map(t => {
      // Usar completedAt se existir, senão usar createdAt
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
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }

  private analyzeTaskTypes(tasks: Task[]): any {
    return {
      highImpact: tasks.filter(t => t.xp >= 100).length,
      mediumImpact: tasks.filter(t => t.xp === 50).length,
      lowImpact: tasks.filter(t => t.xp === 10).length,
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
    return (uniqueDays / 7) * 100;
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

  async getUserProgress(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const tasks = await this.taskModel.find({ userId });
    const completedTasks = tasks.filter(t => t.completed);

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
      streak: await this.calculateStreak(userId),
    };
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