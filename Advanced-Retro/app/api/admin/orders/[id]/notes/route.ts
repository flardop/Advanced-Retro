import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    await supabaseService.from('admin_order_meta').upsert({
      order_id: params.id,
      internal_notes: typeof payload.notes === 'string' ? payload.notes : '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' });
    return { updated: true };
  });
}
