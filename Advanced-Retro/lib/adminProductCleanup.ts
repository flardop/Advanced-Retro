import type { SupabaseClient } from '@supabase/supabase-js';

type ProductRow = Record<string, any>;

type DedupeGroupPreview = {
  key: string;
  normalizedName: string;
  count: number;
  keepId: string;
  duplicateIds: string[];
  totalMergedStock: number;
};

export type DedupeResult = {
  groupsFound: number;
  groupsApplied: number;
  productsRemoved: number;
  orderItemsRepointed: number;
  previews: DedupeGroupPreview[];
  errors: string[];
};

type DedupeOptions = {
  apply: boolean;
  maxGroups?: number;
};

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategory(row: ProductRow): string {
  if (typeof row.category === 'string' && row.category.trim()) {
    return row.category.trim().toLowerCase();
  }
  if (typeof row.category_id === 'string' && row.category_id.trim()) {
    return row.category_id.trim().toLowerCase();
  }
  return '';
}

function normalizeComponent(row: ProductRow): string {
  const raw = toSafeString(row.component_type).trim().toLowerCase();
  return raw || 'full_game';
}

function normalizeEdition(row: ProductRow): string {
  const raw = toSafeString(row.edition).trim().toLowerCase();
  return raw || 'sin-especificar';
}

function imageListFromRow(row: ProductRow): string[] {
  const rawImages = row.images;
  const list = Array.isArray(rawImages)
    ? rawImages.filter((item): item is string => typeof item === 'string')
    : typeof rawImages === 'string' && rawImages.trim().startsWith('[')
      ? (() => {
          try {
            const parsed = JSON.parse(rawImages);
            return Array.isArray(parsed)
              ? parsed.filter((item): item is string => typeof item === 'string')
              : [];
          } catch {
            return [];
          }
        })()
      : [];

  const single = typeof row.image === 'string' && row.image.trim() ? [row.image.trim()] : [];
  return [...new Set([...list, ...single].map((item) => item.trim()).filter(Boolean))];
}

function pickKeeper(rows: ProductRow[]): ProductRow {
  const scored = [...rows].sort((a, b) => {
    const byStock = toSafeNumber(b.stock) - toSafeNumber(a.stock);
    if (byStock !== 0) return byStock;

    const byImages = imageListFromRow(b).length - imageListFromRow(a).length;
    if (byImages !== 0) return byImages;

    const aDate = new Date(toSafeString(a.created_at) || 0).getTime();
    const bDate = new Date(toSafeString(b.created_at) || 0).getTime();
    return aDate - bDate;
  });

  return scored[0];
}

function buildGroupKey(row: ProductRow): string {
  const name = normalizeName(toSafeString(row.name));
  const category = normalizeCategory(row);
  const component = normalizeComponent(row);
  const edition = normalizeEdition(row);
  const price = Math.round(toSafeNumber(row.price));
  return `${name}||${category}||${component}||${edition}||${price}`;
}

async function reassignOrderItems(
  supabaseAdmin: SupabaseClient,
  fromProductId: string,
  toProductId: string
): Promise<number> {
  const { data: rows, error: selectError } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('product_id', fromProductId);

  if (selectError) {
    const msg = String(selectError.message || '').toLowerCase();
    if (
      msg.includes('relation') ||
      msg.includes('does not exist') ||
      msg.includes('schema cache') ||
      msg.includes('could not find the table') ||
      msg.includes('order_items')
    ) {
      return 0;
    }
    throw selectError;
  }

  const ids = (rows || []).map((row: any) => String(row.id)).filter(Boolean);
  if (ids.length === 0) return 0;

  const { error: updateError } = await supabaseAdmin
    .from('order_items')
    .update({ product_id: toProductId })
    .in('id', ids);

  if (updateError) throw updateError;
  return ids.length;
}

export async function deduplicateProducts(
  supabaseAdmin: SupabaseClient,
  options: DedupeOptions
): Promise<DedupeResult> {
  const apply = Boolean(options.apply);
  const maxGroups = Number.isInteger(options.maxGroups) && Number(options.maxGroups) > 0
    ? Number(options.maxGroups)
    : 200;

  const result: DedupeResult = {
    groupsFound: 0,
    groupsApplied: 0,
    productsRemoved: 0,
    orderItemsRepointed: 0,
    previews: [],
    errors: [],
  };

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(5000);

  if (productsError) {
    throw new Error(productsError.message || 'No se pudieron cargar productos');
  }

  const grouped = new Map<string, ProductRow[]>();
  for (const row of products || []) {
    const id = toSafeString(row.id).trim();
    const name = toSafeString(row.name).trim();
    if (!id || !name) continue;

    const key = buildGroupKey(row);
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  const duplicateGroups = [...grouped.entries()]
    .map(([key, rows]) => ({ key, rows }))
    .filter((item) => item.rows.length > 1)
    .slice(0, maxGroups);

  result.groupsFound = duplicateGroups.length;

  for (const group of duplicateGroups) {
    const normalizedName = group.key.split('||')[0] || '';
    const keeper = pickKeeper(group.rows);
    const keepId = toSafeString(keeper.id);

    const duplicates = group.rows.filter((row) => toSafeString(row.id) !== keepId);
    const duplicateIds = duplicates.map((row) => toSafeString(row.id)).filter(Boolean);

    const mergedImages = [...new Set(group.rows.flatMap((row) => imageListFromRow(row)))].slice(0, 40);
    const mergedStock = group.rows.reduce((sum, row) => sum + Math.max(0, toSafeNumber(row.stock)), 0);

    result.previews.push({
      key: group.key,
      normalizedName,
      count: group.rows.length,
      keepId,
      duplicateIds,
      totalMergedStock: mergedStock,
    });

    if (!apply) continue;

    try {
      let repointed = 0;
      for (const duplicateId of duplicateIds) {
        repointed += await reassignOrderItems(supabaseAdmin, duplicateId, keepId);
      }

      const keeperUpdatePayload: Record<string, unknown> = {
        stock: mergedStock,
        updated_at: new Date().toISOString(),
      };

      if (mergedImages.length > 0) {
        keeperUpdatePayload.images = mergedImages;
        keeperUpdatePayload.image = mergedImages[0];
      }

      const { error: keeperError } = await supabaseAdmin
        .from('products')
        .update(keeperUpdatePayload)
        .eq('id', keepId);

      if (keeperError) {
        throw new Error(`Error actualizando producto principal ${keepId}: ${keeperError.message}`);
      }

      const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        throw new Error(`Error borrando duplicados (${duplicateIds.join(', ')}): ${deleteError.message}`);
      }

      result.groupsApplied += 1;
      result.productsRemoved += duplicateIds.length;
      result.orderItemsRepointed += repointed;
    } catch (error: any) {
      result.errors.push(error?.message || 'Error desconocido deduplicando productos');
    }
  }

  return result;
}
