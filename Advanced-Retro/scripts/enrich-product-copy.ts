/**
 * Enriquece copy de productos de juego (long_description, curiosities, tips)
 * usando Wikipedia (ES/EN) + fallback interno para que no queden vacíos.
 *
 * Uso:
 *   npx tsx scripts/enrich-product-copy.ts
 *   npx tsx scripts/enrich-product-copy.ts --force
 *   npx tsx scripts/enrich-product-copy.ts --limit=50
 */

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type ProductRow = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  long_description?: string | null;
  curiosities?: string[] | null;
  tips?: string[] | null;
  component_type?: string | null;
  platform?: string | null;
};

type WikiSummary = {
  title: string;
  description: string;
  extract: string;
  sourceUrl: string;
  language: 'es' | 'en';
};

const force = process.argv.includes('--force');
const limitArg = process.argv.find((item) => item.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1] || 0)) : 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSentenceList(input: string): string[] {
  return input
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 20);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function cleanGameName(rawName: string): string {
  return rawName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(game boy|gameboy|game cube|gamecube|super nintendo|snes|gba|gbc)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGameProduct(product: ProductRow): boolean {
  const component = String(product.component_type || '').toLowerCase();
  if (component && component !== 'full_game' && component !== 'cartucho') return false;

  const source = normalizeText(
    `${String(product.name || '')} ${String(product.category || '')} ${String(product.platform || '')}`
  );

  if (!source) return false;
  if (source.includes('manual') || source.includes('insert') || source.includes('protector')) return false;
  if (source.includes('mystery') || source.includes('caja misteriosa')) return false;
  if (source.includes('consola ')) return false;

  return (
    source.includes('game boy') ||
    source.includes('gameboy') ||
    source.includes('super nintendo') ||
    source.includes('snes') ||
    source.includes('gamecube') ||
    source.includes('juegos')
  );
}

async function loadEnvFileIfNeeded(projectRoot: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;

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

async function fetchWikiSummaryDirect(
  title: string,
  language: 'es' | 'en'
): Promise<WikiSummary | null> {
  const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AdvancedRetroBot/1.0 (catalog enrichment)',
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as any;
  if (!data || data.type === 'disambiguation') return null;

  const extract = String(data.extract || '').trim();
  if (extract.length < 50) return null;

  return {
    title: String(data.title || title),
    description: String(data.description || '').trim(),
    extract,
    sourceUrl: String(
      data.content_urls?.desktop?.page ||
        `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`
    ),
    language,
  };
}

async function searchWikiTitle(query: string, language: 'es' | 'en'): Promise<string | null> {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srlimit', '5');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('origin', '*');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AdvancedRetroBot/1.0 (catalog enrichment)',
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const items = Array.isArray(data?.query?.search) ? data.query.search : [];
  if (items.length === 0) return null;
  return String(items[0]?.title || '').trim() || null;
}

async function resolveWikiSummary(name: string): Promise<WikiSummary | null> {
  const clean = cleanGameName(name);
  const candidates = uniqueStrings([
    name,
    clean,
    `${clean} videojuego`,
    `${clean} video game`,
  ]);

  for (const language of ['es', 'en'] as const) {
    for (const candidate of candidates) {
      if (!candidate) continue;
      const direct = await fetchWikiSummaryDirect(candidate, language);
      if (direct) return direct;
      await sleep(120);
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      const title = await searchWikiTitle(candidate, language);
      if (!title) continue;
      const summary = await fetchWikiSummaryDirect(title, language);
      if (summary) return summary;
      await sleep(120);
    }
  }

  return null;
}

function buildFallbackDescription(product: ProductRow): string {
  const category = String(product.category || 'retro gaming');
  return `${product.name} es una pieza de colección dentro de ${category}, preparada para compra y seguimiento en tienda.`;
}

function buildCuriosities(product: ProductRow, summary: WikiSummary | null): string[] {
  if (summary) {
    const sentences = toSentenceList(summary.extract);
    return uniqueStrings([
      sentences[0] || `${product.name} es una referencia clásica para coleccionistas retro.`,
      summary.description
        ? `Género/etiqueta pública: ${summary.description}.`
        : 'Se recomienda verificar región, edición y estado general antes de cerrar compra.',
      `Fuente informativa: ${summary.sourceUrl}`,
    ]).slice(0, 3);
  }

  return [
    `${product.name} forma parte del catálogo retro orientado a colección.`,
    'Conviene revisar versión, región y estado físico en fotos antes de comprar.',
  ];
}

function buildTips(product: ProductRow, summary: WikiSummary | null): string[] {
  const normalized = normalizeText(product.name);
  const base = [
    'Guárdalo en funda libre de PVC y evita luz solar directa para conservar carátula y etiquetas.',
    'Mantén registro con fotos del estado, región y número de serie para futuras ventas/intercambios.',
  ];

  if (normalized.includes('pokemon')) {
    base.unshift('Si incluye pila interna, comprueba guardado de partida antes de valorar estado premium.');
  } else if (normalized.includes('zelda') || normalized.includes('metroid')) {
    base.unshift('Verifica que manual e insert coincidan con la edición/región exacta para evitar mezclas.');
  } else if (summary?.language === 'en') {
    base.unshift('Confirma traducción/región (PAL/NTSC) para que tu colección sea coherente por mercado.');
  }

  return uniqueStrings(base).slice(0, 3);
}

async function main() {
  const projectRoot = path.join(process.cwd());
  await loadEnvFileIfNeeded(projectRoot);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en entorno');
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  const rows = (data || []) as ProductRow[];
  const firstRow = rows[0] as any;
  const supportsLongDescription = Boolean(firstRow && Object.prototype.hasOwnProperty.call(firstRow, 'long_description'));
  const supportsCuriosities = Boolean(firstRow && Object.prototype.hasOwnProperty.call(firstRow, 'curiosities'));
  const supportsTips = Boolean(firstRow && Object.prototype.hasOwnProperty.call(firstRow, 'tips'));

  const candidates = rows.filter((row) => isGameProduct(row));
  const queue = limit > 0 ? candidates.slice(0, limit) : candidates;

  let updated = 0;
  let skipped = 0;

  for (const product of queue) {
    const hasLong = supportsLongDescription
      ? Boolean(String(product.long_description || '').trim())
      : true;
    const hasCuriosities = supportsCuriosities
      ? Array.isArray(product.curiosities) && product.curiosities.length > 0
      : true;
    const hasTips = supportsTips
      ? Array.isArray(product.tips) && product.tips.length > 0
      : true;
    const hasDescription = Boolean(String(product.description || '').trim());

    if (!force && hasLong && hasCuriosities && hasTips && hasDescription) {
      skipped += 1;
      continue;
    }

    const summary = await resolveWikiSummary(product.name);
    const payload: Record<string, unknown> = {};

    if (supportsLongDescription && (force || !hasLong)) {
      const summaryText = summary?.extract || '';
      payload.long_description = summaryText
        ? toSentenceList(summaryText).slice(0, 2).join(' ').slice(0, 700)
        : buildFallbackDescription(product);
    }

    if (supportsCuriosities && (force || !hasCuriosities)) {
      payload.curiosities = buildCuriosities(product, summary);
    }

    if (supportsTips && (force || !hasTips)) {
      payload.tips = buildTips(product, summary);
    }

    if (force || !hasDescription) {
      payload.description = summary?.description
        ? `${product.name}. ${summary.description}.`
        : `${product.name} para coleccionistas retro.`;
    }

    if (Object.keys(payload).length === 0) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', product.id);

    if (updateError) {
      console.warn(`⚠️ No se pudo actualizar ${product.name}: ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(
      `✅ ${product.name}${summary ? ` · fuente ${summary.language.toUpperCase()}` : ' · fallback interno'}`
    );
    await sleep(180);
  }

  console.log(`\nResumen: ${updated} productos actualizados, ${skipped} omitidos.`);
}

main().catch((error) => {
  console.error(`❌ ${error?.message || error}`);
  process.exit(1);
});
