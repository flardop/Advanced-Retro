// Map images to products in lib/sampleData.ts by matching keywords from filenames to product slugs/names.
// This script updates lib/sampleData.ts in-place. Make a git commit before running.
// Usage: node assign-images-to-sampleData.js

const fs = require('fs');
const path = require('path');

const samplePath = path.join(__dirname, '..', 'lib', 'sampleData.ts');
const imgDir = path.join(__dirname, '..', 'Imagenes', 'Juegos', 'Consolas');

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

(async () => {
  const txt = await fs.promises.readFile(samplePath, 'utf8');
  const files = await fs.promises.readdir(imgDir);
  // build simple map of keywords -> filenames
  const map = {};
  for (const f of files) {
    const k = f.toLowerCase();
    // remove extension
    const base = k.replace(/\.[^.]+$/, '');
    // split into tokens
    const tokens = base.split(/[-_\.\s]+/).filter(Boolean);
    for (const t of tokens) {
      if (!map[t]) map[t] = [];
      map[t].push(f);
    }
  }

  // Find product blocks and insert images/purchase_options when a token matches
  let out = txt;
  const productRegex = /\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?images:\s*\[([^\]]*)\],[\s\S]*?created_at:\s*new Date\(\)\.toISOString\(\)\,\s*\},/g;
  out = out.replace(productRegex, (full, id, name, imagesBlock) => {
    const tokens = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const matched = new Set();
    for (const t of tokens) {
      const hits = map[t];
      if (hits) hits.forEach(h => matched.add(h));
    }
    const imgs = Array.from(matched).map(f => `'/Imagenes/Juegos/Consolas/${f.replace(/\\\\/g,'/')}'`);
    const purchase = `[ 'Juego completo', 'Solo cartucho', 'Caja', 'Manual (completo)', 'Parte interior del manual (separada)' ]`;
    const imagesText = imgs.length ? `images: [${imgs.join(', ')}],\n    purchase_options: ${purchase},` : `images: [],`;
    // replace the images: [] (or whatever) with our new block
    const replaced = full.replace(/images:\s*\[[^\]]*\],/, imagesText);
    return replaced;
  });

  await fs.promises.writeFile(samplePath + '.bak', txt);
  await fs.promises.writeFile(samplePath, out);
  console.log('Updated', samplePath, 'backup at', samplePath + '.bak');
})();
