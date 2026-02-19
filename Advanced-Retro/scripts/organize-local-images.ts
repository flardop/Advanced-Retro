/**
 * Organiza imágenes locales por producto usando nombres de archivo y productos de Supabase.
 *
 * Uso:
 * - npx tsx scripts/organize-local-images.ts
 * - npx tsx scripts/organize-local-images.ts --apply
 * - npx tsx scripts/organize-local-images.ts --apply --mode=move
 * - npx tsx scripts/organize-local-images.ts --source=Imagenes --output=Imagenes/Organizadas
 *
 * Comportamiento:
 * - Por defecto hace dry-run (no mueve/copias, solo genera reporte).
 * - Con --apply copia (o mueve) archivos al árbol organizado.
 * - Las imágenes ambiguas se envían a "pendientes".
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

type ProductRow = {
  name: string;
  category: string;
};

type ProductCandidate = {
  name: string;
  category: string;
  slug: string;
  aliases: string[];
  aliasTokens: string[][];
};

type MatchResult = {
  matched: boolean;
  product?: ProductCandidate;
  suggestedProduct?: ProductCandidate;
  suggestedScore: number;
  score: number;
  method: 'filename' | 'none';
  confidence: 'high' | 'medium' | 'low';
};

type FilePlan = {
  sourcePath: string;
  sourceName: string;
  ext: string;
  targetPath: string;
  targetCategory: string;
  productName: string;
  matched: boolean;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  method: 'filename' | 'none';
  suggestedProductName: string;
  suggestedCategory: string;
  suggestedScore: number;
};

type DuplicateItem = {
  baseKey: string;
  kept: string;
  dropped: string[];
};

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
]);

const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'the',
  'for',
  'and',
  'game',
  'boy',
  'advanced',
  'consola',
  'consolas',
  'juego',
  'juegos',
  'todos',
  'todo',
  'parte',
  'interior',
  'protector',
  'caja',
  'cajas',
  'repro',
  'manual',
  'cartucho',
  'saga',
  'original',
]);

const COLOR_TRANSLATIONS: Array<[string, string]> = [
  ['red', 'rojo'],
  ['blue', 'azul'],
  ['yellow', 'amarillo'],
  ['green', 'verde'],
  ['silver', 'plata'],
  ['gold', 'oro'],
  ['crystal', 'cristal'],
  ['sapphire', 'zafiro'],
];

function parseArgs(argv: string[]) {
  const args = {
    source: 'Imagenes',
    output: 'Imagenes/Organizadas',
    mode: 'copy' as 'copy' | 'move',
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

    if (arg.startsWith('--output=')) {
      args.output = arg.slice('--output='.length);
      continue;
    }

    if (arg.startsWith('--mode=')) {
      const mode = arg.slice('--mode='.length);
      if (mode === 'copy' || mode === 'move') args.mode = mode;
      continue;
    }
  }

  return args;
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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
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
  const normalized = normalizeText(value);
  return normalized.replace(/\s+/g, '-');
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t));
}

function buildAliases(productName: string): string[] {
  const base = normalizeText(productName);
  const aliases = new Set<string>([base]);

  for (const [english, spanish] of COLOR_TRANSLATIONS) {
    if (base.includes(english)) aliases.add(base.replace(english, spanish));
    if (base.includes(spanish)) aliases.add(base.replace(spanish, english));
  }

  if (base.includes('the legend of zelda')) {
    aliases.add(base.replace('the legend of zelda', 'zelda'));
  }
  if (base.includes('links awakening')) {
    aliases.add(base.replace('links awakening', 'link awakening'));
  }
  if (base.includes('pokemon')) {
    aliases.add(base.replace('pokemon', 'pokemon'));
  }

  return [...aliases];
}

function isGenericImageName(baseName: string): boolean {
  const normalized = normalizeText(baseName).replace(/\s+/g, ' ');
  if (/^img \d+( \d+)*$/.test(normalized)) return true;
  if (/^[a-f0-9]{8,}$/.test(normalized.replace(/\s+/g, ''))) return true;
  return false;
}

function inferCategoryHint(baseName: string): string | null {
  const n = normalizeText(baseName);
  if (n.includes('manual') || n.includes('pegatina') || n.includes('sticker')) return 'accesorios';
  if (n.includes('caja')) return 'cajas-gameboy';
  if (n.includes('cartucho')) return 'juegos-gameboy';
  return null;
}

function scoreAgainstProduct(baseName: string, candidate: ProductCandidate): number {
  const normalizedFileName = normalizeText(baseName);
  const fileTokens = tokenize(baseName);
  if (!fileTokens.length) return 0;

  let best = 0;
  for (let i = 0; i < candidate.aliases.length; i++) {
    const alias = candidate.aliases[i];
    const aliasTokens = candidate.aliasTokens[i];
    if (!aliasTokens.length) continue;

    let common = 0;
    for (const t of fileTokens) {
      if (aliasTokens.includes(t)) common++;
    }
    if (common === 0) continue;

    const precision = common / fileTokens.length;
    const recall = common / aliasTokens.length;
    let score = recall * 0.6 + precision * 0.4;

    if (normalizedFileName.includes(alias) || alias.includes(normalizedFileName)) {
      score += 0.2;
    }

    if (score > best) best = score;
  }

  return Math.min(best, 1);
}

function findBestMatch(baseName: string, products: ProductCandidate[]): MatchResult {
  if (isGenericImageName(baseName)) {
    return {
      matched: false,
      suggestedScore: 0,
      score: 0,
      method: 'none',
      confidence: 'low',
    };
  }

  const hint = inferCategoryHint(baseName);
  const scored = products
    .map((p) => {
      let score = scoreAgainstProduct(baseName, p);
      if (hint && p.category !== hint) {
        score *= 0.82;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 0.45) {
    return {
      matched: false,
      suggestedProduct: best?.product,
      suggestedScore: best?.score ?? 0,
      score: best?.score ?? 0,
      method: best ? 'filename' : 'none',
      confidence: 'low',
    };
  }

  const margin = best.score - (second?.score ?? 0);
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (best.score >= 0.72 && margin >= 0.08) confidence = 'high';
  else if (best.score >= 0.55 && margin >= 0.1) confidence = 'medium';

  if (confidence === 'low') {
    return {
      matched: false,
      suggestedProduct: best.product,
      suggestedScore: best.score,
      score: best.score,
      method: 'filename',
      confidence: 'low',
    };
  }

  return {
    matched: true,
    product: best.product,
    suggestedProduct: best.product,
    suggestedScore: best.score,
    score: best.score,
    method: 'filename',
    confidence,
  };
}

async function listImageFiles(dir: string, excludeDirs: string[] = []): Promise<string[]> {
  const output: string[] = [];
  const normalizedExcludes = excludeDirs.map((d) => path.resolve(d));

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const resolved = path.resolve(fullPath);
        const shouldSkip = normalizedExcludes.some(
          (excluded) => resolved === excluded || resolved.startsWith(`${excluded}${path.sep}`)
        );
        if (shouldSkip) continue;
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        output.push(fullPath);
      }
    }
  }

  await walk(dir);
  return output;
}

function extensionPriority(ext: string): number {
  const e = ext.toLowerCase();
  if (e === '.jpeg' || e === '.jpg') return 0;
  if (e === '.png') return 1;
  if (e === '.webp') return 2;
  if (e === '.heic' || e === '.heif') return 3;
  return 9;
}

function pickCanonicalFiles(files: string[]): { selected: string[]; duplicates: DuplicateItem[] } {
  const groups = new Map<string, string[]>();
  for (const filePath of files) {
    const key = filePath.slice(0, -path.extname(filePath).length).toLowerCase();
    const current = groups.get(key) || [];
    current.push(filePath);
    groups.set(key, current);
  }

  const selected: string[] = [];
  const duplicates: DuplicateItem[] = [];

  for (const [key, group] of groups.entries()) {
    if (group.length === 1) {
      selected.push(group[0]);
      continue;
    }

    const sorted = [...group].sort((a, b) => {
      const byExt = extensionPriority(path.extname(a)) - extensionPriority(path.extname(b));
      if (byExt !== 0) return byExt;
      return a.localeCompare(b);
    });
    const kept = sorted[0];
    const dropped = sorted.slice(1);

    selected.push(kept);
    duplicates.push({
      baseKey: key,
      kept,
      dropped,
    });
  }

  return { selected, duplicates };
}

function toCsv(rows: FilePlan[]): string {
  const header = [
    'source_path',
    'source_name',
    'matched',
    'product_name',
    'category',
    'confidence',
    'score',
    'method',
    'suggested_product',
    'suggested_category',
    'suggested_score',
    'target_path',
  ];

  const lines = [header.join(',')];
  for (const row of rows) {
    const values = [
      row.sourcePath,
      row.sourceName,
      String(row.matched),
      row.productName,
      row.targetCategory,
      row.confidence,
      row.score.toFixed(3),
      row.method,
      row.suggestedProductName,
      row.suggestedCategory,
      row.suggestedScore.toFixed(3),
      row.targetPath,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  const sourceDir = path.resolve(projectRoot, args.source);
  const outputDir = path.resolve(projectRoot, args.output);
  const reportDir = path.join(outputDir, '_report');

  if (!existsSync(sourceDir)) {
    throw new Error(`No existe carpeta source: ${sourceDir}`);
  }

  await loadEnvFileIfNeeded(projectRoot);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Faltan variables Supabase (NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/ANON).'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('products').select('name,category');
  if (error) throw new Error(`Error leyendo products: ${error.message}`);

  const uniqueProducts = new Map<string, ProductRow>();
  for (const row of (data || []) as ProductRow[]) {
    const key = `${row.category}::${row.name}`;
    if (!uniqueProducts.has(key)) uniqueProducts.set(key, row);
  }

  const products: ProductCandidate[] = [...uniqueProducts.values()].map((p) => {
    const aliases = buildAliases(p.name);
    return {
      name: p.name,
      category: p.category,
      slug: slugify(p.name),
      aliases,
      aliasTokens: aliases.map((a) => tokenize(a)),
    };
  });

  const allFiles = await listImageFiles(sourceDir, [outputDir]);
  const { selected: files, duplicates } = pickCanonicalFiles(allFiles);
  const perFolderIndex = new Map<string, number>();
  const usedTargets = new Set<string>();

  const plans: FilePlan[] = [];
  for (const filePath of files.sort()) {
    const sourceName = path.basename(filePath);
    const ext = path.extname(sourceName).toLowerCase();
    const baseName = sourceName.slice(0, -ext.length);

    const match = findBestMatch(baseName, products);
    const relativeFolder = match.matched && match.product
      ? path.join(match.product.category, match.product.slug)
      : 'pendientes';

    const folderKey = relativeFolder;
    const nextIndex = (perFolderIndex.get(folderKey) || 0) + 1;
    perFolderIndex.set(folderKey, nextIndex);

    let targetFileName: string;
    if (match.matched && match.product) {
      targetFileName = `${match.product.slug}-${String(nextIndex).padStart(3, '0')}${ext}`;
    } else {
      targetFileName = sourceName;
    }

    let targetPath = path.join(outputDir, relativeFolder, targetFileName);
    while (usedTargets.has(targetPath)) {
      const alt = `${path.basename(targetFileName, ext)}-dup${ext}`;
      targetPath = path.join(outputDir, relativeFolder, alt);
      targetFileName = alt;
    }
    usedTargets.add(targetPath);

    plans.push({
      sourcePath: filePath,
      sourceName,
      ext,
      targetPath,
      targetCategory: match.matched && match.product ? match.product.category : 'pendientes',
      productName: match.matched && match.product ? match.product.name : '',
      matched: match.matched,
      score: match.score,
      confidence: match.confidence,
      method: match.method,
      suggestedProductName: match.suggestedProduct?.name || '',
      suggestedCategory: match.suggestedProduct?.category || '',
      suggestedScore: match.suggestedScore || 0,
    });
  }

  const matched = plans.filter((p) => p.matched);
  const pending = plans.filter((p) => !p.matched);

  await fs.mkdir(reportDir, { recursive: true });
  const reportJsonPath = path.join(reportDir, 'organizacion-imagenes.json');
  const reportCsvPath = path.join(reportDir, 'organizacion-imagenes.csv');

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    dryRun: !args.apply,
    mode: args.mode,
    sourceDir,
    outputDir,
    totalFiles: plans.length,
    totalSourceFiles: allFiles.length,
    duplicateVariantsSkipped: duplicates.length,
    matchedFiles: matched.length,
    pendingFiles: pending.length,
    productsLoaded: products.length,
    summaryByCategory: matched.reduce<Record<string, number>>((acc, row) => {
      acc[row.targetCategory] = (acc[row.targetCategory] || 0) + 1;
      return acc;
    }, {}),
    samplePending: pending.slice(0, 30).map((p) => p.sourceName),
    duplicates,
    items: plans,
  };

  await fs.writeFile(reportJsonPath, JSON.stringify(reportPayload, null, 2), 'utf8');
  await fs.writeFile(reportCsvPath, toCsv(plans), 'utf8');

  if (args.apply) {
    for (const row of plans) {
      await fs.mkdir(path.dirname(row.targetPath), { recursive: true });
      if (args.mode === 'copy') {
        await fs.copyFile(row.sourcePath, row.targetPath);
      } else {
        await fs.rename(row.sourcePath, row.targetPath);
      }
    }
  }

  const topMatched = matched
    .reduce<Map<string, number>>((acc, row) => {
      const key = `${row.targetCategory}::${row.productName}`;
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map())
    .entries();

  const sortedTop = [...topMatched]
    .map(([k, count]) => {
      const idx = k.indexOf('::');
      return {
        category: k.slice(0, idx),
        product: k.slice(idx + 2),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  console.log('--- Organizacion de Imagenes ---');
  console.log(`Source: ${sourceDir}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Modo: ${args.apply ? args.mode.toUpperCase() : 'DRY-RUN'}`);
  console.log(`Productos cargados (unicos): ${products.length}`);
  console.log(`Imagenes fuente: ${allFiles.length}`);
  console.log(`Imagenes tras limpiar duplicados: ${plans.length}`);
  console.log(`Duplicados detectados (.HEIC/.jpeg del mismo archivo): ${duplicates.length}`);
  console.log(`Asignadas automaticamente: ${matched.length}`);
  console.log(`Pendientes revision manual: ${pending.length}`);
  console.log(`Reporte JSON: ${reportJsonPath}`);
  console.log(`Reporte CSV: ${reportCsvPath}`);

  if (sortedTop.length > 0) {
    console.log('\nTop productos con asignaciones:');
    for (const row of sortedTop) {
      console.log(`- [${row.category}] ${row.product}: ${row.count}`);
    }
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
