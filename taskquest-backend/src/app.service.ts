import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'TaskQuest API está online! 🚀',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  getHealth() {
    const used = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: `${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`,
        total: `${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`,
      },
    };
  }
}