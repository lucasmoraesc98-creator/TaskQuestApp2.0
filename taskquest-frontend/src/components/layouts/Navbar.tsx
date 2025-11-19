import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  Badge,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Bolt,
  Leaderboard,
  Settings,
  Analytics,
  Menu as MenuIcon,
  AutoStories,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/auth.context';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bolt sx={{ 
              fontSize: 32, 
              background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} />
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00D4FF 0%, #667eea 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              TASKQUEST
            </Typography>
          </Box>
        </motion.div>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              {/* Status do usuário */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  icon={<Leaderboard />}
                  label={`Level ${user.level}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={`${user.xp} XP`}
                  color="secondary"
                  size="small"
                />
              </Box>

              {/* Botão de Livros */}
              <Button
                color="inherit"
                startIcon={<AutoStories />}
                onClick={() => handleNavigation('/books')}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Livros
              </Button>

              {/* Botão de Análise */}
              <Button
                color="inherit"
                startIcon={<Analytics />}
                onClick={() => handleNavigation('/analysis')}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Análise
              </Button>

              {/* Notificações */}
              <IconButton color="inherit">
                <Badge badgeContent={3} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* Menu do usuário */}
              <Button
                color="inherit"
                onClick={handleMenu}
                startIcon={
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                }
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                {user.name}
              </Button>
            </Box>

            {/* Menu Mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" onClick={handleMobileMenu}>
                <MenuIcon />
              </IconButton>
              <Chip 
                label={`Lv${user.level}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip 
                label={`${user.xp} XP`}
                color="secondary"
                size="small"
              />
            </Box>
          </motion.div>
        )}

        {/* Menu Desktop */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleNavigation('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </Menu>

        {/* Menu Mobile */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleNavigation('/books')}>
            <ListItemIcon>
              <AutoStories fontSize="small" />
            </ListItemIcon>
            <ListItemText>Livros</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/analysis')}>
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            <ListItemText>Análise</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
