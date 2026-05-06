import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service';
import type { AdminProfile } from '@/types/admin';

export class AdminHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AdminSessionContext = {
  user: {
    id: string;
    email: string | null;
  };
  profile: AdminProfile | null;
};

async function getAdminRoleForUser(userId: string) {
  if (!supabaseService) {
    throw new AdminHttpError(503, 'Supabase service role is not configured');
  }

  const [profileRes, legacyUserRes] = await Promise.all([
    supabaseService.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabaseService.from('users').select('id,email,name,avatar_url,role,created_at,updated_at').eq('id', userId).maybeSingle(),
  ]);

  const profileRow = profileRes.data as Record<string, unknown> | null;
  const legacyRow = legacyUserRes.data as Record<string, unknown> | null;

  const role = String(profileRow?.role || legacyRow?.role || 'user');
  const profile: AdminProfile | null = profileRow || legacyRow
    ? {
        id: userId,
        email: typeof profileRow?.email === 'string' ? profileRow.email : typeof legacyRow?.email === 'string' ? legacyRow.email : null,
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
        role: role === 'admin' ? 'admin' : role === 'banned' ? 'banned' : 'user',
        notes: typeof profileRow?.notes === 'string' ? profileRow.notes : null,
        created_at: String(profileRow?.created_at || legacyRow?.created_at || new Date().toISOString()),
        updated_at: String(profileRow?.updated_at || legacyRow?.updated_at || new Date().toISOString()),
      }
    : null;

  return { role, profile };
}

export async function checkAdminSession(): Promise<AdminSessionContext> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminHttpError(401, 'Unauthorized');
  }

  const { role, profile } = await getAdminRoleForUser(user.id);
  if (role !== 'admin') {
    throw new AdminHttpError(403, 'Forbidden');
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
    },
    profile,
  };
}

export async function requireAdminPageSession(): Promise<AdminSessionContext> {
  try {
    return await checkAdminSession();
  } catch (error) {
    if (error instanceof AdminHttpError) {
      if (error.status === 401) {
        redirect('/admin/login');
      }
      redirect('/?error=admin-only');
    }
    redirect('/admin/login');
  }
}

export function jsonAdminError(error: unknown) {
  if (error instanceof AdminHttpError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
