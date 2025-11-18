Write-Host "🚀 INICIANDO CORREÇÃO COMPLETA DO FRONTEND..." -ForegroundColor Green

# 1. Parar qualquer processo do React
Write-Host "🛑 Parando processos do React..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

# 2. Fazer backup da pasta src atual
Write-Host "📦 Fazendo backup da pasta src..." -ForegroundColor Yellow
if (Test-Path "src-backup") {
    Remove-Item "src-backup" -Recurse -Force
}
Copy-Item "src" "src-backup" -Recurse -Force

# 3. Remover a pasta src atual
Write-Host "🧹 Limpando estrutura atual..." -ForegroundColor Yellow
Remove-Item "src" -Recurse -Force

# 4. Criar nova estrutura de pastas
Write-Host "📁 Criando nova estrutura organizada..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src" -Force
New-Item -ItemType Directory -Path "src/components" -Force
New-Item -ItemType Directory -Path "src/components/layout" -Force
New-Item -ItemType Directory -Path "src/components/tasks" -Force
New-Item -ItemType Directory -Path "src/pages" -Force
New-Item -ItemType Directory -Path "src/services" -Force
New-Item -ItemType Directory -Path "src/contexts" -Force
New-Item -ItemType Directory -Path "src/types" -Force
New-Item -ItemType Directory -Path "src/hooks" -Force
New-Item -ItemType Directory -Path "src/utils" -Force

Write-Host "✅ Estrutura criada! Agora criando arquivos corrigidos..." -ForegroundColor Green

# 5. Criar todos os arquivos corrigidos
# Vamos criar cada arquivo individualmente com o conteúdo correto

# types/api.ts
@"
export interface User {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  goals: string[];
  challenges: string[];
  preferences: {
    morningPerson: boolean;
    likesExercise: boolean;
    worksFromHome: boolean;
  };
  productivityStyle: string;
  lastActive?: string;
  lastAnalysis?: string;
}

export interface Task {
  _id: string;
  userId: string;
  text: string;
  completed: boolean;
  xp: number;
  type: string;
  reason?: string;
  date: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  goals?: string[];
  challenges?: string[];
}

