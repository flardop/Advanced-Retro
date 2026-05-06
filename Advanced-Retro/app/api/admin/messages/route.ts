import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { listAdminMessages } from '@/lib/admin/data';
import { supabaseService } from '@/lib/supabase/service';

export async function GET() {
  return withAdminRoute(async () => listAdminMessages());
}

export async function POST(request: NextRequest) {
  return withAdminRoute(async (session) => {
    const service = supabaseService;
    if (!service) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const ids = Array.isArray(payload.ids) ? payload.ids.map((value: unknown) => String(value)) : [];
    const action = String(payload.action || '');
    if (!ids.length) throw new Error('No hay tickets seleccionados');

    if (action === 'delete') {
      await service.from('support_tickets').delete().in('id', ids);
      return { updated: ids.length };
    }

    const reviewStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending_review';
    await Promise.all(
      ids.map((ticketId: string) =>
        service.from('admin_message_reviews').upsert(
          {
            ticket_id: ticketId,
            review_status: reviewStatus,
            review_reason: typeof payload.reason === 'string' ? payload.reason : null,
            updated_by: session.user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ticket_id' }
        )
      )
    );

    return { updated: ids.length };
  });
}
