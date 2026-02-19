import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const requireAdmin = async () => {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Unauthorized');
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (userRow?.role !== 'admin') throw new Error('Forbidden');
};

export async function GET() {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const userIds = [...new Set((orders || []).map((order) => String(order.user_id || '')).filter(Boolean))];
    const { data: users } = userIds.length
      ? await supabaseAdmin
          .from('users')
          .select('id,email,name')
          .in('id', userIds)
      : { data: [] as any[] };

    const userMap = new Map<string, any>((users || []).map((user) => [String(user.id), user]));

    const normalized = (orders || []).map((order) => {
      const user = userMap.get(String(order.user_id));
      const status = String(order.status || '').toLowerCase();
      const needsShipping = ['paid', 'processing'].includes(status) && !String(order.shipping_tracking_code || '').trim();

      return {
        ...order,
        user: user || null,
        needs_shipping: needsShipping,
      };
    });

    return NextResponse.json(normalized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
