// Upload images without external deps, reading .env.local manually
const fs = require('fs');
const path = require('path');

// Read .env.local manually
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = {};
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...rest] = line.split('=');
    if (key) map[key.trim()] = rest.join('=').trim();
  });
  return map;
}

const envPath = path.join(__dirname, '..', '.env.local');
const env = loadEnv(envPath);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('✓ Loaded .env.local');
console.log('  SUPABASE_URL:', SUPABASE_URL ? SUPABASE_URL.slice(0, 30) + '...' : 'MISSING');
console.log('  SUPABASE_KEY:', SUPABASE_KEY ? SUPABASE_KEY.slice(0, 20) + '...' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  const dir = 'Imagenes/Juegos/Consolas';
  const abs = path.join(__dirname, '..', dir);
  
  if (!fs.existsSync(abs)) {
    console.error('❌ Directory not found:', abs);
    process.exit(1);
  }

  const files = fs.readdirSync(abs).filter(f => !f.startsWith('.') && fs.statSync(path.join(abs, f)).isFile());
  console.log(`\n📁 Found ${files.length} files in ${dir}\n`);

  const results = [];
  let uploaded = 0;
  let failed = 0;

  for (const f of files) {
    const local = path.join(abs, f);
    const dest = `games/${f}`;
    const data = fs.readFileSync(local);
    const sizeMB = (data.length / 1024 / 1024).toFixed(2);

    try {
      const { error: upErr } = await supabase.storage.from('public').upload(dest, data, { upsert: true });
      if (upErr) {
        console.log(`✗ ${f} (${sizeMB} MB) - ${upErr.message}`);
        failed++;
      } else {
        const { data: urlData } = supabase.storage.from('public').getPublicUrl(dest);
        const url = urlData?.publicUrl || '';
        console.log(`✓ ${f} (${sizeMB} MB)`);
        results.push({ file: f, url });
        uploaded++;
      }
    } catch (err) {
      console.log(`✗ ${f} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Resultado: ${uploaded} subidas, ${failed} fallos`);
  
  const outPath = path.join(abs, '..', 'uploaded_urls.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`✓ Guardado: ${outPath}`);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
