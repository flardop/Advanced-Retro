/**
 * Aplica el CSV de mapeo manual moviendo/copiando imágenes desde "pendientes"
 * a carpetas de producto dentro de Imagenes/Organizadas.
 *
 * Uso:
 * - npx tsx scripts/apply-image-mapping.ts
 * - npx tsx scripts/apply-image-mapping.ts --apply
 * - npx tsx scripts/apply-image-mapping.ts --apply --mode=copy
 *
 * Requiere:
 * - Imagenes/Organizadas/_report/mapeo-manual.csv
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

type CsvRow = Record<string, string>;

function parseArgs(argv: string[]) {
  const args = {
    root: 'Imagenes/Organizadas',
    mapping: 'Imagenes/Organizadas/_report/mapeo-manual.csv',
    mode: 'move' as 'move' | 'copy',
    apply: false,
  };

  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) continue;

    if (arg === '--apply') {
      args.apply = true;
      continue;
    }
    if (arg.startsWith('--root=')) {
      args.root = arg.slice('--root='.length);
      continue;
    }
    if (arg.startsWith('--mapping=')) {
      args.mapping = arg.slice('--mapping='.length);
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

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function extLower(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

async function findExistingMaxIndex(targetDir: string, prefix: string): Promise<number> {
  if (!existsSync(targetDir)) return 0;
  const entries = await fs.readdir(targetDir);
  let max = 0;
  for (const name of entries) {
    const m = name.match(new RegExp(`^${prefix}-(\\d{3,})\\.[a-zA-Z0-9]+$`));
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const rootDir = path.resolve(cwd, args.root);
  const pendingDir = path.join(rootDir, 'pendientes');
  const mappingPath = path.resolve(cwd, args.mapping);

  if (!existsSync(rootDir)) throw new Error(`No existe root: ${rootDir}`);
  if (!existsSync(mappingPath)) throw new Error(`No existe mapping CSV: ${mappingPath}`);
  if (!existsSync(pendingDir)) throw new Error(`No existe carpeta pendientes: ${pendingDir}`);

  const mappingCsv = await fs.readFile(mappingPath, 'utf8');
  const rows = parseCsv(mappingCsv);

  const actionable = rows.filter((r) => {
    const action = (r.action || '').trim().toLowerCase();
    if (action === 'skip') return false;
    return !!(r.mapped_product_name || r.mapped_category);
  });

  let planned = 0;
  let missingSource = 0;
  let skippedInvalid = 0;
  let applied = 0;

  const folderCounters = new Map<string, number>();
  const planPreview: Array<{ from: string; to: string }> = [];

  for (const row of actionable) {
    const sourceName = (row.source_name || '').trim();
    const mappedName = (row.mapped_product_name || '').trim();
    const mappedCategory = (row.mapped_category || '').trim();

    if (!sourceName || !mappedName || !mappedCategory) {
      skippedInvalid++;
      continue;
    }

    const sourcePath = path.join(pendingDir, sourceName);
    if (!existsSync(sourcePath)) {
      missingSource++;
      continue;
    }

    const slug = slugify(mappedName);
    const targetDir = path.join(rootDir, mappedCategory, slug);
    const key = `${mappedCategory}::${slug}`;

    let idx = folderCounters.get(key);
    if (idx === undefined) {
      idx = await findExistingMaxIndex(targetDir, slug);
    }
    idx += 1;
    folderCounters.set(key, idx);

    const targetName = `${slug}-${String(idx).padStart(3, '0')}${extLower(sourceName)}`;
    const targetPath = path.join(targetDir, targetName);
    planned++;
    planPreview.push({ from: sourcePath, to: targetPath });

    if (args.apply) {
      await fs.mkdir(targetDir, { recursive: true });
      if (args.mode === 'copy') {
        await fs.copyFile(sourcePath, targetPath);
      } else {
        await fs.rename(sourcePath, targetPath);
      }
      applied++;
    }
  }

  console.log('--- Aplicar Mapeo Manual ---');
  console.log(`Mapping CSV: ${mappingPath}`);
  console.log(`Root: ${rootDir}`);
  console.log(`Modo: ${args.apply ? args.mode.toUpperCase() : 'DRY-RUN'}`);
  console.log(`Rows con accion: ${actionable.length}`);
  console.log(`Planes validos: ${planned}`);
  console.log(`Rows invalidas: ${skippedInvalid}`);
  console.log(`Fuentes no encontradas en pendientes: ${missingSource}`);
  console.log(`Aplicadas: ${applied}`);

  if (planPreview.length > 0) {
    console.log('\nPreview (primeras 20):');
    for (const row of planPreview.slice(0, 20)) {
      console.log(`- ${row.from} -> ${row.to}`);
    }
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

