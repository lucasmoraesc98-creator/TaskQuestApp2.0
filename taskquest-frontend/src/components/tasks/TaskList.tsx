import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  IconButton,
  Checkbox,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import { MoreVert, Delete, Bolt, Warning } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/auth.context';
import { dailyTasksService } from '../../services/dailytasks.service';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuth(); // Agora setUser existe
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [recentXP, setRecentXP] = useState<number>(0);
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpLimitReached, setXpLimitReached] = useState(false);

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.completeTask(taskId),
    onSuccess: (data) => {
      // Atualiza o usuário com os novos dados de XP
      if (user && data.user) {
        const updatedUser = { 
          ...user, 
          xp: data.user.xp, 
          level: data.user.level 
        };
        setUser(updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Mostra animação de XP ganho
      if (data.task.xp) {
        setRecentXP(data.task.xp);
        setShowXPGain(true);
        setTimeout(() => setShowXPGain(false), 3000);
      }

      // Verifica se atingiu o limite de XP
      const currentXP = dailyTasksService.calculateDailyXP(tasks);
      if (currentXP + data.task.xp >= 400) {
        setXpLimitReached(true);
      }
    },
    onError: (error: any) => {
      if (error.response?.data?.code === 'XP_LIMIT_REACHED') {
        setXpLimitReached(true);
        setTimeout(() => setXpLimitReached(false), 5000);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    if (!task.completed) {
      // Verifica se pode ganhar mais XP hoje
      if (!dailyTasksService.canEarnMoreXP(tasks, task.xp)) {
        setXpLimitReached(true);
        setTimeout(() => setXpLimitReached(false), 5000);
        return;
      }
      
      completeTaskMutation.mutate(task._id);
    }
  };

  const handleDelete = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
    handleCloseMenu();
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const getXPColor = (xp: number) => {
    if (xp >= 100) return '#FF6B35';
    if (xp >= 50) return '#667eea';
    return '#00D4FF';
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'ai_suggestion': return '#FF6B35';
      case 'health': return '#00D4FF';
      default: return '#667eea';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_suggestion': return 'IA';
      case 'health': return 'Saúde';
      default: return 'Básica';
    }
  };

  return (
    <Box>
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Alert 
              severity="success" 
              icon={<Bolt />}
              sx={{ 
                mb: 2,
                background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(102,126,234,0.1) 100%)',
                border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: 3,
              }}
            >
              <Typography variant="body2" fontWeight="600">
                +{recentXP} XP ganhos! Continue assim! 🚀
              </Typography>
            </Alert>
          </motion.div>
        )}

        {xpLimitReached && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Alert 
              severity="warning" 
              icon={<Warning />}
              sx={{ 
                mb: 2,
                background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,107,53,0.05) 100%)',
                border: '1px solid rgba(255,107,53,0.3)',
                borderRadius: 3,
              }}
            >
              <Typography variant="body2" fontWeight="600">
                Limite diário de 400XP atingido! Volte amanhã para mais conquistas! 🎯
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Typography variant="h6" gutterBottom>
        Suas Tarefas ({tasks.length})
      </Typography>
      
      {tasks.length === 0 ? (
        <Typography color="textSecondary" textAlign="center" py={4}>
          Nenhuma tarefa para hoje. Adicione tarefas da IA ou básicas para começar!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 3,
                    background: task.completed 
                      ? 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(21,21,31,0.9) 0%, rgba(42,42,58,0.9) 100%)',
                    border: task.completed 
                      ? '1px solid rgba(76,175,80,0.3)'
                      : `1px solid ${getTaskTypeColor(task.type)}30`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Checkbox
                          checked={task.completed}
                          onChange={() => handleToggleComplete(task)}
                          disabled={task.completed || completeTaskMutation.isPending}
                          sx={{
                            color: getXPColor(task.xp),
                            '&.Mui-checked': {
                              color: getXPColor(task.xp),
                            },
                          }}
                        />
                      </motion.div>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          sx={{ 
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? 'text.secondary' : 'text.primary',
                            fontWeight: task.completed ? 400 : 600,
                            fontSize: '0.95rem'
                          }}
                        >
                          {task.title}
                        </Typography>
                        
                        {task.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            mt={0.5}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {task.description}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<Bolt sx={{ fontSize: 16 }} />}
                            label={`+${task.xp} XP`} 
                            size="small" 
                            sx={{ 
                              background: `linear-gradient(135deg, ${getXPColor(task.xp)}20 0%, ${getXPColor(task.xp)}10 100%)`,
                              color: getXPColor(task.xp),
                              border: `1px solid ${getXPColor(task.xp)}30`,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip 
                            label={getTaskTypeLabel(task.type)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 2,
                              borderColor: getTaskTypeColor(task.type),
                              color: getTaskTypeColor(task.type),
                              fontSize: '0.7rem'
                            }}
                          />
                          {task.dailyReset && (
                            <Chip 
                              label="🔄 Diária" 
                              size="small" 
                              variant="outlined"
                              sx={{ borderRadius: 2, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    {!task.completed && (
                      <IconButton 
                        onClick={(e) => handleOpenMenu(e, task)}
                        sx={{
                          '&:hover': {
                            background: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectedTask && handleDelete(selectedTask._id)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskList;