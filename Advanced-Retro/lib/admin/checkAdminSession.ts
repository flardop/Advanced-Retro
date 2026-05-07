import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/getAdminUser';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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

export async function checkAdminSession(): Promise<AdminSessionContext> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminHttpError(401, 'Unauthorized');
  }

  const admin = await getAdminUser();
  if (!admin) {
    throw new AdminHttpError(403, 'Forbidden');
  }
  return admin;
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
