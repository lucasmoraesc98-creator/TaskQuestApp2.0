import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { AutoStories } from '@mui/icons-material';
import BookSuggestions from '../components/books/BookSuggestions';

const Books: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <AutoStories color="primary" />
          <Typography variant="h4" fontWeight="600">
            Recomendações de Livros
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Descubra livros que vão te ajudar a alcançar seus objetivos e melhorar sua produtividade.
        </Typography>
      </Paper>

      <BookSuggestions />
    </Container>
  );
};

export default Books;