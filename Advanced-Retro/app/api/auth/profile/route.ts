import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { awardProfileMilestones, getGamificationSnapshot } from '@/lib/gamificationServer';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
}

function sanitizeShippingAddress(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const source = input as Record<string, unknown>;
  const payload = {
    full_name: String(source.full_name || '').trim().slice(0, 120),
    line1: String(source.line1 || '').trim().slice(0, 200),
    line2: String(source.line2 || '').trim().slice(0, 200),
    city: String(source.city || '').trim().slice(0, 120),
    state: String(source.state || '').trim().slice(0, 120),
    postal_code: String(source.postal_code || '').trim().slice(0, 30),
    country: String(source.country || '').trim().slice(0, 80),
    phone: String(source.phone || '').trim().slice(0, 50),
  };
  if (!payload.full_name || !payload.line1 || !payload.city || !payload.postal_code || !payload.country) {
    return null;
  }
  return payload;
}

function sanitizeBadgeKeys(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const values = input
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => value.slice(0, 40));
  return [...new Set(values)].slice(0, 160);
}

async function loadLatestProfileBadges(userId: string): Promise<string[] | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('badges')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return sanitizeBadgeKeys((data as any)?.badges);
}

export async function GET(req: Request) {
  try {
    const { user, profile } = await requireUserContext();
    const url = new URL(req.url);
    const includeGamificationRaw = String(
      url.searchParams.get('include_gamification') || ''
    ).trim().toLowerCase();
    const includeGamification =
      includeGamificationRaw === '1' ||
      includeGamificationRaw === 'true' ||
      includeGamificationRaw === 'yes';

    const response: Record<string, unknown> = {
      user: {
        id: user.id,
        email: user.email,
        profile,
      },
    };

    if (includeGamification) {
      response.gamification = await getGamificationSnapshot(user.id);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { user, profile: currentProfile } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);

    const allowedThemes = new Set([
      'neon-grid',
      'sunset-glow',
      'arcade-purple',
      'mint-wave',
      'obsidian-ember',
      'aurora-scanline',
      'platinum-grid',
    ]);

    const payload: Record<string, unknown> = {};
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
    if (Array.isArray(body?.badges)) payload.badges = sanitizeBadgeKeys(body.badges);
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'shipping_address')) {
      payload.shipping_address = sanitizeShippingAddress((body as any).shipping_address);
    }

    const hasUserField = Object.keys(payload).length > 0;
    if (!hasUserField) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    payload.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select('id,email,role,name,avatar_url,banner_url,bio,tagline,favorite_console,profile_theme,badges,shipping_address,is_verified_seller,created_at,updated_at')
      .single();

    if (updateError || !updated) {
      const message = updateError?.message || 'Could not update profile';
      if (message.toLowerCase().includes('column')) {
        const metadataPatch: Record<string, unknown> = {};
        if (typeof body?.name === 'string') metadataPatch.name = body.name.trim().slice(0, 80) || null;
        if (typeof body?.avatar_url === 'string') metadataPatch.avatar_url = body.avatar_url.trim().slice(0, 500) || null;
        if (typeof body?.banner_url === 'string') metadataPatch.banner_url = body.banner_url.trim().slice(0, 500) || null;
        if (typeof body?.bio === 'string') metadataPatch.bio = body.bio.trim().slice(0, 1200) || null;
        if (typeof body?.tagline === 'string') metadataPatch.tagline = body.tagline.trim().slice(0, 120) || null;
        if (typeof body?.favorite_console === 'string') metadataPatch.favorite_console = body.favorite_console.trim().slice(0, 120) || null;
        if (typeof body?.profile_theme === 'string') metadataPatch.profile_theme = body.profile_theme.trim().slice(0, 40) || null;
        if (Array.isArray(body?.badges)) metadataPatch.badges = sanitizeBadgeKeys(body.badges);
        if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'shipping_address')) {
          metadataPatch.shipping_address = sanitizeShippingAddress((body as any).shipping_address);
        }

        if (Object.keys(metadataPatch).length > 0) {
          const nextMetadata = {
            ...(user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}),
            ...metadataPatch,
          };
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: nextMetadata,
          });
          if (!authUpdateError) {
            const fallbackProfile = {
              ...currentProfile,
              name: typeof metadataPatch.name === 'string' ? metadataPatch.name : currentProfile.name,
              avatar_url: typeof metadataPatch.avatar_url === 'string' || metadataPatch.avatar_url === null
                ? (metadataPatch.avatar_url as string | null)
                : currentProfile.avatar_url,
              banner_url: typeof metadataPatch.banner_url === 'string' || metadataPatch.banner_url === null
                ? (metadataPatch.banner_url as string | null)
                : currentProfile.banner_url,
              bio: typeof metadataPatch.bio === 'string' || metadataPatch.bio === null
                ? (metadataPatch.bio as string | null)
                : currentProfile.bio,
              tagline: typeof metadataPatch.tagline === 'string' || metadataPatch.tagline === null
                ? (metadataPatch.tagline as string | null)
                : currentProfile.tagline,
              favorite_console:
                typeof metadataPatch.favorite_console === 'string' || metadataPatch.favorite_console === null
                  ? (metadataPatch.favorite_console as string | null)
                  : currentProfile.favorite_console,
              profile_theme:
                typeof metadataPatch.profile_theme === 'string'
                  ? metadataPatch.profile_theme
                  : currentProfile.profile_theme,
              badges: Array.isArray(metadataPatch.badges) ? metadataPatch.badges : currentProfile.badges,
              shipping_address:
                Object.prototype.hasOwnProperty.call(metadataPatch, 'shipping_address')
                  ? ((metadataPatch.shipping_address as any) || null)
                  : currentProfile.shipping_address,
              updated_at: new Date().toISOString(),
            };

            await awardProfileMilestones({
              userId: user.id,
              profile: fallbackProfile as any,
            });
            const gamification = await getGamificationSnapshot(user.id);

            const latestBadges = await loadLatestProfileBadges(user.id);
            return NextResponse.json({
              profile: latestBadges ? { ...fallbackProfile, badges: latestBadges } : fallbackProfile,
              gamification,
              fallback: 'auth_user_metadata',
            });
          }
        }

        return NextResponse.json(
          {
            error:
              'Faltan columnas de personalización. Ejecuta SQL: database/profile_columns_hotfix.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await awardProfileMilestones({
      userId: user.id,
      profile: updated,
    });

    const gamification = await getGamificationSnapshot(user.id);
    const latestBadges = await loadLatestProfileBadges(user.id);
    return NextResponse.json({
      profile: latestBadges ? { ...updated, badges: latestBadges } : updated,
      gamification,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
