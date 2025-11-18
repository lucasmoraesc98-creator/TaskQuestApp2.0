// src/components/tasks/TaskList.tsx - VERSÃO CORRIGIDA
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
  Collapse,
  Alert
} from '@mui/material';
import { MoreVert, Delete, Bolt } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types/api';
import { taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/auth.context';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth(); // CORRIGIDO: apenas setUser
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [recentXP, setRecentXP] = useState<number>(0);
  const [showXPGain, setShowXPGain] = useState(false);

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.completeTask(taskId),
    onSuccess: (response) => {
      // Atualiza o usuário com os novos dados de XP
      if (response.user) {
        setUser(response.user);
      }
      
      // Mostra animação de XP ganho
      if (response.task?.xp) {
        setRecentXP(response.task.xp);
        setShowXPGain(true);
        setTimeout(() => setShowXPGain(false), 3000);
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
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
      </AnimatePresence>

      <Typography variant="h6" gutterBottom>
        Suas Tarefas
      </Typography>
      
      {tasks.length === 0 ? (
        <Typography color="textSecondary" textAlign="center" py={4}>
          Nenhuma tarefa para hoje
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
                      : '1px solid rgba(255,255,255,0.1)',
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
                          }}
                        >
                          {task.text}
                        </Typography>
                        
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
                            }}
                          />
                          <Chip 
                            label={task.type} 
                            size="small" 
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                        
                        {task.reason && (
                          <Collapse in={!!task.reason}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              display="block" 
                              mt={1}
                              sx={{ fontStyle: 'italic' }}
                            >
                              💡 {task.reason}
                            </Typography>
                          </Collapse>
                        )}
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