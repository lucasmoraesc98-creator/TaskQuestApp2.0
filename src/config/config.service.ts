import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  getLevelsConfig() {
    return {
      BASE_XP: 1000,
      XP_INCREMENT: 100,
      REWARDS: {
        5: "📚 Acesso à biblioteca premium",
        10: "🎵 Playlist de foco exclusiva",
        15: "☕ Desconto em cafeterias",
        20: "📖 E-book de produtividade",
        25: "🎯 Sessão de planejamento",
        30: "🚀 Curso avançado",
        50: "🏆 Mentorização pessoal"
      },
      DAILY_LIMITS: {
        MAX_XP: 350,
        MAX_TASKS: 15
      }
    };
  }

  getOpenAIKey(): string {
    return this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  getMongoURI(): string {
    return this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/taskquest';
  }

  getJWTSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'fallback-secret';
  }
}