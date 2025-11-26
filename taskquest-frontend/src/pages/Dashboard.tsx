import React, { useEffect } from 'react';
import { Typography, Box, Paper, Card, CardContent, Grid } from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import TaskList from '../components/tasks/TaskList';
import AISuggestions from '../components/tasks/AISuggestions';
import { useQuery } from '@tanstack/react-query';
import { taskService, Task } from '../services/task.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks, isLoading } = useQuery<Task[], Error>({
    queryKey: ['tasks', today],
    queryFn: () => taskService.getTasks(today),
    enabled: !!user,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['today-stats'],
    queryFn: () => taskService.getTodayStats(),
    enabled: !!user,
  });

  useEffect(() => {
    // Solicitar permissão para notificações
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  if (isLoading) return <Typography>Carregando...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header com Estatísticas */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="700">
          Bem-vindo, {user?.name}! 👋
        </Typography>
        
        {todayStats && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Concluídas
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {todayStats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    XP Hoje
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {todayStats.totalXP}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Taxa
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {Math.round(todayStats.completionRate)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Sequência
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {todayStats.streak || 0}d
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Coluna Principal - Tarefas */}
        <Grid item xs={12} lg={8}>
          <TaskList tasks={tasks || []} />
        </Grid>

        {/* Sidebar - Sugestões da IA */}
        <Grid item xs={12} lg={4}>
          <AISuggestions />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;