import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const { user, profile } = await requireUserContext();
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile,
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);

    const payload: Record<string, unknown> = {};
    if (typeof body?.name === 'string') payload.name = body.name.trim().slice(0, 80);
    if (typeof body?.avatar_url === 'string') payload.avatar_url = body.avatar_url.trim().slice(0, 500);
    if (typeof body?.bio === 'string') payload.bio = body.bio.trim().slice(0, 1200);

    const hasUserField = Object.keys(payload).length > 0;
    if (!hasUserField) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select('id,email,role,name,avatar_url,bio,is_verified_seller,created_at,updated_at')
      .single();

    if (updateError || !updated) {
      const message = updateError?.message || 'Could not update profile';
      if (message.toLowerCase().includes('column')) {
        return NextResponse.json(
          {
            error:
              'Faltan columnas de perfil en la base de datos. Ejecuta el SQL: database/admin_chat_seller_features.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return handleError(error);
  }
}
