const fs = require('fs-extra');
const path = require('path');

async function copyPWAAssets() {
  const sourceDir = path.join(__dirname, '../mobile/pwa-config');
  const targetDir = path.join(__dirname, '../frontend/public');
  
  console.log('📱 Copiando assets do PWA...');
  
  try {
    // Copiar manifest.json
    await fs.copy(
      path.join(sourceDir, 'manifest.json'),
      path.join(targetDir, 'manifest.json')
    );
    
    // Copiar service worker
    await fs.copy(
      path.join(sourceDir, 'service-worker.js'),
      path.join(targetDir, 'service-worker.js')
    );
    
    // Copiar ícones
    await fs.copy(
      path.join(sourceDir, '../app-icons'),
      path.join(targetDir, 'icons')
    );
    
    console.log('✅ Assets do PWA copiados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao copiar assets do PWA:', error);
    process.exit(1);
  }
}

copyPWAAssets();