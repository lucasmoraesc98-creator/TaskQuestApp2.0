import React from 'react';
import { Typography, Box, Container, Paper } from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import ProgressCharts from '../components/progress/ProgressCharts';
import { useQuery } from '@tanstack/react-query';
import { taskService, Task } from '../services/task.service';

// Serviço local de analytics (movido do Dashboard)
const analyticsService = {
  analyzeWeeklyProgress(tasks: Task[]) {
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
  },

  getLast7Days(): string[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  },

  analyzeProductivityByTime(tasks: Task[]) {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      productivity: Math.random() * 100
    }));
  }
};

const Analysis: React.FC = () => {
  const { user } = useAuth();
  
  const { data: tasks, isLoading } = useQuery<Task[], Error>({
    queryKey: ['tasks-analysis'],
    queryFn: () => taskService.getTasks(),
    enabled: !!user,
  });

  const analysis = tasks ? analyticsService.analyzeWeeklyProgress(tasks) : null;

  if (isLoading) return <Typography>Carregando análises...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="700">
          📊 Análises Detalhadas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize seu progresso, produtividade e métricas detalhadas.
        </Typography>
      </Paper>

      {analysis && (
        <ProgressCharts analysis={analysis} />
      )}

      {!analysis && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum dado disponível para análise. Complete algumas tarefas primeiro!
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Analysis;