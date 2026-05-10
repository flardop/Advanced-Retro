import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkAdminSession } from '@/lib/admin/checkAdminSession';

export const dynamic = 'force-dynamic';

const requireAdmin = async () => {
  await checkAdminSession();
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const { error } = await supabaseAdmin.from('products').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
