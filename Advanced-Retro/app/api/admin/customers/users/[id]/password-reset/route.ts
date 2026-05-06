import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { sendEmailFromTemplate } from '@/lib/admin/emailService';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const { data: profile } = await supabaseService.from('profiles').select('email, full_name').eq('id', params.id).maybeSingle();
    const email = String(profile?.email || '');
    if (!email) throw new Error('No se encontró email para este usuario');

    const { data, error } = await supabaseService.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    if (error) throw error;

    await sendEmailFromTemplate({
      templateIdOrName: 'password_reset',
      to: email,
      recipientUserId: params.id,
      variables: {
        name: profile?.full_name || email,
        reset_link: data.properties?.action_link || '#',
        reset_url: data.properties?.action_link || '#',
      },
    });

    return { sent: true };
  });
}
