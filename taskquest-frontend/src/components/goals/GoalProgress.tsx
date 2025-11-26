import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import { GoalPlan, PlanProgress } from '../../services/goal-planning.service';

export interface GoalProgressProps {
  plan: GoalPlan;
  progress: PlanProgress;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ plan, progress }) => {
  if (!plan) {
    return null;
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Progresso Geral */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Progresso Geral do Plano
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progresso Geral
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.overallProgress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress.overallProgress} 
              color={getProgressColor(progress.overallProgress)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {progress.dailyTasks.completed}/{progress.dailyTasks.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tarefas Diárias
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.dailyTasks.percentage} 
                  sx={{ mt: 1, height: 6 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {progress.easyGoals.completed}/{progress.easyGoals.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Metas Semanais
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.easyGoals.percentage} 
                  color="success"
                  sx={{ mt: 1, height: 6 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {progress.mediumGoals.completed}/{progress.mediumGoals.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Metas Mensais
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.mediumGoals.percentage} 
                  color="warning"
                  sx={{ mt: 1, height: 6 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" gutterBottom>
                  {progress.hardGoals.completed}/{progress.hardGoals.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Metas Anuais
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.hardGoals.percentage} 
                  color="error"
                  sx={{ mt: 1, height: 6 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metas Anuais */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 Metas Anuais (HARD)
          </Typography>
          {plan.hardGoals.map((goal) => (
            <Box key={goal.id} sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="500">
                    {goal.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {goal.description}
                  </Typography>
                </Box>
                <Chip 
                  label={`${goal.progress}%`} 
                  color={getProgressColor(goal.progress)}
                  variant={goal.progress === 100 ? "filled" : "outlined"}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={goal.progress} 
                color={getProgressColor(goal.progress)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  XP: {goal.xpValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Prazo: {new Date(goal.deadline).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Tarefas Diárias */}
      {plan.dailyTasks && plan.dailyTasks.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📅 Tarefas Diárias de Hoje
            </Typography>
            {plan.dailyTasks.slice(0, 3).map((task) => (
              <Paper 
                key={task.id} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 1,
                  borderLeft: 4,
                  borderLeftColor: getPriorityColor(task.priority || 'medium'),
                  backgroundColor: task.completed ? 'success.50' : 'background.paper'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="500">
                      {task.completed ? '✅ ' : '📝 '}{task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      {task.estimatedMinutes && (
                        <Chip 
                          label={`⏱️ ${task.estimatedMinutes}min`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {task.priority && (
                        <Chip 
                          label={`${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} ${task.priority}`} 
                          size="small"
                          color={getPriorityColor(task.priority)}
                        />
                      )}
                      <Chip 
                        label={`⭐ ${task.xpValue}XP`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  </Box>
                  <Chip 
                    label={task.completed ? 'Concluída' : 'Pendente'} 
                    color={task.completed ? 'success' : 'default'}
                    variant={task.completed ? 'filled' : 'outlined'}
                  />
                </Box>
              </Paper>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};