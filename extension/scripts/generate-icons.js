/**
 * Generate PNG icons from SVG for Chrome Extension
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG icon template (using a larger base for better quality)
const createSvgIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="Arial, Helvetica, sans-serif" font-weight="bold" 
        font-size="${size * 0.55}">D</text>
</svg>`;

const sizes = [16, 32, 48, 128];
const assetsDir = path.join(__dirname, '..', 'assets');

async function generateIcons() {
  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Generate PNG files
  for (const size of sizes) {
    const svg = Buffer.from(createSvgIcon(size));
    const pngFilename = `icon-${size}.png`;
    
    await sharp(svg)
      .png()
      .toFile(path.join(assetsDir, pngFilename));
    
    console.log(`Generated ${pngFilename}`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
