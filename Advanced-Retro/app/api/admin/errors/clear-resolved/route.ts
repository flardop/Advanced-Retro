import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function POST() {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    await supabaseService.from('error_logs').delete().eq('resolved', true);
    return { cleared: true };
  });
}
