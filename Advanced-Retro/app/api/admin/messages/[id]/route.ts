import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { listAdminMessages } from '@/lib/admin/data';
import { supabaseService } from '@/lib/supabase/service';
import { sendAdminEmail } from '@/lib/admin/emailService';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    const rows = await listAdminMessages();
    const row = rows.find((item) => item.id === params.id) || null;
    if (!row) throw new Error('Ticket no encontrado');
    return row;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async (session) => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    if (payload.action === 'reply') {
      if (payload.email && payload.subject && payload.htmlBody) {
        await sendAdminEmail({
          to: String(payload.email),
          subject: String(payload.subject),
          html: String(payload.htmlBody),
        });
      }
      return { replied: true };
    }

    await supabaseService.from('admin_message_reviews').upsert(
      {
        ticket_id: params.id,
        review_status: String(payload.review_status || 'pending_review'),
        review_reason: typeof payload.review_reason === 'string' ? payload.review_reason : null,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ticket_id' }
    );

    return { updated: true };
  });
}
