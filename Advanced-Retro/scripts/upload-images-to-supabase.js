// Upload images to Supabase Storage and print public URLs
// Requires: npm install @supabase/supabase-js
// Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env, then run:
// node upload-images-to-supabase.js --bucket public --dir "Imagenes/Juegos/Consolas"

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Accept different env var names used in this repo
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY; // use service role for uploads

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(bucket, localPath, destPath) {
  const data = await fs.promises.readFile(localPath);
  const { error } = await supabase.storage.from(bucket).upload(destPath, data, { upsert: true });
  if (error) throw error;
  // Make public URL
  const { publicURL, error: urlErr } = supabase.storage.from(bucket).getPublicUrl(destPath);
  if (urlErr) throw urlErr;
  return publicURL;
}

(async () => {
  const args = require('minimist')(process.argv.slice(2));
  const bucket = args.bucket || 'public';
  const dir = args.dir || path.join('Imagenes', 'Juegos', 'Consolas');
  const abs = path.join(__dirname, '..', dir);
  const files = await fs.promises.readdir(abs);
  const results = [];
  for (const f of files) {
    if (f.startsWith('.')) continue;
    const local = path.join(abs, f);
    const dest = `games/${f}`;
    try {
      const url = await uploadFile(bucket, local, dest);
      console.log('Uploaded', f, '->', url);
      results.push({ file: f, url });
    } catch (err) {
      console.error('Upload failed for', f, err.message);
    }
  }
  const out = path.join(abs, '..', 'uploaded_urls.json');
  await fs.promises.writeFile(out, JSON.stringify(results, null, 2));
  console.log('Wrote', out);
})();
