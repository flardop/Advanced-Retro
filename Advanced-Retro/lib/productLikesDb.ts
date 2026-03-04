import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductLikesSetupErrorMessage, isProductLikesSetupMissing } from '@/lib/productLikesSetup';
import { syncProductLikeCountIntoSummarySql } from '@/lib/productSocialSql';

type LikesSnapshot = {
  likesByProduct: Record<string, number>;
  likedByCurrentUser: Record<string, boolean>;
  available: boolean;
};

function isMissingTableError(error: any): boolean {
  return isProductLikesSetupMissing(error);
}

export async function getProductLikesSnapshot(
  productIds: string[],
  userId?: string | null
): Promise<LikesSnapshot> {
  const likesByProduct: Record<string, number> = {};
  const likedByCurrentUser: Record<string, boolean> = {};

  if (!supabaseAdmin || productIds.length === 0) {
    return { likesByProduct, likedByCurrentUser, available: false };
  }

  const uniqueIds = [...new Set(productIds.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { likesByProduct, likedByCurrentUser, available: true };
  }

  const likesRes = await supabaseAdmin
    .from('product_likes')
    .select('product_id')
    .in('product_id', uniqueIds);

  if (likesRes.error) {
    if (isMissingTableError(likesRes.error)) {
      return { likesByProduct, likedByCurrentUser, available: false };
    }
    throw new Error(likesRes.error.message || 'No se pudieron cargar los likes');
  }

  for (const row of likesRes.data || []) {
    const productId = String((row as any)?.product_id || '').trim();
    if (!productId) continue;
    likesByProduct[productId] = Number(likesByProduct[productId] || 0) + 1;
  }

  if (userId) {
    const userRes = await supabaseAdmin
      .from('product_likes')
      .select('product_id')
      .eq('user_id', userId)
      .in('product_id', uniqueIds);

    if (userRes.error) {
      if (!isMissingTableError(userRes.error)) {
        throw new Error(userRes.error.message || 'No se pudieron cargar tus favoritos');
      }
    } else {
      for (const row of userRes.data || []) {
        const productId = String((row as any)?.product_id || '').trim();
        if (!productId) continue;
        likedByCurrentUser[productId] = true;
      }
    }
  }

  return { likesByProduct, likedByCurrentUser, available: true };
}

export async function getProductLikeSummary(
  productId: string,
  userId?: string | null
): Promise<{ likes: number; likedByCurrentUser: boolean; available: boolean }> {
  const snapshot = await getProductLikesSnapshot([productId], userId || null);
  return {
    likes: Number(snapshot.likesByProduct[productId] || 0),
    likedByCurrentUser: Boolean(snapshot.likedByCurrentUser[productId]),
    available: snapshot.available,
  };
}

export async function toggleProductLike(
  productId: string,
  userId: string
): Promise<{ liked: boolean; likes: number; likedByCurrentUser: boolean; available: boolean }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase no configurado');
  }

  const existing = await supabaseAdmin
    .from('product_likes')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing.error && !isMissingTableError(existing.error)) {
    throw new Error(existing.error.message || 'No se pudo verificar favorito');
  }

  let liked = false;

  if (existing.data?.id) {
    const remove = await supabaseAdmin
      .from('product_likes')
      .delete()
      .eq('id', String(existing.data.id));

    if (remove.error) {
      throw new Error(remove.error.message || 'No se pudo quitar favorito');
    }
    liked = false;
  } else {
    const insert = await supabaseAdmin.from('product_likes').insert({
      product_id: productId,
      user_id: userId,
    });

    if (insert.error) {
      if (isMissingTableError(insert.error)) {
        throw new Error(getProductLikesSetupErrorMessage());
      }
      const message = String(insert.error.message || '').toLowerCase();
      if (!message.includes('duplicate')) {
        throw new Error(insert.error.message || 'No se pudo guardar favorito');
      }
    }
    liked = true;
  }

  const summary = await getProductLikeSummary(productId, userId);
  void syncProductLikeCountIntoSummarySql(productId, summary.likes);

  return {
    liked,
    likes: summary.likes,
    likedByCurrentUser: summary.likedByCurrentUser,
    available: summary.available,
  };
}
