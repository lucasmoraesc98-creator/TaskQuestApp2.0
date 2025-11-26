import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Card,
  CardContent,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, taskService } from '../../services/task.service';
import { CalendarToday, PriorityHigh, FitnessCenter, HealthAndSafety } from '@mui/icons-material';

interface TaskListProps {
  tasks: Task[];
  onTaskCompleted?: (xp: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskCompleted }) => {
  const queryClient = useQueryClient();
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      setCompletingTasks(prev => new Set(prev).add(taskId));
      
      try {
        const result = await taskService.completeTask(taskId);
        return result;
      } catch (error) {
        setCompletingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        throw error;
      }
    },
    onSuccess: (data, taskId) => {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      
      if (onTaskCompleted && data.task.xp) {
        onTaskCompleted(data.task.xp);
      }

      if (data.leveledUp) {
        console.log('🎉 Level UP! Novo level:', data.newLevel);
      }
    },
    onError: (error: any, taskId) => {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      console.error('❌ Erro ao completar tarefa:', error);
    },
  });

  const handleToggleComplete = (task: Task) => {
    if (task.completed || completingTasks.has(task._id)) {
      return;
    }

    console.log(`✅ Completando task: ${task.text} (ID: ${task._id})`);
    completeTaskMutation.mutate(task._id);
  };

  const isTaskCompleting = (taskId: string) => {
    return completingTasks.has(taskId);
  };

  const getXPColor = (xp: number, type?: string) => {
    if (type === 'health') return '#4CAF50';
    if (type === 'fitness') return '#FF9800';
    if (type === 'goal_hard') return '#FF6B35';
    if (type === 'goal_medium') return '#667eea';
    if (type === 'plan_review') return '#00D4FF';
    if (type === 'ai_suggestion') return '#4CAF50';
    
    if (xp >= 100) return '#FF6B35';
    if (xp >= 50) return '#667eea';
    return '#00D4FF';
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  const getDeadlineColor = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'error';
    if (diffDays <= 3) return 'warning';
    if (diffDays <= 7) return 'info';
    return 'success';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Média';
    }
  };

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'goal_daily': return 'Diária';
      case 'health': return '🏥 Saúde';
      case 'fitness': return '💪 Fitness';
      case 'goal_extreme': return '🌠 EXTREME';
      case 'goal_hard': return '🏆 HARD';
      case 'goal_medium': return '🎯 MEDIUM';
      case 'goal_easy': return '📝 EASY';
      case 'plan_review': return '📋 Revisão';
      case 'ai_suggestion': return '🤖 IA';
      case 'custom': return '📌 Personalizada';
      case 'basic': return '🔵 Básica';
      default: return type;
    }
  };

  // ✅ CORREÇÃO: Função para renderizar Chip com ícone condicional
  const renderTaskTypeChip = (type: string) => {
    let icon = null;
    
    switch (type) {
      case 'health':
        icon = <HealthAndSafety fontSize="small" />;
        break;
      case 'fitness':
        icon = <FitnessCenter fontSize="small" />;
        break;
      default:
        // Não renderiza ícone para outros tipos
        break;
    }

    // ✅ CORREÇÃO: Renderizar Chip com ícone apenas se existir
    if (icon) {
      return (
        <Chip 
          icon={icon}
          label={getTaskTypeText(type)} 
          size="small" 
          variant="outlined"
          sx={{
            borderColor: getXPColor(50, type),
          }}
        />
      );
    } else {
      return (
        <Chip 
          label={getTaskTypeText(type)} 
          size="small" 
          variant="outlined"
          sx={{
            borderColor: getXPColor(50, type),
          }}
        />
      );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 3,
                background: task.completed 
                  ? 'rgba(76,175,80,0.1)'
                  : 'rgba(21,21,31,0.9)',
                border: task.completed 
                  ? '1px solid rgba(76,175,80,0.3)'
                  : `1px solid ${getXPColor(task.xp, task.type)}30`,
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }
              }}
            >
              {!task.completed && task.aiData?.priority && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: 
                      task.aiData.priority === 'high' ? '#f44336' :
                      task.aiData.priority === 'medium' ? '#ff9800' : '#2196f3',
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                  }}
                />
              )}

              <CardContent sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between', 
                py: 2,
                pl: 3,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                  <Box sx={{ position: 'relative', mt: 0.5 }}>
                    <Checkbox
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                      disabled={task.completed || isTaskCompleting(task._id)}
                      sx={{
                        color: getXPColor(task.xp, task.type),
                        '&.Mui-checked': {
                          color: getXPColor(task.xp, task.type),
                        },
                        '&.Mui-disabled': {
                          color: task.completed ? 'rgba(76,175,80,0.5)' : 'rgba(255,255,255,0.3)',
                        },
                      }}
                    />
                    {isTaskCompleting(task._id) && (
                      <CircularProgress 
                        size={24} 
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                          color: getXPColor(task.xp, task.type),
                        }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'text.secondary' : 'text.primary',
                        fontWeight: task.completed ? 400 : 600,
                        mb: 1,
                        opacity: task.completed ? 0.7 : 1,
                      }}
                    >
                      {task.text}
                    </Typography>
                    
                    {task.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          mb: 1.5,
                          opacity: task.completed ? 0.6 : 0.8,
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}
                    
                    {task.reason && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontStyle: 'italic',
                          mb: 1.5,
                          opacity: task.completed ? 0.6 : 0.8,
                        }}
                      >
                        {task.reason}
                      </Typography>
                    )}

                    {/* ✅ SEÇÃO: METADADOS DA TASK - CORRIGIDA */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* CHIP DE XP */}
                      <Chip 
                        label={`+${task.xp} XP`} 
                        size="small" 
                        sx={{ 
                          background: `linear-gradient(135deg, ${getXPColor(task.xp, task.type)}20 0%, ${getXPColor(task.xp, task.type)}10 100%)`,
                          color: getXPColor(task.xp, task.type),
                          border: `1px solid ${getXPColor(task.xp, task.type)}30`,
                          fontWeight: 600,
                        }}
                      />

                      {/* ✅ CHIP DE TIPO - CORRIGIDO */}
                      {renderTaskTypeChip(task.type)}

                      {/* ✅ CHIP DE PRIORIDADE (se não concluída) */}
                      {!task.completed && task.aiData?.priority && (
                        <Tooltip title={`Prioridade ${getPriorityText(task.aiData.priority)}`}>
                          <Chip 
                            icon={<PriorityHigh />}
                            label={getPriorityText(task.aiData.priority)}
                            size="small"
                            color={getPriorityColor(task.aiData.priority)}
                            variant="outlined"
                          />
                        </Tooltip>
                      )}

                      {/* ✅ CHIP DE DEADLINE (se não concluída) */}
                      {!task.completed && task.aiData?.deadline && (
                        <Tooltip title={`Prazo: ${new Date(task.aiData.deadline).toLocaleDateString('pt-BR')}`}>
                          <Chip 
                            icon={<CalendarToday />}
                            label={formatDeadline(task.aiData.deadline)}
                            size="small"
                            color={getDeadlineColor(task.aiData.deadline)}
                            variant="outlined"
                          />
                        </Tooltip>
                      )}

                      {/* ✅ TEMPO ESTIMADO (se disponível) */}
                      {!task.completed && task.aiData?.estimatedMinutes && (
                        <Chip 
                          label={`${task.aiData.estimatedMinutes}min`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* ✅ SEÇÃO DIREITA: Status de conclusão */}
                {task.completed && (
                  <Box sx={{ ml: 2, textAlign: 'center', minWidth: 80 }}>
                    <Typography 
                      variant="caption" 
                      color="success.main"
                      sx={{ fontWeight: 'bold', display: 'block' }}
                    >
                      Concluída
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="success.main"
                      sx={{ display: 'block' }}
                    >
                      {task.completedAt && new Date(task.completedAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default TaskList;