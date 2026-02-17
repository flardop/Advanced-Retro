import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const normalized = (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      role: row.role === 'admin' ? 'admin' : 'user',
      name: typeof row.name === 'string' ? row.name : null,
      bio: typeof row.bio === 'string' ? row.bio : null,
      is_verified_seller: Boolean(row.is_verified_seller),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    return NextResponse.json(normalized);
  } catch (err: any) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