export interface AISuggestion {
  text: string;
  xp: number;
  type: string;
  reason: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
"@ | Out-File -FilePath "src/types/api.ts" -Encoding UTF8

# services/api.ts
@"
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
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
"@ | Out-File -FilePath "src/services/api.ts" -Encoding UTF8

# services/auth.service.ts
@"
import api from './api';
import { LoginData, RegisterData, User } from '../types/api';

export const authService = {
  async login(loginData: LoginData) {
    const response = await api.post('/auth/login', loginData);
    return response.data;
  },

  async register(registerData: RegisterData) {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
"@ | Out-File -FilePath "src/services/auth.service.ts" -Encoding UTF8

# services/task.service.ts
@"
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
    const response = await api.put(\`/tasks/\${id}\`, taskData);
    return response.data;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await api.put(\`/tasks/\${id}/complete\`);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(\`/tasks/\${id}\`);
  },

  async getAISuggestions(count: number = 3): Promise<AISuggestion[]> {
    const response = await api.post('/ai/suggestions', { count });
    return response.data;
  }
};
"@ | Out-File -FilePath "src/services/task.service.ts" -Encoding UTF8

# contexts/auth.context.tsx
@"
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types/api';

interface AuthContextData {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verificar se o token ainda é válido
      authService.getProfile().catch(() => {
        logout();
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({ name, email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
"@ | Out-File -FilePath "src/contexts/auth.context.tsx" -Encoding UTF8

# components/layout/navbar.component.tsx
@"
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../contexts/auth.context';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar position=\"static\" elevation={2}>
      <Toolbar>
        <Typography variant=\"h6\" component=\"div\" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🎯 TaskQuest
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant=\"body2\">
              Level {user.level} • {user.xp} XP
            </Typography>
            <Button
              color=\"inherit\"
              onClick={handleMenu}
              startIcon={
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              }
            >
              {user.name}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
"@ | Out-File -FilePath "src/components/layout/navbar.component.tsx" -Encoding UTF8

# components/tasks/task-list.component.tsx
@"
import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Box,
  Typography,
  Fab,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';
import { Task } from '../../types/api';

interface TaskListProps {
  date: string;
}

export const TaskList: React.FC<TaskListProps> = ({ date }) => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery(
    ['tasks', date],
    () => taskService.getTasks(date),
    { enabled: !!date }
  );

  const completeMutation = useMutation(
    (taskId: string) => taskService.completeTask(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', date]);
      },
    }
  );

  const deleteMutation = useMutation(
    (taskId: string) => taskService.deleteTask(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', date]);
      },
    }
  );

  const handleToggle = (task: Task) => {
    if (!task.completed) {
      completeMutation.mutate(task._id);
    }
  };

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId);
  };

  if (isLoading) {
    return <Typography>Carregando tarefas...</Typography>;
  }

  return (
    <Box>
      <List>
        {tasks?.map((task) => (
          <ListItem
            key={task._id}
            secondaryAction={
              <Box>
                <Checkbox
                  edge=\"end\"
                  onChange={() => handleToggle(task)}
                  checked={task.completed}
                  disabled={task.completed}
                />
                <IconButton
                  edge=\"end\"
                  onClick={() => handleDelete(task._id)}
                  color=\"error\"
                >
                  <Delete />
                </IconButton>
              </Box>
            }
            sx={{
              backgroundColor: task.completed ? 'action.hover' : 'background.paper',
              borderRadius: 1,
              mb: 1,
              textDecoration: task.completed ? 'line-through' : 'none',
            }}
          >
            <ListItemText
              primary={task.text}
              secondary={
                <Box>
                  <Typography variant=\"body2\" color=\"primary\">
                    +{task.xp} XP • {task.type}
                  </Typography>
                  {task.reason && (
                    <Typography variant=\"caption\" color=\"text.secondary\">
                      {task.reason}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {(!tasks || tasks.length === 0) && (
        <Typography textAlign=\"center\" color=\"text.secondary\" sx={{ py: 4 }}>
          Nenhuma tarefa para hoje. Que tal adicionar algumas?
        </Typography>
      )}

      <Fab
        color=\"primary\"
        aria-label=\"add\"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        // onClick={() => setOpenAddTask(true)} - Você pode implementar um modal para adicionar tarefas
      >
        <Add />
      </Fab>
    </Box>
  );
};
"@ | Out-File -FilePath "src/components/tasks/task-list.component.tsx" -Encoding UTF8

# components/tasks/ai-suggestions.component.tsx
@"
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';
import { AISuggestion as AISuggestionType } from '../../types/api';

export const AISuggestions: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, refetch } = useQuery(
    ['ai-suggestions'],
    () => taskService.getAISuggestions(3),
    { enabled: false } // Não carrega automaticamente
  );

  const addTaskMutation = useMutation(
    (suggestion: AISuggestionType) => 
      taskService.createTask({
        text: suggestion.text,
        xp: suggestion.xp,
        type: suggestion.type,
        date: new Date().toISOString().split('T')[0],
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
      },
    }
  );

  const handleAddTask = (suggestion: AISuggestionType) => {
    addTaskMutation.mutate(suggestion);
  };

  const handleGenerateSuggestions = () => {
    refetch();
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display=\"flex\" alignItems=\"center\" gap={1} mb={2}>
          <AutoAwesome color=\"primary\" />
          <Typography variant=\"h6\">Sugestões de IA</Typography>
        </Box>

        {!suggestions && !isLoading && (
          <Button
            fullWidth
            variant=\"outlined\"
            onClick={handleGenerateSuggestions}
            startIcon={<AutoAwesome />}
          >
            Gerar Sugestões
          </Button>
        )}

        {isLoading && (
          <Box textAlign=\"center\" py={2}>
            <CircularProgress />
            <Typography variant=\"body2\" color=\"text.secondary\" mt={1}>
              Gerando sugestões personalizadas...
            </Typography>
          </Box>
        )}

        {suggestions?.map((suggestion: AISuggestionType, index: number) => (
          <Box
            key={index}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant=\"body1\" gutterBottom>
              {suggestion.text}
            </Typography>
            <Box display=\"flex\" justifyContent=\"space-between\" alignItems=\"center\" mt={1}>
              <Chip
                label={\`+\${suggestion.xp} XP\`}
                color=\"primary\"
                size=\"small\"
              />
              <Button
                size=\"small\"
                variant=\"contained\"
                onClick={() => handleAddTask(suggestion)}
                disabled={addTaskMutation.isLoading}
              >
                Adicionar
              </Button>
            </Box>
            <Typography variant=\"caption\" color=\"text.secondary\" display=\"block\" mt={1}>
              {suggestion.reason}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};
"@ | Out-File -FilePath "src/components/tasks/ai-suggestions.component.tsx" -Encoding UTF8

# pages/login.page.tsx
@"
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

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component=\"main\" maxWidth=\"xs\">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component=\"h1\" variant=\"h4\" align=\"center\" gutterBottom color=\"primary\">
            🎯 TaskQuest
          </Typography>
          <Typography component=\"h2\" variant=\"h5\" align=\"center\" gutterBottom>
            Login
          </Typography>

          {error && <Alert severity=\"error\" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component=\"form\" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin=\"normal\"
              required
              fullWidth
              id=\"email\"
              label=\"Email\"
              name=\"email\"
              autoComplete=\"email\"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin=\"normal\"
              required
              fullWidth
              name=\"password\"
              label=\"Senha\"
              type=\"password\"
              id=\"password\"
              autoComplete=\"current-password\"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type=\"submit\"
              fullWidth
              variant=\"contained\"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Entrar'}
            </Button>
            <Box textAlign=\"center\">
              <Link to=\"/register\" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant=\"body2\" color=\"primary\">
                  Não tem uma conta? Cadastre-se
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
"@ | Out-File -FilePath "src/pages/login.page.tsx" -Encoding UTF8

# pages/register.page.tsx
@"
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
    <Container component=\"main\" maxWidth=\"xs\">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component=\"h1\" variant=\"h4\" align=\"center\" gutterBottom color=\"primary\">
            🎯 TaskQuest
          </Typography>
          <Typography component=\"h2\" variant=\"h5\" align=\"center\" gutterBottom>
            Criar Conta
          </Typography>

          {error && <Alert severity=\"error\" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component=\"form\" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin=\"normal\"
              required
              fullWidth
              id=\"name\"
              label=\"Nome completo\"
              name=\"name\"
              autoComplete=\"name\"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin=\"normal\"
              required
              fullWidth
              id=\"email\"
              label=\"Email\"
              name=\"email\"
              autoComplete=\"email\"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin=\"normal\"
              required
              fullWidth
              name=\"password\"
              label=\"Senha\"
              type=\"password\"
              id=\"password\"
              autoComplete=\"new-password\"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin=\"normal\"
              required
              fullWidth
              name=\"confirmPassword\"
              label=\"Confirmar Senha\"
              type=\"password\"
              id=\"confirmPassword\"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <Button
              type=\"submit\"
              fullWidth
              variant=\"contained\"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Criar Conta'}
            </Button>
            <Box textAlign=\"center\">
              <Link to=\"/login\" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant=\"body2\" color=\"primary\">
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
"@ | Out-File -FilePath "src/pages/register.page.tsx" -Encoding UTF8

# pages/dashboard.page.tsx
@"
import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import { TaskList } from '../components/tasks/task-list.component';
import { AISuggestions } from '../components/tasks/ai-suggestions.component';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const calculateXPProgress = () => {
    if (!user) return 0;
    const baseXP = 1000 + ((user.level - 1) * 100);
    return (user.xp / baseXP) * 100;
  };

  return (
    <Container maxWidth=\"lg\" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Typography variant=\"h4\" gutterBottom color=\"white\">
              Bem-vindo, {user?.name}! 👋
            </Typography>
            <Typography variant=\"h6\" color=\"white\" gutterBottom>
              Level {user?.level} • {user?.xp} XP
            </Typography>
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress 
                variant=\"determinate\" 
                value={calculateXPProgress()} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Tasks */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant=\"h5\" gutterBottom>
                📝 Suas Tarefas de Hoje
              </Typography>
              <TaskList date={selectedDate} />
            </CardContent>
          </Card>
        </Grid>

        {/* AI Suggestions */}
        <Grid item xs={12} md={4}>
          <AISuggestions />
        </Grid>
      </Grid>
    </Container>
  );
};
"@ | Out-File -FilePath "src/pages/dashboard.page.tsx" -Encoding UTF8

# App.tsx - Arquivo principal
@"
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider, useAuth } from './contexts/auth.context';
import { Navbar } from './components/layout/navbar.component';
import { LoginPage } from './pages/login.page';
import { RegisterPage } from './pages/register.page';
import { DashboardPage } from './pages/dashboard.page';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '\"Inter\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to=\"/login\" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return !user ? <>{children}</> : <Navigate to=\"/dashboard\" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <div className=\"App\">
              <Navbar />
              <Routes>
                <Route path=\"/login\" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path=\"/register\" element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } />
                <Route path=\"/dashboard\" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path=\"/\" element={<Navigate to=\"/dashboard\" />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
"@ | Out-File -FilePath "src/App.tsx" -Encoding UTF8

# index.tsx
@"
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@ | Out-File -FilePath "src/index.tsx" -Encoding UTF8

# index.css
@"
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
"@ | Out-File -FilePath "src/index.css" -Encoding UTF8

Write-Host "✅ TODOS OS ARQUIVOS CRIADOS!" -ForegroundColor Green

# 6. Instalar dependências necessárias
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install @tanstack/react-query @mui/material @emotion/react @emotion/styled @mui/icons-material axios react-router-dom @types/react @types/react-dom

Write-Host "🎉 CORREÇÃO COMPLETA CONCLUÍDA!" -ForegroundColor Green
Write-Host "🚀 Execute 'npm start' para testar o projeto" -ForegroundColor Magenta
Write-Host "📁 Backup da pasta original salvo em: src-backup" -ForegroundColor Cyan