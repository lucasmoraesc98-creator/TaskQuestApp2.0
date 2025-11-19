import React from 'react';
import { Typography, Box, Paper, Card, CardContent } from '@mui/material';
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
    <Box sx={{ p: 3 }}>
      <Paper sx={{ 
        p: 3, 
        mb: 3,
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

        {todayStats && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 2, 
            mt: 2,
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(2, 1fr)',
            }
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Concluídas
              </Typography>
              <Typography variant="h6" color="success.main">
                {todayStats.completed}/{todayStats.total}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                XP Hoje
              </Typography>
              <Typography variant="h6" color="primary.main">
                {todayStats.totalXP}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Taxa
              </Typography>
              <Typography variant="h6" color="secondary.main">
                {Math.round(todayStats.completionRate)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pendentes
              </Typography>
              <Typography variant="h6" color="warning.main">
                {todayStats.pending}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 3,
        '@media (max-width: 1200px)': {
          gridTemplateColumns: '1fr',
        }
      }}>
        <Box>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <TaskList tasks={tasks || []} />
            </CardContent>
          </Card>
          
          <ProgressAnalysis />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AISuggestions />
          <BookSuggestions />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;