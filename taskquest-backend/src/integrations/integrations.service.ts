import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IntegrationsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async getBookRecommendations(limit: number = 5) {
    try {
      const queries = [
        'productivity',
        'time management', 
        'personal development',
        'habits',
        'focus',
      ];

      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/books/v1/volumes?q=${randomQuery}&maxResults=${limit}&langRestrict=pt`
        )
      );

      return this.formatBooksData(response.data.items || []);
    } catch (error) {
      return this.getLocalBooks(limit);
    }
  }

  private formatBooksData(books: any[]) {
    return books.map(book => {
      const volumeInfo = book.volumeInfo;
      return {
        id: book.id,
        title: volumeInfo.title,
        authors: volumeInfo.authors || ['Autor desconhecido'],
        description: volumeInfo.description ? 
          volumeInfo.description.substring(0, 200) + '...' : 
          'Descrição não disponível',
        thumbnail: volumeInfo.imageLinks?.thumbnail || '/assets/default-book.jpg',
        previewLink: volumeInfo.previewLink,
        infoLink: volumeInfo.infoLink,
        categories: volumeInfo.categories || ['Desenvolvimento Pessoal'],
      };
    }).filter(book => book.title && book.authors);
  }

  private getLocalBooks(limit: number) {
    const localBooks = [
      {
        id: '1',
        title: 'Hábitos Atômicos',
        authors: ['James Clear'],
        description: 'Um método fácil e comprovado de criar bons hábitos e se livrar dos maus hábitos.',
        thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg',
        categories: ['Produtividade', 'Hábitos'],
      },
      {
        id: '2', 
        title: 'Essencialismo',
        authors: ['Greg McKeown'],
        description: 'A disciplinada busca por menos em um mundo de excessos.',
        thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71VOXY-2jEL.jpg',
        categories: ['Produtividade', 'Foco'],
      },
    ];

    return localBooks.slice(0, limit);
  }

  async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
          },
        ),
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
