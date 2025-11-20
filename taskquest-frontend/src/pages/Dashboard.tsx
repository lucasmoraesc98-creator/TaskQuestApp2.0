import React, { useEffect } from 'react';
import { Typography, Box, Paper, Card, CardContent, LinearProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import TaskList from '../components/tasks/TaskList';
import AISuggestions from '../components/tasks/AISuggestions';
import BookSuggestions from '../components/books/BookSuggestions';
import ProgressAnalysis from '../components/analysis/ProgressAnalysis';
import { useQuery } from '@tanstack/react-query';
import { taskService, Task } from '../services/task.service';
import { dailyTasksService } from '../services/dailytasks.service';
import { Bolt, EmojiEvents } from '@mui/icons-material';

// Componente de barra de progresso de XP simplificado
const XPProgressBar: React.FC<{ currentXP: number; level: number }> = ({ currentXP, level }) => {
  const xpForNextLevel = level * 1000;
  const progress = (currentXP / xpForNextLevel) * 100;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          Level {level} • {currentXP} / {xpForNextLevel} XP
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.min(progress, 100).toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={Math.min(progress, 100)}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #00D4FF 0%, #667eea 100%)',
            borderRadius: 4,
          }
        }}
      />
    </Box>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Efeito para inicializar tarefas padrão
  useEffect(() => {
    if (user) {
      dailyTasksService.initializeDailyTasks();
    }
  }, [user]);

  const { data: tasks, isLoading, error } = useQuery<Task[], Error>({
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

  const currentXP = todayStats?.xpEarnedToday || 0;
  const xpLimit = 400;
  const xpPercentage = Math.min((currentXP / xpLimit) * 100, 100);

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
          Level {user?.level} • {user?.xp} XP Total
        </Typography>
        
        <XPProgressBar 
          currentXP={user?.xp || 0} 
          level={user?.level || 1} 
        />

        {/* Progresso do XP Diário */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              <Bolt sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              XP Ganho Hoje: {currentXP} / {xpLimit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {xpPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={xpPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #00D4FF 0%, #667eea 100%)',
                borderRadius: 4,
              }
            }}
          />
          {currentXP >= xpLimit && (
            <Alert 
              severity="success" 
              icon={<EmojiEvents />}
              sx={{ mt: 1, borderRadius: 2 }}
            >
              🎉 Parabéns! Você atingiu o limite diário de XP!
            </Alert>
          )}
        </Box>

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