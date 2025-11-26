import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { annualPlanService } from '../../services/annual-plan.service';

interface PlanAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  currentPlan: any;
  onPlanAdjusted: (updatedPlan: any) => void;
}

const COMMON_ISSUES = [
  'Metas de peso/body fat incorretas',
  'Foco errado (ganho vs perda de massa)',
  'Prazos irreais',
  'Falta de equilíbrio entre áreas',
  'Metas muito fáceis/difíceis',
  'Horas por semana inadequadas',
  'Foco em área errada',
  'Outro'
];

const PlanAdjustmentModal: React.FC<PlanAdjustmentModalProps> = ({
  open,
  onClose,
  planId,
  currentPlan,
  onPlanAdjusted,
}) => {
  const [feedback, setFeedback] = useState('');
  const [userContext, setUserContext] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError('Por favor, descreva o que precisa ser ajustado');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // ✅ CORREÇÃO: O método adjustPlan agora retorna o AnnualPlan diretamente
      const adjustedPlan = await annualPlanService.adjustPlan(planId, {
        feedback,
        userContext,
        specificIssues: selectedIssues,
      });

      // ✅ CORREÇÃO: Passar o adjustedPlan diretamente (não mais result.plan)
      onPlanAdjusted(adjustedPlan);
      onClose();
      
      // Reset form
      setFeedback('');
      setUserContext('');
      setSelectedIssues([]);
    } catch (err: any) {
      setError(err.message || 'Erro ao ajustar plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          🔧 Ajustar Plano Anual
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Encontrou algo que precisa ser corrigido? Descreva abaixo e a IA vai ajustar seu plano mantendo a estrutura.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚡ Problemas Comuns
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecione os que se aplicam:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {COMMON_ISSUES.map(issue => (
                <Chip
                  key={issue}
                  label={issue}
                  clickable
                  color={selectedIssues.includes(issue) ? 'primary' : 'default'}
                  variant={selectedIssues.includes(issue) ? 'filled' : 'outlined'}
                  onClick={() => handleIssueToggle(issue)}
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        <TextField
          label="Contexto Correto (Opcional)"
          placeholder="Ex: Na verdade tenho 69kg e 15% BF, preciso ganhar massa muscular, não perder peso..."
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 3 }}
          helperText="Forneça informações corretas se a IA entendeu algo errado"
        />

        <TextField
          label="O que precisa ser ajustado? *"
          placeholder="Ex: As metas de fitness estão focadas em perda de peso, mas eu preciso ganhar massa muscular. Também gostaria de mais foco em desenvolvimento de habilidades técnicas..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          fullWidth
          multiline
          rows={4}
          required
          sx={{ mb: 3 }}
          helperText="Seja específico sobre o que não está certo e como gostaria que fosse"
        />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={isLoading || !feedback.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Ajustando...' : 'Ajustar Plano'}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          💡 Dica: O plano será mantido, apenas as partes problemáticas serão ajustadas. Sua estrutura e metas boas serão preservadas.
        </Alert>
      </Box>
    </Modal>
  );
};

export default PlanAdjustmentModal;