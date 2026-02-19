/**
 * Genera un CSV editable para asignar manualmente imágenes pendientes a productos.
 *
 * Uso:
 * - npx tsx scripts/generate-image-mapping-template.ts
 * - npx tsx scripts/generate-image-mapping-template.ts --report=Imagenes/Organizadas/_report/organizacion-imagenes.csv
 *
 * Salida:
 * - Imagenes/Organizadas/_report/mapeo-manual.csv
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

type CsvRow = Record<string, string>;

function parseArgs(argv: string[]) {
  const args = {
    report: 'Imagenes/Organizadas/_report/organizacion-imagenes.csv',
    output: 'Imagenes/Organizadas/_report/mapeo-manual.csv',
  };

  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) continue;

    if (arg.startsWith('--report=')) {
      args.report = arg.slice('--report='.length);
      continue;
    }
    if (arg.startsWith('--output=')) {
      args.output = arg.slice('--output='.length);
      continue;
    }
  }

  return args;
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

  if (lines.length === 0) return [];

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

function csvEscape(value: string): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toCsv(rows: CsvRow[], headers: string[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const reportPath = path.resolve(cwd, args.report);
  const outputPath = path.resolve(cwd, args.output);

  if (!existsSync(reportPath)) {
    throw new Error(`No existe reporte CSV: ${reportPath}`);
  }

  const content = await fs.readFile(reportPath, 'utf8');
  const rows = parseCsv(content);

  const pending = rows.filter((r) => String(r.matched).toLowerCase() !== 'true');

  const templateHeaders = [
    'source_name',
    'source_path',
    'suggested_product',
    'suggested_category',
    'suggested_score',
    'mapped_product_name',
    'mapped_category',
    'action',
    'notes',
  ];

  let existingBySource = new Map<string, CsvRow>();
  if (existsSync(outputPath)) {
    const existingContent = await fs.readFile(outputPath, 'utf8');
    const existingRows = parseCsv(existingContent);
    for (const row of existingRows) {
      const sourceName = (row.source_name || '').trim();
      if (sourceName) existingBySource.set(sourceName, row);
    }
  }

  const templateRows: CsvRow[] = pending.map((row) => ({
    source_name: row.source_name || path.basename(row.source_path || ''),
    source_path: row.source_path || '',
    suggested_product: row.suggested_product || '',
    suggested_category: row.suggested_category || '',
    suggested_score: row.suggested_score || '',
    mapped_product_name: '',
    mapped_category: '',
    action: 'review',
    notes: '',
  }));

  for (const row of templateRows) {
    const source = (row.source_name || '').trim();
    const previous = existingBySource.get(source);
    if (!previous) continue;

    row.mapped_product_name = previous.mapped_product_name || '';
    row.mapped_category = previous.mapped_category || '';
    row.action = previous.action || row.action;
    row.notes = previous.notes || row.notes;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, toCsv(templateRows, templateHeaders), 'utf8');

  console.log('--- Plantilla de Mapeo Generada ---');
  console.log(`Reporte origen: ${reportPath}`);
  console.log(`Salida: ${outputPath}`);
  console.log(`Pendientes: ${templateRows.length}`);
  console.log('Columnas a rellenar: mapped_product_name, mapped_category, action(optional=skip)');
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
