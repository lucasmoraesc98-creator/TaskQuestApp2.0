import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import { Settings as SettingsIcon, Add } from '@mui/icons-material';
import { useAuth } from '../contexts/auth.context';
import { GoalPlanningWizard } from '../components/goals/GoalPlanningWizard';
import { GoalProgress } from '../components/goals/GoalProgress';

interface UserGoals {
  incomeSources: string[];
  workChallenges: string[];
  healthChallenges: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  currentFocus: string;
  currentAnnualIncome?: number;
  desiredAnnualIncome?: number;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [goals, setGoals] = useState<UserGoals>({
    incomeSources: [],
    workChallenges: [],
    healthChallenges: [],
    shortTermGoals: [],
    longTermGoals: [],
    currentFocus: '',
    currentAnnualIncome: 0,
    desiredAnnualIncome: 0,
  });

  const [newIncome, setNewIncome] = useState('');
  const [newWorkChallenge, setNewWorkChallenge] = useState('');
  const [newHealthChallenge, setNewHealthChallenge] = useState('');
  const [newShortTermGoal, setNewShortTermGoal] = useState('');
  const [newLongTermGoal, setNewLongTermGoal] = useState('');
const [planningWizardOpen, setPlanningWizardOpen] = useState(false);
const [currentPlan, setCurrentPlan] = useState<any>(null);
const [planProgress, setPlanProgress] = useState<any>(null);

  useEffect(() => {
    loadUserGoals();
  }, []);

  const loadUserGoals = async () => {
    try {
      const savedGoals = localStorage.getItem('userGoals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar objetivos:', error);
    }
  };

