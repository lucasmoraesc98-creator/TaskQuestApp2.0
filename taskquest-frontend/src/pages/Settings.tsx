// src/pages/Settings.tsx
import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Settings as SettingsIcon, Save, Person, Notifications, Security } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/auth.context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [preferences, setPreferences] = useState({
    morningPerson: user?.preferences?.morningPerson || false,
    likesExercise: user?.preferences?.likesExercise || false,
    worksFromHome: user?.preferences?.worksFromHome || false,
    emailNotifications: true,
    pushNotifications: false,
  });

  const [goals, setGoals] = useState<string[]>(user?.goals || []);
  const [newGoal, setNewGoal] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: () => settingsService.updateProfile(profile),
    onSuccess: () => {
      setSaveStatus('success');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () => settingsService.updatePreferences(preferences),
    onSuccess: () => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  const updateGoalsMutation = useMutation({
    mutationFn: () => settingsService.updateGoals(goals),
    onSuccess: () => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
    },
  });

  const handleAddGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    setGoals(goals.filter(goal => goal !== goalToRemove));
  };

  const handleSaveAll = () => {
    updateProfileMutation.mutate();
    updatePreferencesMutation.mutate();
    updateGoalsMutation.mutate();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card elevation={3}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <SettingsIcon color="primary" />
              <Typography variant="h4" fontWeight="700">
                Configurações
              </Typography>
            </Box>

            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Person />} label="Perfil" />
              <Tab icon={<Notifications />} label="Preferências" />
              <Tab icon={<Security />} label="Metas" />
            </Tabs>

            {saveStatus === 'success' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Configurações salvas com sucesso!
              </Alert>
            )}

            {saveStatus === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Erro ao salvar configurações. Tente novamente.
              </Alert>
            )}

            {/* Tab Perfil */}
             <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    sx={{ mb: 3 }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab Preferências */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Preferências Pessoais
              </Typography>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.morningPerson}
                      onChange={(e) => setPreferences({ ...preferences, morningPerson: e.target.checked })}
                    />
                  }
                  label="Sou uma pessoa matutina"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.likesExercise}
                      onChange={(e) => setPreferences({ ...preferences, likesExercise: e.target.checked })}
                    />
                  }
                  label="Gosto de exercícios físicos"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.worksFromHome}
                      onChange={(e) => setPreferences({ ...preferences, worksFromHome: e.target.checked })}
                    />
                  }
                  label="Trabalho de casa"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Notificações
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    />
                  }
                  label="Notificações por email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.pushNotifications}
                      onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                    />
                  }
                  label="Notificações push"
                />
              </Box>
            </TabPanel>

            {/* Tab Metas */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Suas Metas e Objetivos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Adicione metas pessoais para receber tarefas personalizadas da IA
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Ex: Aprender React, Fazer exercícios, Ler mais..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoal();
                    }
                  }}
                />
                <Button variant="contained" onClick={handleAddGoal}>
                  Adicionar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {goals.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    onDelete={() => handleRemoveGoal(goal)}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </TabPanel>

            {/* Botão Salvar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveAll}
                disabled={updateProfileMutation.isPending}
                sx={{ borderRadius: 2 }}
              >
                Salvar Alterações
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Settings;