import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

const Settings: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <SettingsIcon color="primary" />
          <Typography variant="h4" fontWeight="600">
            Configurações
          </Typography>
        </Box>

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Preferências de Notificação
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notificações por email"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Lembretes diários"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Metas Diárias
            </Typography>
            <TextField
              fullWidth
              label="Meta de XP diária"
              type="number"
              defaultValue={350}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Meta de tarefas diárias"
              type="number"
              defaultValue={5}
              margin="normal"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Aparência
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Modo escuro"
            />
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="outlined">
              Cancelar
            </Button>
            <Button variant="contained">
              Salvar Configurações
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;