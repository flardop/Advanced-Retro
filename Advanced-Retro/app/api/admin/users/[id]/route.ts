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
    const allowedThemes = new Set(['neon-grid', 'sunset-glow', 'arcade-purple', 'mint-wave']);
    const parseBadges = (input: unknown): string[] => {
      if (!Array.isArray(input)) return [];
      const values = input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .map((value) => value.slice(0, 40));
      return [...new Set(values)].slice(0, 12);
    };

    if (typeof body?.role === 'string' && ['admin', 'user'].includes(body.role)) {
      payload.role = body.role;
    }
    if (typeof body?.is_verified_seller === 'boolean') {
      payload.is_verified_seller = body.is_verified_seller;
    }
    if (typeof body?.name === 'string') {
      const nextName = body.name.trim().slice(0, 80);
      payload.name = nextName || 'Coleccionista';
    }
    if (typeof body?.avatar_url === 'string') {
      const nextAvatar = body.avatar_url.trim().slice(0, 500);
      payload.avatar_url = nextAvatar || null;
    }
    if (typeof body?.banner_url === 'string') {
      const nextBanner = body.banner_url.trim().slice(0, 500);
      payload.banner_url = nextBanner || null;
    }
    if (typeof body?.bio === 'string') {
      const nextBio = body.bio.trim().slice(0, 1200);
      payload.bio = nextBio || null;
    }
    if (typeof body?.tagline === 'string') {
      const nextTagline = body.tagline.trim().slice(0, 120);
      payload.tagline = nextTagline || null;
    }
    if (typeof body?.favorite_console === 'string') {
      const nextFavorite = body.favorite_console.trim().slice(0, 120);
      payload.favorite_console = nextFavorite || null;
    }
    if (typeof body?.profile_theme === 'string') {
      const nextTheme = body.profile_theme.trim();
      if (allowedThemes.has(nextTheme)) {
        payload.profile_theme = nextTheme;
      }
    }
    if (Array.isArray(body?.badges)) {
      payload.badges = parseBadges(body.badges);
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
              'Faltan columnas nuevas en la base de datos. Ejecuta: database/admin_chat_seller_features.sql y database/profile_customization_upgrade.sql',
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
        avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
        banner_url: typeof data.banner_url === 'string' ? data.banner_url : null,
        bio: typeof data.bio === 'string' ? data.bio : null,
        tagline: typeof data.tagline === 'string' ? data.tagline : null,
        favorite_console:
          typeof data.favorite_console === 'string' ? data.favorite_console : null,
        profile_theme: typeof data.profile_theme === 'string' ? data.profile_theme : null,
        badges: Array.isArray(data.badges)
          ? data.badges.filter((value: unknown) => typeof value === 'string')
          : [],
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
