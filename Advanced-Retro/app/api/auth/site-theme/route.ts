import { NextResponse } from 'next/server';
import { ApiError, requireAuthUser } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  DEFAULT_SITE_THEME,
  isValidSiteTheme,
  SITE_THEME_IDS,
  type SiteThemeId,
} from '@/lib/siteThemes';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
}

function resolveThemeFromMetadata(user: any): SiteThemeId {
  const raw = typeof user?.user_metadata?.site_theme === 'string' ? user.user_metadata.site_theme.trim() : '';
  return isValidSiteTheme(raw) ? raw : DEFAULT_SITE_THEME;
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    const theme = resolveThemeFromMetadata(user);

    return NextResponse.json({
      theme,
      defaultTheme: DEFAULT_SITE_THEME,
      availableThemes: SITE_THEME_IDS,
      source: 'auth_user_metadata',
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuthUser();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const rawTheme = typeof body?.theme === 'string' ? body.theme.trim() : '';
    if (!rawTheme || !isValidSiteTheme(rawTheme)) {
      return NextResponse.json(
        {
          error: 'Tema no válido',
          availableThemes: SITE_THEME_IDS,
        },
        { status: 400 }
      );
    }

    const currentMetadata =
      user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};

    const nextMetadata = {
      ...currentMetadata,
      site_theme: rawTheme,
    };

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message || 'No se pudo guardar el tema' }, { status: 500 });
    }

    // Si existe columna opcional site_theme en public.users, la actualizamos. Si no existe, ignoramos.
    await supabaseAdmin
      .from('users')
      .update({
        site_theme: rawTheme,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', user.id);

    return NextResponse.json({
      ok: true,
      theme: rawTheme,
      source: 'auth_user_metadata',
    });
  } catch (error: any) {
    return handleError(error);
  }
}
