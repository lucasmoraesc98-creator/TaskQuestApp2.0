import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useAuth } from '../contexts/auth.context';

const DebugAuth: React.FC = () => {
  const { user, login, logout } = useAuth();

  const handleMockLogin = () => {
    login('test@example.com', 'password');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🔍 Debug de Autenticação
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Estado do Usuário:</Typography>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">LocalStorage:</Typography>
          <Typography>Token: {localStorage.getItem('token') || 'Não encontrado'}</Typography>
          <Typography>User: {localStorage.getItem('user') || 'Não encontrado'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleMockLogin}>
            Fazer Login Mock
          </Button>
          <Button variant="outlined" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default DebugAuth;