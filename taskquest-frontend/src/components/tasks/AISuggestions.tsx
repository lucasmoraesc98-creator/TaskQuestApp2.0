import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';
import { AISuggestion as AISuggestionType } from '../../types/api';

const AISuggestions: React.FC = () => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { data: suggestions, isLoading, refetch, isError } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => taskService.getAISuggestions(3),
    enabled: false
  });

  const addTaskMutation = useMutation({
    mutationFn: (suggestion: AISuggestionType) => 
      taskService.createTask({
        text: suggestion.text,
        xp: suggestion.xp,
        type: suggestion.type,
        date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSnackbar({ open: true, message: 'Tarefa adicionada!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Erro ao adicionar tarefa', severity: 'error' });
    },
  });

  const handleAddTask = (suggestion: AISuggestionType) => {
    addTaskMutation.mutate(suggestion);
  };

  const handleGenerateSuggestions = () => {
    refetch();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Card elevation={3} sx={{ border: '1px solid #333' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AutoAwesome color="primary" />
          <Typography variant="h6">Sugestões de IA</Typography>
        </Box>

        {!suggestions && !isLoading && (
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGenerateSuggestions}
            startIcon={<AutoAwesome />}
            sx={{ borderColor: '#333', color: 'primary.main', '&:hover': { borderColor: '#00D4FF' } }}
          >
            Gerar Sugestões
          </Button>
        )}

        {isError && (
          <Typography color="error" variant="body2" textAlign="center">
            Erro ao carregar sugestões
          </Typography>
        )}

        {isLoading && (
          <Box textAlign="center" py={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Gerando sugestões personalizadas...
            </Typography>
          </Box>
        )}

        {suggestions?.map((suggestion: AISuggestionType, index: number) => (
          <Box
            key={index}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.default',
            }}
          >
            <Typography variant="body1" gutterBottom>
              {suggestion.text}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Chip
                label={`+${suggestion.xp} XP`}
                color="primary"
                size="small"
                variant="outlined"
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => handleAddTask(suggestion)}
                disabled={addTaskMutation.isPending}
              >
                Adicionar
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              {suggestion.reason}
            </Typography>
          </Box>
        ))}
      </CardContent>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default AISuggestions;