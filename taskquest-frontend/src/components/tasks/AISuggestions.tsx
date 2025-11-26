import React, { useState } from 'react';
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
import { AutoAwesome, Chat, Psychology, Task, CalendarMonth } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/auth.context';
import { taskService } from '../../services/task.service';
import { annualPlanService } from '../../services/annual-plan.service';

interface AISuggestionsProps {
  onTasksAdded?: () => void;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ onTasksAdded }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ✅ CORREÇÃO: Verificar se há plano anual ativo
  const { data: currentPlan, isLoading: planLoading } = useQuery({
    queryKey: ['current-plan'],
    queryFn: () => annualPlanService.getCurrentPlan(),
    enabled: !!user,
  });

  const hasActivePlan = currentPlan?.isConfirmed;

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        response: `Entendi sua pergunta sobre "${message}". ${
          hasActivePlan 
            ? 'Como você tem um plano anual ativo, recomendo focar nas tarefas diárias do seu plano para manter o progresso consistente.' 
            : 'Recomendo criar um plano anual personalizado para ter direção clara nos seus objetivos.'
        }`
      };
    },
    onSuccess: (data) => {
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);
    },
  });

  const handleChatSubmit = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');

    await chatMutation.mutateAsync(message);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (planLoading) {
    return (
      <Card elevation={3} sx={{ height: '100%' }}>
        <CardContent>
          <Box textAlign="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Verificando seu plano anual...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <AutoAwesome color="primary" />
          <Typography variant="h6" fontWeight="600">
            {hasActivePlan ? '📊 Progresso do Plano Anual' : '🤖 Assistente de Planejamento'}
          </Typography>
        </Box>

        <AnimatePresence>
          {hasActivePlan ? (
            <motion.div
              key="active-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'success.50', borderColor: 'success.200' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom color="success.main">
                    ✅ Plano Anual Ativo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Você está seguindo seu plano anual personalizado. Continue com as tarefas diárias para progresso consistente.
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  🎯 Estrutura do Seu Plano
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Metas Anuais (HARD):</Typography>
                    <Chip label={currentPlan.hardGoals?.length || 0} color="primary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Metas Trimestrais (MEDIUM):</Typography>
                    <Chip label={currentPlan.mediumGoals?.length || 0} color="secondary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Metas Mensais (EASY):</Typography>
                    <Chip label={currentPlan.easyGoals?.length || 0} color="success" size="small" />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Progresso Diário:</strong> Complete as 3 tarefas da IA todos os dias para avançar consistentemente no seu plano anual.
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarMonth />}
                href="/annual-plan"
              >
                Ver Detalhes do Plano
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="no-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'warning.50', borderColor: 'warning.200' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom color="warning.main">
                    ⚠️ Plano Anual Não Configurado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crie um plano anual personalizado com metas HARD, MEDIUM e EASY para ter direção clara e tarefas diárias específicas.
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  🎯 Benefícios do Plano Anual
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    • <strong>3 Tarefas Diárias Específicas</strong> (100XP cada)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • <strong>Progresso Hierárquico</strong>: Daily → EASY → MEDIUM → HARD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • <strong>Metas Personalizadas</strong> baseadas nos seus objetivos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • <strong>Acompanhamento Visual</strong> do progresso anual
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={<CalendarMonth />}
                href="/annual-plan"
                sx={{ mb: 2 }}
              >
                Criar Meu Plano Anual
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Chat />}
                onClick={() => setChatOpen(true)}
              >
                Conversar com a IA sobre Planejamento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Psychology color="primary" />
            {hasActivePlan ? 'Conversa sobre Seu Plano Anual' : 'Assistente de Planejamento'}
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
            placeholder={
              hasActivePlan 
                ? "Pergunte sobre ajustes no plano, progresso ou próximos passos..."
                : "Pergunte sobre criação de plano anual, objetivos ou desafios..."
            }
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Card>
  );
};

export default AISuggestions;