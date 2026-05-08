import { NextRequest } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return Response.json({ success: false, error: 'Supabase service role no configurado' }, { status: 503 });
    }
    const payload = await request.json();
    const email = String(payload.email || '').trim().toLowerCase();
    const roleLabel = String(payload.role_label || '').trim().slice(0, 80) || null;
    const source = String(payload.source || 'public').trim().slice(0, 40) || 'public';
    if (!email || !email.includes('@')) {
      return Response.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }

    const extendedUpsert = await supabaseService
      .from('retroville_waitlist')
      .upsert(
        {
          email,
          role_label: roleLabel,
          source,
        },
        { onConflict: 'email' }
      );

    if (extendedUpsert.error) {
      const message = String(extendedUpsert.error.message || '').toLowerCase();
      const missingColumn =
        (message.includes('column') && message.includes('does not exist')) ||
        (message.includes('could not find') && message.includes('schema cache'));

      if (!missingColumn) {
        throw new Error(extendedUpsert.error.message || 'No se pudo registrar en la waitlist');
      }

      const fallbackUpsert = await supabaseService
        .from('retroville_waitlist')
        .upsert({ email }, { onConflict: 'email' });

      if (fallbackUpsert.error) {
        throw new Error(fallbackUpsert.error.message || 'No se pudo registrar en la waitlist');
      }
    }

    return Response.json({ success: true, data: { email, role_label: roleLabel, source } });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar' }, { status: 500 });
  }
}
