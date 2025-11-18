// src/components/progress/XPProgressBar.tsx - VERSÃO CORRIGIDA
import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  xpGained?: number;
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({ currentXP, level, xpGained }) => {
  const calculateXPProgress = () => {
    const baseXP = 1000 + ((level - 1) * 100);
    return (currentXP / baseXP) * 100;
  };

  const getXPForNextLevel = () => {
    return 1000 + ((level - 1) * 100);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" fontWeight="600">
          Level {level}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentXP} / {getXPForNextLevel()} XP
        </Typography>
      </Box>

      <Tooltip title={`${currentXP} XP de ${getXPForNextLevel()} XP necessários para o próximo nível`}>
        <Box sx={{ position: 'relative' }}>
          <LinearProgress 
            variant="determinate" 
            value={calculateXPProgress()} 
            sx={{ 
              height: 12, 
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #00D4FF 0%, #667eea 50%, #FF6B35 100%)',
                borderRadius: 6,
                transition: 'all 0.5s ease-in-out',
              }
            }}
          />
          
          {/* Animação de XP Ganho */}
          <AnimatePresence>
            {xpGained && xpGained > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -40 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: -25,
                }}
              >
                <Typography 
                  variant="caption" 
                  fontWeight="800"
                  sx={{
                    background: 'linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  +{xpGained} XP!
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Tooltip>

      {/* Próximas Recompensas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {getXPForNextLevel() - currentXP} XP para o Level {level + 1}
        </Typography>
      </Box>
    </Box>
  );
};

export default XPProgressBar;