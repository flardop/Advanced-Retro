import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const userId = String(params?.id || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'User id required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const payload: Record<string, unknown> = {};

    if (typeof body?.role === 'string' && ['admin', 'user'].includes(body.role)) {
      payload.role = body.role;
    }
    if (typeof body?.is_verified_seller === 'boolean') {
      payload.is_verified_seller = body.is_verified_seller;
    }
    if (typeof body?.name === 'string') {
      payload.name = body.name.trim().slice(0, 80);
    }
    if (typeof body?.bio === 'string') {
      payload.bio = body.bio.trim().slice(0, 1200);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      const message = error?.message || 'User not found';
      if (message.toLowerCase().includes('column')) {
        return NextResponse.json(
          {
            error:
              'Faltan columnas nuevas en la base de datos. Ejecuta: database/admin_chat_seller_features.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        email: data.email,
        role: data.role === 'admin' ? 'admin' : 'user',
        name: typeof data.name === 'string' ? data.name : null,
        bio: typeof data.bio === 'string' ? data.bio : null,
        is_verified_seller: Boolean(data.is_verified_seller),
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
