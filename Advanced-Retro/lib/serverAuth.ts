import { User } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type AppUserProfile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified_seller: boolean;
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

  const nowIso = new Date().toISOString();
  const safeEmail = user.email || `${user.id}@local.invalid`;
  const safeName = userNameFromAuth(user);
  const safeAvatar =
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === 'string'
        ? user.user_metadata.picture
        : null;

  const upsertPayload = {
    id: user.id,
    email: safeEmail,
    role: 'user',
  };

  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(upsertPayload, { onConflict: 'id' });

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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(500, profileError?.message || 'Unable to load profile');
  }

  return {
    id: profile.id,
    email: profile.email || safeEmail,
    role: profile.role === 'admin' ? 'admin' : 'user',
    name: typeof profile.name === 'string' ? profile.name : safeName,
    avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : safeAvatar,
    bio: typeof profile.bio === 'string' ? profile.bio : null,
    is_verified_seller: Boolean(profile.is_verified_seller),
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
