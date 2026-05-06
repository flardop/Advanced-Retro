import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const ids = Array.isArray(payload.ids) ? payload.ids.map((value: unknown) => String(value)) : [];
    const action = String(payload.action || '');
    if (!ids.length) throw new Error('No hay productos seleccionados');

    if (action === 'activate') {
      await supabaseService.from('products').update({ is_active: true, updated_at: new Date().toISOString() }).in('id', ids);
    } else if (action === 'deactivate') {
      await supabaseService.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).in('id', ids);
    } else if (action === 'delete') {
      await supabaseService.from('products').delete().in('id', ids);
    } else {
      throw new Error('Acción no soportada');
    }

    return { updated: ids.length, action };
  });
}
