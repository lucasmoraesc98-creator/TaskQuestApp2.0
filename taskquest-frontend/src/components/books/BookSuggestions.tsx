// src/components/books/BookSuggestions.tsx - VERSÃO CORRIGIDA
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  TextField,
  Grid,
  Rating,
  Alert,
} from '@mui/material';
import { AutoStories, Search, Download } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    infoLink: string;
  };
}

const BookSuggestions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('productivity personal development');
  const [currentQuery, setCurrentQuery] = useState('productivity personal development');

  const { data: books, isLoading, error, refetch } = useQuery({
    queryKey: ['books', currentQuery],
    queryFn: async () => {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(currentQuery)}&maxResults=6&orderBy=relevance`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar livros');
      }
      
      const data = await response.json();
      return data.items as Book[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentQuery(searchQuery);
  };

  const productivityCategories = [
    'Productivity',
    'Personal Development', 
    'Time Management',
    'Self Improvement',
    'Business',
    'Psychology',
    'Motivational'
  ];

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <AutoStories color="primary" />
          <Typography variant="h6" fontWeight="600">
            Sugestões de Livros
          </Typography>
        </Box>

        {/* Busca */}
        <form onSubmit={handleSearch}>
          <Box display="flex" gap={1} mb={3}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livros sobre produtividade..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<Search />}
              sx={{ borderRadius: 2 }}
            >
              Buscar
            </Button>
          </Box>
        </form>

        {/* Resultados */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Buscando livros...
                </Typography>
              </Box>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao carregar sugestões de livros
              </Alert>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => refetch()}
                sx={{ borderRadius: 2 }}
              >
                Tentar Novamente
              </Button>
            </motion.div>
          )}

          {books && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Grid container spacing={2}>
                {books.map((book) => (
                  <Grid item xs={12} key={book.id}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(21,21,31,0.8) 0%, rgba(42,42,58,0.8) 100%)',
                        }}
                      >
                        <CardContent>
                          <Box display="flex" gap={2}>
                            {/* Capa do Livro */}
                            {book.volumeInfo.imageLinks?.thumbnail && (
                              <img
                                src={book.volumeInfo.imageLinks.thumbnail}
                                alt={book.volumeInfo.title}
                                style={{
                                  width: 80,
                                  height: 120,
                                  borderRadius: 8,
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            
                            {/* Informações */}
                            <Box flex={1}>
                              <Typography variant="h6" fontWeight="600" gutterBottom>
                                {book.volumeInfo.title}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                por {book.volumeInfo.authors?.join(', ') || 'Autor desconhecido'}
                              </Typography>

                              {book.volumeInfo.averageRating && (
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                  <Rating 
                                    value={book.volumeInfo.averageRating} 
                                    readOnly 
                                    size="small" 
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ({book.volumeInfo.ratingsCount || 0} avaliações)
                                  </Typography>
                                </Box>
                              )}

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 2,
                                }}
                              >
                                {book.volumeInfo.description || 'Descrição não disponível.'}
                              </Typography>

                              <Box display="flex" gap={1} mt={2}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  href={book.volumeInfo.infoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  startIcon={<Download />}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Ver Detalhes
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default BookSuggestions;