/**
 * Rellena automaticamente mapeo-manual.csv para archivos pendientes conocidos.
 *
 * Uso:
 * - npx tsx scripts/autofill-mapping-known-files.ts
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

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type MappingRule = {
  test: (normalizedFileName: string) => boolean;
  product: string;
  category: string;
};

const rules: MappingRule[] = [
  {
    test: (name) => name.includes('manual pokemon azul'),
    product: 'Manual Pokemon Blue',
    category: 'accesorios',
  },
  {
    test: (name) => name.includes('manual pokemon pinball'),
    product: 'Manual Pokemon Pinball',
    category: 'accesorios',
  },
  {
    test: (name) => name.includes('manual pokemon plata'),
    product: 'Manual Pokemon Silver',
    category: 'accesorios',
  },
  {
    test: (name) => name.includes('manual pokemon zafiro'),
    product: 'Manual Pokemon Sapphire',
    category: 'accesorios',
  },
  {
    test: (name) => name.includes('pokemon zafiro cartucho'),
    product: 'Pokemon Sapphire',
    category: 'juegos-gameboy',
  },
  {
    test: (name) => name.includes('cartucho pokemon pinball'),
    product: 'Pokemon Pinball',
    category: 'juegos-gameboy',
  },
  {
    test: (name) => name.includes('parte interior todos los juegos'),
    product: 'Insert interior universal Game Boy',
    category: 'accesorios',
  },
  {
    test: (name) => name.includes('protector caja juegos todos los juegos'),
    product: 'Protector universal caja Game Boy',
    category: 'accesorios',
  },
];

async function main() {
  const csvPath = path.resolve(
    process.cwd(),
    'Imagenes/Organizadas/_report/mapeo-manual.csv'
  );
  if (!existsSync(csvPath)) throw new Error(`No existe: ${csvPath}`);

  const content = await fs.readFile(csvPath, 'utf8');
  const { headers, rows } = parseCsv(content);
  if (!headers.length) throw new Error('CSV vacio');

  let mapped = 0;
  for (const row of rows) {
    const sourceName = row.source_name || '';
    const normalized = normalize(sourceName);

    for (const rule of rules) {
      if (!rule.test(normalized)) continue;
      row.mapped_product_name = rule.product;
      row.mapped_category = rule.category;
      row.action = 'mapped';
      if (!row.notes) row.notes = 'auto-map from filename';
      mapped++;
      break;
    }
  }

  await fs.writeFile(csvPath, toCsv(rows, headers), 'utf8');

  console.log('--- Autofill Mapping Known Files ---');
  console.log(`Rows mapeadas: ${mapped}`);
  console.log(`CSV actualizado: ${csvPath}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});

