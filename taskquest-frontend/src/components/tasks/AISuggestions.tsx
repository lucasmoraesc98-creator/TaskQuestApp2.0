import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';
import { AISuggestion as AISuggestionType } from '../../types/api';

const AISuggestions: React.FC = () => {
  const queryClient = useQueryClient();

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
    },
  });

  const handleAddTask = (suggestion: AISuggestionType) => {
    addTaskMutation.mutate(suggestion);
  };

  const handleGenerateSuggestions = () => {
    refetch();
  };

  return (
    <Card elevation={3}>
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
    </Card>
  );
};

export default AISuggestions;