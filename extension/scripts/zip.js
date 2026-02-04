/**
 * Create ZIP file for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUTPUT = path.join(ROOT, 'dashstory-extension.zip');

// Check if dist exists
if (!fs.existsSync(DIST)) {
  console.error('Error: dist/ folder not found. Run "npm run build" first.');
  process.exit(1);
}

// Create output stream
const output = fs.createWriteStream(OUTPUT);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const size = (archive.pointer() / 1024).toFixed(2);
  console.log(`\\nCreated: dashstory-extension.zip (${size} KB)`);
  console.log('Ready for Chrome Web Store submission!');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(DIST, false);
archive.finalize();
