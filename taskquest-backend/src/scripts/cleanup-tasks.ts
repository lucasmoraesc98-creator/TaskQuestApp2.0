import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TasksService } from '../tasks/tasks.service';
import { GoalsService } from '../goals/goals.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from '../tasks/schemas/task.schema';
import { GoalPlan } from '../goals/schemas/goal-plan.schema';

async function cleanupOldData() {
  console.log('🧹 Iniciando limpeza de dados antigos...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const tasksService = app.get(TasksService);
  const goalsService = app.get(GoalsService);
  
  try {
    // ID do usuário teste
    const testUserId = '65d8a1b2e3f4a7c9d8e5f6a7';
    
    console.log(`🗑️ Limpando tarefas antigas do usuário: ${testUserId}`);
    
    // Limpar tarefas antigas
    const deleteResult = await tasksService['taskModel'].deleteMany({
      userId: testUserId
    });
    
    console.log(`✅ ${deleteResult.deletedCount} tarefas antigas removidas`);
    
    // Limpar planos antigos
    const goalsDeleteResult = await goalsService['goalPlanModel'].deleteMany({
      userId: testUserId
    });
    
    console.log(`✅ ${goalsDeleteResult.deletedCount} planos antigos removidos`);
    
    console.log('🎉 Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await app.close();
  }
}

// Execute a limpeza
cleanupOldData();