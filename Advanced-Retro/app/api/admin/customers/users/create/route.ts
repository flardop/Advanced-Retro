import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { sendEmailFromTemplate } from '@/lib/admin/emailService';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '').trim();
    if (!email || !password) throw new Error('Email y contraseña son obligatorios');

    const { data, error } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: payload.full_name || '',
        full_name: payload.full_name || '',
      },
    });
    if (error || !data.user) throw error || new Error('No se pudo crear el usuario');

    await supabaseService.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: payload.full_name || null,
      role: payload.role || 'user',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (payload.send_welcome_email !== false) {
      await sendEmailFromTemplate({
        templateIdOrName: 'welcome_email',
        to: email,
        recipientUserId: data.user.id,
        variables: { name: payload.full_name || email },
      });
    }

    return { id: data.user.id, email };
  });
}
