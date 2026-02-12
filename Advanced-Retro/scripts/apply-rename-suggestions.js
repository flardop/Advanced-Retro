const fs = require('fs');
const path = require('path');
// simple CSV parser (no extra deps)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',');
  return lines.slice(1).map(l => {
    const cols = l.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
}

const dir = path.join(__dirname, '..', 'Imagenes', 'Juegos');
const csvPath = path.join(dir, 'rename_suggestions_ai.csv');

(async () => {
  const text = await fs.promises.readFile(csvPath, 'utf8');
  const records = parseCSV(text);
  for (const r of records) {
    const orig = r.original_filename;
    const sug = r.suggested_filename && r.suggested_filename.trim();
    if (!sug) continue;
    // look for file under dir (recursively)
    const files = await (async function list(p) {
      let out = [];
      const items = await fs.promises.readdir(p);
      for (const it of items) {
        const full = path.join(p, it);
        const stat = await fs.promises.stat(full);
        if (stat.isDirectory()) {
          out = out.concat(await list(full));
        } else {
          out.push(full);
        }
      }
      return out;
    })(dir);
    const match = files.find(f => path.basename(f) === orig);
    if (!match) {
      console.warn('Original not found:', orig);
      continue;
    }
    const dest = path.join(path.dirname(match), sug);
    await fs.promises.rename(match, dest);
    console.log('Renamed', orig, '->', path.relative(dir, dest));
  }
})();
