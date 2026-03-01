/**
 * Corrige portadas faltantes en juegos principales (sin tocar manuales/cajas).
 *
 * Uso:
 *   npx tsx scripts/fix-missing-covers.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct } from '../lib/catalogPlatform';

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COMPONENT_MARKERS_RE =
  /\b(manual|caja|insert|inlay|protector|pegatina|sticker|funda|poster)\b/i;
const GENERIC_COLLECTION_FALLBACK_RE = /^\/images\/collections\/.+\.(svg|png|jpg|jpeg|webp)$/i;

function isMainGameCandidate(row: any): boolean {
  if (row?.is_mystery_box) return false;

  const name = String(row?.name || '');
  const category = String(row?.category || '').toLowerCase();
  const componentType = String(row?.component_type || '').toLowerCase();

  if (componentType && componentType !== 'full_game' && componentType !== 'cartucho') return false;
  if (COMPONENT_MARKERS_RE.test(name)) return false;
  if (category.includes('manual') || category.includes('accesorios') || category.includes('cajas')) return false;
  return true;
}

function hasMissingCover(row: any): boolean {
  const image = String(row?.image || '').trim();
  if (!image) return true;
  if (image === '/placeholder.svg') return true;
  if (GENERIC_COLLECTION_FALLBACK_RE.test(image)) return true;
  return false;
}

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,category,component_type,is_mystery_box,image,images')
    .order('name');

  if (error) throw error;
  const rows = data || [];

  const candidates = rows.filter((row) => isMainGameCandidate(row) && hasMissingCover(row));
  console.log(`Candidatos sin portada real: ${candidates.length}`);

  let updated = 0;
  for (const row of candidates) {
    const name = String(row.name || '');
    const category = String(row.category || '');
    const platform = detectImagePlatformFromProduct({ name, category });

    const results = await searchGameImages({
      gameName: name,
      platform,
      preferSource: 'libretro',
    });

    const imageUrls = [...new Set(results.map((item) => String(item.url || '').trim()).filter(Boolean))].slice(0, 6);
    const image = imageUrls[0] || '';
    if (!image || image === '/placeholder.svg') {
      console.log(`SKIP ${name} (sin resultados)`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ image, images: imageUrls })
      .eq('id', row.id);

    if (updateError) {
      console.log(`ERR  ${name} -> ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`OK   ${name}`);
    await new Promise((resolve) => setTimeout(resolve, 140));
  }

  console.log(`Actualizados: ${updated}`);
}

run().catch((error) => {
  console.error('Error:', error?.message || error);
  process.exit(1);
});
