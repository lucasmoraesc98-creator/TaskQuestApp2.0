import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Paper,
  Modal,
  TextField,
  Snackbar
} from '@mui/material';
import { 
  PlayArrow, 
  Check, 
  Edit, 
  Build 
} from '@mui/icons-material';
import { useAuth } from '../contexts/auth.context';
import ResetPlanButton from '../components/goals/ResetPlanButton';
import { AnnualPlan, annualPlanService, CreatePlanData } from '../services/annual-plan.service';
import ResetAccountButton from '../components/reset/REsetAccountButton';
import Navbar from '../components/layouts/Navbar';

const AnnualPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<AnnualPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ✅ CORREÇÃO: Adicione este useEffect para debug com tratamento adequado de erro
  useEffect(() => {
    const debugCurrentPlan = async () => {
      try {
        const plan = await annualPlanService.getCurrentPlan();
        console.log('🔍 DEBUG - Plano atual:', {
          id: plan?._id,
          isActive: plan?.isActive,
          isConfirmed: plan?.isConfirmed,
          extremeGoals: plan?.extremeGoals?.length,
          hardGoals: plan?.hardGoals?.length,
          mediumGoals: plan?.mediumGoals?.length,
          easyGoals: plan?.easyGoals?.length,
        });
      } catch (error) {
        // ✅ CORREÇÃO: Tratamento adequado para erro do tipo 'unknown'
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.log('🔍 DEBUG - Nenhum plano encontrado ou erro:', errorMessage);
      }
    };

    debugCurrentPlan();
  }, []);

  // ✅ FUNÇÃO: Handle reset do plano
  const handlePlanReset = () => {
    setCurrentPlan(null);
    setActiveStep(0);
    setError(null);
    
    // Mostrar mensagem de sucesso
    if (typeof window !== 'undefined') {
      alert('Plano anual resetado com sucesso! Você pode criar um novo plano agora.');
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: Abrir modal de feedback
  const handleOpenFeedbackModal = () => {
    if (!currentPlan) {
      setError('Nenhum plano encontrado. Crie um plano anual primeiro.');
      return;
    }
    
    if (!currentPlan._id) {
      setError('Plano inválido. Recarregue a página e tente novamente.');
      return;
    }
    
    setFeedbackModalOpen(true);
  };

  // ✅ FUNÇÃO: Fechar modal de feedback
  const handleCloseFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setFeedback('');
  };

  // ✅ FUNÇÃO CORRIGIDA: Enviar feedback e ajustar plano com tratamento adequado de erro
  const handleAdjustPlan = async () => {
    if (!feedback.trim()) {
      setError('Por favor, forneça um feedback para ajustar o plano.');
      return;
    }

    try {
      setAdjusting(true);
      setError(null);

      // ✅ CORREÇÃO: Usar adjustCurrentPlan que não requer planId
      const adjustedPlan = await annualPlanService.adjustCurrentPlan({
        feedback,
        userContext: '',
        specificIssues: []
      });

      // ✅ CORREÇÃO: Atualizar o plano atual
      setCurrentPlan(adjustedPlan);
      setSnackbarMessage('Plano ajustado com sucesso!');
      setSnackbarOpen(true);
      handleCloseFeedbackModal();
    } catch (error: unknown) {
      console.error('❌ Erro ao ajustar plano:', error);
      
      // ✅ CORREÇÃO: Tratamento adequado para erro do tipo 'unknown'
      let errorMessage = 'Erro ao ajustar plano';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      
      // ✅ CORREÇÃO: Mensagem de erro mais específica
      if (errorMessage.includes('Plano não encontrado')) {
        setError('Nenhum plano encontrado. Crie um plano anual primeiro antes de ajustar.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setAdjusting(false);
    }
  };

  const steps = [
    'Preparação',
    'Geração do Plano',
    'Revisão e Confirmação',
    'Plano Ativo'
  ];

  const generatePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const planData: CreatePlanData = {
        vision: user?.vision || 'Não definido',
        goals: user?.goals || [],
        challenges: user?.challenges || [],
        tools: user?.tools || [],
        hoursPerWeek: user?.hoursPerWeek || 10
      };

      const plan = await annualPlanService.generateAnnualPlan(planData);
      setCurrentPlan(plan);
      setActiveStep(2);
    } catch (error: unknown) {
      console.error('❌ Erro ao gerar plano:', error);
      
      // ✅ CORREÇÃO: Tratamento adequado para erro do tipo 'unknown'
      let errorMessage = 'Erro ao gerar plano anual';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const confirmPlan = async () => {
    try {
      setConfirming(true);
      setError(null);
      
      const confirmedPlan = await annualPlanService.confirmPlan();
      setCurrentPlan(confirmedPlan);
      setActiveStep(3);
    } catch (error: unknown) {
      console.error('❌ Erro ao confirmar plano:', error);
      
      // ✅ CORREÇÃO: Tratamento adequado para erro do tipo 'unknown'
      let errorMessage = 'Erro ao confirmar plano';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  // ✅ CORREÇÃO: Verificar se já existe um plano ativo com tratamento adequado de erro
  useEffect(() => {
    const checkCurrentPlan = async () => {
      try {
        const plan = await annualPlanService.getCurrentPlan();
        if (plan && plan.isActive) {
          setCurrentPlan(plan);
          setActiveStep(3); // Ir direto para o passo "Plano Ativo"
        } else if (plan && !plan.isActive) {
          setCurrentPlan(plan);
          setActiveStep(2); // Ir para "Revisão e Confirmação"
        }
      } catch (error) {
        // Não tem plano ativo, manter no passo 0
        console.log('Nenhum plano ativo encontrado');
      }
    };

    checkCurrentPlan();
  }, []);

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          📅 Plano Anual com IA
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Crie seu plano estratégico de 365 dias com metas EXTREME, HARD, MEDIUM e EASY
        </Typography>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Conteúdo baseado no passo atual */}
        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom color="primary">
                  🎯 Preparação do Plano Anual
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Antes de gerar seu plano anual, verifique se suas informações estão completas:
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Visão: {user?.vision ? '✅' : '❌'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user?.vision || 'Não definida'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Objetivos: {user?.goals?.length ? `✅ (${user.goals.length})` : '❌'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user?.goals?.join(', ') || 'Nenhum objetivo definido'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={generatePlan}
                  disabled={generating || !user?.vision || !user?.goals?.length}
                  sx={{ minWidth: '200px' }}
                >
                  {generating ? 'Gerando Plano...' : 'Gerar Plano Anual com IA'}
                </Button>

                {(!user?.vision || !user?.goals?.length) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Complete sua visão e objetivos nas configurações antes de gerar o plano.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && currentPlan && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" color="primary">
                    📋 Plano Gerado - Revisão
                  </Typography>
                  <Chip 
                    label="Aguardando Confirmação" 
                    color="warning" 
                    variant="outlined" 
                  />
                </Box>

                {/* Resumo do plano */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Visão: {currentPlan.vision}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {currentPlan.strategicAnalysis || 'Análise estratégica gerada pela IA...'}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                        <Typography variant="h6">🌠 EXTREME</Typography>
                        <Typography variant="h4">{currentPlan.extremeGoals?.length || 0}</Typography>
                        <Typography variant="body2">Objetivos Principais</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                        <Typography variant="h6">🏆 HARD</Typography>
                        <Typography variant="h4">{currentPlan.hardGoals?.length || 0}</Typography>
                        <Typography variant="body2">Metas Anuais</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                        <Typography variant="h6">🎯 MEDIUM</Typography>
                        <Typography variant="h4">{currentPlan.mediumGoals?.length || 0}</Typography>
                        <Typography variant="body2">Metas Trimestrais</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                        <Typography variant="h6">📝 EASY</Typography>
                        <Typography variant="h4">{currentPlan.easyGoals?.length || 0}</Typography>
                        <Typography variant="body2">Metas Semanais</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setActiveStep(0)}
                  >
                    Editar Informações
                  </Button>
                  
                  {/* ✅ BOTÃO PARA AJUSTAR PLANO */}
                  <Button
                    variant="outlined"
                    startIcon={<Build />}
                    onClick={handleOpenFeedbackModal}
                  >
                    Ajustar Plano
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<Check />}
                    onClick={confirmPlan}
                    disabled={confirming}
                    sx={{ minWidth: '200px' }}
                  >
                    {confirming ? 'Confirmando...' : 'Confirmar Plano Anual'}
                  </Button>

                  <ResetPlanButton onPlanReset={handlePlanReset} />
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 3 && currentPlan && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" color="primary">
                    🎉 Plano Anual Ativo!
                  </Typography>
                  <Chip 
                    label="Plano Confirmado" 
                    color="success" 
                    variant="filled" 
                  />
                </Box>

                <Alert severity="success" sx={{ mb: 3 }}>
                  Seu plano anual foi confirmado com sucesso! As tarefas diárias já estão disponíveis no Dashboard.
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Resumo do Plano Ativo:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Visão:</strong> {currentPlan.vision}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seu plano está agora ativo e gerando tarefas diárias automaticamente no Dashboard.
                    </Typography>

                    {/* ✅ BOTÃO PARA AJUSTAR PLANO NO PLANO ATIVO */}
                    <Button
                      variant="outlined"
                      startIcon={<Build />}
                      onClick={handleOpenFeedbackModal}
                      sx={{ mt: 2 }}
                    >
                      Ajustar Plano
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Estatísticas
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                        <Box>
                          <Typography variant="h4" color="primary">
                            {currentPlan.hardGoals?.length || 0}
                          </Typography>
                          <Typography variant="body2">Metas HARD</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h4" color="secondary">
                            {currentPlan.dailyTasks?.length || 0}
                          </Typography>
                          <Typography variant="body2">Tarefas Diárias</Typography>
                        </Box>
                      </Box>
                      
                      <ResetAccountButton 
                        onAccountReset={handlePlanReset}
                        variant="outlined"
                        size="medium"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* ✅ MODAL DE FEEDBACK */}
        <Modal
          open={feedbackModalOpen}
          onClose={handleCloseFeedbackModal}
          aria-labelledby="feedback-modal-title"
          aria-describedby="feedback-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            maxWidth: '90vw',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}>
            <Typography id="feedback-modal-title" variant="h6" component="h2" gutterBottom>
              🔧 Ajustar Plano Anual
            </Typography>
            <Typography id="feedback-modal-description" variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Encontrou algo que precisa ser corrigido? Descreva abaixo e a IA vai ajustar seu plano mantendo a estrutura.
            </Typography>
            
            <TextField
              label="Feedback"
              placeholder="Ex: As metas de fitness estão focadas em perda de peso, mas eu preciso ganhar massa muscular. Tenho 69kg e 15% BF, preciso ganhar massa, não perder."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              fullWidth
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseFeedbackModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAdjustPlan} 
                variant="contained" 
                disabled={adjusting || !feedback.trim()}
                startIcon={<Build />}
              >
                {adjusting ? 'Ajustando...' : 'Ajustar Plano'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* ✅ SNACKBAR PARA FEEDBACK */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    </>
  );
};

export default AnnualPlanPage;