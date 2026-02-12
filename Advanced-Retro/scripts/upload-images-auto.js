// Load .env.local and run upload script
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'SET' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFiles(bucket, dir) {
  const abs = path.join(__dirname, dir);
  if (!fs.existsSync(abs)) {
    console.error('Directory not found:', abs);
    process.exit(1);
  }
  const files = fs.readdirSync(abs);
  const results = [];
  console.log(`Found ${files.length} files in ${dir}`);
  for (const f of files) {
    if (f.startsWith('.')) continue;
    const local = path.join(abs, f);
    const stat = fs.statSync(local);
    if (!stat.isFile()) continue;
    const dest = `games/${f}`;
    try {
      const data = fs.readFileSync(local);
      console.log(`Uploading ${f} (${(data.length / 1024 / 1024).toFixed(2)} MB)...`);
      const { error: upErr } = await supabase.storage.from(bucket).upload(dest, data, { upsert: true });
      if (upErr) {
        console.error(`  ✗ Upload failed:`, upErr.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(dest);
      const url = urlData?.publicUrl || 'N/A';
      console.log(`  ✓ Uploaded (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
      results.push({ file: f, url });
    } catch (err) {
      console.error(`  ✗ Error:`, err.message);
    }
  }
  const out = path.join(abs, '..', 'uploaded_urls.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n✓ Wrote ${out} (${results.length} files)`);
}

uploadFiles('public', 'Imagenes/Juegos/Consolas');
