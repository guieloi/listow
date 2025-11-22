const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const logoSvg = path.join(assetsDir, 'logo.svg');

// SVG para adaptive-icon (apenas foreground - sem o círculo de fundo)
const adaptiveIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Shopping Bag Icon (centered and scaled) -->
  <g filter="url(#shadow)" transform="translate(106, 106) scale(0.6)">
    <!-- Bag Body -->
    <path d="M80 128 L420 128 L400 440 C400 462 382 480 360 480 L140 480 C118 480 100 462 100 440 L80 128 Z" fill="#3498db"/>
    
    <!-- Bag Handles -->
    <path d="M170 128 L170 80 C170 53 192 32 220 32 L280 32 C308 32 330 53 330 80 L330 128" stroke="#3498db" stroke-width="40" fill="none" stroke-linecap="round"/>
    
    <!-- Checkmark -->
    <path d="M160 280 L230 350 L340 220" stroke="#ffffff" stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

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

    // 2. Gerar adaptive-icon.png (1024x1024) - apenas foreground
    console.log('📱 Gerando adaptive-icon.png (1024x1024)...');
    await sharp(Buffer.from(adaptiveIconSvg))
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

