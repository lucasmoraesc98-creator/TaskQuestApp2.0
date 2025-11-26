/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// cleanup-now.js - Script para limpar dados antigos do MongoDB
const { MongoClient } = require ('mongodb');
const { console } = require ('node:inspector');

async function cleanup() {
  console.log('🧹 Conectando ao MongoDB...');
  
  const uri = 'mongodb://admin:password@localhost:27017/taskquest?authSource=admin';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db('taskquest');
    const userId = '65d8a1b2e3f4a7c9d8e5f6a7';
    
    console.log(`🗑️ Limpando dados do usuário: ${userId}`);
    
    // Limpar tarefas
    const tasksDeleted = await db.collection('tasks').deleteMany({
      userId: userId
    });
    
    console.log(`✅ ${tasksDeleted.deletedCount} tarefas removidas`);
    
    // Limpar planos de metas
    const goalsDeleted = await db.collection('goalplans').deleteMany({
      userId: userId
    });
    
    console.log(`✅ ${goalsDeleted.deletedCount} planos de metas removidos`);
    
    // Limpar também da coleção goalplans (se existir)
    const goalPlansDeleted = await db.collection('goalplans').deleteMany({
      userId: userId
    });
    
    console.log(`✅ ${goalPlansDeleted.deletedCount} goalplans removidos`);
    
    console.log('🎉 Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executar a limpeza
cleanup();