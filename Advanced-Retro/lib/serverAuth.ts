import { User } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeFavoritesVisibility, type FavoritesVisibility } from '@/lib/profileFavorites';

type AppUserProfile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  tagline: string | null;
  favorite_console: string | null;
  profile_theme: string | null;
  favorites_visibility: FavoritesVisibility;
  badges: string[];
  shipping_address: {
    full_name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  is_verified_seller: boolean;
  helper_completed_count: number;
  helper_active_count: number;
  helper_reputation: number;
  preferred_language: string | null;
  created_at?: string;
  updated_at?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function userNameFromAuth(user: User): string {
  const metadataName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim().slice(0, 80);
  }

  const email = typeof user.email === 'string' ? user.email : '';
  if (email.includes('@')) {
    return email.split('@')[0].slice(0, 80);
  }

  return 'Coleccionista';
}

function userAvatarFromAuth(user: User): string | null {
  if (typeof user.user_metadata?.avatar_url === 'string') {
    return user.user_metadata.avatar_url;
  }
  if (typeof user.user_metadata?.picture === 'string') {
    return user.user_metadata.picture;
  }
  return null;
}

function userBannerFromAuth(user: User): string | null {
  if (typeof user.user_metadata?.banner_url === 'string') {
    return user.user_metadata.banner_url;
  }
  return null;
}

function normalizeShippingAddressFromUnknown(input: unknown) {
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

function requiresLegacyPasswordHash(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('password_hash') &&
    message.includes('null value') &&
    message.includes('not-null')
  );
}

export async function syncAuthUserProfileRow(user: User): Promise<{
  safeEmail: string;
  safeName: string;
  safeAvatar: string | null;
}> {
  if (!supabaseAdmin) throw new ApiError(503, 'Supabase not configured');

  const nowIso = new Date().toISOString();
  const safeEmail = user.email || `${user.id}@local.invalid`;
  const safeName = userNameFromAuth(user);
  const safeAvatar = userAvatarFromAuth(user);

  const basePayload = {
    id: user.id,
    email: safeEmail,
    role: 'user',
    name: safeName,
  };

  let { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(basePayload, { onConflict: 'id' });

  if (upsertError && requiresLegacyPasswordHash(upsertError)) {
    const legacyPayload = {
      ...basePayload,
      password_hash: `supabase-auth:${user.id}`,
    };
    const legacyAttempt = await supabaseAdmin
      .from('users')
      .upsert(legacyPayload, { onConflict: 'id' });
    upsertError = legacyAttempt.error;
  }

  if (upsertError) {
    throw new ApiError(500, `Unable to sync profile: ${upsertError.message}`);
  }

  // Optional columns can be missing on legacy schemas. Ignore these update errors.
  await supabaseAdmin
    .from('users')
    .update({
      name: safeName,
      avatar_url: safeAvatar,
      updated_at: nowIso,
    })
    .eq('id', user.id);

  return {
    safeEmail,
    safeName,
    safeAvatar,
  };
}

export async function requireAuthUser(): Promise<User> {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, 'Unauthorized');
  }

  return user;
}

export async function ensureUserProfile(user: User): Promise<AppUserProfile> {
  if (!supabaseAdmin) throw new ApiError(503, 'Supabase not configured');
  const safeEmail = user.email || `${user.id}@local.invalid`;
  const safeName = userNameFromAuth(user);
  const safeAvatar = userAvatarFromAuth(user);
  const safeBanner = userBannerFromAuth(user);
  const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
  const metadataShipping = normalizeShippingAddressFromUnknown((metadata as any).shipping_address);

  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new ApiError(500, existingProfileError?.message || 'Unable to load profile');
  }

  let profile = existingProfile;
  if (!profile) {
    await syncAuthUserProfileRow(user);
    const { data: syncedProfile, error: syncedProfileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (syncedProfileError || !syncedProfile) {
      throw new ApiError(500, syncedProfileError?.message || 'Unable to load profile');
    }
    profile = syncedProfile;
  }

  return {
    id: profile.id,
    email: profile.email || safeEmail,
    role: profile.role === 'admin' ? 'admin' : 'user',
    name: typeof profile.name === 'string' ? profile.name : safeName,
    avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : safeAvatar,
    banner_url:
      typeof profile.banner_url === 'string'
        ? profile.banner_url
        : typeof metadata.banner_url === 'string'
          ? metadata.banner_url
          : safeBanner,
    bio:
      typeof profile.bio === 'string'
        ? profile.bio
        : typeof metadata.bio === 'string'
          ? metadata.bio
          : null,
    tagline:
      typeof profile.tagline === 'string'
        ? profile.tagline
        : typeof metadata.tagline === 'string'
          ? metadata.tagline
          : null,
    favorite_console:
      typeof profile.favorite_console === 'string'
        ? profile.favorite_console
        : typeof metadata.favorite_console === 'string'
          ? metadata.favorite_console
          : null,
    profile_theme:
      typeof profile.profile_theme === 'string'
        ? profile.profile_theme
        : typeof metadata.profile_theme === 'string'
          ? metadata.profile_theme
          : 'neon-grid',
    favorites_visibility: normalizeFavoritesVisibility(
      typeof (profile as any).favorites_visibility === 'string'
        ? (profile as any).favorites_visibility
        : (metadata as any).favorites_visibility
    ),
    badges: Array.isArray(profile.badges)
      ? profile.badges.filter((value: unknown) => typeof value === 'string')
      : Array.isArray(metadata.badges)
        ? metadata.badges.filter((value: unknown) => typeof value === 'string')
        : [],
    shipping_address:
      normalizeShippingAddressFromUnknown((profile as any).shipping_address) ||
      metadataShipping ||
      (profile.address || profile.city || profile.country
        ? {
            full_name: typeof profile.name === 'string' ? profile.name : safeName,
            line1: String(profile.address || '').trim().slice(0, 200),
            line2: '',
            city: String(profile.city || '').trim().slice(0, 120),
            state: '',
            postal_code: '',
            country: String(profile.country || 'España').trim().slice(0, 80),
            phone: String(profile.phone || '').trim().slice(0, 50),
          }
        : null),
    is_verified_seller: Boolean(profile.is_verified_seller),
    helper_completed_count: Number((profile as any).helper_completed_count || 0),
    helper_active_count: Number((profile as any).helper_active_count || 0),
    helper_reputation: Number((profile as any).helper_reputation || 0),
    preferred_language:
      typeof (profile as any).preferred_language === 'string'
        ? (profile as any).preferred_language
        : typeof (metadata as any).preferred_language === 'string'
          ? String((metadata as any).preferred_language)
          : 'es',
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export async function requireUserContext() {
  const user = await requireAuthUser();
  const profile = await ensureUserProfile(user);
  return { user, profile };
}

export async function requireAdminContext() {
  const ctx = await requireUserContext();
  if (ctx.profile.role !== 'admin') {
    throw new ApiError(403, 'Forbidden');
  }
  return ctx;
}

export type { AppUserProfile };
