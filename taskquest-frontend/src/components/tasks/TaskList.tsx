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
  ListItemText 
} from '@mui/material';
import { MoreVert, Delete } from '@mui/icons-material'; // CORRIGIDO: removido Edit
import { Task } from '../../types/api';
import { taskService } from '../../services/task.service';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => 
      taskService.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    if (!task.completed) {
      updateTaskMutation.mutate({
        taskId: task._id,
        updates: { completed: true }
      });
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Suas Tarefas
      </Typography>
      {tasks.length === 0 ? (
        <Typography color="textSecondary" textAlign="center" py={4}>
          Nenhuma tarefa para hoje
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tasks.map((task) => (
            <Card key={task._id} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task)}
                    disabled={task.completed}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {task.text}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`+${task.xp} XP`} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={task.type} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    {task.reason && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {task.reason}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton onClick={(e) => handleOpenMenu(e, task)}>
                  <MoreVert />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

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
    </Box>
  );
};

export default TaskList;