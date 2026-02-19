/**
 * Propaga asignaciones hechas por cluster hacia mapeo-manual.csv.
 *
 * Uso:
 * - npx tsx scripts/apply-cluster-mapping.ts
 *
 * Flujo recomendado:
 * 1) python scripts/cluster-pending-images.py
 * 2) editar Imagenes/Organizadas/_report/mapeo-por-cluster.csv
 * 3) npx tsx scripts/apply-cluster-mapping.ts
 * 4) npx tsx scripts/apply-image-mapping.ts --apply
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

type CsvRow = Record<string, string>;

function parseArgs(argv: string[]) {
  const args = {
    clusterDetail: 'Imagenes/Organizadas/_report/pendientes-clusters.csv',
    clusterMapping: 'Imagenes/Organizadas/_report/mapeo-por-cluster.csv',
    manualMapping: 'Imagenes/Organizadas/_report/mapeo-manual.csv',
  };

  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) continue;

    if (arg.startsWith('--cluster-detail=')) {
      args.clusterDetail = arg.slice('--cluster-detail='.length);
      continue;
    }
    if (arg.startsWith('--cluster-mapping=')) {
      args.clusterMapping = arg.slice('--cluster-mapping='.length);
      continue;
    }
    if (arg.startsWith('--manual-mapping=')) {
      args.manualMapping = arg.slice('--manual-mapping='.length);
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
    const line = headers
      .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
      .join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const clusterDetailPath = path.resolve(cwd, args.clusterDetail);
  const clusterMappingPath = path.resolve(cwd, args.clusterMapping);
  const manualPath = path.resolve(cwd, args.manualMapping);

  for (const p of [clusterDetailPath, clusterMappingPath, manualPath]) {
    if (!existsSync(p)) throw new Error(`No existe archivo: ${p}`);
  }

  const detailCsv = await fs.readFile(clusterDetailPath, 'utf8');
  const clusterCsv = await fs.readFile(clusterMappingPath, 'utf8');
  const manualCsv = await fs.readFile(manualPath, 'utf8');

  const { rows: detailRows } = parseCsv(detailCsv);
  const { rows: clusterRows } = parseCsv(clusterCsv);
  const { headers: manualHeaders, rows: manualRows } = parseCsv(manualCsv);
  if (!manualHeaders.length) throw new Error(`CSV vacio: ${manualPath}`);

  const clusterFiles = new Map<string, string[]>();
  for (const row of detailRows) {
    const clusterId = (row.cluster_id || '').trim();
    const fileName = (row.file_name || '').trim();
    if (!clusterId || !fileName) continue;
    const arr = clusterFiles.get(clusterId) || [];
    arr.push(fileName);
    clusterFiles.set(clusterId, arr);
  }

  const manualBySource = new Map<string, CsvRow>();
  for (const row of manualRows) {
    const sourceName = (row.source_name || '').trim();
    if (sourceName) manualBySource.set(sourceName, row);
  }

  let clustersApplied = 0;
  let rowsUpdated = 0;

  for (const row of clusterRows) {
    const clusterId = (row.cluster_id || '').trim();
    const mappedName = (row.mapped_product_name || '').trim();
    const mappedCategory = (row.mapped_category || '').trim();
    const action = (row.action || '').trim().toLowerCase();

    if (!clusterId) continue;
    if (action === 'skip') continue;
    if (!mappedName || !mappedCategory) continue;

    const files = clusterFiles.get(clusterId) || [];
    if (!files.length) continue;

    let changedInCluster = 0;
    for (const fileName of files) {
      const manual = manualBySource.get(fileName);
      if (!manual) continue;
      manual.mapped_product_name = mappedName;
      manual.mapped_category = mappedCategory;
      manual.action = action || 'mapped';
      changedInCluster++;
      rowsUpdated++;
    }
    if (changedInCluster > 0) clustersApplied++;
  }

  await fs.writeFile(manualPath, toCsv(manualRows, manualHeaders), 'utf8');

  console.log('--- Aplicar Mapeo por Cluster ---');
  console.log(`Cluster detail: ${clusterDetailPath}`);
  console.log(`Cluster mapping: ${clusterMappingPath}`);
  console.log(`Manual mapping actualizado: ${manualPath}`);
  console.log(`Clusters aplicados: ${clustersApplied}`);
  console.log(`Rows actualizadas: ${rowsUpdated}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

