import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service';
import type { AdminProfile } from '@/types/admin';

export type AdminUserContext = {
  user: {
    id: string;
    email: string | null;
  };
  profile: AdminProfile | null;
};

async function resolveAdminProfile(userId: string): Promise<{
  role: 'user' | 'admin' | 'banned';
  profile: AdminProfile | null;
}> {
  if (!supabaseService) {
    throw new Error('Supabase service role is not configured');
  }

  const [profileRes, legacyUserRes] = await Promise.all([
    supabaseService.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabaseService
      .from('users')
      .select('id,email,name,avatar_url,role,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  const profileRow = profileRes.data as Record<string, unknown> | null;
  const legacyRow = legacyUserRes.data as Record<string, unknown> | null;
  const normalizedRole = String(profileRow?.role || legacyRow?.role || 'user').trim().toLowerCase();
  const role: 'user' | 'admin' | 'banned' =
    normalizedRole === 'admin' ? 'admin' : normalizedRole === 'banned' ? 'banned' : 'user';

  const profile: AdminProfile | null = profileRow || legacyRow
    ? {
        id: userId,
        email:
          typeof profileRow?.email === 'string'
            ? profileRow.email
            : typeof legacyRow?.email === 'string'
              ? legacyRow.email
              : null,
        full_name:
          typeof profileRow?.full_name === 'string'
            ? profileRow.full_name
            : typeof legacyRow?.name === 'string'
              ? legacyRow.name
              : null,
        avatar_url:
          typeof profileRow?.avatar_url === 'string'
            ? profileRow.avatar_url
            : typeof legacyRow?.avatar_url === 'string'
              ? legacyRow.avatar_url
              : null,
        role,
        notes: typeof profileRow?.notes === 'string' ? profileRow.notes : null,
        created_at: String(profileRow?.created_at || legacyRow?.created_at || new Date().toISOString()),
        updated_at: String(profileRow?.updated_at || legacyRow?.updated_at || new Date().toISOString()),
      }
    : null;

  return { role, profile };
}

export async function getAdminUser(): Promise<AdminUserContext | null> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { role, profile } = await resolveAdminProfile(user.id);
  if (role !== 'admin') {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
    },
    profile,
  };
}
