import React, { useEffect, useState, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { CalendarMonth, ExpandMore, CalendarToday } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import TaskList from '../components/tasks/TaskList';
import XPProgressBar from '../components/progress/XPProgressBar';
import { useQuery } from '@tanstack/react-query';
import { taskService, Task } from '../services/task.service';
import { annualPlanService } from '../services/annual-plan.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [recentXP, setRecentXP] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | false>('daily');

  const { data: tasks, isLoading, refetch: refetchTasks } = useQuery<Task[], Error>({
    queryKey: ['tasks', today],
    queryFn: () => taskService.getTasks(today),
    enabled: !!user,
  });

  const { data: todayStats, refetch: refetchStats } = useQuery({
    queryKey: ['today-stats'],
    queryFn: () => taskService.getTodayStats(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      taskService.initializeBasicTasks();
    }
  }, [user]);

  const checkAnnualPlanStatus = useCallback(async () => {
    try {
      const plan = await annualPlanService.getCurrentPlan();
      if (plan && plan.isConfirmed) {
        console.log('✅ Plano anual ativo - mostrando tarefas do plano');
      }
    } catch (error) {
      console.log('ℹ️ Nenhum plano anual ativo');
    }
  }, []);

  useEffect(() => {
    if (user) {
      refetchTasks();
      refetchStats();
      checkAnnualPlanStatus();
    }
  }, [user, refetchTasks, refetchStats, checkAnnualPlanStatus]);

  const handleTaskCompleted = (xp: number) => {
    setRecentXP(xp);
    setTimeout(() => setRecentXP(0), 3000);
    refetchTasks();
    refetchStats();
  };

  const handleSectionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? section : false);
  };

  if (isLoading) return <Typography>Carregando...</Typography>;

  const extremeTasks = tasks?.filter(task => task.type === 'goal_extreme') || [];
  const hardTasks = tasks?.filter(task => task.type === 'goal_hard') || [];
  const mediumTasks = tasks?.filter(task => task.type === 'goal_medium') || [];
  const easyTasks = tasks?.filter(task => task.type === 'goal_easy') || [];
  const dailyTasks = tasks?.filter(task => task.type === 'goal_daily') || [];
  const basicTasks = tasks?.filter(task => task.type === 'health') || [];
  const reviewTasks = tasks?.filter(task => task.type === 'plan_review') || [];

  // ✅ DEBUG: Verificar se as tarefas de saúde estão sendo carregadas
  console.log('Tarefas de saúde:', basicTasks);
  console.log('Total de tasks:', tasks?.length);
  console.log('Tipos de tasks:', tasks?.map(t => t.type));
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header com Estatísticas */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom fontWeight="700">
          Bem-vindo, {user?.name}! 👋
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <XPProgressBar 
            currentXP={user?.xp || 0} 
            level={user?.level || 1} 
            xpGained={recentXP}
          />
        </Box>

        {todayStats && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={4}>
              <Card sx={{ background: 'rgba(255,255,255,0.9)' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Concluídas
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {todayStats.completed}/{todayStats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{ background: 'rgba(255,255,255,0.9)' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    XP Hoje
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {todayStats.xpEarnedToday}/{todayStats.dailyXPLimit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{ background: 'rgba(255,255,255,0.9)' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Taxa
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {Math.round(todayStats.completionRate)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card de Acesso Rápido - Plano Anual */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
            onClick={() => navigate('/annual-plan')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'white', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Plano Anual com IA
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Crie seu plano personalizado de 365 dias com metas EXTREME, HARD, MEDIUM e EASY
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 1,
                  bgcolor: 'white',
                  color: '#667eea',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  }
                }}
                startIcon={<CalendarMonth />}
              >
                Criar Meu Plano
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas de Progresso */}
      {todayStats && todayStats.xpEarnedToday >= 400 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          🎉 Parabéns! Você atingiu o limite diário de XP! Volte amanhã para mais conquistas!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Coluna Principal - Tarefas */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              🎯 Suas 3 Tarefas Prioritárias de Hoje
            </Typography>
            
            {/* Daily Tasks do Plano */}
            <Accordion 
              expanded={expandedSection === 'daily'} 
              onChange={handleSectionChange('daily')}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    📅 Daily Tasks do Plano (100XP cada)
                  </Typography>
                  <Chip 
                    label={`${dailyTasks.length}/3`} 
                    color={dailyTasks.length === 3 ? "success" : "warning"} 
                    size="small" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {dailyTasks.length === 0 ? (
                  <Alert severity="info">
                    Nenhuma tarefa diária encontrada. Confirme seu plano anual para gerar tarefas.
                  </Alert>
                ) : (
                  <TaskList 
                    tasks={dailyTasks} 
                    onTaskCompleted={handleTaskCompleted}
                  />
                )}
              </AccordionDetails>
            </Accordion>

            {/* ✅ CORREÇÃO: Tarefas de Saúde - SEMPRE MOSTRAR, mesmo se vazias */}
            <Accordion 
              expanded={expandedSection === 'health'} 
              onChange={handleSectionChange('health')}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    🏥 Tarefas de Saúde (20XP cada)
                  </Typography>
                  <Chip 
                    label={`${basicTasks.length}/5`} 
                    color={basicTasks.length === 5 ? "success" : "warning"} 
                    size="small" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {basicTasks.length === 0 ? (
                  <Alert severity="info">
                    Nenhuma tarefa de saúde encontrada. Elas são criadas automaticamente a cada dia.
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 1, ml: 2 }}
                      onClick={() => taskService.initializeBasicTasks()}
                    >
                      Criar Tarefas de Saúde Agora
                    </Button>
                  </Alert>
                ) : (
                  <TaskList 
                    tasks={basicTasks} 
                    onTaskCompleted={handleTaskCompleted}
                  />
                )}
              </AccordionDetails>
            </Accordion>

            {/* ✅ CORREÇÃO: Visão Geral do Plano - Texto com cor visível e hierarquia completa */}
            <Accordion 
              expanded={expandedSection === 'overview'} 
              onChange={handleSectionChange('overview')}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ color: 'text.primary' }}>
                    📊 Visão Geral do Plano - Trimestre Atual
                  </Typography>
                  <Chip label="Leitura" color="info" size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Metas EXTREME (Anuais) */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🌠 Metas EXTREME (Anuais)
                  </Typography>
                  {extremeTasks.length > 0 ? (
                    extremeTasks.map(task => (
                      <Box key={task._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                        <Typography variant="subtitle1" sx={{ color: '#000000', fontWeight: 'bold' }}>
                          {task.text}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            {task.description}
                          </Typography>
                        )}
                        {task.aiData?.deadline && (
                          <Chip 
                            icon={<CalendarToday />}
                            label={`Prazo: ${new Date(task.aiData.deadline).toLocaleDateString('pt-BR')}`}
                            size="small"
                            color="error"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Nenhuma meta EXTREME ativa
                    </Typography>
                  )}
                </Box>

                {/* Metas HARD (Trimestrais) */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏆 Metas HARD (Trimestrais)
                  </Typography>
                  {hardTasks.length > 0 ? (
                    hardTasks.map(task => (
                      <Box key={task._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                        <Typography variant="subtitle1" sx={{ color: '#000000', fontWeight: 'bold' }}>
                          {task.text}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            {task.description}
                          </Typography>
                        )}
                        {task.aiData?.deadline && (
                          <Chip 
                            icon={<CalendarToday />}
                            label={`Prazo trimestral: ${new Date(task.aiData.deadline).toLocaleDateString('pt-BR')}`}
                            size="small"
                            color="warning"
                            sx={{ mt: 1 }}
                          />
                        )}
                        
                        {/* ✅ NOVO: Metas MEDIUM derivadas desta HARD */}
                        {mediumTasks.filter(mediumTask => 
                          mediumTask.aiData?.hardGoalId === task._id.replace('hard-', '')
                        ).length > 0 && (
                          <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'info.main' }}>
                            <Typography variant="subtitle2" sx={{ color: 'info.main', mb: 1 }}>
                              📋 Metas MEDIUM deste objetivo:
                            </Typography>
                            {mediumTasks
                              .filter(mediumTask => mediumTask.aiData?.hardGoalId === task._id.replace('hard-', ''))
                              .map(mediumTask => (
                                <Box key={mediumTask._id} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                                  <Typography variant="body2" sx={{ color: '#000000' }}>
                                    {mediumTask.text}
                                  </Typography>
                                  {mediumTask.aiData?.deadline && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      Prazo: {new Date(mediumTask.aiData.deadline).toLocaleDateString('pt-BR')}
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            }
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Nenhuma meta HARD para este trimestre
                    </Typography>
                  )}
                </Box>

                {/* Metas MEDIUM (Mensais) */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎯 Metas MEDIUM (Mensais)
                  </Typography>
                  {mediumTasks.length > 0 ? (
                    mediumTasks.map(task => (
                      <Box key={task._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                        <Typography variant="subtitle1" sx={{ color: '#000000', fontWeight: 'bold' }}>
                          {task.text}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            {task.description}
                          </Typography>
                        )}
                        {task.aiData?.deadline && (
                          <Chip 
                            icon={<CalendarToday />}
                            label={`Prazo mensal: ${new Date(task.aiData.deadline).toLocaleDateString('pt-BR')}`}
                            size="small"
                            color="info"
                            sx={{ mt: 1 }}
                          />
                        )}
                        
                        {/* ✅ NOVO: Metas EASY derivadas desta MEDIUM */}
                        {easyTasks.filter(easyTask => 
                          easyTask.aiData?.mediumGoalId === task._id.replace('medium-', '')
                        ).length > 0 && (
                          <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'success.main' }}>
                            <Typography variant="subtitle2" sx={{ color: 'success.main', mb: 1 }}>
                              📝 Metas EASY deste objetivo:
                            </Typography>
                            {easyTasks
                              .filter(easyTask => easyTask.aiData?.mediumGoalId === task._id.replace('medium-', ''))
                              .map(easyTask => (
                                <Box key={easyTask._id} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                                  <Typography variant="body2" sx={{ color: '#000000' }}>
                                    {easyTask.text}
                                  </Typography>
                                  {easyTask.aiData?.deadline && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      Prazo: {new Date(easyTask.aiData.deadline).toLocaleDateString('pt-BR')}
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            }
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Nenhuma meta MEDIUM para este mês
                    </Typography>
                  )}
                </Box>

                {/* Metas EASY (Semanais) */}
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Metas EASY (Semanais)
                  </Typography>
                  {easyTasks.length > 0 ? (
                    easyTasks.map(task => (
                      <Box key={task._id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {/* ✅ CORREÇÃO: Texto em preto para melhor contraste */}
                        <Typography variant="body2" sx={{ color: '#000000' }}>
                          {task.text}
                        </Typography>
                        {task.aiData?.deadline && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Prazo: {new Date(task.aiData.deadline).toLocaleDateString('pt-BR')}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Nenhuma meta EASY para esta semana
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>

        {/* Sidebar - Progresso do Trimestre */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Progresso do Trimestre
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Foque nas 3 tarefas diárias para avançar no seu plano.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;