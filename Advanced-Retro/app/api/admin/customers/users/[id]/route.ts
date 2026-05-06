import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getAdminUserDetail } from '@/lib/admin/data';
import { supabaseService } from '@/lib/supabase/service';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => getAdminUserDetail(params.id));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const role = String(payload.role || 'user');
    const notes = typeof payload.notes === 'string' ? payload.notes : null;
    await supabaseService.from('profiles').upsert({
      id: params.id,
      role,
      notes,
      full_name: payload.full_name || undefined,
      avatar_url: payload.avatar_url || undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (supabaseService.from) {
      await supabaseService.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', params.id);
    }
    return { updated: true };
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const { error } = await supabaseService.auth.admin.deleteUser(params.id);
    if (error) throw error;
    return { deleted: true };
  });
}
