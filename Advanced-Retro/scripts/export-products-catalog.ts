/**
 * Exporta el catalogo actual de products a CSV para usarlo en el mapeo manual.
 *
 * Uso:
 * - npx tsx scripts/export-products-catalog.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

type ProductRow = {
  name: string;
  category: string;
  count?: number;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

async function loadEnvFileIfNeeded(projectRoot: string) {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON
  );
  if (hasUrl && hasKey) return;

  const envPath = path.join(projectRoot, '.env.local');
  if (!existsSync(envPath)) return;

  const content = await fs.readFile(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function toCsv(rows: ProductRow[]): string {
  const header = ['category', 'name', 'slug', 'rows_in_db'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const values = [row.category, row.name, slugify(row.name), String(row.count || 0)];
    lines.push(values.map((v) => `"${v.replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

async function main() {
  const cwd = process.cwd();
  await loadEnvFileIfNeeded(cwd);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan variables Supabase');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('products').select('name,category');
  if (error) throw new Error(`Error leyendo products: ${error.message}`);

  const byKey = new Map<string, ProductRow>();
  for (const row of (data || []) as ProductRow[]) {
    const key = `${row.category}::${row.name}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count = (existing.count || 0) + 1;
    } else {
      byKey.set(key, { ...row, count: 1 });
    }
  }

  const rows = [...byKey.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );

  const outPath = path.resolve(cwd, 'Imagenes/Organizadas/_report/productos-catalogo.csv');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, toCsv(rows), 'utf8');

  console.log('--- Catalogo Exportado ---');
  console.log(`Productos totales (rows DB): ${data?.length || 0}`);
  console.log(`Productos unicos (name+category): ${rows.length}`);
  console.log(`Archivo: ${outPath}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

