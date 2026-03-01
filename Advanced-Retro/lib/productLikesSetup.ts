const PRODUCT_LIKES_SETUP_SQL = 'database/product_likes_auth.sql';

function normalizeErrorText(error: any): string {
  return String(error?.message || error || '')
    .trim()
    .toLowerCase();
}

export function isProductLikesSetupMissing(error: any): boolean {
  const code = String(error?.code || '').trim().toUpperCase();
  if (code === 'PGRST205' || code === '42P01') return true;

  const text = normalizeErrorText(error);
  if (!text) return false;

  const tableMentioned =
    text.includes('product_likes') || text.includes('public.product_likes');
  const missingHint =
    text.includes('schema cache') ||
    text.includes('does not exist') ||
    text.includes('relation') ||
    text.includes('could not find the table');

  return tableMentioned && missingHint;
}

export function getProductLikesSetupErrorMessage(): string {
  return `Falta crear tabla product_likes. Ejecuta ${PRODUCT_LIKES_SETUP_SQL} en Supabase SQL Editor y recarga.`;
}
