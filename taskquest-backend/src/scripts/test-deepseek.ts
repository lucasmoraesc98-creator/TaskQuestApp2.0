import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DeepSeekAIService } from '../ai/deepseek-ai.service';

async function testDeepSeek() {
  console.log('🧪 Testando conexão com DeepSeek...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const deepSeekService = app.get(DeepSeekAIService);

  try {
    const isConnected = await deepSeekService.testConnection();
    if (isConnected) {
      console.log('✅ Conexão com DeepSeek estabelecida com sucesso!');
    } else {
      console.log('❌ Falha na conexão com DeepSeek');
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }

  await app.close();
}

testDeepSeek();