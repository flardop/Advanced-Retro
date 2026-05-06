import { withAdminRoute } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';

export async function GET() {
  return withAdminRoute(async () => {
    if (!supabaseService) return { count: 0 };
    const [errors, reviews, orders] = await Promise.all([
      supabaseService.from('error_logs').select('id', { count: 'exact', head: true }).eq('resolved', false),
      supabaseService.from('admin_message_reviews').select('ticket_id', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
      supabaseService.from('admin_order_meta').select('order_id', { count: 'exact', head: true }).in('fulfillment_status', ['pending', 'processing']),
    ]);
    return { count: Number(errors.count || 0) + Number(reviews.count || 0) + Number(orders.count || 0) };
  });
}