  const handleSaveGoals = async () => {
    setLoading(true);
    
    try {
      localStorage.setItem('userGoals', JSON.stringify(goals));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Erro ao salvar objetivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIncome = () => {
    if (newIncome.trim()) {
      setGoals(prev => ({
        ...prev,
        incomeSources: [...prev.incomeSources, newIncome.trim()]
      }));
      setNewIncome('');
    }
  };

  const removeIncome = (index: number) => {
    setGoals(prev => ({
      ...prev,
      incomeSources: prev.incomeSources.filter((_, i) => i !== index)
    }));
  };

  const addWorkChallenge = () => {
    if (newWorkChallenge.trim()) {
      setGoals(prev => ({
        ...prev,
        workChallenges: [...prev.workChallenges, newWorkChallenge.trim()]
      }));
      setNewWorkChallenge('');
    }
  };

  const removeWorkChallenge = (index: number) => {
    setGoals(prev => ({
      ...prev,
      workChallenges: prev.workChallenges.filter((_, i) => i !== index)
    }));
  };

  const addHealthChallenge = () => {
    if (newHealthChallenge.trim()) {
      setGoals(prev => ({
        ...prev,
        healthChallenges: [...prev.healthChallenges, newHealthChallenge.trim()]
      }));
      setNewHealthChallenge('');
    }
  };

  const removeHealthChallenge = (index: number) => {
    setGoals(prev => ({
      ...prev,
      healthChallenges: prev.healthChallenges.filter((_, i) => i !== index)
    }));
  };

  const addShortTermGoal = () => {
    if (newShortTermGoal.trim()) {
      setGoals(prev => ({
        ...prev,
        shortTermGoals: [...prev.shortTermGoals, newShortTermGoal.trim()]
      }));
      setNewShortTermGoal('');
    }
  };

  const removeShortTermGoal = (index: number) => {
    setGoals(prev => ({
      ...prev,
      shortTermGoals: prev.shortTermGoals.filter((_, i) => i !== index)
    }));
  };

  const addLongTermGoal = () => {
    if (newLongTermGoal.trim()) {
      setGoals(prev => ({
        ...prev,
        longTermGoals: [...prev.longTermGoals, newLongTermGoal.trim()]
      }));
      setNewLongTermGoal('');
    }
  };

  const removeLongTermGoal = (index: number) => {
    setGoals(prev => ({
      ...prev,
      longTermGoals: prev.longTermGoals.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <SettingsIcon color="primary" />
          <Typography variant="h4" fontWeight="600">
            Configurações e Objetivos
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" mb={3}>
          Configure seus objetivos para que a IA possa criar tarefas personalizadas para você.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Objetivos salvos com sucesso! A IA vai usar essas informações para criar suas tarefas diárias.
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Fontes de Renda */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  💰 Fontes de Renda
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Liste todas suas fontes de renda atuais
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addIncome)}
                    placeholder="Ex: Salário CLT, Freelance, Investimentos..."
                  />
                  <IconButton color="primary" onClick={addIncome}>
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {goals.incomeSources.map((income, index) => (
                    <Chip
                      key={index}
                      label={income}
                      onDelete={() => removeIncome(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  {goals.incomeSources.length === 0 && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nenhuma fonte de renda adicionada
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
<Card sx={{ mt: 3 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      🎯 Plano de 1 Ano com IA
    </Typography>
    {currentPlan ? (
      <GoalProgress plan={currentPlan} progress={planProgress} />
    ) : (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Crie um plano personalizado de 1 ano com IA
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setPlanningWizardOpen(true)}
          startIcon={<Add />}
        >
          Criar Plano com IA
        </Button>
      </Box>
    )}
  </CardContent>
</Card>

// E o wizard:
<GoalPlanningWizard
  open={planningWizardOpen}
  onClose={() => setPlanningWizardOpen(false)}
  onPlanCreated={setCurrentPlan}
/>
          {/* Renda Atual e Desejada */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Metas Financeiras
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Renda Anual Atual (R$)"
                      type="number"
                      value={goals.currentAnnualIncome || ''}
                      onChange={(e) => setGoals(prev => ({
                        ...prev, 
                        currentAnnualIncome: e.target.value ? Number(e.target.value) : 0
                      }))}
                      placeholder="0"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Renda Anual Desejada (R$)"
                      type="number"
                      value={goals.desiredAnnualIncome || ''}
                      onChange={(e) => setGoals(prev => ({
                        ...prev, 
                        desiredAnnualIncome: e.target.value ? Number(e.target.value) : 0
                      }))}
                      placeholder="0"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Desafios no Trabalho */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  💼 Desafios no Trabalho
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quais desafios você está enfrentando profissionalmente?
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newWorkChallenge}
                    onChange={(e) => setNewWorkChallenge(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addWorkChallenge)}
                    placeholder="Ex: Procura de novo emprego, promoção, skills..."
                  />
                  <IconButton color="primary" onClick={addWorkChallenge}>
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {goals.workChallenges.map((challenge, index) => (
                    <Chip
                      key={index}
                      label={challenge}
                      onDelete={() => removeWorkChallenge(index)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                  {goals.workChallenges.length === 0 && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nenhum desafio profissional adicionado
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Desafios de Saúde */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  ❤️ Desafios de Saúde
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quais aspectos de saúde você quer melhorar?
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newHealthChallenge}
                    onChange={(e) => setNewHealthChallenge(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addHealthChallenge)}
                    placeholder="Ex: Perder peso, ganhar massa, dormir melhor..."
                  />
                  <IconButton color="primary" onClick={addHealthChallenge}>
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {goals.healthChallenges.map((challenge, index) => (
                    <Chip
                      key={index}
                      label={challenge}
                      onDelete={() => removeHealthChallenge(index)}
                      color="error"
                      variant="outlined"
                    />
                  ))}
                  {goals.healthChallenges.length === 0 && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nenhum desafio de saúde adicionado
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Objetivos Curto Prazo */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🎯 Objetivos - 3 Meses
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  O que você quer conquistar nos próximos 3 meses?
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newShortTermGoal}
                    onChange={(e) => setNewShortTermGoal(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addShortTermGoal)}
                    placeholder="Ex: Aprender nova skill, concluir projeto..."
                  />
                  <IconButton color="primary" onClick={addShortTermGoal}>
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {goals.shortTermGoals.map((goal, index) => (
                    <Chip
                      key={index}
                      label={goal}
                      onDelete={() => removeShortTermGoal(index)}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                  {goals.shortTermGoals.length === 0 && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nenhum objetivo de curto prazo adicionado
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Objetivos Longo Prazo */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🚀 Objetivos - 1 Ano
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Onde você quer estar daqui a 1 ano?
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={newLongTermGoal}
                    onChange={(e) => setNewLongTermGoal(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addLongTermGoal)}
                    placeholder="Ex: Mudar de carreira, comprar casa..."
                  />
                  <IconButton color="primary" onClick={addLongTermGoal}>
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {goals.longTermGoals.map((goal, index) => (
                    <Chip
                      key={index}
                      label={goal}
                      onDelete={() => removeLongTermGoal(index)}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                  {goals.longTermGoals.length === 0 && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Nenhum objetivo de longo prazo adicionado
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Foco Atual */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🎯 Foco Principal Atual
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Qual é seu foco principal agora?</InputLabel>
                  <Select
                    value={goals.currentFocus}
                    onChange={(e) => setGoals(prev => ({...prev, currentFocus: e.target.value}))}
                    label="Qual é seu foco principal agora?"
                  >
                    <MenuItem value="">Selecione seu foco principal</MenuItem>
                    <MenuItem value="career">🚀 Carreira e Desenvolvimento Profissional</MenuItem>
                    <MenuItem value="health">❤️ Saúde e Bem-estar</MenuItem>
                    <MenuItem value="financial">💰 Estabilidade Financeira</MenuItem>
                    <MenuItem value="relationships">👥 Relacionamentos</MenuItem>
                    <MenuItem value="education">📚 Educação e Aprendizado</MenuItem>
                    <MenuItem value="business">💼 Empreendedorismo</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleSaveGoals}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
              fontWeight: 600,
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #00A3CC 0%, #5a6fd8 100%)',
              }
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Objetivos'}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          💡 <strong>Dica:</strong> Preencha pelo menos 3-4 categorias para que a IA possa criar tarefas mais relevantes para você.
        </Alert>
      </Paper>
    </Container>
  );
};

export default Settings;