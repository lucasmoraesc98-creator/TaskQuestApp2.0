import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { DeleteForever, Warning, Refresh } from '@mui/icons-material';
import { annualPlanService } from '../../services/annual-plan.service';
import { useAuth } from '../../contexts/auth.context';
import { useNavigate } from 'react-router-dom';

interface ResetAccountButtonProps {
  onAccountReset?: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

const ResetAccountButton: React.FC<ResetAccountButtonProps> = ({ 
  onAccountReset,
  disabled = false,
  variant = 'outlined',
  size = 'medium'
}) => {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setError(null);

      const result = await annualPlanService.resetAccount();
      
      if (result.success) {
        // ✅ Logout e redirecionamento
        await logout();
        navigate('/login');
        
        // Mostrar mensagem de sucesso
        alert('🎉 Conta resetada com sucesso! Faça login novamente como um novo usuário.');
        
        if (onAccountReset) {
          onAccountReset();
        }
      } else {
        throw new Error(result.message || 'Erro desconhecido ao resetar conta');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao resetar conta:', error);
      setError(error.response?.data?.message || error.message || 'Erro ao resetar conta');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        color="error"
        startIcon={<DeleteForever />}
        onClick={handleOpen}
        disabled={disabled || resetting}
        size={size}
        sx={{
          border: variant === 'outlined' ? '2px solid' : 'none',
          '&:hover': {
            backgroundColor: 'error.main',
            color: 'white',
            ...(variant === 'outlined' && {
              border: '2px solid',
              borderColor: 'error.dark'
            })
          }
        }}
      >
        {resetting ? <CircularProgress size={20} /> : 'Resetar Conta Completa'}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="reset-account-dialog-title"
        aria-describedby="reset-account-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reset-account-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" component="div">
              Resetar Conta Completa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ação irreversível - Leia com atenção
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <DialogContentText id="reset-account-dialog-description">
            <Typography variant="body1" gutterBottom>
              <strong>Esta ação apagará TODOS os seus dados e não pode ser desfeita!</strong>
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="error.main" gutterBottom>
                🗑️ <strong>O que será REMOVIDO:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, color: 'error.main' }}>
                <li>Todos os seus planos anuais</li>
                <li>Todas as tarefas (EXTREME, HARD, MEDIUM, EASY, Daily)</li>
                <li>Seu progresso (XP, nível, streaks)</li>
                <li>Sua visão, objetivos e configurações</li>
                <li>Todo o histórico de atividades</li>
              </Box>
            </Box>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="success.main" gutterBottom>
                ✅ <strong>O que será MANTIDO:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, color: 'success.main' }}>
                <li>Seu usuário e senha</li>
                <li>Sua conta de acesso</li>
              </Box>
            </Box>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="info.main" gutterBottom>
                🔄 <strong>O que acontecerá após o reset:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, color: 'info.main' }}>
                <li>Você será desconectado automaticamente</li>
                <li>Precisará fazer login novamente</li>
                <li>Encontrará uma conta completamente nova</li>
                <li>Poderá criar um novo plano anual do zero</li>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Confirma que deseja resetar completamente sua conta?</strong>
              <br />
              Esta ação é definitiva e todos os seus dados serão perdidos permanentemente.
            </Alert>
          </DialogContentText>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={resetting}
            variant="outlined"
            sx={{ flex: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReset} 
            color="error"
            disabled={resetting}
            variant="contained"
            startIcon={resetting ? <CircularProgress size={16} /> : <DeleteForever />}
            sx={{ flex: 1 }}
          >
            {resetting ? 'Resetando...' : 'Sim, Resetar Tudo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResetAccountButton;