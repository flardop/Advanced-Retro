const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'Imagenes', 'Juegos', 'Consolas');
const out = path.join(dir, '..', 'rename_suggestions_ai.csv');

const keywords = [
  'pokemon', 'manual', 'cartucho', 'zafiro', 'plata', 'azul', 'pinball', 'parte', 'interior', 'protector'
];

function normalizeName(s) {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\.]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function suggest(filename) {
  const lower = filename.toLowerCase();
  for (const k of keywords) {
    if (lower.includes(k)) {
      const ext = path.extname(filename).toLowerCase();
      const base = lower.replace(/[^a-z0-9 ]/g, ' ');
      const parts = base.split(' ').filter(Boolean);
      // take relevant parts around keyword
      const idx = parts.findIndex(p => p.includes(k));
      const slice = parts.slice(Math.max(0, idx - 2), idx + 3);
      const name = slice.join('-');
      return normalizeName(name) + ext;
    }
  }
  return '';
}

(async () => {
  const files = await fs.promises.readdir(dir);
  const rows = [
    'original_filename,suggested_filename,notes'
  ];
  for (const f of files) {
    if (f.startsWith('.')) continue;
    const suggestion = suggest(f) || '';
    const note = suggestion ? 'AI suggestion based on filename' : 'no suggestion (needs manual review)';
    rows.push(`${f},${suggestion},${note}`);
  }
  await fs.promises.writeFile(out, rows.join('\n'));
  console.log('Wrote', out);
})();
