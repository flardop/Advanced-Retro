import { NextRequest } from 'next/server';
import { supabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return Response.json({ success: false, error: 'Supabase service role no configurado' }, { status: 503 });
    }
    const payload = await request.json();
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return Response.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }
    await supabaseService.from('store_creator_leads').upsert(
      {
        name: typeof payload.name === 'string' ? payload.name : null,
        email,
        business_type: typeof payload.business_type === 'string' ? payload.business_type : null,
        plan_interest: typeof payload.plan_interest === 'string' ? payload.plan_interest : null,
      },
      { onConflict: 'email' }
    );
    return Response.json({ success: true, data: { email } });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar' }, { status: 500 });
  }
}
