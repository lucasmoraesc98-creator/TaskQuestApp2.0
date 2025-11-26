const fs = require('fs-extra');

async function copyPWA() {
  try {
    await fs.copy('../taskquest-pwa', './public');
    console.log('PWA files copied successfully!');
  } catch (err) {
    console.error('Error copying PWA files:', err);
  }
}

copyPWA();