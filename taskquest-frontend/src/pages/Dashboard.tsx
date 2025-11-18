import React from 'react';
import { Grid, Typography, Box, Paper, LinearProgress, Card, CardContent } from '@mui/material'; // CORRIGIDO: Grid2
import { useAuth } from '../contexts/auth.context';
import TaskList from '../components/tasks/TaskList';
import AISuggestions from '../components/tasks/AISuggestions';
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

  const calculateXPProgress = () => {
    if (!user) return 0;
    const baseXP = 1000 + ((user.level - 1) * 100);
    return (user.xp / baseXP) * 100;
  };

  if (isLoading) return <Typography>Carregando...</Typography>;
  if (error) return <Typography>Erro ao carregar tarefas</Typography>;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* CORRIGIDO: Grid container sem prop 'item' */}
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={{ xs: 12 }}> {/* CORRIGIDO: nova sintaxe do Grid2 */}
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Typography variant="h4" gutterBottom>
              Bem-vindo, {user?.name}! 👋
            </Typography>
            <Typography variant="h6" gutterBottom>
              Level {user?.level} • {user?.xp} XP
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={calculateXPProgress()} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Tasks */}
        <Grid size={{ xs: 12, md: 8 }}> {/* CORRIGIDO: nova sintaxe do Grid2 */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                📝 Suas Tarefas de Hoje
              </Typography>
              <TaskList tasks={tasks || []} />
            </CardContent>
          </Card>
        </Grid>

        {/* AI Suggestions */}
        <Grid size={{ xs: 12, md: 4 }}> {/* CORRIGIDO: nova sintaxe do Grid2 */}
          <AISuggestions />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;