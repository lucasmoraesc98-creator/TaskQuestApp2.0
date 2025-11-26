import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { Dashboard, Settings, Analytics, AutoStories } from '@mui/icons-material';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🚀 TaskQuest
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/dashboard"
              startIcon={<Dashboard />}
              variant={isActive('/dashboard') ? 'outlined' : 'text'}
              sx={{ 
                borderRadius: 2,
                '&.MuiButton-outlined': {
                  borderColor: 'rgba(0,212,255,0.5)',
                  backgroundColor: 'rgba(0,212,255,0.1)'
                }
              }}
            >
              Dashboard
            </Button>

            <Button 
              color="inherit" 
              component={Link} 
              to="/analysis"
              startIcon={<Analytics />}
              variant={isActive('/analysis') ? 'outlined' : 'text'}
              sx={{ 
                borderRadius: 2,
                '&.MuiButton-outlined': {
                  borderColor: 'rgba(0,212,255,0.5)',
                  backgroundColor: 'rgba(0,212,255,0.1)'
                }
              }}
            >
              Análises
            </Button>

            <Button 
              color="inherit" 
              component={Link} 
              to="/books"
              startIcon={<AutoStories />}
              variant={isActive('/books') ? 'outlined' : 'text'}
              sx={{ 
                borderRadius: 2,
                '&.MuiButton-outlined': {
                  borderColor: 'rgba(0,212,255,0.5)',
                  backgroundColor: 'rgba(0,212,255,0.1)'
                }
              }}
            >
              Livros
            </Button>
            
            <Button 
              color="inherit" 
              component={Link} 
              to="/settings"
              startIcon={<Settings />}
              variant={isActive('/settings') ? 'outlined' : 'text'}
              sx={{ 
                borderRadius: 2,
                '&.MuiButton-outlined': {
                  borderColor: 'rgba(0,212,255,0.5)',
                  backgroundColor: 'rgba(0,212,255,0.1)'
                }
              }}
            >
              Configurações
            </Button>
            
            <Button 
              color="inherit" 
              onClick={handleLogout}
              sx={{ borderRadius: 2 }}
            >
              Sair
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;