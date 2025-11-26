const fs = require('fs-extra');
const path = require('path');

async function syncMobileAssets() {
  const frontendBuild = path.join(__dirname, '../frontend/build');
  const mobileWebDir = path.join(__dirname, '../mobile/www');
  
  console.log('📲 Sincronizando assets para mobile...');
  
  try {
    // Limpar diretório mobile
    await fs.remove(mobileWebDir);
    
    // Copiar build do frontend
    await fs.copy(frontendBuild, mobileWebDir);
    
    // Copiar configurações específicas do mobile
    await fs.copy(
      path.join(__dirname, '../mobile/pwa-config'),
      path.join(mobileWebDir, 'pwa-config')
    );
    
    console.log('✅ Assets mobile sincronizados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar assets mobile:', error);
    process.exit(1);
  }
}

syncMobileAssets();