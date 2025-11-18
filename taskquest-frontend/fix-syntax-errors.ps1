Write-Host "🔧 Corrigindo erros de sintaxe..." -ForegroundColor Green

# 1. Corrigir o arquivo RegisterPage
Write-Host "📝 Corrigindo RegisterPage..." -ForegroundColor Yellow
$registerContent = @'
import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import { useNavigate, Link } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom color="primary">
            🎯 TaskQuest
          </Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Criar Conta
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Senha"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Criar Conta'}
            </Button>
            <Box textAlign="center">
              <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="body2" color="primary">
                  Já tem uma conta? Faça login
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
'@

$registerContent | Out-File -FilePath "src/pages/register.page.tsx" -Encoding UTF8

# 2. Corrigir o arquivo de serviço de API
Write-Host "🔌 Corrigindo serviço de API..." -ForegroundColor Yellow
$apiContent = @'
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
'@

$apiContent | Out-File -FilePath "src/services/api.ts" -Encoding UTF8

# 3. Corrigir o arquivo de serviço de tarefas
Write-Host "📋 Corrigindo serviço de tarefas..." -ForegroundColor Yellow
$taskServiceContent = @'
import api from './api';
import { Task, AISuggestion } from '../types/api';

export const taskService = {
  async getTasks(date?: string): Promise<Task[]> {
    const response = await api.get('/tasks', { params: { date } });
    return response.data;
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getAISuggestions(count: number = 3): Promise<AISuggestion[]> {
    const response = await api.post('/ai/suggestions', { count });
    return response.data;
  }
};
'@

$taskServiceContent | Out-File -FilePath "src/services/task.service.ts" -Encoding UTF8

# 4. Remover arquivos duplicados problemáticos
Write-Host "🧹 Removendo arquivos duplicados..." -ForegroundColor Yellow
Remove-Item "src/pages/Register.tsx" -ErrorAction SilentlyContinue
Remove-Item "src/services/taskservice.ts" -ErrorAction SilentlyContinue
Remove-Item "src/services/taskService.ts" -ErrorAction SilentlyContinue

Write-Host "✅ Correções aplicadas!" -ForegroundColor Green
Write-Host "🚀 Execute 'npm start' para testar." -ForegroundColor Magenta