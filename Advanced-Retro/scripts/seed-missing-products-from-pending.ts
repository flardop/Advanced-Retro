/**
 * Crea productos faltantes (idempotente) para imágenes pendientes con nombre claro.
 *
 * Uso:
 * - npx tsx scripts/seed-missing-products-from-pending.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

type SeedProduct = {
  name: string;
  category: 'juegos-gameboy' | 'cajas-gameboy' | 'cajas-misteriosas' | 'accesorios';
  description: string;
  price: number;
  stock: number;
  is_mystery_box: boolean;
};

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

const seedProducts: SeedProduct[] = [
  {
    name: 'Manual Pokemon Blue',
    category: 'accesorios',
    description: 'Manual de instrucciones repro para Pokemon Blue.',
    price: 800,
    stock: 10,
    is_mystery_box: false,
  },
  {
    name: 'Manual Pokemon Pinball',
    category: 'accesorios',
    description: 'Manual de instrucciones repro para Pokemon Pinball.',
    price: 800,
    stock: 10,
    is_mystery_box: false,
  },
  {
    name: 'Manual Pokemon Silver',
    category: 'accesorios',
    description: 'Manual de instrucciones repro para Pokemon Silver.',
    price: 800,
    stock: 10,
    is_mystery_box: false,
  },
  {
    name: 'Manual Pokemon Sapphire',
    category: 'accesorios',
    description: 'Manual de instrucciones repro para Pokemon Sapphire.',
    price: 800,
    stock: 10,
    is_mystery_box: false,
  },
  {
    name: 'Pokemon Pinball',
    category: 'juegos-gameboy',
    description: 'Cartucho Pokemon Pinball para Game Boy.',
    price: 2999,
    stock: 8,
    is_mystery_box: false,
  },
  {
    name: 'Pokemon Sapphire',
    category: 'juegos-gameboy',
    description: 'Cartucho Pokemon Sapphire (coleccion retro).',
    price: 3999,
    stock: 6,
    is_mystery_box: false,
  },
  {
    name: 'Insert interior universal Game Boy',
    category: 'accesorios',
    description: 'Insert interior universal para cajas de juegos Game Boy.',
    price: 400,
    stock: 20,
    is_mystery_box: false,
  },
  {
    name: 'Protector universal caja Game Boy',
    category: 'accesorios',
    description: 'Protector universal para cajas de juegos Game Boy.',
    price: 500,
    stock: 20,
    is_mystery_box: false,
  },
];

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

  let created = 0;
  let existing = 0;
  let errors = 0;

  for (const product of seedProducts) {
    const { data: found, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .eq('category', product.category)
      .limit(1);

    if (findError) {
      errors++;
      continue;
    }

    if (found && found.length > 0) {
      existing++;
      continue;
    }

    const { error: insertError } = await supabase.from('products').insert({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      is_mystery_box: product.is_mystery_box,
      image: null,
      images: [],
    });

    if (insertError) {
      errors++;
    } else {
      created++;
    }
  }

  console.log('--- Seed Missing Products ---');
  console.log(`Created: ${created}`);
  console.log(`Existing: ${existing}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

