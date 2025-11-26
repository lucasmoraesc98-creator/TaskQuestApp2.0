import React from 'react';
import {
  Box,
  Paper,
  Typography
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface ProgressAnalysis {
  weeklyProgress: { date: string; completed: number; xp: number }[];
  categoryBreakdown: { type: string; count: number; xp: number }[];
  timeAnalysis: { hour: number; productivity: number }[];
}

interface ProgressChartsProps {
  analysis: ProgressAnalysis;
}

const COLORS = ['#00D4FF', '#FF6B35', '#667eea', '#4CAF50', '#FFC107'];

const ProgressCharts: React.FC<ProgressChartsProps> = ({ analysis }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Gráfico de Progresso Semanal */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📈 Progresso Semanal
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analysis.weeklyProgress}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#00D4FF" 
              name="Tarefas Concluídas"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="xp" 
              stroke="#FF6B35" 
              name="XP Ganho"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Distribuição por Categoria */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Distribuição por Categoria
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analysis.categoryBreakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, percent }: { type: string; percent: number }) => `${type} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {analysis.categoryBreakdown.map((entry: { type: string; count: number; xp: number }, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* XP por Categoria */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          💰 XP por Categoria
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysis.categoryBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="xp" fill="#00D4FF" name="XP Total" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default ProgressCharts;