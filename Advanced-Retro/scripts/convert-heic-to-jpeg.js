// Requires: npm install sharp
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'Imagenes', 'Juegos', 'Consolas');

function normalizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\.]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

(async () => {
  const files = await fs.promises.readdir(dir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.heic' || ext === '.heif') {
      const src = path.join(dir, file);
      const destName = normalizeFilename(path.basename(file, ext)) + '.jpeg';
      const dest = path.join(dir, destName);
      try {
        await sharp(src, {limitInputPixels: false})
          .jpeg({quality: 90})
          .toFile(dest);
        console.log('Converted', file, '->', destName);
      } catch (err) {
        console.error('Failed to convert', file, err.message);
      }
    }
  }
})();
