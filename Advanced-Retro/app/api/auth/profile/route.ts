import { supabaseServer } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/profile
 * Obtiene el perfil del usuario autenticado
 */
export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener perfil completo de la tabla users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        profile,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 * Actualiza el perfil del usuario autenticado
 */
export async function PUT(req: Request) {
  try {
    const supabase = supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, ...updateData } = await req.json();

    // Solo permitir actualizar ciertos campos
    const allowed = ['name', 'avatar_url'];
    const safeData = Object.keys(updateData)
      .filter((k) => allowed.includes(k))
      .reduce((obj, k) => ({ ...obj, [k]: updateData[k] }), {});

    // Actualizar en la tabla users
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(safeData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
