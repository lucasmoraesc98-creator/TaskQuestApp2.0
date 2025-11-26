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
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { MoreVert, Delete, Bolt, Warning, Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/auth.context';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [recentXP, setRecentXP] = useState<number>(0);
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpLimitReached, setXpLimitReached] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskXP, setNewTaskXP] = useState(20);

  // Mutation para adicionar tarefa manual
  const addTaskMutation = useMutation({
    mutationFn: (taskData: { text: string; xp: number }) => 
      taskService.createTask({
        text: taskData.text,
        xp: taskData.xp,
        type: 'basic',
        reason: 'Tarefa manual'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      setAddTaskDialogOpen(false);
      setNewTaskText('');
      setNewTaskXP(20);
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar tarefa:', error);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.completeTask(taskId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });

      // Mostra animação de XP ganho
      if (data.task.xp) {
        setRecentXP(data.task.xp);
        setShowXPGain(true);
        setTimeout(() => setShowXPGain(false), 3000);
      }

      if (data.leveledUp) {
        console.log('🎉 Level UP! Novo level:', data.newLevel);
      }
    },
    onError: (error: any) => {
      if (error.message.includes('Limite diário')) {
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

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      addTaskMutation.mutate({
        text: newTaskText.trim(),
        xp: newTaskXP
      });
    }
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" fontWeight="600">
                Limite diário de XP atingido! Volte amanhã para mais conquistas! 🎯
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Suas Tarefas ({tasks.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddTaskDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
          }}
        >
          Adicionar Tarefa
        </Button>
      </Box>
      
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
                      : `1px solid ${getTaskTypeColor(task.type)}30`,
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
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
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? 'text.secondary' : 'text.primary',
                            fontWeight: task.completed ? 400 : 600,
                          }}
                        >
                          {task.text}
                        </Typography>
                        
                        {task.reason && (
                          <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {task.reason}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip 
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
                            label={getTaskTypeLabel(task.type)} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    {!task.completed && (
                      <IconButton onClick={(e) => handleOpenMenu(e, task)}>
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

      {/* Menu de contexto */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => selectedTask && handleDelete(selectedTask._id)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog para adicionar tarefa manual */}
      <Dialog open={addTaskDialogOpen} onClose={() => setAddTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descrição da tarefa"
            type="text"
            fullWidth
            variant="outlined"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="XP da tarefa"
            type="number"
            fullWidth
            variant="outlined"
            value={newTaskXP}
            onChange={(e) => setNewTaskXP(Number(e.target.value))}
            helperText="XP diário máximo: 400"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained"
            disabled={!newTaskText.trim() || addTaskMutation.isPending}
          >
            {addTaskMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList;