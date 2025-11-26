import React from 'react';
import {
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import { GoalPlan } from '../../services/goal-planning.service';

export interface GoalProgressProps {
  plan: GoalPlan;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ plan }) => {
  // Calcular progresso geral baseado nas tarefas diárias
  const totalTasks = plan.dailyTasks?.length || 0;
  const completedTasks = plan.dailyTasks?.filter(task => task.completed).length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Progresso do Plano
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          <Box width="100%" mr={1}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Box minWidth={35}>
            <Typography variant="body2" color="textSecondary">
              {`${Math.round(progress)}%`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2">
          {completedTasks} de {totalTasks} tarefas concluídas
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GoalProgress;