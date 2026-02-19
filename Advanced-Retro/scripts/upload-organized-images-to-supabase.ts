/**
 * Sube imágenes organizadas a Supabase Storage y actualiza products.image/images.
 *
 * Uso:
 * - npx tsx scripts/upload-organized-images-to-supabase.ts
 * - npx tsx scripts/upload-organized-images-to-supabase.ts --apply
 * - npx tsx scripts/upload-organized-images-to-supabase.ts --apply --bucket=product-images
 *
 * Estructura esperada de origen:
 * Imagenes/Organizadas/<category>/<product-slug>/<archivo>
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

type ProductRow = {
  id: string;
  name: string;
  category: string;
};

type ProductGroup = {
  name: string;
  category: string;
  slug: string;
  ids: string[];
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

function parseArgs(argv: string[]) {
  const args = {
    source: 'Imagenes/Organizadas',
    bucket: 'product-images',
    apply: false,
  };

  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) continue;

    if (arg === '--apply') {
      args.apply = true;
      continue;
    }
    if (arg.startsWith('--source=')) {
      args.source = arg.slice('--source='.length);
      continue;
    }
    if (arg.startsWith('--bucket=')) {
      args.bucket = arg.slice('--bucket='.length);
      continue;
    }
  }

  return args;
}

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

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '_report' || entry.name === 'pendientes') continue;
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name === '.DS_Store') continue;
      out.push(full);
    }
  }

  await walk(dir);
  return out;
}

function extToMime(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] || 'application/octet-stream';
}

async function ensureBucket(supabase: any, bucket: string) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Error listBuckets: ${listError.message}`);

  const existing = (buckets || []).find((b: any) => b.name === bucket || b.id === bucket);
  if (existing) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });
  if (createError) throw new Error(`Error createBucket("${bucket}"): ${createError.message}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  const sourceDir = path.resolve(projectRoot, args.source);

  if (!existsSync(sourceDir)) throw new Error(`No existe source: ${sourceDir}`);

  await loadEnvFileIfNeeded(projectRoot);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan variables Supabase para conectar.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id,name,category');
  if (productsError) throw new Error(`Error leyendo products: ${productsError.message}`);

  const productGroups = new Map<string, ProductGroup>();
  for (const row of (products || []) as ProductRow[]) {
    const slug = slugify(row.name);
    const key = `${row.category}::${slug}`;
    const existing = productGroups.get(key);
    if (existing) {
      existing.ids.push(row.id);
    } else {
      productGroups.set(key, {
        name: row.name,
        category: row.category,
        slug,
        ids: [row.id],
      });
    }
  }

  const files = await listFiles(sourceDir);
  const byProduct = new Map<string, string[]>();
  const unmatchedFiles: string[] = [];

  for (const fullPath of files) {
    const relative = path.relative(sourceDir, fullPath);
    const parts = relative.split(path.sep);
    if (parts.length < 3) {
      unmatchedFiles.push(relative);
      continue;
    }

    const category = parts[0];
    const slug = parts[1];
    const productKey = `${category}::${slug}`;
    if (!productGroups.has(productKey)) {
      unmatchedFiles.push(relative);
      continue;
    }

    const current = byProduct.get(productKey) || [];
    current.push(fullPath);
    byProduct.set(productKey, current);
  }

  let uploaded = 0;
  let updatedProducts = 0;
  let groupsWithFiles = 0;
  const missingProducts = [...byProduct.keys()].filter((k) => !productGroups.has(k));
  const preview: string[] = [];

  if (args.apply) {
    await ensureBucket(supabase, args.bucket);
  }

  for (const [productKey, localFiles] of byProduct.entries()) {
    const group = productGroups.get(productKey);
    if (!group || localFiles.length === 0) continue;

    groupsWithFiles++;
    const sortedFiles = [...localFiles].sort((a, b) => a.localeCompare(b));
    const publicUrls: string[] = [];

    for (const filePath of sortedFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);
      const storagePath = `${group.category}/${group.slug}/${fileName}`;

      if (args.apply) {
        const data = await fs.readFile(filePath);
        const { error: uploadError } = await supabase.storage
          .from(args.bucket)
          .upload(storagePath, data, {
            contentType: extToMime(ext),
            upsert: true,
          });
        if (uploadError) {
          throw new Error(`Error subiendo ${storagePath}: ${uploadError.message}`);
        }
      }

      const { data: publicData } = supabase.storage.from(args.bucket).getPublicUrl(storagePath);
      publicUrls.push(publicData.publicUrl);
      uploaded++;
    }

    if (args.apply && publicUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image: publicUrls[0],
          images: publicUrls,
        })
        .eq('name', group.name)
        .eq('category', group.category);

      if (updateError) {
        throw new Error(
          `Error actualizando product ${group.category}/${group.name}: ${updateError.message}`
        );
      }
      updatedProducts += group.ids.length;
    }

    preview.push(
      `[${group.category}] ${group.name}: ${publicUrls.length} imagen(es)`
    );
  }

  console.log('--- Upload Imagenes Organizadas ---');
  console.log(`Source: ${sourceDir}`);
  console.log(`Bucket: ${args.bucket}`);
  console.log(`Modo: ${args.apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Productos unicos en DB: ${productGroups.size}`);
  console.log(`Grupos con ficheros locales: ${groupsWithFiles}`);
  console.log(`Ficheros detectados para upload: ${uploaded}`);
  console.log(`Ficheros no mapeados a producto: ${unmatchedFiles.length}`);
  console.log(`Products DB actualizados: ${updatedProducts}`);
  console.log(`Claves sin producto (debug): ${missingProducts.length}`);

  if (preview.length > 0) {
    console.log('\nPreview (primeros 20):');
    for (const row of preview.slice(0, 20)) {
      console.log(`- ${row}`);
    }
  }

  if (unmatchedFiles.length > 0) {
    console.log('\nUnmatched (primeros 20):');
    for (const f of unmatchedFiles.slice(0, 20)) {
      console.log(`- ${f}`);
    }
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
