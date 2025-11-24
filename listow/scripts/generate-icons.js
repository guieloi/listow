const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const logoSvg = path.join(assetsDir, 'logo.svg');

async function generateIcons() {
  try {
    console.log('🎨 Gerando ícones a partir do logo.svg...\n');

    // 1. Gerar icon.png (1024x1024) - ícone completo com fundo
    console.log('📱 Gerando icon.png (1024x1024)...');
    await sharp(logoSvg)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ icon.png gerado!\n');

    // 2. Gerar adaptive-icon.png (1024x1024)
    console.log('📱 Gerando adaptive-icon.png (1024x1024)...');
    await sharp(logoSvg)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png gerado!\n');

    // 3. Gerar splash-icon.png (1024x1024) - mesmo que icon.png
    console.log('📱 Gerando splash-icon.png (1024x1024)...');
    await sharp(logoSvg)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✅ splash-icon.png gerado!\n');

    // 4. Gerar favicon.png (64x64)
    console.log('🌐 Gerando favicon.png (64x64)...');
    await sharp(logoSvg)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png gerado!\n');

    console.log('🎉 Todos os ícones foram gerados com sucesso!');
    console.log('\n📋 Arquivos gerados:');
    console.log('  - assets/icon.png (1024x1024)');
    console.log('  - assets/adaptive-icon.png (1024x1024)');
    console.log('  - assets/splash-icon.png (1024x1024)');
    console.log('  - assets/favicon.png (64x64)');
    
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();

