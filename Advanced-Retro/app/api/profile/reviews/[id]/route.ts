import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function refreshReviewSummary(productId: string | null) {
  if (!supabaseAdmin || !productId) return;

  const { data: rows, error } = await supabaseAdmin
    .from('product_social_reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) return;

  const ratings = Array.isArray(rows) ? rows.map((row: any) => Number(row?.rating || 0)).filter((value) => value > 0) : [];
  const reviewsCount = ratings.length;
  const ratingAverage =
    reviewsCount > 0
      ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / reviewsCount) * 100) / 100
      : 0;

  await supabaseAdmin.from('product_social_summary').upsert(
    {
      product_id: productId,
      reviews_count: reviewsCount,
      rating_average: ratingAverage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'product_id' }
  );
}

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudo actualizar la reseña' }, { status: 500 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { user } = await requireUserContext();
    const reviewId = String(params?.id || '').trim();
    if (!reviewId) return NextResponse.json({ error: 'Review id requerido' }, { status: 400 });

    const body = await req.json().catch(() => null);
    const comment = String(body?.comment || '').trim().slice(0, 1000);
    const rating = Math.max(1, Math.min(5, Math.round(Number(body?.rating || 5))));

    if (comment.length < 2) {
      return NextResponse.json({ error: 'La reseña debe tener al menos 2 caracteres' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_social_reviews')
      .update({ comment, rating, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('id,product_id,user_id,author_name,rating,comment,helpful_count,created_at,updated_at')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'No se pudo actualizar la reseña' }, { status: 404 });
    }

    await refreshReviewSummary(String((data as any)?.product_id || '').trim() || null);

    return NextResponse.json({ success: true, review: data });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { user } = await requireUserContext();
    const reviewId = String(params?.id || '').trim();
    if (!reviewId) return NextResponse.json({ error: 'Review id requerido' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('product_social_reviews')
      .select('product_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('product_social_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message || 'No se pudo eliminar la reseña' }, { status: 500 });
    }

    await refreshReviewSummary(String((existing as any)?.product_id || '').trim() || null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleError(error);
  }
}
