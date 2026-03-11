import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type FavoritesVisibility = 'public' | 'members' | 'private';

export type FavoriteProductCard = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: string[];
  stock: number;
  category: string | null;
  platform: string | null;
  liked_at: string | null;
};

type FavoriteVisibilityResult = {
  visibility: FavoritesVisibility;
  source: 'users_table' | 'auth_metadata' | 'default';
};

function isMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('could not find') && message.includes('schema cache'))
  );
}

export function normalizeFavoritesVisibility(value: unknown): FavoritesVisibility {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'private') return 'private';
  if (normalized === 'members' || normalized === 'friends' || normalized === 'authenticated') return 'members';
  return 'public';
}

export function canViewerAccessFavorites(
  targetUserId: string,
  viewerUserId: string | null | undefined,
  visibility: FavoritesVisibility
): boolean {
  if (visibility === 'public') return true;
  if (visibility === 'private') return Boolean(viewerUserId && viewerUserId === targetUserId);
  return Boolean(viewerUserId);
}

export async function getFavoritesVisibilityForUser(userId: string): Promise<FavoriteVisibilityResult> {
  if (!supabaseAdmin) {
    return { visibility: 'public', source: 'default' };
  }

  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return { visibility: 'public', source: 'default' };

  const userRes = await supabaseAdmin
    .from('users')
    .select('favorites_visibility')
    .eq('id', safeUserId)
    .maybeSingle();

  if (!userRes.error && userRes.data) {
    return {
      visibility: normalizeFavoritesVisibility((userRes.data as any).favorites_visibility),
      source: 'users_table',
    };
  }

  if (userRes.error && !isMissingTableError(userRes.error)) {
    throw new Error(userRes.error.message || 'No se pudo leer la privacidad de favoritos');
  }

  const authRes = await supabaseAdmin.auth.admin.getUserById(safeUserId);
  if (!authRes.error && authRes.data?.user) {
    return {
      visibility: normalizeFavoritesVisibility(authRes.data.user.user_metadata?.favorites_visibility),
      source: 'auth_metadata',
    };
  }

  return { visibility: 'public', source: 'default' };
}

export async function getFavoriteProductsForUser(
  userId: string,
  limit = 60
): Promise<{
  available: boolean;
  items: FavoriteProductCard[];
  total: number;
}> {
  if (!supabaseAdmin) return { available: false, items: [], total: 0 };

  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return { available: false, items: [], total: 0 };
  const safeLimit = Math.min(Math.max(Number(limit || 0), 1), 200);

  const likesRes = await supabaseAdmin
    .from('product_likes')
    .select('product_id,created_at')
    .eq('user_id', safeUserId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (likesRes.error) {
    if (isMissingTableError(likesRes.error)) {
      return { available: false, items: [], total: 0 };
    }
    throw new Error(likesRes.error.message || 'No se pudieron cargar los favoritos');
  }

  const rows = Array.isArray(likesRes.data) ? likesRes.data : [];
  if (rows.length === 0) return { available: true, items: [], total: 0 };

  const productIds = rows
    .map((row: any) => String(row?.product_id || '').trim())
    .filter(Boolean);
  const uniqueProductIds = [...new Set(productIds)];

  const productsRes = await supabaseAdmin
    .from('products')
    .select('id,name,price,image,images,stock,category,platform')
    .in('id', uniqueProductIds);

  if (productsRes.error) {
    throw new Error(productsRes.error.message || 'No se pudieron cargar los productos favoritos');
  }

  const productMap = new Map<string, any>();
  for (const row of productsRes.data || []) {
    const id = String((row as any)?.id || '').trim();
    if (!id) continue;
    productMap.set(id, row);
  }

  const items: FavoriteProductCard[] = [];
  for (const likeRow of rows) {
    const productId = String((likeRow as any)?.product_id || '').trim();
    const product = productMap.get(productId);
    if (!product) continue;

    items.push({
      id: String(product.id),
      name: String(product.name || 'Producto'),
      price: Number(product.price || 0),
      image: typeof product.image === 'string' ? product.image : null,
      images: Array.isArray(product.images)
        ? product.images
            .map((item: unknown) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 12)
        : [],
      stock: Number(product.stock || 0),
      category: typeof product.category === 'string' ? product.category : null,
      platform: typeof product.platform === 'string' ? product.platform : null,
      liked_at: typeof (likeRow as any)?.created_at === 'string' ? String((likeRow as any).created_at) : null,
    });
  }

  return {
    available: true,
    items,
    total: items.length,
  };
}

export async function getFavoriteProductsForViewer(options: {
  targetUserId: string;
  viewerUserId?: string | null;
  limit?: number;
}) {
  const visibilityResult = await getFavoritesVisibilityForUser(options.targetUserId);
  const canView = canViewerAccessFavorites(
    options.targetUserId,
    options.viewerUserId || null,
    visibilityResult.visibility
  );

  if (!canView) {
    return {
      available: true,
      can_view: false,
      visibility: visibilityResult.visibility,
      items: [] as FavoriteProductCard[],
      total: 0,
    };
  }

  const favoriteData = await getFavoriteProductsForUser(options.targetUserId, options.limit ?? 40);
  return {
    available: favoriteData.available,
    can_view: true,
    visibility: visibilityResult.visibility,
    items: favoriteData.items,
    total: favoriteData.total,
  };
}
