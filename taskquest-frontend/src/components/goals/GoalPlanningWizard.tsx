import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  TextField,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Add, Close, ArrowForward, ArrowBack } from '@mui/icons-material';
import { goalPlanningService, CreateGoalPlanDto } from '../../services/goal-planning.service';

interface GoalPlanningWizardProps {
  open: boolean;
  onClose: () => void;
  onPlanCreated: (plan: any) => void;
}

const steps = ['Visão', 'Objetivos', 'Desafios & Ferramentas', 'Revisão'];

export const GoalPlanningWizard: React.FC<GoalPlanningWizardProps> = ({
  open,
  onClose,
  onPlanCreated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [vision, setVision] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [newChallenge, setNewChallenge] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [newTool, setNewTool] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    setGoals(goals.filter(goal => goal !== goalToRemove));
  };

  const handleAddChallenge = () => {
    if (newChallenge.trim() && !challenges.includes(newChallenge.trim())) {
      setChallenges([...challenges, newChallenge.trim()]);
      setNewChallenge('');
    }
  };

  const handleRemoveChallenge = (challengeToRemove: string) => {
    setChallenges(challenges.filter(challenge => challenge !== challengeToRemove));
  };

  const handleAddTool = () => {
    if (newTool.trim() && !tools.includes(newTool.trim())) {
      setTools([...tools, newTool.trim()]);
      setNewTool('');
    }
  };

  const handleRemoveTool = (toolToRemove: string) => {
    setTools(tools.filter(tool => tool !== toolToRemove));
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setError('');

    try {
      const planData: CreateGoalPlanDto = {
        vision,
        goals,
        challenges,
        tools,
        hoursPerWeek,
        preferences: {
          focus: 'career',
          learningStyle: 'practical'
        }
      };

      const plan = await goalPlanningService.createGoalPlan(planData);
      onPlanCreated(plan);
      onClose();
      
      // Reset form
      setVision('');
      setGoals([]);
      setChallenges([]);
      setTools([]);
      setActiveStep(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar plano com IA');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              🎯 Sua Visão para 1 Ano
            </Typography>
            <Typography variant="body1" gutterBottom>
              Onde você quer estar daqui a exatamente 1 ano? Seja específico e ambicioso!
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Ex: Me tornar um desenvolvedor FullStack sênior, conseguir um emprego remoto ganhando R$ 10.000/mês, dominar React, Node.js e TypeScript..."
              sx={{ mt: 2 }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              💡 A IA usará esta visão para criar um plano personalizado de 365 dias!
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              🚀 Objetivos Principais
            </Typography>
            <Typography variant="body1" gutterBottom>
              Quais são seus principais objetivos? Liste 3-5 áreas que você quer desenvolver.
            </Typography>
            
            <Box display="flex" gap={1} mb={2} mt={2}>
              <TextField
                fullWidth
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddGoal)}
                placeholder="Ex: Aprender React Avançado, Dominar TypeScript, Desenvolver Portfolio..."
              />
              <IconButton color="primary" onClick={handleAddGoal}>
                <Add />
              </IconButton>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={1}>
              {goals.map((goal, index) => (
                <Chip
                  key={index}
                  label={goal}
                  onDelete={() => handleRemoveGoal(goal)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {goals.length === 0 && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Nenhum objetivo adicionado
                </Typography>
              )}
            </Box>
          </Box>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                🛑 Desafios e Obstáculos
              </Typography>
              <Typography variant="body2" gutterBottom>
                Quais desafios você está enfrentando atualmente?
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  value={newChallenge}
                  onChange={(e) => setNewChallenge(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddChallenge)}
                  placeholder="Ex: Falta de tempo, Procrastinação..."
                />
                <IconButton color="primary" onClick={handleAddChallenge}>
                  <Add />
                </IconButton>
              </Box>

              <Box display="flex" flexWrap="wrap" gap={1}>
                {challenges.map((challenge, index) => (
                  <Chip
                    key={index}
                    label={challenge}
                    onDelete={() => handleRemoveChallenge(challenge)}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                🛠️ Ferramentas e Recursos
              </Typography>
              <Typography variant="body2" gutterBottom>
                Quais ferramentas/tecnologias você quer dominar?
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddTool)}
                  placeholder="Ex: React, TypeScript, Node.js..."
                />
                <IconButton color="primary" onClick={handleAddTool}>
                  <Add />
                </IconButton>
              </Box>

              <Box display="flex" flexWrap="wrap" gap={1}>
                {tools.map((tool, index) => (
                  <Chip
                    key={index}
                    label={tool}
                    onDelete={() => handleRemoveTool(tool)}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⏰ Disponibilidade Semanal
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Quantas horas por semana você pode dedicar aos seus objetivos?
                  </Typography>
                  <TextField
                    type="number"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1, max: 40 } }}
                    sx={{ width: 120 }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {hoursPerWeek} horas/semana = aproximadamente {Math.round(hoursPerWeek * 52 / 24)} dias/ano de dedicação
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Resumo do Seu Plano
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>🎯 Visão de 1 Ano:</strong>
                </Typography>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {vision}
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>🚀 Objetivos ({goals.length}):</strong>
                    </Typography>
                    <ul>
                      {goals.map((goal, index) => (
                        <li key={index}>
                          <Typography variant="body2">{goal}</Typography>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>🛠️ Ferramentas ({tools.length}):</strong>
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {tools.map((tool, index) => (
                        <Chip key={index} label={tool} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 2 }}>
              🎉 A IA vai criar um plano personalizado com:
              <br/>• <strong>3-5 Metas Anuais (HARD)</strong>
              <br/>• <strong>12-20 Metas Mensais (MEDIUM)</strong> 
              <br/>• <strong>48-80 Metas Semanais (EASY)</strong>
              <br/>• <strong>3 Tarefas Diárias</strong> para te guiar até seu objetivo!
            </Alert>
          </Box>
        );
      default:
        return 'Step desconhecida';
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return vision.length >= 20;
      case 1:
        return goals.length >= 2;
      case 2:
        return challenges.length >= 1 && tools.length >= 1;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">🎯 Criar Plano de 1 Ano com IA</Typography>
          <IconButton onClick={onClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0 || loading}
          startIcon={<ArrowBack />}
        >
          Voltar
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleCreatePlan}
            variant="contained"
            disabled={!isStepValid() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            endIcon={!loading && <ArrowForward />}
            sx={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
              fontWeight: 600,
              px: 4,
            }}
          >
            {loading ? 'Criando Plano com IA...' : 'Criar Plano de 1 Ano'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!isStepValid()}
            endIcon={<ArrowForward />}
          >
            Próximo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};