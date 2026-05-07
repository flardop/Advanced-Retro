import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudo eliminar la cuenta' }, { status: 500 });
}

export async function DELETE(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { user } = await requireUserContext();
    const body = await req.json().catch(() => null);
    const confirmation = String(body?.confirmation || '').trim();

    if (confirmation !== 'ELIMINAR') {
      return NextResponse.json({ error: 'Debes escribir ELIMINAR para confirmar' }, { status: 400 });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message || 'No se pudo eliminar tu cuenta de acceso' }, { status: 500 });
    }

    await supabaseAdmin.from('users').delete().eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleError(error);
  }
}
