import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress
} from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';
import { annualPlanService } from '../../services/annual-plan.service';

interface ResetPlanButtonProps {
  onPlanReset: () => void;
  disabled?: boolean;
}

const ResetPlanButton: React.FC<ResetPlanButtonProps> = ({ 
  onPlanReset, 
  disabled = false 
}) => {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleReset = async () => {
  try {
    setResetting(true);
    await annualPlanService.resetAnnualPlan();
    
    // Callback para atualizar o estado no componente pai
    onPlanReset();
    
    handleClose();
    
      
     // Mostrar mensagem de sucesso (usando alert por simplicidade, ou você pode usar um contexto de notificação)
    alert('Plano anual resetado com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro ao resetar plano:', error);
    alert(error.response?.data?.message || 'Erro ao resetar plano');
  } finally {
    setResetting(false);
  }
};

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<Refresh />}
        onClick={handleOpen}
        disabled={disabled || resetting}
        sx={{
          minWidth: '200px',
          border: '2px solid',
          '&:hover': {
            backgroundColor: 'error.light',
            color: 'white',
            border: '2px solid',
            borderColor: 'error.main'
          }
        }}
      >
        {resetting ? <CircularProgress size={20} /> : 'Resetar Plano Anual'}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Resetar Plano Anual
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText id="reset-dialog-description">
            <strong>Esta ação não pode ser desfeita!</strong>
            <br /><br />
            Ao resetar o plano anual:
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <li>✅ Todas as metas EXTREME, HARD, MEDIUM e EASY serão removidas</li>
              <li>✅ Todas as tarefas diárias do plano serão excluídas</li>
              <li>✅ Seu progresso atual será perdido</li>
              <li>✅ As tarefas básicas de saúde serão mantidas</li>
              <li>✅ Você poderá criar um novo plano do zero</li>
            </Box>
            <br />
            Tem certeza que deseja continuar?
          </DialogContentText>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={resetting}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReset} 
            color="error"
            disabled={resetting}
            variant="contained"
            startIcon={resetting ? <CircularProgress size={16} /> : <Refresh />}
          >
            {resetting ? 'Resetando...' : 'Sim, Resetar Plano'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResetPlanButton;