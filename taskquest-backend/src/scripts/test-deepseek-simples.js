/* eslint-disable */

const axios = require('axios');

async function testDeepSeek() {
  console.log('🧪 Testando conexão com DeepSeek...');
  
  const apiKey = 'sk-e04eb6265ba24000ab6f23e7244ed39c';
  const baseUrl = 'https://api.deepseek.com/v1';

  try {
    console.log('📡 Fazendo requisição para DeepSeek API...');
    
    const response = await axios.get(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });

    console.log('✅ Conexão com DeepSeek estabelecida com sucesso!');
    console.log('📋 Modelos disponíveis:');
    response.data.data.forEach(model => {
      console.log(`   - ${model.id} (${model.object})`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Falha na conexão com DeepSeek:');
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status de erro
      console.log('   Status:', error.response.status);
      console.log('   Erro:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.log('   Erro: Nenhuma resposta recebida do servidor');
      console.log('   Verifique sua conexão com a internet');
    } else {
      // Algum erro ocorreu ao configurar a requisição
      console.log('   Erro:', error.message);
    }
    
    return false;
  }
}

// Executar o teste
testDeepSeek().then(success => {
  if (success) {
    console.log('\n🎉 DeepSeek está funcionando! Você pode prosseguir com a implementação.');
  } else {
    console.log('\n💡 Dica: Vamos usar um sistema fallback local por enquanto.');
    console.log('   Você pode configurar a API key mais tarde.');
  }
});