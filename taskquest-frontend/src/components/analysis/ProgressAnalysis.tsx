import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const ProgressAnalysis: React.FC = () => {
  // Dados de exemplo - substituir com dados reais do backend
  const data = {
    labels: ['Produtividade', 'Conclusão', 'Qualidade', 'Consistência', 'Inovação'],
    datasets: [
      {
        label: 'Seu Progresso',
        data: [85, 70, 90, 65, 80],
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: 'rgba(0, 212, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(0, 212, 255, 1)',
      },
      {
        label: 'Média dos Usuários',
        data: [70, 65, 75, 60, 70],
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        borderColor: 'rgba(255, 107, 53, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 107, 53, 1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Análise de Progresso
        </Typography>
        <Box sx={{ height: 400 }}>
          <Radar data={data} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProgressAnalysis;
