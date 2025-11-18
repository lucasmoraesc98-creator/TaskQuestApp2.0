import { Injectable } from '@nestjs/common'; // Removido BadRequestException
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
        'psychology',
        'self improvement',
        'goal setting'
      ];

      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/books/v1/volumes?q=${randomQuery}&maxResults=${limit}&langRestrict=pt`
        )
      );

      const books = this.formatBooksData(response.data.items || []);
      
      if (books.length < limit) {
        const localBooks = this.getLocalBooks(limit - books.length);
        books.push(...localBooks);
      }

      return books;
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
        previewLink: volumeInfo.previewLink || '#',
        infoLink: volumeInfo.infoLink || '#',
        categories: volumeInfo.categories || ['Desenvolvimento Pessoal'],
        pageCount: volumeInfo.pageCount,
        publishedDate: volumeInfo.publishedDate,
        averageRating: volumeInfo.averageRating || 4.5,
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
        previewLink: '#',
        infoLink: '#',
        categories: ['Produtividade', 'Hábitos'],
        pageCount: 320,
        publishedDate: '2018-10-16',
        averageRating: 4.8,
      },
      {
        id: '2', 
        title: 'Essencialismo',
        authors: ['Greg McKeown'],
        description: 'A disciplinada busca por menos em um mundo de excessos.',
        thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71VOXY-2jEL.jpg',
        previewLink: '#',
        infoLink: '#',
        categories: ['Produtividade', 'Foco'],
        pageCount: 260,
        publishedDate: '2014-04-15',
        averageRating: 4.6,
      },
      {
        id: '3',
        title: 'A Coragem de Ser Imperfeito',
        authors: ['Brené Brown'],
        description: 'Como aceitar a própria vulnerabilidade, vencer a vergonha e ousar ser quem você é.',
        thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71Q2WVQa2EL.jpg',
        previewLink: '#',
        infoLink: '#',
        categories: ['Autoajuda', 'Psicologia'],
        pageCount: 240,
        publishedDate: '2012-09-11',
        averageRating: 4.7,
      }
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

  async getProductivityTips(limit: number = 3) {
    const tips = [
      {
        title: "Técnica Pomodoro",
        description: "Trabalhe em blocos de 25 minutos com pausas de 5 minutos. A cada 4 pomodoros, faça uma pausa longer de 15-30 minutos.",
        category: "Foco",
        difficulty: "Iniciante"
      },
      {
        title: "Time Blocking",
        description: "Agende blocos de tempo específicos para diferentes tipos de tarefas no seu calendário.",
        category: "Planejamento", 
        difficulty: "Intermediário"
      }
    ];

    return tips.slice(0, limit);
  }
}