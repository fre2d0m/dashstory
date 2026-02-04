/**
 * Build script for Chrome Extension
 * Creates a production-ready build in dist/ folder
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Files and folders to include in the build
const INCLUDE = [
  'manifest.json',
  'src/',
  'assets/'
];

// Clean dist folder
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Copy files
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(ROOT, src)}`);
  }
}

// Copy included files
INCLUDE.forEach(item => {
  const src = path.join(ROOT, item);
  const dest = path.join(DIST, item);
  
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  } else {
    console.warn(`Warning: ${item} not found`);
  }
});

console.log('\\nBuild complete! Extension files are in dist/');
console.log('\\nTo load in Chrome:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the dist/ folder');
