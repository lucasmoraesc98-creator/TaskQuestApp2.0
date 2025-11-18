// src/pages/Dashboard.tsx - VERSÃO CORRIGIDA
import React from 'react';
import { Grid, Typography, Box, Paper, Card, CardContent } from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import TaskList from '../components/tasks/TaskList';
import AISuggestions from '../components/tasks/AISuggestions';
import BookSuggestions from '../components/books/BookSuggestions';
import ProgressAnalysis from '../components/analysis/ProgressAnalysis';
import XPProgressBar from '../components/progress/XPProgressBar';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', today],
    queryFn: () => taskService.getTasks(today),
    enabled: !!user,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['today-stats'],
    queryFn: () => taskService.getTodayStats(),
    enabled: !!user,
  });

  if (isLoading) return <Typography>Carregando...</Typography>;
  if (error) return <Typography>Erro ao carregar tarefas</Typography>;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Header com XP Progress */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(102,126,234,0.1) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }}>
            <Typography variant="h4" gutterBottom fontWeight="700">
              Bem-vindo, {user?.name}! 👋
            </Typography>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Level {user?.level} • {user?.xp} XP
            </Typography>
            
            <XPProgressBar 
              currentXP={user?.xp || 0} 
              level={user?.level || 1} 
            />

            {/* Stats Rápidos */}
            {todayStats && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Concluídas
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {todayStats.completed}/{todayStats.total}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    XP Hoje
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {todayStats.totalXP}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Taxa
                  </Typography>
                  <Typography variant="h6" color="secondary.main">
                    {Math.round(todayStats.completionRate)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {todayStats.pending}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Coluna Principal */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Tasks */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <TaskList tasks={tasks || []} />
                </CardContent>
              </Card>
            </Grid>

            {/* Análise de Progresso */}
            <Grid item xs={12}>
              <ProgressAnalysis />
            </Grid>
          </Grid>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <AISuggestions />
            </Grid>
            <Grid item xs={12}>
              <BookSuggestions />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;