/**
 * Marca como skip variantes duplicadas detectadas por cluster visual.
 *
 * Uso:
 * - npx tsx scripts/mark-duplicate-variants.ts
 *
 * Criterio:
 * - Para clusters con >=2 archivos, conserva el nombre mas corto/estable
 *   y marca el resto con action=skip en mapeo-manual.csv.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

type CsvRow = Record<string, string>;

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

function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };

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
  return { headers, rows };
}

function toCsv(rows: CsvRow[], headers: string[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
  }
  return lines.join('\n');
}

function chooseRepresentative(fileNames: string[]): string {
  return [...fileNames].sort((a, b) => {
    const la = a.length;
    const lb = b.length;
    if (la !== lb) return la - lb;
    return a.localeCompare(b);
  })[0];
}

async function main() {
  const cwd = process.cwd();
  const clustersPath = path.resolve(cwd, 'Imagenes/Organizadas/_report/pendientes-clusters.csv');
  const manualPath = path.resolve(cwd, 'Imagenes/Organizadas/_report/mapeo-manual.csv');

  if (!existsSync(clustersPath)) throw new Error(`No existe: ${clustersPath}`);
  if (!existsSync(manualPath)) throw new Error(`No existe: ${manualPath}`);

  const clustersCsv = await fs.readFile(clustersPath, 'utf8');
  const manualCsv = await fs.readFile(manualPath, 'utf8');

  const { rows: clusterRows } = parseCsv(clustersCsv);
  const { headers: manualHeaders, rows: manualRows } = parseCsv(manualCsv);

  const byCluster = new Map<string, string[]>();
  for (const row of clusterRows) {
    const id = (row.cluster_id || '').trim();
    const file = (row.file_name || '').trim();
    if (!id || !file) continue;
    const arr = byCluster.get(id) || [];
    arr.push(file);
    byCluster.set(id, arr);
  }

  const manualBySource = new Map<string, CsvRow>();
  for (const row of manualRows) {
    const source = (row.source_name || '').trim();
    if (source) manualBySource.set(source, row);
  }

  let clustersTouched = 0;
  let rowsSkipped = 0;

  for (const [, files] of byCluster) {
    if (files.length < 2) continue;
    const rep = chooseRepresentative(files);
    let touched = false;

    for (const file of files) {
      if (file === rep) continue;
      const row = manualBySource.get(file);
      if (!row) continue;

      const mappedName = (row.mapped_product_name || '').trim();
      const mappedCategory = (row.mapped_category || '').trim();
      if (mappedName || mappedCategory) continue;

      row.action = 'skip';
      row.notes = 'auto-skip duplicate variant';
      rowsSkipped++;
      touched = true;
    }

    if (touched) clustersTouched++;
  }

  await fs.writeFile(manualPath, toCsv(manualRows, manualHeaders), 'utf8');

  console.log('--- Marcar Variantes Duplicadas ---');
  console.log(`Clusters revisados: ${byCluster.size}`);
  console.log(`Clusters con cambios: ${clustersTouched}`);
  console.log(`Rows marcadas skip: ${rowsSkipped}`);
  console.log(`CSV actualizado: ${manualPath}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

