import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const action = String(payload.action || 'ban');
    const role = action === 'ban' ? 'banned' : 'user';
    await supabaseService.from('profiles').upsert({ id: params.id, role, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    await supabaseService.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', params.id);
    return { updated: true, role };
  });
}
