import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    await supabaseService.from('error_logs').update({ resolved: Boolean(payload.resolved) }).eq('id', params.id);
    return { updated: true };
  });
}
