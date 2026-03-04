/**
 * Auditor SEO del catálogo:
 * - Detecta faltas comunes de indexación y calidad de ficha.
 * - Genera reporte markdown + CSV para corrección por lotes.
 *
 * Uso:
 *   npx tsx scripts/seo-audit-report.ts
 */

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type ProductRow = {
  id: string;
  name: string | null;
  slug?: string | null;
  description?: string | null;
  long_description?: string | null;
  image?: string | null;
  images?: string[] | null;
  price?: number | null;
  stock?: number | null;
  category?: string | null;
  platform?: string | null;
  updated_at?: string | null;
};

type Finding = {
  id: string;
  name: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
};

function safeText(value: unknown): string {
  return String(value || '').trim();
}

function safeLen(value: unknown): number {
  return safeText(value).length;
}

function isImageLikelyInvalid(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    !lower ||
    lower === '/placeholder.svg' ||
    lower.includes('via.placeholder.com') ||
    lower.includes('/logo.png')
  );
}

async function loadEnvFileIfNeeded(projectRoot: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const envPath = path.join(projectRoot, '.env.local');
  if (!existsSync(envPath)) return;

  const content = await fs.readFile(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function toCsv(rows: Finding[]): string {
  const header = ['severity', 'id', 'name', 'issue', 'recommendation'];
  const escape = (value: string) => `"${String(value || '').replace(/"/g, '""')}"`;
  return [header.join(','), ...rows.map((row) => [
    row.severity,
    row.id,
    row.name,
    row.issue,
    row.recommendation,
  ].map(escape).join(','))].join('\n');
}

function summarize(rows: Finding[]): Record<string, number> {
  return rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.severity] += 1;
      return acc;
    },
    { total: 0, high: 0, medium: 0, low: 0 }
  );
}

async function main() {
  const projectRoot = process.cwd();
  await loadEnvFileIfNeeded(projectRoot);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  const { data, error } = await supabase
    .from('products')
    .select('id,name,slug,description,long_description,image,images,price,stock,category,platform,updated_at')
    .order('updated_at', { ascending: false })
    .limit(10000);

  if (error) throw new Error(error.message);
  const rows = (data || []) as ProductRow[];
  const findings: Finding[] = [];

  const seenSlugs = new Map<string, string>();
  for (const row of rows) {
    const id = safeText(row.id);
    const name = safeText(row.name || 'Producto sin nombre');
    const slug = safeText(row.slug || '');
    const description = safeText(row.description || '');
    const longDescription = safeText(row.long_description || '');
    const image = safeText(row.image || '');
    const images = Array.isArray(row.images) ? row.images.map((item) => safeText(item)).filter(Boolean) : [];
    const price = Number(row.price || 0);
    const stock = Number(row.stock || 0);

    if (!slug) {
      findings.push({
        id,
        name,
        severity: 'high',
        issue: 'Producto sin slug limpio',
        recommendation: 'Generar slug para URL SEO amigable.',
      });
    } else {
      const existing = seenSlugs.get(slug);
      if (existing && existing !== id) {
        findings.push({
          id,
          name,
          severity: 'high',
          issue: `Slug duplicado: ${slug}`,
          recommendation: 'Unificar o regenerar slug único por producto.',
        });
      } else {
        seenSlugs.set(slug, id);
      }
    }

    if (safeLen(description) < 70) {
      findings.push({
        id,
        name,
        severity: 'medium',
        issue: 'Descripción corta o vacía',
        recommendation: 'Escribir descripción de 100-180 caracteres orientada a búsqueda.',
      });
    }

    if (safeLen(longDescription) < 160) {
      findings.push({
        id,
        name,
        severity: 'low',
        issue: 'Long description insuficiente',
        recommendation: 'Añadir contexto de colección, estado y compatibilidad.',
      });
    }

    if (!image || isImageLikelyInvalid(image)) {
      findings.push({
        id,
        name,
        severity: 'high',
        issue: 'Imagen principal no válida',
        recommendation: 'Asignar imagen real de producto (evitar placeholder/logo).',
      });
    }

    if (images.length === 0) {
      findings.push({
        id,
        name,
        severity: 'medium',
        issue: 'Sin galería de imágenes',
        recommendation: 'Añadir 2-6 imágenes para mejorar CTR y conversión.',
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      findings.push({
        id,
        name,
        severity: 'high',
        issue: 'Precio inválido',
        recommendation: 'Definir precio > 0 para evitar fichas no comercializables.',
      });
    }

    if (!Number.isFinite(stock) || stock < 0) {
      findings.push({
        id,
        name,
        severity: 'medium',
        issue: 'Stock inválido',
        recommendation: 'Normalizar stock (0 o positivo).',
      });
    }
  }

  const summary = summarize(findings);
  const reportsDir = path.join(projectRoot, 'docs', 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const now = new Date().toISOString();
  const csvPath = path.join(reportsDir, 'seo-audit-products.csv');
  const mdPath = path.join(reportsDir, 'seo-audit-products.md');

  await fs.writeFile(csvPath, toCsv(findings), 'utf8');

  const md = [
    '# SEO Audit de catálogo',
    '',
    `Generado: ${now}`,
    '',
    `- Productos auditados: ${rows.length}`,
    `- Hallazgos totales: ${summary.total}`,
    `- High: ${summary.high}`,
    `- Medium: ${summary.medium}`,
    `- Low: ${summary.low}`,
    '',
    `CSV: \`docs/reports/seo-audit-products.csv\``,
    '',
    '## Top 25 hallazgos',
    '',
    ...findings.slice(0, 25).map((item, index) =>
      `${index + 1}. [${item.severity.toUpperCase()}] ${item.name} (${item.id}) · ${item.issue} · ${item.recommendation}`
    ),
    '',
  ].join('\n');

  await fs.writeFile(mdPath, md, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`SEO audit completado. Productos: ${rows.length} · Hallazgos: ${summary.total}`);
  // eslint-disable-next-line no-console
  console.log(`Reporte Markdown: ${mdPath}`);
  // eslint-disable-next-line no-console
  console.log(`Reporte CSV: ${csvPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[seo-audit-report] Error:', error?.message || error);
  process.exit(1);
});
