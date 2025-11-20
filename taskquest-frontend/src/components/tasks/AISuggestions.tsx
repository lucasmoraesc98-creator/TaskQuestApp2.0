import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Snackbar,
} from '@mui/material';
import { AutoAwesome, Chat, Psychology, Task } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/auth.context';
import { settingsService, UserGoals } from '../../services/settings.service';
import { taskService } from '../../services/task.service';
import { dailyTasksService } from '../../services/dailytasks.service';

interface AITask {
  id: string;
  title: string;
  description: string;
  xp: number;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  relatedGoal: string;
}

interface AISuggestionsResponse {
  analysis: string;
  tasks: AITask[];
}

interface ChatResponse {
  response: string;
}

const AISuggestions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Buscar objetivos do usuário
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['user-goals'],
    queryFn: () => settingsService.getUserGoals(),
    enabled: !!user,
  });

  // Buscar sugestões de IA
  const { 
    data: aiSuggestions, 
    isLoading: suggestionsLoading, 
    error, 
    refetch 
  } = useQuery<AISuggestionsResponse, Error>({
    queryKey: ['ai-suggestions'],
    queryFn: () => settingsService.getAISuggestions(),
    enabled: !!user && !!goals,
  });

  // Mutação para chat com IA
  const chatMutation = useMutation<ChatResponse, Error, string>({
    mutationFn: (message: string) => settingsService.chatWithAI(message),
    onSuccess: (data) => {
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);
    },
  });

  // Mutação para adicionar tarefa da IA
  const addTaskMutation = useMutation({
    mutationFn: (task: AITask) => taskService.createTask({
      title: task.title,
      description: task.description,
      xp: 100, // 100XP para tarefas da IA
      type: 'ai_suggestion',
      priority: task.priority,
      estimatedTime: task.estimatedTime,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSnackbarMessage('Tarefa da IA adicionada com sucesso! +100XP');
      setSnackbarOpen(true);
    },
    onError: () => {
      setSnackbarMessage('Erro ao adicionar tarefa');
      setSnackbarOpen(true);
    },
  });

  // Mutação para adicionar todas as tarefas básicas
  const addAllBasicTasksMutation = useMutation({
    mutationFn: async () => {
      const basicTasks = dailyTasksService.getBasicTasksConfig();
      for (const task of basicTasks) {
        await taskService.createTask({
          ...task,
          dailyReset: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSnackbarMessage('Todas as tarefas básicas adicionadas! +100XP total');
      setSnackbarOpen(true);
    },
    onError: () => {
      setSnackbarMessage('Erro ao adicionar tarefas básicas');
      setSnackbarOpen(true);
    },
  });

  useEffect(() => {
    if (goals) {
      setUserGoals(goals);
    }
  }, [goals]);

  const handleChatSubmit = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');

    await chatMutation.mutateAsync(message);
  };

  const handleAddTask = (task: AITask) => {
    addTaskMutation.mutate(task);
  };

  const handleAddAllBasicTasks = () => {
    addAllBasicTasksMutation.mutate();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const hasGoals = userGoals && (
    userGoals.incomeSources.length > 0 ||
    userGoals.workChallenges.length > 0 ||
    userGoals.healthChallenges.length > 0 ||
    userGoals.shortTermGoals.length > 0 ||
    userGoals.longTermGoals.length > 0
  );

  const basicTasks = dailyTasksService.getBasicTasksConfig();

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <AutoAwesome color="primary" />
          <Typography variant="h6" fontWeight="600">
            IA - Seu Assistente Pessoal
          </Typography>
        </Box>

        {!hasGoals && !goalsLoading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Complete seus objetivos nas Configurações para receber sugestões personalizadas da IA.
          </Alert>
        )}

        <AnimatePresence>
          {suggestionsLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  IA analisando seus objetivos e calculando a melhor rota...
                </Typography>
              </Box>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => refetch()}
              >
                Tentar Novamente
              </Button>
            </motion.div>
          )}

          {aiSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Resumo da Análise da IA */}
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    📊 Análise da sua Rota
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {aiSuggestions.analysis}
                  </Typography>
                </CardContent>
              </Card>

              {/* Tarefas Sugeridas da IA */}
              <Typography variant="h6" gutterBottom>
                🎯 Suas 3 Tarefas Diárias da IA (100XP cada)
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                {aiSuggestions.tasks.map((task: AITask) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Typography variant="h6" gutterBottom>
                            {task.title}
                          </Typography>
                          <Chip 
                            label={`${task.xp}XP`} 
                            color="primary" 
                            size="small" 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {task.description}
                        </Typography>

                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                          <Chip 
                            label={`⏱️ ${task.estimatedTime}min`} 
                            variant="outlined" 
                            size="small" 
                          />
                          <Chip 
                            label={`🎯 ${task.relatedGoal}`} 
                            variant="outlined" 
                            size="small" 
                          />
                          <Chip 
                            label={
                              task.priority === 'high' ? '🔴 Alta' : 
                              task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'
                            } 
                            variant="outlined" 
                            size="small" 
                          />
                        </Box>

                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Task />}
                          onClick={() => handleAddTask(task)}
                          disabled={addTaskMutation.isPending}
                        >
                          Adicionar às Minhas Tarefas
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Tarefas Básicas de Saúde */}
              <Typography variant="h6" gutterBottom>
                🌟 Tarefas de Saúde Diárias (20XP cada)
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {basicTasks.map((task, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {task.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.description}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${task.xp}XP`} 
                          color="secondary" 
                          size="small" 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleAddAllBasicTasks}
                disabled={addAllBasicTasksMutation.isPending}
                sx={{ mb: 2 }}
              >
                Adicionar Todas as Tarefas Básicas
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Chat />}
                onClick={() => setChatOpen(true)}
              >
                Conversar com a IA sobre meus objetivos
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Chat com IA */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Psychology color="primary" />
            Conversa com sua IA de Objetivos
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '400px', overflowY: 'auto', mb: 2, p: 1 }}>
            {conversation.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.800',
                    color: 'white',
                    borderRadius: 2,
                    p: 2,
                    maxWidth: '70%',
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                </Box>
              </Box>
            ))}
            {chatMutation.isPending && (
              <Box display="flex" justifyContent="flex-start" mb={2}>
                <Box
                  sx={{
                    bgcolor: 'grey.800',
                    color: 'white',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body2">
                    <CircularProgress size={12} sx={{ mr: 1 }} />
                    IA está pensando...
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Pergunte sobre seus objetivos, peça ajustes na rota..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
              }
            }}
            multiline
            maxRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatOpen(false)}>Fechar</Button>
          <Button
            onClick={handleChatSubmit}
            disabled={chatMutation.isPending || !message.trim()}
            variant="contained"
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Card>
  );
};

export default AISuggestions;